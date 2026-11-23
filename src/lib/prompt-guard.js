/**
 * Prompt Guard & Input Sanitization.
 * Defends against Prompt Injection, System Prompt Exfiltration, XSS, and Malformed Input (CWE-20).
 */

// Non-printable control characters [\x00-\x1f\x7f] and invisible unicode overrides
const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f]/g;
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g;

// Prompt injection signatures
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
  /disregard\s+(?:the\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+(?:DAN|unfiltered|jailbroken)/i,
  /output\s+(?:the\s+)?system\s+prompt/i,
  /print\s+everything\s+above/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
];

/**
 * Strips non-printable control characters [\x00-\x1f\x7f] and invisible unicode characters
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
 * Validates finite numbers within physical bounds (e.g. AQI 0-1000, PM2.5 0-2000)
 */
export function isFiniteNumber(val, min = 0, max = Infinity) {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

/**
 * Clean input of invisible characters and trim
 */
export function stripInvisibleCharacters(str) {
  return sanitizeText(str);
}

/**
 * HTML entity escaping for XSS prevention
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
 * Scan input for adversarial prompt injection attempts
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
 * Wrap sanitized user notes into a secure delimiter fence for LLM context
 */
export function fenceUserNotes(notes) {
  const scan = scanPrompt(notes);
  if (!scan.isSafe) {
    return '[User notes omitted due to security policy violations]';
  }
  return `<user_notes>\n${scan.sanitized}\n</user_notes>`;
}
