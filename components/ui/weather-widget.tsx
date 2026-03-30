"use client"

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
    "text-warm-gray-500 text-center whitespace-nowrap",
    "text-body-sm leading-body-sm"
  )

  return (
    <div
      className={cn(
        "p-3 flex items-center justify-center",
        isMd ? "flex-row w-[452px]" : "flex-col w-full",
        isDefault ? (isMd ? "gap-3" : "gap-2") : "gap-2",
        !isMd && (isLoading || isError) && "min-h-[130px]",
        className
      )}
      style={style}
    >
      {isDefault && (
        <>
          <div className={cn("flex flex-col w-full gap-2", !isMd && "items-center")}>
            <div className={cn("flex gap-3", isMd ? "items-center flex-1" : "items-center justify-center")}>
              <div className={cn("overflow-hidden relative flex-shrink-0", iconSizeClass)}>
                <CurrentWeatherIcon className={cn(isSunny && "sun-icon-rotating")} />
              </div>
              <div className={cn("flex", isMd ? "flex-row items-center gap-3" : "flex-col items-center")}>
                <div className="text-[56px] font-medium text-foreground leading-heading-1 tracking-heading-1">
                  {weatherData?.current.temp}°
                </div>
                <div className="text-warm-gray-600 text-[22px] leading-[29px]">
                  <span className="text-foreground-muted">↑</span>
                  {weatherData?.daily.high}° <span className="text-foreground-muted">↓</span>
                  {weatherData?.daily.low}°
                </div>
              </div>
            </div>
            {alert && <div className="w-full">{renderAlert()}</div>}
          </div>
          <div
            className={cn(
              "flex gap-1 items-center justify-center",
              isMd ? "flex-col border-l border-border px-5" : "flex-row border-t border-border pt-2 w-full"
            )}
          >
            <div className={cn("text-foreground-muted text-center whitespace-nowrap", "text-body-sm leading-body-sm")}>
              Tomorrow
            </div>
            <div className={cn("overflow-hidden relative", isMd ? "w-5 h-[22px]" : "w-[22px] h-[24px]")}>
              <TomorrowWeatherIcon />
            </div>
            <div className={secondaryTextClass}>
              ↑{weatherData?.daily.tomorrowHigh}° ↓{weatherData?.daily.tomorrowLow}°
            </div>
          </div>
        </>
      )}
      {isLoading && (
        <div className={cn("flex flex-col items-center gap-0.5", isMd && "flex-1 justify-center")}>
          <div className={cn("overflow-hidden relative shrink-0", iconSizeClass)}>
            <LoadingIcon />
          </div>
          <div className={secondaryTextClass}>
            Loading weather<span className="loading-dot">.</span><span className="loading-dot loading-dot-2">.</span><span className="loading-dot loading-dot-3">.</span>
          </div>
        </div>
      )}
      {isError && (
        <div className={cn("flex flex-col items-center gap-0.5", isMd && "flex-1 justify-center")}>
          <div className={cn("overflow-hidden relative shrink-0", iconSizeClass)}>
            <ErrorIcon />
          </div>
          <div className={cn("text-warm-gray-500 text-center whitespace-nowrap", isMd ? "text-base leading-6" : "text-xs leading-4")}>
            Weather Unavailable
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherWidget
