import React from 'react';

function getCompassHeading(degrees) {
  if (degrees == null) return 'N';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index];
}

function formatSolarTime(isoString, timezone) {
  if (!isoString) return '--:--';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(isoString));
  } catch {
    return '--:--';
  }
}

export default function RuledMetrics({
  current,
  daily = [],
  timezone = 'UTC',
  formatWind,
  formatTemp
}) {
  if (!current) return null;

  const todayDaily = daily[0] || {};
  const windDir = getCompassHeading(current.windDirection);
  const sunriseStr = formatSolarTime(todayDaily.sunrise, timezone);
  const sunsetStr = formatSolarTime(todayDaily.sunset, timezone);
  const dewPointDisplay = current.dewPoint != null ? formatTemp(current.dewPoint) : null;

  return (
    <section className="ruled-metrics-section" aria-label="Detailed Meteorological Observations">
      <span className="broadsheet-kicker" style={{ marginBottom: '8px' }}>
        ATMOSPHERIC TELEMETRY
      </span>

      {/* Row 1: Humidity & Dew Point */}
      <div className="metric-row">
        <div className="metric-label-group">
          <span className="metric-label">RELATIVE HUMIDITY</span>
          <span className="metric-caption">
            Dew point at {dewPointDisplay !== null ? `${dewPointDisplay}°` : 'nominal'}
          </span>
        </div>
        <div className="metric-value-group">
          <span className="metric-value tabular">{current.humidity}</span>
          <span className="metric-unit">%</span>
        </div>
      </div>

      {/* Row 2: Wind Speed & Direction */}
      <div className="metric-row">
        <div className="metric-label-group">
          <span className="metric-label">WIND & VECTORS</span>
          <span className="metric-caption">
            Heading {windDir} ({Math.round(current.windDirection)}°) • Gusts to {formatWind(current.windGusts)}
          </span>
        </div>
        <div className="metric-value-group">
          <span className="metric-value tabular">{formatWind(current.windSpeed)}</span>
        </div>
      </div>

      {/* Row 3: Barometric Surface Pressure */}
      <div className="metric-row">
        <div className="metric-label-group">
          <span className="metric-label">BAROMETRIC PRESSURE</span>
          <span className="metric-caption">
            {current.pressure >= 1013 ? 'High stability gradient' : 'Depression / Low gradient'}
          </span>
        </div>
        <div className="metric-value-group">
          <span className="metric-value tabular">{Math.round(current.pressure)}</span>
          <span className="metric-unit">hPa</span>
        </div>
      </div>

      {/* Row 4: Solar UV Index */}
      <div className="metric-row">
        <div className="metric-label-group">
          <span className="metric-label">MAXIMUM UV INDEX</span>
          <span className="metric-caption">
            {todayDaily.uvIndexMax <= 2 ? 'Minimal hazard exposure' : todayDaily.uvIndexMax <= 5 ? 'Moderate solar radiation' : 'High solar exposure advisory'}
          </span>
        </div>
        <div className="metric-value-group">
          <span className="metric-value tabular">{todayDaily.uvIndexMax != null ? Math.round(todayDaily.uvIndexMax) : '0'}</span>
          <span className="metric-unit">/ 11+</span>
        </div>
      </div>

      {/* Row 5: Sunrise / Sunset Cycle */}
      <div className="metric-row">
        <div className="metric-label-group">
          <span className="metric-label">SOLAR EPHEMERIS</span>
          <span className="metric-caption">Sunrise / Sunset diurnal cycle</span>
        </div>
        <div className="metric-value-group">
          <span className="metric-value tabular">{sunriseStr}</span>
          <span className="metric-unit">/</span>
          <span className="metric-value tabular">{sunsetStr}</span>
        </div>
      </div>

      {/* Row 6: Cloud Cover & Precipitation */}
      <div className="metric-row">
        <div className="metric-label-group">
          <span className="metric-label">CLOUD COVER & HYDRATION</span>
          <span className="metric-caption">
            {current.precipitation > 0 ? `Active precipitation ${current.precipitation} mm` : 'No measurable surface precipitation'}
          </span>
        </div>
        <div className="metric-value-group">
          <span className="metric-value tabular">{current.cloudCover}</span>
          <span className="metric-unit">%</span>
        </div>
      </div>
    </section>
  );
}
