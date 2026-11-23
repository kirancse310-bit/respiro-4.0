/**
 * @fileoverview Defensive security headers and Content Security Policy (CSP) specification.
 * Enforces OWASP Secure Headers Project standards to mitigate XSS, clickjacking, and MIME sniffing.
 * @module security-policy
 */

/**
 * Map of HTTP security response headers and policy values.
 * @type {Readonly<Record<string, string>>}
 */
export const SECURITY_HEADERS = {
  /** Content Security Policy restricting resource execution and egress. */
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  /** Prevents browser MIME-type sniffing (CWE-79). */
  'X-Content-Type-Options': 'nosniff',
  /** Disallows framing to defend against clickjacking attacks. */
  'X-Frame-Options': 'DENY',
  /** Disables legacy, buggy XSS auditor in modern browsers. */
  'X-XSS-Protection': '0',
  /** Enforces strict origin transmission on cross-origin requests. */
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  /** Restricts browser hardware APIs to prevent unauthorized surveillance. */
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};
