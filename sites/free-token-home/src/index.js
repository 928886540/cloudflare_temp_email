import original from './site-original.js';
import landing from './landing.js';
import mobile from '../assets/welcome-mobile-v1.webp';
import desktop from '../assets/welcome-desktop-v1.webp';

export default {
  ...original,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const read = request.method === 'GET' || request.method === 'HEAD';
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
      return original.fetch(new Request(url, request), env, ctx);
    }
    return original.fetch(request, env, ctx);
  },
};
