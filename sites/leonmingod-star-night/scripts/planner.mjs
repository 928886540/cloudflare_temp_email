// Offline verification controller: short-horizon path planning, never shipped in the app.
import * as engine from '../public/free-token/game/engine-v4.mjs';

function reflect(x){const q=((x-35)%1300+1300)%1300;return 35+(q<=650?q:1300-q);}

export function playPlanned(seed,{reaction=6,horizon=96}={}){
  const {RULES,createGame,step,replay}=engine,state=createGame(seed),trace=[];
  const xs=Array.from({length:54},(_,i)=>42+i*12),N=xs.length,steps=Math.ceil(horizon/reaction);
  let target=500,previous=-1;
  while(!state.done){
    if(state.frame%reaction===0){
      const costs=Array.from({length:steps*2+1},()=>new Float64Array(N));
      for(let k=1;k<costs.length;k++){
        const t=k*reaction/2;
        for(const o of state.objects){
          const y=o.y+o.speed*t,dy=RULES.playerY-y;
          if(Math.abs(dy)>100)continue;
          const ox=reflect(o.x+o.vx*t);
          if(o.type==='hazard'&&t<state.cooldown-2)continue;
          for(let i=0;i<N;i++){
            const distance=Math.hypot(xs[i]-ox,dy);
            if(o.type==='hazard'){
              if(distance<o.radius+18)costs[k][i]+=1e6;
              else costs[k][i]+=Math.max(0,1-distance/78)*30;
            }else if(state.jade<RULES.goal&&Math.abs(dy)<o.speed*reaction/2&&distance<o.radius+18){costs[k][i]-=90;}
          }
        }
      }
      let dp=new Float64Array(N).fill(Infinity),paths=[];
      for(let i=0;i<N;i++)if(Math.abs(xs[i]-state.x)<=RULES.maxMove*reaction)dp[i]=costs[2][i]+costs[1][Math.max(0,Math.min(N-1,Math.round(((xs[i]+state.x)/2-42)/12)))]+Math.abs(xs[i]-state.x)*.015;
      for(let k=1;k<steps;k++){
        const next=new Float64Array(N).fill(Infinity),parent=new Int16Array(N).fill(-1);
        for(let i=0;i<N;i++){
          for(let j=Math.max(0,i-reaction);j<=Math.min(N-1,i+reaction);j++){
            const value=dp[j]+costs[k*2+2][i]+costs[k*2+1][Math.round((i+j)/2)]+Math.abs(i-j)*.18;
            if(value<next[i]){next[i]=value;parent[i]=j;}
          }
        }
        paths.push(parent);dp=next;
      }
      let choice=0;for(let i=1;i<N;i++)if(dp[i]<dp[choice])choice=i;
      for(let k=paths.length-1;k>=0;k--)choice=paths[k][choice];
      target=Math.round((xs[choice]-38)/644*1000);
    }
    if(target!==previous){trace.push([state.frame,target]);previous=target;}
    step(state,target);
  }
  return {state,trace,result:replay(seed,trace)};
}

if(process.argv[1].endsWith('planner.mjs')){
  const count=Number(process.argv[2]||12);let best={jade:0,frame:0};
  for(let i=1;i<=count;i++){
    const seed=i*6849877,r=playPlanned(seed);best={jade:Math.max(best.jade,r.state.jade),frame:Math.max(best.frame,r.state.frame)};
    if(r.state.won){console.log(JSON.stringify({seed,jade:r.state.jade,shields:r.state.shields,frames:r.state.frame,trace:r.trace}));process.exit(0);}
  }
  console.log(JSON.stringify({no_winner:true,count,best}));
}
