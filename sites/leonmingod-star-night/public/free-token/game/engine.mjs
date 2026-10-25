export const RULES = Object.freeze({ version: 1, width: 720, height: 1000, fps: 60, frames: 1800, goal: 10, shields: 3, playerY: 850, maxMove: 13 });

export function createGame(seed) {
  return { frame: 0, x: 360, target: 500, shields: RULES.shields, jade: 0, cooldown: 0, objects: [], random: seed >>> 0 || 1, serial: 0, done: false, won: false, hit: 0, collected: 0 };
}

function random(state) {
  let x = state.random;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.random = x >>> 0;
  return state.random / 4294967296;
}

export function step(state, target = state.target) {
  if (state.done) return state;
  state.target = Math.max(0, Math.min(1000, target));
  const desired = 38 + state.target / 1000 * 644;
  state.x += Math.max(-RULES.maxMove, Math.min(RULES.maxMove, desired - state.x));
  state.hit = state.collected = 0;
  if (state.cooldown > 0) state.cooldown--;
  const frame = state.frame;
  const phase = Math.floor(frame / 600);
  if (frame >= 30 && (frame - 30) % 62 === 0) {
    state.objects.push({ id: state.serial++, type: 'jade', x: 90 + Math.floor(random(state) * 7) * 90, y: -30, speed: 5.5 + phase * .7, radius: 20 });
  }
  const obstacleGap = phase === 0 ? 74 : phase === 1 ? 58 : 47;
  if (frame >= 180 && frame % obstacleGap === 0) {
    state.objects.push({ id: state.serial++, type: 'hazard', x: 70 + random(state) * 580, y: -50, speed: 6.5 + phase * .9, radius: 29 });
  }
  state.objects = state.objects.filter(object => {
    object.y += object.speed;
    const dx = state.x - object.x;
    const dy = RULES.playerY - object.y;
    if (dx * dx + dy * dy < (object.radius + 15) ** 2) {
      if (object.type === 'jade') { state.jade++; state.collected++; return false; }
      if (!state.cooldown) { state.shields--; state.cooldown = 85; state.hit = 1; return false; }
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
