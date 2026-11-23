/**
 * @fileoverview EPA US Air Quality Index (AQI) Breakpoints and Calculations.
 * Conforms to US EPA Air Quality Index Technical Assistance Document (40 CFR Part 58).
 * Pure mathematical computation engine with zero side effects.
 * @module aqi-calculator
 */

/**
 * @typedef {Object} Breakpoint
 * @property {number} cLow - Lower concentration breakpoint boundary (µg/m³).
 * @property {number} cHigh - Upper concentration breakpoint boundary (µg/m³).
 * @property {number} iLow - Corresponding lower AQI sub-index boundary.
 * @property {number} iHigh - Corresponding upper AQI sub-index boundary.
 */

/**
 * EPA PM2.5 piecewise concentration breakpoints table.
 * @type {Array<Breakpoint>}
 */
const BREAKPOINTS_PM25 = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

/**
 * EPA PM10 piecewise concentration breakpoints table.
 * @type {Array<Breakpoint>}
 */
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
 *
 * @param {number} conc - Measured pollutant concentration (µg/m³).
 * @param {Array<Breakpoint>} table - EPA piecewise breakpoint array.
 * @returns {number} Integer AQI sub-index bounded between 0 and 500.
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

/**
 * Converts PM2.5 concentration to standard US EPA AQI sub-index.
 *
 * @param {number} pm25 - 24-hour average PM2.5 concentration in µg/m³.
 * @returns {number} Interpolated AQI sub-index (0 to 500).
 */
export function pm25ToAQI(pm25) {
  return interpolate(pm25, BREAKPOINTS_PM25);
}

/**
 * Converts PM10 concentration to standard US EPA AQI sub-index.
 *
 * @param {number} pm10 - 24-hour average PM10 concentration in µg/m³.
 * @returns {number} Interpolated AQI sub-index (0 to 500).
 */
export function pm10ToAQI(pm10) {
  return interpolate(pm10, BREAKPOINTS_PM10);
}

/**
 * @typedef {Object} AQIBand
 * @property {number} min - Minimum AQI threshold.
 * @property {number} max - Maximum AQI threshold.
 * @property {string} label - Human-readable clinical category.
 * @property {string} symbol - Accessible geometric representation symbol.
 * @property {string} colorCode - Hex color code for UI rendering.
 * @property {string} action - Recommended protective health guidance.
 */

/**
 * Standard EPA AQI clinical health advisory bands.
 * @type {Array<AQIBand>}
 */
export const AQI_BANDS = [
  { min: 0, max: 50, label: 'Good', symbol: '●', colorCode: '#10b981', action: 'Air quality is satisfactory. Enjoy outdoor activities.' },
  { min: 51, max: 100, label: 'Moderate', symbol: '■', colorCode: '#eab308', action: 'Acceptable air. Sensitive individuals should consider reducing heavy exertion.' },
  { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', symbol: '▲', colorCode: '#f97316', action: 'Children, elders, and asthmatics should wear masks and avoid prolonged outdoor exertion.' },
  { min: 151, max: 200, label: 'Unhealthy', symbol: '◆', colorCode: '#ef4444', action: 'Everyone may experience health effects. Keep windows sealed and wear N95 outdoors.' },
  { min: 201, max: 300, label: 'Very Unhealthy', symbol: '★', colorCode: '#8b5cf6', action: 'Health alert: serious risk. Run air purifiers, avoid outdoor exercise entirely.' },
  { min: 301, max: 500, label: 'Hazardous', symbol: '✖', colorCode: '#7f1d1d', action: 'Emergency conditions. Entire population is severely affected. Stay indoors with sealed gaps.' },
];

/**
 * Resolves the corresponding AQI advisory band descriptor for a given AQI score.
 *
 * @param {number} aqi - Calculated numerical Air Quality Index.
 * @returns {AQIBand} Matching AQI band metadata object.
 */
export function getAQIBand(aqi) {
  const bounded = Math.max(0, Math.min(500, Math.round(aqi)));
  return AQI_BANDS.find((b) => bounded >= b.min && bounded <= b.max) || AQI_BANDS[AQI_BANDS.length - 1];
}

/**
 * @typedef {Object} PollutantConcentrations
 * @property {number} [pm2_5] - Fine particulate matter PM2.5 in µg/m³.
 * @property {number} [pm10] - Coarse particulate matter PM10 in µg/m³.
 * @property {number} [no2] - Nitrogen dioxide in µg/m³.
 * @property {number} [co] - Carbon monoxide in µg/m³.
 * @property {number} [o3] - Ground-level ozone in µg/m³.
 */

/**
 * @typedef {Object} OverallAQIResult
 * @property {number} aqi - Highest composite AQI value among evaluated pollutants.
 * @property {string} dominantPollutant - Name of the pollutant driving the peak index.
 * @property {string} category - Clinical EPA classification descriptor.
 * @property {string} symbol - Accessible geometric category glyph.
 * @property {string} action - Practical medical/lifestyle guidance advisory.
 * @property {number} pm25Aqi - Individual PM2.5 sub-index.
 * @property {number} pm10Aqi - Individual PM10 sub-index.
 */

/**
 * Determines overall AQI, dominant pollutant driver, and health advisory band from multi-pollutant telemetry.
 *
 * @param {PollutantConcentrations} pollutants - Measured pollutant concentrations payload.
 * @returns {OverallAQIResult} Composite AQI analysis payload.
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
