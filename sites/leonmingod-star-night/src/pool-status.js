const ORIGIN = 'https://cpa-dhke.onrender.com';
const SNAPSHOT_KEY = 'public:pool-status:v1';
const FRESH_MS = 30000;
const PROVIDERS = new Set(['codex', 'antigravity', 'gemini', 'gemini-cli', 'claude', 'anthropic', 'aistudio', 'vertex', 'openai', 'qwen', 'iflow', 'kiro', 'copilot']);
const number = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const timestamp = value => { const time = Date.parse(value || ''); return Number.isFinite(time) && time > 0 ? time : 0; };
const safeModel = value => typeof value === 'string' && value.length <= 256 && value.trim() && !/[\u0000-\u001f\u007f@]/u.test(value);

export function accountState(file, now) {
  if (file.disabled || file.status === 'disabled') return 'disabled';
  const active = (Array.isArray(file.cooldowns) ? file.cooldowns : []).filter(item => timestamp(item.retry_at) > now);
  if (timestamp(file.next_retry_after) > now || active.some(item => item.scope !== 'model')) return 'cooldown';
  if (file.unavailable) return active.length ? 'cooldown' : 'error';
  if (file.status === 'error') return 'error';
  return file.status === 'active' || file.status === 'ready' ? 'ready' : 'unknown';
}

function observedQuota(quota) {
  const signals = Object.fromEntries(Object.entries(quota?.signals || {}).map(([key, value]) => [key.toLowerCase(), value]));
  const percent = name => {
    const value = signals[name];
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const used = Number(value);
    return value !== '' && Number.isFinite(used) && used >= 0 && used <= 100 ? Math.round((100 - used) * 10) / 10 : null;
  };
  return {
    primary_remaining: percent('x-codex-primary-used-percent'),
    secondary_remaining: percent('x-codex-secondary-used-percent'),
    observed_at: timestamp(quota?.observed_at) ? new Date(timestamp(quota.observed_at)).toISOString() : null,
  };
}

export async function summarizePool(files, inventory, secret, now = Date.now()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const accounts = [], modelMap = new Map(), providers = new Map();
  const counts = () => ({ total: 0, ready: 0, cooldown: 0, disabled: 0, error: 0, unknown: 0 });
  const totals = counts();let successful = 0, failed = 0;
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const rawProvider = String(file.provider || file.type || '').toLowerCase();
    const provider = PROVIDERS.has(rawProvider) ? rawProvider : 'other';
    const state = accountState(file, now);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`pool-account-v1\n${file.id || file.name || index}`));
    const id = Array.from(new Uint8Array(signature).slice(0, 4), byte => byte.toString(16).padStart(2, '0')).join('');
    const cooldowns = (Array.isArray(file.cooldowns) ? file.cooldowns : []).filter(item => timestamp(item.retry_at) > now);
    const retry = Math.max(timestamp(file.next_retry_after), ...cooldowns.map(item => timestamp(item.retry_at)), 0);
    const models = inventory[index];
    accounts.push({ id, provider, state, models: Array.isArray(models) ? models.length : null,
      cooldown_models: cooldowns.filter(item => item.scope === 'model').length,
      retry_at: retry ? new Date(retry).toISOString() : null, quota: observedQuota(file.quota) });
    totals.total++;totals[state]++;
    if (!providers.has(provider)) providers.set(provider, { provider, ...counts() });
    providers.get(provider).total++;providers.get(provider)[state]++;
    successful += number(file.success);failed += number(file.failed);
    if (!Array.isArray(models)) continue;
    for (const model of new Set(models.filter(safeModel))) {
      if (!modelMap.has(model)) modelMap.set(model, { id: model, ...counts(), providers: new Set(), retry_at: null });
      const row = modelMap.get(model);
      const blocked = cooldowns.find(item => item.scope === 'model' && item.model_key === model);
      const modelState = state === 'ready' && blocked ? 'cooldown' : state;
      row.total++;row[modelState]++;row.providers.add(provider);
      if (blocked && (!row.retry_at || timestamp(blocked.retry_at) < timestamp(row.retry_at))) row.retry_at = new Date(timestamp(blocked.retry_at)).toISOString();
    }
  }
  const partial = inventory.some(value => !Array.isArray(value));
  return { schema: 1, updated_at: new Date(now).toISOString(), stale: false, totals, successful, failed,
    models_partial: partial, providers: [...providers.values()].sort((a, b) => b.total - a.total),
    models: [...modelMap.values()].map(row => ({ ...row, providers: [...row.providers] })).sort((a, b) => a.id.localeCompare(b.id)),
    accounts: accounts.sort((a, b) => a.provider.localeCompare(b.provider) || a.id.localeCompare(b.id)) };
}

async function management(path, secret, fetcher, signal) {
  const response = await fetcher(`${ORIGIN}/v8/management/${path}`, {
    method: 'GET', headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json' },
    redirect: 'error', signal,
  });
  if (!response.ok) throw new Error('CPA status unavailable');
  const reader = response.body.getReader();
  const chunks = [];let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 4 * 1024 * 1024) { await reader.cancel();throw new Error('CPA status too large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset);offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handlePoolStatus(request, env, { fetcher = globalThis.fetch, now = Date.now() } = {}) {
  const reply = (status, body) => new Response(request.method === 'HEAD' ? null : JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(status === 405 ? { Allow: 'GET, HEAD' } : {}) },
  });
  if (!['GET', 'HEAD'].includes(request.method)) return reply(405, { error: 'Method not allowed' });
  if (!env.CPA_STATUS_MANAGEMENT_KEY || !env.FREE_TOKEN_OPS_SECRET || !env.KV) return reply(503, { error: '号池状态正在连接，请稍后刷新。' });
  let saved;
  try { saved = await env.KV.get(SNAPSHOT_KEY, 'json'); } catch {}
  if (saved?.schema === 1 && now - timestamp(saved.updated_at) >= 0 && now - timestamp(saved.updated_at) < FRESH_MS) return reply(200, saved);
  try {
    const signal = AbortSignal.timeout(15000);
    const body = await management('credentials', env.CPA_STATUS_MANAGEMENT_KEY, fetcher, signal);
    if (!Array.isArray(body.files)) throw new Error('Invalid status');
    const files = body.files.slice(0, 500), inventory = new Array(files.length).fill(null);
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(4, files.length) }, async () => {
      while (!signal.aborted && next < Math.min(24, files.length)) {
        const index = next++;
        if (typeof files[index].name !== 'string') continue;
        try {
          const result = await management(`credentials/models?name=${encodeURIComponent(files[index].name)}`, env.CPA_STATUS_MANAGEMENT_KEY, fetcher, signal);
          if (Array.isArray(result.models)) inventory[index] = result.models.map(item => item.id).filter(safeModel);
        } catch {}
      }
    }));
    const snapshot = await summarizePool(files, inventory, env.FREE_TOKEN_OPS_SECRET, now);
    try { await env.KV.put(SNAPSHOT_KEY, JSON.stringify(snapshot), { expirationTtl: 600 }); } catch {}
    return reply(200, snapshot);
  } catch {
    if (saved?.schema === 1 && now - timestamp(saved.updated_at) < 600000) return reply(200, { ...saved, stale: true });
    return reply(503, { error: 'CPA 暂未响应，稍后刷新即可。' });
  }
}
