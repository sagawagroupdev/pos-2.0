"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  connectPrinter,
  printEscPos,
  printAfterConnect,
  reconnectSavedPrinter,
  getReconnectDelay,
} from "@/lib/ble-printer";

type WriteChar = BluetoothRemoteGATTCharacteristic;

type PrinterCtx = {
  device: BluetoothDevice | null;
  writeChar: WriteChar | null;
  connected: boolean;
  deviceName: string | null;
  connect: () => Promise<WriteChar | null>;
  connectAndPrint: (data: Uint8Array) => Promise<boolean>;
  disconnect: () => void;
  print: (data: Uint8Array) => Promise<void>;
  lastDeviceName: string | null;
};

const PrinterContext = createContext<PrinterCtx>(null!);

// Module-level cache biar gak ilang pas React remount / route change
let cachedDevice: BluetoothDevice | null = null;
let cachedWriteChar: WriteChar | null = null;
const PRINTER_ID_STORAGE_KEY = "ble_printer_id";
const PRINTER_NAME_STORAGE_KEY = "ble_printer_name";

function setupDisconnectHandler(d: BluetoothDevice, onDisconnected: () => void) {
  d.addEventListener("gattserverdisconnected", () => onDisconnected(), { once: true });
}

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<BluetoothDevice | null>(cachedDevice);
  const [writeChar, setWriteChar] = useState<WriteChar | null>(cachedWriteChar);
  const [lastDeviceName, setLastDeviceName] = useState<string | null>(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(PRINTER_NAME_STORAGE_KEY)
        : null
  );
  const deviceRef = useRef<BluetoothDevice | null>(cachedDevice);
  const writeCharRef = useRef<WriteChar | null>(cachedWriteChar);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectInFlightRef = useRef(false);
  const autoReconnectEnabledRef = useRef(true);
  const reconnectRef = useRef<() => Promise<void>>(async () => {});

  const connected = !!device?.gatt?.connected && !!writeChar;

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearConnection = useCallback(() => {
    cachedDevice = null;
    cachedWriteChar = null;
    setDevice(null);
    setWriteChar(null);
    deviceRef.current = null;
    writeCharRef.current = null;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (
      !autoReconnectEnabledRef.current ||
      reconnectTimerRef.current ||
      reconnectInFlightRef.current
    ) {
      return;
    }

    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      void reconnectRef.current();
    }, delay);
  }, []);

  const handleUnexpectedDisconnect = useCallback(() => {
    clearConnection();
    scheduleReconnect();
  }, [clearConnection, scheduleReconnect]);

  const reconnect = useCallback(async () => {
    if (!autoReconnectEnabledRef.current || reconnectInFlightRef.current) return;

    const rememberedDevice = cachedDevice;
    const cachedConnectionIsActive =
      !!rememberedDevice?.gatt?.connected && !!cachedWriteChar;
    if (cachedConnectionIsActive) return;

    const savedDeviceId =
      rememberedDevice?.id ?? localStorage.getItem(PRINTER_ID_STORAGE_KEY);
    if (!savedDeviceId) return;

    if (!rememberedDevice && typeof navigator.bluetooth?.getDevices !== "function") {
      return;
    }

    reconnectInFlightRef.current = true;
    let shouldRetry = false;

    try {
      const connection = await reconnectSavedPrinter(
        rememberedDevice
          ? async () => [rememberedDevice]
          : () => navigator.bluetooth.getDevices(),
        savedDeviceId
      );
      if (!connection) return;

      if (!autoReconnectEnabledRef.current) {
        await connection.server.disconnect();
        return;
      }

      const { device: d, writeChar: wc } = connection;
      cachedDevice = d;
      cachedWriteChar = wc;
      deviceRef.current = d;
      writeCharRef.current = wc;
      setDevice(d);
      setWriteChar(wc);
      setLastDeviceName(d.name ?? "Printer BLE");
      reconnectAttemptsRef.current = 0;
      toast.success("Printer tersambung kembali");
      setupDisconnectHandler(d, handleUnexpectedDisconnect);
    } catch {
      clearConnection();
      shouldRetry = true;
    } finally {
      reconnectInFlightRef.current = false;
      if (shouldRetry) scheduleReconnect();
    }
  }, [clearConnection, handleUnexpectedDisconnect, scheduleReconnect]);

  useEffect(() => {
    reconnectRef.current = reconnect;
  }, [reconnect]);

  useEffect(() => {
    autoReconnectEnabledRef.current = true;
    void reconnect();
    return clearReconnectTimer;
  }, [clearReconnectTimer, reconnect]);

  const connect = useCallback(async (): Promise<WriteChar | null> => {
    clearReconnectTimer();
    reconnectAttemptsRef.current = 0;
    autoReconnectEnabledRef.current = true;

    try {
      const { device: d, writeChar: w } = await connectPrinter();
      cachedDevice = d;
      cachedWriteChar = w;
      deviceRef.current = d;
      setDevice(d);
      setWriteChar(w);
      writeCharRef.current = w;
      const name = d.name ?? "Printer BLE";
      setLastDeviceName(name);
      localStorage.setItem(PRINTER_ID_STORAGE_KEY, d.id);
      localStorage.setItem(PRINTER_NAME_STORAGE_KEY, name);
      setupDisconnectHandler(d, handleUnexpectedDisconnect);
      toast.success("Terhubung ke " + name);
      return w;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotFoundError") return null;
      toast.error(err instanceof Error ? err.message : "Gagal konek printer");
      return null;
    }
  }, [clearReconnectTimer, handleUnexpectedDisconnect]);

  const disconnect = useCallback(() => {
    autoReconnectEnabledRef.current = false;
    clearReconnectTimer();
    reconnectAttemptsRef.current = 0;
    deviceRef.current?.gatt?.disconnect();
    localStorage.removeItem(PRINTER_ID_STORAGE_KEY);
    localStorage.removeItem(PRINTER_NAME_STORAGE_KEY);
    setLastDeviceName(null);
    clearConnection();
  }, [clearConnection, clearReconnectTimer]);

  const print = useCallback(
    async (data: Uint8Array) => {
      const currentWriteChar = writeCharRef.current;
      if (!currentWriteChar) throw new Error("Printer belum terhubung");
      await printEscPos(currentWriteChar, data);
    },
    []
  );

  const connectAndPrint = useCallback(
    (data: Uint8Array) => printAfterConnect(connect, data),
    [connect]
  );

  return (
    <PrinterContext.Provider
      value={{
        device,
        writeChar,
        connected,
        deviceName: device?.name ?? null,
        connect,
        connectAndPrint,
        disconnect,
        print,
        lastDeviceName,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  return useContext(PrinterContext);
}
