/**
 * EPA/ASHRAE Indoor Air Quality & Clean Air Delivery Rate (CADR) Engine.
 * Sources:
 * - EPA Guide to Air Cleaners in the Home (EPA 402-F-08-004)
 * - ASHRAE Standard 62.2 Ventilation and Acceptable Indoor Air Quality
 * - UC Davis / Corsi-Rosenthal Box Peer-Reviewed Efficacy Studies
 */

export const IAQ_BENCHMARKS = {
  MIN_SMOG_ACH: 4, // Minimum Air Changes per Hour for winter smog defense
  OPTIMAL_SMOG_ACH: 6, // Optimal ACH for asthma/vulnerable residents
  HEPA_EFFICIENCY: 0.9997, // Published HEPA filtration
  MERV13_EFFICIENCY: 0.85, // MERV 13 single-pass fine particle efficiency
  CR_BOX_FAN_CFM: 1800, // Typical 20" Box Fan free air rating
  CR_BOX_EFFECTIVE_CADR: 550, // Measured effective CADR of 4-filter Corsi Rosenthal Box (CFM)
};

/**
 * Calculate room volume in cubic feet and cubic meters
 */
export function calculateRoomVolume(lengthFt, widthFt, heightFt = 9) {
  const volumeCuFt = lengthFt * widthFt * heightFt;
  const volumeCuM = volumeCuFt * 0.0283168;
  return { volumeCuFt, volumeCuM };
}

/**
 * Calculate required Clean Air Delivery Rate (CADR) for desired Air Changes per Hour (ACH)
 * Formula: Required CADR (CFM) = (Room Volume in cu ft * Target ACH) / 60
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
 * Estimate particulate turnaround time (minutes to achieve 80% and 99% reduction in smog)
 * Formula: Time = (-ln(remaining fraction) * Room Volume) / Total Effective CADR
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
 * Compare DIY Corsi-Rosenthal Box vs Commercial HEPA
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
