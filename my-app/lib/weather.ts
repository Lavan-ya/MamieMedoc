// Current weather for Jeanne's town, from Open-Meteo (free, no API key).
// Only the town's coordinates are sent; nothing about Jeanne.

/** Jeanne lives in Paris (the patient record has no address yet). */
export const JEANNE_TOWN = { name: "Paris", latitude: 48.8566, longitude: 2.3522 };

export type Weather = {
  temperature: number; // °C, rounded
  min: number;
  max: number;
  condition: string; // "Foggy"
  icon: string; // Material Symbols name
  city: string;
};

/** WMO weather codes (https://open-meteo.com/en/docs) -> words and icon. */
function describe(code: number, isDay: boolean) {
  if (code === 0) return { condition: isDay ? "Sunny" : "Clear night", icon: isDay ? "wb_sunny" : "bedtime" };
  if (code <= 2) return { condition: "Partly cloudy", icon: isDay ? "partly_cloudy_day" : "partly_cloudy_night" };
  if (code === 3) return { condition: "Cloudy", icon: "cloud" };
  if (code === 45 || code === 48) return { condition: "Foggy", icon: "foggy" };
  if (code >= 51 && code <= 57) return { condition: "Drizzle", icon: "rainy_light" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { condition: "Rainy", icon: "rainy" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { condition: "Snowy", icon: "weather_snowy" };
  if (code >= 95) return { condition: "Thunderstorm", icon: "thunderstorm" };
  return { condition: "Cloudy", icon: "cloud" };
}

type OpenMeteoResponse = {
  current: { temperature_2m: number; weather_code: number; is_day: number };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
};

/** null when the weather service is unreachable: better no weather than a wrong one. */
export async function getWeather(town = JEANNE_TOWN): Promise<Weather | null> {
  const params = new URLSearchParams({
    latitude: String(town.latitude),
    longitude: String(town.longitude),
    current: "temperature_2m,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "1",
    timezone: "Europe/Paris",
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      // Open-Meteo updates every 15 minutes; share one answer between visits.
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as OpenMeteoResponse;
    return {
      temperature: Math.round(data.current.temperature_2m),
      min: Math.round(data.daily.temperature_2m_min[0]),
      max: Math.round(data.daily.temperature_2m_max[0]),
      ...describe(data.current.weather_code, data.current.is_day === 1),
      city: town.name,
    };
  } catch {
    return null;
  }
}
