export const json = (status, body, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
export async function hash(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export function localTest(request, env) {
  return env.FREE_TOKEN_LOCAL_TEST === 'local-test-only' && ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname);
}
export async function operationProbe(request, env) {
  if (!env.FREE_TOKEN_OPS_SECRET) return false;
  const header = request.headers.get('X-LMG-Operation') || '';
  const match = header.match(/^(\d{13}):([a-f0-9]{64})$/);
  if (!match || Math.abs(Date.now() - Number(match[1])) > 30000) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.FREE_TOKEN_OPS_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = new Uint8Array(match[2].match(/../g).map(n => parseInt(n, 16)));
  const message = `${match[1]}\n${request.method}\n${new URL(request.url).pathname}\n${await request.clone().text()}`;
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(message));
}
export function securityConfig(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) return json(405, { error: 'Method not allowed' });
  return json(200, { siteKey: env.FREE_TOKEN_TURNSTILE_SITEKEY || '', local: localTest(request, env), required: true });
}
export async function verifyHuman(request, env, token, action) {
  if (localTest(request, env) && token === 'local-test') return null;
  if (await operationProbe(request, env)) return null;
  if (!env.FREE_TOKEN_TURNSTILE_SECRET) return json(503, { error: '验证暂时不可用，请稍后再试。' });
  if (typeof token !== 'string' || !token || token.length > 2048) return json(403, { error: '请先完成验证，再继续。' });
  try {
    const form = new URLSearchParams({ secret: env.FREE_TOKEN_TURNSTILE_SECRET, response: token });
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.set('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok || !data.success || data.hostname !== new URL(request.url).hostname || data.action !== action) return json(403, { error: '验证未通过，请重新验证。' });
  } catch { return json(503, { error: '验证连接不稳定，请稍后重试。' }); }
  return null;
}
export async function sessionIdentity(request) {
  return hash((request.headers.get('CF-Connecting-IP') || 'local') + '\n' + (request.headers.get('User-Agent') || ''));
}
export async function rateLimit(request, env, action) {
  if (localTest(request, env) || await operationProbe(request, env)) return null;
  const id = await sessionIdentity(request);
  const response = await env.GAME_RUNS.get(env.GAME_RUNS.idFromName('limit:' + id)).fetch('https://game.internal/limit', { method: 'POST', body: JSON.stringify({ action }) });
  return response.ok ? null : json(429, { error: '操作有点频繁，稍后再来。' }, { 'Retry-After': '60' });
}
