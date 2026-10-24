/**
 * Client-Side Cache with 10-minute TTL in localStorage
 * Supports Stale-While-Revalidate pattern for offline and background refreshing.
 */

const CACHE_PREFIX = 'broadsheet_wx_';
const GEO_PREFIX = 'broadsheet_geo_';
const RECENT_KEY = 'broadsheet_recent_cities';
const SETTINGS_KEY = 'broadsheet_settings';
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Normalizes coordinates to 2 decimal places (~1.1km precision)
 * to group nearby queries and maximize cache hits.
 */
export function normalizeCoord(lat, lon) {
  return `${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
}

export const CacheManager = {
  /**
   * Stores weather data keyed by normalized coordinates
   */
  setWeather(lat, lon, data) {
    try {
      const key = `${CACHE_PREFIX}${normalizeCoord(lat, lon)}`;
      const payload = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + DEFAULT_TTL_MS
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn('Cache write failed (storage quota?):', err);
    }
  },

  /**
   * Retrieves weather data with stale-while-revalidate status
   * Returns: { data, isStale, cachedAt } | null
   */
  getWeather(lat, lon) {
    try {
      const key = `${CACHE_PREFIX}${normalizeCoord(lat, lon)}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      const now = Date.now();
      const isStale = now > payload.expiresAt;

      return {
        data: payload.data,
        isStale,
        cachedAt: payload.cachedAt
      };
    } catch (err) {
      console.warn('Cache read failed:', err);
      return null;
    }
  },

  /**
   * Stores geocoding search results (24h TTL)
   */
  setGeocode(query, results) {
    try {
      const clean = query.trim().toLowerCase();
      const key = `${GEO_PREFIX}${clean}`;
      const payload = {
        results,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn('Geocode cache write failed:', err);
    }
  },

  /**
   * Retrieves geocoding search results if not expired
   */
  getGeocode(query) {
    try {
      const clean = query.trim().toLowerCase();
      const key = `${GEO_PREFIX}${clean}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      if (Date.now() > payload.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return payload.results;
    } catch {
      return null;
    }
  },

  /**
   * Recent cities management
   */
  getRecentCities() {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addRecentCity(city) {
    try {
      const current = this.getRecentCities();
      const filtered = current.filter(
        c => normalizeCoord(c.latitude, c.longitude) !== normalizeCoord(city.latitude, city.longitude)
      );
      const updated = [
        {
          id: `${city.latitude}_${city.longitude}`,
          name: city.name,
          admin1: city.admin1 || '',
          country: city.country || '',
          country_code: city.country_code || '',
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: city.timezone || 'auto',
          lastViewed: Date.now()
        },
        ...filtered
      ].slice(0, 6);

      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  removeRecentCity(id) {
    try {
      const current = this.getRecentCities().filter(c => c.id !== id);
      localStorage.setItem(RECENT_KEY, JSON.stringify(current));
      return current;
    } catch {
      return [];
    }
  },

  /**
   * User preferences (temperature unit °C/°F, wind unit)
   */
  getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { unit: 'C' };
    } catch {
      return { unit: 'C' };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }
};
