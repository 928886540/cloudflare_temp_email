// Owner-authorized QA: signed probes bypass Turnstile only, never live game checks.
import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { RULES, createGame, step, installEntropy } from '../public/free-token/game/engine-v7.mjs';
import { planTarget } from './planner.mjs';
const origin=process.env.TEST_ORIGIN||'https://leonmingod.com';
const local=['localhost','127.0.0.1'].includes(new URL(origin).hostname);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const signing=local?'':createHmac('sha256',process.env.RENDER_API_KEY.trim()).update('leonmingod-ops-probe-v1').digest('hex');
async function api(action,body={},cookie='',signed=false){
  const path='/api/free-token/'+action,text=JSON.stringify(body),headers={'Content-Type':'application/json',Origin:origin,'User-Agent':'LeonMinGod-authorized-security-verification'};
  if(cookie)headers.Cookie=cookie;
  if(signed&&!local){const timestamp=String(Date.now());headers['X-LMG-Operation']=timestamp+':'+createHmac('sha256',signing).update(`${timestamp}\nPOST\n${path}\n${text}`).digest('hex');}
  const response=await fetch(origin+path,{method:'POST',headers,body:text});
  const data=await response.json();return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};
}
const result={protocol:'live-v1',owner_signed_QA_not_a_human_bypass_test:true,attempts:[]};
assert.equal((await api('claim',{oath:'义父',confirmed:true})).status,local?503:403);
assert.equal((await api('game/start',{})).status,local?503:403);
result.unsigned_direct_claim_and_start_rejected=true;
const startBody=local?{humanToken:'local-test'}:{};
const abandoned=await api('game/start',startBody,'',true);assert.equal(abandoned.status,200);
assert.equal(abandoned.data.rules.version,7);assert.equal(abandoned.data.protocol,'live-v1');assert.equal(abandoned.data.entropy,undefined);
const finishedEarly=await api('game/finish',{id:abandoned.data.id,receipt:abandoned.data.receipt,trace:[[0,500]]},abandoned.cookie);assert.equal(finishedEarly.status,400);
let won;
for(let attempt=0;attempt<4&&!won;attempt++){
  const initial=await api('game/start',startBody,'',true);assert.equal(initial.status,200);
  const run=initial.data,state=createGame(run.seed),trace=[];let committed=0,target=500,prior=-1,lastTarget=500,packets=0;
  const started=Date.now()+1800;
  async function progress(){
    if(state.frame<=committed)return;
    const frame=state.frame,entries=trace.filter(e=>e[0]>=committed&&e[0]<frame);
    if(entries[0]?.[0]!==committed)entries.unshift([committed,lastTarget]);
    const response=await api('game/progress',{id:run.id,receipt:run.receipt,frame,trace:entries},initial.cookie);
    assert.equal(response.status,200,`Progress failed: ${response.data.error||response.status}`);
    installEntropy(state,response.data.entropy);run.receipt=response.data.receipt;committed=frame;lastTarget=entries.at(-1)[1];packets++;
  }
  while(!state.done){
    const due=Math.min(RULES.frames,Math.floor((Date.now()-started)*60/1000));
    while(state.frame<due&&!state.done){
      if(state.frame%6===0)target=planTarget(state,{reaction:6,horizon:108});
      if(target!==prior){trace.push([state.frame,target]);prior=target;}
      step(state,target);
    }
    if(state.frame-committed>=60||state.won)await progress();
    if(!state.done)await sleep(15);
  }
  result.attempts.push({jade:state.jade,shields:state.shields,frames:state.frame,won:state.won,live_packets:packets});
  if(state.won){
    const rewards=await Promise.all(Array.from({length:3},()=>api('game/finish',{id:run.id,receipt:run.receipt},initial.cookie)));
    assert.equal(rewards.filter(r=>r.status===200).length,1);assert.equal(rewards.filter(r=>r.status===409).length,2);
    won=rewards.find(r=>r.status===200).data;result.concurrent_finish_statuses=rewards.map(r=>r.status);
  }
}
assert.ok(won,'Live QA did not find a winning attempt; no reward was fabricated');
const abandonedFinish=await api('game/finish',{id:abandoned.data.id,receipt:abandoned.data.receipt,trace:[[0,500]]},abandoned.cookie);assert.ok([400,410].includes(abandonedFinish.status));
const batch=await api('game/progress',{id:abandoned.data.id,receipt:abandoned.data.receipt,frame:2700,trace:[[0,500]]},abandoned.cookie);assert.ok([400,410].includes(batch.status));
result.wait_then_finish_and_single_batch_rejected=true;
const claim=await api('claim',{oath:'义父',confirmed:true,...(local?{humanToken:'local-test'}:{})},'',true);assert.equal(claim.status,200);assert.equal(claim.data.apiKey,won.apiKey);assert.equal(won.baseUrl,'https://cpa-dhke.onrender.com/v1');
result.same_reward=true;result.fingerprint=createHash('sha256').update(won.apiKey).digest('hex').slice(0,16);
if(!local){const response=await fetch(won.baseUrl+'/models',{headers:{Authorization:'Bearer '+won.apiKey}});assert.equal(response.status,200);result.models_http=200;result.model_count=(await response.json()).data.length;}
await writeFile('live-security-result.json',JSON.stringify(result,null,2)+'\n');console.log('LIVE_SECURITY_VERIFIED='+JSON.stringify(result));
