import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRawForecast, reverseGeocodeApi, fetchIpLocationApi } from '../api/openMeteo';
import { parseWeatherPayload } from '../utils/parser';
import { CacheManager } from '../utils/cache';
import { applyThemeToDocument, resolveThemeState } from '../utils/theme';

const DEFAULT_CITY = {
  name: 'London',
  admin1: 'England',
  country: 'United Kingdom',
  country_code: 'GB',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London'
};

export function useWeather() {
  const initialSettings = CacheManager.getSettings();
  const [unit, setUnit] = useState(initialSettings.unit || 'C');

  const [currentCity, setCurrentCity] = useState(() => {
    const recent = CacheManager.getRecentCities();
    return recent.length > 0 ? recent[0] : null;
  });

  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [cacheAgeMinutes, setCacheAgeMinutes] = useState(0);

  const abortRef = useRef(null);
  const hasGeolocatedRef = useRef(false);

  // Sync unit changes to storage
  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next = prev === 'C' ? 'F' : 'C';
      CacheManager.saveSettings({ unit: next });
      return next;
    });
  }, []);

  // Update "Updated X min ago" counter
  useEffect(() => {
    const updateAge = () => {
      if (cacheTimestamp) {
        const mins = Math.max(0, Math.floor((Date.now() - cacheTimestamp) / 60000));
        setCacheAgeMinutes(mins);
      }
    };
    updateAge();
    const interval = setInterval(updateAge, 30000);
    return () => clearInterval(interval);
  }, [cacheTimestamp]);

  // Primary weather fetch routine with Stale-While-Revalidate and AbortController
  const fetchWeather = useCallback(async (city, isManualRefresh = false) => {
    if (!city || city.latitude == null || city.longitude == null) return;

    // Abort previous flight
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // 1. Inspect Cache
    const cached = CacheManager.getWeather(city.latitude, city.longitude);

    if (cached && !isManualRefresh) {
      setWeather(cached.data);
      setCacheTimestamp(cached.cachedAt);
      setIsLoading(false);

      // If fresh, no immediate re-fetch needed
      if (!cached.isStale) {
        setErrorBanner(null);
        const theme = resolveThemeState(cached.data.current.weatherCode, cached.data.current.isDay);
        applyThemeToDocument(theme);
        return;
      }

      // If stale, show cached data immediately and refresh silently in background
      setIsRefreshing(true);
    } else {
      if (!weather) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
    }

    try {
      setErrorBanner(null);
      const raw = await fetchRawForecast(city.latitude, city.longitude, city.timezone, controller.signal);
      const parsed = parseWeatherPayload(raw, city);

      // Cache the fresh payload
      CacheManager.setWeather(city.latitude, city.longitude, parsed);
      CacheManager.addRecentCity(city);

      setWeather(parsed);
      setCacheTimestamp(Date.now());
      setCacheAgeMinutes(0);

      // Apply theme
      const theme = resolveThemeState(parsed.current.weatherCode, parsed.current.isDay);
      applyThemeToDocument(theme);
    } catch (err) {
      if (err.type === 'ABORTED') {
        return; // Superseded by a newer request, do nothing
      }

      console.warn('Weather fetch problem:', err);

      // Construct non-destructive banner
      let bannerType = 'GENERIC';
      let message = err.message || 'Unable to load meteorological data.';

      if (err.type === 'OFFLINE' || !navigator.onLine) {
        bannerType = 'OFFLINE';
        message = 'You are currently offline. Showing cached report.';
      } else if (err.type === 'RATE_LIMITED') {
        bannerType = 'RATE_LIMITED';
        message = `Rate limit reached. Retrying automatically in ${err.retryAfterSec || 60}s.`;
      } else if (err.type === 'NOT_FOUND') {
        bannerType = 'NOT_FOUND';
        message = `Location "${city.name}" telemetry unavailable.`;
      }

      setErrorBanner({
        type: bannerType,
        message,
        retryAfterSec: err.retryAfterSec || 0,
        city
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [weather]);

  // First launch Geolocation fallback
  useEffect(() => {
    if (hasGeolocatedRef.current) return;
    hasGeolocatedRef.current = true;

    if (currentCity) {
      fetchWeather(currentCity);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const geoCity = await reverseGeocodeApi(lat, lon);
            setCurrentCity(geoCity);
            fetchWeather(geoCity);
          } catch {
            setCurrentCity(DEFAULT_CITY);
            fetchWeather(DEFAULT_CITY);
          }
        },
        () => {
          // Denied or unavailable: gracefully fall back to default
          setCurrentCity(DEFAULT_CITY);
          fetchWeather(DEFAULT_CITY);
        },
        { timeout: 7000, enableHighAccuracy: false }
      );
    } else {
      setCurrentCity(DEFAULT_CITY);
      fetchWeather(DEFAULT_CITY);
    }
  }, [currentCity, fetchWeather]);

  const [isLocating, setIsLocating] = useState(false);

  const detectCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setErrorBanner(null);

    const tryIpFallback = async () => {
      try {
        const ipLocation = await fetchIpLocationApi();
        if (ipLocation) {
          setCurrentCity(ipLocation);
          await fetchWeather(ipLocation);
          return true;
        }
      } catch (e) {
        console.warn('IP fallback failed:', e);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const recovered = await tryIpFallback();
      if (!recovered) {
        setErrorBanner({
          type: 'GENERIC',
          message: 'Location services unavailable in this browser.'
        });
      }
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const geoCity = await reverseGeocodeApi(lat, lon);
          setCurrentCity(geoCity);
          await fetchWeather(geoCity);
        } catch (err) {
          console.warn('Reverse geocode problem, using coordinates:', err);
          const fallbackCity = {
            name: 'Local Station',
            admin1: '',
            country: '',
            country_code: '',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
          };
          setCurrentCity(fallbackCity);
          await fetchWeather(fallbackCity);
        } finally {
          setIsLocating(false);
        }
      },
      async () => {
        // Geolocation failed or timed out: seamlessly recover via IP location
        const recovered = await tryIpFallback();
        if (!recovered) {
          setErrorBanner({
            type: 'GENERIC',
            message: 'Unable to acquire location coordinates. Please search manually.'
          });
        }
        setIsLocating(false);
      },
      { timeout: 4000, enableHighAccuracy: false, maximumAge: 120000 }
    );
  }, [fetchWeather]);

  const selectCity = useCallback((newCity) => {
    setCurrentCity(newCity);
    fetchWeather(newCity);
  }, [fetchWeather]);

  const refresh = useCallback(() => {
    if (currentCity) {
      fetchWeather(currentCity, true);
    }
  }, [currentCity, fetchWeather]);

  // Helper conversions
  const formatTemp = useCallback((celsius) => {
    if (celsius == null) return '--';
    if (unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }, [unit]);

  const formatWind = useCallback((kmh) => {
    if (kmh == null) return '--';
    if (unit === 'F') {
      return `${(kmh * 0.621371).toFixed(0)} mph`;
    }
    return `${kmh.toFixed(0)} km/h`;
  }, [unit]);

  return {
    weather,
    currentCity,
    isLoading,
    isRefreshing,
    isLocating,
    errorBanner,
    cacheAgeMinutes,
    unit,
    toggleUnit,
    selectCity,
    detectCurrentLocation,
    refresh,
    formatTemp,
    formatWind
  };
}
