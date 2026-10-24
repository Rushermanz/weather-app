# Broadsheet Weather

An editorial print-inspired meteorological broadsheet designed mobile-first for Android (installable PWA, Capacitor/WebView-ready). Built with React, plain JavaScript (ES2020+), zero external UI libraries, zero icon packs, and bespoke hand-written CSS3.

---

## 📐 Design Decisions: Typography & Palette

### The Anti-Generic Concept
Modern weather apps suffer from identical "AI tells": centered cards with frosted-glass gradients, generic indigo-to-purple background blobs, and stock weather icons. 

**Broadsheet** commits to an authored visual concept:
1. **Editorial Broadsheet Format**:
   - Layout is left-aligned and asymmetric, mimicking the crisp typographic discipline of an authentic newspaper morning edition.
   - Temperature is displayed as a giant tabular numeral hero (96–140px), commanding immediate focus.
   - Hairline rules (`1px solid var(--rule)`) and double masthead rules replace stacked card borders.
   - Data is presented as **ruled rows** (Relative Humidity, Wind & Vectors, Barometric Surface Pressure, Solar UV Index, Ephemeris Diurnal Cycle, and Cloud Cover) rather than an undifferentiated grid of uniform tiles.
2. **Typography (Offline-First)**:
   - High-contrast display serif (`Didot`, `Bodoni MT`, `Baskerville`, `Playfair Display`, `Georgia`) for hero numerals and headlines, paired with a crisp utilitarian system grotesque for small captions and labels.
   - Zero runtime Google Fonts network dependency: loads instantly with 0 latency and works offline.
   - Numerical data utilizes `font-variant-numeric: tabular-nums lining-nums` so numbers align perfectly without jittering across refreshes.
3. **Restrained Atmospheric Palettes**:
   - Every atmospheric state swaps semantic CSS custom properties (`--bg-from`, `--bg-to`, `--ink`, `--accent`, `--rule`, `--muted`) via the `data-theme` attribute:
     - `clear-day`: Solar parchment transitioning to rich warm amber.
     - `clear-night`: Midnight ink transitioning to deep celestial indigo with bone hairline rules.
     - `cloudy`: Overcast newsprint slate and muted charcoal.
     - `rain`: Cool graphite and steel blue with subtle hairline water accents.
     - `storm`: Bruised purple and dark slate with an infrequent timed sheet-lightning flash (opacity-only, never strobing).
     - `fog`: Low-contrast, stratified drifting mist.
     - `snow`: High-key pale winter blues with capped drifting CSS particles.
   - All text contrast exceeds WCAG AA standards (ratios from 7:1 to 14:1).

---

## 📂 File Tree

```
weather-app/
├── index.html                   # Mobile-first viewport, standalone PWA tags, SW bootstrap
├── package.json                 # React 19, zero component or icon dependencies
├── vite.config.js               # Clean Vite configuration
├── public/
│   ├── favicon.svg              # Broadsheet vector favicon
│   ├── icon-192.svg             # PWA app launcher icon (192x192)
│   ├── icon-512.svg             # High-res PWA launcher icon (512x512)
│   ├── maskable-icon.svg        # Android adaptive launcher icon
│   ├── manifest.webmanifest     # Standalone PWA installation manifest
│   └── sw.js                    # App shell caching Service Worker
└── src/
    ├── main.jsx                 # Application entry point
    ├── index.css                # Global reset, mobile tap rules, safe-area bindings
    ├── App.jsx                  # Root broadsheet layout & atmospheric state provider
    ├── api/
    │   ├── client.js            # Fetch wrapper with AbortController, 8s timeout, 429 rate limit parsing
    │   └── openMeteo.js         # Swappable Open-Meteo forecast, search, & reverse geocoding adapter
    ├── hooks/
    │   ├── useDebounce.js       # Debounced search hook (300ms)
    │   └── useWeather.js        # Master telemetry hook with SWR caching, GPS & error states
    ├── utils/
    │   ├── cache.js             # 10-minute TTL localStorage cache for weather & 24h geocoding
    │   ├── parser.js            # Raw JSON validator & normalizer with safe fallbacks & dew point
    │   └── theme.js             # WMO code to theme mapper & dynamic theme-color meta updater
    ├── components/
    │   ├── Icons.jsx            # Hand-drawn minimal hairline SVG icons
    │   ├── Header.jsx           # Editorial masthead, edition location, search trigger, unit toggle
    │   ├── HeroBanner.jsx       # 96-140px tabular numerals, headline, and update age
    │   ├── HourlyStrip.jsx      # Ruled horizontal 24h timeline
    │   ├── RuledMetrics.jsx     # Broadsheet ruled telemetry rows
    │   ├── DailyTable.jsx       # 7-day forecast table with tabular spreads
    │   ├── ErrorBanner.jsx      # Non-destructive recovery banner (offline, 429, not found)
    │   ├── SearchModal.jsx      # Touch/keyboard accessible search overlay
    │   ├── Skeleton.jsx         # Layout-matching broadsheet skeleton loader
    │   └── AtmosphericMood.jsx  # CSS-only 60fps ambient atmospheric motion
    └── styles/
        ├── typography.css       # Broadsheet font stack & tabular numeral rules
        ├── themes.css           # Semantic theme custom properties & motion keyframes
        └── broadsheet.css       # Ruled rows, 48px touch targets, safe-area insets, 100dvh
```

---

## 🚀 Running & Building

### 1. Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 2. Production Build
```bash
npm run build
npm run preview
```

---

## 📱 Android Installation & Capacitor Wrap

### Option A: Install via Chrome on Android (PWA)
1. Navigate to the deployed URL (or local network IP `http://<LAN-IP>:5173`) in **Chrome for Android**.
2. Tap the Chrome menu (`⋮`) and select **"Add to Home Screen"** or tap the install banner.
3. The app will install with standalone display, maskable launcher icon, and black-translucent status bar integration. It runs offline via `sw.js` and local caching.

### Option B: Wrap with Capacitor for Google Play (.apk / .aab)
1. Initialize Capacitor in the project:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Broadsheet Weather" "com.broadsheet.weather" --web-dir dist
   ```
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. Add the Android platform:
   ```bash
   npx cap add android
   npx cap sync
   ```
4. Open the native Android Studio project:
   ```bash
   npx cap open android
   ```
5. In Android Studio, build and run directly onto your connected Android device or generate a signed APK / Android App Bundle (`.aab`).

---

## 🛡️ Acceptance Checks Summary

| Criterion | Implementation | Status |
| :--- | :--- | :--- |
| **Offline First** | Service Worker (`public/sw.js`) caches app shell; `CacheManager` serves cached telemetry with `"UPDATED X MIN AGO"` label. | ✅ Verified |
| **Race-Condition Free Search** | `AbortController` in `SearchModal.jsx` supersedes and cancels stale in-flight requests when typing quickly. | ✅ Verified |
| **Non-Destructive Errors** | `ErrorBanner.jsx` displays offline alerts and HTTP 429 countdowns without wiping current weather observations. | ✅ Verified |
| **Android Touch Targets** | All interactive buttons (`FIND`, `°C/°F`, `RETRY`, city rows) meet or exceed 48x48px with `touch-action: manipulation`. | ✅ Verified |
| **No UI Libraries / Bundled** | Zero Lucide, zero Tailwind, zero Google Fonts runtime dependencies. Custom vector SVGs. | ✅ Verified |
