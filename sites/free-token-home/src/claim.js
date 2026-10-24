import { effectsStyles, effectsMarkup, effectsScripts } from './token-scene.js';

export const claimStyles = `
${effectsStyles}

/* 背景图：切换为 Free Token 首页专属海报背景 */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: linear-gradient(180deg, rgba(5, 13, 27, 0.48) 0%, rgba(5, 13, 27, 0.78) 100%), url('/free-token/welcome-mobile-v1.webp');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}
@media (orientation: landscape) {
  .backdrop {
    background-image: linear-gradient(90deg, rgba(5, 13, 27, 0.52) 0%, rgba(5, 13, 27, 0.25) 45%, rgba(5, 13, 27, 0.62) 100%), url('/free-token/welcome-desktop-v1.webp');
  }
}

body { scroll-padding-bottom: 16px; margin: 0; }
.topbar { z-index: 2; width: min(840px,calc(100% - 48px)); margin: auto; padding: 16px 0 10px; }
.topbar .back {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border-radius: 99px;
  background: rgba(7, 21, 34, 0.68);
  border: 1px solid rgba(181, 217, 197, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #e2eeea;
  text-decoration: none;
  font-size: 12px;
  transition: background .2s, border-color .2s;
}
.topbar .back:hover {
  background: rgba(14, 38, 48, 0.85);
  border-color: rgba(181, 217, 197, 0.55);
}
.topbar .brand { text-shadow: 0 1px 8px #02070c, 0 0 12px #041216; }

main { z-index: 2; width: min(840px,calc(100% - 48px)); margin: 10px auto 0; padding-bottom: 16px; }
.invitation { grid-template-columns: .85fr 1.15fr; min-height: 500px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-color: rgba(181, 217, 197, 0.24); }
.gift-art { padding: 30px 18px 24px; }
.token-visual, .gift-art img { width: 210px; height: 310px; }
.art-orbit { width: 250px; height: 250px; }
.ritual { padding: 36px 36px 28px; }
.eyebrow { margin-bottom: 16px; }
h1 { font-size: clamp(30px,3.4vw,39px); line-height: 1.35; }
.intro { margin: 14px 0 20px; line-height: 1.75; }
.input-wrap { margin-top: 11px; }
.input-wrap input { height: 48px; }
#input-check { top: 13px; }
.input-hint { margin: 8px 0 15px; }
.claim-button { min-height: 46px; }
.fine-print { margin-top: 12px; line-height: 1.6; }
.page-foot { margin-top: 16px; }
.modal { max-height: calc(100dvh - 32px); }

/* 横屏桌面：下移到视野中央舒适区，不再贴紧顶栏 */
@media (min-width: 768px) and (orientation: landscape) {
  html, body {
    min-height: 100vh;
    min-height: 100dvh;
  }
  body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    padding: max(28px, 4.5vh) 0 max(36px, 5vh);
  }
  .topbar {
    width: min(860px, calc(100% - 48px));
    margin: 0 auto;
    padding: 0 0 14px;
  }
  main {
    width: min(860px, calc(100% - 48px));
    margin: 0 auto;
    padding-bottom: 0;
  }
}

/* 竖屏手机：高度有限，靠上紧凑布局，保证首屏操作通畅 */
@media (max-width: 740px) {
  .topbar { width: min(340px,calc(100% - 40px)); padding: 12px 0 6px; }
  main { width: min(340px,calc(100% - 40px)); margin-top: 6px; }
  .invitation { min-height: auto; }
  .gift-art { min-height: 96px; padding: 8px 22px; }
  .token-visual { width: 86px; height: 88px; }
  .gift-art img { width: 60px; height: 88px; }
  .art-orbit { width: 104px; height: 104px; }
  .art-caption { font-size: 13px; letter-spacing: .18em; }
  .ritual { padding: 20px 22px 18px; }
  .eyebrow { margin-bottom: 10px; font-size: 8px; }
  h1 { font-size: 30px; line-height: 1.32; }
  .intro { margin: 10px 0 16px; font-size: 12px; line-height: 1.65; }
  form label { font-size: 12px; }
  .input-wrap { margin-top: 10px; }
  .input-wrap input { height: 46px; font-size: 16px; }
  .input-hint { margin: 8px 0 14px; }
  .fine-print { margin-top: 10px; font-size: 9px; }
  .page-foot { margin-top: 12px; font-size: 9px; }
  .modal { width: min(440px,calc(100% - 32px)); padding: 24px 22px; }
  .modal h2 { font-size: 24px; line-height: 1.45; }
  .dialog-actions { margin-top: 20px; }
}

@media (max-width: 740px) and (max-height: 640px) {
  .topbar { padding-top: 8px; }
  main { margin-top: 4px; }
  .gift-art { min-height: 72px; padding-top: 4px; padding-bottom: 4px; }
  .token-visual, .gift-art img { height: 68px; }
  .art-orbit { width: 84px; height: 84px; }
  .ritual { padding-top: 14px; padding-bottom: 12px; }
  .eyebrow { margin-bottom: 6px; }
  h1 { font-size: 27px; }
  .intro { margin: 6px 0 10px; }
  .input-wrap input { height: 42px; }
  .input-hint { margin-bottom: 8px; }
}

@media (min-width: 741px) and (max-height: 620px) {
  body { padding: 12px 0; }
  .topbar { padding-bottom: 6px; }
  .invitation { min-height: auto; }
  .ritual { padding: 18px 30px; }
  .gift-art { padding-top: 18px; padding-bottom: 16px; }
  .token-visual, .gift-art img { height: 240px; }
  h1 { font-size: 28px; }
  .intro { margin: 10px 0 14px; }
  .eyebrow { margin-bottom: 10px; }
}
`;

export function renderClaim(response) {
  const updated = new HTMLRewriter()
    .on('head', { element: element => element.append(
      `<style id="free-token-compact-layout">${claimStyles}</style>${effectsScripts}`, { html: true }) })
    .on('body', { element: element => element.prepend(effectsMarkup, { html: true }) })
    .transform(response);
  const headers = new Headers(updated.headers);
  headers.set('Cache-Control', 'no-cache');
  headers.delete('Content-Length');
  headers.delete('ETag');
  return new Response(updated.body, { status: updated.status, statusText: updated.statusText, headers });
}
