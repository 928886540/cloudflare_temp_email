import { RULES, replay } from '../public/free-token/game/engine-v5.mjs';
import { replay as replayV4 } from '../public/free-token/game/engine-v4.mjs';
import * as engineV3 from '../public/free-token/game/engine-v3.mjs';
import { replay as replayV2 } from '../public/free-token/game/engine-v2.mjs';
import { replay as replayV1 } from '../public/free-token/game/engine.mjs';

export const MAX_AGE = 180000;
const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const json = (status, body, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });

async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function verifyRun(run, body, now) {
  if (!run || now > run.expires) return { status: 410, error: '这一局已过期，重新开局即可。' };
  if (body.sessionHash !== run.sessionHash) return { status: 403, error: '这一局与当前浏览器不匹配，请重新开局。' };
  if (run.claimed) return { status: 409, error: '这一局已经领取过奖励。' };
  const duration = (run.rulesVersion ?? 1) >= 4 ? RULES.frames / RULES.fps * 1000 : 30000;
  if (now - run.started < duration - 700) return { status: 400, error: `请完整完成 ${duration / 1000} 秒挑战后再领取。` };
  const replayRun = { 1: replayV1, 2: replayV2, 3: engineV3.replay, 4: replayV4, 5: replay }[run.rulesVersion ?? 1];
  const result = replayRun?.(run.seed, body.trace);
  if (!result?.won) return { status: 400, error: '尚未破阵成功，再挑战一次吧。' };
  return { status: 200, result };
}

export class GameRun {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    const body = await request.json();
    if (new URL(request.url).pathname === '/init') {
      const now = Date.now();
      const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
      const run = { seed, rulesVersion: RULES.version, sessionHash: body.sessionHash, started: now, expires: now + MAX_AGE, claimed: false };
      const created = await this.ctx.storage.transaction(async txn => {
        if (await txn.get('run')) return false;
        await txn.put('run', run);
        return true;
      });
      if (!created) return json(409, { error: '请重新开局。' });
      await this.ctx.storage.setAlarm(run.expires + 60000);
      return json(200, { seed, expires: run.expires, rules: RULES });
    }
    if (new URL(request.url).pathname !== '/finish') return json(404, { error: 'Not found' });
    return this.ctx.storage.transaction(async txn => {
      const run = await txn.get('run');
      const checked = verifyRun(run, body, Date.now());
      if (checked.status !== 200) return json(checked.status, { error: checked.error });
      await txn.put('run', { ...run, claimed: true });
      return json(200, checked.result);
    });
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
}

export async function handleGame(request, env) {
  const url = new URL(request.url);
  if (request.method !== 'POST') return json(405, { error: '请通过游戏页面发起挑战。' }, { Allow: 'POST' });
  if (request.headers.get('Origin') !== url.origin) return json(403, { error: '请在本站完成挑战。' });
  if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) return json(415, { error: '请求格式不正确。' });
  if (!env.FREE_TOKEN_RENDER_KEY || !env.GAME_RUNS) return json(503, { error: '奖励正在准备，请稍后再来。' });
  const text = await request.text();
  if (text.length > 50000) return json(413, { error: '操作记录过长，请重新挑战。' });
  let body;
  try { body = JSON.parse(text); } catch { return json(400, { error: '请求格式不正确。' }); }
  if (url.pathname.endsWith('/start')) {
    const id = crypto.randomUUID();
    const secret = crypto.randomUUID() + crypto.randomUUID();
    const response = await env.GAME_RUNS.get(env.GAME_RUNS.idFromName(id)).fetch('https://game.internal/init', {
      method: 'POST', body: JSON.stringify({ sessionHash: await hash(secret) }),
    });
    const challenge = await response.json();
    if (!response.ok) return json(response.status, challenge);
    return json(200, { id, ...challenge }, { 'Set-Cookie': `lmg_game=${secret}; HttpOnly; SameSite=Strict; Path=/api/free-token/game; Max-Age=180${url.protocol === 'https:' ? '; Secure' : ''}` });
  }
  if (!body || !ID.test(body.id || '')) return json(400, { error: '这一局的信息无效，请重新开局。' });
  const secret = request.headers.get('Cookie')?.match(/(?:^|;\s*)lmg_game=([a-f0-9-]{72})/)?.[1];
  if (!secret) return json(403, { error: '挑战凭证已失效，请重新开局。' });
  const response = await env.GAME_RUNS.get(env.GAME_RUNS.idFromName(body.id)).fetch('https://game.internal/finish', {
    method: 'POST', body: JSON.stringify({ sessionHash: await hash(secret), trace: body.trace }),
  });
  const result = await response.json();
  if (!response.ok) return json(response.status, result);
  return json(200, { ...result, baseUrl: 'https://cpa-dhke.onrender.com/v1', apiKey: env.FREE_TOKEN_RENDER_KEY, label: 'Leon🌙 破阵奖励' });
}
