"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DraftsUIContextValue = {
  enabled: boolean;
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DraftsUIContext = createContext<DraftsUIContextValue | null>(null);

export function DraftsUIProvider({
  enabled,
  count,
  children,
}: {
  enabled: boolean;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <DraftsUIContext value={{ enabled, count, open, setOpen }}>
      {children}
    </DraftsUIContext>
  );
}

export function useDraftsUI() {
  const ctx = useContext(DraftsUIContext);
  if (!ctx) throw new Error("useDraftsUI must be used within DraftsUIProvider");
  return ctx;
}
