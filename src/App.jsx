import React, { useState } from 'react';
import { useWeather } from './hooks/useWeather';
import { resolveThemeState } from './utils/theme';

import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import HourlyStrip from './components/HourlyStrip';
import RuledMetrics from './components/RuledMetrics';
import DailyTable from './components/DailyTable';
import ErrorBanner from './components/ErrorBanner';
import SearchModal from './components/SearchModal';
import Skeleton from './components/Skeleton';
import AtmosphericMood from './components/AtmosphericMood';

export default function App() {
  const {
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
  } = useWeather();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Compute theme
  const activeTheme = weather?.current
    ? resolveThemeState(weather.current.weatherCode, weather.current.isDay)
    : 'clear-day';

  return (
    <div className="broadsheet-app" data-theme={activeTheme}>
      {/* Purposeful CSS Atmospheric Motion Layer */}
      <AtmosphericMood theme={activeTheme} />

      <main className="broadsheet-container">
        {/* Editorial Broadsheet Masthead */}
        <Header
          city={currentCity}
          unit={unit}
          onToggleUnit={toggleUnit}
          onOpenSearch={() => setIsSearchOpen(true)}
          onCurrentLocation={detectCurrentLocation}
          isLocating={isLocating}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
        />

        {/* Non-destructive Error Banner (Offline, 429, Not Found, Generic) */}
        <ErrorBanner error={errorBanner} onRetry={refresh} />

        {/* Primary Content or Layout-Matching Skeleton */}
        {isLoading && !weather ? (
          <Skeleton />
        ) : (
          weather && (
            <>
              {/* Giant Temperature Hero Broadsheet */}
              <HeroBanner
                weather={weather}
                formatTemp={formatTemp}
                unit={unit}
                cacheAgeMinutes={cacheAgeMinutes}
              />

              {/* 24-Hour Ruled Horizontal Timeline Strip */}
              <HourlyStrip
                hourly={weather.hourly}
                formatTemp={formatTemp}
              />

              {/* Broadsheet Ruled Rows (Humidity, Wind, Barometer, UV, Sunrise/Sunset) */}
              <RuledMetrics
                current={weather.current}
                daily={weather.daily}
                timezone={weather.location.timezone}
                formatWind={formatWind}
                formatTemp={formatTemp}
              />

              {/* 7-Day Ruled Outlook Table */}
              <DailyTable
                daily={weather.daily}
                formatTemp={formatTemp}
              />

              {/* Broadsheet Colophon Footer */}
              <footer className="broadsheet-footer" role="contentinfo">
                <hr className="rule-hairline" style={{ marginBottom: '14px' }} />
                <p className="colophon-text">
                  METEOROLOGICAL TELEMETRY DERIVED FROM OPEN-METEO NUMERICAL WEATHER MODELS.
                </p>
                <p className="colophon-text">
                  CLIENT-SIDE 10-MINUTE CACHE • PWA CAPACITOR READY • ZERO TRACKING.
                </p>
              </footer>
            </>
          )
        )}

        {/* Keyboard and Touch Accessible Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectCity={selectCity}
          onCurrentLocation={detectCurrentLocation}
        />
      </main>
    </div>
  );
}
