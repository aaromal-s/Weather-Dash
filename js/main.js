/**
 * Weather Analytics Engine - Main Application Orchestrator
 */

import { fetchWeatherTelemetry } from './api.js';
import { renderAnalyticsChart } from './chart-engine.js';
import { initBackgroundEffects, bgEngine } from './background-effects.js';
import {
  convertTemp,
  convertSpeed,
  convertPressure,
  degreesToCompass,
  classifyUVIndex,
  classifyAQI,
  getWeatherThemeAndIcon,
  formatLocalTime,
  formatTimeString,
  formatHour,
  formatDayName,
  formatShortDate,
  calculateSolarArc,
  getMoonPhaseDetails,
  evaluateLifestyleIndices,
  evaluateSevereWeatherAlerts,
  getDisasterMitigationProtocols,
  showToast
} from './utils.js';

// Application Centralized State
const state = {
  isImperial: false,
  activeQuery: 'Tokyo',
  searchHistory: [],
  favorites: [],
  telemetry: null,
  isLoading: false,
  radarMode: 'wind',
  isHistorical: false
};

const STORAGE_KEY_HISTORY = 'weather_analytics_history_v1';
const STORAGE_KEY_FAVS = 'weather_analytics_favs_v1';
const STORAGE_KEY_UNIT = 'weather_analytics_unit_pref';

let radarAnimId = null;

// DOM Element Registry Cache
const DOM = {
  bgPhotoLayer: document.getElementById('bg-photo-layer'),
  appViewport: document.getElementById('app-viewport'),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  geoBtn: document.getElementById('geo-btn'),
  historyContainer: document.getElementById('history-chips'),
  favoritesContainer: document.getElementById('favorites-chips'),
  unitToggle: document.getElementById('unit-toggle'),
  unitLabelMetric: document.getElementById('unit-label-metric'),
  unitLabelImperial: document.getElementById('unit-label-imperial'),
  dimmerSlider: document.getElementById('dimmer-slider'),
  
  // Severe Weather Alerts Banner Mount
  alertsContainer: document.getElementById('alerts-banner-container'),

  // Hero Weather Elements
  locationName: document.getElementById('location-name'),
  countryFlag: document.getElementById('country-flag'),
  favStarBtn: document.getElementById('fav-star-btn'),
  timeStamp: document.getElementById('time-stamp'),
  heroDegree: document.getElementById('hero-degree'),
  heroUnitSymbol: document.getElementById('hero-unit-symbol'),
  weatherText: document.getElementById('weather-text'),
  highLowTemp: document.getElementById('high-low-temp'),
  heroIcon: document.getElementById('hero-weather-icon'),
  mockBadge: document.getElementById('mock-badge'),
  galleryModalBtn: document.getElementById('gallery-modal-btn'),

  // Modal Gallery Elements
  galleryModal: document.getElementById('gallery-modal-overlay'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalCityTitle: document.getElementById('modal-city-title'),

  // Auxiliary Telemetry Elements
  feelsLikeVal: document.getElementById('feels-like-val'),
  humidityVal: document.getElementById('humidity-val'),
  humidityProgress: document.getElementById('humidity-progress'),
  windVal: document.getElementById('wind-val'),
  windCompassNeedle: document.getElementById('wind-compass-needle'),
  windDirectionText: document.getElementById('wind-direction-text'),
  pressureVal: document.getElementById('pressure-val'),
  uvVal: document.getElementById('uv-val'),
  uvBadge: document.getElementById('uv-badge'),
  aqiVal: document.getElementById('aqi-val'),
  aqiBadge: document.getElementById('aqi-badge'),
  aqiSubtext: document.getElementById('aqi-subtext'),

  // Extended Telemetry Elements
  dewPointVal: document.getElementById('dew-point-val'),
  cloudsVal: document.getElementById('clouds-val'),
  visibilityVal: document.getElementById('visibility-val'),
  rainVolVal: document.getElementById('rain-vol-val'),

  // Solar & Lunar Widgets
  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),
  daylightDuration: document.getElementById('daylight-duration'),
  solarSunNode: document.getElementById('solar-sun-node'),
  solarPathFill: document.getElementById('solar-path-fill'),
  
  moonIcon: document.getElementById('moon-icon'),
  moonName: document.getElementById('moon-name'),
  moonIllumination: document.getElementById('moon-illumination'),
  
  lifestyleGrid: document.getElementById('lifestyle-grid'),
  mitigationContainer: document.getElementById('mitigation-container'),

  // Radar Canvas
  radarCanvas: document.getElementById('radar-canvas'),
  radarBtnWind: document.getElementById('radar-btn-wind'),
  radarBtnPrecip: document.getElementById('radar-btn-precip'),

  // Lists & Canvas
  hourlyRail: document.getElementById('hourly-rail'),
  forecastList: document.getElementById('forecast-list'),
  chartCanvas: document.getElementById('analytics-chart'),

  // Auth Modal
  authModalBtn: document.getElementById('auth-modal-btn'),
  authModalOverlay: document.getElementById('auth-modal-overlay'),
  authModalCloseBtn: document.getElementById('auth-modal-close-btn'),
  tabLogin: document.getElementById('tab-login'),
  tabRegister: document.getElementById('tab-register'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),

  // Time Machine & Notifications
  timeMachineDate: document.getElementById('time-machine-date'),
  notifBtn: document.getElementById('notif-btn'),
  notifBadge: document.getElementById('notif-badge'),
  notifDropdown: document.getElementById('notif-dropdown'),
  notifList: document.getElementById('notif-list'),
  
  // Globe
  globeCanvas: document.getElementById('globe-canvas'),
  celestialTrackerVal: document.getElementById('celestial-tracker-val')
};

