/**
 * @fileoverview Express middleware for setting hardened HTTP security headers.
 * Attaches CSP, HSTS, X-Content-Type-Options, and Referrer-Policy headers.
 * @module security-headers
 */

import { SECURITY_HEADERS } from '../config/security-policy.js';

/**
 * Attaches defensive HTTP response headers to every outgoing request.
 *
 * @param {import('express').Request} _req - Express request object (unused).
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void}
 */
export function securityHeadersMiddleware(_req, res, next) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  next();
}
