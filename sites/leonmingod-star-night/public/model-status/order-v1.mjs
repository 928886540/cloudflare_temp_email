export const providerKey=value=>['anthropic','claude'].includes(value)?'claude':['gemini','gemini-cli','aistudio','vertex'].includes(value)?'gemini':['xai','grok'].includes(value)?'xai':value;
const providerOrder=['codex','openai','claude','gemini','antigravity','xai','qwen','iflow','kiro','copilot','other'];
export const providerRank=value=>{const i=providerOrder.indexOf(providerKey(value));return i<0?99:i;};
export const compareProviders=(a,b)=>providerRank(a)-providerRank(b)||a.localeCompare(b);
const featured=['gpt-6.1-sol','gpt-6.1-terra','gpt-6-astra','gpt-6-sol','gpt-6-luna','gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna'];
function modelRank(row){
  const id=row.id.toLowerCase(),pin=featured.indexOf(id);
  if(pin>=0)return pin;
  if(/^gpt-(?!image)/.test(id))return 30;
  if(/^claude/.test(id))return 40;
  if(/^gemini/.test(id))return 50;
  if(/^grok-(?!imagine|tts|voice)/.test(id))return 60;
  if(/image|imagine|video|tts|voice/.test(id))return 80;
  if(/auto-review|embedding|internal/.test(id))return 100;
  return 70;
}
export function compareModels(a,b){
  const factory=row=>Math.min(...(row.providers||['other']).map(providerRank));
  return factory(a)-factory(b)||modelRank(a)-modelRank(b)||a.id.localeCompare(b.id,undefined,{numeric:true});
}
export const stateRank={ready:0,cooldown:1,error:2,unknown:3,disabled:4};
export function compareAccounts(a,b){
  return stateRank[a.state]-stateRank[b.state]||compareProviders(a.provider,b.provider)||((b.success||0)+(b.failed||0))-((a.success||0)+(a.failed||0))||(a.masked_email||'').localeCompare(b.masked_email||'')||a.id.localeCompare(b.id);
}
