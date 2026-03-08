"use client"

import { useEffect, useState } from "react"
import WeatherWidget from "../components/ui/weather-widget"

type WeatherData = {
  current: {
    temp: number
    weatherCode: number
    windSpeed: number
  }
  hourly: {
    weatherCodes: number[]
    windSpeeds: number[]
  }
  daily: {
    high: number
    low: number
    tomorrowHigh: number
    tomorrowLow: number
    weatherCode: number
  }
}

// decide alert based on data
function computeAlert(data: WeatherData) {
  const current = data.current.weatherCode
  const future = data.hourly.weatherCodes.slice(1, 25) // next 24h
  const windSpeeds = data.hourly.windSpeeds

  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82]
  const stormCodes = [95, 96, 99]

  const hasRain = future.some((c) => rainCodes.includes(c))
  const hasStorm = future.some((c) => stormCodes.includes(c))

  const currentIsRain = rainCodes.includes(current)
  const currentIsStorm = stormCodes.includes(current)

  const highTemp = data.daily.high
  const highWind = windSpeeds.some((w) => w >= 20) // 45 mph

  let result: { type: string; text: string } | null = null

  // wind advisory (least important)
  if (highWind) {
    result = { type: "wind", text: "High winds today" }
  }
  // heat overrides wind
  if (highTemp >= 100) {
    result = { type: "heat", text: "Heat advisory until 8pm" }
  }
  // rain alert
  if (hasRain && !currentIsRain) {
    const rainIndex = future.findIndex((c) => rainCodes.includes(c))
    let msg = "Rain likely later"
    if (rainIndex >= 0) {
      const h = new Date()
      h.setHours(h.getHours() + rainIndex + 1)
      const hr = h.getHours()
      const ampm = hr >= 12 ? "pm" : "am"
      const display = ((hr + 11) % 12) + 1
      msg = `Rain likely around ${display}${ampm}`
    }
    result = { type: "rain", text: msg }
  }
  // storms likely vs watch
  if (!currentIsStorm && hasStorm) {
    const stormIndex = future.findIndex((c) => stormCodes.includes(c))
    if (stormIndex >= 0 && stormIndex <= 3) {
      let msg = "Storms likely later"
      const h = new Date()
      h.setHours(h.getHours() + stormIndex + 1)
      const hr = h.getHours()
      const ampm = hr >= 12 ? "pm" : "am"
      const display = ((hr + 11) % 12) + 1
      msg = `Storms likely around ${display}${ampm}`
      result = { type: "storm", text: msg }
    } else {
      result = { type: "watch", text: "Thunderstorm watch active" }
    }
  }
  // warning trumps all
  if (currentIsStorm) {
    result = { type: "warning", text: "Thunderstorm warning active" }
  }

  return result
}

type MockWeather = { current: { temp: number; weatherCode: number; windSpeed: number }; hourly: { weatherCodes: number[]; windSpeeds: number[] }; daily: { high: number; low: number; tomorrowHigh: number; tomorrowLow: number; weatherCode: number } }
const mock = (temp: number, code: number, high: number, low: number, tHigh: number, tLow: number, tCode?: number): MockWeather => ({
  current: { temp, weatherCode: code, windSpeed: 10 },
  hourly: { weatherCodes: Array(24).fill(code), windSpeeds: Array(24).fill(10) },
  daily: { high, low, tomorrowHigh: tHigh, tomorrowLow: tLow, weatherCode: tCode ?? code },
})

const TEST_SCENARIOS: Record<string, { state?: string; alert: { type: string; text: string } | null; weatherData?: MockWeather }> = {
  live: { alert: null },
  "storm-afternoon": { alert: { type: "storm", text: "Storms likely around 3pm" }, weatherData: mock(74, 0, 80, 61, 68, 55, 0) },
  "tornado-warning": { alert: { type: "tornado", text: "⚠️ Tornado Warning until 6:45pm" }, weatherData: mock(68, 95, 72, 58, 65, 52, 2) },
  "raining": { alert: null, weatherData: mock(58, 61, 63, 52, 60, 49, 0) },
  "rain-later": { alert: { type: "rain", text: "Rain likely around 2pm" }, weatherData: mock(63, 2, 70, 54, 61, 50, 61) },
  "high-winds": { alert: { type: "wind", text: "High winds today" }, weatherData: mock(57, 1, 64, 46, 60, 44, 0) },
  "heat-advisory": { alert: { type: "heat", text: "Heat advisory until 8pm" }, weatherData: mock(101, 0, 106, 88, 99, 84, 1) },
  "storm-watch": { alert: { type: "watch", text: "Thunderstorm watch active" }, weatherData: mock(71, 3, 77, 62, 73, 60, 95) },
  "storm-warning": { alert: { type: "warning", text: "Thunderstorm warning active" }, weatherData: mock(66, 95, 74, 59, 68, 54, 3) },
  "snowing": { alert: null, weatherData: mock(28, 71, 31, 22, 35, 25, 73) },
  loading: { state: "loading", alert: null },
  error: { state: "error", alert: null },
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [liveAlert, setLiveAlert] = useState<{type:string;text:string} | null>(null)
  const [error, setError] = useState(false)
  const [scenario, setScenario] = useState("live")

  // Fetch weather data for Lincoln, NE (68506)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`/api/weather?lat=40.8258&lon=-96.7014`)
        if (!response.ok) throw new Error("Weather fetch failed")
        const data = await response.json()
        setWeatherData(data)
        setLiveAlert(computeAlert(data))
      } catch (err) {
        setError(true)
        console.error("Weather fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [])

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth)
    setContainerWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const widgetSize = containerWidth > 500 ? "md" : "sm"
  const override = TEST_SCENARIOS[scenario]
  const widgetState = override?.state ?? (isLoading ? "loading" : error ? "error" : "default")
  const widgetAlert = scenario === "live" ? liveAlert : override.alert
  const widgetWeatherData = scenario === "live" ? weatherData : (override.weatherData ?? null)

  return (
    <div style={{ background: "white", width: "100%", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px" }} data-name="Dashboard" data-node-id="15:109">
      <WeatherWidget
        size={widgetSize}
        state={widgetState as "default" | "loading" | "error"}
        weatherData={widgetState === "default" ? widgetWeatherData : null}
        alert={widgetAlert}
      />
      <select
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        className="text-xs text-neutral-500 border border-neutral-200 rounded px-2 py-1 bg-white"
      >
        <option value="live">Live</option>
        <option value="storm-afternoon">Storm this afternoon</option>
        <option value="tornado-warning">Tornado warning</option>
        <option value="raining">Raining now</option>
        <option value="rain-later">Rain later</option>
        <option value="high-winds">High winds</option>
        <option value="heat-advisory">Heat advisory</option>
        <option value="storm-watch">Storm watch</option>
        <option value="storm-warning">Thunderstorm warning</option>
        <option value="snowing">Snowing now</option>
        <option value="loading">Loading</option>
        <option value="error">Error</option>
      </select>
    </div>
  )
}
