import { isIP } from 'node:net';
import { POLICY, initialState, check, observe, prune, metrics } from './policy.mjs';
const encoder=new TextEncoder();
const json=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function canonicalIP(value){
  if(typeof value!=='string'||!isIP(value))return null;
  if(isIP(value)===4)return value;
  const canonical=new URL(`http://[${value}]/`).hostname.slice(1,-1);
  if(canonical.startsWith('::ffff:')){
    const words=canonical.slice(7).split(':');
    if(words.length===2){const high=parseInt(words[0],16),low=parseInt(words[1],16);return `${high>>8}.${high&255}.${low>>8}.${low&255}`;}
  }
  return canonical;
}
async function authorized(request,env,body,admin){
  const parts=(request.headers.get('X-CPA-Guard')||'').match(/^(\d{13}):([a-f0-9]{32}):([a-f0-9]{64})$/);
  if(!parts||Math.abs(Date.now()-Number(parts[1]))>30000)return null;
  const secret=admin?env.ADMIN_SECRET:env.SERVICE_SECRET;
  if(!secret)return null;
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const message=`${parts[1]}\n${parts[2]}\nPOST\n${new URL(request.url).pathname}\n${body}`;
  const bytes=new Uint8Array(parts[3].match(/../g).map(v=>parseInt(v,16)));
  return await crypto.subtle.verify('HMAC',key,bytes,encoder.encode(message))?parts[2]:null;
}
export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname,admin=path==='/admin';
    if(!['/rpc','/admin'].includes(path)||request.method!=='POST')return json(404,{error:'Not found'});
    const text=await request.text();if(text.length>8192)return json(413,{error:'Request too large'});
    const nonce=await authorized(request,env,text,admin);if(!nonce)return json(403,{error:'Forbidden'});
    let body;try{body=JSON.parse(text);}catch{return json(400,{error:'Invalid JSON'});}
    if(!body||typeof body!=='object'||Array.isArray(body))return json(400,{error:'Invalid request'});
    if(body.ip!==undefined){body.ip=canonicalIP(body.ip);if(!body.ip)return json(400,{error:'Invalid IP'});}
    if(!admin&&(!body.ip||!['check','observe'].includes(body.action)))return json(400,{error:'Invalid operation'});
    if(admin&&(!['status','enable','disable','allow','unallow','unban'].includes(body.action)||(['allow','unallow','unban'].includes(body.action)&&!body.ip)))return json(400,{error:'Invalid administrative operation'});
    // Scope administrative capabilities to a separate secret never sent to CPA.
    return env.STATE.get(env.STATE.idFromName('cpa-v1')).fetch('https://state.internal/'+(admin?'admin':'rpc'),{method:'POST',body:JSON.stringify({...body,nonce})});
  },
  async scheduled(_controller,_env,ctx){
    // Render's free service can sleep after inactivity. This health request is
    // exempt from abuse accounting and keeps the API process warm.
    ctx.waitUntil(fetch('https://cpa-dhke.onrender.com/healthz',{
      headers:{'User-Agent':'LeonMinGod-CPA-Warmup/1.0','Cache-Control':'no-cache'}
    }).then(response=>{if(!response.ok)throw new Error(`CPA health returned ${response.status}`)}));
  }
};

