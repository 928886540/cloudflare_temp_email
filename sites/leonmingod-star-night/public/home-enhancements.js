(() => {
  'use strict';
  const orb = document.getElementById('spirit-orb');
  const status = document.getElementById('orb-status');
  if (!orb) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let resetTimer;
  orb.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') document.body.classList.add('orb-hover');
  });
  orb.addEventListener('pointerleave', () => document.body.classList.remove('orb-hover'));
  orb.addEventListener('click', () => {
    clearTimeout(resetTimer);
    document.body.classList.add('orb-awake');
    status.textContent = '正在进入免费 Token。';
    if (!reducedMotion.matches) {
      orb.querySelectorAll('.orb-ripple').forEach(node => node.remove());
      for (let index = 0; index < 3; index++) {
        const ring = document.createElement('span');
        ring.className = 'orb-ripple';
        ring.setAttribute('aria-hidden', 'true');
        ring.style.animationDelay = `${index * .16}s`;
        ring.addEventListener('animationend', () => ring.remove(), { once: true });
        orb.append(ring);
      }
    }
    const bounds = orb.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('spirit-orb:cast', { detail: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 } }));
    resetTimer = setTimeout(() => {
      document.body.classList.remove('orb-awake');
    }, 1700);
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(resetTimer);
    document.body.classList.remove('orb-awake', 'orb-hover');
    orb.querySelectorAll('.orb-ripple').forEach(node => node.remove());
  });
})();
