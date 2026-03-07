"use client"

import { useEffect, useState } from "react"

// Current weather icon (sun)
const imgVector = "http://localhost:3845/assets/e910cbf0be4fb83c5e14c18c294f3b11e9b4a989.svg"
// Tomorrow icon
const imgVector1 = "http://localhost:3845/assets/f11c475c3ccd05fec82609a9881cb5639c21e40d.svg"
// Loading icon (gear)
const imgVector2 = "http://localhost:3845/assets/cc18ce8661aeb2dbe65bcc27b947f43b64a1e084.svg"
// Error icon (cloud alert)
const imgError = "http://localhost:3845/assets/d740867fcf3db0a15a904edbfe6182a65274b0ff.svg"

// Weather icon set
const weatherSunny = "http://localhost:3845/assets/6897d0f0d6f31ce895ea515ad41f042abe6ae26d.svg"
const weatherRain = "http://localhost:3845/assets/ac2dd532705a6d25a58fb30c83e88cd04c72af0e.svg"
const weatherPartlyCloudy = "http://localhost:3845/assets/010d810e2333a1a7a9968d46f93bb783158bdbdc.svg"
const weatherCloudy = "http://localhost:3845/assets/90fe01d36b898ca15007fd1716856bef15ff19a9.svg"
const weatherStormy = "http://localhost:3845/assets/23d8877148d964632e9e14fba4ab35825e4ff908.svg"
const weatherSnow = "http://localhost:3845/assets/f296750f2f6605e5f20505a566c82a77c1538267.svg"

// Map WMO weather codes to icons
function getWeatherIcon(weatherCode: number): string {
  if (weatherCode === 0) return weatherSunny // Clear sky
  if (weatherCode === 1 || weatherCode === 2) return weatherPartlyCloudy // Mainly clear, partly cloudy
  if (weatherCode === 3) return weatherCloudy // Overcast
  if (weatherCode === 45 || weatherCode === 48) return weatherCloudy // Foggy
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return weatherRain // Drizzle and rain
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return weatherSnow // Snow
  if ([95, 96, 99].includes(weatherCode)) return weatherStormy // Thunderstorm
  return weatherSunny // Default to sunny
}

type WeatherWidgetProps = {
  className?: string
  size?: "md" | "sm"
  state?: "default" | "rain-alert" | "loading" | "error"
  style?: React.CSSProperties
  weatherData?: {
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
  } | null
  alert?: { type: string; text: string } | null
}