// Initial Entry point
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  initBackgroundEffects('bg-weather-canvas');
  loadSavedPreferences();
  bindEventListeners();
  renderHistoryChips();
  renderFavoritesChips();

  const defaultCity = state.searchHistory.length > 0 ? state.searchHistory[0] : 'Tokyo';
  await loadWeatherData(defaultCity);

  // Start Background Notifications
  startNotificationService();
  
  // Start Globe Simulation
  initGlobeSimulation();
  
  // Initialize customizable layouts
  initDragAndDrop();
}

function startNotificationService() {
  setInterval(() => {
    // 5% chance every 10 seconds to generate a severe weather alert
    if (Math.random() < 0.05) {
      const alerts = [
        "Flash Flood Warning in your area",
        "Tornado Watch: Seek shelter immediately",
        "Severe Thunderstorm Warning",
        "High Wind Advisory: Gusts up to 60mph"
      ];
      const alertMsg = alerts[Math.floor(Math.random() * alerts.length)];
      
      // Update UI
      if (DOM.notifBadge) DOM.notifBadge.style.display = 'block';
      if (DOM.notifList) {
        // Remove empty state
        const emptyMsg = DOM.notifList.querySelector('.text-muted');
        if (emptyMsg) emptyMsg.remove();
        
        const item = document.createElement('div');
        item.className = 'notif-item alert-danger';
        item.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i><div>${alertMsg}</div>`;
        DOM.notifList.prepend(item);
      }
      
      showToast(alertMsg, 'error');
    }
  }, 10000);
}

function loadSavedPreferences() {
  const savedUnit = localStorage.getItem(STORAGE_KEY_UNIT);
  if (savedUnit === 'imperial') {
    state.isImperial = true;
    if (DOM.unitToggle) DOM.unitToggle.checked = true;
    updateUnitLabelsUI();
  }

  try {
    const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (rawHistory) state.searchHistory = JSON.parse(rawHistory);
    
    const rawFavs = localStorage.getItem(STORAGE_KEY_FAVS);
    if (rawFavs) state.favorites = JSON.parse(rawFavs);
  } catch (e) {
    state.searchHistory = [];
    state.favorites = [];
  }
}

function bindEventListeners() {
  if (DOM.searchForm) {
    DOM.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = DOM.searchInput.value.trim();
      if (query) {
        loadWeatherData(query);
        DOM.searchInput.value = '';
      }
    });
  }

  if (DOM.geoBtn) {
    DOM.geoBtn.addEventListener('click', handleGeolocationQuery);
  }

  if (DOM.favStarBtn) {
    DOM.favStarBtn.addEventListener('click', toggleFavoriteActiveCity);
  }

  if (DOM.dimmerSlider) {
    DOM.dimmerSlider.addEventListener('input', (e) => {
      const opacityVal = parseFloat(e.target.value);
      if (DOM.bgPhotoLayer) {
        DOM.bgPhotoLayer.style.opacity = opacityVal;
      }
    });
  }

  if (DOM.galleryModalBtn) {
    DOM.galleryModalBtn.addEventListener('click', openGalleryModal);
  }

  if (DOM.modalCloseBtn) {
    DOM.modalCloseBtn.addEventListener('click', closeGalleryModal);
  }

  if (DOM.galleryModal) {
    DOM.galleryModal.addEventListener('click', (e) => {
      if (e.target === DOM.galleryModal) closeGalleryModal();
    });
  }

  if (DOM.unitToggle) {
    DOM.unitToggle.addEventListener('change', (e) => {
      state.isImperial = e.target.checked;
      localStorage.setItem(STORAGE_KEY_UNIT, state.isImperial ? 'imperial' : 'metric');
      updateUnitLabelsUI();
      if (state.telemetry) {
        renderUI(state.telemetry);
      }
    });
  }

  if (DOM.unitLabelMetric) {
    DOM.unitLabelMetric.addEventListener('click', () => {
      if (state.isImperial) {
        DOM.unitToggle.checked = false;
        DOM.unitToggle.dispatchEvent(new Event('change'));
      }
    });
  }

  if (DOM.unitLabelImperial) {
    DOM.unitLabelImperial.addEventListener('click', () => {
      if (!state.isImperial) {
        DOM.unitToggle.checked = true;
        DOM.unitToggle.dispatchEvent(new Event('change'));
      }
    });
  }

  if (DOM.radarBtnWind) {
    DOM.radarBtnWind.addEventListener('click', () => {
      state.radarMode = 'wind';
      DOM.radarBtnWind.classList.add('active');
      DOM.radarBtnPrecip.classList.remove('active');
      initRadarSimulation();
    });
  }

  if (DOM.radarBtnPrecip) {
    DOM.radarBtnPrecip.addEventListener('click', () => {
      state.radarMode = 'precipitation';
      DOM.radarBtnPrecip.classList.add('active');
      DOM.radarBtnWind.classList.remove('active');
      initRadarSimulation();
    });
  }

  // Auth Event Listeners
  if (DOM.authModalBtn) {
    DOM.authModalBtn.addEventListener('click', openAuthModal);
  }
  if (DOM.authModalCloseBtn) {
    DOM.authModalCloseBtn.addEventListener('click', closeAuthModal);
  }
  if (DOM.authModalOverlay) {
    DOM.authModalOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.authModalOverlay) closeAuthModal();
    });
  }
  if (DOM.tabLogin) {
    DOM.tabLogin.addEventListener('click', () => switchAuthTab('login'));
  }
  if (DOM.tabRegister) {
    DOM.tabRegister.addEventListener('click', () => switchAuthTab('register'));
  }
  if (DOM.loginForm) {
    DOM.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Logged in successfully!', 'success');
      closeAuthModal();
    });
  }
  if (DOM.registerForm) {
    DOM.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Account created successfully!', 'success');
      closeAuthModal();
    });
  }

  // Time Machine & Notifications Listeners
  if (DOM.notifBtn) {
    DOM.notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.notifDropdown.classList.toggle('active');
      DOM.notifBadge.style.display = 'none';
    });
    document.addEventListener('click', (e) => {
      if (!DOM.notifBtn.contains(e.target) && !DOM.notifDropdown.contains(e.target)) {
        DOM.notifDropdown.classList.remove('active');
      }
    });
  }

  if (DOM.timeMachineDate) {
    DOM.timeMachineDate.addEventListener('change', (e) => {
      const selectedDate = e.target.value;
      if (selectedDate) {
        state.isHistorical = true;
        showToast(`Entering Time Machine: ${selectedDate}`, 'info');
        loadWeatherData(state.telemetry ? state.telemetry.current.name : 'Tokyo');
      } else {
        state.isHistorical = false;
        showToast('Returning to Present', 'info');
        loadWeatherData(state.telemetry ? state.telemetry.current.name : 'Tokyo');
      }
    });
  }
}

function openAuthModal() {
  if (!DOM.authModalOverlay) return;
  DOM.authModalOverlay.classList.add('active');
}

function closeAuthModal() {
  if (!DOM.authModalOverlay) return;
  DOM.authModalOverlay.classList.remove('active');
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    DOM.tabLogin.classList.add('active');
    DOM.tabRegister.classList.remove('active');
    DOM.loginForm.classList.add('active');
    DOM.registerForm.classList.remove('active');
  } else {
    DOM.tabRegister.classList.add('active');
    DOM.tabLogin.classList.remove('active');
    DOM.registerForm.classList.add('active');
    DOM.loginForm.classList.remove('active');
  }
}

function openGalleryModal() {
  if (!DOM.galleryModal) return;
  if (DOM.modalCityTitle && state.telemetry) {
    DOM.modalCityTitle.textContent = `${state.telemetry.current.name} Atmospheric Gallery`;
  }
  DOM.galleryModal.classList.add('active');
}

function closeGalleryModal() {
  if (!DOM.galleryModal) return;
  DOM.galleryModal.classList.remove('active');
}

async function handleGeolocationQuery() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  DOM.geoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      await loadWeatherData(coords);
      DOM.geoBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
    },
    (err) => {
      DOM.geoBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
      showToast(`Geolocation error: ${err.message}`, 'error');
    },
    { timeout: 10000 }
  );
}

async function loadWeatherData(queryOrCoords) {
  setLoadingState(true);

  try {
    const data = await fetchWeatherTelemetry(queryOrCoords);

    if (!data || !data.current) {
      throw new Error('Failed to retrieve telemetry payload.');
    }

    state.telemetry = data;
    state.activeQuery = data.current.name;

    if (typeof queryOrCoords === 'string') {
      saveToSearchHistory(data.current.name);
    }

    renderUI(data);
    
    if (data.isMock && data.fallbackReason) {
      showToast(`Using Mock Simulator: ${data.fallbackReason}`, 'error');
    }
  } catch (error) {
    showToast(error.message || 'An unexpected error occurred while fetching weather.', 'error');
  } finally {
    setLoadingState(false);
  }
}

function toggleFavoriteActiveCity() {
  if (!state.telemetry || !state.telemetry.current) return;
  const cityName = state.telemetry.current.name;

  const index = state.favorites.findIndex(c => c.toLowerCase() === cityName.toLowerCase());
  if (index >= 0) {
    state.favorites.splice(index, 1);
    showToast(`Removed "${cityName}" from Favorites.`, 'success');
  } else {
    state.favorites.push(cityName);
    showToast(`Added "${cityName}" to Favorites!`, 'success');
  }

  localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(state.favorites));
  updateFavoriteStarUI(cityName);
  renderFavoritesChips();
}

function updateFavoriteStarUI(cityName) {
  if (!DOM.favStarBtn) return;
  const isFav = state.favorites.some(c => c.toLowerCase() === cityName.toLowerCase());
  if (isFav) {
    DOM.favStarBtn.classList.add('active');
    DOM.favStarBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
  } else {
    DOM.favStarBtn.classList.remove('active');
    DOM.favStarBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
  }
}

function saveToSearchHistory(cityName) {
  if (!cityName) return;
  const formatted = cityName.trim();
  let updated = state.searchHistory.filter(item => item.toLowerCase() !== formatted.toLowerCase());
  updated.unshift(formatted);
  if (updated.length > 5) updated = updated.slice(0, 5);

  state.searchHistory = updated;
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  renderHistoryChips();
}

function updateUnitLabelsUI() {
  if (state.isImperial) {
    DOM.unitLabelMetric.classList.remove('active');
    DOM.unitLabelImperial.classList.add('active');
  } else {
    DOM.unitLabelMetric.classList.add('active');
    DOM.unitLabelImperial.classList.remove('active');
  }
}

function renderUI(data) {
  const { current, hourly, daily, uv, aqi, isMock } = data;
  const isImp = state.isImperial;

  // 1. Theme State Shift & Background Photo Layer
  const { theme, icon, bgPhoto } = getWeatherThemeAndIcon(current.weatherId, current.icon);
  if (DOM.appViewport) {
    DOM.appViewport.className = '';
    DOM.appViewport.classList.add(theme);
  }
  if (DOM.bgPhotoLayer && bgPhoto) {
    DOM.bgPhotoLayer.style.backgroundImage = `url('${bgPhoto}')`;
  }
  if (bgEngine) {
    bgEngine.setTheme(theme);
  }

  // 2. Severe Weather Warnings & Alerts Banner
  renderSevereAlertsUI(data);

  // 3. Hero Weather Banner
  DOM.locationName.textContent = current.name;
  DOM.countryFlag.textContent = current.country ? current.country : 'INT';
  updateFavoriteStarUI(current.name);

  DOM.timeStamp.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatLocalTime(current.timezone)}`;
  DOM.heroDegree.textContent = convertTemp(current.temp, isImp);
  DOM.heroUnitSymbol.textContent = isImp ? '°F' : '°C';
  DOM.weatherText.textContent = current.description;
  
  const highTemp = convertTemp(current.temp_max, isImp);
  const lowTemp = convertTemp(current.temp_min, isImp);
  const unitSym = isImp ? '°F' : '°C';
  DOM.highLowTemp.innerHTML = `
    <span><i class="fa-solid fa-arrow-up" style="color:#f43f5e;"></i> High: ${highTemp}${unitSym}</span>
    <span><i class="fa-solid fa-arrow-down" style="color:#38bdf8;"></i> Low: ${lowTemp}${unitSym}</span>
  `;

  DOM.heroIcon.className = `hero-weather-icon ${icon}`;

  if (DOM.mockBadge) {
    DOM.mockBadge.style.display = isMock ? 'inline-block' : 'none';
  }

  // 4. Auxiliary Telemetry Array
  DOM.feelsLikeVal.textContent = `${convertTemp(current.feels_like, isImp)}${unitSym}`;
  DOM.humidityVal.textContent = `${current.humidity}%`;
  DOM.humidityProgress.style.width = `${Math.min(100, Math.max(0, current.humidity))}%`;
  
  DOM.windVal.textContent = convertSpeed(current.wind_speed, isImp);
  const compassDir = degreesToCompass(current.wind_deg);
  DOM.windDirectionText.textContent = `${compassDir} (${current.wind_deg}°)`;
  DOM.windCompassNeedle.style.transform = `rotate(${current.wind_deg}deg)`;

  DOM.pressureVal.textContent = convertPressure(current.pressure, isImp);

  // UV Index
  const uvInfo = classifyUVIndex(uv);
  DOM.uvVal.textContent = Number(uv).toFixed(1);
  DOM.uvBadge.textContent = uvInfo.label;
  DOM.uvBadge.style.backgroundColor = `${uvInfo.color}25`;
  DOM.uvBadge.style.color = uvInfo.color;
  DOM.uvBadge.style.border = `1px solid ${uvInfo.color}50`;

  // Air Quality Index
  const aqiInfo = classifyAQI(aqi);
  DOM.aqiVal.textContent = `${aqi} / 5`;
  DOM.aqiBadge.textContent = aqiInfo.label;
  DOM.aqiBadge.style.backgroundColor = `${aqiInfo.color}25`;
  DOM.aqiBadge.style.color = aqiInfo.color;
  DOM.aqiBadge.style.border = `1px solid ${aqiInfo.color}50`;
  DOM.aqiSubtext.textContent = aqiInfo.desc;

  // 5. Extended Telemetry Metrics
  if (DOM.dewPointVal) DOM.dewPointVal.textContent = `${convertTemp(current.dewPoint, isImp)}${unitSym}`;
  if (DOM.cloudsVal) DOM.cloudsVal.textContent = `${current.clouds}%`;
  if (DOM.visibilityVal) DOM.visibilityVal.textContent = isImp ? `${Math.round(current.visibility * 0.621371)} mi` : `${current.visibility} km`;
  if (DOM.rainVolVal) DOM.rainVolVal.textContent = isImp ? `${(current.rainVol * 0.0393701).toFixed(2)} in` : `${current.rainVol} mm`;

  // 6. Solar Arc Widget
  renderSolarArcUI(current.sunrise, current.sunset, current.dt, current.timezone);

  // 7. Moon Phase & Astronomy Card
  renderMoonPhaseUI();
  
  // 7.5 Celestial Tracker
  if (DOM.celestialTrackerVal) {
    if (state.isHistorical) {
      DOM.celestialTrackerVal.textContent = "Data Unavail";
    } else {
      const isNight = uv <= 0;
      const chance = Math.floor(Math.random() * 30) + (isNight ? 20 : 0);
      const event = (Math.random() > 0.5) ? "Aurora" : "Meteor Shower";
      DOM.celestialTrackerVal.textContent = `${event}: ${chance}%`;
    }
  }

  // 8. Outdoor Lifestyle Indices
  renderLifestyleUI(data);

  // 9. Disaster Mitigation Protocols Card
  renderDisasterMitigationUI(data);

  // 10. AI Weather Analyst Summary
  generateAISummary(data);

  // 11. Interactive Radar Visualizer Simulation
  initRadarSimulation();

  // 11. Hourly Timeline Rail (24h)
  renderHourlyRailUI(hourly, current.timezone);

  // 12. 5-Day Synoptic Outlook
  renderForecastListUI(daily);

  // 13. Analytics Line Chart (Chart.js)
  renderAnalyticsChart(DOM.chartCanvas, hourly, isImp, current.timezone);
}

function renderSevereAlertsUI(data) {
  if (!DOM.alertsContainer) return;
  DOM.alertsContainer.innerHTML = '';

  const alerts = evaluateSevereWeatherAlerts(data);
  if (alerts.length === 0) return;

  alerts.forEach(alert => {
    const card = document.createElement('div');
    card.className = `alert-card ${alert.levelClass}`;
    card.innerHTML = `
      <div class="alert-icon-box">
        <i class="${alert.icon}"></i>
      </div>
      <div class="alert-content">
        <div class="alert-header-row">
          <span class="alert-level-badge">${alert.level}</span>
          <span class="alert-title">${alert.title}</span>
        </div>
        <div class="alert-desc">${alert.desc}</div>
      </div>
    `;
    DOM.alertsContainer.appendChild(card);
  });
}

function renderDisasterMitigationUI(data) {
  if (!DOM.mitigationContainer) return;
  DOM.mitigationContainer.innerHTML = '';

  const protocol = getDisasterMitigationProtocols(data);
  
  const headerBox = document.createElement('div');
  headerBox.className = 'mitigation-header-box';
  headerBox.innerHTML = `
    <i class="${protocol.icon}" style="font-size: 1.3rem; color: ${protocol.color};"></i>
    <span class="mitigation-hazard-title">${protocol.hazard}</span>
  `;

  const stepsList = document.createElement('div');
  stepsList.className = 'mitigation-steps-list';

  protocol.steps.forEach((stepText, idx) => {
    const item = document.createElement('div');
    item.className = 'mitigation-step-item';
    item.innerHTML = `
      <span class="step-number">${idx + 1}</span>
      <span class="step-text">${stepText}</span>
    `;
    stepsList.appendChild(item);
  });

  DOM.mitigationContainer.appendChild(headerBox);
  DOM.mitigationContainer.appendChild(stepsList);
}

function renderSolarArcUI(sunrise, sunset, currentDt, timezone) {
  if (!DOM.sunriseTime || !DOM.sunsetTime) return;

  DOM.sunriseTime.textContent = formatTimeString(sunrise, timezone);
  DOM.sunsetTime.textContent = formatTimeString(sunset, timezone);

  const { progressPct, daylightDuration } = calculateSolarArc(sunrise, sunset, currentDt);
  if (DOM.daylightDuration) DOM.daylightDuration.textContent = `Daylight: ${daylightDuration}`;

  const pathTotalLength = DOM.solarPathFill && typeof DOM.solarPathFill.getTotalLength === 'function'
    ? DOM.solarPathFill.getTotalLength()
    : 188.5;
  const strokeOffset = pathTotalLength - ((progressPct / 100) * pathTotalLength);
  if (DOM.solarPathFill) {
    DOM.solarPathFill.style.strokeDasharray = `${pathTotalLength}`;
    DOM.solarPathFill.style.strokeDashoffset = `${strokeOffset}`;
  }

  const angleRad = Math.PI * (1 - (progressPct / 100));
  const sunX = 80 + 60 * Math.cos(angleRad);
  const sunY = 70 - 60 * Math.sin(angleRad);

  if (DOM.solarSunNode) {
    DOM.solarSunNode.setAttribute('cx', sunX);
    DOM.solarSunNode.setAttribute('cy', sunY);
  }
}

function renderMoonPhaseUI() {
  const moon = getMoonPhaseDetails();
  if (DOM.moonName) DOM.moonName.textContent = moon.name;
  if (DOM.moonIllumination) DOM.moonIllumination.textContent = `Illumination: ${moon.illumination}`;
  if (DOM.moonIcon) DOM.moonIcon.className = moon.icon;
}

function renderLifestyleUI(telemetry) {
  if (!DOM.lifestyleGrid) return;
  DOM.lifestyleGrid.innerHTML = '';

  const indices = evaluateLifestyleIndices(telemetry);
  indices.forEach(item => {
    const card = document.createElement('div');
    card.className = 'lifestyle-card';
    card.innerHTML = `
      <div class="lifestyle-icon">
        <i class="${item.icon}"></i>
      </div>
      <div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">${item.title}</div>
        <div style="font-size: 0.95rem; font-weight: 700; color: ${item.color};">${item.score}</div>
      </div>
    `;
    DOM.lifestyleGrid.appendChild(card);
  });
}

function initRadarSimulation() {
  let canvas = DOM.radarCanvas;
  if (!canvas) return;
  
  // Clone to remove old event listeners
  if (canvas.dataset.hasListeners) {
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    DOM.radarCanvas = newCanvas; // update ref
    canvas = newCanvas;
  }
  canvas.dataset.hasListeners = "true";
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.parentElement.clientWidth || 300;
  const height = canvas.height = canvas.parentElement.clientHeight || 240;

  if (radarAnimId) cancelAnimationFrame(radarAnimId);

  const centerX = width / 2;
  const centerY = height / 2;
  
  // Interactive state
  let mouseX = centerX;
  let mouseY = centerY;
  let isMouseHovering = false;
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    isMouseHovering = true;
  });
  
  canvas.addEventListener('mouseleave', () => {
    isMouseHovering = false;
  });
  
  // Custom storm cells
  let stormCells = [
    { x: centerX + 40, y: centerY - 30, r: 25, intensity: 0.8, vx: 0.1, vy: -0.05 },
    { x: centerX - 50, y: centerY + 20, r: 35, intensity: 0.6, vx: -0.05, vy: 0.1 }
  ];
  
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Spawn a new storm cell on click
    stormCells.push({
      x: clickX,
      y: clickY,
      r: Math.random() * 20 + 15,
      intensity: 1.0,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    });
  });

  const windParticles = [];
  const count = 60;
  for (let i = 0; i < count; i++) {
    windParticles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() * 2 + 1),
      vy: (Math.random() - 0.5) * 0.5,
      length: Math.random() * 10 + 5,
      alpha: Math.random() * 0.6 + 0.2
    });
  }

  let radarAngle = 0;

  function animateRadar() {
    // Fade effect for radar persistence (ghosting)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid & Distance Rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    
    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
    ctx.stroke();

    // Concentric circles
    const maxRadius = Math.max(width, height) / 2;
    const step = 40;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.font = "10px 'Outfit', sans-serif";
    
    for (let r = step; r < maxRadius; r += step) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
      if (r > 40 && r < maxRadius - 20) {
        ctx.fillText(`${r}km`, centerX + 4, centerY - r + 12);
      }
    }

    if (state.radarMode === 'wind') {
      windParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > width) p.x = 0;
        if (p.y < 0 || p.y > height) p.y = Math.random() * height;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    } else {
      // Precipitation Mode
      
      // Update & draw storm cells
      stormCells.forEach((cell, idx) => {
        cell.x += cell.vx;
        cell.y += cell.vy;
        cell.intensity -= 0.0005; // slowly dissipate
        if (cell.intensity <= 0) {
          stormCells.splice(idx, 1);
          return;
        }
        
        // Draw cell with radial gradient
        const grd = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.r);
        grd.addColorStop(0, `rgba(239, 68, 68, ${cell.intensity * 0.8})`); // Red core
        grd.addColorStop(0.4, `rgba(234, 179, 8, ${cell.intensity * 0.6})`); // Yellow mid
        grd.addColorStop(1, 'rgba(34, 197, 94, 0)'); // Green edge
        
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Radar Sweep Vector
      radarAngle += 0.03;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(radarAngle);
      
      // Sweep gradient wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, 0, -0.4, true);
      ctx.closePath();
      
      const sweepGrd = ctx.createLinearGradient(0, 0, 0, -maxRadius);
      sweepGrd.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
      sweepGrd.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = sweepGrd;
      ctx.fill();
      
      // Sweep leading edge line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw Interactive Crosshair if hovering
    if (isMouseHovering) {
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(mouseX - 10, mouseY); ctx.lineTo(mouseX + 10, mouseY);
      ctx.moveTo(mouseX, mouseY - 10); ctx.lineTo(mouseX, mouseY + 10);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Display distance from center
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const dist = Math.round(Math.sqrt(dx*dx + dy*dy));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(`${dist}km`, mouseX + 10, mouseY - 10);
    }

    radarAnimId = requestAnimationFrame(animateRadar);
  }

  animateRadar();
}

