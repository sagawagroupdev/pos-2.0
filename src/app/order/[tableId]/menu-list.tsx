"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import type { MenuCategory } from "@/lib/menu";
import type { CartItem, MenuItem } from "./types";

export function MenuList({
  menu,
  cart,
  onAdd,
  onChangeQty,
}: {
  menu: MenuCategory[];
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onChangeQty: (itemId: string, delta: number) => void;
}) {
  if (menu.length === 0) {
    return <p className="text-muted-foreground">Menu belum tersedia.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {menu.map((cat) => (
        <div key={cat.id} className="flex flex-col gap-2">
          <h2 className="font-semibold">{cat.name}</h2>
          {cat.items
            .filter((i) => i.isAvailable)
            .map((item) => {
              const inCart = cart.find((c) => c.itemId === item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="size-14 rounded object-cover"
                    />
                  ) : (
                    <div className="size-14 rounded bg-muted" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                    <div className="text-sm">{rupiah(item.price)}</div>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onChangeQty(item.id, -1)}
                      >
                        -
                      </Button>
                      <span className="w-5 text-center">{inCart.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onChangeQty(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={item.stock < 1}
                      onClick={() => onAdd(item)}
                    >
                      Tambah
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
