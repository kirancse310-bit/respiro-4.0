/**
 * @fileoverview EPA/ASHRAE Indoor Air Quality & Clean Air Delivery Rate (CADR) Engine.
 * Sources:
 * - EPA Guide to Air Cleaners in the Home (EPA 402-F-08-004)
 * - ASHRAE Standard 62.2 Ventilation and Acceptable Indoor Air Quality
 * - UC Davis / Corsi-Rosenthal Box Peer-Reviewed Efficacy Studies
 * @module cadr-engine
 */

/**
 * Physical benchmarks and filtration constants for indoor air quality engineering.
 * @type {Readonly<Object>}
 */
export const IAQ_BENCHMARKS = {
  MIN_SMOG_ACH: 4, // Minimum Air Changes per Hour for winter smog defense
  OPTIMAL_SMOG_ACH: 6, // Optimal ACH for asthma/vulnerable residents
  HEPA_EFFICIENCY: 0.9997, // Published HEPA filtration efficiency (0.3 µm)
  MERV13_EFFICIENCY: 0.85, // MERV 13 single-pass fine particle efficiency
  CR_BOX_FAN_CFM: 1800, // Typical 20" Box Fan free air rating
  CR_BOX_EFFECTIVE_CADR: 550, // Measured effective CADR of 4-filter Corsi Rosenthal Box (CFM)
};

/**
 * @typedef {Object} RoomVolume
 * @property {number} volumeCuFt - Room volume in cubic feet.
 * @property {number} volumeCuM - Room volume in cubic meters.
 */

/**
 * Calculates room volume in cubic feet and cubic meters based on room dimensions.
 *
 * @param {number} lengthFt - Room length in feet.
 * @param {number} widthFt - Room width in feet.
 * @param {number} [heightFt=9] - Ceiling height in feet (defaults to 9 ft).
 * @returns {RoomVolume} Computed volume metrics object.
 */
export function calculateRoomVolume(lengthFt, widthFt, heightFt = 9) {
  const volumeCuFt = lengthFt * widthFt * heightFt;
  const volumeCuM = volumeCuFt * 0.0283168;
  return { volumeCuFt, volumeCuM };
}

/**
 * @typedef {Object} RequiredCADRResult
 * @property {number} roomAreaSqFt - Floor area in square feet.
 * @property {number} volumeCuFt - Enclosed room volume in cubic feet.
 * @property {number} volumeCuM - Enclosed room volume in cubic meters.
 * @property {number} targetACH - Targeted Air Changes per Hour.
 * @property {number} requiredCADR - Required Clean Air Delivery Rate in CFM.
 * @property {number} requiredCADR_M3H - Required Clean Air Delivery Rate in m³/h.
 */

/**
 * Calculates required Clean Air Delivery Rate (CADR) for desired Air Changes per Hour (ACH).
 * Formula: Required CADR (CFM) = (Room Volume in cu ft * Target ACH) / 60
 *
 * @param {number} lengthFt - Room length in feet.
 * @param {number} widthFt - Room width in feet.
 * @param {number} [heightFt=9] - Room ceiling height in feet.
 * @param {number} [targetACH=4] - Targeted air turnovers per hour (defaults to 4 ACH).
 * @returns {RequiredCADRResult} Sizing requirements payload.
 */
export function calculateRequiredCADR(lengthFt, widthFt, heightFt = 9, targetACH = IAQ_BENCHMARKS.MIN_SMOG_ACH) {
  const { volumeCuFt, volumeCuM } = calculateRoomVolume(lengthFt, widthFt, heightFt);
  const requiredCADR = Math.round((volumeCuFt * targetACH) / 60);
  
  return {
    roomAreaSqFt: Math.round(lengthFt * widthFt),
    volumeCuFt: Math.round(volumeCuFt),
    volumeCuM: Number(volumeCuM.toFixed(1)),
    targetACH,
    requiredCADR, // in CFM (Cubic Feet per Minute)
    requiredCADR_M3H: Math.round(requiredCADR * 1.699), // in m³/h
  };
}

/**
 * @typedef {Object} TurnaroundTimeResult
 * @property {number} actualACH - Delivered air changes per hour for the given CADR.
 * @property {number} time80Min - Minutes required to clear 80% of suspended particulates.
 * @property {number} time99Min - Minutes required to clear 99% of suspended particulates.
 */

