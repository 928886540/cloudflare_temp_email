(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const markerKey = 'lmg-token-passage';
  if (root.classList.contains('token-arrival')) {
    setTimeout(() => {
      root.classList.remove('token-arrival');
      document.getElementById('oath-input')?.focus({ preventScroll: true });
    }, 680);
  }

  const entry = document.getElementById('token-entry');
  const art = entry?.querySelector('.token-art');
  if (!entry || !art) return;
  const welcome = document.querySelector('.welcome');
  const timers = new Set();
  let busy = false;
  let interaction = 0;
  const notice = document.getElementById('token-availability-notice');
  let noticeTimer;
  let overlay;
  let animation;
  let prefetched = false;
  let destination;

  function schedule(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }

  function reset() {
    interaction++;
    clearTimeout(noticeTimer);
    if (notice) notice.hidden = true;
    timers.forEach(clearTimeout);
    timers.clear();
    animation?.cancel();
    animation = undefined;
    overlay?.remove();
    overlay = undefined;
    busy = false;
    if (welcome) welcome.inert = false;
    entry.removeAttribute('aria-busy');
    document.body.classList.remove('token-transitioning');
    delete document.body.dataset.passage;
  }

  function prefetch() {
    if (prefetched || navigator.connection?.saveData) return;
    prefetched = true;
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = entry.href;
    hint.as = 'document';
    document.head.append(hint);
  }

  function navigate() {
    if (!busy) return;
    try {
      sessionStorage.setItem(markerKey, JSON.stringify({ at: Date.now(), destination: destination.pathname }));
    } catch {}
    try {
      location.assign(destination.href);
    } catch {
      reset();
    }
  }

  entry.addEventListener('pointerenter', prefetch, { once: true });
  entry.addEventListener('focus', prefetch, { once: true });
  function showNotice(message) {
    if (!notice) return;
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 2600);
  }

  entry.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || entry.target === '_blank') return;
    event.preventDefault();
    if (busy) return;
    destination = new URL(entry.href);
    if (destination.origin !== location.origin) return;
    busy = true;
    entry.setAttribute('aria-busy', 'true');
    const attempt = ++interaction;
    try {
      const response = await fetch('/api/free-token/status', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Availability check failed');
      const state = await response.json();
      if (attempt !== interaction) return;
      if (state.open !== true) { reset(); showNotice('暂未开放'); return; }
    } catch {
      if (attempt !== interaction) return;
      reset(); showNotice('暂时无法连接，请稍后再试'); return;
    }
    clearTimeout(noticeTimer);
    if (notice) notice.hidden = true;
    if (motion.matches || !art.animate || !art.complete || !art.naturalWidth) { location.assign(destination.href); return; }
    const bounds = art.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) { location.assign(destination.href); return; }
    prefetch();

    try {
      overlay = document.createElement('div');
      overlay.className = 'token-passage';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '<div class="passage-veil"></div><div class="passage-rings"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="109"/><circle cx="120" cy="120" r="104" stroke-dasharray="2 6"/><path d="m120 3 5 10-5 10-5-10Zm117 117-10 5-10-5 10-5ZM120 237l-5-10 5-10 5 10ZM3 120l10-5 10 5-10 5Z" fill="#e9ce8e"/><g class="sigil-inner"><circle cx="120" cy="120" r="85"/><path d="m120 27 16 49 45-22-22 45 49 21-49 17 22 46-45-23-16 50-18-50-44 23 22-46-49-17 49-21-22-45 44 22Z" stroke-opacity=".55"/><circle cx="120" cy="120" r="64" stroke="#c1ffbb" stroke-opacity=".6"/></g></svg><span class="passage-orbit"></span><span class="passage-orbit"></span></div><div class="passage-particles"></div><p class="passage-caption">仙令启境</p>';
      const particles = overlay.querySelector('.passage-particles');
      const radius = Math.min(innerWidth * .42, innerHeight * .32, 285);
      for (let index = 0; index < 6; index++) {
        const angle = index * Math.PI * 2 / 6;
        const particle = document.createElement('i');
        particle.className = 'passage-particle';
        particle.style.setProperty('--dx', `${Math.cos(angle) * radius}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * radius}px`);
        particle.style.setProperty('--delay', `${index % 4 * 30}ms`);
        particles.append(particle);
      }
      const token = document.createElement('img');
      token.className = 'passage-token';
      token.src = art.currentSrc || art.src;
      token.alt = '';
      token.style.width = `${bounds.width}px`;
      token.style.height = `${bounds.height}px`;
      overlay.append(token);
      const light = document.createElement('div');
      light.className = 'passage-light';
      overlay.append(light);
      document.body.append(overlay);

      const ratio = bounds.width / bounds.height;
      const width = Math.min(innerWidth * .64, innerHeight * .6 * ratio, 440);
      const scale = width / bounds.width;
      const x = innerWidth / 2 - bounds.width * .31;
      const y = innerHeight * .45 - bounds.height * .48;
      const from = `translate3d(${bounds.x}px, ${bounds.y}px, 0) scale(1) rotateY(0deg) rotate(0deg)`;
      const center = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      animation = token.animate([
        { transform: from, opacity: 1, offset: 0 },
        { transform: `${center} rotateY(-25deg) rotate(-7deg)`, opacity: 1, offset: .43, easing: 'cubic-bezier(.18,.7,.2,1)' },
        { transform: `${center} rotateY(8deg) rotate(2deg)`, opacity: 1, offset: .64 },
        { transform: `${center} rotateY(0deg) rotate(0deg)`, opacity: 1, offset: .78 },
        { transform: `translate3d(${x}px, ${y}px, 100px) scale(${scale * 1.1})`, opacity: 0, offset: 1 },
      ], { duration: 1500, easing: 'cubic-bezier(.2,.65,.2,1)', fill: 'both' });
      busy = true;
      document.body.classList.add('token-transitioning');
      document.body.dataset.passage = 'flying';
      if (welcome) welcome.inert = true;
      entry.setAttribute('aria-busy', 'true');
      schedule(() => { document.body.dataset.passage = 'centered'; }, 700);
      schedule(() => { document.body.dataset.passage = 'opening'; }, 1150);
      schedule(navigate, 1500);
    } catch {
      reset();
      location.assign(destination.href);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && busy) {
      event.preventDefault();
      reset();
      entry.focus({ preventScroll: true });
    }
  });
  motion.addEventListener('change', () => { if (motion.matches && busy) navigate(); });
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', () => { if (!busy) reset(); });
})();
