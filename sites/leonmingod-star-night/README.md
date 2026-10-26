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

The game uses native image_gen raster art, optimized as WebP. The shared v5 engine drives 45-second, 24-jade, two-shield browser play and server replay. Rage begins at 19 collected jade (five remaining); at 24, pure survival continues to 45 seconds. Defeats show one of ten emoji/poetic taunts with a direct oath-claim link. v1/v2/v3/v4 runs remain replayable during their existing three-minute credential lifetime. Offline simulated win rates are calibration evidence, not measured human pass rates.

Production release: parent `190a247f-8f89-4437-b41d-137cf2760145`, forwarder `51a33be8-6ca4-4b4f-886f-613bfea996b0`. Its unchanged forwarding code now binds `SITE` to the parent's named `Site` entrypoint so existing HTML reaches the current handler before the retained asset set. Preserve this binding and the more specific routes. New root-level resources should use versioned URLs. Acceptance evidence lives in `verification/`.

The live page loads `app-v7.mjs`. Pause/resume controls, keyboard pause and automatic focus/background pause are removed by explicit user request. Advance combat/countdown by real elapsed time and settle hidden frames before accepting new input. Do not restore pause behavior from historical clients.

Fairness: v5 uses constant sword paths without ricochet and stable three-lane wall gaps protected from overlapping swords. Public instructions list only win conditions; do not reveal upcoming final-five mechanics.

Visual preference: do not render floating gap rectangles, dashed outlines or gap labels. The empty sword lanes provide the visual cue; actual corridor protection remains active.
