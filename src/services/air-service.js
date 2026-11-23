/**
 * @fileoverview Air Quality Telemetry Service.
 * Fetches real-time CAMS air telemetry from Open-Meteo with in-memory TTL caching
 * and automatic fallback to typical winter smog profiles for 10 Indian cities.
 * @module air-service
 */

import { LIMITS } from '../config/limits.js';
import { calculateOverallAQI } from '../lib/aqi-calculator.js';

/**
 * @typedef {Object} CityBaseline
 * @property {string} name - Official display name of the city.
 * @property {number} lat - Geographic latitude coordinate.
 * @property {number} lon - Geographic longitude coordinate.
 * @property {number} pm2_5 - Typical winter baseline PM2.5 (µg/m³).
 * @property {number} pm10 - Typical winter baseline PM10 (µg/m³).
 * @property {number} no2 - Typical winter baseline NO2 (µg/m³).
 * @property {number} co - Typical winter baseline CO (µg/m³).
 * @property {number} o3 - Typical winter baseline O3 (µg/m³).
 */

/**
 * Typical winter baseline concentrations for key Indian urban centers.
 * @type {Record<string, CityBaseline>}
 */
export const TYPICAL_INDIAN_CITIES = {
  delhi: { name: 'Delhi (NCR)', lat: 28.6139, lon: 77.2090, pm2_5: 220, pm10: 340, no2: 55, co: 1800, o3: 35 },
  noida: { name: 'Noida', lat: 28.5355, lon: 77.3910, pm2_5: 210, pm10: 320, no2: 50, co: 1700, o3: 30 },
  gurugram: { name: 'Gurugram', lat: 28.4595, lon: 77.0266, pm2_5: 205, pm10: 310, no2: 52, co: 1750, o3: 32 },
  mumbai: { name: 'Mumbai', lat: 19.0760, lon: 72.8777, pm2_5: 110, pm10: 165, no2: 40, co: 1100, o3: 45 },
  kolkata: { name: 'Kolkata', lat: 22.5726, lon: 88.3639, pm2_5: 185, pm10: 270, no2: 48, co: 1500, o3: 38 },
  patna: { name: 'Patna', lat: 25.5941, lon: 85.1376, pm2_5: 240, pm10: 360, no2: 58, co: 1950, o3: 28 },
  lucknow: { name: 'Lucknow', lat: 26.8467, lon: 80.9462, pm2_5: 195, pm10: 290, no2: 45, co: 1600, o3: 35 },
  ahmedabad: { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, pm2_5: 140, pm10: 210, no2: 38, co: 1200, o3: 42 },
  kanpur: { name: 'Kanpur', lat: 26.4499, lon: 80.3319, pm2_5: 215, pm10: 315, no2: 50, co: 1700, o3: 30 },
  bengaluru: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, pm2_5: 65, pm10: 95, no2: 25, co: 800, o3: 50 },
};

/**
 * In-memory telemetry cache mapping normalized city keys to timestamped data.
 * @type {Map<string, { timestamp: number, data: Object }>}
 */
const cache = new Map();

/**
 * @typedef {Object} HourlyForecastPoint
 * @property {string} hour - Formatted 24-hr time label (HH:MM).
 * @property {number} pm25 - Expected PM2.5 concentration in µg/m³.
 * @property {number} aqi - Interpolated US AQI value.
 */

/**
 * @typedef {Object} LiveAirQualityPayload
 * @property {string} city - Name of the resolved city.
 * @property {string} timestamp - ISO-8601 observation timestamp.
 * @property {Object} pollutants - Measured pollutant concentrations.
 * @property {number} aqi - Composite AQI.
 * @property {string} category - Clinical AQI category descriptor.
 * @property {string} symbol - Geometric accessibility glyph.
 * @property {string} action - Recommended protective health guidance.
 * @property {string} dominantPollutant - Pollutant driving peak index.
 * @property {string} cleanestHour - Predicted cleanest 1-hr outdoor window.
 * @property {number} cleanestPm25 - Projected minimum PM2.5 level.
 * @property {string} worstHour - Predicted peak smog hour.
 * @property {number} worstPm25 - Projected maximum PM2.5 level.
 * @property {Array<HourlyForecastPoint>} hourlyForecast - 12-hour hourly forecast.
 * @property {string} source - Provenance identifier ('live-cams-open-meteo' or 'edge-cache' or 'winter-smog-baseline').
 */

/**
 * Fetches real-time air quality telemetry for a target Indian city.
 * Uses in-memory caching with a 10-minute TTL and automatic fallback to meteorological baselines.
 *
 * @param {string} [cityName='Delhi'] - Name or search query for the city.
 * @returns {Promise<LiveAirQualityPayload>} Real-time air quality telemetry and forecast.
 */
export async function fetchLiveAirQuality(cityName = 'Delhi') {
  const normalizedKey = cityName.toLowerCase().trim();
  const cached = cache.get(normalizedKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < LIMITS.CACHE_AIR_TTL_MS) {
    return { ...cached.data, source: 'edge-cache' };
  }

  // Find city coordinate baseline
  const matched = TYPICAL_INDIAN_CITIES[normalizedKey] || TYPICAL_INDIAN_CITIES.delhi;

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${matched.lat}&longitude=${matched.lon}&current=pm10,pm2_5,nitrogen_dioxide,carbon_monoxide,ozone,us_aqi&hourly=pm2_5,pm10,us_aqi&timezone=auto&forecast_days=2`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }

    const json = await response.json();
    const current = json.current || {};
    const hourly = json.hourly || { time: [], pm2_5: [], us_aqi: [] };

    // Find cleanest and worst hours of next 24 hours
    const next24Pm25 = (hourly.pm2_5 || []).slice(0, 24);
    let minPm25 = Infinity;
    let maxPm25 = -Infinity;
    let cleanestHour = '06:00';
    let worstHour = '21:00';

    next24Pm25.forEach((val, idx) => {
      if (val != null) {
        if (val < minPm25) {
          minPm25 = val;
          cleanestHour = (hourly.time[idx] || '').split('T')[1] || `${idx}:00`;
        }
        if (val > maxPm25) {
          maxPm25 = val;
          worstHour = (hourly.time[idx] || '').split('T')[1] || `${idx}:00`;
        }
      }
    });

    const pollutants = {
      pm2_5: current.pm2_5 ?? matched.pm2_5,
      pm10: current.pm10 ?? matched.pm10,
      no2: current.nitrogen_dioxide ?? matched.no2,
      co: current.carbon_monoxide ?? matched.co,
      o3: current.ozone ?? matched.o3,
    };

    const overall = calculateOverallAQI(pollutants);

    const payload = {
      city: matched.name,
      timestamp: new Date().toISOString(),
      pollutants,
      aqi: overall.aqi,
      category: overall.category,
      symbol: overall.symbol,
      action: overall.action,
      dominantPollutant: overall.dominantPollutant,
      cleanestHour: cleanestHour.slice(0, 5),
      cleanestPm25: Math.round(minPm25 === Infinity ? pollutants.pm2_5 * 0.7 : minPm25),
      worstHour: worstHour.slice(0, 5),
      worstPm25: Math.round(maxPm25 === -Infinity ? pollutants.pm2_5 * 1.5 : maxPm25),
      hourlyForecast: next24Pm25.slice(0, 12).map((val, idx) => ({
        hour: (hourly.time[idx] || '').split('T')[1]?.slice(0, 5) || `${idx}:00`,
        pm25: Math.round(val ?? 100),
        aqi: Math.round(hourly.us_aqi?.[idx] ?? 150),
      })),
      source: 'live-cams-open-meteo',
    };

    cache.set(normalizedKey, { timestamp: now, data: payload });
    return payload;
  } catch (err) {
    // Graceful fallback to verified winter smog baseline
    const pollutants = {
      pm2_5: matched.pm2_5,
      pm10: matched.pm10,
      no2: matched.no2,
      co: matched.co,
      o3: matched.o3,
    };
    const overall = calculateOverallAQI(pollutants);

    return {
      city: matched.name,
      timestamp: new Date().toISOString(),
      pollutants,
      aqi: overall.aqi,
      category: overall.category,
      symbol: overall.symbol,
      action: overall.action,
      dominantPollutant: overall.dominantPollutant,
      cleanestHour: '13:00',
      cleanestPm25: Math.round(matched.pm2_5 * 0.65),
      worstHour: '20:30',
      worstPm25: Math.round(matched.pm2_5 * 1.4),
      hourlyForecast: [
        { hour: '06:00', pm25: Math.round(matched.pm2_5 * 1.2), aqi: Math.round(overall.aqi * 1.1) },
        { hour: '09:00', pm25: Math.round(matched.pm2_5 * 1.3), aqi: Math.round(overall.aqi * 1.2) },
        { hour: '13:00', pm25: Math.round(matched.pm2_5 * 0.65), aqi: Math.round(overall.aqi * 0.7) },
        { hour: '17:00', pm25: Math.round(matched.pm2_5 * 1.1), aqi: Math.round(overall.aqi * 1.05) },
        { hour: '21:00', pm25: Math.round(matched.pm2_5 * 1.4), aqi: Math.round(overall.aqi * 1.3) },
      ],
      source: 'winter-smog-baseline',
    };
  }
}
