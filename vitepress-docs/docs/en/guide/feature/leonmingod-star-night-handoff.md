# LeonMinGod star-night handoff (2026-10-25)

## Published: remove floating rectangles and gap labels (2026-10-26 01:30 UTC)

Parent `190a247f-8f89-4437-b41d-137cf2760145`; entrance remains `51a33be8-6ca4-4b4f-886f-613bfea996b0`; client `app-v7.mjs`.
Only the falling dashed/transparent rectangle and gap label are removed; players read the formation's open space. The v5 engine, actual corridor protection, difficulty, uninterrupted play, win conditions and ten taunts are unchanged.
[Publication acceptance](https://github.com/928886540/cloudflare_temp_email/actions/runs/40254536775) and all twelve mandatory stage tests passed. Apex/www load the source-matching client without box/label rendering; v5 engine bytes remain identical.
Public browser/wall-scene checks at 320x480, 393x580 and 844x390 passed with a mocked start API; this visual-only change does not claim another real game redemption. Publication verified original claim/models HTTP 200, the same current key, GAME_RUNS and forwarding structure; Render is unchanged.
Evidence: `verification/no-gap-marker-*.json`, `release-no-gap-markers.json`. The user rejected debug-like safe-zone cues; do not restore them. Sections below are historical.


## Visual correction: remove floating gap boxes and labels

The user rejected the descending transparent/dashed rectangle and “gap” label as immersion-breaking. Client `app-v7.mjs` only removes that rendering block, leaving players to read the sword formation's empty space.
No replacement cue asset is added. The v5 three-lane opening, corridor protection, straight sword trajectories, difficulty, rewards and elapsed-time progression remain intact.
Do not restore debug-like safe-zone boxes or labels; any future cue artwork should fit the existing fantasy scene.


## Published: v5 fair sword patterns and concise win conditions (2026-10-26 01:16 UTC)

Parent `8a812fa0-2aec-4ebb-ba29-bff5442ff8d0`; entrance remains `51a33be8-6ca4-4b4f-886f-613bfea996b0`.
[Publication acceptance](https://github.com/928886540/cloudflare_temp_email/actions/runs/40253418901) passed. All twelve backend tests passed, including ninety reachable/unblocked wall-gap scenarios, no ricochets, v1-v4 compatibility and SQLite concurrent reward protection.
The game uses v5 / app-v6: lower middle/final density and speed, stable protected three-lane gaps with visible markers. Retain 45 seconds, 24 jade, two shields, uninterrupted play and ten playful taunts.
Public instructions list only win conditions. Start/HUD copy does not preannounce final-five or later mechanics. The user wants challenge without unavoidable traps or forced losses; preserve this preference.

Real public v5 redemption succeeded with 24 jade/two shields; concurrent finishes returned 409/200/409. The current key fingerprint remains `01db29c9e73f5fba`, models HTTP 200 with 34 models. Render, keys and character artwork are unchanged.
All 28 release resources match source, eight protected originals remain intact, and apex/www match. Public browser tests at 320x480, 393x580 and 844x390 mock start to verify spoiler-free copy, uninterrupted touch/background progression, failure controls and phase markers without script errors; real redemption is verified separately through public APIs.
GAME_RUNS, ASSETS, SITE/Site routing and in-flight older runs remain intact; yesterday's revoked key stays revoked. Evidence: `verification/release-v5.json`, `production-v5.json`, `fairness-v5.json`, `fairness-browser-*.json`. Sections below are historical.


## v5 adjustment: readable patterns and protected wall openings

The user found v4 unfair; the goal is a challenging, dodgeable game rather than forced losses.
New `engine-v5.mjs` / `app-v6.mjs` keep swords on their initial straight trajectories and remove them offscreen without ricochet. Walls leave three stable empty lanes near a reachable position. Predicted crossing swords cannot block the opening during passage; a small moving gap marker makes it readable.
Normal cadence/pair rates ease slightly. Late pairs change from 20/14 to 28/24 frames and walls from 108/72 to 180/156 frames; speeds/drift ease and hit protection rises from 48 to 60 frames.
Keep 45 seconds, 24 jade, two shields, final-five progression, survival after collection, no pause, ten taunts, choice-page exit and in-flight v1/v2/v3/v4 replay.
**Public pages explain only the win conditions, without revealing the final-five or later mechanics.** The original claim page's game summary now also says 45 seconds/24 jade.
Ninety seed/phase scenarios verify at least 900 walls and 30000 protected frames: gaps are reachable after a 300ms reaction budget and remain clear of crossing swords. Artwork and the current key stay unchanged.


## Yesterday's Yifu key revoked (2026-10-26 00:46 UTC)

The user explicitly clarified that refreshing means replacing and revoking the prior Yifu key. [Revocation and verification](https://github.com/928886540/cloudflare_temp_email/actions/runs/40250878059) passed.
Yesterday's `7fa19b84ca57a2ba` was removed from Render and returns models HTTP 401. The website still issues only new `01db29c9e73f5fba`, with models HTTP 200.
Render retains three client keys: the current Yifu key and two other original keys. All ten login files were restored. Deploy `dep-dbfa5eq9lscs739btcq0` uses unchanged code.
CF parent remains `c6a75a10-b1bd-4a93-ba54-8d4ba2236408`, entrance `51a33be8-6ca4-4b4f-886f-613bfea996b0`; website/game code and new-key issuance are unchanged.
Future Yifu key refreshes must verify/publish the new key and then revoke the prior Yifu key, never append only. Evidence: `verification/key-revocation-20261026.json`. Sections below are historical.


## Current issued key refreshed (2026-10-26 00:39 UTC)

Completed the requested new Yifu client key using default-branch `yifu-add-key.yaml`, `publish=true`.
The new key fingerprint is `01db29c9e73f5fba` (not a credential). Render now has four keys: all three prior keys remain valid, and all ten login files were backed up and restored.
Render deploy `dep-dbfa25cs728c73elg030` reuses commit `f9cee393e5360db6b47dd18d6c2747a2e6c6cbb7`. Old/new key model checks passed; the new key returned models HTTP 200 with 34 models.
Website `FREE_TOKEN_RENDER_KEY` issues that same new key; the API base remains `https://cpa-dhke.onrender.com/v1`.
Current parent version is `c6a75a10-b1bd-4a93-ba54-8d4ba2236408`; entrance remains `51a33be8-6ca4-4b4f-886f-613bfea996b0`. This operation only changed the Secret: all Worker modules, pages/effects, v4 game rules, other bindings and Render environment settings remain intact.
[Operation and verification](https://github.com/928886540/cloudflare_temp_email/actions/runs/40250335029); sanitized result: `verification/key-rotation-20261026.json`. Keep using the fixed workflow and live version reads for future key changes. Sections below are historical.


## Published: v4 final-five rage and ten taunts (2026-10-26 00:24 UTC)

Parent `ad78a420-ae8e-4df3-86b4-8b2f3d3edca3`; entrance stays `51a33be8-6ca4-4b4f-886f-613bfea996b0` with SITE → Site intact.
[Publication acceptance](https://github.com/928886540/cloudflare_temp_email/actions/runs/40249180162) passed; all nine backend stage tests passed.
New v4 / app-v5 runs use 45 seconds, 24 jade and two shields. Rage starts at 19 collected (five remaining), independently of remaining time. At 24, jade stops and pure survival continues to 45 seconds.
Defeats choose one of ten emoji taunts, including the user's three lines and playful Chinese poem adaptations, with retry and direct oath claim. No pause; exit returns to choices.

A real public v4 reward succeeded with 24 jade and one shield; concurrent finishes returned 409/409/200. Original/game claims share the existing key; models returned 200 with 34 models.
All 26 release resources match source, eight protected original assets/scripts remain intact, and apex/www match. Public browser tests at 320x480, 393x580 and 844x390 mocked start to verify short screens, uninterrupted drag/background settlement, visible taunts/controls, and 19/24-jade states with no script errors. Real redemption was verified separately through public APIs.
Keys, Render configuration, star-night artwork, ASSETS, GAME_RUNS namespace and v1/v2/v3 in-flight replay are preserved. See `verification/production-v4.json`, `rage-browser-*.json` and `release-v4.json`. Sections below are historical.


## v4: rage on the final five jade and defeat taunts (2026-10-26)

New runs use `engine-v4.mjs` / `app-v5.mjs`: 45 seconds, 24 jade, two shields and no pause.
**Rage begins at 19 collected jade, with five remaining; it is unrelated to the remaining seconds.**
Rage adds aimed pairs, crossing swords and wall formations with gaps. At 24 jade, drops stop and existing jade clears; denser pure survival continues until the full 45 seconds.
Defeats randomly show one of ten emoji taunts, including the user's three lines and playful Chinese poem adaptations, with retry and a direct `/free-token/claim/` link. Exit still returns to the choice page. Flavor text does not change reward/key lifetime.
Server elapsed-time validation is versioned: v4 requires 45 seconds; in-flight v1/v2/v3 retain original replay and 30-second checks. No migrations, keys or artwork change.
The offline planner in `scripts/planner.mjs` never ships to browsers or the Worker. A winning trace is stored in `verification/difficulty-v4-fixture.json`; it is not a human pass-rate claim.


This is the latest website handoff and supersedes historical page, directory, and deployment assumptions. This handoff did not deploy website code or rotate keys.

## Published: all pause behavior removed (2026-10-25 23:50 UTC)

Parent: `423d9f41-8557-4716-92d1-9b0035f63719`; entrance remains `51a33be8-6ca4-4b4f-886f-613bfea996b0`.
The page loads `app-v4.mjs`, removing pause/resume controls, Space/Escape pause and automatic focus/background
pause. Countdown/combat advance by real elapsed time, catching up on background/BFCache return. Touch dragging
and focus changes do not stop play. The user explicitly forbids pause; do not restore it from historical clients.
Rules remain v3 with two shields, 30 seconds and 16 jade.

[Acceptance](https://github.com/928886540/cloudflare_temp_email/actions/runs/40246534213) passed. Apex/www game
HTML and app-v4 match source and contain no pause/resume controls. A public 393x580 browser with a deterministic
start-API fixture validated continuous drag, repeated blur, Space/Escape and time-jump return after suspended
callbacks with no pause or script errors. That browser test mocks start and does not claim a new real reward
redemption; publication checks confirmed real original claims/models HTTP 200 and unchanged rewards. Engines,
keys, artwork and GAME_RUNS are unchanged; all six backend stage checks passed. See source evidence
`verification/no-pause-browser*.json` and `no-pause-public-source.json`.

## Pause removal: app-v4 client

Following mobile touch-drag complaints and an explicit request to remove rest, the new client removes pause/resume controls, Space/Escape pause, and focus/background auto-pause. Countdown and combat advance by real elapsed time. Returning from a hidden tab or BFCache catches up all elapsed frames; a new touch position affects only future frames. Rules remain v3: two shields, 30 seconds, 16 jade, and exit to choices. The page now loads `app-v4.mjs`; historical scripts remain available but are no longer referenced by the page.

## Current v3 release: two shields and character artwork (2026-10-25 17:05 UTC)

Parent: `168571b3-3eab-46c8-89f4-310b62491bf4`; entrance remains
`51a33be8-6ca4-4b4f-886f-613bfea996b0`. New runs have two shields, faster/more frequent
hazards and increased double swords. Browser/server share `engine-v3.mjs`; older runs
retain original replay. Duration stays 30 seconds with 16 jade and exit to choices.
Native image_gen refreshed all four adult-character posters with fuller figures, deeper
necklines and bare shoulders, published as homepage v6 / token v4 URLs.

[Acceptance](https://github.com/928886540/cloudflare_temp_email/actions/runs/40214794565) passed:
public starts confirm two shields; game/original rewards share the existing key, models
returns 200, and concurrent finishes return 409/409/200. All 21 resources, apex/www parity
and mobile browser checks passed. Keys, original assets and GAME_RUNS remain intact. See
source `verification/*v3.json` and `artwork-v6.json`; versions below are historical.

## V3 adjustment: two shields and refreshed star-night characters

Following real play feedback, v3 reduces shields to two and increases hazard speed and later double-sword probability. Duration remains 30 seconds with 16 jade. Browser/server share `engine-v3.mjs`; the browser uses a fresh `app-v3.mjs` URL. In-flight v1/v2 runs retain their original replay. The same regular bot profile won 20% of 160 runs versus 52.5% previously; this is offline calibration only.

Native image_gen also refreshed all four adult-character posters with more exposed shoulders, a deeper neckline and a fuller figure, retaining night scenery, pose, hand anatomy and lettering. New assets are `home-hero-*-v6.webp` and `free-token/welcome-*-v4.webp`; choice backgrounds use `choose-v2.css`. Original artwork and older game scripts remain available.

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
