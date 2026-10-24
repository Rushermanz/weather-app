import React from 'react';
import { IconSearch, IconRefresh, IconLocation } from './Icons';

export default function Header({
  city,
  unit = 'C',
  onToggleUnit,
  onOpenSearch,
  onCurrentLocation,
  isLocating,
  onRefresh,
  isRefreshing
}) {
  const todayStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date()).toUpperCase();

  return (
    <header className="masthead" role="banner">
      {/* Editorial Volume / Date Top Bar */}
      <div className="masthead-top-bar">
        <div className="masthead-edition">
          <span className="edition-dot" aria-hidden="true" />
          <span>DAILY METEOROLOGICAL DISPATCH</span>
        </div>
        <span>{todayStr}</span>
      </div>

      <hr className="rule-hairline" />

      {/* Main Masthead Headline with City & Search Trigger */}
      <div className="masthead-location-row" onClick={onOpenSearch} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpenSearch()} aria-label="Change city">
        <div>
          <span className="broadsheet-kicker">EDITION LOCATION</span>
          <h1 className="masthead-city-title">
            {city?.name ? `${city.name.toUpperCase()}` : 'METROPOLIS'}
            {city?.country_code ? `, ${city.country_code}` : ''}
          </h1>
        </div>

        <div className="masthead-actions">
          <button
            type="button"
            className="action-btn masthead-search-pill"
            onClick={(e) => {
              e.stopPropagation();
              onCurrentLocation();
            }}
            aria-label="Acquire current location"
            title="Use Current Location"
            disabled={isLocating}
            style={isLocating ? { opacity: 0.6 } : undefined}
          >
            <IconLocation size={14} />
            <span>{isLocating ? 'LOCATING...' : 'GPS'}</span>
          </button>

          <button
            type="button"
            className="action-btn masthead-search-pill"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch();
            }}
            aria-label="Search global cities"
          >
            <IconSearch size={14} />
            <span>FIND</span>
          </button>

          <button
            type="button"
            className="action-btn unit-btn numeral"
            onClick={(e) => {
              e.stopPropagation();
              onToggleUnit();
            }}
            aria-label={`Switch to ${unit === 'C' ? 'Fahrenheit' : 'Celsius'}`}
          >
            °{unit}
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            aria-label="Refresh telemetry"
            style={isRefreshing ? { opacity: 0.6 } : undefined}
          >
            <IconRefresh size={16} />
          </button>
        </div>
      </div>

      <hr className="rule-double" />
    </header>
  );
}
