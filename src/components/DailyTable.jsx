import React from 'react';
import { WeatherGlyph } from './Icons';

export default function DailyTable({
  daily = [],
  formatTemp
}) {
  if (!daily || daily.length === 0) return null;

  return (
    <section className="daily-table-section" aria-label="Seven Day Outlook">
      <span className="broadsheet-kicker">SEVEN-DAY OUTLOOK</span>

      <div role="table" aria-label="Seven Day Forecast Table">
        {daily.map((day) => (
          <div key={day.dateIso} className="daily-row-item" role="row">
            {/* Column 1: Day & Date */}
            <div className="daily-col-day" role="cell">
              <span className="daily-day-name">{day.displayDay}</span>
              <span className="daily-day-date">{day.displayDate}</span>
            </div>

            {/* Column 2: Minimal Glyph & Condition Phrase */}
            <div className="daily-col-condition" role="cell">
              <WeatherGlyph
                code={day.weatherCode}
                isDay={1}
                size={18}
              />
              <span className="daily-condition-label">
                {day.weatherDescription}
              </span>
            </div>

            {/* Column 3: Tabular High / Low Spread */}
            <div className="daily-col-spread" role="cell">
              <span className="spread-high tabular">
                {formatTemp(day.tempMax)}°
              </span>
              <span className="spread-low tabular">
                {formatTemp(day.tempMin)}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
