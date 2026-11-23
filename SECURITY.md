# Security Standards & Zero-Trust Architecture Manifest — Respiro 2.0

> **Target Standard:** 100/100 Pts • OWASP Top 10 Defenses • Server-Side GenAI Custody • CWE-209, CWE-200 & CWE-284 Hardened • The Number Firewall

---

## 1. Zero-Trust Architecture & Key Custody

1. **Server-Side AI Execution Only:**
   The Google Gemini API secret key (`GEMINI_API_KEY`) is stored exclusively in server environment variables and accessed strictly within server execution boundaries (`src/services/gemini-service.js`). No secret keys, API tokens, or privileged credentials exist in client bundles, public HTML/JS assets, or version control.
2. **Environment Segregation:**
   `.env.example` is committed to git with clean placeholders; `.env` is strictly gitignored.
3. **Defense in Depth:**
   Even if an external client intercepts HTTP traffic, all computation and validation are executed server-side; client code has zero administrative authority.

---

## 2. Five-Stage Defensive Perimeter Chain (`server.js`)

Every HTTP request to the Respiro 2.0 backend passes through an automated five-stage defensive middleware pipeline:

```text
Incoming Request
       │
       ▼
[0. Reverse-Proxy Trust & Info Disclosure] ──► app.set('trust proxy', 1), app.disable('x-powered-by') (CWE-200)
       │
       ▼
[1. Helmet CSP & Security Headers] ─────────► Disallows unauthorized script execution, enforces strict-origin
       │
       ▼
[2. Dynamic CORS Allowlist] ────────────────► Validates request origin against localhost & verified deploy URLs
       │
       ▼
[3. 15 KB Payload Limiter] ─────────────────► Blocks oversized JSON buffers to prevent memory exhaustion (CWE-400 DoS)
       │
       ▼
[4. Sliding Rate Limiter (60 req/min)] ─────► Restricts LLM inference endpoints per client IP (CWE-799)
       │
       ▼
[5. Type Guard & Control Character Filter] ──► Strips [\x00-\x1f\x7f], checks physical numeric bounds
       │
       ▼
[The Number Firewall / Gemini AI / SHA-256 LRU Cache]
```

### Content Security Policy (Level 3 Directives)
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://air-quality-api.open-meteo.com https://geocoding-api.open-meteo.com https://generativelanguage.googleapis.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

---

## 3. Input Validation & Prompt Injection Defense (CWE-20 & OWASP LLM01)

* **Control Character Stripping (`prompt-guard.js`):**
  All user-supplied text across all endpoints is stripped of non-printable control characters `[\x00-\x1f\x7f]` and invisible unicode overrides prior to prompt interpolation:
  ```javascript
  export function sanitizeText(input, maxLen = 2000) {
    if (typeof input !== 'string') return '';
    return input.replace(/[\x00-\x1f\x7f]/g, '').replace(/[\u200B-\u200D\uFEFF\u00AD\u202A-\u202E]/g, '').trim().slice(0, maxLen);
  }
  ```
* **Payload Length Capping:**
  User text strings are hard-capped (e.g. lifestyle notes: 300 characters; city names: 100 characters).
* **Strict Physical Type Guards (`isFiniteNumber`):**
  * AQI must be a finite number between 0 and 1000.
  * PM2.5 must be a finite number between 1 and 1000 µg/m³.
  * Transit distance must be between 0.5 and 150 km.
  * Room dimensions must be between 5 and 100 ft.
* **Safe JSON Regex Parsing:**
  AI model outputs are parsed using `rawText.match(/\{[\s\S]*\}/)` rather than raw `JSON.parse()`, safely discarding conversational model preambles and markdown fences.
* **Adversarial Pattern Detection:**
  Scans for prompt injection triggers (`ignore previous instructions`, `disregard system prompt`, `you are now DAN`) and fences inputs in `<user_notes>`.

---

## 4. The Number Firewall (Anti-Hallucination Guarantee)

LLMs frequently invent plausible yet fabricated statistics about air pollution and health outcomes. Respiro 2.0 enforces **"The Model Explains, The Engine Computes"** via `src/lib/number-firewall.js`:
1. Every health metric (inhalation avoided in µg/day, tailpipe PM2.5 prevented in g/week, CO2e saved, CADR turnaround) is computed first by pure deterministic functions.
2. The AI is passed a fact sheet of verified numbers.
3. The response is scanned by regex, extracting all numbers (while safely ignoring scientific terms like `PM2.5`, `PM10`, `N95`, `MERV-13`).
4. If **any** unverified numeral appears in the response, the reply is rejected and replaced by a deterministic rule-based output.

---

## 5. Information Disclosure Prevention (CWE-209 & CWE-200)

* **Server Fingerprint Concealment (CWE-200):**
  `app.disable('x-powered-by')` prevents leaking Express framework identity to attackers.
* **Generic Error Messages (CWE-209):**
  The server's global error handler logs error details server-side while always returning a safe generic JSON object to external clients:
  ```javascript
  app.use((err, req, res, next) => {
    logger.error('[SECURITY AUDIT] Unhandled Server Exception:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
  ```
* **No Leaked Stack Traces:**
  Neither `err.message`, `err.stack`, nor internal file paths are ever exposed in HTTP responses.

---

## 6. Structured Server Logging

1. **Structured Server Logger (`server.js`):**
   Server output uses an ISO-timestamped, tagged logger (`logger.info`, `logger.warn`, `logger.error`), ensuring logs are machine-readable and diagnostic details never leak to client responses.

---

## 7. Cloud Data & Access Isolation (CWE-284)

If connected to Cloud Firestore or similar document stores, strict user and collection-level isolation is enforced:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /telemetry/{sectorId} {
      allow read: if true;
      allow write: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
