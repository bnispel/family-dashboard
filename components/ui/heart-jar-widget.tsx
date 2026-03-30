"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getDayStart } from "@/lib/chore-utils"

// Exact path from /public design — do not approximate
const HEART_PATH =
  "M70.11.01C.09-1.25-64.71,108.26,124.07,221.79c.21-.37,1-.37,1.21,0C320.15,104.59,244.83-8.29,172.47.49c-28.21,3.43-41.52,19.08-47.79,32.55C118.41,19.58,105.09,3.92,76.89.49c-2.26-.27-4.52-.44-6.78-.48Z"

const VB_W = 249.36
const VB_H = 221.79
const HCX = VB_W / 2
const HCY = VB_H / 2
const RENDER_W = 220
const PX = RENDER_W / VB_W

const ROWS = [
  { y: 210, xMin: 100, xMax: 150 },
  { y: 193, xMin: 72,  xMax: 178 },
  { y: 176, xMin: 40,  xMax: 210 },
  { y: 159, xMin: 12,  xMax: 238 },
  { y: 142, xMin: 0,   xMax: 249 },
  { y: 125, xMin: 0,   xMax: 249 },
  { y: 108, xMin: 0,   xMax: 249 },
  { y: 91,  xMin: 0,   xMax: 249 },
  { y: 74,  xMin: 12,  xMax: 237 },
  { y: 57,  xMin: 35,  xMax: 214 },
  { y: 40,  xMin: 60,  xMax: 189 },
]

function buildSlots() {
  const slots: { x: number; y: number; halfW: number }[] = []
  for (const row of ROWS) {
    const w = row.xMax - row.xMin
    const count = Math.max(1, Math.floor(w / 24))
    const step = w / count
    for (let i = 0; i < count; i++) {
      slots.push({ x: row.xMin + step * i + step / 2, y: row.y, halfW: step * 0.5 })
    }
  }
  return slots
}

const SLOTS = buildSlots()

// ---------------------------------------------------------------------------
// Family identity
// ---------------------------------------------------------------------------

type FamilyMember = {
  id: string
  name: string        // display name (may be custom for guests)
  emoji: string
  color: string
  bg: string
  ring: string
}

// Base members — name is overridden for guests at runtime
const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "emery",   name: "Emery",   emoji: "🎀", color: "#EC4899", bg: "#FCE7F3", ring: "#EC4899" },
  { id: "lincoln", name: "Lincoln", emoji: "🏈", color: "#10B981", bg: "#D1FAE5", ring: "#10B981" },
  { id: "mom",     name: "Mom",     emoji: "🌸", color: "#A855F7", bg: "#F3E8FF", ring: "#A855F7" },
  { id: "dad",     name: "Dad",     emoji: "💪", color: "#3B82F6", bg: "#DBEAFE", ring: "#3B82F6" },
  { id: "guest",   name: "Guest",   emoji: "👋", color: "#F59E0B", bg: "#FEF3C7", ring: "#F59E0B" },
]

// localStorage stores { id, name } as JSON
const LS_IDENTITY_KEY = "heart-jar-identity"

function loadIdentity(): FamilyMember | null {
  try {
    const raw = localStorage.getItem(LS_IDENTITY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id: string; name: string }
    const base = FAMILY_MEMBERS.find(m => m.id === parsed.id)
    if (!base) return null
    return { ...base, name: parsed.name }
  } catch { return null }
}

function saveIdentity(member: FamilyMember) {
  localStorage.setItem(LS_IDENTITY_KEY, JSON.stringify({ id: member.id, name: member.name }))
}

// ---------------------------------------------------------------------------
// Heart type
// ---------------------------------------------------------------------------

type Heart = {
  id: string
  tx: number
  ty: number
  s: number
  rot: number
  color: string
  driftX: number
  spawnDY: number
  settled: boolean
  delay: number
}

// ---------------------------------------------------------------------------
// Identity picker — two steps for guest
// ---------------------------------------------------------------------------

