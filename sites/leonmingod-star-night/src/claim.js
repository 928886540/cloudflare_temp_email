import { json, verifyHuman, rateLimit } from './security.js';
import { RESEND_COOLDOWN_MS, beginCode, cancelCode, completeClaim, importEncKey, normalizeEmail, readLeaderboard, sha256Hex } from './claim-store.js';
import { clearClaimGrant, issueClaimGrant, readClaimGrant } from './claim-grant.js';

const BASE_URL = 'https://cpa-dhke.onrender.com/v1';
const FROM_DEFAULT = 'noreply@leonmingod.com';

const reply = (status, body, extra = {}, carry = null) => {
  const headers = new Headers(carry || undefined);
  if (status === 405) headers.set('Allow', extra.allow || 'POST');
  if (body?.retry_after) headers.set('Retry-After', String(body.retry_after));
  return json(status, body, headers);
};

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
  const sender = from.includes('<') ? from : `LeonMinGod <${from}>`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: [email],
        subject: 'LeonMinGod 邮箱验证码',
        text: `你的验证码是：${code}\n\n验证码 10 分钟内有效。请勿转发或告诉他人。\n\n如果不是你本人操作，请忽略这封邮件。`,
        html: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>LeonMinGod 邮箱验证码</title></head><body style="margin:0;background:#07161b;color:#e8f2ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><div style="display:none;max-height:0;overflow:hidden">验证码 10 分钟内有效</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07161b"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#0c2428;border:1px solid #41685b;border-radius:16px"><tr><td style="padding:32px"><p style="margin:0 0 10px;color:#91bbaa;font-size:13px;letter-spacing:.12em">LEONMINGOD · FREE TOKEN</p><h1 style="margin:0 0 14px;color:#f2ead1;font-size:24px">邮箱验证码</h1><p style="margin:0 0 24px;color:#c6d8cf;font-size:16px;line-height:1.7">请在领取页面输入下面的六位验证码：</p><div style="padding:18px;text-align:center;background:#071a1e;border:1px solid #6aa584;border-radius:12px;color:#f4dda6;font:700 32px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.28em">${code}</div><p style="margin:20px 0 0;color:#a8beb4;font-size:14px;line-height:1.7">验证码 <strong style="color:#e8f2ea">10 分钟</strong>内有效，请勿转发或告诉他人。</p><p style="margin:12px 0 0;color:#78958a;font-size:12px;line-height:1.6">如果不是你本人操作，请忽略这封邮件。</p></td></tr></table></td></tr></table></body></html>`,
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
  if (!env.KEY_ENC_SECRET || !env.GAME_RUNS) return reply(503, { error: '领取暂时不可用，请稍后再试。' });
  const limited = await rateLimit(request, env, 'claim');
  if (limited) return limited;
  const headers = new Headers();
  const issued = await issueClaimGrant(request, env, 'oath');
  if (!issued) return reply(503, { error: '领取暂时不可用，请稍后再试。' });
  headers.append('Set-Cookie', issued.cookie);
  return json(200, { ok: true, next: 'email', expires_in: Math.floor((issued.grant.expires_at - Date.now()) / 1000) }, headers);
}

export async function handleClaimCode(request, env) {
  const denied = sameOrigin(request);
  if (denied) return denied;
  if (!env.KV || !env.RESEND_API_KEY || !env.GAME_RUNS) return reply(503, { error: '验证暂时不可用，请稍后再试。' });
  const verificationRequest = request.clone();
  const { body, error } = await readBody(request);
  if (error) return error;
  const grant = await readClaimGrant(verificationRequest, env);
  if (!grant) return reply(403, { error: '请先叫声义父，或完成御剑破阵。' });
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
    // Every reply after a passed human check carries the pass cookie, so the check is not asked again.
    const prepared = await beginCode(env.KV, { email, now: Date.now(), ipHash, code, grantId: grant.id });
    if (!prepared.ok) return reply(prepared.status, { error: prepared.error, retry_after: prepared.retry_after, ...(prepared.cooldown ? { cooldown: true } : {}) }, {}, headers);
    const sent = await sendCode(env, email, code);
    if (!sent.ok) {
      await cancelCode(env.KV, email);
      return reply(sent.status, { error: sent.error }, {}, headers);
    }
    return json(200, { sent: true, resend_after: RESEND_COOLDOWN_MS / 1000 }, headers);
  });
}

export async function handleClaimVerify(request, env) {
  const denied = sameOrigin(request);
  if (denied) return denied;
  if (!env.KV || !env.GAME_RUNS) return reply(503, { error: '验证暂时不可用，请稍后再试。' });
  const verificationRequest = request.clone();
  const { body, error } = await readBody(request);
  if (error) return error;
  const grant = await readClaimGrant(verificationRequest, env);
  if (!grant) return reply(403, { error: '领取资格已失效，请返回后重新进入领取流程。' });
  const email = normalizeEmail(body.email);
  if (!email) return reply(400, { error: '请填写有效的邮箱地址。' });
  if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return reply(400, { error: '请输入 6 位验证码。' });
  // No human check here: it guards sending (mail quota). Guessing is bounded by the
  // per-code attempt limit (MAX_ATTEMPTS, then a new human-checked send) and the rate limit.
  const limited = await rateLimit(verificationRequest, env, 'claim');
  if (limited) return limited;
  const encKey = await importEncKey(env.KEY_ENC_SECRET);
  if (!encKey) return reply(503, { error: '验证暂时不可用，请稍后再试。' });
  return withClaimLock(env, email, async () => {
    const result = await completeClaim(env.KV, { email, code: body.code, now: Date.now(), encKey, grantId: grant.id });
    if (!result.ok) {
      const { ok, status, apiKey, ...details } = result;
      return reply(status, details);
    }
    const headers = new Headers({ 'Set-Cookie': clearClaimGrant(request) });
    return json(200, { baseUrl: BASE_URL, apiKey: result.apiKey, label: 'LeonMinGod 专属 API Key', replaced: Boolean(result.replaced), existing: Boolean(result.existing) }, headers);
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
