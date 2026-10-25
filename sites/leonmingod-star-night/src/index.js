import { handleGame } from './game.js';
import { staticResponse } from './static.js';
export { GameRun } from './game.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const page = staticResponse(request);
    if (page) return page;
    if (url.pathname === '/api/free-token/game/start' || url.pathname === '/api/free-token/game/finish') {
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
      if (origin && origin !== url.origin) return reply(403, { error: '请在本站领取。' });
      if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
        return reply(415, { error: '请求格式不正确，请刷新后重试。' });
      }
      let body;
      try { body = await request.json(); }
      catch { return reply(400, { error: '请求格式不正确，请刷新后重试。' }); }
      if (typeof body?.oath !== 'string' || body.oath.trim() !== '义父' || body.confirmed !== true) {
        return reply(400, { error: '请先输入「义父」，再完成二次确认。' });
      }
      if (!env.FREE_TOKEN_RENDER_KEY) return reply(503, { error: '见面礼正在准备，请稍后再来。' });
      return reply(200, {
        baseUrl: 'https://cpa-dhke.onrender.com/v1',
        apiKey: env.FREE_TOKEN_RENDER_KEY,
        label: 'Leon🌙 贵宾密钥',
      });
    }
    if (url.pathname === '/image' || url.pathname === '/img' || url.pathname === '/bg' || url.pathname === '/wallpaper.png') {
      const userAgent = request.headers.get('user-agent') || '';
      const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);
      url.pathname = isMobile ? '/home-hero-mobile-v5.webp' : '/home-hero-desktop-v5.webp';
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    return env.ASSETS.fetch(request);
  }
};
