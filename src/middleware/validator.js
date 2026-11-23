/**
 * Input validation and payload security middleware.
 */
import { LIMITS } from '../config/limits.js';

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