function initGlobeSimulation() {
  const canvas = DOM.globeCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = 85;

  let time = 0;
  
  // Points on a sphere
  const points = [];
  const lats = 12;
  const lons = 24;
  for(let i = 0; i <= lats; i++) {
    const lat = Math.PI * i / lats;
    for(let j = 0; j <= lons; j++) {
      const lon = 2 * Math.PI * j / lons;
      const x = Math.sin(lat) * Math.cos(lon);
      const y = Math.sin(lat) * Math.sin(lon);
      const z = Math.cos(lat);
      points.push({x, y, z});
    }
  }

  function drawGlobe() {
    ctx.clearRect(0, 0, w, h);
    time += 0.01;

    // Draw Atmosphere glow
    const grd = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 20);
    grd.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    grd.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw sphere background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Rotate and project points
    ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
    for(let p of points) {
      // Rotate around Y axis
      const rotX = p.x * Math.cos(time) - p.z * Math.sin(time);
      const rotZ = p.x * Math.sin(time) + p.z * Math.cos(time);
      const rotY = p.y;
      
      // Tilt slightly
      const tilt = 0.4;
      const finalY = rotY * Math.cos(tilt) - rotZ * Math.sin(tilt);
      const finalZ = rotY * Math.sin(tilt) + rotZ * Math.cos(tilt);
      const finalX = rotX;
      
      // Only draw front half
      if (finalZ < 0) {
        const px = cx + finalX * r;
        const py = cy + finalY * r;
        const pSize = 1.5;
        
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI*2);
        ctx.fill();
      }
    }
    
    // Draw equator line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.4, 0.4, 0, Math.PI * 2);
    ctx.stroke();

    requestAnimationFrame(drawGlobe);
  }
  
  drawGlobe();
}

