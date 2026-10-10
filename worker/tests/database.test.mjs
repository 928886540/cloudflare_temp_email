import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');

async function fixture(t) {
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: 'database-regression',
    modules: true,
    scriptPath: fileURLToPath(new URL('../dist_worker.js', import.meta.url)),
    compatibilityDate: '2025-04-01',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: ['DB'],
    bindings: {
      JWT_SECRET: 'local-database-regression-secret',
      ADMIN_PASSWORDS: ['local-admin-test'],
      DOMAINS: ['example.com'], DEFAULT_DOMAINS: ['example.com'],
      ENABLE_USER_CREATE_EMAIL: true,
      ENABLE_CREATE_ADDRESS_SUBDOMAIN_MATCH: true,
      RANDOM_SUBDOMAIN_DOMAINS: ['example.com'],
    },
  }));
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('DB');
  const request = (path, body, headers = { 'x-admin-auth': 'local-admin-test' }) =>
    mf.dispatchFetch(`http://localhost${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const json = async (path, body, headers) => {
    const response = await request(path, body, headers);
    const text = await response.text();
    assert.equal(response.status, 200, `${path}: ${text}`);
    return JSON.parse(text);
  };
  return { db, request, json };
}

test('empty database initializes and admin plan persists behind authentication', async t => {
  const { json, request } = await fixture(t);
  const empty = await json('/admin/db_version');
  assert.equal(empty.need_initialization, true);
  assert.equal(empty.need_migration, false);
  assert.equal((await request('/admin/db_initialize', {}, {})).status, 401);
  await json('/admin/db_initialize', {});
  const ready = await json('/admin/db_version');
  assert.equal(ready.current_db_version, ready.code_db_version);
  assert.equal(ready.need_initialization, false);
  assert.equal(ready.need_migration, false);
  assert.ok(ready.database_size > 0);
  assert.equal((await request('/admin/config/d1_storage_plan', undefined, {})).status, 401);
  assert.equal((await json('/admin/config/d1_storage_plan')).value, null);
  await json('/admin/config', { key: 'd1_storage_plan', value: 'free' });
  assert.equal((await json('/admin/config/d1_storage_plan')).value, 'free');
});

test('unversioned legacy database migrates repeatedly while preserving records', async t => {
  const { db, json } = await fixture(t);
  await db.batch([
    db.prepare('CREATE TABLE address (id INTEGER PRIMARY KEY, name TEXT UNIQUE, created_at DATETIME, updated_at DATETIME)'),
    db.prepare('CREATE TABLE raw_mails (id INTEGER PRIMARY KEY, message_id TEXT, source TEXT, address TEXT, raw TEXT, created_at DATETIME)'),
    db.prepare("INSERT INTO address VALUES (1, 'kept@example.com', '2026-01-01', '2026-01-01')"),
    db.prepare("INSERT INTO raw_mails VALUES (1, 'old-message', 'sender@example.org', 'kept@example.com', 'retained mail', '2026-01-01')"),
  ]);
  const before = await json('/admin/db_version');
  assert.equal(before.need_initialization, false);
  assert.equal(before.need_migration, true);
  await json('/admin/db_migration', {});
  await db.prepare("INSERT INTO users (user_email, password) VALUES ('kept@example.org', 'retained-hash')").run();
  await db.prepare("DELETE FROM settings WHERE key = 'db_version'").run();
  assert.equal((await json('/admin/db_version')).need_migration, true);
  await json('/admin/db_migration', {});
  await json('/admin/db_initialize', {});
  assert.equal((await json('/admin/db_version')).need_migration, false);
  assert.equal(await db.prepare('SELECT name FROM address WHERE id = 1').first('name'), 'kept@example.com');
  assert.equal(await db.prepare('SELECT raw FROM raw_mails WHERE id = 1').first('raw'), 'retained mail');
  assert.equal(await db.prepare('SELECT password FROM users WHERE id = 1').first('password'), 'retained-hash');
  const columns = (await db.prepare('PRAGMA table_info(raw_mails)').all()).results.map(c => c.name);
  for (const column of ['raw_blob', 'metadata', 'is_unread']) assert.ok(columns.includes(column));
});

test('failed schema upgrade does not advance the version marker', async t => {
  const { db, json, request } = await fixture(t);
  await json('/admin/db_initialize', {});
  await db.prepare("UPDATE settings SET value = 'legacy' WHERE key = 'db_version'").run();
  await db.prepare('DROP TABLE sendbox').run();
  await db.prepare('CREATE TABLE sendbox (id INTEGER PRIMARY KEY)').run();
  assert.equal((await request('/admin/db_migration', {})).status, 500);
  assert.equal(await db.prepare("SELECT value FROM settings WHERE key = 'db_version'").first('value'), 'legacy');
});

test('rebuilt worker preserves subdomain creation and mailbox JWT access', async t => {
  const { json, request } = await fixture(t);
  await json('/admin/db_initialize', {});
  assert.deepEqual((await json('/open_api/settings')).randomSubdomainDomains, ['example.com']);
  for (const [index, domain] of ['example.com', 'team.example.com', 'deep.team.example.com'].entries()) {
    const mailbox = await json('/api/new_address', { name: `regression${index}`, domain });
    assert.equal(mailbox.address, `regression${index}@${domain}`);
    const headers = { Authorization: `Bearer ${mailbox.jwt}` };
    assert.equal((await json('/api/settings', undefined, headers)).address, mailbox.address);
    assert.equal((await request('/api/mails?limit=10&offset=0', undefined, headers)).status, 200);
  }
  for (const domain of ['badexample.com', 'example.com.attacker.test', 'a..example.com']) {
    assert.equal((await request('/api/new_address', { name: 'rejected', domain })).status, 400);
  }
  for (const path of ['/admin/statistics', '/admin/account_settings', '/admin/user_settings', '/admin/address?limit=10&offset=0', '/admin/mails?limit=10&offset=0']) {
    await json(path);
  }
});
