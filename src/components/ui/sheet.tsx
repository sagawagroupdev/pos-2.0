"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

const SHEET_SIDE = {
  right:
    "inset-y-0 right-0 h-full w-80 max-w-[calc(100%-2rem)] data-open:slide-in-from-right data-closed:slide-out-to-right",
  left: "inset-y-0 left-0 h-full w-80 max-w-[calc(100%-2rem)] data-open:slide-in-from-left data-closed:slide-out-to-left",
  top: "inset-x-0 top-0 h-auto max-h-[90vh] w-full rounded-b-xl data-open:slide-in-from-top data-closed:slide-out-to-top",
  bottom:
    "inset-x-0 bottom-0 mx-auto h-auto max-h-[90vh] w-full max-w-md rounded-t-xl data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
} as const

function SheetContent({
  className,
  children,
  showCloseButton = true,
  side = "right",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  side?: keyof typeof SHEET_SIDE
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/10 duration-200 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col bg-popover text-popover-foreground ring-1 ring-foreground/10 duration-200 outline-none data-open:animate-in data-closed:animate-out",
          SHEET_SIDE[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <HugeiconsIcon icon={Cancel01Icon} color="currentColor" strokeWidth={1.5} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 border-b px-4 py-3", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
