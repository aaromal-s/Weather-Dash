# 🌤️ Weather Analytics Engine (AetherTelemetry)

A production-ready, feature-complete Weather Dashboard and Climatological Telemetry Engine built using vanilla **HTML5**, modern **CSS3** (Flexbox/Grid/Variables/Glassmorphism), and **ES6+ Modern JavaScript Modules**. Zero framework wrappers (React/Vue/Angular) — pure, native web platform excellence.

---

## 🌟 Key Architecture & Feature Matrix

### 1. Geospatial Discovery Engine
- **Dual Search Modality**: Query by `"City Name"` or `"City Name, Country Code"` syntax paired with an inline **"Geolocate Me"** GPS button leveraging the native Browser `navigator.geolocation` API.
- **Persistent Search Cache**: Automatically stores the user's 5 most recent unique searches in `localStorage`. Rendered as accessible quick-search chips beneath the input bar.
- **Default State Engine**: Boots seamlessly using saved search history or falls back gracefully to standard baseline telemetry (e.g., Tokyo).

### 2. Live Telemetry & Auxiliary Metric Grid
- **Hero Banner**: High-impact real-time rendering of Location Name, Country, Formatted Local Date/Time (calculated with timezone offset), Numeric Temperature, High/Low Range, Sky Condition text, and dynamic vector weather icons mapped to weather condition codes.
- **Auxiliary Telemetry Tiles**:
  - **Perceived Real Feel** (°C / °F)
  - **Relative Humidity** with inline scaling progress bar meter
  - **Wind Velocity** (km/h or mph) & **Wind Direction Compass Needle** with dynamic CSS degree transform orientation
  - **Barometric Pressure** (hPa or inHg)
  - **UV Index** with safety risk badge pill (Low, Moderate, High, Very High, Extreme)
  - **Air Quality Index (AQI)** with 1–5 scale badge pill (Good, Fair, Moderate, Poor, Very Poor) and health subtext

### 3. Progression Trends & Forecast Engines
- **Hourly Micro-Timeline**: Scrollable horizontal rail displaying temperature, weather condition icons, and precipitation probability (PoP %) for the next 24 hours in 3-hour increments.
- **Synoptic 5-Day Outlook**: Vertical synoptic forecast tracking macro temperature range (Day Max / Night Min) with visual relative temperature range bars and weather icons.

### 4. Interactive Data Visualizations
- **Climatological Data Chart**: 2D line graph canvas powered by **Chart.js** detailing smooth temperature and humidity progression curves over a 24-hour cycle. Styled to seamlessly complement the translucent glassmorphism dark theme.

### 5. Unit Conversion Engine & Responsive Reactive Theming
- **Unified Unit Transformation**: Instant system-wide switching between Metric (°C, km/h, hPa) and Imperial (°F, mph, inHg) units without triggering page reloads.
- **Weather-State Reactive Backgrounds**: The main viewport background dynamically transitions between vibrant color gradients based on active weather state:
  - ☀️ **Clear/Sunny**: Vibrant sky azul (`#0284c7` to `#1e3a8a`)
  - ☁️ **Overcast/Cloudy**: Sleek slate monochrome (`#475569` to `#1e293b`)
  - 🌧️ **Rain/Thunder**: Moody maritime blues (`#0f172a` to `#020617`)
  - ❄️ **Snow**: Muted ice gray-blues (`#64748b` to `#334155`)
  - 🌫️ **Atmosphere/Fog**: Mystic teal slate (`#134e4a` to `#0f172a`)

### 6. Integrated Mock Telemetry Simulator
- **100% Testable Out-Of-The-Box**: Includes an automated fallback simulator. If `API_KEY` in `js/api.js` is left as an empty string `""` or network requests fail (401/404/offline), the engine automatically synthesizes realistic weather payloads, 24-hour timelines, 5-day forecasts, UV indices, and AQI ratings.

---

## 📂 Repository Directory Tree

```text
weather-analytics-engine/
│
├── index.html                  # Semantic structural skeleton & container mounts
├── README.md                   # Technical system documentation
│
├── css/
│   ├── components.css          # Design tokens, glass cards, controls, skeletons
│   ├── themes.css              # Weather-state reactive background styling & lighting
│   └── responsive.css          # Viewport media breakpoint queries
│
└── js/
    ├── main.js                 # Global orchestrator, state storage, lifecycle entry
    ├── api.js                  # Asynchronous network layer & Mock Simulator
    ├── chart-engine.js         # Chart.js analytics interface logic
    └── utils.js                # String formatters, unit metrics, compass & DOM helpers
```

---

## 🛠️ Installation & Setup

1. **Clone / Download** the repository to your local workspace.
2. **Serve locally** using any standard static file web server:
   - Python: `python -m http.server 8000`
   - Node: `npx serve .`
   - VS Code: Live Server extension
3. Open `http://localhost:8000` in any modern web browser (Chrome, Firefox, Safari, Edge).

### 🔑 (Optional) OpenWeatherMap API Key Setup

By default, the application runs on the **Built-in Mock Telemetry Simulator**. To connect live OpenWeatherMap API endpoints:
1. Obtain a free API Key from [OpenWeatherMap](https://openweathermap.org/api).
2. Open [`js/api.js`](file:///d:/Projects/Weather%20Dash/js/api.js).
3. Set `const API_KEY = "YOUR_ACTUAL_OPENWEATHER_API_KEY";`.
4. Refresh your browser. Live telemetry will now stream directly from OpenWeather endpoints!

---

## 🌐 Browser Compatibility

- Chrome / Edge (ES6 Modules, CSS Backdrop Blur, Flexbox/Grid)
- Firefox (ES6 Modules, CSS Backdrop Filter)
- Safari 14+ (ES6 Modules, WebKit Backdrop Blur)
