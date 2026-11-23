/**
 * @fileoverview Number Firewall: Prevents LLM hallucination of fabricated statistical claims.
 * Validates that every numeral in the AI's generated response exists within
 * the verified deterministic facts computed by the pure mathematical impact engine.
 * @module number-firewall
 */

/**
 * Regex pattern identifying scientific terms and acronyms that contain digits,
 * ensuring they are not erroneously treated as statistical claims.
 * @type {RegExp}
 */
const SCIENTIFIC_NAMES = /\b(?:PM[ -]?2\.5|PM[ -]?10|N[ -]?95|CO2e?|MERV[ -]?13|H13|AQI)(?![\w.])/gi;

/**
 * Regex pattern identifying isolated numeric values and floating point decimals.
 * @type {RegExp}
 */
const DIGIT_PATTERN = /\b\d+(?:\.\d+)?\b/g;

/**
 * Extracts all non-acronym numerical values from an arbitrary text payload.
 *
 * @param {string} text - Arbitrary textual string (e.g., generated LLM completion).
 * @returns {Array<string>} Array of extracted normalized numeral strings.
 */
export function extractNumbers(text) {
  if (!text || typeof text !== 'string') return [];
  // Clean out standard non-numeric acronyms containing digits
  const cleaned = text.replace(SCIENTIFIC_NAMES, ' ');
  const matches = cleaned.match(DIGIT_PATTERN) || [];
  return matches.map((m) => String(Number(m)));
}

/**
 * @typedef {Object} NumberVerificationResult
 * @property {boolean} passed - True if all numbers in the text are present in the allowed set.
 * @property {Array<string>} extracted - Complete list of extracted numeric strings.
 * @property {Array<string>} unverified - Subset of numerals failing allowlist verification.
 */

/**
 * Verifies that all numerals contained within a target text match a known allowed set.
 *
 * @param {string} text - Text to be scanned and verified.
 * @param {Set<string>} allowedSet - Whitelisted set of verified numeric strings.
 * @returns {NumberVerificationResult} Verification audit result.
 */
export function verifyNumbers(text, allowedSet) {
  const extracted = extractNumbers(text);
  const unverified = extracted.filter((num) => !allowedSet.has(num));

  return {
    passed: unverified.length === 0,
    extracted,
    unverified,
  };
}
