// Deterministic 45-second trial, shared by the browser and reward server.
export const RULES = Object.freeze({ version: 6, width: 720, height: 1000, fps: 60, frames: 2700, goal: 24, shields: 2, playerY: 850, maxMove: 12, rageRemaining: 5, pickupReach: 70, wardSeconds: 5, wardRadius: 108 });

export function createGame(seed) {
  return { frame: 0, x: 360, target: 500, shields: RULES.shields, jade: 0, cooldown: 0, objects: [], random: seed >>> 0 || 1, serial: 0, done: false, won: false, hit: 0, collected: 0, rageAt: -1, corridors: [], wardUntil: 0, wardCollected: 0, blocked: 0, pickupX: 360, pickupY: 780 };
}

function random(state) {
  let x = state.random;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.random = x >>> 0;
  return state.random / 4294967296;
}

// A wall's visible gap remains clear while it crosses the player's row.
function blocksCorridor(state, object) {
  if (object.type !== 'hazard') return false;
  for (const gap of state.corridors) {
    const enter = Math.max(0, gap.from - state.frame, (RULES.playerY - 60 - object.y) / object.speed);
    const leave = Math.min(gap.until - state.frame, (RULES.playerY + 60 - object.y) / object.speed);
    if (leave < enter) continue;
    const a = object.x + object.vx * enter, b = object.x + object.vx * leave;
    const radius = object.radius + 23;
    if (Math.min(a, b) <= gap.right + radius && Math.max(a, b) >= gap.left - radius) return true;
  }
  return false;
}

function spawn(state, type, x, speed, vx = 0, wave = false) {
  const object = { id: state.serial++, type, x, y: -45, speed, vx, radius: type === 'jade' ? 19 : type === 'ward' ? 32 : 26, wave };
  if (!blocksCorridor(state, object)) state.objects.push(object);
}

function spawnWall(state, speed) {
  // Three empty lanes, close enough to reach after noticing the approaching wall.
  const lane = Math.round((state.x - 58) / 86);
  const opening = Math.max(0, Math.min(5, lane - 1 + Math.floor(random(state) * 3) - 1));
  const left = 58 + opening * 86 + 4, right = 58 + (opening + 2) * 86 - 4;
  const gap = { left, right, spawned: state.frame, speed,
    from: state.frame + Math.floor((RULES.playerY - 60 + 45) / speed) - 12,
    until: state.frame + Math.ceil((RULES.playerY + 60 + 45) / speed) + 12 };
  state.corridors.push(gap);
  state.objects = state.objects.filter(object => !blocksCorridor(state, object));
  for (let column = 0; column < 8; column++) {
    if (column >= opening && column <= opening + 2) continue;
    spawn(state, 'hazard', 58 + column * 86, speed, 0, true);
  }
}

function touchesPickup(state, object) {
  const nearestY = Math.max(RULES.playerY - RULES.pickupReach, Math.min(RULES.playerY, object.y));
  const dx = state.x - object.x, dy = nearestY - object.y;
  return dx * dx + dy * dy < (object.radius + 15) ** 2;
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
  state.hit = state.collected = state.wardCollected = state.blocked = 0;
  if (state.cooldown > 0) state.cooldown--;
  const frame = state.frame;
  state.corridors = state.corridors.filter(gap => gap.until >= frame);
  if (state.rageAt < 0 && (state.jade >= RULES.goal - RULES.rageRemaining)) state.rageAt = frame;
  const rage = state.rageAt >= 0;
  const phase = frame < 600 ? 0 : frame < 1500 ? 1 : 2;
  const jadeGap = [42, 38, 34][phase];
  // Reaching the goal switches to pure survival; the last five jade trigger rage.
  if (state.jade < RULES.goal && frame >= 24 && frame % jadeGap === 24) {
    spawn(state, 'jade', 80 + Math.floor(random(state) * 7) * 93, 7.0 + phase * .7);
  }
  if (frame === 420 || frame === 1620) spawn(state, 'ward', 120 + Math.floor(random(state) * 6) * 96, 6.8);
  if (state.jade >= RULES.goal) state.objects = state.objects.filter(o => o.type !== 'jade');
  if (!rage) {
    const gap = [60, 40, 30][phase];
    if (frame >= 90 && frame % gap === 0) {
      const x = state.serial % 3 === 0 ? Math.max(55, Math.min(665, state.x + (random(state) - .5) * 170)) : 55 + random(state) * 610;
      const vx = (random(state) - .5) * [0.6, 1.4, 2.1][phase];
      spawn(state, 'hazard', x, 9.0 + phase * 1.2 + random(state), vx);
      if (phase > 0 && random(state) < [0, .24, .36][phase]) spawn(state, 'hazard', Math.max(45, Math.min(675, x + (x > 360 ? -135 : 135))), 9.2 + phase * 1.2, -vx);
    }
    if (frame >= 600 && frame % (phase === 2 ? 210 : 270) === 0) spawnWall(state, 9.3 + phase * .65);
  } else {
    const elapsed = frame - state.rageAt;
    const final = state.jade >= RULES.goal;
    // Keep the final five challenging, with breathing room between readable patterns.
    if (elapsed % (final ? 24 : 28) === 0) {
      const x = Math.max(50, Math.min(670, state.x + (random(state) - .5) * 120));
      spawn(state, 'hazard', x, final ? 13.0 : 12.0, (random(state) - .5) * 1.8);
      spawn(state, 'hazard', Math.max(45, Math.min(675, x + (x > 360 ? -150 : 150))), final ? 12.6 : 11.6, (random(state) - .5) * 1.8);
    }
    if (elapsed % (final ? 78 : 90) === 0) {
      spawn(state, 'hazard', 55, final ? 12.4 : 11.6, final ? 3.7 : 3.2);
      spawn(state, 'hazard', 665, final ? 12.4 : 11.6, final ? -3.7 : -3.2);
    }
    if (elapsed % (final ? 156 : 180) === 0) spawnWall(state, final ? 12.0 : 11.0);
  }
  // Move first and resolve gold pickups before damage, including same-frame overlaps.
  state.objects = state.objects.filter(object => {
    object.y += object.speed; object.x += object.vx;
    if (object.x < -50 || object.x > RULES.width + 50 || object.y >= RULES.height + 80) return false;
    if (object.type === 'ward' && touchesPickup(state, object)) {
      state.wardUntil = frame + RULES.wardSeconds * RULES.fps;
      state.wardCollected++;
      state.wardPickupX = object.x;
      state.wardPickupY = Math.max(RULES.playerY - RULES.pickupReach, Math.min(RULES.playerY, object.y));
      return false;
    }
    return true;
  });
  state.objects = state.objects.filter(object => {
    if (object.type === 'ward') return true;
    if (object.type === 'jade') {
      if (!touchesPickup(state, object)) return true;
      state.jade++; state.collected++;
      state.pickupX = object.x;
      state.pickupY = Math.max(RULES.playerY - RULES.pickupReach, Math.min(RULES.playerY, object.y));
      return false;
    }
    const dx = state.x - object.x, dy = RULES.playerY - object.y;
    if (frame < state.wardUntil && dx * dx + dy * dy < (object.radius + RULES.wardRadius) ** 2) {
      state.blocked++;
      state.blockX = object.x; state.blockY = object.y;
      return false;
    }
    // Damage retains the previous small body hitbox; pickup reach does not enlarge it.
    if (!state.cooldown && dx * dx + dy * dy < (object.radius + 15) ** 2) {
      state.shields--; state.cooldown = 60; state.hit = 1;
      return false;
    }
    return true;
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
