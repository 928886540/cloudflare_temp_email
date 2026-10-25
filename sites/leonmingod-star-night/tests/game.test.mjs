import test from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare } from 'miniflare';
import { RULES, replay, validateTrace } from '../public/free-token/game/engine-v2.mjs';
import { verifyRun } from '../src/game.js';
import { play } from '../scripts/calibrate.mjs';

function winning(seed) {
  for (const reaction of [4,7,10,14]) for (const foresight of [20,30,45,60]) {
    const result=play(seed,reaction,foresight);
    if(result.state.won)return result;
  }
  return null;
}

test('server replay agrees with completed client actions and rejects malformed traces',()=>{
  const {state,trace}=winning(6849877);
  assert.deepEqual(replay(6849877,trace),{won:true,jade:state.jade,shields:state.shields,frames:1800});
  for(const invalid of [[],[[1,500]],[[0,500],[0,600]],[[0,1001]],[[0,NaN]],[[0,1.5]],[[0,500],[1800,100]]])assert.equal(validateTrace(invalid),false);
  assert.equal(replay(1,[[0,500]]).won,false);
});

test('session, expiry, elapsed time and duplicate checks protect rewards',()=>{
  const now=Date.now(), seed=6849877, trace=winning(seed).trace;
  const run={seed,rulesVersion:RULES.version,sessionHash:'browser-a',started:now-31000,expires:now+90000,claimed:false};
  const body={sessionHash:'browser-a',trace};
  assert.equal(verifyRun(run,body,now).status,200);
  assert.equal(verifyRun({...run,claimed:true},body,now).status,409);
  assert.equal(verifyRun(run,{...body,sessionHash:'browser-b'},now).status,403);
  assert.equal(verifyRun({...run,expires:now-1},body,now).status,410);
  assert.equal(verifyRun({...run,started:now-2000},body,now).status,400);
  assert.equal(verifyRun(run,{...body,trace:[[0,500]]},now).status,400);
});

test('legacy runs replay using their original v1 rules',async()=>{
  const {createGame,step}=await import('../public/free-token/game/engine.mjs');
  let fixture;
  for(let seed=1;seed<20&&!fixture;seed++){
    const state=createGame(seed),trace=[];let target=500,previous=-1;
    while(!state.done){const gem=state.objects.find(o=>o.type==='jade'&&o.y<850);if(gem)target=Math.round((gem.x-38)/644*1000);if(target!==previous){trace.push([state.frame,target]);previous=target;}step(state,target);}
    if(state.won)fixture={seed,trace};
  }
  assert.ok(fixture,'A valid legacy replay exists');
  const now=Date.now();assert.equal(verifyRun({seed:fixture.seed,sessionHash:'old',started:now-31000,expires:now+60000,claimed:false},{sessionHash:'old',trace:fixture.trace},now).status,200);
});

test('real Durable Object grants one reward for concurrent finish requests',async()=>{
  const mf=new Miniflare({modules:true,scriptPath:'dist/index.js',compatibilityDate:'2025-04-01',bindings:{FREE_TOKEN_RENDER_KEY:'test-reward-placeholder'},durableObjects:{GAME_RUNS:{className:'GameRun',useSQLite:true}},serviceBindings:{ASSETS:()=>new Response('Not found',{status:404})}});
  const origin='http://localhost';
  const send=(action,body,cookie,otherOrigin=origin)=>mf.dispatchFetch(origin+'/api/free-token/game/'+action,{method:'POST',headers:{'Content-Type':'application/json','Origin':otherOrigin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  try{
    assert.equal((await send('start',{},null,'https://elsewhere.example')).status,403);
    let run,trace,cookie;
    for(let i=0;i<5&&!trace;i++){
      const response=await send('start',{});assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
      cookie=response.headers.get('set-cookie').split(';')[0];run=await response.json();trace=winning(run.seed)?.trace;
    }
    assert.ok(trace,'A replayable successful run was found');assert.equal(run.rules.version,2);
    assert.equal((await send('finish',{id:run.id,trace},cookie)).status,400);
    assert.equal((await send('finish',{id:run.id,trace})).status,403);
    await new Promise(resolve=>setTimeout(resolve,29500));
    assert.equal((await send('finish',{id:run.id,trace:[[0,500]]},cookie)).status,400);
    const responses=await Promise.all(Array.from({length:6},()=>send('finish',{id:run.id,trace},cookie)));
    assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===409).length,5);
    const reward=await responses.find(r=>r.status===200).json();assert.equal(reward.apiKey,'test-reward-placeholder');assert.equal(reward.baseUrl,'https://cpa-dhke.onrender.com/v1');
  }finally{await mf.dispose();}
});
