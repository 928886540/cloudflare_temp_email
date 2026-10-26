import test from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare } from 'miniflare';
import { RULES, replay, validateTrace, createGame, step } from '../public/free-token/game/engine-v4.mjs';
import { verifyRun } from '../src/game.js';
import { play } from '../scripts/calibrate.mjs';
import { playPlanned } from '../scripts/planner.mjs';

function winning(seed, engine) {
  if(!engine){for(const options of [{reaction:6,horizon:96},{reaction:4,horizon:120},{reaction:5,horizon:100}]){const result=playPlanned(seed,options);if(result.state.won)return result;}return null;}
  for (const reaction of [4,7,10,14]) for (const foresight of [20,30,45,60]) {
    const result=play(seed,reaction,foresight,engine);
    if(result.state.won)return result;
  }
  return null;
}

test('server replay agrees with completed client actions and rejects malformed traces',()=>{
  const {state,trace}=winning(27399508);
  assert.deepEqual(replay(27399508,trace),{won:true,jade:state.jade,shields:state.shields,frames:2700});
  for(const invalid of [[],[[1,500]],[[0,500],[0,600]],[[0,1001]],[[0,NaN]],[[0,1.5]],[[0,500],[2700,100]]])assert.equal(validateTrace(invalid),false);
  assert.equal(replay(1,[[0,500]]).won,false);
});

test('session, expiry, elapsed time and duplicate checks protect rewards',()=>{
  const now=Date.now(), seed=27399508, trace=winning(seed).trace;
  const run={seed,rulesVersion:RULES.version,sessionHash:'browser-a',started:now-46000,expires:now+90000,claimed:false};
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
    for(let i=0;i<12&&!trace;i++){
      const response=await send('start',{});assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
      cookie=response.headers.get('set-cookie').split(';')[0];run=await response.json();trace=winning(run.seed)?.trace;
    }
    assert.ok(trace,'A replayable successful run was found');assert.equal(run.rules.version,4);assert.equal(run.rules.shields,2);
    assert.equal((await send('finish',{id:run.id,trace},cookie)).status,400);
    assert.equal((await send('finish',{id:run.id,trace})).status,403);
    await new Promise(resolve=>setTimeout(resolve,44500));
    assert.equal((await send('finish',{id:run.id,trace:[[0,500]]},cookie)).status,400);
    const responses=await Promise.all(Array.from({length:6},()=>send('finish',{id:run.id,trace},cookie)));
    assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===409).length,5);
    const reward=await responses.find(r=>r.status===200).json();assert.equal(reward.apiKey,'test-reward-placeholder');assert.equal(reward.baseUrl,'https://cpa-dhke.onrender.com/v1');
  }finally{await mf.dispose();}
});


test('the second damaging hit ends the two-shield run',()=>{
  const state=createGame(1);
  const hit=()=>{state.objects.push({id:999,type:'hazard',x:state.x,y:RULES.playerY-1,speed:1,vx:0,radius:26});step(state,state.target);};
  assert.equal(state.shields,2);hit();assert.equal(state.shields,1);assert.equal(state.done,false);
  while(state.cooldown>0)step(state,state.target);
  hit();assert.equal(state.shields,0);assert.equal(state.done,true);assert.equal(state.won,false);
});

test('in-flight v2 runs retain their original three-shield replay',async()=>{
  const engine=await import('../public/free-token/game/engine-v2.mjs');const seed=6849877;const trace=winning(seed,engine).trace;const now=Date.now();
  assert.equal(verifyRun({seed,rulesVersion:2,sessionHash:'v2',started:now-31000,expires:now+60000,claimed:false},{sessionHash:'v2',trace},now).status,200);
});


test('rage begins on the last five jade, not on remaining seconds',()=>{
  const late=createGame(1);late.frame=RULES.frames-300;late.jade=RULES.goal-6;step(late);assert.equal(late.rageAt,-1);
  const early=createGame(1);early.frame=100;early.jade=RULES.goal-5;step(early);assert.equal(early.rageAt,100);
});

test('collecting the goal stops jade drops but requires full survival time',()=>{
  const state=createGame(1);state.jade=RULES.goal;state.objects=[{id:1,type:'jade',x:100,y:0,vx:0,speed:7,radius:19}];step(state);
  assert.equal(state.done,false);assert.equal(state.won,false);assert.ok(state.objects.every(o=>o.type!=='jade'));
  state.objects=[];state.frame=RULES.frames-2;step(state);assert.equal(state.done,false);step(state);assert.equal(state.won,true);
});

test('45-second current runs reject early wins while v3 runs keep 30-second rules',async()=>{
  const now=Date.now(),seed=27399508,trace=winning(seed).trace;
  const run={seed,rulesVersion:4,sessionHash:'duration',started:now-31000,expires:now+90000,claimed:false};
  assert.equal(verifyRun(run,{sessionHash:'duration',trace},now).status,400);
  const old=await import('../public/free-token/game/engine-v3.mjs'),fixture=winning(6849877,old);assert.ok(fixture);
  assert.equal(verifyRun({...run,seed:6849877,rulesVersion:3},{sessionHash:'duration',trace:fixture.trace},now).status,200);
});
