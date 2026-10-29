// KV records for one unique key per verified email. Plaintext keys are never stored.
export const CODE_TTL_SECONDS = 600;
export const CODE_TTL_MS = CODE_TTL_SECONDS * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60_000;
export const EMAIL_SENDS_PER_HOUR = 3;
export const EMAIL_SENDS_PER_DAY = 5;
export const IP_SENDS_PER_HOUR = 8;
export const IP_SENDS_PER_DAY = 20;
export const GLOBAL_SENDS_PER_DAY = 80;
export const LEADERBOARD_LIMIT = 20;
export const TOP_KEY = 'leaderboard:top';
export const INDEX_KEY = 'leaderboard:index';
export const PRIOR_LIMIT = 10;

const HOUR = 3_600_000;
const DAY = 86_400_000;
const BLOCKED = ['fuck', 'shit', 'bitch', 'nigger', 'faggot', '傻逼', '操你', '妈的', '去死'];

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return null;
  return email;
}

export function validateUsername(value) {
  if (typeof value !== 'string') return { ok: false, error: '请先写一个名字。' };
  const username = value.replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, '').trim();
  const length = [...username].length;
  if (length < 1 || length > 20) return { ok: false, error: '名字需要 1 到 20 个字。' };
  const folded = username.toLowerCase();
  if (BLOCKED.some(word => folded.includes(word))) return { ok: false, error: '这个名字不太合适，换一个吧。' };
  return { ok: true, username };
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function mintKey(bytes = crypto.getRandomValues(new Uint8Array(32))) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const body = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `sk-lm-${body}`;
}

export function emailKey(email) { return `email:${email}`; }
export function codeKey(email) { return `code:${email}`; }
export function keyRecordKey(hash) { return `key:${hash}`; }
export function statsKey(hash) { return `stats:${hash}`; }

const readJson = async (kv, key) => {
  const raw = await kv.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};
const dayStamp = now => new Date(now).toISOString().slice(0, 10);
const remainingTtl = (expiresAt, now) => Math.max(60, Math.ceil((expiresAt - now) / 1000));

