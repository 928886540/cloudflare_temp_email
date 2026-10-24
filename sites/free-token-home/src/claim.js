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

/* 移除顶部导航、品牌小尾巴等边角料，保持全景仙境视野 */
.topbar, .page-foot {
  display: none !important;
}

body {
  scroll-padding-bottom: 16px;
  margin: 0;
  cursor: pointer;
}
.invitation, dialog {
  cursor: default;
}

main { z-index: 2; width: min(840px,calc(100% - 32px)); margin: auto; padding: 0; }
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

/* 横屏桌面：完美置中，舒适沉浸 */
@media (min-width: 768px) and (orientation: landscape) {
  html, body {
    min-height: 100vh;
    min-height: 100dvh;
  }
  body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 0;
  }
  main {
    width: min(860px, calc(100% - 48px));
    margin: auto;
    padding-bottom: 0;
  }
}

/* 竖屏手机：高度有限，居中布局，保证首屏操作通畅 */
@media (max-width: 740px) {
  html, body {
    min-height: 100vh;
    min-height: 100dvh;
  }
  body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 16px 0;
  }
  main { width: min(340px,calc(100% - 32px)); margin: auto; }
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

export const exitScript = `<script>
document.addEventListener('DOMContentLoaded', function() {
  function exitToOrigin() {
    if (window.history.length > 1 && document.referrer && document.referrer.includes(location.hostname)) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }

  // 点击空白区域（卡片外任意位置）退出
  document.addEventListener('click', function(e) {
    var openDialog = document.querySelector('dialog[open]');
    if (openDialog) {
      var rect = openDialog.getBoundingClientRect();
      var inDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!inDialog) openDialog.close();
      return;
    }
    if (e.target.closest('.invitation')) return;
    exitToOrigin();
  });

  // 按 Escape 键退出
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !document.querySelector('dialog[open]')) {
      exitToOrigin();
    }
  });
});
</script>`;

export function renderClaim(response) {
  const updated = new HTMLRewriter()
    .on('title', { element: element => element.setInnerContent('LeonMinGod · 仙玉令牌领取 | 贵宾密钥') })
    .on('link[rel="icon"]', { element: element => element.setAttribute('href', '/assets/logo.svg') })
    .on('head', { element: element => element.append(
      `<style id="free-token-compact-layout">${claimStyles}</style>${effectsScripts}${exitScript}`, { html: true }) })
    .on('body', { element: element => element.prepend(effectsMarkup, { html: true }) })
    .transform(response);
  const headers = new Headers(updated.headers);
  headers.set('Cache-Control', 'no-cache');
  headers.delete('Content-Length');
  headers.delete('ETag');
  return new Response(updated.body, { status: updated.status, statusText: updated.statusText, headers });
}