/**
 * Estimates particulate turnaround time (minutes to achieve 80% and 99% particulate clearance).
 * Formula: Time = (-ln(remaining fraction) * Room Volume) / Total Effective CADR
 *
 * @param {number} volumeCuFt - Room volume in cubic feet.
 * @param {number} effectiveCADR - Delivered filtration capacity in CFM.
 * @returns {TurnaroundTimeResult} Particulate clearance turnaround metrics.
 */
export function calculateTurnaroundTime(volumeCuFt, effectiveCADR) {
  if (effectiveCADR <= 0 || volumeCuFt <= 0) return { min80: 0, min99: 0, actualACH: 0 };
  
  const actualACH = Number(((effectiveCADR * 60) / volumeCuFt).toFixed(1));
  const time80Min = Math.round((-Math.log(0.20) * volumeCuFt) / effectiveCADR);
  const time99Min = Math.round((-Math.log(0.01) * volumeCuFt) / effectiveCADR);
  
  return {
    actualACH,
    time80Min,
    time99Min,
  };
}

/**
 * @typedef {Object} PurifierPerformanceProfile
 * @property {number} cadr - Delivered Clean Air Delivery Rate (CFM).
 * @property {number} ach - Realized air turnovers per hour.
 * @property {number} turnaround80Percent - Minutes to 80% particle removal.
 * @property {number} turnaround99Percent - Minutes to 99% particle removal.
 * @property {number} estimatedCostUSD - Upfront build/purchase cost in USD.
 * @property {number} estimatedCostINR - Upfront build/purchase cost in INR.
 * @property {string} filterType - Bill of materials / filter specification.
 * @property {string} provenance - Citation of scientific validation.
 */

/**
 * @typedef {Object} CADRComparisonResult
 * @property {RequiredCADRResult} room - Room volume and target sizing specs.
 * @property {PurifierPerformanceProfile} corsiRosenthal - DIY Corsi-Rosenthal metrics.
 * @property {PurifierPerformanceProfile} commercialHEPA - Standard commercial HEPA metrics.
 * @property {number} costSavingsRatio - Economic advantage ratio of DIY vs commercial.
 * @property {number} cadrAdvantageRatio - Airflow delivery multiplier.
 */

/**
 * Compares DIY Corsi-Rosenthal Box performance against commercial HEPA consumer units.
 *
 * @param {number} roomLength - Room length in feet.
 * @param {number} roomWidth - Room width in feet.
 * @param {number} [roomHeight=9] - Ceiling height in feet.
 * @returns {CADRComparisonResult} Comprehensive engineering comparison report.
 */
export function compareCorsiRosenthalVsHEPA(roomLength, roomWidth, roomHeight = 9) {
  const sizing = calculateRequiredCADR(roomLength, roomWidth, roomHeight);
  const crBoxCADR = IAQ_BENCHMARKS.CR_BOX_EFFECTIVE_CADR;
  const crTurnaround = calculateTurnaroundTime(sizing.volumeCuFt, crBoxCADR);
  
  const standardHepaCADR = 180; // Typical affordable consumer air purifier CADR
  const hepaTurnaround = calculateTurnaroundTime(sizing.volumeCuFt, standardHepaCADR);

  return {
    room: sizing,
    corsiRosenthal: {
      cadr: crBoxCADR,
      ach: crTurnaround.actualACH,
      turnaround80Percent: crTurnaround.time80Min,
      turnaround99Percent: crTurnaround.time99Min,
      estimatedCostUSD: 85,
      estimatedCostINR: 6500,
      filterType: '4x MERV-13 (20x20x2 in) + 20 in Box Fan + 14 in Shroud',
      provenance: 'Published: UC Davis / EPA Aerosol Science Research',
    },
    commercialHEPA: {
      cadr: standardHepaCADR,
      ach: hepaTurnaround.actualACH,
      turnaround80Percent: hepaTurnaround.time80Min,
      turnaround99Percent: hepaTurnaround.time99Min,
      estimatedCostUSD: 280,
      estimatedCostINR: 22000,
      filterType: 'Proprietary H13 True HEPA Replacement Cartridge',
      provenance: 'Published: AHAM Verified Consumer Appliances',
    },
    costSavingsRatio: 3.4,
    cadrAdvantageRatio: Number((crBoxCADR / standardHepaCADR).toFixed(1)),
  };
}
