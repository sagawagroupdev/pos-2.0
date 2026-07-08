"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Option = { label: string; value: string }

function Combobox({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  notFound = "Tidak ditemukan",
  className,
}: {
  options: Option[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  searchPlaceholder?: string
  notFound?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selected = options.find((o) => o.value === value)
  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            {selected ? selected.label : placeholder}
            <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <div className="flex items-center border-b px-2.5">
          <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {notFound}
            </p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className={cn(
                  "relative flex w-full cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground",
                  value === o.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <span className="flex-1 truncate">{o.label}</span>
                {value === o.value && (
                  <CheckIcon className="absolute right-2 size-4" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type Option }
