"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type QrOrderSheetUIContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  count: number;
  setCount: (count: number) => void;
};

const QrOrderSheetUIContext = createContext<QrOrderSheetUIContextValue | null>(null);

export function QrOrderSheetUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <QrOrderSheetUIContext value={{ open, setOpen, count, setCount }}>
      {children}
    </QrOrderSheetUIContext>
  );
}

export function useQrOrderSheetUI() {
  const ctx = useContext(QrOrderSheetUIContext);
  if (!ctx) throw new Error("useQrOrderSheetUI must be used within QrOrderSheetUIProvider");
  return ctx;
}
