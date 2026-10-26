import * as currentEngine from '../public/free-token/game/engine-v4.mjs';
const { RULES } = currentEngine;

export function play(seed, reaction = 9, lookahead = 30, engine = currentEngine) {
  const { RULES, createGame, step, replay } = engine;
  const state = createGame(seed), trace = [];
  let target = 500, prior = -1;
  while (!state.done) {
    if (state.frame % reaction === 0) {
      let best = -Infinity, aim = state.x;
      const gems = state.objects.filter(o => o.type === 'jade' && o.y < RULES.playerY + 20);
      for (let x = 40; x <= 680; x += 16) {
        let score = -.004 * Math.abs(state.x - x);
        for (const o of gems) {
          const eta = (RULES.playerY - o.y) / o.speed;
          if (eta > 0 && eta < 90) {
            const canReach = Math.abs(x - state.x) <= RULES.maxMove * eta;
            if (canReach) score += Math.max(0, 1 - Math.abs(o.x - x) / 130) * (eta < 25 ? 13 : 7);
          }
        }
        for (const o of state.objects) {
          if (o.type !== 'hazard') continue;
          const eta = (RULES.playerY - o.y) / o.speed;
          if (eta < -5 || eta > lookahead) continue;
          const ox = Math.max(35, Math.min(685, o.x + o.vx * Math.max(0, eta)));
          const threat = Math.max(0, 1 - Math.abs(ox - x) / 68);
          score -= threat * (state.cooldown > eta ? 2 : 25) * (1 - Math.max(0, eta) / (lookahead + 15));
        }
        if (score > best) { best = score; aim = x; }
      }
      target = Math.round((aim - 38) / 644 * 1000);
    }
    if (target !== prior) { trace.push([state.frame, target]); prior = target; }
    step(state, target);
  }
  return { state, trace, result: replay(seed, trace) };
}

if (process.argv[1].endsWith('calibrate.mjs')) {
  const summary = [];
  for (const [label, reaction, lookahead] of [['new',18,18],['regular',10,30],['expert',4,55]]) {
    let wins = 0, jade = 0, shields = 0;
    for (let seed = 1; seed <= 160; seed++) {
      const {state} = play(seed * 6849877, reaction, lookahead);
      wins += Number(state.won); jade += state.jade; shields += state.shields;
    }
    summary.push({profile:label,reaction_ms:Math.round(reaction/60*1000),lookahead_ms:Math.round(lookahead/60*1000),runs:160,wins,win_rate:wins/160,average_jade:jade/160,average_shields:shields/160});
  }
  console.log(JSON.stringify({rule_version:RULES.version,goal:RULES.goal,simulated_only:true,summary},null,2));
}
