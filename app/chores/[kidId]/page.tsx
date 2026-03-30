"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getWeekStart, getDayStart, getPopcornVariant } from "@/lib/chore-utils"
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

type Chore = {
  id: string
  label: string
  emoji: string | null
  reset_cadence: "daily" | "weekly"
  point_value: number
  sort_order: number
}

type MemberColors = {
  bg100: string
  avatarRing: string
  text500: string
  text700: string
  border700: string
  checkboxBg: string
  badgeBg: string
  completedBg: string
  completedBorder: string
  progressBar: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMemberColors(color: string): MemberColors {
  if (color === "#ec4899") {
    return {
      bg100: "bg-member-emery-100",
      avatarRing: "ring-member-emery-500",
      text500: "text-member-emery-500",
      text700: "text-member-emery-700",
      border700: "border-member-emery-700",
      checkboxBg: "bg-member-emery-500",
      badgeBg: "bg-member-emery-100",
      completedBg: "bg-member-emery-100",
      completedBorder: "border-member-emery-700",
      progressBar: "bg-member-emery-500",
    }
  }
  return {
    bg100: "bg-member-lincoln-100",
    avatarRing: "ring-member-lincoln-500",
    text500: "text-member-lincoln-500",
    text700: "text-member-lincoln-700",
    border700: "border-member-lincoln-700",
    checkboxBg: "bg-member-lincoln-500",
    badgeBg: "bg-member-lincoln-100",
    completedBg: "bg-member-lincoln-100",
    completedBorder: "border-member-lincoln-700",
    progressBar: "bg-member-lincoln-500",
  }
}

// ---------------------------------------------------------------------------
// ChoreRow
// ---------------------------------------------------------------------------

function ChoreRow({
  chore,
  completed,
  colors,
  onToggle,
}: {
  chore: Chore
  completed: boolean
  colors: MemberColors
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between p-3 rounded-full border-2 w-full text-left",
        "shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_2px_8px_0px_rgba(0,0,0,0.06)]",
        "active:scale-[0.99] transition-transform",
        completed
          ? cn(colors.completedBg, colors.completedBorder)
          : "bg-card border-border",
      )}
    >
      {/* Left: checkbox + label */}
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0",
            completed
              ? cn(colors.checkboxBg, colors.border700)
              : "bg-accent border-input",
          )}
        >
          {completed && <Check className="w-6 h-6 text-white" strokeWidth={3} />}
        </div>
        <span className="text-body-base leading-body-base text-foreground">
          {chore.emoji && <span className="mr-2">{chore.emoji}</span>}{chore.label}
        </span>
      </div>

      {/* Right: point badge */}
      <div
        className={cn(
          "flex items-center justify-center px-4 py-2 rounded-full shrink-0",
          colors.badgeBg,
        )}
      >
        <span className={cn("text-label font-medium tracking-label", colors.text700)}>
          + {chore.point_value} pts
        </span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// ChoreScreen
// ---------------------------------------------------------------------------

