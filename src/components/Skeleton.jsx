import React from 'react';

export default function Skeleton() {
  return (
    <div className="skeleton-broadsheet" aria-busy="true" aria-label="Loading meteorological telemetry">
      {/* Hero Temperature Placeholder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton-line skeleton-hero-number" />
        <div className="skeleton-line skeleton-headline" />
        <div className="skeleton-line skeleton-subhead" />
      </div>

      <hr className="rule-hairline" />

      {/* Ruled Rows Placeholders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-line skeleton-ruled-row" />
        <div className="skeleton-line skeleton-ruled-row" />
        <div className="skeleton-line skeleton-ruled-row" />
        <div className="skeleton-line skeleton-ruled-row" />
      </div>
    </div>
  );
}
