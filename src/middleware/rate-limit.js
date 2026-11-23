/**
 * In-memory sliding window rate limiter middleware.
 */
import { LIMITS } from '../config/limits.js';

const ipHits = new Map();

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - LIMITS.RATE_LIMIT_WINDOW_MS;

  const timestamps = (ipHits.get(ip) || []).filter((t) => t > windowStart);
  
  if (timestamps.length >= LIMITS.RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a minute before making more requests.',
    });
  }

  timestamps.push(now);
  ipHits.set(ip, timestamps);
  next();
}
