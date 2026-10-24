const svg = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const mail = svg('<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7 7.5 6 7.5-6"/>');
const gift = svg('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M3 7h18v4H3zM12 7v13M12 7H8a2.5 2.5 0 1 1 2.5-2.5L12 7Zm0 0h4a2.5 2.5 0 1 0-2.5-2.5L12 7Z"/>');
const address = svg('<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>');
export const navigation = `<a class="enter jade-pill" href="https://mail.leonmingod.com" aria-label="进入 LeonMinGod 邮箱">${mail}<span>进入灵境</span></a><a class="gift-link jade-pill" href="/free-token/">${gift}<span>免费Token</span></a><a class="gift-link address-link jade-pill" href="https://addr.leonmingod.com" aria-label="地址证明">${address}<span>地址证明</span></a>`;

export const styles = `
:root { background: #041a16; color: #e4efe2; }
.cover { filter: brightness(1.03) saturate(.96); }
.cover-palm { filter: brightness(1.11) saturate(1.08); }
.vignette { background: linear-gradient(#031a1530,transparent 15%,transparent 76%,#031a157d); }
.interface { padding: max(14px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(15px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left)); }
.topbar { max-width: 100%; justify-content: flex-end; }
.scene-controls { gap: 2px; padding: 1px 4px; border-color: #c5e3bd25; background: #092b2252; box-shadow: inset 0 0 18px #d0f1cb05; backdrop-filter: blur(12px); max-width: 100%; }
.scene-controls button { min-height: 30px; padding: 0 8px; color: #d1e5ce; font-size: 10px; }
.scene-controls svg { stroke: #dccb96; }
.toggle-indicator { background: #9fe0b4; box-shadow: 0 0 8px #9fe0b466; }
.entry { gap: 0; padding-bottom: 0; }
.entry-actions { display: flex; align-items: center; justify-content: center; flex-wrap: nowrap; width: auto; max-width: 100%; gap: 7px; }
.entry-actions > a.jade-pill { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; gap: 5px; width: auto; min-height: 36px; padding: 0 10px; border: 1px solid #c9e5be59; border-radius: 999px; background: linear-gradient(140deg,#12392a30,#061c1757); color: #f0efd2; font-family: "KaiTi","STKaiti","PingFang SC",serif; font-size: 12px; line-height: 1.4; font-weight: 400; letter-spacing: .035em; white-space: nowrap; text-shadow: 0 1px 5px #05150f80; box-shadow: 0 2px 12px #01110a18,inset 0 1px 0 #f3f9dd12; backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px); transition: background .2s,border-color .2s,transform .2s; }
.entry-actions > a.enter { border-color: #e6d5a47d; background: linear-gradient(140deg,#3d57322e,#0b2a1f60); }
.entry-actions > a.jade-pill svg { width: 14px; height: 14px; flex: 0 0 auto; fill: none; stroke: #d8e7bd; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.entry-actions > a.enter svg { stroke: #f2e1a8; }
.entry-actions > a.jade-pill:hover { background: #30513a73; border-color: #e3edc6ad; transform: translateY(-2px); box-shadow: 0 0 16px #c4e8ac12; }
.entry-actions > a.jade-pill { position: relative; }
.entry-actions > a.jade-pill::after { content: ""; position: absolute; inset: -5px 0; border-radius: inherit; }
.slogan { display: none; }
.footer-meta { margin-top: 9px; color: #c9ddc3; font-size: 9px; opacity: .7; }
#pointer-light { background: radial-gradient(circle,#fff 5%,#d9ffe0 26%,#83dba288 58%,transparent 75%); box-shadow: 0 0 10px #abedb399; }

/* Landscape Circular Navigation & Typography */
@media (min-width: 768px) and (orientation: landscape) {
  .cover img { object-position: 70% center; }
  .interface { padding: 24px 38px 20px 38px; }
  .scene-controls { gap: 4px; padding: 3px 8px; border-radius: 30px; }
  .scene-controls button { min-height: 38px; padding: 0 14px; color: #e2f2df; font-size: 13px; font-weight: 500; letter-spacing: .06em; gap: 8px; }
  .scene-controls svg { width: 16px; height: 16px; stroke: #ebd8a0; stroke-width: 1.4; }
  .toggle-indicator { width: 7px; height: 7px; }
  .footer-meta { font-size: 13px; color: #d4ebd0; opacity: .88; letter-spacing: .08em; text-shadow: 0 2px 8px #020f0b; }

  .entry { position: fixed; inset: 0; pointer-events: none; }
  .entry-actions { position: absolute; inset: 0; pointer-events: none; }
  .entry-actions > a.jade-pill {
    position: absolute;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: clamp(92px, min(7.3vw, 14.5vmin), 136px);
    height: clamp(92px, min(7.3vw, 14.5vmin), 136px);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    background: radial-gradient(circle at 35% 30%, rgba(26, 94, 69, 0.9) 0%, rgba(12, 58, 44, 0.94) 60%, rgba(5, 33, 25, 0.98) 100%);
    border: 2px solid rgba(175, 235, 185, 0.55);
    color: #f2faef;
    font-size: clamp(13px, 1.45vmin, 15px);
    font-weight: 600;
    letter-spacing: .06em;
    text-shadow: 0 1px 6px #01130d, 0 0 12px #4ade8050;
    box-shadow: 0 6px 24px #02140d70, 0 0 28px #48d28a38, inset 0 1px 3px #f5fff035, inset 0 0 16px #34d39925;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: transform .25s cubic-bezier(.2,.8,.3,1), border-color .25s, box-shadow .25s, background .25s;
  }
  .entry-actions > a.jade-pill svg {
    width: clamp(22px, 2.8vmin, 28px);
    height: clamp(22px, 2.8vmin, 28px);
    stroke-width: 1.5;
    stroke: #bbf7d0;
    filter: drop-shadow(0 0 6px #4ade8060);
  }
  .entry-actions > a.enter {
    left: 60.8%;
    top: 72.1%;
    border-color: rgba(235, 215, 155, 0.65);
    background: radial-gradient(circle at 35% 30%, rgba(42, 98, 70, 0.92) 0%, rgba(18, 62, 46, 0.95) 60%, rgba(7, 35, 24, 0.98) 100%);
    box-shadow: 0 6px 24px #02140d70, 0 0 28px #eab30835, inset 0 1px 3px #fef9c335, inset 0 0 16px #4ade8025;
  }
  .entry-actions > a.enter svg {
    stroke: #fef08a;
    filter: drop-shadow(0 0 6px #facc1560);
  }
  .entry-actions > a.gift-link:not(.address-link) {
    left: 69.9%;
    top: 72.8%;
  }
  .entry-actions > a.address-link {
    left: 80.9%;
    top: 74.3%;
  }
  .entry-actions > a.jade-pill:hover {
    transform: translate(-50%, -50%) translateY(-5px) scale(1.06);
    border-color: #d1fae5;
    background: radial-gradient(circle at 35% 28%, rgba(32, 115, 85, 0.95) 0%, rgba(16, 70, 55, 0.98) 60%, rgba(6, 39, 30, 1) 100%);
    box-shadow: 0 10px 32px #02140d90, 0 0 38px #4ade8065, inset 0 1px 4px #ffffff55, inset 0 0 22px #4ade8040;
  }
  .entry-actions > a.enter:hover {
    border-color: #fef08a;
    background: radial-gradient(circle at 35% 28%, rgba(48, 120, 88, 0.95) 0%, rgba(22, 75, 55, 0.98) 60%, rgba(8, 42, 29, 1) 100%);
    box-shadow: 0 10px 32px #02140d90, 0 0 38px #facc1555, inset 0 1px 4px #ffffff55, inset 0 0 22px #4ade8040;
  }
}

/* Portrait adjustments */
@media (max-width: 767px), (orientation: portrait) {
  .interface { padding: max(14px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(15px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left)); }
  .scene-controls { gap: 1px; padding: 1px 3px; }
  .scene-controls button { min-height: 28px; padding: 0 7px; font-size: 9.5px; }
  .entry-actions { gap: 6px; }
  .entry-actions > a.jade-pill { min-height: 35px; padding: 0 9px; font-size: 12px; }
  .vignette { background: linear-gradient(#031a1530,transparent 14%,transparent 78%,#031a1570); }
  .footer-meta { font-size: 10px; margin-top: 8px; }
}
@media (max-width: 359px) {
  .entry-actions { gap: 4px; }
  .entry-actions > a.jade-pill { padding: 0 6px; gap: 4px; font-size: 11px; }
  .scene-controls button { padding: 0 5px; font-size: 9px; }
}
@media (max-height: 520px) and (orientation: landscape) {
  .interface { padding: 12px 20px 10px 20px; }
  .scene-controls button { min-height: 32px; font-size: 11px; padding: 0 10px; }
  .footer-meta { font-size: 10px; margin-top: 4px; }
  .entry-actions > a.jade-pill {
    width: clamp(62px, 15vmin, 76px);
    height: clamp(62px, 15vmin, 76px);
    font-size: 10px;
    gap: 4px;
  }
  .entry-actions > a.jade-pill svg { width: 16px; height: 16px; }
}
`;

export function renderHomepage(response) {
  const updated = new HTMLRewriter()
    .on('title', { element: element => element.setInnerContent('LeonMinGod · 青玉流光') })
    .on('.cover source', { element: element => element.setAttribute('srcset', '/home-hero-desktop-v4.webp') })
    .on('.cover img', { element(element) {
      element.setAttribute('src', '/home-hero-mobile-v4.webp');
      if (element.getAttribute('id') !== 'palm-image') element.setAttribute('alt', 'LeonMinGod：白衣仙子立于玉绿色山水之间，掌心一团青玉流光');
    } })
    .on('script[src^="scene.js"]', { element: element => element.setAttribute('src', '/home-scene-v4.js') })
    .on('nav.entry-actions', { element: element => element.setInnerContent(navigation, { html: true }) })
    .on('head', { element: element => element.append(`<style id="homepage-jade-layout">${styles}</style>`, { html: true }) })
    .transform(response);
  const headers = new Headers(updated.headers);
  headers.set('Cache-Control', 'no-cache');
  headers.delete('Content-Length');
  headers.delete('ETag');
  return new Response(updated.body, { status: updated.status, statusText: updated.statusText, headers });
}
