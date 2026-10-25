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

The game uses native image_gen raster art, optimized as WebP. The shared v2 engine drives browser play and server replay; v1 runs remain replayable during their existing three-minute credential lifetime. Offline simulated win rates are calibration evidence, not measured human pass rates.

Production release: parent `f9576720-5c7f-4909-a685-5e145fc25001`, forwarder `51a33be8-6ca4-4b4f-886f-613bfea996b0`. Its unchanged forwarding code now binds `SITE` to the parent's named `Site` entrypoint so existing HTML reaches the current handler before the retained asset set. Preserve this binding and the more specific routes. New root-level resources should use versioned URLs. Acceptance evidence lives in `verification/`.
