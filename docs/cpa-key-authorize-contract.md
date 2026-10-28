# CPA key authorization contract

Status: **phase 2**. Home mints `sk-lm-…` keys and writes the KV records below. `cpa-abuse-guard` implements `POST /v1/authorize` in its own change. CPA calls that endpoint and fails closed until the route is deployed: an unreachable guard, a timeout, a non-200 response, a bad or missing response signature, or a body that is not a decision object rejects the client request.

Allowed-request totals are exact in the guard Durable Object immediately. `leaderboard:top` stays at the last flush, so a new claim still shows score `0` until that flush.

## Shared KV

Both Workers bind the same namespace.

| Worker | Binding | Namespace title | Namespace id |
| --- | --- | --- | --- |
| `leonmingod-home` | `KV` | `leonmingod-home-kv` | `1b02d139375045f7a7d5ce2d994abd2c` |
| `cpa-abuse-guard` (phase 2) | `KEYS` | same namespace | `1b02d139375045f7a7d5ce2d994abd2c` |

CPA never sends the plaintext key. It sends lowercase hex SHA-256 of the presented secret.

## Records home writes

| Key | Value | Notes |
| --- | --- | --- |
| `email:<normalized email>` | `{ "key_sha256", "username", "created_at" }` | One claim per normalized email. No plaintext key. |
| `key:<sha256>` | `{ "username", "email", "status", "created_at" }` | `status` is `active` when minted. No plaintext key. |
| `code:<normalized email>` | `{ "code_sha256", "attempts", "sent_at", "expires_at", "username" }` | TTL 600 seconds. Deleted after a successful claim. |
| `leaderboard:index` | `{ "entries": [{ "username", "key_sha256", "created_at" }] }` | Internal. At most 20 rows. Not returned by the public API. |
| `leaderboard:top` | `{ "updated_at", "entries": [{ "username", "score" }] }` | Public cache. Score stays at the last guard flush; a new claim starts at `0`. |

Normalized email is trimmed and lowercased. Usernames are trimmed, control characters removed, 1–20 code points.

`GET /api/leaderboard` reads only `leaderboard:top` (one KV read) and returns `{ updated_at, entries: [{ username, score }] }`. It does not list the namespace. Responses use `Cache-Control: public, max-age=60`. A request with `Cache-Control: no-cache` bypasses the Worker cache.

Zero scores are shown, newest claim first when scores tie, so names appear before the guard exists.

## What the guard writes

Do not `KV.list()`. Do not write `email:`, `key:`, `code:`, or `leaderboard:index`. Home is the only writer of those keys.

Rate-limit windows and the allowed-request total live in the existing `AbuseState` Durable Object (SQLite). They change on the authorize call and do not spend a KV write.

KV is updated only from the DO alarm, and only for hashes listed in `leaderboard:index` (at most 20). The alarm runs hourly for the existing IP cleanup. A stats flush runs only when `STATS_FLUSH_MS` has elapsed (default 3 hours, minimum 1 hour) and stops at `KV_WRITES_PER_DAY` KV writes per UTC day (default 120, hard maximum 200):

1. For each dirty indexed hash, `PUT stats:<key_sha256>` with `{ "requests": <integer>, "updated_at": "<ISO-8601>" }`. `requests` is the number of **allowed** authorize calls for that key. It counts every allowed model request, not only requests the IP abuse policy calls abnormal. Unknown, revoked, and rate-limited calls are not included.
2. If the hash is not on the index, skip it. Keys off the index still use the Durable Object rate limit and do not cause a KV write.
3. Read `stats.requests` for indexed hashes the guard has not counted itself (fall back to `score`, then `0`).
4. Sort by score descending, then `created_at` descending. `PUT leaderboard:top` with **only** `updated_at` and `{ username, score }` entries. Never copy email, the key hash, or the plaintext key into `leaderboard:top`.

Unknown or non-`active` key records must not be added to the index.

Suggested caps, configurable by Worker vars, defaulting to:

| Var | Default | Meaning |
| --- | --- | --- |
| `KEY_LIMIT_PER_MINUTE` | `60` | All requests for one key |
| `KEY_LIMIT_PER_DAY` | `2000` | All requests for one key |
| `EMAIL_LIMIT_PER_MINUTE` | `60` | Secondary cap on the email stored on the key record |
| `EMAIL_LIMIT_PER_DAY` | `2000` | Secondary cap on that email |

Keep the existing per-IP `/rpc` abuse policy as an extra layer. It does not replace these caps.

## `POST /v1/authorize`

Implemented by `cpa-abuse-guard`, not by this home worker. Use the guard's existing service HMAC, the same scheme as `POST /rpc`, plus the response signature below.

### Authentication

Header name: `X-CPA-Guard`

Header value: `<unix-ms>:<nonce>:<hmac>`

- `unix-ms`: 13 digits, decimal milliseconds.
- `nonce`: 32 lowercase hex characters. CPA generates a fresh nonce per request. The guard should reject a replay of the same nonce for 60 seconds, matching `/rpc`.
- `hmac`: 64 lowercase hex characters, HMAC-SHA256.

Signing string, UTF-8, with the raw request body exactly as sent:

```text
<unix-ms>\n<nonce>\nPOST\n/v1/authorize\n<raw body>
```

MAC key: the guard's existing `SERVICE_SECRET` (not `ADMIN_SECRET`). Reject when the header is missing, the clock skew is over 30 seconds, or the MAC does not match. Response: `403 { "error": "Forbidden" }`.

