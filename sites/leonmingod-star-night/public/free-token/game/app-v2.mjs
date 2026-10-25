import { RULES, createGame, step } from './engine-v2.mjs';

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const screen = $('screen'), start = $('start'), resume = $('resume'), pause = $('pause');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let state = createGame(1), run, trace = [], playing = false, paused = false, busy = false;
let target = 500, last = 0, accumulator = 0, lastRecorded = -1, animation, lastSecond = -1, countdownTimer;
const held = new Set();
let rewardData;

async function api(action, body) {
  const response = await fetch(`/api/free-token/game/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store', body: JSON.stringify(body) });
  let data;
  try { data = await response.json(); } catch { throw new Error('网络有些波动，请稍后再试。'); }
  if (!response.ok) { const error = new Error(data.error || '暂时无法领取，请稍后重试。'); error.status = response.status; throw error; }
  return data;
}

const atlas = new Image(); atlas.src = '/free-token/game/jade-atlas-v1.webp';
const background = new Image(); background.src = '/free-token/game/mountain-night-v1.webp';
let effects = [];
const icons = [[0,0],[1,0],[0,1],[1,1]];
function sprite(index, x, y, size, angle = 0, alpha = 1) {
  if (!atlas.complete || !atlas.naturalWidth) return;
  const w = atlas.naturalWidth / 2, h = atlas.naturalHeight / 2, [col,row] = icons[index];
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x,y); ctx.rotate(angle);
  ctx.drawImage(atlas,col*w,row*h,w,h,-size/2,-size/2,size,size); ctx.restore();
}
function draw() {
  ctx.fillStyle = '#0b202b'; ctx.fillRect(0,0,720,1000);
  if (background.complete && background.naturalWidth) {
    const crop = background.naturalWidth / .72;
    ctx.drawImage(background,0,(background.naturalHeight-crop)/2,background.naturalWidth,crop,0,0,720,1000);
  }
  ctx.fillStyle = '#04182038'; ctx.fillRect(0,0,720,1000);
  // Subtle upward travel; a small fixed number of strokes, without blur filters.
  if (playing && !reduced) {
    ctx.strokeStyle='#b3e9d625';ctx.lineWidth=1;
    for(let i=0;i<9;i++){const x=35+(i*83)%660,y=(i*127+state.frame*3.2)%1100-60;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+23);ctx.stroke();}
  }
  for (const object of state.objects) {
    ctx.save();ctx.translate(object.x,object.y);
    if (object.type === 'jade') {
      ctx.fillStyle='#91edc01b';ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.fill();
      sprite(1,0,0,82,reduced?0:Math.sin(object.id+state.frame*.04)*.1);
    } else {
      ctx.fillStyle=object.wave?'#ef816423':'#ef816418';ctx.beginPath();ctx.ellipse(0,0,28,35,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ed806643';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(-object.vx*12,-88);ctx.stroke();
      sprite(2,0,0,112,Math.atan2(-object.vx,object.speed));
    }
    ctx.restore();
  }
  // Draw a short sword trail and a visible invulnerability shield.
  ctx.save();ctx.translate(state.x,RULES.playerY);
  if (playing && !reduced) {
    const tail=ctx.createLinearGradient(0,25,0,115);tail.addColorStop(0,'#c0ffe28c');tail.addColorStop(1,'#77ebd000');ctx.fillStyle=tail;
    ctx.beginPath();ctx.moveTo(-6,24);ctx.quadraticCurveTo(-18,80,0,122);ctx.quadraticCurveTo(18,80,6,24);ctx.fill();
  }
  if (state.cooldown) {ctx.strokeStyle=state.frame%12<6?'#dcf3bc9c':'#dcf3bc44';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-8,37,62,0,0,Math.PI*2);ctx.stroke();}
  sprite(0,0,-2,144,0,state.cooldown&&state.frame%8<4?.6:1);ctx.restore();
  effects = effects.filter(fx => state.frame - fx.frame < 24);
  for (const fx of effects) {
    const age=(state.frame-fx.frame)/24;ctx.save();ctx.globalAlpha=1-age;ctx.strokeStyle=fx.hit?'#f0a28e':'#c9f2aa';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(fx.x,fx.y,12+age*44,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
}
atlas.onload=background.onload=()=>{if(!playing)draw();};

function hud(){
  const second=Math.max(0,Math.ceil((RULES.frames-state.frame)/60));
  $('time').innerHTML=`${second}<span>s</span>`;$('jade').innerHTML=`${state.jade}<span> / ${RULES.goal}</span>`;
  $('shields').textContent='◇ '.repeat(Math.max(0,state.shields))+'· '.repeat(3-Math.max(0,state.shields));$('shields').setAttribute('aria-label',`${state.shields}点护盾`);
  const phase=Math.min(2,Math.floor(state.frame/600));$('phase').textContent=['第一阵 · 风起','第二阵 · 星垂','第三阵 · 破境'][phase];
  if(second!==lastSecond && second%10===0){$('announcement').textContent=`剩余${second}秒，已收集${state.jade}枚灵玉，${state.shields}点护盾。`;lastSecond=second;}
}

function show(title,description,button='再试一局 →'){
  $('screen-title').textContent=title;$('screen-description').textContent=description;start.textContent=button;start.hidden=false;start.disabled=false;resume.hidden=true;screen.hidden=false;pause.disabled=true;
}

function tick(now){
  if(!playing||paused)return;
  accumulator+=Math.min(now-last,150);last=now;
  while(accumulator>=1000/60&&!state.done){
    if(held.has('ArrowLeft')||held.has('a')||held.has('A'))target=Math.max(0,target-18);
    if(held.has('ArrowRight')||held.has('d')||held.has('D'))target=Math.min(1000,target+18);
    target=Math.round(target);
    if(target!==lastRecorded){trace.push([state.frame,target]);lastRecorded=target;}
    step(state,target);accumulator-=1000/60;
    if(state.hit||state.collected)effects.push({x:state.x,y:RULES.playerY,frame:state.frame,hit:!!state.hit});
    if(state.hit&&!reduced){document.querySelector('.arena').classList.remove('shake');void canvas.offsetWidth;document.querySelector('.arena').classList.add('shake');}
  }
  draw();hud();
  if(state.done){end();return;}animation=requestAnimationFrame(tick);
}

async function end(){
  playing=false;pause.disabled=true;held.clear();
  if(!state.won){show(state.shields<=0?'护盾耗尽':'灵玉尚未集齐',`本局收集 ${state.jade} 枚灵玉。${state.shields<=0?'躲开红色剑煞，再来一次。':'撑到最后了！再多接一些青玉就能通关。'}`);$('announcement').textContent='挑战结束，可以重试。';return;}
  document.querySelector('.arena').classList.add('victory');
  show('破阵成功',`收集 ${state.jade} 枚灵玉，剩余 ${state.shields} 点护盾。正在核验本局并准备奖励…`,'正在领取…');start.disabled=true;
  await claimReward();
}

async function claimReward(){
  if(busy)return;busy=true;start.disabled=true;
  try{
    const data=await api('finish',{id:run.id,trace});
    if(!data.apiKey||!data.baseUrl)throw new Error('奖励暂时未准备好，请稍后重试。');
    rewardData=data;$('base-url').value=data.baseUrl;$('api-key').value=data.apiKey;$('score-note').textContent=`${data.jade} 枚灵玉 · ${data.shields} 点护盾 · 完整 30 秒`;
    $('copy-status').textContent='';$('reward').showModal();show('令牌已归你','凭实力破阵，这份礼拿得漂亮。','再挑战一局 →');
    const reopen=document.createElement('button');reopen.type='button';reopen.className='secondary';reopen.textContent='查看通关奖励';reopen.id='reopen-reward';reopen.addEventListener('click',()=>{if(rewardData){$('base-url').value=rewardData.baseUrl;$('api-key').value=rewardData.apiKey;$('reward').showModal();}});$('reopen-reward')?.remove();screen.append(reopen);
  }catch(error){const expired=[400,403,409,410].includes(error.status);show('破阵成功，领取未完成',error.message,expired?'重新挑战 →':'重试领取 →');if(!expired)start.dataset.retryClaim='true';}
  finally{busy=false;start.disabled=false;}
}

async function begin(){
  if(busy)return;
  if(start.dataset.retryClaim==='true'){delete start.dataset.retryClaim;await claimReward();return;}
  busy=true;start.disabled=true;start.textContent='正在开阵…';$('notice').textContent='';$('reopen-reward')?.remove();rewardData=undefined;$('base-url').value=$('api-key').value='';
  try{
    run=await api('start',{});if(run.rules.version!==RULES.version)throw new Error('游戏已更新，请刷新页面。');
    state=createGame(run.seed);effects=[];trace=[];lastRecorded=-1;target=500;lastSecond=-1;accumulator=0;paused=false;held.clear();document.querySelector('.arena').classList.remove('victory');draw();hud();screen.hidden=true;
    $('countdown').hidden=false;$('countdown').textContent='3';
    let remaining=3;
    countdownTimer=setInterval(()=>{remaining--;if(remaining>0){$('countdown').textContent=String(remaining);return;}clearInterval(countdownTimer);$('countdown').hidden=true;playing=true;pause.disabled=false;pause.setAttribute('aria-label','暂停游戏');busy=false;canvas.focus({preventScroll:true});last=performance.now();if(document.hidden)setPause(true);else animation=requestAnimationFrame(tick);},600);
  }catch(error){busy=false;show('暂时未能开阵',error.message,'重新开阵 →');}
}

function setPause(value){
  if(!playing)return;paused=value;held.clear();cancelAnimationFrame(animation);
  if(paused){screen.hidden=false;start.hidden=true;resume.hidden=false;$('screen-title').textContent='剑心稍歇';$('screen-description').textContent='已暂停。每局凭证保留 3 分钟，回来可继续。';$('notice').textContent='';$('reopen-reward')?.remove();pause.setAttribute('aria-label','继续游戏');}
  else{screen.hidden=true;last=performance.now();pause.setAttribute('aria-label','暂停游戏');canvas.focus({preventScroll:true});animation=requestAnimationFrame(tick);}
}
start.addEventListener('click',begin);resume.addEventListener('click',()=>setPause(false));pause.addEventListener('click',()=>setPause(!paused));
function steer(event){if(!playing||paused)return;const rect=canvas.getBoundingClientRect();target=Math.round(Math.max(0,Math.min(1000,((event.clientX-rect.left)/rect.width*720-38)/644*1000)));}
canvas.addEventListener('pointerdown',event=>{if(!playing||paused)return;canvas.setPointerCapture(event.pointerId);steer(event);});canvas.addEventListener('pointermove',steer);
canvas.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(event.key)){event.preventDefault();held.add(event.key);}if(event.code==='Space'||event.key==='Escape'){event.preventDefault();setPause(!paused);}});
window.addEventListener('keyup',event=>held.delete(event.key));window.addEventListener('blur',()=>{if(playing&&!paused)setPause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!paused)setPause(true);});
window.addEventListener('pageshow',()=>{if(!playing&&!busy)show('准备入阵？','收集 16 枚灵玉，守住 30 秒。剑阵会逐段加速。','执剑 · 开始挑战 →');});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(animation);clearInterval(countdownTimer);playing=false;busy=false;rewardData=undefined;$('base-url').value=$('api-key').value='';$('reward').close();show('准备入阵？','收集 16 枚灵玉，守住 30 秒。','执剑 · 开始挑战 →');});
$('close-reward').addEventListener('click',()=>$('reward').close());$('reward').addEventListener('close',()=>{$('base-url').value=$('api-key').value='';$('copy-status').textContent='';});
async function copy(kind){if(!rewardData)return;const text=kind==='url'?rewardData.baseUrl:kind==='key'?rewardData.apiKey:`Base URL: ${rewardData.baseUrl}\nAPI Key: ${rewardData.apiKey}`;try{await navigator.clipboard.writeText(text);$('copy-status').textContent='已复制。';}catch{const field=kind==='url'?$('base-url'):$('api-key');field.focus();field.select();$('copy-status').textContent='请长按或使用 Ctrl+C 复制。';}}
$('copy-url').addEventListener('click',()=>copy('url'));$('copy-key').addEventListener('click',()=>copy('key'));$('copy-all').addEventListener('click',()=>copy('all'));
draw();hud();
