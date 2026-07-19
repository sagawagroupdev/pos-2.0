import assert from "node:assert/strict";
import test from "node:test";
import * as printer from "../src/lib/ble-printer";

type PrintAfterConnect = (
  connect: () => Promise<BluetoothRemoteGATTCharacteristic | null>,
  data: Uint8Array
) => Promise<boolean>;

type ReconnectSavedPrinter = (
  getDevices: () => Promise<BluetoothDevice[]>,
  deviceId: string
) => Promise<{
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  writeChar: BluetoothRemoteGATTCharacteristic;
} | null>;

type GetReconnectDelay = (attempt: number) => number;

test("prints a receipt through the characteristic returned by a fresh connection", async () => {
  const printAfterConnect = (
    printer as typeof printer & { printAfterConnect?: PrintAfterConnect }
  ).printAfterConnect;

  assert.equal(
    typeof printAfterConnect,
    "function",
    "a fresh connection must be printable before React state re-renders"
  );

  const writes: number[][] = [];
  const characteristic = {
    writeValue: async (chunk: BufferSource) => {
      writes.push([...new Uint8Array(chunk as ArrayBuffer)]);
    },
  } as BluetoothRemoteGATTCharacteristic;

  const printed = await printAfterConnect(
    async () => characteristic,
    new Uint8Array([0x1b, 0x40])
  );

  assert.equal(printed, true);
  assert.deepEqual(writes, [[0x1b, 0x40]]);
});

test("does not try to print when the connect dialog is cancelled", async () => {
  const printAfterConnect = (
    printer as typeof printer & { printAfterConnect?: PrintAfterConnect }
  ).printAfterConnect;

  assert.equal(typeof printAfterConnect, "function");

  const printed = await printAfterConnect(
    async () => null,
    new Uint8Array([0x1b, 0x40])
  );

  assert.equal(printed, false);
});

test("reconnects the printer that was authorized before a browser refresh", async () => {
  const reconnectSavedPrinter = (
    printer as typeof printer & { reconnectSavedPrinter?: ReconnectSavedPrinter }
  ).reconnectSavedPrinter;

  assert.equal(
    typeof reconnectSavedPrinter,
    "function",
    "the saved browser permission must restore the same printer after refresh"
  );

  const writeChar = {
    properties: { write: true, writeWithoutResponse: false },
  } as BluetoothRemoteGATTCharacteristic;
  const service = {
    getCharacteristics: async () => [writeChar],
  } as BluetoothRemoteGATTService;
  const server = {
    getPrimaryService: async () => service,
  } as unknown as BluetoothRemoteGATTServer;
  let connectCalls = 0;
  const savedDevice = {
    id: "printer-123",
    gatt: {
      connect: async () => {
        connectCalls += 1;
        return server;
      },
    },
  } as BluetoothDevice;

  const restored = await reconnectSavedPrinter(
    async () => [savedDevice],
    "printer-123"
  );

  assert.equal(restored?.device, savedDevice);
  assert.equal(restored?.writeChar, writeChar);
  assert.equal(connectCalls, 1);
});

test("does not connect a different authorized printer", async () => {
  const reconnectSavedPrinter = (
    printer as typeof printer & { reconnectSavedPrinter?: ReconnectSavedPrinter }
  ).reconnectSavedPrinter;

  assert.equal(typeof reconnectSavedPrinter, "function");

  const restored = await reconnectSavedPrinter(async () => [], "printer-123");

  assert.equal(restored, null);
});

test("backs off reconnect attempts without waiting indefinitely", () => {
  const getReconnectDelay = (
    printer as typeof printer & { getReconnectDelay?: GetReconnectDelay }
  ).getReconnectDelay;

  assert.equal(
    typeof getReconnectDelay,
    "function",
    "temporary BLE disconnects must retry with a bounded backoff"
  );

  assert.deepEqual(
    [0, 1, 2, 3, 4, 20].map((attempt) => getReconnectDelay(attempt)),
    [1_000, 2_000, 4_000, 8_000, 15_000, 15_000]
  );
});
