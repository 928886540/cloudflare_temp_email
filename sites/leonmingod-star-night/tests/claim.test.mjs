import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';
import {
  CODE_TTL_MS, MAX_ATTEMPTS, beginCode, completeClaim, emailKey, escapeHtml, keyRecordKey,
  normalizeEmail, readLeaderboard, sha256Hex, validateUsername, writeKeyStats,
} from '../src/claim-store.js';

function memoryKv(clock = () => Date.now()) {
  const rows = new Map();
  return {
    async get(key) {
      const row = rows.get(key);
      if (!row) return null;
      if (row.exp && clock() >= row.exp) { rows.delete(key); return null; }
      return row.value;
    },
    async put(key, value, options = {}) {
      rows.set(key, { value: String(value), exp: options.expirationTtl ? clock() + options.expirationTtl * 1000 : 0 });
    },
    async delete(key) { rows.delete(key); },
    entries() { return [...rows]; },
  };
}

const issue = (kv, email, username, now, code = '123456') => beginCode(kv, { email, username, now, ipHash: 'ip', code });

test('username rules trim, limit length, drop controls and reject abuse', () => {
  assert.deepEqual(validateUsername('  星河 \n'), { ok: true, username: '星河' });
  assert.equal(validateUsername('a\u0000b\u0007').username, 'ab');
  assert.equal(validateUsername('').ok, false);
  assert.equal(validateUsername('x'.repeat(21)).ok, false);
  assert.equal(validateUsername('oh shit').ok, false);
  assert.equal(validateUsername('你好傻逼').ok, false);
  assert.equal(escapeHtml(`<b class="n">&`), '&lt;b class=&quot;n&quot;&gt;&amp;');
});

test('email normalization accepts a plain address and rejects junk', () => {
  assert.equal(normalizeEmail('  Ada@Example.COM '), 'ada@example.com');
  for (const bad of ['', 'ada', 'ada@', 'ada@example', 'a b@example.com', `${'a'.repeat(250)}@b.co`]) assert.equal(normalizeEmail(bad), null);
});

test('codes expire, lock after too many guesses and rotate after the resend cooldown', async () => {
  let now = 1_000_000;
  const kv = memoryKv(() => now);
  const email = 'ada@example.com';
  assert.equal((await issue(kv, email, 'Ada', now)).ok, true);
  assert.equal((await issue(kv, email, 'Ada', now + 1000)).status, 429);
  for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
    const wrong = await completeClaim(kv, { email, code: '000000', now });
    assert.equal(wrong.status, 400);
    assert.match(wrong.error, /不正确/);
  }
  assert.match((await completeClaim(kv, { email, code: '000000', now })).error, /用完/);
  assert.equal(await kv.get(`code:${email}`), null);
  now += 61_000;
  assert.equal((await issue(kv, email, 'Ada', now, '654321')).ok, true);
  assert.match((await completeClaim(kv, { email, code: '123456', now })).error, /不正确/);
  now += CODE_TTL_MS + 1;
  assert.match((await completeClaim(kv, { email, code: '654321', now })).error, /过期/);
});

test('one email mints one key, stores only hashes, and leaderboard orders scores without leaking identity', async () => {
  let now = 1_700_000_000_000;
  const kv = memoryKv(() => now);
  const first = async (email, name, code) => {
    assert.equal((await issue(kv, email, name, now, code)).ok, true);
    return completeClaim(kv, { email, code, now });
  };
  const ada = await first('ada@example.com', '<Ada>', '111111');
  now += 1000;
  const bo = await first('bo@example.com', 'Bo', '222222');
  assert.equal(ada.ok, true);
  assert.match(ada.apiKey, /^sk-lm-[A-Za-z0-9_-]{32,}$/);
  assert.equal((await issue(kv, 'ada@example.com', 'Ada', now, '333333')).status, 409);
  const stored = kv.entries().map(([, row]) => row.value).join('\n');
  assert.equal(stored.includes(ada.apiKey), false);
  assert.equal(stored.includes(bo.apiKey), false);
  assert.equal(stored.includes('111111'), false);
  const emailRecord = JSON.parse(await kv.get(emailKey('ada@example.com')));
  assert.equal(emailRecord.key_sha256, await sha256Hex(ada.apiKey));
  assert.equal(emailRecord.username, '<Ada>');
  assert.equal(Object.hasOwn(emailRecord, 'apiKey'), false);
  const keyRecord = JSON.parse(await kv.get(keyRecordKey(emailRecord.key_sha256)));
  assert.deepEqual(Object.keys(keyRecord).sort(), ['created_at', 'email', 'status', 'username']);
  assert.equal(keyRecord.status, 'active');
  let board = await readLeaderboard(kv);
  assert.deepEqual(board.entries.map(entry => entry.username), ['Bo', '<Ada>']);
  assert.deepEqual(board.entries.map(entry => entry.score), [0, 0]);
  assert.equal(JSON.stringify(board).includes('example.com'), false);
  assert.equal(JSON.stringify(board).includes(emailRecord.key_sha256), false);
  await writeKeyStats(kv, emailRecord.key_sha256, 5, new Date(now).toISOString());
  board = await readLeaderboard(kv);
  assert.deepEqual(board.entries, [{ username: '<Ada>', score: 5 }, { username: 'Bo', score: 0 }]);
  assert.equal(escapeHtml(board.entries[0].username), '&lt;Ada&gt;');
});

