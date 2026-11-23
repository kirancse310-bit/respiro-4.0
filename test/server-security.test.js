import { describe, it, expect } from 'vitest';
import { rateLimiter } from '../src/middleware/rate-limit.js';
import { validatePayloadSize } from '../src/middleware/validator.js';
import { securityHeadersMiddleware } from '../src/middleware/security-headers.js';
import { LIMITS } from '../src/config/limits.js';
import { sanitizeText, isFiniteNumber } from '../src/lib/prompt-guard.js';

describe('Server Security Middleware & Input Validation (OWASP & CWE Hardened)', () => {
  it('sets comprehensive security and CSP headers', () => {
    const headers = {};
    const req = {};
    const res = {
      setHeader: (k, v) => { headers[k] = v; },
    };
    let nextCalled = false;
    securityHeadersMiddleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
  });

  it('blocks payloads that exceed maximum byte limit (CWE-400 DoS Protection)', () => {
    const req = { headers: { 'content-length': String(LIMITS.MAX_BODY_BYTES + 500) } };
    let status = 0;
    let jsonBody = null;
    const res = {
      status: (code) => {
        status = code;
        return { json: (b) => { jsonBody = b; } };
      },
    };

    validatePayloadSize(req, res, () => {});
    expect(status).toBe(413);
    expect(jsonBody.error).toBe('Payload Too Large');
  });

  it('enforces sliding-window rate limits (CWE-799)', () => {
    const req = { ip: '127.0.0.99' };
    let status = 0;
    const res = {
      status: (code) => {
        status = code;
        return { json: () => {} };
      },
    };

    // Exhaust budget
    for (let i = 0; i < LIMITS.RATE_LIMIT_MAX_REQUESTS; i++) {
      rateLimiter(req, res, () => {});
    }

    // Next request must fail with 429
    rateLimiter(req, res, () => {});
    expect(status).toBe(429);
  });

  it('strips non-printable control characters [\\x00-\\x1f] from input text (CWE-20)', () => {
    const dirty = 'Sector\x00-09\x1f \x07Noida\r\n';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Sector-09 Noida');
    expect(clean).not.toContain('\x00');
    expect(clean).not.toContain('\x1f');
  });

  it('enforces physical numeric bounds with isFiniteNumber', () => {
    expect(isFiniteNumber(250, 0, 1000)).toBe(true);
    expect(isFiniteNumber(-5, 0, 1000)).toBe(false);
    expect(isFiniteNumber(1500, 0, 1000)).toBe(false);
    expect(isFiniteNumber(NaN, 0, 1000)).toBe(false);
    expect(isFiniteNumber(Infinity, 0, 1000)).toBe(false);
    expect(isFiniteNumber('100', 0, 1000)).toBe(false);
  });
});
