# Free Token entrance

The entrance at https://leonmingod.com/free-token/ shows two separately generated adaptations of the supplied Free Token poster. The mobile image is 941 × 1672; the desktop image is 1824 × 862. Both have the same content as the supplied poster. Desktop selection follows the existing homepage: minimum width 768px and landscape orientation.

The entry button opens `/free-token/claim/`, which forwards to the original static claim page. The existing claim API, static website assets, and `FREE_TOKEN_CPA_KEY` secret remain in Cloudflare. No runtime credential values are stored in this directory.

`src/site-original.js` is a backup of the original `leonmingod-home` Worker downloaded before this change; it is not deployed. The separate `leonmingod-free-token` Worker serves the new entrance and images, and forwards the original claim page and static dependencies to `leonmingod-home` through a service binding. Only the `/free-token` and `/free-token/*` routes on the root and www hostnames are added. The original Worker, its assets, claim API, and secret bindings remain unchanged. Failed verification removes the newly created routes and Worker.

Deployment uses GitHub Actions with the repository's existing `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secrets. The dedicated `codex/free-token-home-20261024` branch isolates this website update from email application deployment. The initial installer refuses to overwrite an existing entrance Worker or route; subsequent deployments require reviewing the existing dedicated Worker and adjusting that guard.
