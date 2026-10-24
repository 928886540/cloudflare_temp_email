import landing from './landing.js';
import mobile from '../assets/welcome-mobile-v1.webp';
import desktop from '../assets/welcome-desktop-v1.webp';
import homeMobile from '../assets/home-hero-mobile-v4.webp';
import homeDesktop from '../assets/home-hero-desktop-v4.webp';
import homeScene from './home-scene.js';
import { renderHomepage } from './homepage.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const read = request.method === 'GET' || request.method === 'HEAD';
    if (read && (url.pathname === '/' || url.pathname === '/index.html')) {
      const response = await env.SITE.fetch(request);
      if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response;
      return renderHomepage(response);
    }
    if (read && url.pathname === '/home-scene-v4.js') {
      return new Response(request.method === 'HEAD' ? null : homeScene, { headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      } });
    }
    const image = url.pathname === '/free-token/welcome-mobile-v1.webp' ? mobile
      : url.pathname === '/free-token/welcome-desktop-v1.webp' ? desktop
      : url.pathname === '/home-hero-mobile-v4.webp' ? homeMobile
      : url.pathname === '/home-hero-desktop-v4.webp' ? homeDesktop : null;
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
