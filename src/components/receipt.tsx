"use client";

import { forwardRef } from "react";

/* Types  */

export type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
  /** Per-item note / add-on annotation (rendered smaller below name). */
  itemNote?: string | null;
};

export type Receipt58mmData = {
  id: string;
  orderNumber: string;
  transactionDate: string;
  cashierName: string | null;
  customerName: string | null;
  tableNumber: string | null;
  type: "DINE_IN" | "TAKE_AWAY";
  paymentMethod: "CASH" | "CARD" | "QRIS";
  note: string | null;
  items: ReceiptItem[];

  subtotal: number;
  discount: number;
  tax: number;
  /** Optional” defaults to 0. */
  serviceCharge?: number;
  /** Optional” defaults to 0. */
  additionalFee?: number;
  total: number;

  paidAmount: number;
  changeAmount: number;
};

export type Receipt58mmStore = {
  storeName: string;
  address: string | null;
  phone: string | null;
  /** Shown in the footer. Defaults to "Terima Kasih". */
  receiptFooter?: string | null;
};

export type Receipt58mmConfig = {
  /** Whether the component headers are shown (e.g. "Outlet", "Pesanan"). */
  showHeaders?: boolean;
};

export type Receipt58mmProps = {
  data: Receipt58mmData;
  store: Receipt58mmStore;
  config?: Receipt58mmConfig;
};


const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

const typeLabel = { DINE_IN: "Dine In", TAKE_AWAY: "Take Away" } as const;
const payLabel = {
  CASH: "Cash",
  CARD: "Card",
  QRIS: "QRIS",
} as const;


export const Receipt58mm = forwardRef<HTMLDivElement, Receipt58mmProps>(
  function Receipt58mm({ data, store, config }, ref) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const showHeaders = config?.showHeaders ?? false;

    const date = new Date(data.transactionDate);
    const dateStr = `${date.toLocaleDateString("id-ID")} ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

    const sc = data.serviceCharge ?? 0;
    const extra = data.additionalFee ?? 0;

    const isCash = data.paymentMethod === "CASH";

    return (
      <div ref={ref} className="receipt-58mm">
        {/*   1. Header Outlet   */}
        <div className="center bold">{store.storeName}</div>
        {store.address && <div className="center">{store.address}</div>}
        {store.phone && <div className="center">{store.phone}</div>}

        <div className="gap-4" />

        {/* 2. Info Transaksi*/}
        <div className="info">
          <div>ID  : {data.orderNumber}</div>
          <div>Date : {dateStr}</div>
          {data.cashierName && <div>Cashier  : {data.cashierName}</div>}
          {data.customerName && <div>Customer : {data.customerName}</div>}
          {data.tableNumber && <div>Table : {data.tableNumber}</div>}
          <div>Type: {typeLabel[data.type]}</div>
        </div>

        {/* 3. Daftar Pesanan */}
        <div className="dashed" />
        <div className="row bold">
          <span>Item</span>
          <span>Total</span>
        </div>
        <div className="dashed" />

        {data.items.map((item, i) => (
          <div key={i}>
            <div className="item-name">
              {item.name}
              {item.itemNote && <span className="item-note"> ({item.itemNote})</span>}
            </div>
            <div className="row">
              <span className="qty-label">
                {item.quantity}x {fmt(item.price)}
              </span>
              <span>{fmt(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}

        {/* 4. Catatan */}
        <div className="dashed" />
        <div className="bold">Notes:</div>
        {data.note ? (
          <div className="note-content">{data.note}</div>
        ) : null}

        {/*  5. Ringkasan Pembayaran  */}
        <div className="dashed" />
        <div className="row">
          <span>Subtotal</span>
          <span>{fmt(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="row">
            <span>Discount</span>
            <span>-{fmt(data.discount)}</span>
          </div>
        )}
        {data.tax > 0 && (
          <div className="row">
            <span>PB1</span>
            <span>{fmt(data.tax)}</span>
          </div>
        )}
        {sc > 0 && (
          <div className="row">
            <span>Service Charge</span>
            <span>{fmt(sc)}</span>
          </div>
        )}
        {extra > 0 && (
          <div className="row">
            <span>Additional Fee</span>
            <span>{fmt(extra)}</span>
          </div>
        )}
        <div className="dashed" />
        <div className="row total">
          <span>Total</span>
          <span>{fmt(data.total)}</span>
        </div>
        <div className="dashed" />

        {/*  7. Informasi Pembayaran */}
        <div className="row">
          <span>Paid</span>
          <span>{fmt(data.paidAmount)}</span>
        </div>
        <div className="row">
          <span>Payment</span>
          <span>{payLabel[data.paymentMethod]}</span>
        </div>
        {isCash && (
          <div className="row">
            <span>Change</span>
            <span>{fmt(data.changeAmount)}</span>
          </div>
        )}

        {/*   8. Footer   */}
        <div className="center footer">
          {store.receiptFooter ?? "Thank You"}
        </div>

        {/* Spacer agar tidak terpotong saat cetak */}
        <div className="print-spacer" />

        <style jsx>{`
          .receipt-58mm {
            width: 100%;
            max-width: 58mm;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            box-sizing: border-box;
            padding: 0;
            margin: 0;
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
          .total {
            font-weight: bold;
            font-size: 13px;
          }
          .total span {
            font-weight: bold;
          }
          .dashed {
            border-top: 1px dashed #000;
            margin: 2px 0;
          }
          .info {
            margin: 4px 0;
          }
          .info > div {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .item-name {
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .item-note {
            font-size: 9px;
            color: #333;
            margin-left: 4px;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .qty-label {
            color: #333;
          }
          .note-content {
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: break-word;
            margin-top: 1px;
          }
          .footer {
            margin-top: 8px;
            font-weight: bold;
          }
          .gap-4 {
            height: 4px;
          }
          .print-spacer {
            height: 12mm;
          }
          @media print {
            .receipt-58mm {
              width: 48mm;
              padding: 0;
              margin: 0 auto;
            }
            .print-spacer {
              height: 8mm;
            }
          }
        `}</style>
      </div>
    );
  }
);

/* ─── Legacy aliases (backward compat) ──────────────────────────────── */
/** @deprecated Use Receipt58mmData */
export type ReceiptData = Receipt58mmData;
/** @deprecated Use Receipt58mmStore */
export type ReceiptStore = Receipt58mmStore;
/** @deprecated Use Receipt58mm */
export const Receipt = Receipt58mm;