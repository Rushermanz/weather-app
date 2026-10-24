/**
 * Meteorological State Parser & Validator
 * Converts raw JSON from weather API into a strongly typed, clean state object:
 * { location, current, hourly[24], daily[7], units, fetchedAt }
 * Provides safe fallbacks for every field to prevent runtime crashes.
 */

/**
 * Calculates dew point temperature using Magnus-Tetens formula
 */
export function calculateDewPoint(tempC, humidity) {
  if (tempC == null || humidity == null) return null;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(Math.max(1, humidity) / 100.0);
  return Number(((b * alpha) / (a - alpha)).toFixed(1));
}

/**
 * Maps WMO weather code to standard descriptive phrase
 */
export function getWmoDescription(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Atmospheric disturbance';
}

/**
 * Parses raw JSON payload into normalized application weather state
 * @param {object} raw - Raw API response
 * @param {object} locationMetadata - Location details
 * @returns {object} Clean weather state
 */
export function parseWeatherPayload(raw, locationMetadata = {}) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Malformed meteorological telemetry payload.');
  }

  const timezone = raw.timezone || locationMetadata.timezone || 'UTC';
  const currentRaw = raw.current || {};
  const hourlyRaw = raw.hourly || {};
  const dailyRaw = raw.daily || {};

  // Clean location object
  const location = {
    name: locationMetadata.name || 'Current Station',
    admin1: locationMetadata.admin1 || '',
    country: locationMetadata.country || '',
    country_code: locationMetadata.country_code || '',
    latitude: raw.latitude ?? locationMetadata.latitude ?? 0,
    longitude: raw.longitude ?? locationMetadata.longitude ?? 0,
    timezone
  };

  // Safe numeric fallbacks
  const temp = typeof currentRaw.temperature_2m === 'number' ? currentRaw.temperature_2m : 20.0;
  const humidity = typeof currentRaw.relative_humidity_2m === 'number' ? currentRaw.relative_humidity_2m : 50;

  // Clean current state
  const current = {
    temperature: temp,
    apparentTemperature: currentRaw.apparent_temperature ?? temp,
    weatherCode: currentRaw.weather_code ?? 0,
    weatherDescription: getWmoDescription(currentRaw.weather_code ?? 0),
    isDay: currentRaw.is_day === 0 ? 0 : 1,
    humidity,
    dewPoint: calculateDewPoint(temp, humidity) ?? temp,
    windSpeed: currentRaw.wind_speed_10m ?? 0,
    windDirection: currentRaw.wind_direction_10m ?? 0,
    windGusts: currentRaw.wind_gusts_10m ?? currentRaw.wind_speed_10m ?? 0,
    pressure: currentRaw.surface_pressure ?? 1013.2,
    precipitation: currentRaw.precipitation ?? 0,
    cloudCover: currentRaw.cloud_cover ?? 0
  };

  // Build clean 24-hour sequence
  const hourlyTimes = Array.isArray(hourlyRaw.time) ? hourlyRaw.time : [];
  const now = new Date();
  let startIndex = 0;

  // Align with current hour
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = new Date(hourlyTimes[i]);
    if (t >= now) {
      startIndex = Math.max(0, i - 1);
      break;
    }
  }

  const hourly = [];
  const sliceEnd = Math.min(hourlyTimes.length, startIndex + 24);

  for (let i = startIndex; i < sliceEnd; i++) {
    const timeIso = hourlyTimes[i];
    const date = new Date(timeIso);
    const isFirst = i === startIndex;

    let displayHour = '';
    try {
      displayHour = isFirst
        ? 'NOW'
        : new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: true
          }).format(date).toUpperCase();
    } catch {
      displayHour = isFirst ? 'NOW' : `${date.getHours()}:00`;
    }

    hourly.push({
      timeIso,
      timestamp: date.getTime(),
      displayHour,
      temperature: hourlyRaw.temperature_2m?.[i] ?? temp,
      apparentTemperature: hourlyRaw.apparent_temperature?.[i] ?? temp,
      weatherCode: hourlyRaw.weather_code?.[i] ?? 0,
      precipProbability: hourlyRaw.precipitation_probability?.[i] ?? 0,
      precipitation: hourlyRaw.precipitation?.[i] ?? 0,
      windSpeed: hourlyRaw.wind_speed_10m?.[i] ?? 0,
      uvIndex: hourlyRaw.uv_index?.[i] ?? 0,
      isDay: hourlyRaw.is_day?.[i] === 0 ? 0 : 1
    });
  }

  // Build clean 7-day outlook
  const dailyTimes = Array.isArray(dailyRaw.time) ? dailyRaw.time : [];
  const daily = [];
  const daysLimit = Math.min(7, dailyTimes.length);

  for (let d = 0; d < daysLimit; d++) {
    const dateIso = dailyTimes[d];
    const date = new Date(dateIso);
    const isToday = d === 0;

    let displayDay = '';
    let displayDate = '';
    try {
      displayDay = isToday
        ? 'TODAY'
        : new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(date).toUpperCase();
      displayDate = new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'short', day: 'numeric' }).format(date);
    } catch {
      displayDay = isToday ? 'TODAY' : 'DAY';
      displayDate = date.toLocaleDateString();
    }

    daily.push({
      dateIso,
      displayDay,
      displayDate,
      tempMax: dailyRaw.temperature_2m_max?.[d] ?? temp,
      tempMin: dailyRaw.temperature_2m_min?.[d] ?? temp,
      weatherCode: dailyRaw.weather_code?.[d] ?? 0,
      weatherDescription: getWmoDescription(dailyRaw.weather_code?.[d] ?? 0),
      precipProbabilityMax: dailyRaw.precipitation_probability_max?.[d] ?? 0,
      precipSum: dailyRaw.precipitation_sum?.[d] ?? 0,
      uvIndexMax: dailyRaw.uv_index_max?.[d] ?? 0,
      sunrise: dailyRaw.sunrise?.[d] || null,
      sunset: dailyRaw.sunset?.[d] || null,
      windSpeedMax: dailyRaw.wind_speed_10m_max?.[d] ?? 0
    });
  }

  // Safe fallback if daily array was empty
  if (daily.length === 0) {
    daily.push({
      dateIso: new Date().toISOString(),
      displayDay: 'TODAY',
      displayDate: 'Current',
      tempMax: temp + 2,
      tempMin: temp - 2,
      weatherCode: current.weatherCode,
      weatherDescription: current.weatherDescription,
      precipProbabilityMax: 0,
      precipSum: 0,
      uvIndexMax: 3,
      sunrise: null,
      sunset: null,
      windSpeedMax: current.windSpeed
    });
  }

  return {
    location,
    current,
    hourly,
    daily,
    units: {
      temperature: '°C',
      wind: 'km/h',
      pressure: 'hPa',
      precipitation: 'mm'
    },
    fetchedAt: Date.now()
  };
}
