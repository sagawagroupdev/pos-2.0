"use client";

import { forwardRef } from "react";

export type ReceiptData = {
  id: string;
  orderNumber: string;
  transactionDate: string;
  cashierName: string | null;
  customerName: string | null;
  tableNumber: string | null;
  type: "DINE_IN" | "TAKE_AWAY";
  paymentMethod: "CASH" | "CARD" | "QRIS";
  note: string | null;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
};

export type ReceiptStore = {
  storeName: string;
  address: string | null;
  phone: string | null;
  receiptFooter: string | null;
};

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

const typeLabel = { DINE_IN: "Dine In", TAKE_AWAY: "Take Away" };
const payLabel = { CASH: "Tunai", CARD: "Kartu", QRIS: "QRIS" };

export const Receipt = forwardRef<
  HTMLDivElement,
  { data: ReceiptData; store: ReceiptStore }
>(function Receipt({ data, store }, ref) {
  const date = new Date(data.transactionDate);
  const dateStr = `${date.toLocaleDateString("id-ID")} ${date.toLocaleTimeString(
    "id-ID",
    { hour: "2-digit", minute: "2-digit" }
  )}`;

  return (
    <div ref={ref} className="receipt">
      <div className="center bold">{store.storeName}</div>
      {store.address && <div className="center">{store.address}</div>}
      {store.phone && <div className="center">No. Telp: {store.phone}</div>}
      <div className="sep">================================</div>
      <div>Tgl: {dateStr}</div>
      <div>ID : {data.orderNumber}</div>
      {data.cashierName && <div>Kasir: {data.cashierName}</div>}
      {data.customerName && (
        <div>
          Pelanggan: {data.customerName}
          {data.tableNumber ? ` (Meja ${data.tableNumber})` : ""}
        </div>
      )}
      <div>Tipe: {typeLabel[data.type]}</div>
      {data.note && <div>Catatan: {data.note}</div>}
      <div className="dash">--------------------------------</div>
      <div className="row">
        <span>Item</span>
        <span>Total</span>
      </div>
      <div className="dash">--------------------------------</div>
      {data.items.map((item, i) => (
        <div key={i} className="item">
          <div>{item.name}</div>
          <div className="row">
            <span>
              {item.quantity} x {fmt(item.price)}
            </span>
            <span>{fmt(item.price * item.quantity)}</span>
          </div>
        </div>
      ))}
      <div className="dash">--------------------------------</div>
      <div className="row">
        <span>Subtotal</span>
        <span>{fmt(data.subtotal)}</span>
      </div>
      {data.discount > 0 && (
        <div className="row">
          <span>Diskon</span>
          <span>-{fmt(data.discount)}</span>
        </div>
      )}
      {data.tax > 0 && (
        <div className="row">
          <span>Pajak</span>
          <span>{fmt(data.tax)}</span>
        </div>
      )}
      <div className="row bold">
        <span>TOTAL</span>
        <span>{fmt(data.total)}</span>
      </div>
      <div className="dash">--------------------------------</div>
      <div className="row">
        <span>Bayar</span>
        <span>{fmt(data.paidAmount)}</span>
      </div>
      <div className="row">
        <span>Kembali</span>
        <span>{fmt(data.changeAmount)}</span>
      </div>
      <div className="dash">--------------------------------</div>
      <div>Metode Bayar: {payLabel[data.paymentMethod]}</div>
      <div className="center" style={{ marginTop: "8px" }}>
        {store.receiptFooter ?? "Terima Kasih"}
      </div>
      <div className="sep">================================</div>

      <style jsx>{`
        .receipt {
          width: 100%;
          font-family: "Courier New", monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: bold;
        }
        .row {
          display: flex;
          justify-content: space-between;
        }
        .item {
          margin: 2px 0;
        }
        .sep,
        .dash {
          white-space: nowrap;
          overflow: hidden;
        }
        @media print {
          .receipt {
            width: 48mm;
          }
        }
      `}</style>
    </div>
  );
});
