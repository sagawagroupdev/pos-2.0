import * as React from "react"

import { cn } from "@/lib/utils"

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "flex w-fit items-stretch *:rounded-none [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg [&>*:not(:first-child)]:border-l-0 [&>*]:focus-visible:z-10",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
