/**
 * Atmospheric Broadsheet Theme Mapping Engine
 * Maps WMO meteorological codes & solar presence into semantic theme states:
 * 'clear-day' | 'clear-night' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow'
 * Updates root data-theme and browser meta theme-color.
 */

export const THEME_META_COLORS = {
  'clear-day': '#e6a147',
  'clear-night': '#0b0f19',
  'cloudy': '#4a5568',
  'rain': '#243242',
  'storm': '#1e1b2e',
  'fog': '#64748b',
  'snow': '#cbd5e1'
};

/**
 * Resolves theme key from WMO code and day/night status
 * @param {number} code - WMO code
 * @param {number} isDay - 1 for day, 0 for night
 * @returns {string} theme key
 */
export function resolveThemeState(code, isDay = 1) {
  // Thunderstorm / Severe
  if ([95, 96, 99].includes(code)) {
    return 'storm';
  }

  // Snow / Freezing / Sleet
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
    return 'snow';
  }

  // Heavy rain or showers
  if ([65, 81, 82].includes(code)) {
    return 'rain';
  }

  // Regular rain / drizzle
  if ([51, 53, 55, 61, 63, 80].includes(code)) {
    return 'rain';
  }

  // Fog / Mist
  if ([45, 48].includes(code)) {
    return 'fog';
  }

  // Overcast / Cloudy
  if ([2, 3].includes(code)) {
    return 'cloudy';
  }

  // Clear or Mainly Clear
  return isDay ? 'clear-day' : 'clear-night';
}

/**
 * Applies the active theme to document root and syncs theme-color meta tag
 * @param {string} theme
 */
export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const color = THEME_META_COLORS[theme] || '#0f172a';
  if (metaTheme) {
    metaTheme.setAttribute('content', color);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  }
}
