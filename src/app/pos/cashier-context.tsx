"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "pos-cashier-name";

type CashierContextValue = {
  cashierName: string;
  setCashierName: (name: string) => void;
};

const CashierContext = createContext<CashierContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY);
}

export function CashierProvider({
  defaultName,
  children,
}: {
  defaultName: string;
  children: ReactNode;
}) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const cashierName = stored ?? defaultName;

  const setCashierName = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    listeners.forEach((l) => l());
  }, []);

  return (
    <CashierContext value={{ cashierName, setCashierName }}>
      {children}
    </CashierContext>
  );
}

export function useCashier() {
  const ctx = useContext(CashierContext);
  if (!ctx) throw new Error("useCashier must be used within CashierProvider");
  return ctx;
}
