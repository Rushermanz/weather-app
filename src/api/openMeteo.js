/**
 * Open-Meteo Swappable Weather & Geocoding Adapter
 * Queries official Open-Meteo REST API endpoints with no API key requirement.
 */

import { requestJson } from './client';

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Fetches raw forecast JSON from Open-Meteo
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} timezone
 * @param {AbortSignal} [signal]
 */
export async function fetchRawForecast(latitude, longitude, timezone = 'auto', signal) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'uv_index',
      'is_day'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max'
    ].join(','),
    timezone: timezone || 'auto'
  });

  const url = `${FORECAST_BASE}?${params.toString()}`;
  return requestJson(url, { signal, timeoutMs: 8000 });
}

/**
 * Searches for global cities via Open-Meteo Geocoding
 * @param {string} query - Min 2 chars
 * @param {AbortSignal} [signal]
 */
export async function searchCitiesApi(query, signal) {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const params = new URLSearchParams({
    name: clean,
    count: '6',
    language: 'en',
    format: 'json'
  });

  const url = `${GEOCODE_BASE}?${params.toString()}`;
  const response = await requestJson(url, { signal, timeoutMs: 8000 });

  return (response.results || []).map((item) => ({
    id: `${item.latitude.toFixed(4)}_${item.longitude.toFixed(4)}`,
    name: item.name || '',
    admin1: item.admin1 || '',
    country: item.country || '',
    country_code: item.country_code ? item.country_code.toUpperCase() : '',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || 'auto'
  }));
}

/**
 * Reverse geocodes coordinates to a recognizable location name
 * @param {number} latitude
 * @param {number} longitude
 * @param {AbortSignal} [signal]
 */
export async function reverseGeocodeApi(latitude, longitude, signal) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const data = await requestJson(url, { signal, timeoutMs: 6000 });
    return {
      name: data.city || data.locality || data.principalSubdivision || 'Detected Location',
      admin1: data.principalSubdivision || '',
      country: data.countryName || '',
      country_code: data.countryCode || '',
      latitude,
      longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
    };
  } catch {
    return {
      name: 'Local Coordinates',
      admin1: '',
      country: '',
      country_code: '',
      latitude,
      longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
    };
  }
}

/**
 * IP-based geolocation fallback when browser GPS is blocked, denied, or unavailable
 * @param {AbortSignal} [signal]
 */
export async function fetchIpLocationApi(signal) {
  try {
    const data = await requestJson('https://ipwho.is/', { signal, timeoutMs: 5000 });
    if (data && data.success !== false && data.latitude != null && data.longitude != null) {
      return {
        name: data.city || data.region || 'Current Location',
        admin1: data.region || '',
        country: data.country || '',
        country_code: data.country_code || '',
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone?.id || Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
      };
    }
  } catch (err) {
    console.warn('IP location fallback problem:', err);
  }
  return null;
}
