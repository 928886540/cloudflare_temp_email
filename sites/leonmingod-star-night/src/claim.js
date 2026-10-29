import { json, verifyHuman, rateLimit } from './security.js';
import { beginCode, cancelCode, completeClaim, normalizeEmail, readLeaderboard, sha256Hex, validateUsername } from './claim-store.js';

const BASE_URL = 'https://cpa-dhke.onrender.com/v1';
const FROM_DEFAULT = 'noreply@leonmingod.com';

const reply = (status, body, extra = {}) => json(status, body, {
  ...(status === 405 ? { Allow: extra.allow || 'POST' } : {}),
  ...(body?.retry_after ? { 'Retry-After': String(body.retry_after) } : {}),
});

async function readBody(request) {
  const text = await request.text();
  if (text.length > 4096) return { error: reply(413, { error: '请求过长。' }) };
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: reply(400, { error: '请求格式不正确，请刷新后重试。' }) };
    return { body, raw: text };
  } catch {
    return { error: reply(400, { error: '请求格式不正确，请刷新后重试。' }) };
  }
}

function sameOrigin(request) {
  const url = new URL(request.url);
  if (request.method !== 'POST') return reply(405, { error: '请通过领取页面继续。' });
  if (request.headers.get('Origin') !== url.origin) return reply(403, { error: '请在本站领取。' });
  if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) return reply(415, { error: '请求格式不正确，请刷新后重试。' });
  return null;
}

async function withClaimLock(env, email, run) {
  const token = crypto.randomUUID();
  const stub = env.GAME_RUNS.get(env.GAME_RUNS.idFromName(`claim:${email}`));
  const began = await stub.fetch('https://game.internal/mutex', { method: 'POST', body: JSON.stringify({ op: 'begin', token }) });
  if (!began.ok) return reply(429, { error: '操作有点频繁，稍后再来。', retry_after: 2 });
  try {
    return await run();
  } finally {
    await stub.fetch('https://game.internal/mutex', { method: 'POST', body: JSON.stringify({ op: 'end', token }) }).catch(() => {});
  }
}

async function sendCode(env, email, code) {
  const from = env.CLAIM_MAIL_FROM || FROM_DEFAULT;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Leon🌙 贵宾密钥验证码',
        text: `你的验证码是 ${code}，10 分钟内有效。如果不是你本人操作，请忽略这封邮件。`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, status: 503, error: '验证码暂时发不出去，请稍后再试。' };
    return { ok: true };
  } catch {
    return { ok: false, status: 503, error: '验证码暂时发不出去，请稍后再试。' };
  }
}

function sixDigit() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
}

export async function handleLegacyClaim(request, env) {
  const denied = sameOrigin(request);
  if (denied) return denied;
  const { body, error } = await readBody(request.clone());
  if (error) return error;
  if (typeof body.oath !== 'string' || body.oath.trim() !== '义父' || body.confirmed !== true) {
    return reply(400, { error: '请先输入「义父」，再完成二次确认。' });
  }
  const limited = await rateLimit(request, env, 'claim');
  if (limited) return limited;
  const headers = new Headers();
  const human = await verifyHuman(request, env, body.humanToken, 'oath_claim', headers);
  if (human) return human;
  return json(200, { ok: true, next: 'email' }, headers);
}

export async function handleClaimCode(request, env) {
  const denied = sameOrigin(request);
  if (denied) return denied;
  if (!env.KV || !env.RESEND_API_KEY || !env.GAME_RUNS) return reply(503, { error: '验证暂时不可用，请稍后再试。' });
  const verificationRequest = request.clone();
  const { body, error } = await readBody(request);
  if (error) return error;
  const username = validateUsername(body.username);
  if (!username.ok) return reply(400, { error: username.error });
  const email = normalizeEmail(body.email);
  if (!email) return reply(400, { error: '请填写有效的邮箱地址。' });
  const limited = await rateLimit(verificationRequest, env, 'claim');
  if (limited) return limited;
  const headers = new Headers();
  const human = await verifyHuman(verificationRequest, env, body.humanToken, 'claim_email', headers);
  if (human) return human;
  const ipHash = await sha256Hex(`ip\n${request.headers.get('CF-Connecting-IP') || 'local'}`);
  const code = sixDigit();
  return withClaimLock(env, email, async () => {
    const prepared = await beginCode(env.KV, { email, username: username.username, now: Date.now(), ipHash, code });
    if (!prepared.ok) return reply(prepared.status, { error: prepared.error, retry_after: prepared.retry_after });
    const sent = await sendCode(env, email, code);
    if (!sent.ok) {
      await cancelCode(env.KV, email);
      return reply(sent.status, { error: sent.error });
    }
    return json(200, { sent: true }, headers);
  });
}

export async function handleClaimVerify(request, env) {
  const denied = sameOrigin(request);
  if (denied) return denied;
  if (!env.KV || !env.GAME_RUNS) return reply(503, { error: '验证暂时不可用，请稍后再试。' });
  const verificationRequest = request.clone();
  const { body, error } = await readBody(request);
  if (error) return error;
  const email = normalizeEmail(body.email);
  if (!email) return reply(400, { error: '请填写有效的邮箱地址。' });
  if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return reply(400, { error: '请输入 6 位验证码。' });
  const limited = await rateLimit(verificationRequest, env, 'claim');
  if (limited) return limited;
  const headers = new Headers();
  const human = await verifyHuman(verificationRequest, env, body.humanToken, 'claim_verify', headers);
  if (human) return human;
  return withClaimLock(env, email, async () => {
    const result = await completeClaim(env.KV, { email, code: body.code, now: Date.now() });
    if (!result.ok) return reply(result.status, { error: result.error });
    return json(200, { baseUrl: BASE_URL, apiKey: result.apiKey, label: 'Leon🌙 贵宾密钥', username: result.username }, headers);
  });
}

export async function handleLeaderboard(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) return json(405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' });
  const board = env.KV ? await readLeaderboard(env.KV) : { updated_at: null, entries: [] };
  const headers = { 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff', 'Content-Type': 'application/json; charset=utf-8' };
  const payload = JSON.stringify({ updated_at: board.updated_at, entries: board.entries.map(({ username, score }) => ({ username, score })) });
  if (request.headers.get('Cache-Control') !== 'no-cache' && typeof caches !== 'undefined') {
    const cacheKey = new Request(new URL('/api/leaderboard', request.url), { method: 'GET' });
    const hit = await caches.default.match(cacheKey);
    if (hit) return hit;
    const response = new Response(request.method === 'HEAD' ? null : payload, { headers });
    await caches.default.put(cacheKey, response.clone());
    return response;
  }
  return new Response(request.method === 'HEAD' ? null : payload, { headers });
}