### Request

`Content-Type: application/json`. Maximum body 4096 bytes. Larger bodies: `413 { "error": "Request too large" }`. Invalid JSON or fields: `400 { "error": "Invalid request" }`.

```json
{
  "key_sha256": "64 lowercase hex characters",
  "ip": "203.0.113.10",
  "path": "/v1/chat/completions",
  "model": "optional-model-id"
}
```

`ip` and `model` may be omitted. When `ip` is present it must be a canonical IP, same rules as today's `/rpc`. `path` is the CPA path being authorized.

### Response

Success and denial are both HTTP 200 so CPA can tell a decision apart from a transport failure. CPA still **fails closed** on any non-200, a timeout, a bad or missing response signature, or a body that is not this object.

### Response signature

Sign every HTTP 200 decision body with `X-CPA-Guard` and `SERVICE_SECRET`. `400`, `403`, and `413` stay unsigned; CPA rejects them.

Header value: `<unix-ms>:<request-nonce>:<hmac>`

The nonce is the request nonce, not a new one. `unix-ms` is 13 digits and must be within 30 seconds. Signing string, UTF-8, using the raw response body bytes exactly as sent:

```text
<unix-ms>\n<request-nonce>\n<http-status>\n/v1/authorize\n<raw body>
```

`http-status` is the decimal status (`200`). The HMAC is SHA-256, 64 lowercase hex characters.

A replay of the same request nonce within 60 seconds returns the original decision and is signed again for that same nonce.

Allow:

```json
{ "allow": true, "reason": "ok", "remaining": { "minute": 59, "day": 1999 } }
```

Deny:

```json
{ "allow": false, "reason": "unknown_key", "retry_after": 0 }
```

`reason` is one of `ok`, `unknown_key`, `revoked`, `rate_limited`. `retry_after` is whole seconds and is required when `reason` is `rate_limited`. `remaining` is optional on deny.

Timeouts: CPA aborts the guard call at 3 seconds by default. The guard should answer in well under that. On timeout, connect error, HTTP 5xx, a bad response signature, or malformed JSON, CPA rejects the client request.

### Decision order

1. MAC and body checks (403 / 400 / 413).
2. Load `key:<key_sha256>`. Missing or `status !== "active"` → `{ "allow": false, "reason": "unknown_key" }` or `revoked` when the record exists but is not active.
3. Apply the per-key minute/day counters, then the per-email counters from that record's `email`. Over cap → `rate_limited` and `retry_after`.
4. Count an allowed request in the Durable Object immediately. Flush `stats:<key_sha256>` and `leaderboard:top` on the budgeted alarm above, not on this request.
5. Existing per-IP abuse logic may still deny the request. That denial stays on the current `/rpc` `check`/`observe` behavior; do not weaken it.

## KV budget (home, phase 1)

Cloudflare's free KV tier is about 1,000 writes/day and 100,000 reads/day.

One successful claim writes the code record, email record, key record, `leaderboard:index`, and `leaderboard:top`, plus up to three throttle keys (email, IP, global). That is about 8 writes. A wrong guess or resend adds one code write. At 80 successful emails/day (under Resend's free daily cap, and the home global cap `GLOBAL_SENDS_PER_DAY`) the claim path stays around 640–800 writes/day.

Reads: a few per claim, plus one `leaderboard:top` read per leaderboard cache miss. With a 60-second response cache that is on the order of 1,440 origin reads/day per colo, far under 100,000. The page must not list the namespace.

Phase 2 does not write KV on the authorize request. The Durable Object holds the counters. A flush writes at most one `stats:` key per indexed hash plus one `leaderboard:top`, at most every `STATS_FLUSH_MS` and at most `KV_WRITES_PER_DAY` (default 120) writes per UTC day. With the default 3 hour interval that is well under the writes left after the claim path. Keys off the 20-row index do not cause a KV write.

## Phase 2 deployment

The guard change adds the `KEYS` binding, `POST /v1/authorize`, the Durable Object counters, and the budgeted `stats:` / `leaderboard:top` flush. CPA calls the endpoint with the key hash and fails closed. Deploy the guard before enabling `access.remote-key-auth` on CPA. Neither deploy is part of this home change.

Still unchanged here:

- Stop using the public shared key in `.github/scripts/yifu_keys.py` and, on `codex/free-token-home-20261024`, `.github/scripts/cpa_abuse_guard.py` (it calls `api.models(state["claim"]["apiKey"])`). Those files are intentionally unchanged in phase 1. `yifu_key_api.site_claim()` still expects the oath endpoint to return `apiKey`; key workflows will fail until they verify a dedicated test key or `/healthz` instead.
- Game finish no longer returns `FREE_TOKEN_RENDER_KEY`. The oath endpoint no longer returns it either. The secret is still declared and still drives `GET /api/free-token/status` plus game start/finish availability. Do not delete it until those callers are moved.
- `FREE_TOKEN_OPS_SECRET` still bypasses Turnstile and the Durable Object rate limit, including the new email-code requests. Restrict or remove that bypass when the ops probe no longer needs it.

## Home mail

Home sends with the existing Resend account:

`POST https://api.resend.com/emails`

`Authorization: Bearer ${RESEND_API_KEY}`

From address: Worker var `CLAIM_MAIL_FROM`, default `noreply@leonmingod.com`.
