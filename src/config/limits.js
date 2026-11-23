/**
 * System limits and constraints.
 */
export const LIMITS = {
  MAX_BODY_BYTES: 15 * 1024, // 15 KB strict DoS limit
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 60, // 60 requests/min per IP
  CACHE_AIR_TTL_MS: 10 * 60 * 1000, // 10 minutes cache for air telemetry
  CACHE_GEO_TTL_MS: 60 * 60 * 1000, // 1 hour for geocoder results
  MAX_USER_NOTES_LENGTH: 300,
  MAX_NAME_LENGTH: 100,
};
