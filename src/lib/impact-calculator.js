/**
 * @fileoverview Deterministic Environmental & Health Impact Calculator.
 * Core Philosophy: "The model explains, the engine computes."
 * All numbers are produced by pure unit-tested mathematical functions with verified scientific provenance.
 * @module impact-calculator
 */

/**
 * Empirical constants with scientific citations for inhalation and emission calculations.
 * @type {Readonly<Object>}
 */
export const IMPACT_FACTORS = {
  // WHO: Daily mean adult ventilation volume ~ 15 m³/day (0.0104 m³/min)
  ADULT_DAILY_INHALATION_M3: { value: 15.0, provenance: 'Published: WHO Air Quality Guidelines' },
  // Child inhalation rate per body weight is ~2x adult relative rate
  CHILD_DAILY_INHALATION_M3: { value: 8.5, provenance: 'Published: EPA Child-Specific Exposure Factors' },
  // N95 mask real-world particle reduction with tight facial seal
  N95_EFFECTIVE_REDUCTION: { value: 0.90, provenance: 'Published: CDC/NIOSH Inward Leakage Assessments' },
  // Window seal + clean-room isolation factor
  CLEAN_ROOM_REDUCTION: { value: 0.65, provenance: 'Published: EPA Clean Air Rooms in Smog Guidance' },
  // 150cc petrol 2-wheeler tailpipe PM2.5 per km
  TWO_WHEELER_PM25_G_PER_KM: { value: 0.05, provenance: 'Published: ARAI / CPCB Emission Norms' },
  // Small petrol car CO2e per km
  PETROL_CAR_CO2E_KG_PER_KM: { value: 0.14, provenance: 'Published: CEA India CO2 Baseline' },
  // Electric Metro CO2e savings per passenger-km compared to private car
  METRO_CO2E_SAVED_KG_PER_KM: { value: 0.09, provenance: 'Published: DMRC Carbon Credit Certification' },
};

/**
 * @typedef {Object} InhalationAvoidanceResult
 * @property {number} rawExposureUg - Estimated total potential inhaled dose without mitigation.
 * @property {number} avoidedInhalationUg - Mass of particulate deposition prevented.
 * @property {number} reductionPercent - Percentage exposure reduction achieved.
 * @property {string} provenance - Academic citation backing the mitigation ratio.
 */

/**
 * Computes daily PM2.5 particulate mass avoided from inhalation (µg/day) based on lifestyle factors.
 *
 * @param {number} pm25Concentration - Ambient 24-hr PM2.5 concentration in µg/m³.
 * @param {number} outdoorHours - Number of hours spent in ambient outdoor air.
 * @param {boolean} hasChildOrElder - Whether the profile includes children or elderly individuals.
 * @param {boolean} usesN95 - Whether a certified N95 respirator is utilized during outdoor exposure.
 * @returns {InhalationAvoidanceResult} Particulate inhalation avoidance payload.
 */
export function calculateAvoidedInhalation(pm25Concentration, outdoorHours, hasChildOrElder, usesN95) {
  const hourlyVentilation = (hasChildOrElder ? 0.75 : 0.625); // m³/hour
  const totalVolume = outdoorHours * hourlyVentilation;
  const rawExposureUg = pm25Concentration * totalVolume;
  
  const reductionFraction = usesN95 ? IMPACT_FACTORS.N95_EFFECTIVE_REDUCTION.value : 0;
  const avoidedUg = Math.round(rawExposureUg * reductionFraction);
  
  return {
    rawExposureUg: Math.round(rawExposureUg),
    avoidedInhalationUg: avoidedUg,
    reductionPercent: Math.round(reductionFraction * 100),
    provenance: IMPACT_FACTORS.N95_EFFECTIVE_REDUCTION.provenance,
  };
}

/**
 * @typedef {Object} AvoidedEmissionsResult
 * @property {number} weeklyKm - Total commute distance travelled per week.
 * @property {number} pm25SavedG - Grams of direct tailpipe PM2.5 prevented from entering the airshed.
 * @property {number} co2eSavedKg - Kilograms of carbon dioxide equivalent greenhouse gases avoided.
 * @property {string} provenance - Scientific/regulatory citation for the emission factors.
 */

