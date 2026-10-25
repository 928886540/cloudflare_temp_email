import routes from '../.generated/routes.mjs';

const decoded = new Map();
export function staticResponse(request) {
  const path = new URL(request.url).pathname;
  const asset = routes[path];
  if (!asset || !['GET', 'HEAD'].includes(request.method)) return null;
  if (!decoded.has(asset.file)) decoded.set(asset.file, Uint8Array.from(atob(asset.body), c => c.charCodeAt(0)));
  return new Response(request.method === 'HEAD' ? null : decoded.get(asset.file), {
    headers: {
      'Content-Type': asset.type,
      'Cache-Control': asset.type.startsWith('text/html') ? 'no-store' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
    },
  });
}