export default function ChoreScreen({ params }: { params: Promise<{ kidId: string }> }) {
  const router = useRouter()
  const { kidId } = use(params)

  const [kid, setKid] = useState<Kid | null>(null)
  const [chores, setChores] = useState<Chore[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    const weekStart = getWeekStart()
    const dayStart = getDayStart()

    const [
      { data: kidData },
      { data: assignments },
      { data: completions },
    ] = await Promise.all([
      supabase.from("kids").select("*").eq("id", kidId).single(),
      supabase
        .from("chore_kid_assignments")
        .select("chores(id, label, emoji, reset_cadence, point_value, sort_order)")
        .eq("kid_id", kidId),
      supabase
        .from("chore_completions")
        .select("chore_id, day_start, chores(point_value)")
        .eq("kid_id", kidId)
        .eq("week_start", weekStart),
    ])

    if (!kidData) return

    const choreList: Chore[] = (assignments ?? [])
      .map((a) => a.chores as unknown as Chore)
      .filter(Boolean)
      .sort((a, b) => a.sort_order - b.sort_order)

    // A completion counts if:
    // - daily: matching chore_id + today's day_start
    // - weekly: matching chore_id (any day this week)
    const completedSet = new Set<string>()
    let pts = 0
    for (const c of completions ?? []) {
      const chore = choreList.find((ch) => ch.id === c.chore_id)
      if (!chore) continue
      const countable =
        chore.reset_cadence === "weekly" ||
        (chore.reset_cadence === "daily" && c.day_start === dayStart)
      if (countable) {
        completedSet.add(c.chore_id)
        pts += (c.chores as unknown as { point_value: number } | null)?.point_value ?? 0
      }
    }

    setKid(kidData)
    setChores(choreList)
    setCompletedIds(completedSet)
    setTotalPoints(pts)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel("chore-screen-completions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chore_completions" },
        fetchData,
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [kidId])

  async function toggleChore(chore: Chore) {
    const weekStart = getWeekStart()
    const dayStart = getDayStart()
    const isCompleted = completedIds.has(chore.id)

    // Optimistic update — instant UI response
    setCompletedIds((prev) => {
      const next = new Set(prev)
      isCompleted ? next.delete(chore.id) : next.add(chore.id)
      return next
    })
    setTotalPoints((prev) => prev + (isCompleted ? -chore.point_value : chore.point_value))

    if (isCompleted) {
      let query = supabase
        .from("chore_completions")
        .delete()
        .eq("kid_id", kidId)
        .eq("chore_id", chore.id)
        .eq("week_start", weekStart)
      if (chore.reset_cadence === "daily") query = query.eq("day_start", dayStart)
      await query
    } else {
      await supabase.from("chore_completions").insert({
        kid_id: kidId,
        chore_id: chore.id,
        week_start: weekStart,
        day_start: dayStart,
      })
    }
  }

  if (loading || !kid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground-muted text-body-sm">
        Loading...
      </div>
    )
  }

  const colors = getMemberColors(kid.color)
  const kernelsEarned = Math.floor(totalPoints / kid.points_per_kernel)
  const pointsIntoKernel = totalPoints % kid.points_per_kernel
  const progressPct = (pointsIntoKernel / kid.points_per_kernel) * 100

  const weeklyChores = chores.filter((c) => c.reset_cadence === "weekly")
  const dailyChores = chores.filter((c) => c.reset_cadence === "daily")

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1368px] mx-auto px-4 sm:px-8 py-5 sm:py-7 flex flex-col gap-6 sm:gap-8">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 sm:px-4 text-body-base text-foreground shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_2px_8px_0px_rgba(0,0,0,0.06)] shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Kid title */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div
              className={cn(
                "w-12 h-12 sm:w-[76px] sm:h-[76px] rounded-full ring-4 flex items-center justify-center text-2xl sm:text-[41px] leading-none shrink-0",
                colors.bg100,
                colors.avatarRing,
              )}
            >
              {kid.emoji}
            </div>
            <span className="text-2xl sm:text-[41px] font-medium sm:leading-[67px] sm:tracking-[-0.41px] text-foreground">
              {kid.name}'s Chores
            </span>
          </div>

          {/* Total points */}
          <div className="bg-card rounded-lg px-3 sm:px-5 py-2 sm:py-3 flex flex-col items-center gap-1 sm:gap-2 shrink-0">
            <span className="text-xs sm:text-body-sm font-semibold text-foreground-muted whitespace-nowrap">Total Points</span>
            <span className={cn("text-3xl sm:text-[46px] font-medium sm:leading-[42px] sm:tracking-[-0.46px]", colors.text500)}>
              {totalPoints}
            </span>
          </div>
        </div>

        {/* Kernel progress */}
        <div className="flex flex-col items-center gap-5 sm:gap-8 w-full sm:w-[466px] mx-auto">
          {/* Kernel row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {Array.from({ length: kid.kernel_target }).map((_, i) => (
              <div key={i} className="relative w-8 h-[34px] sm:w-[44px] sm:h-[46px] shrink-0">
                <Image
                  src={i < kernelsEarned ? getPopcornVariant(kidId, i) : "/icons/kernal.svg"}
                  alt={i < kernelsEarned ? "earned" : "unearned"}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {/* Progress bar + label */}
          <div className="flex flex-col gap-1.5 items-end w-full">
            <div className="w-full h-2 rounded-full bg-border overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_2px_8px_0px_rgba(0,0,0,0.06)]">
              <div
                className={cn("h-full rounded-full transition-all", colors.progressBar)}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-body-sm text-foreground-muted">
              {pointsIntoKernel} of {kid.points_per_kernel} points to pop a kernel
            </span>
          </div>
        </div>

        {/* Chore list */}
        <div className="flex flex-col gap-5">

          {/* Weekly */}
          {weeklyChores.length > 0 && (
            <div className="flex flex-col gap-3 sm:gap-5">
              <span className="text-body-lg font-medium leading-body-lg text-foreground">Weekly</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                {weeklyChores.map((chore) => (
                  <ChoreRow
                    key={chore.id}
                    chore={chore}
                    completed={completedIds.has(chore.id)}
                    colors={colors}
                    onToggle={() => toggleChore(chore)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Daily */}
          {dailyChores.length > 0 && (
            <div className="flex flex-col gap-3 sm:gap-5">
              <span className="text-body-lg font-medium leading-body-lg text-foreground">Daily</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                {dailyChores.map((chore) => (
                  <ChoreRow
                    key={chore.id}
                    chore={chore}
                    completed={completedIds.has(chore.id)}
                    colors={colors}
                    onToggle={() => toggleChore(chore)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