function initDragAndDrop() {
  const mainCol = document.querySelector('.main-column');
  if (!mainCol) return;

  const cards = Array.from(mainCol.querySelectorAll('section.glass-card, section.telemetry-grid, section.extended-metrics-grid'));
  
  // Assign IDs and make draggable
  cards.forEach((card, i) => {
    if (!card.id) card.id = `widget-${i}`;
    // Exclude hero banner
    if (!card.classList.contains('hero-weather-card')) {
      card.setAttribute('draggable', 'true');
      card.classList.add('glass-card'); // ensure it has the class for styling
    }
  });

  // Load saved order
  const savedOrder = JSON.parse(localStorage.getItem('weather_dash_layout_v1'));
  if (savedOrder && savedOrder.length > 0) {
    savedOrder.forEach(id => {
      const el = document.getElementById(id);
      if (el && mainCol.contains(el)) {
        mainCol.appendChild(el);
      }
    });
  }

  let draggedItem = null;

  cards.forEach(card => {
    if (card.getAttribute('draggable') !== 'true') return;

    card.addEventListener('dragstart', function (e) {
      draggedItem = this;
      setTimeout(() => this.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', function () {
      setTimeout(() => {
        this.classList.remove('dragging');
        draggedItem = null;
        saveLayout();
      }, 0);
    });

    mainCol.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!draggedItem) return;
      const afterElement = getDragAfterElement(mainCol, e.clientY);
      if (afterElement == null) {
        mainCol.appendChild(draggedItem);
      } else {
        mainCol.insertBefore(draggedItem, afterElement);
      }
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.glass-card:not(.dragging)[draggable="true"]')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function saveLayout() {
    const currentOrder = [...mainCol.querySelectorAll('.glass-card, .telemetry-grid')].map(c => c.id);
    localStorage.setItem('weather_dash_layout_v1', JSON.stringify(currentOrder));
  }
}

function generateAISummary(data) {
  const summaryEl = document.getElementById('ai-summary-text');
  if (!summaryEl) return;
  
  const { current } = data;
  const isImp = state.isImperial;
  const tempVal = convertTemp(current.temp, isImp);
  const tempUnit = isImp ? '°F' : '°C';
  const windVal = convertSpeed(current.wind_speed, isImp);
  
  let summary = `Aether AI Analysis: Current telemetry for ${current.name} indicates ${current.description} conditions. `;
  
  if (current.temp > 30) {
    summary += `Thermal readings are high at ${tempVal}${tempUnit}. Heat mitigation protocols advised. `;
  } else if (current.temp < 5) {
    summary += `Thermal readings are low at ${tempVal}${tempUnit}. Risk of freezing. `;
  } else {
    summary += `Temperatures are stable at ${tempVal}${tempUnit}, optimal for nominal operations. `;
  }
  
  if (current.wind_speed > 20) {
    summary += `High wind velocity detected (${windVal}). Secure outdoor equipment. `;
  }
  
  if (current.humidity > 80) {
    summary += `Atmospheric moisture is elevated (${current.humidity}%). `;
  }
  
  if (state.isHistorical) {
    summary += `Note: Displaying historical records from Time Machine core.`;
  } else {
    summary += `Predictive models suggest conditions will hold for the next 3 hours.`;
  }
  
  // Typewriter effect
  summaryEl.textContent = '';
  let i = 0;
  
  if (summaryEl._typingInterval) clearInterval(summaryEl._typingInterval);
  
  summaryEl._typingInterval = setInterval(() => {
    if (i < summary.length) {
      summaryEl.textContent += summary.charAt(i);
      i++;
    } else {
      clearInterval(summaryEl._typingInterval);
    }
  }, 25);
}


function renderHourlyRailUI(hourlyData, timezoneOffset) {
  if (!DOM.hourlyRail) return;
  DOM.hourlyRail.innerHTML = '';

  if (!hourlyData || hourlyData.length === 0) {
    DOM.hourlyRail.innerHTML = '<p class="text-muted">No hourly data available.</p>';
    return;
  }

  hourlyData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    const timeStr = formatHour(item.dt, timezoneOffset);
    const tempVal = convertTemp(item.temp, state.isImperial);
    const unitSym = state.isImperial ? '°F' : '°C';
    const { icon } = getWeatherThemeAndIcon(item.weatherId, item.icon);

    card.innerHTML = `
      <span class="hourly-time">${timeStr}</span>
      <i class="hourly-icon ${icon}"></i>
      <span class="hourly-temp">${tempVal}${unitSym}</span>
      <span class="hourly-pop" title="Precipitation Probability">
        <i class="fa-solid fa-droplet"></i> ${item.pop}%
      </span>
    `;

    DOM.hourlyRail.appendChild(card);
  });
}