export function WeatherWidget({ className, size = "sm", state = "default", style, weatherData, alert }: WeatherWidgetProps) {
  const [dotCount, setDotCount] = useState(1)
  const isLoading = state === "loading"
  const isDefault = state === "default"
  const isError = state === "error"
  const isMd = size === "md"

  // Determine if weather is sunny (weather code 0)
  const isSunny = weatherData?.current.weatherCode === 0
  const currentWeatherIcon = weatherData ? getWeatherIcon(weatherData.current.weatherCode) : weatherSunny

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1))
    }, 400)

    return () => clearInterval(interval)
  }, [isLoading])

  const baseGap = isError ? "4px" : isLoading || !isMd ? "8px" : "12px"

  // helper to render alert badge
  const renderAlert = () => {
    if (!alert) return null
    let bg = "#dbeafe" // default blue100
    let color = "#1e40af" // blue800
    switch (alert.type) {
      case "wind":
        bg = "#eff6ff" // blue50
        color = "#1d4ed8" // blue700
        break
      case "heat":
        bg = "#fed7aa" // orange200
        color = "#9a3412" // orange800
        break
      case "rain":
      case "storm":
        bg = "#dbeafe"
        color = "#1e40af"
        break
      case "watch":
        bg = "#e5e7eb" // gray200
        color = "#4b5563" // gray600
        break
      case "warning":
        bg = "#f87171" // red400
        color = "white"
        break
      default:
        break
    }
    return (
      <div
        style={{
          background: bg,
          display: "flex",
          gap: "4px",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px 8px",
          borderRadius: "8px",
          width: "100%",
          flexBasis: "100%",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color,
            textAlign: "center",
            lineHeight: "16px",
            whiteSpace: "nowrap",
          }}
        >
          {alert.text}
        </div>
      </div>
    )
  }

  const defaultStyle: React.CSSProperties = {
    background: "white",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    flexDirection: isMd ? "row" : "column",
    gap: baseGap,
    alignItems: isMd ? "center" : "center",
    justifyContent: isMd ? "center" : "center",
    width: isMd ? "452px" : "296px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)",
    minHeight: isLoading || isError ? "130px" : "auto",
  }

  return (
    <div
      className={className}
      style={{ ...defaultStyle, ...style }}
      data-node-id={isLoading ? "14:46" : "14:12"}
    >
      {isDefault && (
        <>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: isMd ? "center" : "flex-start",
                flex: isMd ? "1" : "auto",
              }}
              data-name="weather-current"
              data-node-id="13:10"
            >
            <div
              style={{
                width: isMd ? "76px" : "65px",
                height: isMd ? "80px" : "68px",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0,
              }}
              data-name="icon-current"
              data-node-id="11:1385"
            >
              <img
                alt="weather"
                src={currentWeatherIcon}
                className={isSunny ? "sun-icon-rotating" : ""}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: isMd ? "row" : "column",
                alignItems: isMd ? "center" : "flex-start",
                gap: isMd ? "12px" : "0",
              }}
              data-name="temp-stats"
              data-node-id="12:65"
            >
              <div
                style={{
                  fontSize: isMd ? "48px" : "48px",
                  fontWeight: "600",
                  color: "#0a0a0a",
                  lineHeight: "48px",
                }}
                data-node-id="11:1392"
              >
                {weatherData?.current.temp}°
              </div>
              <div
                style={{
                  fontSize: isMd ? "18px" : "14px",
                  color: "#737373",
                  lineHeight: isMd ? "27px" : "20px",
                }}
                data-node-id="11:1433"
              >
                <span style={{ color: "#a3a3a3" }}>↑</span>
                {weatherData?.daily.high}° <span style={{ color: "#a3a3a3" }}>↓</span>
                {weatherData?.daily.low}°
              </div>
            </div>
          </div>
          {alert && (
            <div style={{ width: "100%" }}>
              {renderAlert()}
            </div>
          )}
          </div>
          <div
            style={{
              borderLeft: isMd ? "1px solid #e5e5e5" : "none",
              borderTop: isMd ? "none" : "1px solid #e5e5e5",
              display: "flex",
              flexDirection: isMd ? "column" : "row",
              gap: "4px",
              alignItems: isMd ? "center" : "center",
              justifyContent: isMd ? "center" : "center",
              paddingTop: isMd ? "0" : "8px",
              paddingLeft: isMd ? "20px" : "0",
              paddingRight: isMd ? "20px" : "0",
              width: isMd ? "auto" : "100%",
            }}
            data-name="weather-tomorrow"
            data-node-id="12:73"
          >
            <div
              style={{
                fontSize: isMd ? "14px" : "12px",
                color: "#a3a3a3",
                textAlign: "center",
                whiteSpace: "nowrap",
                lineHeight: isMd ? "20px" : "16px",
              }}
              data-node-id="12:77"
            >
              Tomorrow
            </div>
            <div
              style={{
                width: isMd ? "20px" : "14px",
                height: isMd ? "22px" : "15px",
                overflow: "hidden",
                position: "relative",
              }}
              data-name="icon-tomorrow"
              data-node-id="13:79"
            >
              <img alt="tomorrow" src={imgVector1} style={{ width: "100%", height: "100%" }} />
            </div>
            <div
              style={{
                fontSize: isMd ? "16px" : "12px",
                color: "#a3a3a3",
                textAlign: "center",
                whiteSpace: "nowrap",
                lineHeight: isMd ? "24px" : "16px",
              }}
              data-node-id="13:78"
            >
              ↑{weatherData?.daily.tomorrowHigh}° ↓{weatherData?.daily.tomorrowLow}°
            </div>
          </div>
        </>
      )}
      {isLoading && (
        <>
          <div
            style={{
              width: isMd ? "76px" : "65px",
              height: isMd ? "80px" : "68px",
              overflow: "hidden",
              position: "relative",
            }}
            data-name="icon-loading"
            data-node-id="14:48"
          >
            <img
              alt="loading"
              src={imgVector2}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </div>
          <div
            style={{
              fontSize: isMd ? "16px" : "12px",
              color: "#a3a3a3",
              textAlign: "center",
              whiteSpace: "nowrap",
              lineHeight: isMd ? "24px" : "16px",
            }}
            data-node-id="14:54"
          >
            Loading weather{".".repeat(dotCount)}
          </div>
        </>
      )}
      {isError && (
        <>
          <div
            style={{
              width: isMd ? "76px" : "65px",
              height: isMd ? "80px" : "68px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              alt="error"
              src={imgError}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </div>
          <div
            style={{
              fontSize: isMd ? "16px" : "12px",
              color: "#ef4444",
              textAlign: "center",
              whiteSpace: "nowrap",
              lineHeight: isMd ? "24px" : "16px",
            }}
            data-node-id="14:error"
          >
            Weather Unavailable
          </div>
        </>
      )}
    </div>
  )
}

export default WeatherWidget
