// Deterministic rules shared by the browser and server reward replay.
export const RULES = Object.freeze({ version: 2, width: 720, height: 1000, fps: 60, frames: 1800, goal: 16, shields: 3, playerY: 850, maxMove: 12 });

export function createGame(seed) {
  return { frame: 0, x: 360, target: 500, shields: RULES.shields, jade: 0, cooldown: 0, objects: [], random: seed >>> 0 || 1, serial: 0, done: false, won: false, hit: 0, collected: 0 };
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

export function step(state, target = state.target) {
  if (state.done) return state;
  state.target = Math.max(0, Math.min(1000, target));
  const desired = 38 + state.target / 1000 * 644;
  state.x += Math.max(-RULES.maxMove, Math.min(RULES.maxMove, desired - state.x));
  state.hit = state.collected = 0;
  if (state.cooldown > 0) state.cooldown--;
  const frame = state.frame;
  const phase = frame < 480 ? 0 : frame < 1080 ? 1 : 2;
  const jadeGap = [52, 48, 45][phase];
  if (frame >= 24 && frame % jadeGap === 24) {
    spawn(state, 'jade', 80 + Math.floor(random(state) * 7) * 93, 6.6 + phase * .65);
  }
  const hazardGap = [70, 55, 43][phase];
  if (frame >= 120 && frame % hazardGap === 0) {
    const aimed = state.serial % 3 === 0;
    const x = aimed ? Math.max(55, Math.min(665, state.x + (random(state) - .5) * 180)) : 55 + random(state) * 610;
    const vx = phase === 0 ? 0 : (random(state) - .5) * (phase === 2 ? 1.7 : 1.1);
    spawn(state, 'hazard', x, 7.7 + phase * .85 + random(state) * .9, vx);
    if (phase > 0 && random(state) < (phase === 2 ? .35 : .15)) {
      spawn(state, 'hazard', Math.max(45, Math.min(675, x + (x > 360 ? -135 : 135))), 7.9 + phase * .85, -vx);
    }
  }
  // A visible sword formation with a three-lane opening; never a solid wall.
  if (frame >= 720 && frame % 360 === 120) {
    const opening = Math.floor(random(state) * 5);
    for (let lane = 0; lane < 8; lane++) {
      if (lane === opening || lane === opening + 1 || lane === opening + 2) continue;
      spawn(state, 'hazard', 58 + lane * 86, 7.7 + phase * .6, 0, true);
    }
  }
  state.objects = state.objects.filter(object => {
    object.y += object.speed;
    object.x += object.vx;
    if (object.x < 35 || object.x > 685) { object.vx *= -1; object.x = Math.max(35, Math.min(685, object.x)); }
    const dx = state.x - object.x, dy = RULES.playerY - object.y;
    if (dx * dx + dy * dy < (object.radius + 15) ** 2) {
      if (object.type === 'jade') { state.jade++; state.collected++; return false; }
      if (!state.cooldown) { state.shields--; state.cooldown = 66; state.hit = 1; return false; }
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
