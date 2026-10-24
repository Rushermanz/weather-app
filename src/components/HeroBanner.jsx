import React from 'react';
import { WeatherGlyph } from './Icons';

export default function HeroBanner({
  weather,
  formatTemp,
  unit = 'C',
  cacheAgeMinutes = 0
}) {
  if (!weather || !weather.current) return null;

  const { current, daily } = weather;
  const tempVal = formatTemp(current.temperature);
  const feelsLikeVal = formatTemp(current.apparentTemperature);
  const highVal = daily?.[0] ? formatTemp(daily[0].tempMax) : '--';
  const lowVal = daily?.[0] ? formatTemp(daily[0].tempMin) : '--';

  const updatedStr = cacheAgeMinutes === 0 ? 'JUST NOW' : `${cacheAgeMinutes}M AGO`;

  return (
    <section className="hero-broadsheet" aria-label="Current Weather Observations">
      <div className="hero-lead-row">
        {/* Giant 96-140px Hero Numerals */}
        <div className="hero-temp-block">
          <span className="hero-temp-value numeral">{tempVal}</span>
          <span className="hero-temp-unit">°{unit}</span>
        </div>

        {/* Minimal Architectural Weather Glyph */}
        <div className="hero-icon-block">
          <WeatherGlyph
            code={current.weatherCode}
            isDay={current.isDay}
            size={56}
            className="hero-glyph"
          />
        </div>
      </div>

      {/* Asymmetric Typography & Summary */}
      <div className="hero-headline-wrap">
        <h2 className="hero-condition-lead">
          {current.weatherDescription}
        </h2>

        <div className="hero-meta-summary">
          <span className="hero-high-low tabular">
            H: {highVal}° / L: {lowVal}°
          </span>
          <span>•</span>
          <span className="tabular">
            FEELS LIKE {feelsLikeVal}°
          </span>
          <span>•</span>
          <span className="hero-cache-status tabular">
            UPDATED {updatedStr}
          </span>
        </div>
      </div>

      <hr className="rule-hairline" />
    </section>
  );
}
