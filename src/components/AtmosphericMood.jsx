import React from 'react';

export default function AtmosphericMood({ theme = 'clear-day' }) {
  if (theme === 'storm') {
    return <div className="mood-layer-storm" aria-hidden="true" />;
  }

  if (theme === 'fog') {
    return <div className="mood-layer-fog" aria-hidden="true" />;
  }

  if (theme === 'snow') {
    // Exactly 7 capped CSS particles for 60fps budget on mid-range Android
    return (
      <div aria-hidden="true">
        <div className="mood-snow-flake" style={{ left: '15%', animationDelay: '0s', animationDuration: '9s' }} />
        <div className="mood-snow-flake" style={{ left: '35%', animationDelay: '2.5s', animationDuration: '11s' }} />
        <div className="mood-snow-flake" style={{ left: '55%', animationDelay: '1s', animationDuration: '8s' }} />
        <div className="mood-snow-flake" style={{ left: '72%', animationDelay: '4s', animationDuration: '10s' }} />
        <div className="mood-snow-flake" style={{ left: '88%', animationDelay: '1.8s', animationDuration: '12s' }} />
        <div className="mood-snow-flake" style={{ left: '42%', animationDelay: '5s', animationDuration: '9.5s' }} />
      </div>
    );
  }

  return null;
}
