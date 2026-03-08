"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  SunnyIcon, LoadingIcon, ErrorIcon, TornadoIcon, WindIcon,
  getWeatherIconComponent,
} from "./weather-icons"

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

  const isSunny = weatherData?.current.weatherCode === 0 && alert?.type !== "tornado" && alert?.type !== "wind"
  const CurrentWeatherIcon =
    alert?.type === "tornado" ? TornadoIcon :
    alert?.type === "wind" ? WindIcon :
    weatherData ? getWeatherIconComponent(weatherData.current.weatherCode) : SunnyIcon
  const TomorrowWeatherIcon = weatherData
    ? getWeatherIconComponent(weatherData.daily.weatherCode)
    : SunnyIcon

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1))
    }, 400)

    return () => clearInterval(interval)
  }, [isLoading])

  const alertColorClasses: Record<string, string> = {
    wind: "bg-blue-50 text-blue-700",
    heat: "bg-orange-200 text-orange-800",
    rain: "bg-blue-100 text-blue-800",
    storm: "bg-blue-100 text-blue-800",
    watch: "bg-gray-200 text-gray-600",
    warning: "bg-red-400 text-white",
    tornado: "bg-red-400 text-white",
  }

  const renderAlert = () => {
    if (!alert) return null
    const colorClass = alertColorClasses[alert.type] ?? "bg-blue-100 text-blue-800"
    return (
      <div className={cn("flex gap-1 items-center justify-center py-0.5 px-2 rounded-lg w-full", colorClass)}>
        <div className="text-xs font-semibold text-center leading-4 whitespace-nowrap">
          {alert.text}
        </div>
      </div>
    )
  }

  const iconSizeClass = isMd ? "w-[76px] h-[80px]" : "w-[65px] h-[68px]"
  const secondaryTextClass = cn(
    "text-neutral-400 text-center whitespace-nowrap",
    isMd ? "text-base leading-6" : "text-xs leading-4"
  )

  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 rounded-lg p-3 flex items-center justify-center shadow-sm",
        isMd ? "flex-row w-[452px]" : "flex-col w-[296px]",
        isDefault ? (isMd ? "gap-3" : "gap-2") : "gap-2",
        !isMd && (isLoading || isError) && "min-h-[130px]",
        className
      )}
      style={style}
      data-node-id={isLoading ? "14:46" : "14:12"}
    >
      {isDefault && (
        <>
          <div className={cn("flex flex-col w-full gap-2", !isMd && "items-center")}>
            <div
              className={cn("flex gap-3", isMd ? "items-center flex-1" : "items-start")}
              data-name="weather-current"
              data-node-id="13:10"
            >
              <div
                className={cn("overflow-hidden relative flex-shrink-0", iconSizeClass)}
                data-name="icon-current"
                data-node-id="11:1385"
              >
                <CurrentWeatherIcon className={cn(isSunny && "sun-icon-rotating")} />
              </div>
              <div
                className={cn("flex", isMd ? "flex-row items-center gap-3" : "flex-col items-start")}
                data-name="temp-stats"
                data-node-id="12:65"
              >
                <div className="text-5xl font-semibold text-neutral-950 leading-[48px]" data-node-id="11:1392">
                  {weatherData?.current.temp}°
                </div>
                <div
                  className={cn("text-neutral-500", isMd ? "text-lg leading-[27px]" : "text-sm leading-5")}
                  data-node-id="11:1433"
                >
                  <span className="text-neutral-400">↑</span>
                  {weatherData?.daily.high}° <span className="text-neutral-400">↓</span>
                  {weatherData?.daily.low}°
                </div>
              </div>
            </div>
            {alert && <div className="w-full">{renderAlert()}</div>}
          </div>
          <div
            className={cn(
              "flex gap-1 items-center justify-center",
              isMd ? "flex-col border-l border-neutral-200 px-5" : "flex-row border-t border-neutral-200 pt-2 w-full"
            )}
            data-name="weather-tomorrow"
            data-node-id="12:73"
          >
            <div
              className={cn("text-neutral-400 text-center whitespace-nowrap", isMd ? "text-sm leading-5" : "text-xs leading-4")}
              data-node-id="12:77"
            >
              Tomorrow
            </div>
            <div
              className={cn("overflow-hidden relative", isMd ? "w-5 h-[22px]" : "w-[14px] h-[15px]")}
              data-name="icon-tomorrow"
              data-node-id="13:79"
            >
              <TomorrowWeatherIcon />
            </div>
            <div className={secondaryTextClass} data-node-id="13:78">
              ↑{weatherData?.daily.tomorrowHigh}° ↓{weatherData?.daily.tomorrowLow}°
            </div>
          </div>
        </>
      )}
      {isLoading && (
        <div className={cn("flex flex-col items-center gap-0.5", isMd && "flex-1 justify-center")}>
          <div className={cn("overflow-hidden relative shrink-0", iconSizeClass)} data-name="icon-loading" data-node-id="14:48">
            <LoadingIcon />
          </div>
          <div className={secondaryTextClass} data-node-id="14:54">
            Loading weather{".".repeat(dotCount)}
          </div>
        </div>
      )}
      {isError && (
        <div className={cn("flex flex-col items-center gap-0.5", isMd && "flex-1 justify-center")}>
          <div className={cn("overflow-hidden relative shrink-0", iconSizeClass)}>
            <ErrorIcon />
          </div>
          <div
            className={cn("text-red-500 text-center whitespace-nowrap", isMd ? "text-base leading-6" : "text-xs leading-4")}
            data-node-id="14:error"
          >
            Weather Unavailable
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherWidget
