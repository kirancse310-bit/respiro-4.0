/**
 * Lowest-Exposure Transit Pathfinding & Cumulative Inhaled Dose Model.
 * Sources:
 * - US EPA Exposure Factors Handbook (Chapter 6: Inhalation Rates)
 * - Aerosol and Air Quality Research (Microenvironmental pollutant ratios during urban commuting)
 */

export const INHALATION_FACTORS = {
  // Minute ventilation rates (m³/min) per EPA Exposure Factors
  VENTILATION: {
    RESTING_OR_VEHICLE: 0.009, // Light sitting
    WALKING_NORMAL: 0.018, // Moderate walking (4 km/h)
    CYCLING_COMMUTE: 0.032, // Strenuous cycling (15 km/h)
  },
  // Microenvironment penetration factor relative to ambient roadside PM2.5
  PENETRATION: {
    OPEN_AIR_SIDEWALK: 1.0,
    CYCLING_ROADWAY: 1.15, // Direct tailpipe wake
    AUTO_RICKSHAW: 0.95,
    BUS_WINDOWS_OPEN: 0.90,
    CAR_CLOSED_AC: 0.30, // Cabin filter + recirculation
    METRO_AC: 0.35, // High-grade station/train ventilation
    N95_SEALED: 0.05, // 95% filtration efficiency
  },
};

/**
 * Calculate cumulative inhaled PM2.5 dose (µg) for a transit journey:
 * Inhaled Dose = Ambient PM2.5 (µg/m³) * Microenvironment Factor * Ventilation (m³/min) * Duration (min)
 */
export function calculateInhaledDose(ambientPm25, durationMin, mode, withN95 = false) {
  let ventilation = INHALATION_FACTORS.VENTILATION.RESTING_OR_VEHICLE;
  let penetration = INHALATION_FACTORS.PENETRATION.OPEN_AIR_SIDEWALK;

  switch (mode) {
    case 'walking':
      ventilation = INHALATION_FACTORS.VENTILATION.WALKING_NORMAL;
      penetration = INHALATION_FACTORS.PENETRATION.OPEN_AIR_SIDEWALK;
      break;
    case 'cycling':
      ventilation = INHALATION_FACTORS.VENTILATION.CYCLING_COMMUTE;
      penetration = INHALATION_FACTORS.PENETRATION.CYCLING_ROADWAY;
      break;
    case 'auto':
      ventilation = INHALATION_FACTORS.VENTILATION.RESTING_OR_VEHICLE;
      penetration = INHALATION_FACTORS.PENETRATION.AUTO_RICKSHAW;
      break;
    case 'metro':
      ventilation = INHALATION_FACTORS.VENTILATION.RESTING_OR_VEHICLE;
      penetration = INHALATION_FACTORS.PENETRATION.METRO_AC;
      break;
    case 'car':
      ventilation = INHALATION_FACTORS.VENTILATION.RESTING_OR_VEHICLE;
      penetration = INHALATION_FACTORS.PENETRATION.CAR_CLOSED_AC;
      break;
    default:
      ventilation = INHALATION_FACTORS.VENTILATION.WALKING_NORMAL;
      penetration = INHALATION_FACTORS.PENETRATION.OPEN_AIR_SIDEWALK;
  }

  if (withN95) {
    penetration *= INHALATION_FACTORS.PENETRATION.N95_SEALED;
  }

  const doseUg = ambientPm25 * penetration * ventilation * durationMin;
  return Number(doseUg.toFixed(1));
}

/**
 * Comparative multi-modal routing assessment for a given commute distance
 */
export function compareTransitExposure(distanceKm, ambientPm25) {
  // Speed assumptions (km/h)
  const modes = [
    { id: 'cycling', name: 'Bicycle / Cycle', speedKmH: 14, modeKey: 'cycling', requiresMask: true },
    { id: 'walking', name: 'Walking Along Arterial', speedKmH: 4.5, modeKey: 'walking', requiresMask: true },
    { id: 'auto', name: 'Open Auto-rickshaw', speedKmH: 22, modeKey: 'auto', requiresMask: true },
    { id: 'metro', name: 'AC Electric Metro / Rail', speedKmH: 32, modeKey: 'metro', requiresMask: false },
    { id: 'walking_n95', name: 'Walking with Fitted N95', speedKmH: 4.5, modeKey: 'walking', withN95: true },
  ];

  const results = modes.map((m) => {
    const durationMin = Math.round((distanceKm / m.speedKmH) * 60);
    const doseUg = calculateInhaledDose(ambientPm25, durationMin, m.modeKey, m.withN95 ?? false);
    return {
      ...m,
      distanceKm,
      durationMin,
      inhaledDoseUg: doseUg,
    };
  });

  // Sort by lowest inhaled dose
  results.sort((a, b) => a.inhaledDoseUg - b.inhaledDoseUg);
  const safest = results[0];
  const mostExposed = results[results.length - 1];
  const doseAvoidedUg = Number((mostExposed.inhaledDoseUg - safest.inhaledDoseUg).toFixed(1));
  const percentReduction = Math.round(((mostExposed.inhaledDoseUg - safest.inhaledDoseUg) / mostExposed.inhaledDoseUg) * 100);

  return {
    distanceKm,
    ambientPm25,
    safestMode: safest.name,
    safestDoseUg: safest.inhaledDoseUg,
    maxDoseUg: mostExposed.inhaledDoseUg,
    doseAvoidedUg,
    percentReduction,
    options: results,
  };
}
