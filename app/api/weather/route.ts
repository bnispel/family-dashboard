export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return Response.json({ error: "Latitude and longitude required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=ms&timezone=auto`
    )

    if (!response.ok) {
      throw new Error("Weather API error")
    }

    const data = await response.json()

    return Response.json({
      current: {
        temp: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        windSpeed: data.current.wind_speed_10m,
      },
      hourly: {
        weatherCodes: data.hourly.weather_code,
        windSpeeds: data.hourly.wind_speed_10m,
      },
      daily: {
        high: Math.round(data.daily.temperature_2m_max[0]),
        low: Math.round(data.daily.temperature_2m_min[0]),
        tomorrowHigh: Math.round(data.daily.temperature_2m_max[1]),
        tomorrowLow: Math.round(data.daily.temperature_2m_min[1]),
        weatherCode: data.daily.weather_code[0],
      },
    })
  } catch (error) {
    return Response.json({ error: "Failed to fetch weather" }, { status: 500 })
  }
}
