import React from 'react';
import { WeatherGlyph } from './Icons';

export default function HourlyStrip({
  hourly = [],
  formatTemp
}) {
  if (!hourly || hourly.length === 0) return null;

  return (
    <section className="hourly-section" aria-label="Twenty-Four Hour Forecast">
      <span className="broadsheet-kicker">24-HOUR TRAJECTORY</span>

      <div className="hourly-strip" role="region" aria-label="Hourly timeline">
        {hourly.map((tick, idx) => (
          <div
            key={tick.timestamp || idx}
            className={`hourly-tick-cell ${idx === 0 ? 'is-now' : ''}`}
          >
            <span className="hourly-tick-time tabular">{tick.displayHour}</span>
            <WeatherGlyph
              code={tick.weatherCode}
              isDay={tick.isDay}
              size={18}
            />
            <span className="hourly-tick-temp tabular">
              {formatTemp(tick.temperature)}°
            </span>
            {tick.precipProbability > 0 ? (
              <span className="hourly-tick-precip tabular">
                {tick.precipProbability}%
              </span>
            ) : (
              <span className="hourly-tick-precip" style={{ opacity: 0 }}>
                &mdash;
              </span>
            )}
          </div>
        ))}
      </div>

      <hr className="rule-hairline" />
    </section>
  );
}
