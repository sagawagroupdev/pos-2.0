"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Store01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SubPartnershipRow } from "../types";
import { statusLabel, statusVariant } from "../types";

export function SubItem({
  sub,
  pending,
  onEdit,
  onDelete,
}: {
  sub: SubPartnershipRow;
  pending: boolean;
  onEdit: (s: SubPartnershipRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        {sub.logo ? (
          <Image
            src={sub.logo}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Store01Icon} size="16" color="currentColor" strokeWidth={1.5} />
          </div>
        )}
        <span className="truncate font-medium">{sub.name}</span>
        <Badge variant={statusVariant[sub.status]}>
          {statusLabel[sub.status]}
        </Badge>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(sub)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={pending}
          onClick={() => onDelete(sub.id)}
        >
          Hapus
        </Button>
      </div>
    </div>
  );
}
