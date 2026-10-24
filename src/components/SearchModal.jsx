import React, { useState, useEffect, useRef } from 'react';
import { searchCitiesApi } from '../api/openMeteo';
import { CacheManager } from '../utils/cache';
import { useDebounce } from '../hooks/useDebounce';
import { IconSearch, IconCross, IconLocation } from './Icons';

export default function SearchModal({
  isOpen,
  onClose,
  onSelectCity,
  onCurrentLocation
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedQuery = useDebounce(searchTerm, 300);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [recentCities, setRecentCities] = useState([]);

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Focus input and load recent searches on open
  useEffect(() => {
    if (isOpen) {
      setRecentCities(CacheManager.getRecentCities());
      setSearchTerm('');
      setResults([]);
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search with AbortController to prevent race conditions
  useEffect(() => {
    const query = debouncedQuery.trim();
    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      setErrorMsg(null);
      return;
    }

    // Check geocode cache first
    const cachedHits = CacheManager.getGeocode(query);
    if (cachedHits) {
      setResults(cachedHits);
      setIsSearching(false);
      return;
    }

    // Cancel in-flight stale search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setErrorMsg(null);

    searchCitiesApi(query, controller.signal)
      .then((hits) => {
        setResults(hits);
        CacheManager.setGeocode(query, hits);
        if (hits.length === 0) {
          setErrorMsg(`No locations recorded matching "${query}".`);
        }
      })
      .catch((err) => {
        if (err.type !== 'ABORTED') {
          setErrorMsg('Geocoding service unavailable.');
        }
      })
      .finally(() => {
        setIsSearching(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const handleSelect = (city) => {
    onSelectCity(city);
    onClose();
  };

  return (
    <div
      className="search-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Search Global Locations"
      onClick={onClose}
    >
      <div
        className="search-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="search-modal-input-bar">
          <IconSearch size={18} />
          <input
            ref={inputRef}
            type="text"
            className="search-input-field"
            placeholder="Type city, region, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="City search input"
          />
          <button
            type="button"
            className="action-btn"
            onClick={onClose}
            aria-label="Close search overlay"
          >
            <IconCross size={18} />
          </button>
        </div>

        {/* Results / Recent List */}
        <div className="search-modal-results">
          {searchTerm.trim().length >= 2 ? (
            /* Search hits */
            isSearching ? (
              <div className="search-empty-note">
                Querying meteorological geocode registry...
              </div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="search-result-row"
                  onClick={() => handleSelect(item)}
                >
                  <div className="result-location-text">
                    <span className="result-city-name">{item.name}</span>
                    <span className="result-region">
                      {item.admin1 ? `${item.admin1}, ` : ''}{item.country}
                    </span>
                  </div>
                  {item.country_code && (
                    <span className="result-country-code tabular">
                      {item.country_code}
                    </span>
                  )}
                </button>
              ))
            ) : (
              errorMsg && <div className="search-empty-note">{errorMsg}</div>
            )
          ) : (
            <div>
              {onCurrentLocation && (
                <button
                  type="button"
                  className="search-result-row search-gps-row"
                  onClick={() => {
                    onCurrentLocation();
                    onClose();
                  }}
                >
                  <div className="result-location-text">
                    <span className="result-city-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconLocation size={16} />
                      <span>USE CURRENT LOCATION</span>
                    </span>
                    <span className="result-region">
                      Acquire local meteorological dispatch via device GPS
                    </span>
                  </div>
                  <span className="result-country-code tabular">GPS</span>
                </button>
              )}

              {recentCities.length > 0 && (
                <div>
                  <div className="recent-searches-header">
                    <span>RECENT LOCATIONS</span>
                  </div>
                  {recentCities.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="search-result-row"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="result-location-text">
                        <span className="result-city-name">{item.name}</span>
                        <span className="result-region">
                          {item.admin1 ? `${item.admin1}, ` : ''}{item.country}
                        </span>
                      </div>
                      <IconLocation size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
