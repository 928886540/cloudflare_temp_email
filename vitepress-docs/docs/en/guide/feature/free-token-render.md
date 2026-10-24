# Free Token integration with Render

`https://leonmingod.com/api/free-token/claim` retains its existing confirmation request.
Successful responses return `baseUrl: https://cpa-dhke.onrender.com/v1` and the same client
key registered with Render CPA. The main Worker stores it as `FREE_TOKEN_RENDER_KEY`;
the original `FREE_TOKEN_CPA_KEY` remains in place. Homepage artwork, pill navigation,
the fullscreen Free Token layout, and token interactions are preserved.

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
