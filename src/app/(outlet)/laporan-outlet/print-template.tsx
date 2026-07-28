"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { rupiah, formatInTz } from "@/lib/format";
import type { OutletReportData } from "@/lib/reports";

type OutletInfo = {
  name: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
  pic: string | null;
};

type PrintTemplateProps = {
  outletInfo: OutletInfo;
  data: OutletReportData;
  from: string;
  to: string;
  cashRevenue: number;
};

const C = {
  black: "#000000",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
} as const;

const BASE: React.CSSProperties = {
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: 10,
  color: C.black,
  backgroundColor: C.white,
  lineHeight: 1.4,
};

const fmtDate = (iso: string) =>
  formatInTz(iso, { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const fmtPeriod = (dateStr: string) =>
  formatInTz(`${dateStr}T00:00:00+07:00`, { day: "numeric", month: "short", year: "numeric" });

export const PrintTemplate = forwardRef<HTMLDivElement, PrintTemplateProps>(
  function PrintTemplate({ outletInfo, data, from, to, cashRevenue }, ref) {
    const printDate = formatInTz(new Date(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const tdBase: React.CSSProperties = {
      border: `1px solid ${C.gray300}`,
      padding: "2px 6px",
      color: C.black,
      backgroundColor: C.white,
    };

    return (
      <div
        id="print-laporan"
        ref={ref}
        style={{ ...BASE, display: "none", padding: 32, width: "100%", boxSizing: "border-box" }}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${C.black}`, paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {outletInfo.logo && (
              <Image
                src={outletInfo.logo}
                alt="Logo"
                width={56}
                height={56}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            )}
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{outletInfo.name}</p>
              {outletInfo.address && <p style={{ fontSize: 11, color: C.gray600, margin: "2px 0 0" }}>{outletInfo.address}</p>}
              {outletInfo.phone && <p style={{ fontSize: 11, color: C.gray600, margin: "1px 0 0" }}>Telp: {outletInfo.phone}</p>}
              {outletInfo.pic && <p style={{ fontSize: 11, color: C.gray600, margin: "1px 0 0" }}>PIC: {outletInfo.pic}</p>}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: C.gray600 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.black, margin: 0 }}>Laporan Penjualan</p>
            <p style={{ margin: "3px 0 0" }}>Periode: {fmtPeriod(from)} – {fmtPeriod(to)}</p>
            <p style={{ margin: "2px 0 0" }}>Dicetak: {printDate}</p>
          </div>
        </div>

        {/* ── Summary Box ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Total Omset", value: rupiah(data.totalRevenue) },
            { label: "Rata-rata Transaksi", value: rupiah(data.avgTransaction) },
            { label: "Omset Cash", value: rupiah(cashRevenue) },
            { label: "Omset QRIS", value: rupiah(data.qrisRevenue) },
          ].map((s) => (
            <div key={s.label} style={{ border: `1px solid ${C.gray300}`, borderRadius: 4, padding: "6px 8px", backgroundColor: C.white }}>
              <p style={{ fontSize: 9, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: 12, fontWeight: 700, margin: "3px 0 0", color: C.black }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Transaction Table ── */}
        <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
          Daftar Transaksi ({data.totalTransactions} transaksi)
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ backgroundColor: C.gray100 }}>
              {["No", "Tanggal", "ID Transaksi", "Kasir", "Customer", "Metode", "Item Order", "Subtotal", "Total"].map((h) => (
                <th
                  key={h}
                  style={{ ...tdBase, backgroundColor: C.gray100, fontWeight: 600, whiteSpace: "nowrap", textAlign: "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.transactions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...tdBase, textAlign: "center", color: C.gray400, padding: "8px 6px" }}>
                  Tidak ada transaksi
                </td>
              </tr>
            ) : (
              data.transactions.map((t, i) => {
                const rowBg = i % 2 === 0 ? C.white : C.gray50;
                const td = { ...tdBase, backgroundColor: rowBg };
                return (
                  <tr key={t.id}>
                    <td style={{ ...td, color: C.gray500 }}>{i + 1}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtDate(t.date)}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{t.orderNumber}</td>
                    <td style={td}>{t.cashierName}</td>
                    <td style={td}>{t.customerName ?? "—"}</td>
                    <td style={td}>{t.paymentMethod}</td>
                    <td style={{ ...td, wordBreak: "break-word", maxWidth: 160 }}>{t.items}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>{rupiah(t.subtotal)}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{rupiah(t.total)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {data.transactions.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: C.gray100, fontWeight: 600 }}>
                <td colSpan={7} style={{ ...tdBase, backgroundColor: C.gray100, textAlign: "right" }}>Total</td>
                <td style={{ ...tdBase, backgroundColor: C.gray100, textAlign: "right", whiteSpace: "nowrap" }}>
                  {rupiah(data.transactions.reduce((s, t) => s + t.subtotal, 0))}
                </td>
                <td style={{ ...tdBase, backgroundColor: C.gray100, textAlign: "right", whiteSpace: "nowrap" }}>
                  {rupiah(data.totalRevenue)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }
);
