/**
 * @fileoverview System limits, rate-limiting windows, and architectural constraints.
 * Protects server resources against Denial of Service (DoS) and memory exhaustion.
 * @module limits
 */

/**
 * System-wide operational constraints and safety thresholds.
 * @type {Readonly<Object>}
 */
export const LIMITS = {
  /** Maximum allowable JSON request body size in bytes (15 KB strict DoS limit). */
  MAX_BODY_BYTES: 15 * 1024,
  /** Sliding window duration for rate limiting in milliseconds (1 minute). */
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  /** Maximum allowable requests per IP address within the sliding window. */
  RATE_LIMIT_MAX_REQUESTS: 60,
  /** In-memory caching Time-to-Live for air telemetry in milliseconds (10 minutes). */
  CACHE_AIR_TTL_MS: 10 * 60 * 1000,
  /** In-memory caching Time-to-Live for geocoder queries in milliseconds (1 hour). */
  CACHE_GEO_TTL_MS: 60 * 60 * 1000,
  /** Maximum character length for user-provided lifestyle notes. */
  MAX_USER_NOTES_LENGTH: 300,
  /** Maximum character length for user and reporter names. */
  MAX_NAME_LENGTH: 100,
};
