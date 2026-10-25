# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## LeonMinGod homepage / Free Token / Render operations

### User-defined shorthand

- “义父 Token” / “义父token” means the Free Token website at
  `https://leonmingod.com/free-token/` in this repository.
- “加一个义父密钥” means append a new **client API key** to the Render `cpa`
  service configuration, preserving existing keys and other settings. It does not
  mean creating another Render management API credential (`RENDER_API_KEY`).
- “打开义父 Token 给别人用” means enable/publish issuance of the corresponding
  Render client key through this website's claim flow, with the same key in the
  parent Worker Secret and Render. This is an operational publishing request,
  not merely an instruction to navigate to the page.
- Creating a client key and publishing it on the website are distinct requests.
  Add only the client key when asked to add one; wire it into the website when
  asked to enable/share it. Use session context to identify the intended key.

For routine key operations, use the default branch workflows:
`.github/workflows/yifu-add-key.yaml` (add and publish by default; `publish=false` adds only),
and `.github/workflows/yifu-remove-key.yaml` (remove the currently issued key by default;
optional `fingerprint` targets another key). Both read live versions automatically;
no script edits or temporary private keys are needed. `dry_run=true` is read-only.
Use these workflows instead of the historical migration/issuance scripts.

Before changing `leonmingod.com`, Free Token, either homepage Worker, or Render CPA,
read [the operations record](vitepress-docs/docs/en/guide/feature/free-token-render.md)
([中文](vitepress-docs/docs/zh/guide/feature/free-token-render.md)). It records the
production resources, verified versions, secret locations, deployment evidence,
and credential-preservation procedure. The website source and integration workflow
are on `codex/free-token-home-20261024`; `main` also carries this record for discovery.
The successful Render cutover was verified on 2026-10-24. Re-read live versions
before any mutation. `connect` is a completed one-time migration, not a general
redeploy command. Preserve existing keys, login files, artwork, and interactions.
Use existing GitHub Actions secrets; their absence from a chat environment does not
mean they are missing from GitHub. Never commit or print secret values.

## Project Structure

- **Backend**: `worker/` — Cloudflare Workers API using Hono framework. Entry: `worker/src/worker.ts`, APIs under `worker/src/*_api/`.
- **Frontend**: `frontend/` — Vue 3 + Naive UI app deployed to Cloudflare Pages. Routes in `frontend/src/router/`.
- **Pages middleware**: `pages/functions/_middleware.js` — Routes API calls to Worker backend.
- **Mail parser**: `mail-parser-wasm/` — Rust WASM email parser.
- **SMTP/IMAP proxy**: `smtp_proxy_server/` — Python proxy server.
- **DB schema/migrations**: `db/` — SQLite via Cloudflare D1, dated migration patches.
- **Docs**: `vitepress-docs/` — VitePress documentation site (zh + en).
- **E2E tests**: `e2e/` — Playwright tests in Docker Compose (API, browser, SMTP proxy).
- **Changelogs**: `CHANGELOG.md` (中文) + `CHANGELOG_EN.md` (English).

## Build & Dev Commands

Run inside each subfolder with `pnpm`:

| Folder | Dev | Build | Lint | Deploy |
|--------|-----|-------|------|--------|
| `worker/` | `pnpm dev` | `pnpm build` | `pnpm lint` | `pnpm deploy` |
| `frontend/` | `pnpm dev` | `pnpm build` | — | `pnpm deploy` |
| `vitepress-docs/` | `pnpm dev` | `pnpm build` | — | — |
| `mail-parser-wasm/` | — | `wasm-pack build --release` | — | — |

SMTP proxy: `pip install -r smtp_proxy_server/requirements.txt` then `python smtp_proxy_server/main.py`.

## E2E Tests

Tests run in Docker Compose with Playwright. From `e2e/`:

```bash
npm test              # Build, run all tests, exit
npm run test:down     # Clean up containers
```

Test categories: `tests/api/` (API tests), `tests/browser/` (UI tests with Chromium), `tests/smtp-proxy/` (SMTP/IMAP proxy tests).

The Docker frontend serves over **HTTPS** (self-signed cert) with Vite proxy to worker — required for WebAuthn (`navigator.credentials`) and `crypto.subtle` which need a secure context. Browser tests use `ignoreHTTPSErrors: true`.

Key patterns for browser tests:
- Frontend hashes passwords with SHA-256 (`crypto.subtle`) before sending — API test registration must use pre-hashed passwords if UI login is needed.
- VueUse `useStorage('key', '')` with string default uses **raw string** serialization — set localStorage with raw value, not `JSON.stringify()`.
- WebAuthn browser tests use CDP virtual authenticator (`WebAuthn.enable` + `WebAuthn.addVirtualAuthenticator`).

## Architecture

### Worker Auth Flow (`worker/src/worker.ts`)

Three auth layers applied via Hono middleware, each using different headers:

| Path prefix | Header | Purpose |
|-------------|--------|---------|
| `/api/*` | `Authorization: Bearer <jwt>` | Address (mailbox) credential |
| `/user_api/*` | `x-user-token` | User account JWT |
| `/admin/*` | `x-admin-auth` | Admin password |
| (any) | `x-user-access-token` | User role-based access token |
| (any) | `x-custom-auth` | Optional global access password |
| (any) | `x-lang` | Language preference (`en`/`zh`) |

Public endpoints (no auth): `/open_api/*`, `/user_api/login`, `/user_api/register`, `/user_api/passkey/authenticate_*`, `/user_api/oauth2/*`.

### Worker Email Flow (`worker/src/email/`)

Cloudflare Email Worker entry: `email()` in `worker/src/email/index.ts`. Processing pipeline:
1. Parse raw email → check junk → check address exists
2. Auto-reply if configured → forward if configured → webhook if enabled
3. Store in D1 database

### Frontend State (`frontend/src/store/index.js`, `frontend/src/api/index.js`)

Global state via VueUse `useStorage` for persistence. The `api` module wraps axios with auto-attached auth headers and fingerprinting. API base URL comes from `VITE_API_BASE` env var (empty = same origin).

## Coding Style

- `worker/` uses TypeScript + ESLint; `frontend/` uses Vue SFCs.
- Keep existing naming patterns: `*_api/` folders, `utils/`, `models/`.
- ESM imports only (`type: module`).

## Commits & PRs

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`.
- PRs should explain scope; add screenshots for UI changes.
- Use squash merge for PRs.

## Post-Task Checklist (IMPORTANT)

After completing any feature, bug fix, or improvement, **always check**:

1. **CHANGELOG.md** (中文) and **CHANGELOG_EN.md** (English) — both must be updated under the current `(main)` version section with the change entry. Follow the existing format: `- feat/fix/docs: |模块| 描述`.
2. **Documentation** — if the change involves new environment variables, new API endpoints, or configuration changes, update the corresponding docs in `vitepress-docs/docs/zh/` and `vitepress-docs/docs/en/`. Key files:
   - `guide/worker-vars.md` — Worker environment variables
   - `guide/ui/` — Frontend deployment docs
   - `guide/feature/` — Feature-specific docs
   - `api/` — API reference docs
3. **Both languages** — docs and changelogs exist in Chinese and English; always update both.

## Config

- Worker settings in `worker/wrangler.toml` (see `wrangler.toml.template` for bindings).
- Frontend uses `VITE_*` env vars. Don't commit secrets.