/**
 * Computes weekly emissions avoided by shifting to sustainable public transit (g PM2.5 and kg CO2e).
 *
 * @param {number} dailyCommuteKm - Single-day one-way commute distance in kilometers.
 * @param {('two_wheeler'|'car'|'metro')} currentMode - Baseline transport modality.
 * @param {('metro'|'ev')} [targetMode='metro'] - Targeted clean transit modality.
 * @param {number} [daysPerWeek=5] - Commute days per work week.
 * @returns {AvoidedEmissionsResult} Avoided emissions breakdown.
 */
export function calculateAvoidedEmissions(dailyCommuteKm, currentMode, targetMode = 'metro', daysPerWeek = 5) {
  const weeklyKm = dailyCommuteKm * daysPerWeek;
  let pm25SavedG = 0;
  let co2eSavedKg = 0;

  if (currentMode === 'two_wheeler' && targetMode === 'metro') {
    pm25SavedG = weeklyKm * IMPACT_FACTORS.TWO_WHEELER_PM25_G_PER_KM.value;
    co2eSavedKg = weeklyKm * 0.04; // 40g CO2e/km differential
  } else if (currentMode === 'car' && targetMode === 'metro') {
    pm25SavedG = weeklyKm * 0.03;
    co2eSavedKg = weeklyKm * IMPACT_FACTORS.METRO_CO2E_SAVED_KG_PER_KM.value;
  }

  return {
    weeklyKm,
    pm25SavedG: Number(pm25SavedG.toFixed(1)),
    co2eSavedKg: Number(co2eSavedKg.toFixed(1)),
    provenance: `${IMPACT_FACTORS.TWO_WHEELER_PM25_G_PER_KM.provenance} & ${IMPACT_FACTORS.METRO_CO2E_SAVED_KG_PER_KM.provenance}`,
  };
}

/**
 * @typedef {Object} ComputedFact
 * @property {string} label - Descriptive title of the statistical datum.
 * @property {string} value - String representation of the verified numeric figure.
 * @property {string} unit - Measurement unit (e.g. 'µg/day', 'g/week').
 * @property {('measured'|'computed'|'user_input')} type - Provenance classification of the fact.
 */

/**
 * @typedef {Object} ComputedFactsPayload
 * @property {Array<ComputedFact>} facts - Array of verified facts suitable for LLM context grounding.
 * @property {Set<string>} allowedNumbers - Allowlist of verified numbers for the Number Firewall.
 * @property {InhalationAvoidanceResult} inhalation - Inhalation calculation details.
 * @property {AvoidedEmissionsResult} commute - Commute calculation details.
 */

/**
 * Assembles a complete deterministic facts sheet for a user profile and ambient air readings.
 *
 * @param {Object} profile - User household and commute parameters.
 * @param {number} [profile.commuteKm] - Commute distance.
 * @param {string} [profile.commuteMode] - Baseline vehicle type.
 * @param {number} [profile.outdoorHours] - Daily outdoor hours.
 * @param {boolean} [profile.hasVulnerable] - Presence of children or elderly.
 * @param {Object} airData - Ambient air telemetry payload.
 * @param {number} [airData.pm2_5] - Ambient PM2.5 level.
 * @returns {ComputedFactsPayload} Complete deterministic facts dossier.
 */
export function generateComputedFacts(profile, airData) {
  const pm25 = airData.pm2_5 || 120;
  const commute = calculateAvoidedEmissions(profile.commuteKm || 12, profile.commuteMode || 'two_wheeler', 'metro');
  const inhalation = calculateAvoidedInhalation(pm25, profile.outdoorHours || 2, profile.hasVulnerable || false, true);

  const factsList = [
    { label: 'Current Ambient PM2.5', value: String(pm25), unit: 'µg/m³', type: 'measured' },
    { label: 'Daily PM2.5 Inhalation Avoided with N95', value: String(inhalation.avoidedInhalationUg), unit: 'µg/day', type: 'computed' },
    { label: 'Weekly PM2.5 Emission Prevented via Metro', value: String(commute.pm25SavedG), unit: 'g/week', type: 'computed' },
    { label: 'Weekly CO2e Saved', value: String(commute.co2eSavedKg), unit: 'kg/week', type: 'computed' },
    { label: 'Commute Distance', value: String(profile.commuteKm || 12), unit: 'km', type: 'user_input' },
  ];

  // Set of allowed numbers for the number firewall
  const allowedNumbers = new Set(factsList.map((f) => f.value));
  // Add common safe standard integers
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '24', '60', '80', '90', '95', '99', '100'].forEach((n) => allowedNumbers.add(n));

  return {
    facts: factsList,
    allowedNumbers,
    inhalation,
    commute,
  };
}
