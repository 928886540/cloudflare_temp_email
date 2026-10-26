# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## LeonMinGod homepage / Free Token / Render operations

### Latest website handoff: star-night and game (2026-10-25)

Read [the latest handoff](vitepress-docs/docs/en/guide/feature/leonmingod-star-night-handoff.md)
([中文](vitepress-docs/docs/zh/guide/feature/leonmingod-star-night-handoff.md)) first.
Production now includes the star-night artwork and a game reward path, with parent
Worker `leonmingod-home` now at `096277f9-58f3-4671-a137-b4cb2cdcd21b`
(closed: no `FREE_TOKEN_RENDER_KEY`; source release `51310ec6-e00b-4308-b729-bcfc7af6f111`).
Forwarder version is `51a33be8-6ca4-4b4f-886f-613bfea996b0`; retain SITE →
leonmingod-home / named entrypoint `Site`, plus existing routes. Both claim flows
and public concurrent reward protection were reverified; see source `verification/`.
The live browser client is `app-v8.mjs`: NO pause controls, keyboard pause, or
auto-pause on blur/visibility/touch. Keep real elapsed-time advancement and catch-up
on return; the user explicitly requested uninterrupted play.
Current trial is v6: 45 seconds, 24 jade, TWO shields. Rage starts at 19 collected
(five remaining), NEVER at a remaining-seconds threshold. At 24, stop jade and survive
the full duration. Defeat shows one of ten emoji/poetic oath taunts and a direct claim
link. Keep browser/server aligned and retain v1/v2/v3/v4/v5 in-flight replay. Current poster URLs are home v6 / token v4.
Sword-tip pickup fix: v6 collects jade/gold along the visible tip-to-body capsule
(70 units above playerY); never shift/enlarge the ordinary damage hitbox to match it.
Gold is a separate native-image_gen talisman, NOT goal jade. It grants exactly five
seconds of a generated transparent golden barrier with HUD countdown; same-frame
pickup precedes damage, expiry restores damage, another pickup refreshes without
stacking. Preserve the new WebP token/ring art and actual-time expiry without pause.
Fairness correction (2026-10-26): make challenges dodgeable, not forced losses.
Keep constant sword trajectories without edge ricochet, reachable stable three-lane
wall openings protected against overlapping swords, and the eased v5 cadence.
PUBLIC SCREENS SHOW ONLY WIN CONDITIONS: 24 jade, 45 seconds, two shields. Never
preannounce final-five/rage/pure-survival mechanics in start copy or HUD warnings.
The user explicitly rejected that spoiler text. Taunts remain playful flavor.
The user also rejected floating debug-like gap rectangles/text. Do not draw safe-gap
boxes, dashed outlines or “缺口” labels; players identify the visible empty space.
Current cloud maintenance source has now been recovered from production source maps
and public assets into `sites/leonmingod-star-night/` (`/workspace/leonmingod-home`
is a convenience symlink). Read its `WEBSITE_UPDATE_CN.md` and `README.md`. This is
not a complete copy of the user's original non-Git Windows directory or its historical
review files. Historical `sites/free-token-home/` is not the deployment authority.
Use `.github/workflows/leonmingod-star-night.yaml` to stage then publish; it preserves
existing assets, secrets, forwarding routes, and the GameRun namespace. Do not deploy
the incomplete recovered public mirror as a replacement static asset set. Preserve
both claim paths, the `GAME_RUNS` migration/state, star-night art and touch controls.
Existing Actions CF/Render credentials remain usable. Re-read live versions before changes.

### User-defined shorthand

- **“暂时去掉 / 关闭义父 Token” means revoke the currently issued Yifu key in
  Render and remove `FREE_TOKEN_RENDER_KEY`. Token clicks must stay on the token
  artwork and show “暂未开放”. “开放 / 打开给别人用” means register/verify a new key
  and publish that Secret; clicks automatically restore the original animation
  and `/free-token/choose/` entry.** The frontend checks no-store
  `GET /api/free-token/status` on every click, including reduced-motion/keyboard.
  No new artwork/page redeploy is needed for routine open/close operations. Do not
  restore a revoked old key or roll back an enabled Worker version to reopen.
  Preserve this behavior and the unrelated original keys/login files. Website
  stage/publish must retain a closed state if its issuance Secret is absent.

Current Yifu issuance is CLOSED. No active/published Yifu key remains.
`01db29c9e73f5fba` was revoked (401), run `40268141055`; prior
`7fa19b84ca57a2ba` remains revoked. Render deploy `dep-dbfd805g1s2s73fbrr7g`.
Two other original client keys and ten login files remain intact.
Use default add/remove dry-run workflows to inspect a closed service; the historical
`issue-yifu-key` inspect assumes an open claim endpoint.

- **“更新义父 Key” / “换个新的义父 key” means ROTATE, not append-only.**
  The user corrected this explicitly on 2026-10-26: retain only the newest Yifu
  issuance key. Capture the currently issued key fingerprint before adding;
  create/register a new key, publish it and verify models 200, then revoke the
  captured prior Yifu key and verify 401. Use `yifu-remove-key.yaml` with that
  explicit OLD fingerprint; never remove `current` after switching, which would
  revoke the new key. Preserve unrelated pre-existing client keys and login files.
  Only an explicit “add another key / keep the old Yifu key” request changes this.

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
