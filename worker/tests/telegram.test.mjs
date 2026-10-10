import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = createRequire(require.resolve('wrangler/package.json'))('miniflare');

for (const [hasToken, hasKV] of [[false, false], [true, false], [false, true], [true, true]]) {
  test(`Telegram configuration: token=${hasToken}, KV=${hasKV}`, async t => {
    const token = 'local-only-token-never-sent';
    const mf = new Miniflare(convertV4MiniflareOptions({
      modules: true,
      scriptPath: fileURLToPath(new URL('../dist_worker.js', import.meta.url)),
      compatibilityDate: '2025-04-01', compatibilityFlags: ['nodejs_compat'],
      d1Databases: ['DB'], kvNamespaces: hasKV ? ['KV'] : [],
      bindings: { JWT_SECRET: 'local-test-secret', ADMIN_PASSWORDS: ['local-admin'],
        ...(hasToken ? { TELEGRAM_BOT_TOKEN: token } : {}) },
    }));
    t.after(() => mf.dispose());
    const request = (path, headers = { 'x-admin-auth': 'local-admin' }) =>
      mf.dispatchFetch(`http://localhost/admin/telegram/${path}`, { headers });
    assert.equal((await request('configuration', {})).status, 401);
    const response = await request('configuration');
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.ok(!body.includes(token));
    assert.deepEqual(JSON.parse(body), { hasToken, hasKV });
    assert.equal((await request('settings')).status, hasToken && hasKV ? 200 : 400);
  });
}
