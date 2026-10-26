// Deterministic 45-second trial, shared by the browser and reward server.
export const RULES = Object.freeze({ version: 4, width: 720, height: 1000, fps: 60, frames: 2700, goal: 24, shields: 2, playerY: 850, maxMove: 12, rageRemaining: 5 });

export function createGame(seed) {
  return { frame: 0, x: 360, target: 500, shields: RULES.shields, jade: 0, cooldown: 0, objects: [], random: seed >>> 0 || 1, serial: 0, done: false, won: false, hit: 0, collected: 0, rageAt: -1 };
}

function random(state) {
  let x = state.random;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.random = x >>> 0;
  return state.random / 4294967296;
}

function spawn(state, type, x, speed, vx = 0, wave = false) {
  state.objects.push({ id: state.serial++, type, x, y: -45, speed, vx, radius: type === 'jade' ? 19 : 26, wave });
}

export function phaseOf(state) {
  if (state.jade >= RULES.goal) return 3;
  if (state.rageAt >= 0 || state.jade >= RULES.goal - RULES.rageRemaining) return 2;
  return state.frame < 600 ? 0 : state.frame < 1500 ? 1 : 2;
}

export function step(state, target = state.target) {
  if (state.done) return state;
  state.target = Math.max(0, Math.min(1000, target));
  const desired = 38 + state.target / 1000 * 644;
  state.x += Math.max(-RULES.maxMove, Math.min(RULES.maxMove, desired - state.x));
  state.hit = state.collected = 0;
  if (state.cooldown > 0) state.cooldown--;
  const frame = state.frame;
  if (state.rageAt < 0 && (state.jade >= RULES.goal - RULES.rageRemaining)) state.rageAt = frame;
  const rage = state.rageAt >= 0;
  const phase = frame < 600 ? 0 : frame < 1500 ? 1 : 2;
  const jadeGap = [42, 38, 34][phase];
  // Reaching the goal switches to pure survival; the last five jade trigger rage.
  if (state.jade < RULES.goal && frame >= 24 && frame % jadeGap === 24) {
    spawn(state, 'jade', 80 + Math.floor(random(state) * 7) * 93, 7.0 + phase * .7);
  }
  if (state.jade >= RULES.goal) state.objects = state.objects.filter(o => o.type !== 'jade');
  if (!rage) {
    const gap = [55, 35, 25][phase];
    if (frame >= 90 && frame % gap === 0) {
      const x = state.serial % 3 === 0 ? Math.max(55, Math.min(665, state.x + (random(state) - .5) * 170)) : 55 + random(state) * 610;
      const vx = (random(state) - .5) * [0.7, 1.8, 2.8][phase];
      spawn(state, 'hazard', x, 9.0 + phase * 1.35 + random(state), vx);
      if (phase > 0 && random(state) < [0, .30, .50][phase]) spawn(state, 'hazard', Math.max(45, Math.min(675, x + (x > 360 ? -135 : 135))), 9.2 + phase * 1.35, -vx);
    }
    if (frame >= 600 && frame % (phase === 2 ? 180 : 240) === 0) {
      const opening = Math.floor(random(state) * 6);
      for (let lane = 0; lane < 8; lane++) {
        if (lane === opening || lane === opening + 1) continue;
        spawn(state, 'hazard', 58 + lane * 86, 9.3 + phase * .8, 0, true);
      }
    }
  } else {
    const elapsed = frame - state.rageAt;
    const final = state.jade >= RULES.goal;
    // The last five jade already demand survival-level movement; the finale accelerates it.
    if (elapsed % (final ? 14 : 20) === 0) {
      const x = Math.max(50, Math.min(670, state.x + (random(state) - .5) * 120));
      spawn(state, 'hazard', x, final ? 15.3 : 13.2, (random(state) - .5) * 2.6);
      spawn(state, 'hazard', Math.max(45, Math.min(675, x + (x > 360 ? -150 : 150))), final ? 14.7 : 12.8, (random(state) - .5) * 2.6);
    }
    if (elapsed % (final ? 42 : 60) === 0) {
      spawn(state, 'hazard', 55, final ? 14.6 : 12.8, final ? 4.6 : 3.8);
      spawn(state, 'hazard', 665, final ? 14.6 : 12.8, final ? -4.6 : -3.8);
    }
    if (elapsed % (final ? 72 : 108) === 0) {
      const opening = Math.floor(random(state) * 7);
      for (let lane = 0; lane < 8; lane++) {
        if (lane === opening || lane === opening + 1) continue;
        spawn(state, 'hazard', 58 + lane * 86, final ? 13.9 : 12.0, 0, true);
      }
    }
  }
  state.objects = state.objects.filter(object => {
    object.y += object.speed; object.x += object.vx;
    if (object.x < 35 || object.x > 685) { object.vx *= -1; object.x = Math.max(35, Math.min(685, object.x)); }
    const dx = state.x - object.x, dy = RULES.playerY - object.y;
    if (dx * dx + dy * dy < (object.radius + 15) ** 2) {
      if (object.type === 'jade') { state.jade++; state.collected++; return false; }
      if (!state.cooldown) { state.shields--; state.cooldown = 48; state.hit = 1; return false; }
    }
    return object.y < RULES.height + 80;
  });
  state.frame++;
  state.done = state.shields <= 0 || state.frame >= RULES.frames;
  state.won = state.done && state.shields > 0 && state.jade >= RULES.goal && state.frame === RULES.frames;
  return state;
}

export function validateTrace(trace) {
  if (!Array.isArray(trace) || trace.length < 1 || trace.length > RULES.frames) return false;
  let previous = -1;
  for (const entry of trace) {
    if (!Array.isArray(entry) || entry.length !== 2) return false;
    const [frame, target] = entry;
    if (!Number.isInteger(frame) || frame <= previous || frame < 0 || frame >= RULES.frames || !Number.isInteger(target) || target < 0 || target > 1000) return false;
    previous = frame;
  }
  return trace[0][0] === 0;
}

export function replay(seed, trace) {
  if (!validateTrace(trace)) return null;
  const state = createGame(seed);
  let index = 0;
  while (!state.done) {
    if (index < trace.length && trace[index][0] === state.frame) state.target = trace[index++][1];
    step(state);
  }
  if (index !== trace.length) return null;
  return { won: state.won, jade: state.jade, shields: state.shields, frames: state.frame };
}
