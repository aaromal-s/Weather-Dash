/**
 * Weather Analytics Engine - Utility Functions & Metric Conversion Engine
 */

// Unit Conversions
export function celsiusToFahrenheit(c) {
  return Math.round((c * 9) / 5 + 32);
}

export function kmhToMph(kmh) {
  return Math.round(kmh * 0.621371);
}

export function hPaToInHg(hPa) {
  return (hPa * 0.02953).toFixed(2);
}

export function convertTemp(celsiusValue, isImperial) {
  if (isImperial) {
    return celsiusToFahrenheit(celsiusValue);
  }
  return Math.round(celsiusValue);
}

export function convertSpeed(kmhValue, isImperial) {
  if (isImperial) {
    return `${kmhToMph(kmhValue)} mph`;
  }
  return `${Math.round(kmhValue)} km/h`;
}

export function convertPressure(hPaValue, isImperial) {
  if (isImperial) {
    return `${hPaToInHg(hPaValue)} inHg`;
  }
  return `${Math.round(hPaValue)} hPa`;
}

// Dew Point Calculation: T_dp = T - ((100 - RH)/5)
export function calculateDewPoint(tempC, humidity) {
  return Math.round(tempC - ((100 - humidity) / 5));
}

// Wind Compass Needle Orientation
export function degreesToCompass(deg) {
  const val = Math.floor((deg / 22.5) + 0.5);
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];
  return directions[val % 16] || "N";
}

// UV Index Risk Scale Classifier
export function classifyUVIndex(uv) {
  const rounded = Math.round(uv);
  if (rounded <= 2) {
    return { label: "Low", color: "var(--uv-low)", badgeClass: "uv-low" };
  } else if (rounded <= 5) {
    return { label: "Moderate", color: "var(--uv-mod)", badgeClass: "uv-mod" };
  } else if (rounded <= 7) {
    return { label: "High", color: "var(--uv-high)", badgeClass: "uv-high" };
  } else if (rounded <= 10) {
    return { label: "Very High", color: "var(--uv-very-high)", badgeClass: "uv-very-high" };
  } else {
    return { label: "Extreme", color: "var(--uv-extreme)", badgeClass: "uv-extreme" };
  }
}

// Air Quality Index (AQI 1-5 Scale) Classifier
export function classifyAQI(aqiVal) {
  const val = Number(aqiVal);
  switch (val) {
    case 1:
      return { label: "Good", color: "var(--aqi-good)", desc: "Air quality is satisfactory and poses little risk." };
    case 2:
      return { label: "Fair", color: "var(--aqi-fair)", desc: "Air quality is acceptable for most individuals." };
    case 3:
      return { label: "Moderate", color: "var(--aqi-moderate)", desc: "Sensitive individuals may experience minor irritation." };
    case 4:
      return { label: "Poor", color: "var(--aqi-poor)", desc: "Unhealthy for sensitive groups; limit heavy outdoor activity." };
    case 5:
      return { label: "Very Poor", color: "var(--aqi-very-poor)", desc: "Health alert: everyone may experience health effects." };
    default:
      return { label: "Moderate", color: "var(--aqi-moderate)", desc: "Moderate air quality index." };
  }
}

// Map Weather Condition ID to FontAwesome Icon & Background Theme State
export function getWeatherThemeAndIcon(weatherId, iconCode = '') {
  const isNight = iconCode.endsWith('n');
  
  if (weatherId === 800) {
    return {
      theme: 'theme-clear',
      icon: isNight ? 'fa-solid fa-moon' : 'fa-solid fa-sun',
      color: '#fde047',
      bgPhoto: 'assets/bg_sunny.png'
    };
  }
  
  if (weatherId > 800 && weatherId < 900) {
    if (weatherId === 801) {
      return {
        theme: 'theme-clear',
        icon: isNight ? 'fa-solid fa-cloud-moon' : 'fa-solid fa-cloud-sun',
        color: '#fbbf24',
        bgPhoto: 'assets/bg_sunny.png'
      };
    }
    return {
      theme: 'theme-cloudy',
      icon: 'fa-solid fa-cloud',
      color: '#94a3b8',
      bgPhoto: 'assets/bg_cloudy.png'
    };
  }
  
  if (weatherId >= 200 && weatherId < 300) {
    return {
      theme: 'theme-rain',
      icon: 'fa-solid fa-cloud-bolt',
      color: '#a855f7',
      bgPhoto: 'assets/bg_rain.png'
    };
  }
  
  if (weatherId >= 300 && weatherId < 600) {
    return {
      theme: 'theme-rain',
      icon: 'fa-solid fa-cloud-showers-heavy',
      color: '#38bdf8',
      bgPhoto: 'assets/bg_rain.png'
    };
  }
  
  if (weatherId >= 600 && weatherId < 700) {
    return {
      theme: 'theme-snow',
      icon: 'fa-solid fa-snowflake',
      color: '#e2e8f0',
      bgPhoto: 'assets/bg_snow.png'
    };
  }
  
  if (weatherId >= 700 && weatherId < 800) {
    return {
      theme: 'theme-atmosphere',
      icon: 'fa-solid fa-smog',
      color: '#2dd4bf',
      bgPhoto: 'assets/bg_mist.png'
    };
  }
  
  return {
    theme: 'theme-clear',
    icon: 'fa-solid fa-cloud-sun',
    color: '#fbbf24',
    bgPhoto: 'assets/bg_sunny.png'
  };
}

