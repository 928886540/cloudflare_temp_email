import landing from './landing.js';
import mobile from '../assets/welcome-mobile-v1.webp';
import desktop from '../assets/welcome-desktop-v1.webp';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const read = request.method === 'GET' || request.method === 'HEAD';
    if (read && (url.pathname === '/' || url.pathname === '/index.html')) {
      const response = await env.SITE.fetch(request);
      if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response;
      const updated = new HTMLRewriter()
        .on('nav.entry-actions', {
          element(element) {
            element.append('<a class="gift-link address-link" href="https://addr.leonmingod.com" aria-label="地址证明">地址证明 <span aria-hidden="true">↗</span></a>', { html: true });
          },
        })
        .on('head', {
          element(element) {
            element.append('<style id="homepage-navigation-layout">@media (max-width:767px),(orientation:portrait){.entry-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:min(100%,360px);gap:10px}.entry-actions>.enter{grid-column:1/-1;width:100%;justify-self:center}.entry-actions>.gift-link{white-space:nowrap;padding:0 14px}}</style>', { html: true });
          },
        })
        .transform(response);
      const headers = new Headers(updated.headers);
      headers.set('Cache-Control', 'no-cache');
      headers.delete('Content-Length');
      headers.delete('ETag');
      return new Response(updated.body, { status: updated.status, statusText: updated.statusText, headers });
    }
    const image = url.pathname === '/free-token/welcome-mobile-v1.webp' ? mobile
      : url.pathname === '/free-token/welcome-desktop-v1.webp' ? desktop : null;
    if (read && image) {
      return new Response(request.method === 'HEAD' ? null : image, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    if (read && ['/free-token', '/free-token/', '/free-token/index.html'].includes(url.pathname)) {
      return new Response(request.method === 'HEAD' ? null : landing, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'same-origin',
        },
      });
    }
    if (read && ['/free-token/claim', '/free-token/claim/'].includes(url.pathname)) {
      url.pathname = '/free-token/';
      return env.SITE.fetch(new Request(url, request));
    }
    return env.SITE.fetch(request);
  },
};
