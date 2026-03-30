// Chore date utilities — all dates in US Central time

function centralDateParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date)

  const year = parseInt(parts.find((p) => p.type === "year")!.value)
  const month = parseInt(parts.find((p) => p.type === "month")!.value)
  const day = parseInt(parts.find((p) => p.type === "day")!.value)
  const weekdayStr = parts.find((p) => p.type === "weekday")!.value
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const weekday = weekdayMap[weekdayStr]

  return { year, month, day, weekday }
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Central-time date string (YYYY-MM-DD) for daily completion boundaries */
export function getDayStart(date: Date = new Date()): string {
  const { year, month, day } = centralDateParts(date)
  return toDateString(year, month, day)
}

const POPCORN_VARIANTS = [
  "/icons/popcorn.svg",
  "/icons/popcorn-1.svg",
  "/icons/popcorn-2.svg",
  "/icons/popcorn-3.svg",
  "/icons/popcorn-4.svg",
  "/icons/popcorn-5.svg",
  "/icons/popcorn-6.svg",
]

/**
 * Returns a stable popcorn SVG path for a given kid + slot index.
 * Same kid always gets the same pattern across renders.
 */
export function getPopcornVariant(kidId: string, slotIndex: number): string {
  const seed = kidId.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0)
  return POPCORN_VARIANTS[(seed + slotIndex * 3) % POPCORN_VARIANTS.length]
}

/** ISO Monday date string (YYYY-MM-DD) in Central time for weekly reset + aggregation */
export function getWeekStart(date: Date = new Date()): string {
  const { year, month, day, weekday } = centralDateParts(date)
  // Week starts Sunday; weekday 0=Sun needs 0 days back, Mon=1, ..., Sat=6
  const daysBack = weekday
  const sunday = new Date(Date.UTC(year, month - 1, day - daysBack))
  return toDateString(sunday.getUTCFullYear(), sunday.getUTCMonth() + 1, sunday.getUTCDate())
}