// Severe Weather Warnings & Hazard Evaluator
export function evaluateSevereWeatherAlerts(telemetry) {
  const { current, uv, aqi } = telemetry;
  const temp = current.temp;
  const wind = current.wind_speed;
  const weatherId = current.weatherId;
  const humidity = current.humidity;

  const alerts = [];

  // Heavy Rain / Flood Warning
  if (weatherId >= 200 && weatherId < 300) {
    alerts.push({
      level: 'WARNING',
      levelClass: 'alert-warning',
      title: 'Thunderstorm & Lightning Hazard',
      desc: 'Severe convective thunderstorm in effect. High risk of cloud-to-ground lightning strikes and localized flash flooding.',
      icon: 'fa-solid fa-cloud-bolt'
    });
  } else if (weatherId >= 500 && weatherId < 600 && humidity > 80) {
    alerts.push({
      level: 'WATCH',
      levelClass: 'alert-watch',
      title: 'Heavy Rain & Flash Flood Watch',
      desc: 'Sustained rainfall may cause urban drainage overflow and low-lying inundation.',
      icon: 'fa-solid fa-cloud-showers-water'
    });
  }

  // Gale Wind Advisory
  if (wind >= 35) {
    alerts.push({
      level: wind >= 50 ? 'EMERGENCY' : 'WARNING',
      levelClass: wind >= 50 ? 'alert-emergency' : 'alert-warning',
      title: wind >= 50 ? 'Severe Gale Force Storm Warning' : 'High Wind Advisory',
      desc: `Destructive wind gusts of ${wind} km/h detected. Danger of falling tree branches and unanchored structural debris.`,
      icon: 'fa-solid fa-wind'
    });
  }

  // Extreme Heat Advisory
  if (temp >= 34 || current.feels_like >= 38) {
    alerts.push({
      level: 'WARNING',
      levelClass: 'alert-warning',
      title: 'Extreme Heatwave Advisory',
      desc: `Heat index reaching ${Math.round(current.feels_like)}°C. High risk of heat exhaustion and sunstroke during prolonged exposure.`,
      icon: 'fa-solid fa-temperature-arrow-up'
    });
  }

  // Blizzard / Freezing Snow Warning
  if (weatherId >= 600 && weatherId < 700) {
    alerts.push({
      level: 'WATCH',
      levelClass: 'alert-watch',
      title: 'Blizzard & Icy Roads Warning',
      desc: 'Sub-zero accumulation and freezing precipitation creating hazardous black ice conditions on roadways.',
      icon: 'fa-solid fa-snowflake'
    });
  }

  // UV Radiation Hazard
  if (uv >= 8.0) {
    alerts.push({
      level: 'ADVISORY',
      levelClass: 'alert-advisory',
      title: 'Very High UV Radiation Hazard',
      desc: `UV index at ${uv}. Unprotected skin burn risk in under 15 minutes. Wear SPF50+ sunscreen and protective eyewear.`,
      icon: 'fa-solid fa-sun'
    });
  }

  // AQI Pollution Emergency
  if (aqi >= 4) {
    alerts.push({
      level: aqi === 5 ? 'EMERGENCY' : 'WARNING',
      levelClass: aqi === 5 ? 'alert-emergency' : 'alert-warning',
      title: aqi === 5 ? 'Hazardous Air Quality Emergency' : 'Unhealthy Air Quality Alert',
      desc: 'High concentration of fine particulate matter (PM2.5). Avoid outdoor physical exertion.',
      icon: 'fa-solid fa-mask-face'
    });
  }

  return alerts;
}

