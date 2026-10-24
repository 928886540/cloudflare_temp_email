import { effectsStyles, effectsMarkup, effectsScripts } from './token-scene.js';

export const claimStyles = `
${effectsStyles}
body { scroll-padding-bottom: 16px; }
.backdrop { z-index: 0; }
.topbar { z-index: 2; width: min(840px,calc(100% - 48px)); margin: auto; padding: 18px 0 12px; }
main { z-index: 2; width: min(840px,calc(100% - 48px)); margin: 12px auto 0; padding-bottom: 16px; }
.invitation { grid-template-columns: .85fr 1.15fr; min-height: 500px; }
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
@media (max-width: 740px) {
  .topbar { width: min(340px,calc(100% - 40px)); padding: 14px 0 8px; }
  main { width: min(340px,calc(100% - 40px)); margin-top: 8px; }
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
  .topbar { padding-top: 10px; }
  main { margin-top: 4px; }
  .gift-art { min-height: 72px; padding-top: 4px; padding-bottom: 4px; }
  .token-visual, .gift-art img { height: 68px; }
  .art-orbit { width: 84px; height: 84px; }
  .ritual { padding-top: 16px; padding-bottom: 14px; }
  .eyebrow { margin-bottom: 7px; }
  h1 { font-size: 28px; }
  .intro { margin: 8px 0 12px; }
  .input-wrap input { height: 44px; }
  .input-hint { margin-bottom: 10px; }
}
@media (min-width: 741px) and (max-height: 600px) {
  .topbar { padding-top: 10px; padding-bottom: 6px; }
  main { margin-top: 4px; }
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
