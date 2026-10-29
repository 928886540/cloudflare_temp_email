import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePool, accountState, handlePoolStatus } from '../src/pool-status.js';

const now = Date.parse('2026-10-29T12:00:00Z');
const later = new Date(now+60000).toISOString();
const files = [
  { id:'private-account@example.com', name:'oauth-private-account@example.com.json', email:'private-account@example.com', path:'/auths/private.json', status_message:'Bearer secret-credential', provider:'codex', status:'active', success:9, failed:1, cooldowns:[{scope:'model', model_key:'gpt-test', retry_at:later}], quota:{signals:{'X-Codex-Primary-Used-Percent':'31','Authorization':'secret-credential'},observed_at:new Date(now).toISOString()} },
  { id:'private-disabled',name:'disabled.json',provider:'antigravity',status:'disabled',disabled:true },
  { id:'private-cooling',name:'cooling.json',provider:'codex',status:'error',unavailable:true,next_retry_after:later },
];

test('pool summaries preserve per-model cooldowns and publish no email, filename, secret, path or upstream error text', async () => {
  const summary=await summarizePool(files,[['gpt-test','gpt-ready'],['gemini-test'],null],'local-secret',now);
  assert.equal(summary.totals.total,3);assert.equal(summary.totals.ready,1);assert.equal(summary.totals.cooldown,1);assert.equal(summary.totals.disabled,1);
  assert.equal(summary.models.find(row=>row.id==='gpt-test').cooldown,1);assert.equal(summary.models.find(row=>row.id==='gpt-ready').ready,1);
  assert.equal(summary.accounts.find(row=>row.provider==='codex'&&row.state==='ready').quota.primary_remaining,69);
  assert(summary.models_partial);assert.doesNotMatch(JSON.stringify(summary),/example\.com|oauth-private|private\.json|secret-credential|Authorization|Bearer|\/auths/);
  assert.equal(accountState({status:'active',cooldowns:files[0].cooldowns},now),'ready');
  assert.equal(accountState({status:'active',next_retry_after:later},now),'cooldown');
});

test('live pool reads are server authenticated, restricted to GET metadata, cached and fail without exposing management responses', async () => {
  const rows=new Map();let calls=0;
  const env={CPA_STATUS_MANAGEMENT_KEY:'management-test-placeholder',FREE_TOKEN_OPS_SECRET:'ops-test-placeholder',KV:{get:async key=>rows.get(key)||null,put:async(key,value)=>rows.set(key,JSON.parse(value))}};
  const fetcher=async(url,options)=>{calls++;assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer management-test-placeholder');assert(url.startsWith('https://cpa-dhke.onrender.com/v8/management/credentials'));assert(!url.includes('/download'));return Response.json(url.includes('/models?')?{models:[{id:'gpt-test'}]}:{files});};
  const request=new Request('https://leonmingod.com/api/pool-status');
  const first=await handlePoolStatus(request,env,{fetcher,now});assert.equal(first.status,200);assert.equal(calls,4);
  const text=await first.text();assert.doesNotMatch(text,/management-test-placeholder|example\.com|secret-credential/);
  await handlePoolStatus(request,env,{fetcher,now:now+1000});assert.equal(calls,4);
  const stale=await handlePoolStatus(request,env,{fetcher:async()=>new Response('secret upstream error',{status:401}),now:now+31000});assert.equal((await stale.json()).stale,true);
  assert.equal((await handlePoolStatus(request,{}, {fetcher})).status,503);
  assert.equal((await handlePoolStatus(new Request(request,{method:'POST'}),env,{fetcher})).status,405);
});
