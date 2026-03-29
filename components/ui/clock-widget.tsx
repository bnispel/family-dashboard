"use client"

import { useEffect, useState } from "react"
import { BookText } from "lucide-react"
import { cn } from "@/lib/utils"

type ClockWidgetProps = {
  className?: string
  size?: "sm" | "md"
  isSchoolDay?: boolean
  style?: React.CSSProperties
}

export function ClockWidget({ className, size = "sm", isSchoolDay = false, style }: ClockWidgetProps) {
  const [now, setNow] = useState(new Date())
  const isMd = size === "md"

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  const timeStr = `${displayHours}:${minutes.toString().padStart(2, "0")}`
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" })
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const schoolDayBadge = (
    <div className="bg-blue-100 flex gap-1 items-center justify-center px-2 py-0.5 rounded-lg w-full">
      <BookText className="w-3 h-3 text-blue-800 shrink-0" />
      <span className="text-label font-medium leading-label tracking-label text-blue-800 text-center whitespace-nowrap">
        School Day
      </span>
    </div>
  )

  const timeDisplay = (
    <div className="text-foreground whitespace-nowrap">
      <span className="text-[56px] font-medium leading-heading-1 tracking-heading-1">{timeStr}</span>
      <span className="text-label font-medium leading-label tracking-label"> {ampm}</span>
    </div>
  )

  const dateDisplay = (
    <div className="text-body-sm font-normal text-foreground-muted text-center leading-body-sm">
      <span className="text-warm-gray-600">{dayName}</span>
      <br />
      {dateStr}
    </div>
  )

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-3 flex items-center justify-center shadow-sm",
        isMd ? "flex-row gap-3 w-[452px]" : "flex-col gap-2 w-[296px]",
        className
      )}
      style={style}
    >
      {!isMd && (
        <>
          <div className="flex flex-col items-center gap-0.5">
            {timeDisplay}
            {dateDisplay}
          </div>
          {isSchoolDay && schoolDayBadge}
        </>
      )}

      {isMd && (
        <>
          <div className="flex-1 flex items-center justify-center">
            {timeDisplay}
          </div>
          <div className="flex-1 border-l border-border pl-5 flex flex-col items-center justify-center gap-2">
            {dateDisplay}
            {isSchoolDay && schoolDayBadge}
          </div>
        </>
      )}
    </div>
  )
}

export default ClockWidget