function IdentityPicker({ onSelect }: { onSelect: (member: FamilyMember) => void }) {
  const [step, setStep] = useState<"pick" | "guest-name">("pick")
  const [guestName, setGuestName] = useState("")

  function confirmGuest() {
    const name = guestName.trim()
    if (!name) return
    const base = FAMILY_MEMBERS.find(m => m.id === "guest")!
    onSelect({ ...base, name })
  }

  if (step === "guest-name") {
    const guest = FAMILY_MEMBERS.find(m => m.id === "guest")!
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 bg-card rounded-[24px] p-8 flex flex-col items-center gap-6 shadow-2xl max-w-xs w-full mx-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-4xl leading-none">👋</span>
            <span className="text-body-lg font-medium text-foreground mt-2">What's your name?</span>
          </div>
          <input
            autoFocus
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && confirmGuest()}
            placeholder="Your name"
            className="w-full rounded-[12px] border-2 border-input bg-accent px-4 py-3 text-body-base text-foreground placeholder:text-foreground-muted focus:outline-none"
            style={{ borderColor: guestName.trim() ? guest.ring : undefined }}
          />
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setStep("pick")}
              className="flex-1 py-3 rounded-full border-2 border-border text-body-sm text-foreground-muted"
            >
              Back
            </button>
            <button
              onClick={confirmGuest}
              disabled={!guestName.trim()}
              className="flex-1 py-3 rounded-full border-2 text-body-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: guest.bg, borderColor: guest.ring, color: guest.color }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 bg-card rounded-[24px] p-8 flex flex-col items-center gap-6 shadow-2xl max-w-xs w-full mx-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-body-lg font-medium text-foreground">Who are you?</span>
          <span className="text-body-sm text-foreground-muted">We'll remember you on this device.</span>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {FAMILY_MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => member.id === "guest" ? setStep("guest-name") : onSelect(member)}
              className="flex flex-col items-center gap-2 py-5 px-3 rounded-[16px] border-2 active:scale-95 transition-transform"
              style={{ backgroundColor: member.bg, borderColor: member.ring }}
            >
              <span className="text-4xl leading-none">{member.emoji}</span>
              <span className="text-body-sm font-medium" style={{ color: member.color }}>
                {member.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export default function HeartJarWidget() {
  const [hearts, setHearts] = useState<Heart[]>([])
  const [identity, setIdentity] = useState<FamilyMember | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [glowKey, setGlowKey] = useState(0)
  const [glowing, setGlowing] = useState(false)
  const [beating, setBeating] = useState(false)
  const [beatKey, setBeatKey] = useState(0)
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartsRef = useRef<Heart[]>([])
  const slotRef = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  function scheduleIdle() {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      setBeating(true)
      setBeatKey(k => k + 1)
      setTimeout(() => {
        setBeating(false)
        scheduleIdle()
      }, 1800)
    }, 10000)
  }

  useEffect(() => {
    const saved = loadIdentity()
    setIdentity(saved)
    if (!saved) setShowPicker(true)

    const today = getDayStart()

    supabase
      .from("heart_jar")
      .select("*")
      .eq("date", today)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) { console.error("[heart-jar] load error:", error); return }
        if (!data) return
        const loaded: Heart[] = data.map((row, i) => ({
          id: row.id,
          tx: row.tx, ty: row.ty, s: row.s, rot: row.rot, color: row.color,
          driftX: row.drift_x, spawnDY: row.spawn_dy,
          settled: true,
          delay: 0.4 + i * 0.12,
        }))
        setHearts(loaded)
        heartsRef.current = loaded
        slotRef.current = loaded.length % SLOTS.length
      })

    const channel = supabase
      .channel("heart-jar-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "heart_jar" },
        (payload) => {
          const row = payload.new as {
            id: string; date: string; tx: number; ty: number; s: number; rot: number; color: string;
            drift_x: number; spawn_dy: number;
          }
          // Only show hearts from today, skip our own optimistic add
          if (row.date !== today) return
          if (heartsRef.current.find(h => h.id === row.id)) return
          const heart: Heart = {
            id: row.id, tx: row.tx, ty: row.ty, s: row.s, rot: row.rot, color: row.color,
            driftX: row.drift_x, spawnDY: row.spawn_dy,
            settled: false, delay: 0,
          }
          setHearts(prev => {
            const next = [...prev, heart]
            heartsRef.current = next
            return next
          })
          slotRef.current++
        },
      )
      .subscribe()

    scheduleIdle()

    return () => {
      supabase.removeChannel(channel)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  function handleSelectIdentity(member: FamilyMember) {
    saveIdentity(member)
    setIdentity(member)
    setShowPicker(false)
  }

  function handlePointerDown() {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setShowPicker(true)
    }, 3000)
  }

  function handlePointerUp() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const addHeart = useCallback(() => {
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }

    const slot = SLOTS[slotRef.current % SLOTS.length]
    slotRef.current++

    const s = 0.15 + Math.random() * 0.06
    const cx = slot.x + (Math.random() - 0.5) * slot.halfW * 2
    const cy = slot.y + (Math.random() - 0.5) * 7
    const tx = cx - HCX * s
    const ty = cy - HCY * s
    const rot = (Math.random() - 0.5) * 22

    const saved = loadIdentity()
    const color = saved?.color ?? "#f42f2f"

    const spawnCX = VB_W / 2 + (Math.random() - 0.5) * 30
    const spawnCY = 55 + Math.random() * 15
    const driftX = (spawnCX - HCX * s) - tx
    const spawnDY = (spawnCY - HCY * s) - ty

    const heart: Heart = {
      id: `h${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
      tx, ty, s, rot, color, driftX, spawnDY, settled: false, delay: 0,
    }

    setHearts(prev => {
      const next = [...prev, heart]
      heartsRef.current = next
      return next
    })

    supabase.from("heart_jar").insert({
      id: heart.id,
      date: getDayStart(),
      tx: heart.tx, ty: heart.ty, s: heart.s, rot: heart.rot, color: heart.color,
      drift_x: heart.driftX, spawn_dy: heart.spawnDY,
    }).then(({ error }) => {
      if (error) console.error("[heart-jar] insert error:", error)
    })

    setBeating(false)
    scheduleIdle()
    setGlowing(true)
    setGlowKey(k => k + 1)
    if (glowTimer.current) clearTimeout(glowTimer.current)
    glowTimer.current = setTimeout(() => setGlowing(false), 900)
  }, [])

  const keyframesCSS = hearts
    .filter(h => !h.settled)
    .map(h => {
      const txPx = h.tx * PX
      const tyPx = h.ty * PX
      const stxPx = (h.tx + h.driftX) * PX
      const styPx = (h.ty + h.spawnDY) * PX
      const bouncePx = 4
      return (
        `@keyframes hf-${h.id}{` +
        `0%{transform:translate(${stxPx}px,${styPx}px) scale(${h.s});opacity:0;}` +
        `72%{transform:translate(${txPx}px,${tyPx}px) scale(${h.s});opacity:1;}` +
        `86%{transform:translate(${txPx}px,${tyPx + bouncePx}px) scale(${h.s * 0.93});}` +
        `100%{transform:translate(${txPx}px,${tyPx}px) scale(${h.s});}` +
        `}`
      )
    })
    .join("")

  const count = hearts.length

  return (
    <>
      {showPicker && <IdentityPicker onSelect={handleSelectIdentity} />}

      <div className="p-6 flex flex-col items-center gap-3">
        <style dangerouslySetInnerHTML={{
          __html:
            keyframesCSS +
            `@keyframes hj-glow{0%{opacity:0;}18%{opacity:0.8;}100%{opacity:0;}}` +
            `@keyframes hj-beat{0%{transform:scale(1);}12%{transform:scale(1.08);}22%{transform:scale(1.0);}36%{transform:scale(1.05);}50%{transform:scale(1.0);}100%{transform:scale(1);}}`,
        }} />

        <span className="text-body-lg font-medium text-foreground self-start">Heart Jar</span>

        <button
          onClick={addHeart}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="focus:outline-none select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label="Add a heart"
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width={RENDER_W}
            height={Math.round(RENDER_W * VB_H / VB_W)}
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
          >
            <defs>
              <clipPath id="hj-clip">
                <path d={HEART_PATH} />
              </clipPath>
              <filter id="hj-glow-f" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              </filter>
            </defs>

            {glowing && (
              <path
                key={`glow-${glowKey}`}
                d={HEART_PATH}
                fill="none"
                stroke={identity?.color ?? "#ff8fa3"}
                strokeWidth={28}
                filter="url(#hj-glow-f)"
                style={{ animation: "hj-glow 0.9s ease-out forwards", opacity: 0 }}
              />
            )}

            <g clipPath="url(#hj-clip)">
              {hearts.map(h => {
                const txPx = h.tx * PX
                const tyPx = h.ty * PX
                return (
                  <g
                    key={h.id}
                    style={
                      h.settled
                        ? {
                            transform: `translate(${txPx}px, ${tyPx}px) scale(${h.s})`,
                            transformBox: "view-box" as React.CSSProperties["transformBox"],
                            transformOrigin: "0px 0px",
                          }
                        : {
                            animation: `hf-${h.id} 1.4s cubic-bezier(0.22,1,0.36,1) ${h.delay}s both`,
                            transformBox: "view-box" as React.CSSProperties["transformBox"],
                            transformOrigin: "0px 0px",
                          }
                    }
                  >
                    <path
                      d={HEART_PATH}
                      fill={h.color}
                      transform={`rotate(${h.rot}, ${HCX}, ${HCY})`}
                    />
                  </g>
                )
              })}
            </g>

            <path
              key={`beat-${beatKey}`}
              d={HEART_PATH}
              fill="none"
              stroke={identity?.color ?? "#f42f2f"}
              strokeWidth={8}
              style={beating ? {
                animation: "hj-beat 1.8s ease-in-out forwards",
                transformBox: "fill-box" as React.CSSProperties["transformBox"],
                transformOrigin: "center",
              } : undefined}
            />
          </svg>
        </button>

        <div className="flex items-center justify-between w-full">
          <span className="text-body-sm text-foreground-muted">
            {count === 0 ? "Tap to add a heart" : `${count} heart${count === 1 ? "" : "s"} today`}
          </span>
          {identity && (
            <span className="text-label text-foreground-muted">
              {identity.emoji} {identity.name}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
