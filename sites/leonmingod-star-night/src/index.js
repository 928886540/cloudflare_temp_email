import { WorkerEntrypoint } from 'cloudflare:workers';
import { handleGame } from './game.js';
import { securityConfig, verifyHuman, rateLimit } from './security.js';
import { staticResponse } from './static.js';
export { GameRun } from './game.js';

const site = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/free-token/security') return securityConfig(request, env);
    if (url.pathname === '/api/free-token/status') {
      const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
      if (!['GET', 'HEAD'].includes(request.method)) return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
      const open = Boolean(env.FREE_TOKEN_RENDER_KEY);
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({ open, message: open ? '' : '暂未开放' }), { headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
    }
    const page = staticResponse(request);
    if (page) return page;
    if (['/api/free-token/game/start', '/api/free-token/game/progress', '/api/free-token/game/finish'].includes(url.pathname)) {
      return handleGame(request, env);
    }
    if (url.pathname === '/api/free-token/claim') {
      const reply = (status, body) => Response.json(body, {
        status,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          ...(status === 405 ? { Allow: 'POST' } : {}),
        },
      });
      if (request.method !== 'POST') return reply(405, { error: '请通过领取页面确认后领取。' });
      const origin = request.headers.get('Origin');
      if (origin !== url.origin) return reply(403, { error: '请在本站领取。' });
      if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
        return reply(415, { error: '请求格式不正确，请刷新后重试。' });
      }
      const verificationRequest = request.clone();
      let body;
      try { const text = await request.text(); if (text.length > 4096) return reply(413, { error: '请求过长。' }); body = JSON.parse(text); }
      catch { return reply(400, { error: '请求格式不正确，请刷新后重试。' }); }
      if (typeof body?.oath !== 'string' || body.oath.trim() !== '义父' || body.confirmed !== true) {
        return reply(400, { error: '请先输入「义父」，再完成二次确认。' });
      }
      if (!env.FREE_TOKEN_RENDER_KEY) return reply(503, { error: '暂未开放，请稍后再来。' });
      const limited = await rateLimit(verificationRequest, env, 'claim'); if (limited) return limited;
      const denied = await verifyHuman(verificationRequest, env, body.humanToken, 'oath_claim'); if (denied) return denied;
      return reply(200, {
        baseUrl: 'https://cpa-dhke.onrender.com/v1',
        apiKey: env.FREE_TOKEN_RENDER_KEY,
        label: 'Leon🌙 贵宾密钥',
      });
    }
    if (url.pathname === '/image' || url.pathname === '/img' || url.pathname === '/bg' || url.pathname === '/wallpaper.png') {
      const userAgent = request.headers.get('user-agent') || '';
      const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);
      url.pathname = isMobile ? '/home-hero-mobile-v6.webp' : '/home-hero-desktop-v6.webp';
      const imageRequest = new Request(url.toString(), request);
      return staticResponse(imageRequest) || env.ASSETS.fetch(imageRequest);
    }
    return env.ASSETS.fetch(request);
  }
};

export default site;

// Service bindings target this entrypoint to invoke page handling before existing assets.
export class Site extends WorkerEntrypoint {
  fetch(request) { return site.fetch(request, this.env); }
}
