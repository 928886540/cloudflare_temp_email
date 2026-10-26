import test from 'node:test';
import assert from 'node:assert/strict';
import * as physics from '../public/free-token/game/physics-v8.mjs';
import * as live from '../public/free-token/game/engine-v8.mjs';
import * as old from '../public/free-token/game/engine-v7.mjs';
import { verifyProgress } from '../src/game.js';
import { lossSummary } from '../public/free-token/game/feedback-v1.mjs';
const { RULES, createGame, step } = physics;
const object = (type, x, y, id=99) => ({id,type,x,y,vx:0,speed:1,radius:type==='jade'?19:type==='ward'?32:26});
function fixture() { const s=createGame(1);s.frame=200;return s; }

test('ward collects jade and gold at its circle, without enlarging ordinary pickup',()=>{
  for(const type of ['jade','ward']) {
    for(const ward of [false,true]) {
      const s=fixture();if(ward)s.wardUntil=500;
      s.objects=[object(type,s.x+100,RULES.playerY-1)];step(s,500);
      assert.equal(type==='jade'?s.jade:s.wardCollected,ward?1:0);
      if(type==='ward'&&ward)assert.equal(s.wardUntil,500,'Refresh to five seconds, never stack');
    }
    const radius=type==='jade'?19:32;
    const outside=fixture();outside.wardUntil=500;outside.objects=[object(type,outside.x+RULES.wardRadius+radius+1,RULES.playerY-1)];step(outside,500);assert.equal(outside.objects.length,1);
    const boundary=fixture();boundary.wardUntil=500;boundary.objects=[object(type,boundary.x+RULES.wardRadius+radius,RULES.playerY-1)];step(boundary,500);assert.equal(boundary.objects.length,0);
    const diagonal=fixture();diagonal.wardUntil=500;diagonal.objects=[object(type,diagonal.x+110,RULES.playerY+109)];step(diagonal,500);assert.equal(diagonal.objects.length,1,'Circular, not square pickup');
  }
  const expired=fixture();expired.wardUntil=200;expired.objects=[object('jade',expired.x+100,RULES.playerY-1)];step(expired);assert.equal(expired.jade,0);
});

test('every red sword touching the ward is removed authoritatively and flies outward visually',()=>{
  const s=fixture();s.wardUntil=500;
  const points=[[120,0],[-120,0],[0,-120],[0,120]];
  s.objects=points.map(([dx,dy],i)=>object('hazard',s.x+dx,RULES.playerY+dy-1,i));step(s,500);
  assert.equal(s.shields,2);assert.equal(s.blocked,4);assert.equal(s.objects.length,0);
  const events=s.events.filter(e=>e.kind==='deflect');assert.equal(events.length,4);
  for(const e of events)assert.ok((e.x-s.x)*e.vx+(e.y-RULES.playerY)*e.vy>0,'Deflection always moves away from the ward');
  step(s,500);assert.equal(s.events.length,0,'Events last one physics frame and cannot re-hit');
  s.wardUntil=s.frame;s.objects=[object('hazard',s.x,RULES.playerY-1)];step(s,500);assert.equal(s.shields,1);
});

test('same-frame gold pickup expands jade collection and deflects swords before damage',()=>{
  const s=fixture();s.objects=[object('hazard',s.x,RULES.playerY-1,1),object('jade',s.x+100,RULES.playerY-1,2),object('ward',s.x,RULES.playerY-70-1,3)];
  step(s,500);assert.equal(s.shields,2);assert.equal(s.jade,1);assert.equal(s.blocked,1);assert.equal(s.wardUntil,500);
});

test('sword walls glint for 24 frames before launch and retain clear reachable corridors',()=>{
  const s=createGame(3);s.frame=810;step(s,500);
  const wall=s.objects.filter(o=>o.wave);assert.equal(wall.length,5);assert.ok(wall.every(o=>o.y===-45&&o.launchAt===834));
  const gap=s.corridors[0];assert.ok(gap.from>834);
  while(s.frame<834)step(s,500);assert.ok(wall.every(o=>o.y===-45));step(s,500);assert.ok(wall.every(o=>o.y>-45));
  for(let seed=1;seed<=30;seed++){
    const s=createGame(seed);s.frame=810;s.x=50+seed%6*110;s.target=Math.round((s.x-38)/644*1000);step(s,s.target);
    const gap=s.corridors[0];assert.ok(gap.right-gap.left>=160);
    const nearest=Math.max(gap.left,Math.min(gap.right,s.x));assert.ok(Math.abs(nearest-s.x)<(gap.from-s.frame-18)*RULES.maxMove);
    for(let i=0;i<125&&!s.done;i++){
      step(s,Math.round((nearest-38)/644*1000));
      if(s.frame>=gap.from&&s.frame<=gap.until){
        const blocked=s.objects.some(o=>o.type==='hazard'&&Math.abs(o.y-RULES.playerY)<60&&o.x+o.radius+23>gap.left&&o.x-o.radius-23<gap.right);
        assert.equal(blocked,false,'Warning delay must not allow another sword to seal the corridor');
      }
    }
  }
});

test('near-miss feedback occurs once per passing sword, never on damage or invulnerability',()=>{
  const s=fixture();s.objects=[object('hazard',s.x+60,RULES.playerY,1)];step(s);assert.equal(s.events.filter(e=>e.kind==='near').length,1);assert.equal(s.shields,2);step(s);assert.equal(s.events.filter(e=>e.kind==='near').length,0);
  for(const protectedState of ['cooldown','wardUntil']){const s=fixture();s[protectedState]=500;s.objects=[object('hazard',s.x+60,RULES.playerY)];step(s);assert.equal(s.events.filter(e=>e.kind==='near').length,0);}
  const hit=fixture();hit.objects=[object('hazard',hit.x,RULES.playerY),object('hazard',hit.x+60,RULES.playerY)];step(hit);assert.equal(hit.hit,1);assert.ok(hit.events.every(e=>e.kind!=='near'));
});

test('v8 live replay matches client contact events; in-flight v7 keeps its original physics',()=>{
  for(const engine of [live,old]){
    const s=engine.createGame(1);s.frame=200;s.wardUntil=500;s.objects=[object('jade',s.x+100,RULES.playerY-1)];
    const run={protocol:'live-v1',rulesVersion:engine.RULES.version,sessionHash:'test',started:100000,expires:280000,lastSeen:103000,receipt:'test',state:s};
    const client=structuredClone(s);for(let i=0;i<30;i++)engine.step(client,500);
    const checked=verifyProgress(run,{sessionHash:'test',receipt:'test',frame:230,trace:[[200,500]]},104000);
    assert.equal(checked.status,200);assert.deepEqual(checked.state,client);assert.equal(client.jade,engine===live?1:0);
  }
});

test('loss summaries distinguish missing jade from missing survival time',()=>{
  assert.match(lossSummary({frame:2340,jade:22},RULES),/39 秒.*\n还差 2 枚，再坚持 6 秒/);
  assert.match(lossSummary({frame:2640,jade:24},RULES),/只剩 1 秒/);
  assert.match(lossSummary({frame:2700,jade:23},RULES),/撑满 45 秒.*\n只差 1 枚/);
});
