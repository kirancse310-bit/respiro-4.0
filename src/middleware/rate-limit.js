/**
 * @fileoverview In-memory sliding-window rate limiter middleware.
 * Prevents endpoint exhaustion, brute-force requests, and unauthorized LLM abuse.
 * @module rate-limit
 */

import { LIMITS } from '../config/limits.js';

/**
 * In-memory map associating IP addresses with request timestamp arrays.
 * @type {Map<string, Array<number>>}
 */
const ipHits = new Map();

/**
 * Express middleware enforcing sliding-window rate limiting per client IP address.
 *
 * @param {import('express').Request} req - Inbound Express request object.
 * @param {import('express').Response} res - Outbound Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void|import('express').Response} Continues chain or halts with HTTP 429.
 */
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
