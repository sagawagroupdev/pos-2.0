"use client";

import { useState, useTransition } from "react";
import { gooeyToast } from "gooey-toast";
import { loadReport, type ReportResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rupiah } from "@/lib/format";

type CashierPerf = ReportResult["cashiers"];
type TxRows = ReportResult["transactions"];

function downloadCsv(filename: string, rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LaporanView({
  initialCashiers,
  initialTransactions,
  defaultFrom,
  defaultTo,
}: {
  initialCashiers: CashierPerf;
  initialTransactions: TxRows;
  defaultFrom: string;
  defaultTo: string;
}) {
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [cashiers, setCashiers] = useState(initialCashiers);
  const [transactions, setTransactions] = useState(initialTransactions);

  function applyRange() {
    startTransition(async () => {
      try {
        const res = await loadReport(from, to);
        setCashiers(res.cashiers);
        setTransactions(res.transactions);
      } catch {
        gooeyToast.error({ title: "Gagal memuat laporan" });
      }
    });
  }

  function exportTransactions() {
    const rows: string[][] = [
      ["ID", "Tanggal", "Kasir", "Sumber", "Metode", "Item", "Total"],
      ...transactions.map((t) => [
        t.id,
        new Date(t.date).toLocaleString("id-ID"),
        t.cashierName,
        t.channel,
        t.paymentMethod,
        String(t.itemCount),
        String(t.total),
      ]),
    ];
    downloadCsv(`transaksi-${from}-${to}.csv`, rows);
  }

  function exportCashiers() {
    const rows: string[][] = [
      ["Kasir", "Transaksi", "Omset"],
      ...cashiers.map((c) => [c.name, String(c.transactions), String(c.revenue)]),
    ];
    downloadCsv(`kinerja-kasir-${from}-${to}.csv`, rows);
  }

  const grandTotal = transactions.reduce((s, t) => s + t.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Rentang Tanggal</CardTitle>
          <CardDescription>Pilih periode laporan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from">Dari</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">Sampai</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={applyRange} disabled={pending}>
            {pending ? "Memuat..." : "Terapkan"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total Omset Periode</CardDescription>
            <CardTitle className="text-2xl">{rupiah(grandTotal)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Transaksi</CardDescription>
            <CardTitle className="text-2xl">{transactions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="cashiers">Kinerja Kasir</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportTransactions}
                disabled={transactions.length === 0}
              >
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Tidak ada transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {new Date(t.date).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{t.cashierName}</TableCell>
                      <TableCell>{t.channel}</TableCell>
                      <TableCell>{t.paymentMethod}</TableCell>
                      <TableCell>{t.itemCount}</TableCell>
                      <TableCell>{rupiah(t.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cashiers">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCashiers}
                disabled={cashiers.length === 0}
              >
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Transaksi</TableHead>
                  <TableHead>Omset</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  cashiers.map((c) => (
                    <TableRow key={c.cashierId}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.transactions}</TableCell>
                      <TableCell>{rupiah(c.revenue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
