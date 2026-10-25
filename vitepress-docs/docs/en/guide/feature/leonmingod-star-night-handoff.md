# LeonMinGod star-night handoff (2026-10-25)

This is the latest website handoff and supersedes historical page, directory, and deployment assumptions. This handoff did not deploy website code or rotate keys.

## Current release: dedicated choices and trial v2 (2026-10-25 16:40 UTC)

Maintenance source is now `sites/leonmingod-star-night/`, recovered and updated during this task.
Parent: `f9576720-5c7f-4909-a685-5e145fc25001`. Forwarder:
`51a33be8-6ca4-4b4f-886f-613bfea996b0`. Forwarding source is unchanged; SITE now targets the
parent's named `Site` entrypoint. Preserve its specific routes, ASSETS, Secrets, and GAME_RUNS.
The single-token entrance leads to `/free-token/choose/`; game exit returns there. Trial v2
requires 16 jade in 30 seconds with three shields.

[Publication](https://github.com/928886540/cloudflare_temp_email/actions/runs/40212806612) passed.
Both public reward paths return the same existing key, fingerprint `7fa19b84ca57a2ba`; models
returns 200 with 22 models. Concurrent game claims return 200/409/409. All 14 updated resources,
eight protected originals, and apex/www parity checks passed. See the source directory's
`WEBSITE_UPDATE_CN.md` and sanitized `verification/` evidence.

Keeping ASSETS also retains its routing: do not expect setting `assets.config.run_worker_first`
alone to replace that behavior. Preserve the named entrypoint binding. HTML comparisons remove
only the injected CF analytics script and its extra newline. Version numbers and deployment
assumptions further below are historical.

## Recovered maintenance source: token passage and game v2

Current cloud source is now `sites/leonmingod-star-night/`: server/router code recovered from production source maps plus critical public assets. This is not a full copy of the Windows directory; original update/review files remain unavailable. Continue here, not in historical `sites/free-token-home/`.

The token entrance now leads to `/free-token/choose/` with two illustrated routes. Homepage invitation text is removed and orb glow strengthened. Claim/game layouts fit short screens; game exit returns to choices. Native image_gen created the icon atlas and night mountain background. V2 requires 16 jade in 30 seconds with three shields and escalating formations; a 160-run regular bot profile won 52.5%, which is not human pass-rate data. Existing v1 runs retain their original replay rules.

Use `.github/workflows/leonmingod-star-night.yaml` to stage then publish, preserving existing ASSETS, all Secrets, namespace/state, and forwarding structure. See the source directory's `WEBSITE_UPDATE_CN.md`.

## Source availability

- User's local website: `D:\apiWorkSpace\leonmingod-home`, without a Git repository.
- `D:\apiWorkSpace\cpa-render` is a separate backend project.
- The cloud currently contains historical `sites/free-token-home/` code in `928886540/cloudflare_temp_email`.
- **The new `public/`, `src/game.js`, `edge-router/`, `wrangler.toml`, and `WEBSITE_UPDATE_CN.md` have not been uploaded or connected.** Do not claim they have been read or synchronized. Windows paths are reference locations, not cloud paths.
- Request the website source archive containing at least `public/`, `src/`, `edge-router/`, `wrangler.toml`, and `WEBSITE_UPDATE_CN.md`; retain package manifests and lockfiles when present.
- Do not deploy historical website code from `codex/free-token-home-20261024` over the star-night version. Changes under `sites/free-token-home/**` trigger its historical deployment workflow. Verify live routing and current source first.

## Live verification

Read-only verification at 2026-10-25 15:50 UTC used existing Actions credentials:
[run 40208834255](https://github.com/928886540/cloudflare_temp_email/actions/runs/40208834255).

| Resource | Observed result |
| --- | --- |
| Homepage | `https://leonmingod.com/`, HTTP 200 |
| Token entrance | `https://leonmingod.com/free-token/`, HTTP 200 |
| Original claim page | `https://leonmingod.com/free-token/claim/`, HTTP 200 |
| Game | `https://leonmingod.com/free-token/game/`, HTTP 200, 御剑破阵 |
| Parent Worker | `leonmingod-home`, `2bc44ccd-b647-483b-aca7-256ea46ad69c` |
| Entrance Worker | `leonmingod-free-token`, `69575cec-ac2c-416f-81b9-b64030e87651` |
| Parent bindings | `ASSETS`, `FREE_TOKEN_CPA_KEY`, `FREE_TOKEN_RENDER_KEY`, `GAME_RUNS` |
| Original claim API | POST `/api/free-token/claim`, HTTP 200, existing Render address and key |
| Issued key | `/v1/models` HTTP 200, 22 models; fingerprint `7fa19b84ca57a2ba` |
| Render | Live deploy `dep-dbevs57b9u1s73b4q6pg`, three client keys, ten login files |

Entrance scripts, game application/styles, and shared engine return HTTP 200. GET requests to `game/start` and `game/finish` return HTTP 405 with Allow: POST. Homepage script `/home-scene-v5.js?v=20261025-night` initializes `enabled = false`, keeping fullscreen fluid effects off by default.

This check inspected public pages/scripts and the original claim API. It did not complete a game or repeat concurrent reward claims. Model counts and versions are snapshots; reread live state before mutation.

## Current architecture and rewards

- The website runs on **Cloudflare Workers**. Render hosts only the CPA API.
- Reported parent source: `src/index.js`, `wrangler.toml`, and `public/`.
- Reported `edge-router/index.js` only forwards to the parent through `SITE`, with more specific routes. Preserve this structure and verify it against incoming source/live routes; do not redeploy the historical HTML-transforming entrance.
- Game APIs: POST `/api/free-token/game/start` and POST `/api/free-token/game/finish`.
- Shared engine: `public/free-token/game/engine.mjs`; server: `src/game.js`.
- Durable Object: `GameRun`; binding: `GAME_RUNS`; SQLite migration: `v1-game-runs`. Preserve existing namespace, migrations, and state on deployment.
- Server replay checks timing, outcome, session, and repeated rewards. Per-run credentials last three minutes; this does **not** expire client API keys.
- Win by surviving 30 seconds with three initial shields and collecting at least ten jade pieces. Public engine constants confirm these rules.
- Keep both game rewards and the original 义父 claim flow, using the same reward.
- Base URL: `https://cpa-dhke.onrender.com/v1`. Read the existing `FREE_TOKEN_RENDER_KEY` server-side. Never embed its value in frontend code, source control, chat, or logs.

Existing Actions Secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `RENDER_API_KEY` remain usable; no repeated setup is necessary. Direct cloud Wrangler use requires a usable authorization channel separately. Routine key tools remain documented in [the operations record](./free-token-render.md); account for both reward paths and preserve `GAME_RUNS` when adapting them.

## Design constraints

- Preserve desktop/mobile star-night artwork, distant galaxies/constellations, and the theme 一念风起，万境星垂.
- Keep stars subtle, reduce foreground particles, and do not switch to daylight.
- Clearly adult characters; retain the fuller figure, exposed shoulders, and deep neckline direction. The user reports extra fingers were fixed.
- Preserve jade navigation, sphere navigation, the complete token cord, and page transitions.
- After image edits, zoom in to inspect fingers, wrists, cord connections, and text. Use only native `image_gen` for image creation/editing.
- Support touch without hover dependence and retain mobile performance budgets.

## Evidence awaiting upload

The user reports successful browser gameplay/public rewards, one success under concurrent claims and HTTP 409 on repeats, apex/www asset matches, five layouts, touch controls, old claims, and transitions. Those results have not been reproduced during this handoff; their files are not yet available in the cloud:

- `WEBSITE_UPDATE_CN.md`
- `.review-20261025/game-image-generation.json`
- `.review-20261025/production-game-api.json`
- `.review-20261025/production-game/`
- `.review-20261025/game-before/`

Public inspection copies are temporarily stored at `/workspace/scratch/leonmingod-handoff-20261025/`; they are not complete deployable source.
