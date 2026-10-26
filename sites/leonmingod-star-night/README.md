# LeonMinGod current star-night website

Recovered from the production Worker/source maps and public assets on 2026-10-25. This is the current cloud maintenance source, not a complete copy of the user's original Windows directory. See [WEBSITE_UPDATE_CN.md](WEBSITE_UPDATE_CN.md) for provenance, changes, verification, and deployment details.

```sh
npm ci
npm run build
npm test
npm run dev
```

Preview: http://localhost:8790. It uses an explicit dummy reward value, never a production API key.

Deploy through `.github/workflows/leonmingod-star-night.yaml`, staging before publication. Updated static files are bundled according to `release.json`; existing Cloudflare assets, secrets, the forwarding Worker/routes, and the GameRun namespace remain in place. Do not replace production assets with this recovered partial mirror or run the historical entrance deploy.

The game uses native image_gen raster art, optimized as WebP. The shared v8 engine with the live-v1 protocol drives 45-second, 24-jade, two-shield browser play and server replay. Rage begins at 19 collected jade (five remaining); at 24, pure survival continues to 45 seconds. Defeats show one of ten emoji/poetic taunts with a direct oath-claim link. Old v1-v6 reward protocols are retired: refresh and restart; the three-minute credential lifetime remains a run expiry, not an API key expiry. Offline simulated win rates are calibration evidence, not measured human pass rates.

Production release: parent `98a305ea-8544-45ec-809a-3c1f26ccaf5e`, forwarder `51a33be8-6ca4-4b4f-886f-613bfea996b0`. Its unchanged forwarding code now binds `SITE` to the parent's named `Site` entrypoint so existing HTML reaches the current handler before the retained asset set. Preserve this binding and the more specific routes. New root-level resources should use versioned URLs. Acceptance evidence lives in `verification/`.

The live page loads `app-v12.mjs`. Pause/resume controls, keyboard pause and automatic focus/background pause are removed by explicit user request. Advance combat/countdown by real elapsed time and settle hidden frames before accepting new input. Do not restore pause behavior from historical clients.

Fairness: v5 uses constant sword paths without ricochet and stable three-lane wall gaps protected from overlapping swords. Public instructions list only win conditions; do not reveal upcoming final-five mechanics.

Visual preference: do not render floating gap rectangles, dashed outlines or gap labels. The empty sword lanes provide the visual cue; actual corridor protection remains active.

Pickups use the sword tip/blade capsule while normal damage stays at the original body hitbox. The separate gold talisman grants five seconds of server-replayed invincibility, displayed with native-generated token/ring art and a HUD countdown. Gold does not count toward the jade goal.

Current issuance is OPEN: a new Yifu key (`a6bbe9c75913e4ec`, fingerprint only) is registered in Render and synchronized through `FREE_TOKEN_RENDER_KEY`, run `40290134078`. Exposed `69ba11c6809909d7` was revoked by run `40290264958`; all previously revoked keys remain revoked. Four Render keys exist: the new Yifu key, the two originals and the unrelated standalone Karl key, which must be preserved. Token clicks check no-store `/api/free-token/status`; closed shows “暂未开放”, open restores the original animated choice-page entry. Use existing add/publish or remove workflows to change state; never restore an old revoked key to reopen.

Security v7 requires server-verified Turnstile for game starts and oath claims, immutable timed input prefixes and fresh staged server entropy. A full trace submitted only at the end cannot win. See the root instructions and bilingual operations record for private signing setup, test boundaries, live verification and remaining live-automation/shared-key limits.

Client v10 isolates stale success/error responses across weak-network restarts. Targeted browser cases and 40 public source resources passed; see verification/security-v7-client-v10-release.json.

After successful Turnstile verification, the server issues a fixed two-hour HttpOnly/Secure signed browser pass shared across restarts, refreshes, oath claims and apex/www. It is not IP-bound, so mobile network changes do not force another challenge. Visits do not extend expiry; expired, cleared, tampered or browser-mismatched passes require verification again. The server checks the pass independently; raw Turnstile tokens remain single-use, and live gameplay, reward conditions, rate limits, closed-state handling and private operations probes remain enforced.

New runs use v8 / app-v12. Sword walls show a 0.4-second arrival glint before launch; protected corridor timing moves with the delay. No safety boxes, labels or mechanic spoilers. During the five-second ward, jade and gold use its radius-108 circular contact area. Red swords are removed authoritatively at ward contact and animate outward with gold sparks. Expiry restores ordinary sword-tip pickups/damage; another gold refreshes five seconds without stacking or healing.

Add capped pickup trails, near-miss sword glints/text and quiet optional audio with a remembered toggle. Defeat shows survived time, jade and remaining requirements before the original ten taunts and two exits. Effects are capped at 48, with no full-screen blur or new image downloads. Preserve 45 seconds, 24 jade, two shields, no pause, two-hour human passes and live-v1 server reward checks. In-flight v7 runs retain original physics; vulnerable v1–v6 reward paths remain retired.
