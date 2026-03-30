"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getWeekStart, getPopcornVariant } from "@/lib/chore-utils"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Kid = {
  id: string
  name: string
  emoji: string
  color: string
  points_per_kernel: number
  kernel_target: number
}

type KidProgress = {
  kid: Kid
  kernels_earned: number
}

// ---------------------------------------------------------------------------
// Deadline countdown
// ---------------------------------------------------------------------------

function getDeadlineLabel(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now)

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const weekday = weekdayMap[parts.find((p) => p.type === "weekday")?.value ?? "Mon"] ?? 1
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0")

  // Days until Friday 7pm CT (primary deadline)
  let daysToFriday = (5 - weekday + 7) % 7
  if (weekday === 5 && hour >= 19) daysToFriday = 7 // reset to next week
  if (daysToFriday === 0 && hour < 19) return "Movie night tonight!"
  if (daysToFriday === 1) return "1 day to movie night"
  return `${daysToFriday} days to movie night`
}

// ---------------------------------------------------------------------------
// KidBlock
// ---------------------------------------------------------------------------

type KidBlockProps = {
  progress: KidProgress
}

function KidBlock({ progress }: KidBlockProps) {
  const { kid, kernels_earned } = progress
  const isEmery = kid.name === "Emery"
  const isUnlocked = kernels_earned >= kid.kernel_target

  const cardBorder = isEmery ? "border-member-emery-100" : "border-member-lincoln-100"
  const avatarBg = isEmery ? "bg-member-emery-100" : "bg-member-lincoln-100"
  const avatarRing = isEmery ? "ring-member-emery-500" : "ring-member-lincoln-500"

  if (isUnlocked) {
    const solidBg = isEmery ? "bg-member-emery-500" : "bg-member-lincoln-500"
    const solidBorder = isEmery ? "border-member-emery-700" : "border-member-lincoln-700"
    const explosionSrc = isEmery ? "/icons/popcorn-emery.png" : "/icons/popcorn-lincoln.png"

    return (
      <Link
        href={`/chores/${kid.id}`}
        className={cn(
          "relative flex flex-col items-center rounded-[16px] border-2 w-full sm:w-[268px] overflow-visible",
          "h-[281px] pt-14 pb-6 px-6 gap-5",
          "shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_2px_8px_0px_rgba(0,0,0,0.06)]",
          solidBg,
          solidBorder,
        )}
      >
        {/* Avatar floating above top edge */}
        <div
          className={cn(
            "absolute top-[-14px] w-[76px] h-[76px] rounded-full ring-4 flex items-center justify-center text-[41px] leading-none",
            avatarBg,
            avatarRing,
          )}
        >
          {kid.emoji}
        </div>

        {/* Popcorn explosion */}
        <div className="relative w-full max-w-[225px] h-[120px] shrink-0">
          <Image
            src={explosionSrc}
            alt="popcorn explosion"
            fill
            className="object-contain"
          />
        </div>

        {/* Movie Night UNLOCKED text */}
        <div className="flex flex-col items-center gap-[2px] text-center text-white">
          <span className="text-lg sm:text-[22px] font-normal leading-[29px]">Movie Night</span>
          <span className="text-2xl sm:text-[34px] font-bold leading-[36px]">UNLOCKED</span>
        </div>
      </Link>
    )
  }

  // Build rows of 4 kernel slots up to kernel_target
  const rows = Math.ceil(kid.kernel_target / 4)

  return (
    <Link
      href={`/chores/${kid.id}`}
      className={cn(
        "flex flex-col items-center gap-[15px] p-6 rounded-[16px] border-2 w-full sm:w-[268px]",
        "shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_2px_8px_0px_rgba(0,0,0,0.06)]",
        cardBorder,
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-[76px] h-[76px] rounded-full ring-4 flex items-center justify-center text-[41px] leading-none",
          avatarBg,
          avatarRing,
        )}
      >
        {kid.emoji}
      </div>

      {/* Kernel grid */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, colIdx) => {
              const slotIdx = rowIdx * 4 + colIdx
              if (slotIdx >= kid.kernel_target) return <div key={colIdx} className="w-[32px] h-[34px]" />
              const earned = slotIdx < kernels_earned
              return (
                <div key={colIdx} className="relative w-[32px] h-[34px] shrink-0">
                  <Image
                    src={earned ? getPopcornVariant(kid.id, slotIdx) : "/icons/kernal.svg"}
                    alt={earned ? "earned kernel" : "unearned kernel"}
                    fill
                    className="object-contain"
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// ChoreSummaryTile
// ---------------------------------------------------------------------------

export function ChoreSummaryTile() {
  const [progress, setProgress] = useState<KidProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function fetchProgress() {
    const weekStart = getWeekStart()

    const [{ data: kids, error: kidsErr }, { data: completions, error: compErr }] =
      await Promise.all([
        supabase.from("kids").select("*").order("name"),
        supabase
          .from("chore_completions")
          .select("kid_id, chores(point_value)")
          .eq("week_start", weekStart),
      ])

    if (kidsErr || compErr || !kids) {
      setError(true)
      setLoading(false)
      return
    }

    // Sum points per kid
    const pointsByKid: Record<string, number> = {}
    for (const c of completions ?? []) {
      const pts = (c.chores as unknown as { point_value: number } | null)?.point_value ?? 0
      pointsByKid[c.kid_id] = (pointsByKid[c.kid_id] ?? 0) + pts
    }

    setProgress(
      kids.map((kid) => {
        const points = pointsByKid[kid.id] ?? 0
        return {
          kid,
          kernels_earned: Math.floor(points / kid.points_per_kernel),
        }
      }),
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchProgress()

    // Realtime: re-fetch whenever completions change (KRO-12)
    const channel = supabase
      .channel("chore-completions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chore_completions" },
        fetchProgress,
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="p-6 w-full h-[240px] flex items-center justify-center text-foreground-muted text-body-sm">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 w-full h-[240px] flex items-center justify-center text-foreground-muted text-body-sm">
        Couldn't load chores
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-body-lg font-medium leading-body-lg text-foreground">Chores</span>
        <div className="flex items-center gap-1 bg-fuchsia-100 px-2 py-0.5 rounded-lg">
          <Clock className="w-3 h-3 text-fuchsia-800 shrink-0" />
          <span className="text-label font-medium text-fuchsia-800 whitespace-nowrap">
            {getDeadlineLabel()}
          </span>
        </div>
      </div>

      {/* Kid blocks */}
      <div className="flex flex-col sm:flex-row gap-5">
        {progress.map((p) => (
          <KidBlock key={p.kid.id} progress={p} />
        ))}
      </div>
    </div>
  )
}

export default ChoreSummaryTile
