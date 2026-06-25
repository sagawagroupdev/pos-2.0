import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status"

const statusColor: Record<OrderStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  PENDING_PAYMENT:
    "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  WAITING_CONFIRMATION:
    "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  CANCELLED:
    "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
}

function StatusBadge({
  status,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant"> & {
  status: OrderStatus
}) {
  return (
    <Badge className={cn(statusColor[status], className)} {...props}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  )
}

export { StatusBadge }