test('claim pages link to the game leaderboard and the homepage no longer names the illustration', async () => {
  const claim = await readFile('public/free-token/claim/index.html', 'utf8');
  const game = await readFile('public/free-token/game/index.html', 'utf8');
  const home = await readFile('public/index.html', 'utf8');
  const choose = await readFile('public/free-token/choose/index.html', 'utf8');
  assert.match(claim, /href="\/free-token\/game\/#leaderboard"/);
  assert.match(game, /id="leaderboard"/);
  assert.match(game, /textContent/);
  assert.doesNotMatch(game, /innerHTML/);
  assert.doesNotMatch(home, /home-hero|id="leaderboard"|wallpaper\.png/);
  assert.doesNotMatch(choose, /leaderboard|home-hero/);
});

test('worker issues one key by email and serves a public scoreboard', async () => {
  const mf = new Miniflare({
    modules: true, scriptPath: 'dist/index.js', compatibilityDate: '2025-04-01',
    bindings: { RESEND_API_KEY: 'test-resend-not-a-secret', CLAIM_MAIL_FROM: 'noreply@leonmingod.com', FREE_TOKEN_TURNSTILE_SECRET: 'turnstile', FREE_TOKEN_LOCAL_TEST: 'local-test-only' },
    kvNamespaces: { KV: 'claim-test' },
    durableObjects: { GAME_RUNS: { className: 'GameRun', useSQLite: true } },
    serviceBindings: { ASSETS: () => new Response('missing', { status: 404 }) },
    outboundService: async request => {
      assert.equal(request.url, 'https://api.resend.com/emails');
      assert.equal(request.headers.get('Authorization'), 'Bearer test-resend-not-a-secret');
      const message = await request.json();
      assert.equal(message.from, 'noreply@leonmingod.com');
      return Response.json({ id: 'email_test' });
    },
  });
  const origin = 'http://localhost';
  const headers = { Origin: origin, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' };
  const post = (path, body) => mf.dispatchFetch(origin + path, { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    const hero = await mf.dispatchFetch(origin + '/home-hero-desktop-v6.webp');
    assert.equal(hero.status, 404);
    assert.equal((await mf.dispatchFetch(origin + '/wallpaper.png')).status, 404);
    const legacy = await post('/api/free-token/claim', { oath: '义父', confirmed: true, humanToken: 'local-test' });
    assert.equal(legacy.status, 200);
    assert.equal((await legacy.json()).apiKey, undefined);
    const send = await post('/api/free-token/claim/code', { username: 'Ada', email: 'Ada@Example.com', humanToken: 'local-test' });
    assert.equal(send.status, 200);
    assert.equal((await send.json()).sent, true);
    const kv = await mf.getKVNamespace('KV');
    const pending = JSON.parse(await kv.get('code:ada@example.com'));
    assert.equal(typeof pending.code_sha256, 'string');
    assert.equal(pending.username, 'Ada');
    const code = '000000';
    // The mailed code is random. Replace the stored hash with a known code so verify stays offline from the mailbox.
    pending.code_sha256 = await sha256Hex('lmg-claim-code-v1\nada@example.com\n' + code);
    await kv.put('code:ada@example.com', JSON.stringify(pending));
    const verified = await post('/api/free-token/claim/verify', { email: 'ada@example.com', code, humanToken: 'local-test' });
    assert.equal(verified.status, 200);
    const reward = await verified.json();
    assert.match(reward.apiKey, /^sk-lm-/);
    assert.equal(reward.baseUrl, 'https://cpa-dhke.onrender.com/v1');
    const again = await post('/api/free-token/claim/code', { username: 'Ada', email: 'ada@example.com', humanToken: 'local-test' });
    assert.equal(again.status, 409);
    const board = await (await mf.dispatchFetch(origin + '/api/leaderboard', { headers: { 'Cache-Control': 'no-cache' } })).json();
    assert.deepEqual(board.entries, [{ username: 'Ada', score: 0 }]);
    assert.equal(JSON.stringify(board).includes('example.com'), false);
    assert.equal(JSON.stringify(board).includes(reward.apiKey), false);
    const listed = await kv.list();
    for (const key of listed.keys) {
      const value = await kv.get(key.name);
      assert.equal(value.includes(reward.apiKey), false);
      assert.equal(value.includes(code), false);
    }
  } finally { await mf.dispose(); }
});