export class AbuseState {
  constructor(ctx){
    this.ctx=ctx;this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS peers (ip TEXT PRIMARY KEY,state TEXT NOT NULL,updated INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,ip TEXT NOT NULL,entry TEXT NOT NULL,created INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS replay (nonce TEXT PRIMARY KEY,response TEXT NOT NULL,created INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY,value TEXT NOT NULL)');
  }
  config(){return JSON.parse([...this.sql.exec('SELECT value FROM control WHERE id=1')][0]?.value||'{"enabled":false,"allowlist":[]}');}
  async fetch(request){
    const body=await request.json(),now=Date.now(),admin=new URL(request.url).pathname==='/admin';
    const replayKey=(admin?'admin:':'rpc:')+body.nonce;
    const previous=[...this.sql.exec('SELECT response FROM replay WHERE nonce=? AND created>?',replayKey,now-60000)][0];
    if(previous)return json(200,JSON.parse(previous.response));
    const config=this.config();let result;
    this.ctx.storage.transactionSync(()=>{
      if(admin){
        if(body.action==='status'){
          const rows=body.ip?[...this.sql.exec('SELECT ip,state FROM peers WHERE ip=?',body.ip)]:[...this.sql.exec('SELECT ip,state FROM peers ORDER BY updated DESC LIMIT 100')];
          result={config,policy:POLICY,peers:rows.map(r=>{const s=prune(JSON.parse(r.state),now);return{ip:r.ip,active:s.active,bans:s.bans,counters:s.counters,sharedUntil:s.sharedUntil,throttleUntil:s.throttleUntil,windows:metrics(s,now)};}),records:[...this.sql.exec('SELECT ip,entry FROM audit ORDER BY created DESC LIMIT 100')].map(r=>({ip:r.ip,...JSON.parse(r.entry)}))};
        }else if(body.action==='enable'||body.action==='disable'){
          config.enabled=body.action==='enable';this.sql.exec('INSERT OR REPLACE INTO control VALUES (1,?)',JSON.stringify(config));result={config};
        }else if(body.action==='allow'||body.action==='unallow'){
          if(!body.ip)throw new Error('IP required');
          config.allowlist=config.allowlist.filter(ip=>ip!==body.ip);
          if(body.action==='allow')config.allowlist.push(body.ip);
          this.sql.exec('INSERT OR REPLACE INTO control VALUES (1,?)',JSON.stringify(config));result={config};
        }else if(body.action==='unban'){
          if(!body.ip)throw new Error('IP required');
          const row=[...this.sql.exec('SELECT state FROM peers WHERE ip=?',body.ip)][0];
          if(row){const state=JSON.parse(row.state);state.active=null;state.events=[];state.throttleUntil=0;state.credentialThrottles={};if(body.resetHistory===true)state.bans=[];this.sql.exec('UPDATE peers SET state=?,updated=? WHERE ip=?',JSON.stringify(state),now,body.ip);}
          this.sql.exec('INSERT INTO audit VALUES (?,?,?,?)',body.nonce,body.ip,JSON.stringify({action:'manual_unban',at:now,resetHistory:body.resetHistory===true}),now);result={unbanned:body.ip};
        }else result={error:'Unknown operation'};
      }else{
        const row=[...this.sql.exec('SELECT state FROM peers WHERE ip=?',body.ip)][0];
        const state=row?JSON.parse(row.state):initialState();
        const before=JSON.stringify(state.active),exempt=config.allowlist.includes(body.ip);
        const event={...body,exempt};
        const decision=body.action==='observe'?observe(state,event,now):check(state,now,event);
        this.sql.exec('INSERT OR REPLACE INTO peers VALUES (?,?,?)',body.ip,JSON.stringify(state),now);
        if(state.active&&JSON.stringify(state.active)!==before){
          const id=body.ip+':'+state.active.id;
          this.sql.exec('INSERT OR REPLACE INTO audit VALUES (?,?,?,?)',id,body.ip,JSON.stringify(state.active),now);
          console.log(JSON.stringify({event:'cpa_abuse_ban',reason:state.active.reason,until:state.active.until,evidence:state.active.evidence,enforced:config.enabled}));
        }
        result={...decision,enforced:config.enabled,action:config.enabled?decision.action:'allow',observedAction:decision.action,policyVersion:1};
      }
      this.sql.exec('INSERT INTO replay VALUES (?,?,?)',replayKey,JSON.stringify(result),now);
      this.sql.exec('DELETE FROM replay WHERE created<?',now-60000);
    });
    if(!await this.ctx.storage.getAlarm())await this.ctx.storage.setAlarm(now+3600000);
    return json(200,result);
  }
  async alarm(){
    const now=Date.now();this.sql.exec('DELETE FROM peers WHERE updated<?',now-POLICY.retention);
    this.sql.exec('DELETE FROM audit WHERE created<?',now-POLICY.retention);
    this.sql.exec('DELETE FROM replay WHERE created<?',now-60000);
    // Expiry is also checked on every request, independently of alarm scheduling.
    await this.ctx.storage.setAlarm(now+3600000);
  }
}
