// Presentation only; rewards and collisions remain in the shared/server engine.
export function lossSummary(state, rules) {
  const survived = Math.min(rules.frames, state.frame) / rules.fps;
  const seconds = survived < 10 ? survived.toFixed(1) : String(Math.floor(survived));
  const jade = Math.max(0, rules.goal - state.jade);
  const time = Math.max(0, Math.ceil((rules.frames - state.frame) / rules.fps));
  const collected = Math.min(rules.goal, state.jade);
  if (!time) return `撑满 ${rules.frames / rules.fps} 秒，收集 ${collected} / ${rules.goal} 枚灵玉。\n只差 ${jade} 枚，下次接稳一点。`;
  if (!jade) return `灵玉已集齐，撑过 ${seconds} 秒。\n离通关只剩 ${time} 秒。`;
  return `撑过 ${seconds} 秒，收集 ${collected} / ${rules.goal} 枚灵玉。\n还差 ${jade} 枚，再坚持 ${time} 秒。`;
}

export function createSound(button) {
  let enabled = true, context, last = 0;
  try { enabled = localStorage.getItem('lmg-game-sound') !== 'off'; } catch {}
  function render() {
    button.textContent = enabled ? '♪' : '♩';
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? '关闭音效' : '开启音效');
  }
  function unlock() {
    if (!enabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context ||= new Audio();
      context.resume().catch(() => {});
    } catch {}
  }
  function play(kind) {
    if (!enabled || !context || context.state !== 'running' || document.hidden) return;
    const now = context.currentTime;
    if (now - last < .085) return;
    last = now;
    const note = context.createOscillator(), gain = context.createGain();
    const frequencies = { pickup: 880, gold: 660, deflect: 330, near: 1180 };
    note.type = 'sine'; note.frequency.setValueAtTime(frequencies[kind] || 880, now);
    note.frequency.exponentialRampToValueAtTime((frequencies[kind] || 880) * 1.45, now + .09);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.035, now + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .16);
    note.connect(gain); gain.connect(context.destination); note.start(now); note.stop(now + .17);
    note.onended = () => { note.disconnect(); gain.disconnect(); };
  }
  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem('lmg-game-sound', enabled ? 'on' : 'off'); } catch {}
    render(); if (enabled) { unlock(); } else { context?.suspend().catch(() => {}); }
  });
  window.addEventListener('pagehide', () => { context?.suspend().catch(() => {}); });
  render(); return { unlock, play };
}
