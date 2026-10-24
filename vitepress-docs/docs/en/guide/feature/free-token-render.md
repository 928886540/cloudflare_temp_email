# Free Token integration with Render

## Mobile fluid performance fix

Deployed at 2026-10-25 01:18 Asia/Shanghai. Code commit `89de9160c60e63f6a3c937d15e461dcd79155cfa`;
entrance version `2abf9c44-faf5-4f98-80fa-e383108cca07`, parent still `8aa85754-acf1-498e-91ad-78117e40f8e5`.
[Deployment and verification](https://github.com/928886540/cloudflare_temp_email/actions/runs/40115492703) passed.
Live entrance, claim HTML, and v2 scripts match the tested preview; the homepage matches its pre-deployment state.

Touch devices use dye resolution 256, simulation resolution 64, six pressure iterations,
a 30 FPS ceiling, and a pixel ratio cap of one. Lower-power devices use 192 / 48 / 4
with a 24 FPS ceiling. Mobile rendering pauses after 2.5 seconds idle and resumes on
touch; screen/keyboard resize bursts are debounced for 150ms. Mobile token and claim
card glows remain, while costly multilayer shadows, blur, and live backdrop blur are
removed. Desktop quality and hover effects remain.

The dedicated `/free-token/fluid-v2.js` engine is served from `assets/token-fluid-v2.txt`,
retaining its MIT license. It adds frame/pixel budgets and prevents the original engine
from overriding explicit mobile dye settings back to 512. Page control uses the new
`/free-token/effects-v2.js` URL; the homepage `/vendor/fluid.js` is unchanged.
Checks cover DPR=3 normal/low-power touch profiles, desktop, actual WebGL drawing
rate limits, idle pause, resize batching, token navigation, and confirmation inputs.
Browser emulation is not a physical-device measurement on the user's iPhone.

The fix preserves subsequent repository changes including four homepage links, branding,
centered claim cards, and exit behavior. It does not change Render configuration or keys.

`https://leonmingod.com/api/free-token/claim` retains its existing confirmation request.
Successful responses return `baseUrl: https://cpa-dhke.onrender.com/v1` and the same client
key registered with Render CPA. The main Worker stores it as `FREE_TOKEN_RENDER_KEY`;
the original `FREE_TOKEN_CPA_KEY` remains in place. Homepage artwork, pill navigation,
the fullscreen Free Token layout, and token interactions are preserved.

## Latest page deployment — 2026-10-24 05:23 UTC

The entrance and claim pages now share the homepage jade/gold fluid effects. Token
motion is approximately 7px with a stronger outline and breathing glow. Mobile claim
cards are capped at 340px with reduced artwork/form spacing. The confirmation button
ends around 511px in a 393×664 viewport and remains within the first viewport at 320×480.

| Item | Current page deployment |
| --- | --- |
| Page code commit | `60af1c18e1fcc1df18086c9210fe7e4a9ab6cca4`, website working branch |
| New entrance Worker version | `5e32ed4c-a405-4e69-872d-f88526cba7d9` |
| Entrance deployment ID | `1a433adb-05de-4fd9-bee1-00c6da262e19` |
| Parent Worker version | Still `8aa85754-acf1-498e-91ad-78117e40f8e5` |
| Deployment evidence | <https://github.com/928886540/cloudflare_temp_email/actions/runs/40066068773> |
| Render operations | None; URL, key, parent source, and homepage content preserved; issued key still returns models HTTP 200 with 50 models |

`src/token-scene.js` reuses `/vendor/fluid.js`. `src/claim.js` compacts the original
claim HTML through HTMLRewriter without rewriting its application confirmation, claim,
or copy flows. The new browser script `/free-token/effects-v1.js` uses immutable caching:
future script changes must also update its URL version. Effects do not intercept links,
forms, or dialogs; reduced motion, unavailable WebGL, hidden pages, and idle pauses are supported.

Chromium rendering checks covered 320×480, 375×548, 393×664, 430×740, and 1440×900,
plus landscape token alignment, navigation, input/confirmation/refusal/credential dialogs,
reduced motion, and WebGL fallback. Deployed content matches the tested preview excluding
Cloudflare's injected analytics script; all four original images were retained. The 05:08
integration version table below is historical. Consult this newer entrance snapshot and
read actual live versions again before future changes.

## Landscape homepage navigation update (completed)

After the page release, the user reported that the three homepage navigation links
are too small at the bottom in landscape and supplied a screenshot with three red circles.
Implemented and deployed as requested by user screenshot:

- Target the homepage `https://leonmingod.com/`, editing `src/homepage.js` on the website branch.
- Move the three links below the logo/slogan on the right, matching the marked circles.
  Approximate centers in the 1920×909 reference are `(61%,72%)`, `(70%,73%)`, and `(81%,74%)`.
  These are composition references, not fixed pixel coordinates.
- Use green circular buttons approximately matching the marked 130–150px diameters at that
  reference size, with readable icons/text. Preserve left-to-right order and destinations:
  mailbox, Free Token entrance, Address Proof.
- Increase other interface text appropriately, particularly effect controls and hints.
  Preserve the current background and fluid effects.
- Validate responsive landscape placement at 1920×909 and smaller phone landscape sizes,
  avoiding overlap and clipping; also regress portrait, token entrance, and claim pages.
- The user is opening a new session. Use both the annotated screenshot and this record,
  then implement, verify in an actual browser, and deploy.

## Configuration source

Render service `cpa` uses the private repository `928886540/cpa`, branch `main`, and
starts with `./CLIProxyAPI --config /etc/secrets/config.yaml`. A client key is appended
to `api-keys` (or the newer `access.api-keys`) in that Secret File. Other settings remain unchanged.

The `Connect Free Token to Render` GitHub Actions workflow uses repository secrets
`RENDER_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN`.
`RENDER_API_KEY` authorizes Render management; it must never be issued as a client key.

## Deployment and verification

Pushes run `inspect` only. Before manually choosing `connect`, review the current parent
and entrance Worker versions and Render commit, then update the script's version guards.
The script preserves existing client keys, encrypts a backup of configuration and login
files, appends a new key, and redeploys the existing build. Without a persistent disk,
it restores missing login files through CPA management, preserving disabled states.
The encrypted recovery backup is retained as an Actions artifact for two days. Its
private decryption key is kept separately in the execution workspace, outside version
control, and is not included in the Actions artifact.

Only after both new and existing keys pass `/v1/models` verification does the script
switch the claim URL and Secret reference in the parent Worker. It then verifies key
equality and compares page, image, and interaction script bytes. Failed verification
restores the previous parent version. The entrance Worker is not redeployed.

`sites/free-token-home/src/site-original.js` remains the original parent source backup.
The connection script reads, checks, and minimally edits the live source. Version guards
in the older entrance deployment script are not refreshed automatically; do not rerun it unchanged.

## Operations handoff — 2026-10-24

The integration is deployed and complete. Full acceptance at **2026-10-24 05:08 UTC**
confirmed the new claim URL, HTTP 200 from `/v1/models` with the issued key, and 50 models.
Both original client keys still worked; all eight login files were restored. Configuration
and environment variables were preserved, and pages, four images, and interaction scripts
passed byte comparisons. All versions and counts below are snapshots: read live state again
before making changes.

### Repositories and endpoints

| Purpose | Location |
| --- | --- |
| Homepage | `https://leonmingod.com/` |
| Free Token entrance | `https://leonmingod.com/free-token/` |
| Claim page | `https://leonmingod.com/free-token/claim/` |
| Claim API | `POST https://leonmingod.com/api/free-token/claim` |
| Issued API Base URL | `https://cpa-dhke.onrender.com/v1` |
| Website repository | `928886540/cloudflare_temp_email` |
| Website working branch | `codex/free-token-home-20261024` |
| Website code | `sites/free-token-home/` on the working branch |
| Integration script | `.github/scripts/free_token_render.py` on the working branch |
| Integration workflow | `.github/workflows/connect-render-free-token.yaml` on the working branch |
| Deployed integration commit | `e3d6320dcd65a9192cc705d4926aa4157e207893` |

This record and its root `AGENTS.md` index are saved on both default branch `main` and
the working branch. **Documentation on `main` does not mean the website branch has been
merged.** If a new session cannot find the website source, fetch and switch to the
working branch instead of recreating the site.

### Cloudflare

| Setting | Verified value |
| --- | --- |
| Parent Worker | `leonmingod-home`: original assets and claim API |
| Entrance Worker | `leonmingod-free-token`: homepage transformation and token entrance |
| Entrance service binding | `SITE` → `leonmingod-home` |
| Zone | `leonmingod.com`, ID `4f078f06b815a404337c3b5387c45275` |
| Post-cutover parent version | `8aa85754-acf1-498e-91ad-78117e40f8e5` |
| Entrance version, unchanged | `4fda0cc3-1bdd-4b31-a5e6-9012b933931b` |
| Pre-cutover parent version | `b3943206-85ca-4ca0-8617-951317245755` |
| Parent bindings | `ASSETS` (assets), `FREE_TOKEN_CPA_KEY`, `FREE_TOKEN_RENDER_KEY` (secret_text) |
| Active claim binding | `FREE_TOKEN_RENDER_KEY` |
| Post-cutover parent source SHA-256 | `1bfd639be2c04996d8e7fac80c2ab42e085acc5200f416b02a2904adc749562a` |

Entrance routes on the apex and www hosts cover `/`, `/index.html`, `/free-token`,
`/free-token/*`, both `home-hero-*-v4.webp` images, and `/home-scene-v4.js`. The original
parent serves the claim API. Treat these as separate deployment targets.

`src/site-original.js` is a **historical backup** containing the old URL and binding.
Never upload it directly over the production parent. The cutover changed only its two
`env.FREE_TOKEN_CPA_KEY` references and one old API URL; static assets were retained.
Use the actual live source and this record as the current production reference.

### Render

| Setting | Verified value |
| --- | --- |
| Workspace | User-selected `My Workspace`, `tea-d779tahr0fns73e1h3lg` |
| Service | `cpa`, `srv-d9c4kkvavr4c73ab3sfg` |
| Dashboard | `https://dashboard.render.com/web/srv-d9c4kkvavr4c73ab3sfg` |
| Connected repository | Private `https://github.com/928886540/cpa`, branch `main` |
| Public repository | `928886540/CLIProxyAPI` is not the connected deployment repository |
| Runtime | Docker, `./Dockerfile`, context `.` |
| Start command | `./CLIProxyAPI --config /etc/secrets/config.yaml` |
| Secret File | Filename `config.yaml`, runtime path `/etc/secrets/config.yaml` |
| Client keys | Root `api-keys` list; three keys: two originals plus the new client key |
| Management API | `/v8/management`; management and client keys serve different purposes |
| Environment variables | `MANAGEMENT_PASSWORD`, `MANAGEMENT_STATIC_PATH`; values unchanged |
| Code commit | `f9cee393e5360db6b47dd18d6c2747a2e6c6cbb7`, v8.0.22 |
| Successful deployment | `dep-dbe3q94s728c7392m8kg`; existing build, no code upgrade |
| Health check | `/healthz`, HTTP 200 |
| Region and plan | Singapore, free, one instance |
| Auto-deploy | Enabled; pushes to the private repository's `main` trigger deployment |
| Persistent disk | None; back up login files before redeploying and restore afterward |

The runtime config file is read-only. Persist configuration through the Render Secret
File instead of relying on management UI writes to that path. Avoid pushing operational
notes to private `cpa/main`: that repository automatically deploys to production.

### Secret locations and access

| Name | Location and purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Website repository Actions Secret; CF account selection |
| `CLOUDFLARE_API_TOKEN` | Website repository Actions Secret; verified CF management access |
| `RENDER_API_KEY` | Website repository Actions Secret; verified Render REST management access |
| `FREE_TOKEN_RENDER_KEY` | Parent CF Worker Secret; identical value appended to Render config and issued to users |
| `FREE_TOKEN_CPA_KEY` | Original parent CF Secret; retained, no longer used by claims |

Secrets settings: `https://github.com/928886540/cloudflare_temp_email/settings/secrets/actions`.
**Never write secret values to documentation, source, chat, or logs.** Repository
secrets do not become environment variables in a new chat workspace automatically.
A locally missing `RENDER_API_KEY` does not mean GitHub lacks it; use the existing Actions
channel instead of asking the user to create it again.

The Render tools available during this operation supported service reads, environment
variable updates, and deploys, but not Secret File reads/writes. Those operations used
the Render REST API through Actions at
`/v1/services/{serviceId}/secret-files/config.yaml` (`GET` or `PUT`). Single-file PUT accepts
`{"content": "complete updated file contents"}`. Read first, append the client key,
compare all unrelated configuration, and update only that file. Do not replace entire
environment-variable or Secret File collections.

### Procedure for the next change

1. Read this record and `AGENTS.md`; identify whether the change concerns the page,
   claim logic, or Render service. Switch to the website working branch.
2. Inspect current parent/entrance versions, live source, Render deployment, and Secret
   configuration before any mutation. On the working branch, the following runs a
   read-only inspection with sanitized output:

   ```bash
   gh workflow run connect-render-free-token.yaml \
     -R 928886540/cloudflare_temp_email \
     --ref codex/free-token-home-20261024 -f mode=inspect
   gh run list -R 928886540/cloudflare_temp_email \
     --workflow connect-render-free-token.yaml -L 3
   ```

3. Page changes use the entrance Worker deployment path. Preserve artwork, pill navigation,
   fullscreen cropping, and token interactions unless requested otherwise. Changes under
   `sites/free-token-home/**`, including README edits, trigger its workflow; review and
   refresh the entrance deployment guards before pushing such changes.
4. Claim changes must minimally edit freshly read parent source, preserving `ASSETS`
   and every Secret binding. Do not rerun the old `stage-render-free-token.yaml` task.
   `connect` is a completed **one-time migration**, with pre-cutover version and URL
   checks. It is not a routine redeployment command; updating only its version constants
   is insufficient. `inspect` remains available for read-only checks.
5. Before any Render redeploy, list/download every current login JSON and make a
   recoverable encrypted backup. Verify the existing configuration and keys before writing.
   Use a new backup key pair whose private key you hold. The checked-in public key belongs
   to this operation's workspace; a new session must not assume its private key is available.
6. Restore missing login files and disabled states after deployment. Verify original and
   new keys and confirm unrelated configuration and environment values were preserved.
7. Validate `/healthz` HTTP 200, the expected claim URL/key, and `/v1/models` HTTP 200
   with the issued key. Check confirmation validation, same-origin restrictions, GET 405,
   image hashes, navigation, fullscreen token markup, and interaction scripts.
8. Record new versions, commits, deploy IDs, and acceptance evidence. Guards must use
   freshly read and reviewed versions, not historical snapshots from this document.

The claim body remains JSON `{"oath":"义父","confirmed":true}`, with same-origin
`Origin: https://leonmingod.com` and `Cache-Control: no-store` responses. Do not print
the key returned by a claim test.

### Evidence and recovery

- Deployment and full acceptance: <https://github.com/928886540/cloudflare_temp_email/actions/runs/40065013859>
- Post-deployment read-only audit: <https://github.com/928886540/cloudflare_temp_email/actions/runs/40065097553>
- The deployment run retains `encrypted-render-integration-backup` for two days. It is
  not a permanent backup and does not contain its private decryption key. Make a fresh
  backup of current state before future operations.
- Parent rollback uses CF version deployments. Future changes should use their own
  immediate pre-deployment version as the rollback target. The pre-cutover `b394...`
  version issues the old domain; it is not a routine rollback target that retains Render.
- Eight login files and their disabled states were preserved in this operation. This
  does not make login storage persistent on the diskless Render service.
