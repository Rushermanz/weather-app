import React, { useState, useEffect } from 'react';

export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;

  const [countdown, setCountdown] = useState(error.retryAfterSec || 0);

  useEffect(() => {
    if (!error.retryAfterSec) return;
    setCountdown(error.retryAfterSec);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [error.retryAfterSec]);

  return (
    <aside className="error-banner" role="alert">
      <div>
        <strong>DISPATCH NOTE: </strong>
        <span>{error.message}</span>
        {countdown > 0 && <span> (Wait {countdown}s)</span>}
      </div>

      {onRetry && (
        <button
          type="button"
          className="error-banner-retry"
          onClick={onRetry}
          disabled={countdown > 0}
          aria-label="Retry loading weather telemetry"
        >
          {countdown > 0 ? `RETRY (${countdown})` : 'RETRY'}
        </button>
      )}
    </aside>
  );
}
