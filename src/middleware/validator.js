/**
 * @fileoverview Input validation and body payload security middleware.
 * Enforces strict Content-Length verification before buffer consumption.
 * @module validator
 */

import { LIMITS } from '../config/limits.js';

/**
 * Validates that the inbound request Content-Length does not exceed the strict 15 KB limit.
 * Mitigates large-payload buffer exhaustion and memory denial-of-service (DoS).
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void|import('express').Response} Continues chain or responds with HTTP 413.
 */
export function validatePayloadSize(req, res, next) {
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > LIMITS.MAX_BODY_BYTES) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: `Request body exceeds maximum allowed size of ${LIMITS.MAX_BODY_BYTES} bytes.`,
    });
  }
  next();
}
