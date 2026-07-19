"use client"

import * as React from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { id } from "date-fns/locale"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Calendar({
  selected,
  onSelect,
  className,
}: {
  selected?: Date
  onSelect: (date: Date) => void
  className?: string
}) {
  const today = new Date()
  const [displayMonth, setDisplayMonth] = React.useState(
    selected ?? today
  )

  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const DAYS_LABEL = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  function prev() {
    setDisplayMonth((m) => subMonths(m, 1))
  }

  function next() {
    setDisplayMonth((m) => addMonths(m, 1))
  }

  return (
    <div className={cn("w-full", className)}>
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <Button size="icon-xs" variant="ghost" onClick={prev}>
          <HugeiconsIcon icon={ArrowLeft01Icon} color="currentColor" strokeWidth={1.5} className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(displayMonth, "MMMM yyyy", { locale: id })}
        </span>
        <Button size="icon-xs" variant="ghost" onClick={next}>
          <HugeiconsIcon icon={ArrowRight01Icon} color="currentColor" strokeWidth={1.5} className="size-4" />
        </Button>
      </div>

      {/* day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_LABEL.map((d) => (
          <div
            key={d}
            className="text-center text-xs text-muted-foreground h-7 leading-7"
          >
            {d}
          </div>
        ))}
      </div>

      {/* day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const isCurrentMonth = isSameMonth(day, displayMonth)
          const isTodayDay = isToday(day)

          return (
            <Button
              key={day.toISOString()}
              size="icon-xs"
              variant={isSelected ? "default" : "ghost"}
              className={cn(
                "h-7 w-full rounded text-xs font-normal aria-pressed:bg-primary aria-pressed:text-primary-foreground",
                !isCurrentMonth && "text-muted-foreground opacity-40",
                isTodayDay && !isSelected && "border border-dashed border-foreground/30"
              )}
              onClick={() => onSelect(day)}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
