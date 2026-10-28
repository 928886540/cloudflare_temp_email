# CPA key authorization contract (draft)

Status: **draft for phase 2**. This repository does not implement `POST /v1/authorize` or per-key rate limits yet. `cpa-abuse-guard` stays as it is deployed today. CPA must keep failing closed until phase 2 is deployed: if the guard is unreachable, times out, or returns a non-success response, reject the client request.

Phase 1 (this change) only mints unique keys on `leonmingod-home` and writes the KV records below. Scores stay `0` until the guard starts updating them.

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
| `leaderboard:top` | `{ "updated_at", "entries": [{ "username", "score" }] }` | Public cache. Score is `0` until phase 2. |

Normalized email is trimmed and lowercased. Usernames are trimmed, control characters removed, 1–20 code points.

`GET /api/leaderboard` reads only `leaderboard:top` (one KV read) and returns `{ updated_at, entries: [{ username, score }] }`. It does not list the namespace. Responses use `Cache-Control: public, max-age=60`. A request with `Cache-Control: no-cache` bypasses the Worker cache.

Zero scores are shown, newest claim first when scores tie, so names appear before the guard exists.

## What the guard must write in phase 2

Do not `KV.list()`. Touch only the key that was presented, plus the small index.

1. After an allowed request, increment usage:

   `KEYS.put("stats:<key_sha256>", JSON.stringify({ requests: <integer>, updated_at: "<ISO-8601>" }))`

   `requests` counts **every** request for that key, not only requests the existing abuse policy calls abnormal.

2. `GET leaderboard:index`. If no entry has that `key_sha256`, stop. Do not scan other keys.

3. For each of the at most 20 indexed hashes, `GET stats:<key_sha256>`. Missing stats mean score `0`. Use the integer `requests` field (fall back to `score` only if `requests` is absent).

4. Sort by score descending, then `created_at` descending. `PUT leaderboard:top` with **only** `updated_at` and `{ username, score }` entries. Never copy email, the key hash, or the plaintext key into `leaderboard:top`.

Unknown or non-`active` key records must not be added to the index. Home is the only writer of `email:`, `key:`, `code:`, and `leaderboard:index`.

Suggested caps, configurable by Worker vars, defaulting to:

| Var | Default | Meaning |
| --- | --- | --- |
| `KEY_LIMIT_PER_MINUTE` | `60` | All requests for one key |
| `KEY_LIMIT_PER_DAY` | `2000` | All requests for one key |
| `EMAIL_LIMIT_PER_MINUTE` | `60` | Secondary cap on the email stored on the key record |
| `EMAIL_LIMIT_PER_DAY` | `2000` | Secondary cap on that email |

Keep the existing per-IP `/rpc` abuse policy as an extra layer. It does not replace these caps.

## `POST /v1/authorize`

Not implemented in this PR. When phase 2 adds it, use the guard's existing service HMAC, the same scheme as `POST /rpc`.

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

Success and denial are both HTTP 200 so CPA can tell a decision apart from a transport failure. CPA still **fails closed** on any non-200, a timeout, or a body that is not this object.

Allow:

```json
{ "allow": true, "reason": "ok", "remaining": { "minute": 59, "day": 1999 } }
```

Deny:

```json
{ "allow": false, "reason": "unknown_key", "retry_after": 0 }
```

`reason` is one of `ok`, `unknown_key`, `revoked`, `rate_limited`. `retry_after` is whole seconds and is required when `reason` is `rate_limited`. `remaining` is optional on deny.

Timeouts: CPA should abort the guard call at 3 seconds. The guard should answer in well under that. On timeout, connect error, HTTP 5xx, or malformed JSON, CPA rejects the client request.

### Decision order

1. MAC and body checks (403 / 400 / 413).
2. Load `key:<key_sha256>`. Missing or `status !== "active"` → `{ "allow": false, "reason": "unknown_key" }` or `revoked` when the record exists but is not active.
3. Apply the per-key minute/day counters, then the per-email counters from that record's `email`. Over cap → `rate_limited` and `retry_after`.
4. Count the request (including this allowed one) into `stats:<key_sha256>` and refresh `leaderboard:top` as above.
5. Existing per-IP abuse logic may still deny the request. That denial stays on the current `/rpc` `check`/`observe` behavior; do not weaken it.

## KV budget (home, phase 1)

Cloudflare's free KV tier is about 1,000 writes/day and 100,000 reads/day.

One successful claim writes the code record, email record, key record, `leaderboard:index`, and `leaderboard:top`, plus up to three throttle keys (email, IP, global). That is about 8 writes. A wrong guess or resend adds one code write. At 80 successful emails/day (under Resend's free daily cap, and the home global cap `GLOBAL_SENDS_PER_DAY`) the claim path stays around 640–800 writes/day.

Reads: a few per claim, plus one `leaderboard:top` read per leaderboard cache miss. With a 60-second response cache that is on the order of 1,440 origin reads/day per colo, far under 100,000. The page must not list the namespace.

Phase 2's `stats:` and `leaderboard:top` updates are additional writes, one pair per authorized CPA request for a key that is on the board. Cap or batch those writes before the combined home+guard traffic can pass 1,000 writes/day. Keys that are not on the 20-row index only need the `stats:` write if a counter is required for rate limits; they must not trigger an index scan.

## Phase 2 still to build

- `KEYS` binding on `cpa-abuse-guard`, same namespace id.
- `POST /v1/authorize` implementing this document.
- Per-key and per-email counters for every request.
- The `stats:` / `leaderboard:top` writes above.
- CPA (CLIProxyAPI) calling the endpoint with the key hash and failing closed.
- Stop using the public shared key in `.github/scripts/yifu_keys.py` and, on `codex/free-token-home-20261024`, `.github/scripts/cpa_abuse_guard.py` (it calls `api.models(state["claim"]["apiKey"])`). Those files are intentionally unchanged in phase 1. `yifu_key_api.site_claim()` still expects the oath endpoint to return `apiKey`; key workflows will fail until they verify a dedicated test key or `/healthz` instead.
- Game finish no longer returns `FREE_TOKEN_RENDER_KEY`. The oath endpoint no longer returns it either. The secret is still declared and still drives `GET /api/free-token/status` plus game start/finish availability. Do not delete it until those callers are moved.
- `FREE_TOKEN_OPS_SECRET` still bypasses Turnstile and the Durable Object rate limit, including the new email-code requests. Restrict or remove that bypass when the ops probe no longer needs it.

## Home mail

Home sends with the existing Resend account:

`POST https://api.resend.com/emails`

`Authorization: Bearer ${RESEND_API_KEY}`

From address: Worker var `CLAIM_MAIL_FROM`, default `noreply@leonmingod.com`.