function renderForecastListUI(dailyData) {
  if (!DOM.forecastList) return;
  DOM.forecastList.innerHTML = '';

  if (!dailyData || dailyData.length === 0) {
    DOM.forecastList.innerHTML = '<p class="text-muted">No forecast available.</p>';
    return;
  }

  const allMins = dailyData.map(d => d.minTemp);
  const allMaxs = dailyData.map(d => d.maxTemp);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const rangeSpan = (globalMax - globalMin) || 1;

  dailyData.forEach((day, index) => {
    const item = document.createElement('div');
    item.className = 'forecast-item';

    const dayTitle = index === 0 ? 'Today' : formatDayName(day.dt);
    const dateStr = formatShortDate(day.dt);
    const { icon } = getWeatherThemeAndIcon(day.weatherId, day.icon);

    const minConverted = convertTemp(day.minTemp, state.isImperial);
    const maxConverted = convertTemp(day.maxTemp, state.isImperial);
    const unitSym = state.isImperial ? '°F' : '°C';

    const leftPct = Math.round(((day.minTemp - globalMin) / rangeSpan) * 100);
    const widthPct = Math.max(15, Math.round(((day.maxTemp - day.minTemp) / rangeSpan) * 100));

    item.innerHTML = `
      <div>
        <span class="forecast-day">${dayTitle}</span>
        <span class="forecast-date">${dateStr}</span>
      </div>
      <i class="forecast-icon ${icon}"></i>
      <div class="temp-range-bar-container">
        <div class="temp-range-bar">
          <div class="temp-range-fill" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
        </div>
      </div>
      <span class="forecast-min-max">${minConverted}° / ${maxConverted}${unitSym}</span>
    `;

    DOM.forecastList.appendChild(item);
  });
}