function sortBoard(entries) {
  return [...entries].sort((a, b) => (b.score - a.score) || (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
}

async function hashScore(kv, keyHash) {
  const stats = await readJson(kv, statsKey(keyHash));
  const value = Number(stats?.requests ?? stats?.score ?? 0);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

// A person's score is the sum over their current key and the keys it replaced
// (prior_hashes), so re-claiming a key keeps their leaderboard standing.
async function scoreFor(kv, entry) {
  let total = await hashScore(kv, entry.key_sha256);
  for (const hash of priorsOf(entry)) total += await hashScore(kv, hash);
  return total;
}
const priorsOf = entry => (Array.isArray(entry?.prior_hashes) ? entry.prior_hashes : []).filter(hash => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)).slice(-PRIOR_LIMIT);
const indexRow = ({ username, key_sha256, created_at, prior_hashes }) => ({ username, key_sha256, created_at, ...(prior_hashes?.length ? { prior_hashes } : {}) });

async function throttle(kv, bucket, now, hourLimit, dayLimit) {
  const stamps = ((await readJson(kv, bucket)) || []).filter(stamp => now - stamp < DAY).sort((a, b) => a - b);
  const lastHour = stamps.filter(stamp => now - stamp < HOUR);
  if (lastHour.length >= hourLimit || stamps.length >= dayLimit) {
    // Wait until enough old sends age out of the window that is full.
    const waits = [];
    if (lastHour.length >= hourLimit) waits.push(lastHour[lastHour.length - hourLimit] + HOUR - now);
    if (stamps.length >= dayLimit) waits.push(stamps[stamps.length - dayLimit] + DAY - now);
    return { ok: false, retry_after: Math.max(1, Math.ceil(Math.max(...waits) / 1000)) };
  }
  stamps.push(now);
  await kv.put(bucket, JSON.stringify(stamps), { expirationTtl: 86_400 });
  return { ok: true };
}

async function globalThrottle(kv, now) {
  const current = await readJson(kv, 'throttle:resend-day');
  const day = dayStamp(now);
  const count = current?.day === day ? current.count : 0;
  if (count >= GLOBAL_SENDS_PER_DAY) return { ok: false, retry_after: Math.max(1, Math.ceil((Date.parse(`${day}T00:00:00Z`) + DAY - now) / 1000)) };
  await kv.put('throttle:resend-day', JSON.stringify({ day, count: count + 1 }), { expirationTtl: 172_800 });
  return { ok: true };
}

export async function beginCode(kv, { email, username, now, ipHash, code }) {
  // An email that already has a key may verify again to replace it (lost key recovery).
  const returning = Boolean(await kv.get(emailKey(email)));
  const existing = await readJson(kv, codeKey(email));
  if (existing && now < existing.sent_at + RESEND_COOLDOWN_MS && now < existing.expires_at) {
    return { ok: false, status: 429, cooldown: true, returning, error: '验证码已发送，请查收邮箱。', retry_after: Math.max(1, Math.ceil((existing.sent_at + RESEND_COOLDOWN_MS - now) / 1000)) };
  }
  for (const check of [
    () => throttle(kv, `throttle:mail:${email}`, now, EMAIL_SENDS_PER_HOUR, EMAIL_SENDS_PER_DAY),
    () => throttle(kv, `throttle:ip:${ipHash}`, now, IP_SENDS_PER_HOUR, IP_SENDS_PER_DAY),
    () => globalThrottle(kv, now),
  ]) {
    const result = await check();
    if (!result.ok) return { ok: false, status: 429, error: '验证码发送次数已达上限，请稍后再来。', retry_after: result.retry_after };
  }
  const expiresAt = now + CODE_TTL_MS;
  await kv.put(codeKey(email), JSON.stringify({
    code_sha256: await sha256Hex(`lmg-claim-code-v1\n${email}\n${code}`),
    attempts: 0,
    sent_at: now,
    expires_at: expiresAt,
    username,
  }), { expirationTtl: CODE_TTL_SECONDS });
  return { ok: true, returning };
}

export async function cancelCode(kv, email) {
  await kv.delete(codeKey(email));
}

export async function completeClaim(kv, { email, code, now }) {
  const pending = await readJson(kv, codeKey(email));
  if (!pending || now >= pending.expires_at) return { ok: false, status: 400, resend: true, error: '验证码已失效，请重新发送。' };
  const expected = await sha256Hex(`lmg-claim-code-v1\n${email}\n${code}`);
  if (pending.code_sha256 !== expected) {
    const attempts = pending.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await kv.delete(codeKey(email));
      return { ok: false, status: 400, resend: true, error: '验证次数用完了，请重新发送验证码。' };
    }
    await kv.put(codeKey(email), JSON.stringify({ ...pending, attempts }), { expirationTtl: remainingTtl(pending.expires_at, now) });
    return { ok: false, status: 400, wrong_code: true, attempts_left: MAX_ATTEMPTS - attempts, error: '验证码错误，请重新输入。' };
  }
  const previous = await readJson(kv, emailKey(email));
  const apiKey = mintKey();
  const keyHash = await sha256Hex(apiKey);
  const createdAt = new Date(now).toISOString();
  if (previous?.key_sha256) {
    // Replace: revoke the old key first so at most one key per email is ever active,
    // keep the original name, and carry the leaderboard entry over to the new hash.
    const username = previous.username;
    const oldHash = previous.key_sha256;
    const oldRecord = await readJson(kv, keyRecordKey(oldHash));
    if (oldRecord) await kv.put(keyRecordKey(oldHash), JSON.stringify({ ...oldRecord, status: 'revoked', revoked_at: createdAt, replaced_by: keyHash }));
    await kv.put(keyRecordKey(keyHash), JSON.stringify({ username, email, status: 'active', created_at: createdAt }));
    await kv.put(emailKey(email), JSON.stringify({ ...previous, key_sha256: keyHash, username, rotated_at: createdAt }));
    await replaceInBoard(kv, { username, oldHash, keyHash, createdAt: previous.created_at || createdAt, updatedAt: createdAt });
    await kv.delete(codeKey(email));
    return { ok: true, apiKey, username, replaced: true };
  }
  const username = pending.username;
  await kv.put(emailKey(email), JSON.stringify({ key_sha256: keyHash, username, created_at: createdAt }));
  await kv.put(keyRecordKey(keyHash), JSON.stringify({ username, email, status: 'active', created_at: createdAt }));
  await rememberClaim(kv, { username, keyHash, createdAt });
  await kv.delete(codeKey(email));
  return { ok: true, apiKey, username };
}

async function rememberClaim(kv, { username, keyHash, createdAt }) {
  const index = await readJson(kv, INDEX_KEY) || { entries: [] };
  index.entries = index.entries.filter(entry => entry.key_sha256 !== keyHash);
  index.entries.push({ username, key_sha256: keyHash, created_at: createdAt });
  await rebuild(kv, index.entries, createdAt);
}

async function replaceInBoard(kv, { username, oldHash, keyHash, createdAt, updatedAt }) {
  const index = await readJson(kv, INDEX_KEY) || { entries: [] };
  const old = index.entries.find(entry => entry.key_sha256 === oldHash);
  const prior_hashes = [...priorsOf(old), oldHash].slice(-PRIOR_LIMIT);
  index.entries = index.entries.filter(entry => entry.key_sha256 !== oldHash && entry.key_sha256 !== keyHash);
  index.entries.push({ username, key_sha256: keyHash, created_at: old?.created_at || createdAt, prior_hashes });
  await rebuild(kv, index.entries, updatedAt);
}

export async function writeKeyStats(kv, keyHash, requests, updatedAt) {
  const count = Number(requests);
  if (!/^[a-f0-9]{64}$/.test(keyHash) || !Number.isInteger(count) || count < 0) {
    throw new Error('stats require a key hash and a non-negative integer');
  }
  await kv.put(statsKey(keyHash), JSON.stringify({ requests: count, updated_at: updatedAt }));
  const index = await readJson(kv, INDEX_KEY);
  if (!index?.entries?.some(entry => entry.key_sha256 === keyHash)) return { updated: false };
  await rebuild(kv, index.entries, updatedAt);
  return { updated: true };
}

async function rebuild(kv, entries, updatedAt) {
  const ranked = [];
  for (const entry of entries) {
    ranked.push({ username: entry.username, key_sha256: entry.key_sha256, created_at: entry.created_at, prior_hashes: priorsOf(entry), score: await scoreFor(kv, entry) });
  }
  const kept = sortBoard(ranked).slice(0, LEADERBOARD_LIMIT);
  await kv.put(INDEX_KEY, JSON.stringify({ entries: kept.map(indexRow) }));
  await kv.put(TOP_KEY, JSON.stringify({ updated_at: updatedAt, entries: kept.map(({ username, score }) => ({ username, score })) }));
}

export async function readLeaderboard(kv) {
  const board = await readJson(kv, TOP_KEY);
  const index = await readJson(kv, INDEX_KEY);
  // Entries that replaced a key are scored here from per-hash stats (current + prior),
  // because the API guard ranks by the current hash only.
  if (Array.isArray(index?.entries) && index.entries.some(entry => priorsOf(entry).length)) {
    const ranked = [];
    for (const entry of index.entries.slice(0, LEADERBOARD_LIMIT)) {
      if (typeof entry?.key_sha256 !== 'string') continue;
      ranked.push({ username: String(entry.username || ''), created_at: String(entry.created_at || ''), score: await scoreFor(kv, entry) });
    }
    return { updated_at: board?.updated_at || null, entries: sortBoard(ranked).map(({ username, score }) => ({ username, score })) };
  }
  return {
    updated_at: board?.updated_at || null,
    entries: (board?.entries || []).map(entry => ({ username: String(entry.username || ''), score: Number(entry.score) || 0 })),
  };
}
