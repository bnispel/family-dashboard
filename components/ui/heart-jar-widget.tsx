"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"

// Exact path from /public design — do not approximate
const HEART_PATH =
  "M70.11.01C.09-1.25-64.71,108.26,124.07,221.79c.21-.37,1-.37,1.21,0C320.15,104.59,244.83-8.29,172.47.49c-28.21,3.43-41.52,19.08-47.79,32.55C118.41,19.58,105.09,3.92,76.89.49c-2.26-.27-4.52-.44-6.78-.48Z"

const VB_W = 249.36
const VB_H = 221.79
const HCX = VB_W / 2   // 124.68 — heart bounding-box center x
const HCY = VB_H / 2   // 110.895 — heart bounding-box center y
const RENDER_W = 220
const PX = RENDER_W / VB_W  // ~0.8824 — viewBox units → CSS px

const COLORS = [
  "#f42f2f", "#e8294b", "#ff5252", "#d81b60",
  "#ff6090", "#c62828", "#ef5350", "#e53935", "#f06292",
]

// Rows go all the way to the heart's actual edge — clipPath handles containment
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
const LS_KEY = "heart-jar-v1"

function todayCT() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
}

type Heart = {
  id: string
  tx: number      // final translate x (viewBox units)
  ty: number      // final translate y (viewBox units)
  s: number       // scale (0.15–0.21)
  rot: number     // rotation degrees, applied around heart's own center
  color: string
  driftX: number  // spawn x offset from landing (viewBox units)
  spawnDY: number // spawn y offset from landing (viewBox units, negative = above)
  settled: boolean
  delay: number   // animation delay in seconds
}

function loadHearts(): Heart[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const p = JSON.parse(raw)
    if (p.date !== todayCT()) return []
    return (p.hearts as Heart[]).map((h, i) => ({ ...h, settled: false, delay: 0.4 + i * 0.12 }))
  } catch { return [] }
}

function saveHearts(hearts: Heart[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ date: todayCT(), hearts }))
  } catch {}
}

export default function HeartJarWidget() {
  const [hearts, setHearts] = useState<Heart[]>([])
  const [glowKey, setGlowKey] = useState(0)
  const [glowing, setGlowing] = useState(false)
  const [beating, setBeating] = useState(false)
  const [beatKey, setBeatKey] = useState(0)
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartsRef = useRef<Heart[]>([])
  const slotRef = useRef(0)

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
    const saved = loadHearts()
    setHearts(saved)
    heartsRef.current = saved
    slotRef.current = saved.length % SLOTS.length
    scheduleIdle()
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [])

  const addHeart = useCallback(() => {
    const slot = SLOTS[slotRef.current % SLOTS.length]
    slotRef.current++

    const s = 0.15 + Math.random() * 0.06
    const cx = slot.x + (Math.random() - 0.5) * slot.halfW * 2
    const cy = slot.y + (Math.random() - 0.5) * 7
    const tx = cx - HCX * s
    const ty = cy - HCY * s
    const rot = (Math.random() - 0.5) * 22
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]

    // Spawn near top-center interior
    const spawnCX = VB_W / 2 + (Math.random() - 0.5) * 30
    const spawnCY = 55 + Math.random() * 15
    const driftX = (spawnCX - HCX * s) - tx
    const spawnDY = (spawnCY - HCY * s) - ty  // negative

    const heart: Heart = {
      id: `h${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
      tx, ty, s, rot, color, driftX, spawnDY, settled: false, delay: 0,
    }

    setHearts(prev => {
      const next = [...prev, heart]
      heartsRef.current = next
      saveHearts(next)
      return next
    })

    setBeating(false)
    scheduleIdle()
    setGlowing(true)
    setGlowKey(k => k + 1)
    if (glowTimer.current) clearTimeout(glowTimer.current)
    glowTimer.current = setTimeout(() => setGlowing(false), 900)
  }, [])

  // CSS keyframes for falling hearts — position/scale only (rotation is on inner <path>)
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

          {/* Stroke-based glow — only rendered after a tap */}
          {glowing && (
            <path
              key={glowKey}
              d={HEART_PATH}
              fill="none"
              stroke="#ff8fa3"
              strokeWidth={28}
              filter="url(#hj-glow-f)"
              style={{ animation: "hj-glow 0.9s ease-out forwards", opacity: 0 }}
            />
          )}

          {/* Small hearts clipped inside */}
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

          {/* Large heart — stroke only, beats on idle */}
          <path
            key={beatKey}
            d={HEART_PATH}
            fill="none"
            stroke="#f42f2f"
            strokeWidth={8}
            style={beating ? {
              animation: "hj-beat 1.8s ease-in-out forwards",
              transformBox: "fill-box" as React.CSSProperties["transformBox"],
              transformOrigin: "center",
            } : undefined}
          />
        </svg>
      </button>

      <span className="text-body-sm text-foreground-muted">
        {count === 0
          ? "Tap to add a heart"
          : `${count} heart${count === 1 ? "" : "s"} today`}
      </span>
    </div>
  )
}