// Disaster Mitigation & Emergency Preparedness Protocols
export function getDisasterMitigationProtocols(telemetry) {
  const { current, aqi } = telemetry;
  const weatherId = current.weatherId;
  const wind = current.wind_speed;
  const temp = current.temp;

  if (weatherId >= 200 && weatherId < 600) {
    return {
      hazard: 'Heavy Rainfall & Flood Preparedness',
      icon: 'fa-solid fa-house-flood-water',
      color: 'var(--accent-cyan)',
      steps: [
        'Elevate electrical appliances and valuable goods above floor level.',
        'Avoid driving or walking through standing flood waters ("Turn Around, Don\'t Drown").',
        'Check storm drains near property and clear debris blockage.',
        'Keep emergency dry kit ready with battery radio, flashlight, and clean drinking water.'
      ]
    };
  }

  if (wind >= 30) {
    return {
      hazard: 'High Wind & Storm Mitigation',
      icon: 'fa-solid fa-building-shield',
      color: 'var(--accent-amber)',
      steps: [
        'Secure or store outdoor patio furniture, trash bins, and light structures.',
        'Park vehicles away from mature trees, utility poles, and loose construction scaffolding.',
        'Close and lock all windows and storm shutters securely.',
        'Maintain distance from downed power lines and report immediate hazards to emergency services.'
      ]
    };
  }

  if (temp >= 33) {
    return {
      hazard: 'Extreme Heat & Hydration Protocol',
      icon: 'fa-solid fa-bottle-water',
      color: 'var(--accent-rose)',
      steps: [
        'Drink electrolytes and water continuously even if not feeling thirsty.',
        'Avoid direct sunlight exposure between 11:00 AM and 4:00 PM.',
        'Utilize cooling centers or air-conditioned spaces to regulate core body temperature.',
        'Never leave children or pets inside stationary vehicles for any duration.'
      ]
    };
  }

  if (weatherId >= 600 && weatherId < 700) {
    return {
      hazard: 'Winter Blizzard & Hypothermia Defense',
      icon: 'fa-solid fa-snowflake',
      color: 'var(--accent-blue)',
      steps: [
        'Insulate exposed household water pipes to prevent freezing and bursts.',
        'Equip personal vehicles with emergency blankets, tow ropes, and non-perishable rations.',
        'Dress in multiple lightweight, warm layers rather than one heavy jacket.',
        'Recognize hypothermia signs: uncontrollable shivering, numbness, and slurred speech.'
      ]
    };
  }

  if (aqi >= 4) {
    return {
      hazard: 'Hazardous Air Pollution Defense',
      icon: 'fa-solid fa-lungs',
      color: 'var(--accent-purple)',
      steps: [
        'Wear certified N95 / KN95 respirator masks when stepping outdoors.',
        'Run indoor HEPA air purifiers continuously on recirculation mode.',
        'Keep doors and windows sealed tight to minimize particulate infiltration.',
        'Rinse eyes and exposed skin after returning from outdoor environments.'
      ]
    };
  }

  // Baseline Safety Protocol
  return {
    hazard: 'General Weather Safety & Preparedness',
    icon: 'fa-solid fa-shield-halved',
    color: 'var(--accent-emerald)',
    steps: [
      'Maintain an updated household emergency kit with first-aid supplies.',
      'Monitor local meteorological updates for sudden atmospheric shifts.',
      'Charge portable power banks in case of utility grid fluctuations.',
      'Ensure family communication plan is active for severe weather events.'
    ]
  };
}

// Date & Time Formatters
export function formatLocalTime(timezoneOffsetSeconds = 0) {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetDate = new Date(utcMs + (timezoneOffsetSeconds * 1000));
  
  const options = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return targetDate.toLocaleDateString('en-US', options);
}

