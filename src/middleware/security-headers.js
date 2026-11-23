/**
 * Express middleware to attach hardened security headers.
 */
import { SECURITY_HEADERS } from '../config/security-policy.js';

export function securityHeadersMiddleware(req, res, next) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  next();
}
