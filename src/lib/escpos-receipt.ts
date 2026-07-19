/**
 * ESC/POS Receipt encoder — ReceiptData → raw bytes utk 58mm thermal printer.
 * 58mm = 32 kolom (font A 12×24). Tiap baris di-pad/trim ke 32 karakter.
 */
import type { Receipt58mmData as ReceiptData, Receipt58mmStore as ReceiptStore } from "@/components/receipt";

const ESC = 0x1b;
const GS = 0x1d;
const W = 32;

function txt(s: string): Uint8Array {
  return new TextEncoder().encode(s + "\n");
}
function esc(...b: number[]): Uint8Array {
  return Uint8Array.from(b);
}
function init(): Uint8Array { return esc(ESC, 0x40); }
function align(n: number): Uint8Array { return esc(ESC, 0x61, n); }
function bold(n: number): Uint8Array { return esc(ESC, 0x45, n); }
function feed(n: number): Uint8Array { return esc(ESC, 0x64, n); }
function cut(): Uint8Array { return esc(GS, 0x56, 0x00); }

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

/** Pad kanan ke W kolom (truncate klo overflow) */
function pad(s: string): string {
  return s.length >= W ? s.slice(0, W) : s + " ".repeat(W - s.length);
}

/** Dua kolom: label kiri, angka kanan, total W */
function twoCol(label: string, value: string): string {
  const avail = W - value.length - 1;
  if (avail <= 0) return value.slice(0, W);
  const l = label.length > avail ? label.slice(0, avail) : label;
  return l + " ".repeat(W - l.length - value.length) + value;
}

/** Garis separator */
function rule(ch = "="): Uint8Array {
  return txt(ch.repeat(W));
}

// ── Header ────────────────────────────────────────────

function headerBlock(store: ReceiptStore): Uint8Array[] {
  const lines: Uint8Array[] = [];
  lines.push(align(1));
  lines.push(bold(1));
  lines.push(txt(store.storeName));
  lines.push(bold(0));
  if (store.address) lines.push(txt(store.address));
  if (store.phone) lines.push(txt("Telp: " + store.phone));
  lines.push(txt(""));
  return lines;
}

// ── Info ──────────────────────────────────────────────

function infoBlock(data: ReceiptData): Uint8Array[] {
  const lines: Uint8Array[] = [];
  lines.push(align(0));
  const d = new Date(data.transactionDate);
  const ds =
    d.toLocaleDateString("id-ID") +
    " " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  lines.push(txt(pad("Date: " + ds)));
  lines.push(txt(pad("Order: " + data.orderNumber)));
  if (data.cashierName) lines.push(txt(pad("Cashier: " + data.cashierName)));
  if (data.customerName) {
    let s = "Customer: " + data.customerName;
    if (data.tableNumber) s += " (Table " + data.tableNumber + ")";
    lines.push(txt(pad(s)));
  }
  const tl: Record<string, string> = {
    DINE_IN: "Dine In",
    TAKE_AWAY: "Take Away",
  };
  lines.push(txt(pad("Type: " + (tl[data.type] ?? data.type))));
  return lines;
}

// ── Items ─────────────────────────────────────────────

function itemsBlock(data: ReceiptData): Uint8Array[] {
  const lines: Uint8Array[] = [];
  lines.push(rule("="));
  lines.push(txt(twoCol(" Item", "Total")));
  lines.push(rule("="));

  for (const item of data.items) {
    // Nama barang (max 22 chars — sisanya "..")
    const name =
      item.name.length > 22 ? item.name.slice(0, 22) + ".." : item.name;
    lines.push(txt(pad(name)));
    // Sub-line: qty × harga  →  subtotal
    const qtyLine =
      "  " + item.quantity + " x " + fmt(item.price);
    lines.push(txt(twoCol(qtyLine, fmt(item.price * item.quantity))));
  }
  return lines;
}

// ── Note (setelah items, sebelum total) ───────────────

function noteBlock(data: ReceiptData): Uint8Array[] {
  if (!data.note) return [];
  const lines: Uint8Array[] = [];
  lines.push(rule("-"));
  lines.push(txt(pad("Note: " + data.note)));
  return lines;
}

// ── Total ─────────────────────────────────────────────

function totalBlock(data: ReceiptData): Uint8Array[] {
  const lines: Uint8Array[] = [];
  lines.push(align(0));
  lines.push(rule("="));
  lines.push(txt(twoCol("Subtotal", fmt(data.subtotal))));
  if (data.discount > 0)
    lines.push(txt(twoCol("Discount", "-" + fmt(data.discount))));
  if (data.tax > 0) lines.push(txt(twoCol("PB1", fmt(data.tax))));
  lines.push(rule("-"));
  lines.push(bold(1));
  lines.push(txt(twoCol("TOTAL", fmt(data.total))));
  lines.push(bold(0));
  lines.push(rule("-"));

  const pl: Record<string, string> = {
    CASH: "Cash",
    CARD: "Kartu",
    QRIS: "QRIS",
  };
  lines.push(txt(twoCol("Paid", fmt(data.paidAmount))));
  if (data.changeAmount > 0)
    lines.push(txt(twoCol("Change", fmt(data.changeAmount))));
  lines.push(txt(""));
  lines.push(txt(twoCol("Payment", pl[data.paymentMethod] ?? data.paymentMethod)));
  return lines;
}

// ── Footer ────────────────────────────────────────────

function footerBlock(store: ReceiptStore): Uint8Array[] {
  const lines: Uint8Array[] = [];
  lines.push(align(1));
  lines.push(txt(""));
  lines.push(txt(store.receiptFooter ?? "Terima Kasih"));
  lines.push(txt(""));
  return lines;
}

// ── Public API ────────────────────────────────────────

export function buildReceipt(
  data: ReceiptData,
  store: ReceiptStore,
): Uint8Array {
  const blocks = [
    init(),
    ...headerBlock(store),
    ...infoBlock(data),
    ...itemsBlock(data),
    ...noteBlock(data),
    ...totalBlock(data),
    ...footerBlock(store),
    feed(3),
    cut(),
  ];

  const totalLen = blocks.reduce((s, b) => s + b.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const b of blocks) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}
