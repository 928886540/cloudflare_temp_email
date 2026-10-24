# Free Token entrance

The entrance at https://leonmingod.com/free-token/ shows two separately generated adaptations of the supplied Free Token poster. The mobile image is 941 × 1672; the desktop image is 1824 × 862. Both have the same content as the supplied poster. Desktop selection follows the existing homepage: minimum width 768px and landscape orientation.

The entry button opens `/free-token/claim/`, which forwards to the original static claim page. The existing claim API, static website assets, and `FREE_TOKEN_CPA_KEY` secret remain in Cloudflare. No runtime credential values are stored in this directory.

`src/site-original.js` is the original `leonmingod-home` Worker downloaded before this change. The new entrypoint delegates all existing behavior to that module. `deploy.py` retains the asset namespace and secret bindings, checks the expected live version before updating, and verifies both posters, the claim page, the main homepage, and the API's GET restriction. Failed verification restores the previous immutable version.

Deployment uses GitHub Actions with the repository's existing `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secrets. The dedicated `codex/free-token-home-20261024` branch isolates this website update from email application deployment. To make a subsequent deployment, review the current live Worker first and update `EXPECTED_VERSION` in `deploy.py` to that version.
