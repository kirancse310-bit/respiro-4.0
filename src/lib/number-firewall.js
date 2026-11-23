/**
 * Number Firewall: Prevents LLM hallucination of fabricated statistics.
 * Validates that every numeral in the AI's generated response exists within
 * the verified deterministic facts computed by the impact engine.
 */

const SCIENTIFIC_NAMES = /\b(?:PM[ -]?2\.5|PM[ -]?10|N[ -]?95|CO2e?|MERV[ -]?13|H13|AQI)(?![\w.])/gi;
const DIGIT_PATTERN = /\b\d+(?:\.\d+)?\b/g;

export function extractNumbers(text) {
  if (!text || typeof text !== 'string') return [];
  // Clean out standard non-numeric acronyms containing digits
  const cleaned = text.replace(SCIENTIFIC_NAMES, ' ');
  const matches = cleaned.match(DIGIT_PATTERN) || [];
  return matches.map((m) => String(Number(m)));
}

export function verifyNumbers(text, allowedSet) {
  const extracted = extractNumbers(text);
  const unverified = extracted.filter((num) => !allowedSet.has(num));

  return {
    passed: unverified.length === 0,
    extracted,
    unverified,
  };
}
