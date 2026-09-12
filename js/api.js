/**
 * Weather Analytics Engine - API Network Layer & Mock Telemetry Simulator
 */

import { calculateDewPoint } from './utils.js';

// Place your OpenWeatherMap API Key here. If left empty, Mock Simulator automatically executes.
const API_KEY = "";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

/**
 * Main telemetry aggregator for fetching current weather, forecast, UV, and Air Quality.
 */
export async function fetchWeatherTelemetry(cityOrCoords) {
  // If API key is not configured, transparently use Mock Telemetry Engine
  if (!API_KEY || API_KEY.trim() === "") {
    console.info("⚡ OpenWeather API key empty. Launching Mock Telemetry Simulator.");
    return generateMockTelemetry(cityOrCoords);
  }

  try {
    let lat, lon, cityName, countryCode;

    if (typeof cityOrCoords === "string") {
      const geoUrl = `${GEO_URL}/direct?q=${encodeURIComponent(cityOrCoords)}&limit=1&appid=${API_KEY}`;
      const geoRes = await fetch(geoUrl);

      if (!geoRes.ok) {
        if (geoRes.status === 401) throw new Error("Invalid API key provided.");
        throw new Error(`Geocoding error (${geoRes.status})`);
      }

      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) {
        throw new Error(`Location "${cityOrCoords}" not found.`);
      }

      lat = geoData[0].lat;
      lon = geoData[0].lon;
      cityName = geoData[0].name;
      countryCode = geoData[0].country;
    } else if (cityOrCoords.lat && cityOrCoords.lon) {
      lat = cityOrCoords.lat;
      lon = cityOrCoords.lon;
    } else {
      throw new Error("Invalid search parameter.");
    }

    const weatherReq = fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const forecastReq = fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const aqiReq = fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);

    const [weatherRes, forecastRes, aqiRes] = await Promise.all([weatherReq, forecastReq, aqiReq]);

    if (!weatherRes.ok) {
      if (weatherRes.status === 404) throw new Error("Location telemetry not found.");
      if (weatherRes.status === 401) throw new Error("Unauthorized API Key.");
      throw new Error(`Weather query failed (${weatherRes.status})`);
    }

    const currentRaw = await weatherRes.json();
    const forecastRaw = forecastRes.ok ? await forecastRes.json() : null;
    const aqiRaw = aqiRes.ok ? await aqiRes.json() : null;

    return transformOpenWeatherData(currentRaw, forecastRaw, aqiRaw, cityName || currentRaw.name, countryCode || currentRaw.sys.country);
  } catch (error) {
    console.warn("⚠️ API fetch failed or network offline. Falling back to Mock Telemetry Simulator.", error.message);
    return generateMockTelemetry(cityOrCoords, error.message);
  }
}

/**
 * Transform OpenWeather raw JSON payloads into normalized internal telemetry structure.
 */
function transformOpenWeatherData(current, forecast, aqi, cityName, countryCode) {
  const hourly = forecast ? forecast.list.slice(0, 8).map(item => ({
    dt: item.dt,
    temp: item.main.temp,
    humidity: item.main.humidity,
    pop: Math.round((item.pop || 0) * 100),
    weatherId: item.weather[0].id,
    icon: item.weather[0].icon,
    description: item.weather[0].description
  })) : [];

  const dailyMap = {};
  if (forecast && forecast.list) {
    forecast.list.forEach(item => {
      const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          dt: item.dt,
          temps: [],
          weatherIds: [],
          icons: []
        };
      }
      dailyMap[dateKey].temps.push(item.main.temp);
      dailyMap[dateKey].weatherIds.push(item.weather[0].id);
      dailyMap[dateKey].icons.push(item.weather[0].icon);
    });
  }

  const daily = Object.keys(dailyMap).slice(0, 5).map(dateKey => {
    const dayObj = dailyMap[dateKey];
    const minTemp = Math.min(...dayObj.temps);
    const maxTemp = Math.max(...dayObj.temps);
    const midIndex = Math.floor(dayObj.icons.length / 2);
    return {
      dt: dayObj.dt,
      minTemp,
      maxTemp,
      weatherId: dayObj.weatherIds[midIndex] || dayObj.weatherIds[0],
      icon: dayObj.icons[midIndex] || dayObj.icons[0]
    };
  });

  const aqiValue = aqi && aqi.list && aqi.list[0] ? aqi.list[0].main.aqi : 2;
  const sunrise = current.sys ? current.sys.sunrise : (current.dt - 21600);
  const sunset = current.sys ? current.sys.sunset : (current.dt + 21600);
  const visibilityKm = current.visibility ? Math.round((current.visibility / 1000) * 10) / 10 : 10;
  const clouds = current.clouds ? current.clouds.all : 20;
  const dewPoint = calculateDewPoint(current.main.temp, current.main.humidity);
  const rainVol = current.rain && current.rain['1h'] ? current.rain['1h'] : 0;

  return {
    isMock: false,
    current: {
      name: cityName || current.name,
      country: countryCode || current.sys.country || '',
      lat: current.coord.lat,
      lon: current.coord.lon,
      temp: current.main.temp,
      feels_like: current.main.feels_like,
      temp_min: current.main.temp_min,
      temp_max: current.main.temp_max,
      humidity: current.main.humidity,
      wind_speed: Math.round(current.wind.speed * 3.6),
      wind_deg: current.wind.deg || 0,
      pressure: current.main.pressure,
      weatherId: current.weather[0].id,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      timezone: current.timezone,
      dt: current.dt,
      sunrise,
      sunset,
      visibility: visibilityKm,
      clouds,
      dewPoint,
      rainVol
    },
    hourly,
    daily,
    uv: calculateEstimatedUV(current.weather[0].id, current.dt, current.timezone),
    aqi: aqiValue
  };
}

