const safeNumber = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const iso = value => { const n = typeof value === 'number' ? (value < 1e12 ? value * 1000 : value) : Date.parse(value || ''); return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null; };
const PLANS = new Set(['free', 'plus', 'pro', 'team', 'business', 'enterprise', 'max', 'ultra']);
const plan = value => PLANS.has(String(value).toLowerCase()) ? String(value).toLowerCase() : null;

function window(label, used, reset, seconds) {
  used = safeNumber(used);
  if (used === null || used > 100) return null;
  return { label, remaining: Math.round((100-used)*10)/10, reset_at: iso(reset), seconds: safeNumber(seconds) };
}
const labelFor = (seconds, fallback) => seconds === 18000 ? '5 小时限额' : seconds === 604800 ? '周限额' : fallback;

export function passiveQuota(file, now = Date.now()) {
  const signals = Object.fromEntries(Object.entries(file.quota?.signals || {}).map(([k,v])=>[k.toLowerCase(),v]));
  const observed = iso(file.quota?.observed_at);
  const windows = ['primary','secondary'].map((key,index) => {
    const minutes = safeNumber(signals[`x-codex-${key}-window-minutes`]);
    const seconds = minutes === null ? null : minutes*60;
    let reset = safeNumber(signals[`x-codex-${key}-reset-at`]);
    const after = safeNumber(signals[`x-codex-${key}-reset-after-seconds`]);
    if (reset === null && after !== null && observed) reset = Date.parse(observed)+after*1000;
    return window(labelFor(seconds,index ? '周限额' : '5 小时限额'),signals[`x-codex-${key}-used-percent`],reset,seconds);
  }).filter(Boolean);
  return {
    plan: plan(signals['x-codex-plan-type'] || file.id_token?.plan_type),
    renew_at: iso(file.id_token?.chatgpt_subscription_active_until),
    credits: safeNumber(signals['x-codex-credits-balance']),
    windows, observed_at: observed, source: windows.length ? 'observed' : 'unobserved',
    supported: Boolean(quotaProbe(file)), next_refresh_at: null,
    primary_remaining: windows[0]?.remaining ?? null, secondary_remaining: windows[1]?.remaining ?? null,
  };
}

// Browser input can select only an opaque account ID. Neither the target URL,
// auth index, headers nor upstream request body can be supplied by a visitor.
export function quotaProbe(file) {
  const provider = String(file.provider || file.type || '').toLowerCase();
  if (!file.auth_index) return null;
  const header = { Authorization: 'Bearer $TOKEN$', Accept: 'application/json' };
  if (provider === 'codex') {
    if (file.id_token?.chatgpt_account_id) header['Chatgpt-Account-Id'] = file.id_token.chatgpt_account_id;
    return { auth_index: file.auth_index, method:'GET', url:'https://chatgpt.com/backend-api/wham/usage', header };
  }
  if (['claude','anthropic'].includes(provider)) {
    header['anthropic-beta']='oauth-2025-04-20';header['anthropic-version']='2023-06-01';
    return { auth_index:file.auth_index, method:'GET', url:'https://api.anthropic.com/api/oauth/usage', header };
  }
  if (provider === 'antigravity' && typeof file.project_id === 'string' && file.project_id.length <= 256) {
    header['Content-Type']='application/json';
    return { auth_index:file.auth_index, method:'POST', url:'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels', header, data:JSON.stringify({project:file.project_id}) };
  }
  return null;
}

export function parseQuota(provider, body, now = Date.now()) {
  let windows = [], type = null;
  if (provider === 'codex') {
    type = plan(body.plan_type);
    windows = ['primary_window','secondary_window'].map((key,index) => {
      const item=body.rate_limit?.[key];if(!item)return null;
      const seconds=safeNumber(item.limit_window_seconds);
      return window(labelFor(seconds,index?'周限额':'5 小时限额'),item.used_percent,item.reset_at ?? (safeNumber(item.reset_after_seconds)!==null?now+Number(item.reset_after_seconds)*1000:null),seconds);
    }).filter(Boolean);
  } else if (['claude','anthropic'].includes(provider)) {
    windows=[['five_hour','5 小时限额',18000],['seven_day','周限额',604800],['seven_day_sonnet','Sonnet 周限额',604800],['seven_day_opus','Opus 周限额',604800]].map(([key,label,seconds])=>window(label,body[key]?.utilization,body[key]?.resets_at,seconds)).filter(Boolean);
  } else if (provider === 'antigravity') {
    for(const [id,model] of Object.entries(body.models || {}).slice(0,100)) {
      const fraction=safeNumber(model?.quotaInfo?.remainingFraction);
      if(fraction===null||fraction>1||!/^[-\w. :/]{1,100}$/.test(id))continue;
      windows.push(window(id,(1-fraction)*100,model.quotaInfo.resetTime,null));
    }
  }
  if (!windows.length) throw new Error('QUOTA_NO_DATA');
  return {plan:type,credits:safeNumber(body.credits?.balance),unlimited:body.credits?.unlimited===true,windows:windows.slice(0,24),observed_at:new Date(now).toISOString(),source:'live',supported:true,primary_remaining:windows[0]?.remaining??null,secondary_remaining:windows[1]?.remaining??null};
}
