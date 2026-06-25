import * as React from "react"

import { cn } from "@/lib/utils"

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "flex w-fit items-stretch *:focus-visible:z-10",
        "[&>*:not(:first-child)]:border-l-0",
        "[&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg",
        "[&>*:not(:first-child):not(:last-child)]:rounded-none",
        "[&>*:first-child:not(:last-child)]:rounded-r-none",
        "[&>*:last-child:not(:first-child)]:rounded-l-none",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