function renderHistoryChips() {
  if (!DOM.historyContainer) return;
  DOM.historyContainer.innerHTML = '';

  if (state.searchHistory.length === 0) {
    DOM.historyContainer.innerHTML = '<span class="chip-label">Recent: None</span>';
    return;
  }

  const label = document.createElement('span');
  label.className = 'chip-label';
  label.textContent = 'Recent:';
  DOM.historyContainer.appendChild(label);

  state.searchHistory.forEach(city => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'history-chip';
    chip.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${city}`;
    chip.addEventListener('click', () => {
      loadWeatherData(city);
    });
    DOM.historyContainer.appendChild(chip);
  });
}

function renderFavoritesChips() {
  if (!DOM.favoritesContainer) return;
  DOM.favoritesContainer.innerHTML = '';

  if (state.favorites.length === 0) return;

  const label = document.createElement('span');
  label.className = 'chip-label';
  label.textContent = 'Favs:';
  DOM.favoritesContainer.appendChild(label);

  state.favorites.forEach(city => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'fav-chip';
    chip.innerHTML = `<i class="fa-solid fa-star"></i> ${city}`;
    chip.addEventListener('click', () => {
      loadWeatherData(city);
    });
    DOM.favoritesContainer.appendChild(chip);
  });
}

function setLoadingState(isLoading) {
  state.isLoading = isLoading;
  const elementsToSkeleton = [
    DOM.locationName, DOM.heroDegree, DOM.weatherText,
    DOM.feelsLikeVal, DOM.humidityVal, DOM.windVal, DOM.pressureVal, DOM.uvVal, DOM.aqiVal
  ];

  elementsToSkeleton.forEach(el => {
    if (el) {
      if (isLoading) el.classList.add('skeleton');
      else el.classList.remove('skeleton');
    }
  });
}