/**
 * Dynamic Mock Telemetry Simulator
 * Generates realistic weather, hourly timeline, 5-day synoptic outlook, solar & lunar metrics for any query.
 */
function generateMockTelemetry(cityOrCoords, fallbackReason = null) {
  let cityName = "Tokyo";
  let countryCode = "JP";
  let lat = 35.6762;
  let lon = 139.6503;

  if (typeof cityOrCoords === "string") {
    const cleanQuery = cityOrCoords.trim();
    const parts = cleanQuery.split(",");
    cityName = capitalizeWords(parts[0]);
    if (parts[1]) countryCode = parts[1].trim().toUpperCase();
  } else if (cityOrCoords.lat && cityOrCoords.lon) {
    cityName = "Current Location";
    countryCode = "GPS";
    lat = cityOrCoords.lat;
    lon = cityOrCoords.lon;
  }

  const cityProfiles = {
    "Tokyo": { country: "JP", temp: 21, feels: 20, humidity: 58, wind: 14, windDeg: 130, weatherId: 800, desc: "clear sky", icon: "01d", pressure: 1014, aqi: 1, uv: 6.2, tz: 32400, clouds: 10, vis: 10.0, rainVol: 0 },
    "London": { country: "GB", temp: 16, feels: 15, humidity: 76, wind: 22, windDeg: 240, weatherId: 500, desc: "light rain", icon: "10d", pressure: 1008, aqi: 2, uv: 3.8, tz: 3600, clouds: 85, vis: 7.5, rainVol: 4.2 },
    "New York": { country: "US", temp: 24, feels: 25, humidity: 62, wind: 18, windDeg: 190, weatherId: 802, desc: "scattered clouds", icon: "03d", pressure: 1018, aqi: 2, uv: 7.5, tz: -14400, clouds: 40, vis: 10.0, rainVol: 0 },
    "Paris": { country: "FR", temp: 19, feels: 18, humidity: 68, wind: 12, windDeg: 160, weatherId: 801, desc: "few clouds", icon: "02d", pressure: 1016, aqi: 2, uv: 5.4, tz: 7200, clouds: 25, vis: 9.8, rainVol: 0 },
    "Sydney": { country: "AU", temp: 18, feels: 17, humidity: 52, wind: 26, windDeg: 170, weatherId: 800, desc: "clear sky", icon: "01d", pressure: 1022, aqi: 1, uv: 8.1, tz: 36000, clouds: 5, vis: 10.0, rainVol: 0 },
    "Dubai": { country: "AE", temp: 36, feels: 41, humidity: 45, wind: 16, windDeg: 310, weatherId: 800, desc: "sunny", icon: "01d", pressure: 1006, aqi: 3, uv: 9.8, tz: 14400, clouds: 0, vis: 8.0, rainVol: 0 },
    "Reykjavik": { country: "IS", temp: -1, feels: -6, humidity: 85, wind: 48, windDeg: 45, weatherId: 600, desc: "light snow", icon: "13d", pressure: 998, aqi: 1, uv: 1.2, tz: 0, clouds: 95, vis: 4.2, rainVol: 0 },
    "Mumbai": { country: "IN", temp: 29, feels: 34, humidity: 84, wind: 15, windDeg: 210, weatherId: 501, desc: "heavy rain", icon: "10d", pressure: 1009, aqi: 4, uv: 6.8, tz: 19800, clouds: 90, vis: 5.0, rainVol: 18.5 }
  };

  const matchedKey = Object.keys(cityProfiles).find(k => k.toLowerCase() === cityName.toLowerCase());
  let profile = matchedKey ? cityProfiles[matchedKey] : null;

  if (!profile) {
    const hash = simpleHash(cityName);
    const mockTemps = [12, 18, 22, 27, 31, 8, 15, 25];
    const mockWeatherIds = [800, 801, 802, 803, 500, 600, 701];
    const mockDescs = ["clear sky", "few clouds", "scattered clouds", "broken clouds", "light rain", "mist"];
    
    const baseTemp = mockTemps[hash % mockTemps.length];
    const wId = mockWeatherIds[hash % mockWeatherIds.length];
    
    profile = {
      country: countryCode || "INT",
      temp: baseTemp,
      feels: baseTemp + (hash % 3) - 1,
      humidity: 45 + (hash % 45),
      wind: 8 + (hash % 24),
      windDeg: (hash * 37) % 360,
      weatherId: wId,
      desc: mockDescs[hash % mockDescs.length],
      icon: wId === 800 ? "01d" : wId === 500 ? "10d" : "03d",
      pressure: 1008 + (hash % 16),
      aqi: 1 + (hash % 4),
      uv: 3 + ((hash % 70) / 10),
      tz: 0,
      clouds: 20 + (hash % 60),
      vis: 8.0 + ((hash % 20) / 10),
      rainVol: wId >= 500 && wId < 600 ? 5.5 : 0
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const sunrise = nowSec - (6 * 3600);
  const sunset = nowSec + (6 * 3600);
  const dewPoint = calculateDewPoint(profile.temp, profile.humidity);

  // Generate 24-hour micro-timeline
  const hourly = [];
  for (let i = 0; i < 8; i++) {
    const dt = nowSec + (i * 3 * 3600);
    const tempVar = Math.sin(i / 2) * 2.5;
    const itemTemp = Math.round((profile.temp + tempVar) * 10) / 10;
    const pop = profile.weatherId >= 500 && profile.weatherId < 600 ? 60 + (i * 5) % 35 : (i * 12) % 30;
    
    hourly.push({
      dt,
      temp: itemTemp,
      humidity: Math.min(95, Math.max(30, profile.humidity + Math.round(tempVar * -2))),
      pop,
      weatherId: profile.weatherId,
      icon: profile.icon,
      description: profile.desc
    });
  }

  // Generate 5-Day synoptic forecast
  const daily = [];
  for (let i = 0; i < 5; i++) {
    const dt = nowSec + (i * 24 * 3600);
    const dayVariation = Math.sin(i) * 3;
    const minTemp = Math.round(profile.temp - 4 + dayVariation);
    const maxTemp = Math.round(profile.temp + 4 + dayVariation);
    
    daily.push({
      dt,
      minTemp,
      maxTemp,
      weatherId: profile.weatherId,
      icon: profile.icon
    });
  }

  return {
    isMock: true,
    fallbackReason,
    current: {
      name: cityName,
      country: profile.country,
      lat,
      lon,
      temp: profile.temp,
      feels_like: profile.feels,
      temp_min: profile.temp - 4,
      temp_max: profile.temp + 5,
      humidity: profile.humidity,
      wind_speed: profile.wind,
      wind_deg: profile.windDeg,
      pressure: profile.pressure,
      weatherId: profile.weatherId,
      description: profile.desc,
      icon: profile.icon,
      timezone: profile.tz,
      dt: nowSec,
      sunrise,
      sunset,
      visibility: profile.vis,
      clouds: profile.clouds,
      dewPoint,
      rainVol: profile.rainVol
    },
    hourly,
    daily,
    uv: profile.uv,
    aqi: profile.aqi
  };
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function calculateEstimatedUV(weatherId, dt, tz) {
  if (weatherId >= 500 && weatherId < 700) return 2.1;
  if (weatherId > 801) return 4.5;
  return 6.8;
}
