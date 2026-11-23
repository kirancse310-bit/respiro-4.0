/**
 * EPA US Air Quality Index (AQI) Breakpoints and Calculations.
 * Source: US EPA Air Quality Index Technical Assistance Document (40 CFR Part 58).
 */

const BREAKPOINTS_PM25 = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

const BREAKPOINTS_PM10 = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
];

/**
 * Linear piecewise interpolation formula:
 * I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 */
function interpolate(conc, table) {
  if (conc < 0) return 0;
  for (const b of table) {
    if (conc >= b.cLow && conc <= b.cHigh) {
      const aqi = ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (conc - b.cLow) + b.iLow;
      return Math.round(aqi);
    }
  }
  // If above maximum breakpoint, cap at 500
  if (conc > table[table.length - 1].cHigh) return 500;
  return 0;
}

export function pm25ToAQI(pm25) {
  return interpolate(pm25, BREAKPOINTS_PM25);
}

export function pm10ToAQI(pm10) {
  return interpolate(pm10, BREAKPOINTS_PM10);
}

export const AQI_BANDS = [
  { min: 0, max: 50, label: 'Good', symbol: '●', colorCode: '#10b981', action: 'Air quality is satisfactory. Enjoy outdoor activities.' },
  { min: 51, max: 100, label: 'Moderate', symbol: '■', colorCode: '#eab308', action: 'Acceptable air. Sensitive individuals should consider reducing heavy exertion.' },
  { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', symbol: '▲', colorCode: '#f97316', action: 'Children, elders, and asthmatics should wear masks and avoid prolonged outdoor exertion.' },
  { min: 151, max: 200, label: 'Unhealthy', symbol: '◆', colorCode: '#ef4444', action: 'Everyone may experience health effects. Keep windows sealed and wear N95 outdoors.' },
  { min: 201, max: 300, label: 'Very Unhealthy', symbol: '★', colorCode: '#8b5cf6', action: 'Health alert: serious risk. Run air purifiers, avoid outdoor exercise entirely.' },
  { min: 301, max: 500, label: 'Hazardous', symbol: '✖', colorCode: '#7f1d1d', action: 'Emergency conditions. Entire population is severely affected. Stay indoors with sealed gaps.' },
];

export function getAQIBand(aqi) {
  const bounded = Math.max(0, Math.min(500, Math.round(aqi)));
  return AQI_BANDS.find((b) => bounded >= b.min && bounded <= b.max) || AQI_BANDS[AQI_BANDS.length - 1];
}

/**
 * Determine overall AQI and dominant pollutant from 5 pollutants
 */
export function calculateOverallAQI(pollutants) {
  const pm25Aqi = pollutants.pm2_5 != null ? pm25ToAQI(pollutants.pm2_5) : 0;
  const pm10Aqi = pollutants.pm10 != null ? pm10ToAQI(pollutants.pm10) : 0;
  
  let maxAqi = pm25Aqi;
  let dominant = 'PM2.5';
  
  if (pm10Aqi > maxAqi) {
    maxAqi = pm10Aqi;
    dominant = 'PM10';
  }
  
  const band = getAQIBand(maxAqi);
  return {
    aqi: maxAqi,
    dominantPollutant: dominant,
    category: band.label,
    symbol: band.symbol,
    action: band.action,
    pm25Aqi,
    pm10Aqi,
  };
}
