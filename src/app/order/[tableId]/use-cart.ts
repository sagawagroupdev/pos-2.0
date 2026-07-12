"use client";

import { useMemo, useState } from "react";
import type { CartItem, MenuItem } from "./types";

export function useCart({
  taxRate,
  taxEnabled,
}: {
  taxRate: number;
  taxEnabled: boolean;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addItem(item: MenuItem) {
    if (!item.isAvailable || item.stock < 1) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          return prev;
        }
        return prev.map((c) =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          price: item.price,
          stock: item.stock,
          quantity: 1,
          note: "",
        },
      ];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (c.itemId !== itemId) return [c];
        const next = c.quantity + delta;
        if (next < 1) return [];
        if (next > c.stock) {
          return [c];
        }
        return [{ ...c, quantity: next }];
      })
    );
  }

  function setNote(itemId: string, note: string) {
    setCart((prev) =>
      prev.map((c) => (c.itemId === itemId ? { ...c, note } : c))
    );
  }

  function clearCart() {
    setCart([]);
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart]
  );
  const tax = taxEnabled ? Math.round(subtotal * (taxRate / 100)) : 0;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return {
    cart,
    addItem,
    changeQty,
    setNote,
    clearCart,
    subtotal,
    tax,
    total,
    itemCount,
  };
}
