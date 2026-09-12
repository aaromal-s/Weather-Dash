/**
 * Weather Analytics Engine - Chart.js Visualization Controller
 */

import { formatHour, convertTemp } from './utils.js';

let chartInstance = null;

/**
 * Render or update 24-hour temperature and humidity line chart
 * @param {HTMLCanvasElement} canvasEl 
 * @param {Array} hourlyData 
 * @param {boolean} isImperial 
 * @param {number} timezoneOffset 
 */
export function renderAnalyticsChart(canvasEl, hourlyData, isImperial = false, timezoneOffset = 0) {
  if (!canvasEl) return;

  // Destroy existing chart instance before creating a new canvas context
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (!hourlyData || hourlyData.length === 0) return;

  const ctx = canvasEl.getContext('2d');

  // Prepare datasets & labels
  const timeLabels = hourlyData.map(item => formatHour(item.dt, timezoneOffset));
  const tempData = hourlyData.map(item => convertTemp(item.temp, isImperial));
  const humidityData = hourlyData.map(item => item.humidity);

  const tempUnitSymbol = isImperial ? '°F' : '°C';

  // Create gradient fills
  const tempGradient = ctx.createLinearGradient(0, 0, 0, 250);
  tempGradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  tempGradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  const humidityGradient = ctx.createLinearGradient(0, 0, 0, 250);
  humidityGradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
  humidityGradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [
        {
          label: `Temperature (${tempUnitSymbol})`,
          data: tempData,
          borderColor: '#38bdf8',
          borderWidth: 3,
          backgroundColor: tempGradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          yAxisID: 'yTemp'
        },
        {
          label: 'Humidity (%)',
          data: humidityData,
          borderColor: '#a855f7',
          borderWidth: 2,
          borderDash: [4, 4],
          backgroundColor: humidityGradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          yAxisID: 'yHumidity'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              family: "'Outfit', sans-serif",
              size: 12,
              weight: '500'
            },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          bodyFont: {
            family: "'Outfit', sans-serif"
          },
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y;
                if (context.datasetIndex === 0) label += tempUnitSymbol;
                else label += '%';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            font: {
              family: "'Outfit', sans-serif",
              size: 11
            }
          }
        },
        yTemp: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(56, 189, 248, 0.9)',
            font: {
              family: "'Outfit', sans-serif",
              size: 11
            },
            callback: function (val) {
              return val + tempUnitSymbol;
            }
          }
        },
        yHumidity: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            color: 'rgba(168, 85, 247, 0.9)',
            font: {
              family: "'Outfit', sans-serif",
              size: 11
            },
            callback: function (val) {
              return val + '%';
            }
          },
          min: 0,
          max: 100
        }
      }
    }
  });
}
