/**
 * @fileoverview Prompt Guard & Input Sanitization.
 * Defends against Prompt Injection, System Prompt Exfiltration, XSS, and Malformed Input (CWE-20).
 * @module prompt-guard
 */

/**
 * Regular expression matching non-printable ASCII control characters [\x00-\x1f\x7f].
 * @type {RegExp}
 */
const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f]/g;

/**
 * Regular expression matching zero-width, invisible, and bidirectional override Unicode characters.
 * @type {RegExp}
 */
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g;

/**
 * Signatures indicative of adversarial prompt injection and jailbreak attempts.
 * @type {Array<RegExp>}
 */
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
  /disregard\s+(?:the\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+(?:DAN|unfiltered|jailbroken)/i,
  /output\s+(?:the\s+)?system\s+prompt/i,
  /print\s+everything\s+above/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
];

/**
 * Strips non-printable control characters [\x00-\x1f\x7f] and invisible unicode characters.
 *
 * @param {unknown} input - Raw untrusted user input string.
 * @param {number} [maxLen=2000] - Maximum permissible character length.
 * @returns {string} Cleaned and truncated string.
 */
export function sanitizeText(input, maxLen = 2000) {
  if (typeof input !== 'string') return '';
  return input
    .replace(CONTROL_CHAR_REGEX, '')
    .replace(INVISIBLE_CHARS, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Validates whether a value is a finite number within specified physical boundaries.
 *
 * @param {unknown} val - Value under test.
 * @param {number} [min=0] - Lower acceptable bound.
 * @param {number} [max=Infinity] - Upper acceptable bound.
 * @returns {boolean} True if the value is a valid finite number within [min, max].
 */
export function isFiniteNumber(val, min = 0, max = Infinity) {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

/**
 * Strips invisible unicode characters and trims whitespace from untrusted input.
 *
 * @param {unknown} str - Input string to sanitize.
 * @returns {string} Cleaned string.
 */
export function stripInvisibleCharacters(str) {
  return sanitizeText(str);
}

/**
 * Escapes HTML entity special characters (&, <, >, ", ') to prevent Cross-Site Scripting (XSS).
 *
 * @param {unknown} str - String to encode.
 * @returns {string} Safely escaped HTML entity string.
 */
export function sanitizeHTML(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @typedef {Object} PromptScanResult
 * @property {boolean} isSafe - True if no adversarial patterns or injection strings were detected.
 * @property {string} sanitized - Sanitized, HTML-escaped text payload.
 * @property {Array<string>} flags - List of matched injection pattern signatures.
 */

/**
 * Scans an untrusted input string for adversarial prompt injection attempts and applies escaping.
 *
 * @param {unknown} input - Untrusted input string.
 * @returns {PromptScanResult} Security scan assessment report.
 */
export function scanPrompt(input) {
  const cleaned = sanitizeText(input);
  const flags = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      flags.push(pattern.toString());
    }
  }

  const isSafe = flags.length === 0;
  const sanitized = sanitizeHTML(cleaned);

  return {
    isSafe,
    sanitized,
    flags,
  };
}

/**
 * Wraps sanitized user notes into a secure delimiter fence for LLM context injection.
 * Omit notes if an injection attack signature is detected.
 *
 * @param {unknown} notes - Untrusted user notes or instructions.
 * @returns {string} Fenced notes block or security policy omission warning.
 */
export function fenceUserNotes(notes) {
  const scan = scanPrompt(notes);
  if (!scan.isSafe) {
    return '[User notes omitted due to security policy violations]';
  }
  return `<user_notes>\n${scan.sanitized}\n</user_notes>`;
}
