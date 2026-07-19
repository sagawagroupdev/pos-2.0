/**
 * BLE Thermal Printer — Web Bluetooth + ESC/POS
 *
 * Mencoba service UUID thermal printer yang umum:
 *   0x18F0, 0xFF00
 * Kalau gagal, fallback ke service pertama yang punya write characteristic.
 */

export type PrinterStatus = {
  connected: boolean;
  deviceName: string | null;
};

export type PrinterConnection = {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  writeChar: BluetoothRemoteGATTCharacteristic;
};

/** ESC/POS command bytes */
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function text(s: string): Uint8Array {
  return new TextEncoder().encode(s + "\n");
}

function esc(...args: number[]): Uint8Array {
  return Uint8Array.from(args);
}

/** Cari karakteristik write dari service BLE */
export async function findWriteCharacteristic(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  const SERVICE_UIDS = [
    0x18f0, 0xff00, 0xabf0, 0x1820, 0xfff0,
  ];

  for (const uuid of SERVICE_UIDS) {
    try {
      const svc = await server.getPrimaryService(uuid);
      const chars = await svc.getCharacteristics();
      const write = chars.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse
      );
      if (write) return write;
    } catch {
      continue;
    }
  }

  // Fallback: iter semua service
  try {
    const svcs = await server.getPrimaryServices();
    for (const svc of svcs) {
      const chars = await svc.getCharacteristics();
      const write = chars.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse
      );
      if (write) return write;
    }
  } catch {
    // noop
  }

  return null;
}

/** Connect ke BLE printer. Butuh user gesture (click). */
export async function connectPrinter(): Promise<{
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  writeChar: BluetoothRemoteGATTCharacteristic;
}> {
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0x18f0, 0xff00, 0xabf0, 0x1820, 0xfff0],
  });

  const server = await device.gatt!.connect();
  const writeChar = await findWriteCharacteristic(server);

  if (!writeChar) {
    await server.disconnect();
    throw new Error("Gak nemu karakteristik write di printer ini");
  }

  return { device, server, writeChar };
}

/** Reconnect ke device yang sebelumnya sudah diizinkan browser. */
export async function reconnectSavedPrinter(
  getDevices: () => Promise<BluetoothDevice[]>,
  deviceId: string
): Promise<PrinterConnection | null> {
  const device = (await getDevices()).find((candidate) => candidate.id === deviceId);
  if (!device?.gatt) return null;

  const server = await device.gatt.connect();
  const writeChar = await findWriteCharacteristic(server);
  if (!writeChar) {
    await server.disconnect();
    return null;
  }

  return { device, server, writeChar };
}

/** Jeda retry BLE yang meningkat, lalu dibatasi agar tetap responsif. */
export function getReconnectDelay(attempt: number): number {
  const normalizedAttempt = Math.max(0, attempt);
  return Math.min(15_000, 1_000 * 2 ** normalizedAttempt);
}

/** Kirim raw bytes ke printer via BLE characteristic */
export async function printEscPos(
  writeChar: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array
): Promise<void> {
  const MTU = 100; // kebanyakan BLE thermal printer punya MTU kecil
  for (let i = 0; i < data.length; i += MTU) {
    const chunk = data.slice(i, i + MTU);
    await writeChar.writeValue(chunk);
    // jeda biar printer gak kewalahan
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** Connect lalu langsung cetak memakai karakteristik dari koneksi yang sama. */
export async function printAfterConnect(
  connect: () => Promise<BluetoothRemoteGATTCharacteristic | null>,
  data: Uint8Array
): Promise<boolean> {
  const writeChar = await connect();
  if (!writeChar) return false;

  await printEscPos(writeChar, data);
  return true;
}

/** Generate ESC/POS test page bytes untuk 58mm */
export function buildTestPage(): Uint8Array {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts: Uint8Array[] = [
    // Init printer
    esc(ESC, 0x40),
    // Center alignment
    esc(ESC, 0x61, 0x01),
    text("================================"),
    // Bold on
    esc(ESC, 0x45, 0x01),
    text("        TEST PRINT OK!        "),
    // Bold off
    esc(ESC, 0x45, 0x00),
    text("================================"),
    text(""),
    // Left alignment
    esc(ESC, 0x61, 0x00),
    text("Printer: BLE Thermal 58mm"),
    text("Tanggal: " + dateStr),
    text("Jam: " + timeStr),
    text("--------------------------------"),
    // Center
    esc(ESC, 0x61, 0x01),
    text("--- Formatting Test ---"),
    // Bold
    esc(ESC, 0x45, 0x01),
    text("BOLD TEXT"),
    esc(ESC, 0x45, 0x00),
    text("normal text"),
    text(""),
    // Left
    esc(ESC, 0x61, 0x00),
    text("Jika tulisan ini terbaca jelas,"),
    text("printer berfungsi normal."),
    text("ESC/POS protocol OK!"),
    text(""),
    // Center
    esc(ESC, 0x61, 0x01),
    text("================================"),
    text("Sagawa POS"),
    text("================================"),
    // Feed + paper cut
    esc(GS, 0x56, 0x00),
  ];

  // Gabung
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}