export function formatTimeString(timestampSeconds, timezoneOffsetSeconds = 0) {
  if (!timestampSeconds) return '--:--';
  const utcMs = timestampSeconds * 1000;
  const targetDate = new Date(utcMs + (timezoneOffsetSeconds * 1000));
  let hours = targetDate.getUTCHours();
  let minutes = targetDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatHour(timestampSeconds, timezoneOffsetSeconds = 0) {
  const utcMs = timestampSeconds * 1000;
  const targetDate = new Date(utcMs + (timezoneOffsetSeconds * 1000));
  let hours = targetDate.getUTCHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours} ${ampm}`;
}

export function formatDayName(timestampSeconds) {
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatShortDate(timestampSeconds) {
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
}

// Solar Arc Trajectory Calculation
export function calculateSolarArc(sunriseSec, sunsetSec, currentSec) {
  if (!sunriseSec || !sunsetSec) {
    return { progressPct: 50, isDaytime: true, daylightDuration: '12h 00m' };
  }

  const durationSec = sunsetSec - sunriseSec;
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const daylightDuration = `${hours}h ${minutes}m`;

  const isDaytime = currentSec >= sunriseSec && currentSec <= sunsetSec;
  let progressPct = 0;

  if (currentSec < sunriseSec) {
    progressPct = 0;
  } else if (currentSec > sunsetSec) {
    progressPct = 100;
  } else {
    progressPct = Math.round(((currentSec - sunriseSec) / durationSec) * 100);
  }

  return {
    progressPct,
    isDaytime,
    daylightDuration
  };
}

// Moon Phase & Astronomical Calculator
export function getMoonPhaseDetails(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let c = 0, e = 0, jd = 0, b = 0;
  if (month < 3) {
    c = year - 1;
    e = month + 12;
  } else {
    c = year;
    e = month;
  }

  jd = Math.floor(365.25 * c) + Math.floor(30.6001 * (e + 1)) + day + 1720995;
  b = (jd - 621049) / 29.5305882;
  const phaseValue = b - Math.floor(b);

  let name = "New Moon";
  let icon = "fa-regular fa-moon";
  let illumination = Math.round((1 - Math.cos(phaseValue * 2 * Math.PI)) * 50);

  if (phaseValue < 0.03 || phaseValue > 0.97) {
    name = "New Moon";
    icon = "fa-solid fa-moon";
    illumination = 1;
  } else if (phaseValue < 0.22) {
    name = "Waxing Crescent";
    icon = "fa-solid fa-moon";
  } else if (phaseValue < 0.28) {
    name = "First Quarter";
    icon = "fa-solid fa-circle-half-stroke";
  } else if (phaseValue < 0.47) {
    name = "Waxing Gibbous";
    icon = "fa-solid fa-circle";
  } else if (phaseValue < 0.53) {
    name = "Full Moon";
    icon = "fa-solid fa-sun";
    illumination = 99;
  } else if (phaseValue < 0.72) {
    name = "Waning Gibbous";
    icon = "fa-solid fa-circle";
  } else if (phaseValue < 0.78) {
    name = "Last Quarter";
    icon = "fa-solid fa-circle-half-stroke";
  } else {
    name = "Waning Crescent";
    icon = "fa-solid fa-moon";
  }

  return {
    phaseValue: phaseValue.toFixed(2),
    name,
    icon,
    illumination: `${illumination}%`
  };
}

// Outdoor Lifestyle Suitability Evaluation Matrix
export function evaluateLifestyleIndices(telemetry) {
  const { current, aqi } = telemetry;
  const temp = current.temp;
  const wind = current.wind_speed;
  const humidity = current.humidity;
  const weatherId = current.weatherId;

  const isRain = weatherId >= 200 && weatherId < 600;
  const isSnow = weatherId >= 600 && weatherId < 700;

  let runScore = "Excellent";
  let runColor = "var(--accent-emerald)";
  if (isRain || isSnow || temp > 32 || temp < 2 || aqi >= 4) {
    runScore = "Poor";
    runColor = "var(--accent-rose)";
  } else if (temp > 27 || temp < 8 || wind > 25 || aqi === 3) {
    runScore = "Fair";
    runColor = "var(--accent-amber)";
  }

  let dryScore = "Fast Drying";
  let dryColor = "var(--accent-emerald)";
  if (isRain || isSnow || humidity > 80) {
    dryScore = "Do Not Dry";
    dryColor = "var(--accent-rose)";
  } else if (humidity > 60 || wind < 5) {
    dryScore = "Moderate";
    dryColor = "var(--accent-amber)";
  }

  let starScore = "Prime Visibility";
  let starColor = "var(--accent-cyan)";
  if (isRain || isSnow || weatherId > 801) {
    starScore = "Poor (Cloudy)";
    starColor = "var(--accent-rose)";
  } else if (weatherId === 801 || humidity > 75) {
    starScore = "Moderate";
    starColor = "var(--accent-amber)";
  }

  let driveScore = "Low Risk";
  let driveColor = "var(--accent-emerald)";
  if (isRain || isSnow || weatherId >= 700 && weatherId < 800) {
    driveScore = "Hazardous Roads";
    driveColor = "var(--accent-rose)";
  } else if (wind > 30) {
    driveScore = "Moderate Risk";
    driveColor = "var(--accent-amber)";
  }

  return [
    { title: "Running & Fitness", score: runScore, color: runColor, icon: "fa-solid fa-person-running" },
    { title: "Outdoor Drying", score: dryScore, color: dryColor, icon: "fa-solid fa-shirt" },
    { title: "Stargazing Clarity", score: starScore, color: starColor, icon: "fa-solid fa-meteor" },
    { title: "Driving Safety", score: driveScore, color: driveColor, icon: "fa-solid fa-car" }
  ];
}

// Toast Overlay Notification System
export function showToast(message, type = 'error') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconClass = type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check';
  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
