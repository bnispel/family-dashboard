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

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [alert, setAlert] = useState<{type:string;text:string} | null>(null)
  const [error, setError] = useState(false)

  // Fetch weather data for Lincoln, NE (68506)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 68506 = Lincoln, NE coordinates
        const response = await fetch(`/api/weather?lat=40.8258&lon=-96.7014`)
        if (!response.ok) throw new Error("Weather fetch failed")
        const data = await response.json()
        setWeatherData(data)
        setAlert(computeAlert(data))
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
    const handleResize = () => {
      setContainerWidth(window.innerWidth)
    }

    // Set initial width
    setContainerWidth(window.innerWidth)

    // Add resize listener
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const widgetSize = containerWidth > 500 ? "md" : "sm"

  return (
    <div style={{ background: "white", width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }} data-name="Dashboard" data-node-id="15:109">
      <WeatherWidget
        size={widgetSize}
        state={isLoading ? "loading" : error ? "error" : "default"}
        weatherData={weatherData}
        alert={alert}
      />
    </div>
  )
}
