export default `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#050d1b">
  <meta name="description" content="免费 Token · Leon🌙 的见面礼，叫对了就送。">
  <title>免费 Token · LeonMinGod</title>
  <link rel="icon" href="/favicon.png">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-width: 280px; min-height: 100%; background: #050d1b; color: #f4e5c4; }
    body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
    body::before { content: ""; position: fixed; inset: -40px; background: url("/free-token/welcome-mobile-v1.webp") center / cover no-repeat; filter: blur(30px) brightness(.27); pointer-events: none; }
    .welcome { position: relative; display: flex; flex-direction: column; height: 100vh; height: 100svh; min-height: 340px; }
    .back { position: absolute; z-index: 1; top: max(12px, env(safe-area-inset-top)); left: max(12px, env(safe-area-inset-left)); display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px solid #c6d9e62b; border-radius: 24px; background: #05101ca6; color: #e2eaf2; text-decoration: none; font-size: 12px; backdrop-filter: blur(12px); }
    .art { flex: 1 1 auto; min-height: 0; width: 100%; display: flex; justify-content: center; }
    .art picture { display: block; width: 100%; height: 100%; }
    .art img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .actions { flex: 0 0 auto; position: relative; display: flex; justify-content: center; padding: 14px max(24px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left)); }
    .enter { display: inline-flex; align-items: center; justify-content: center; gap: 24px; min-height: 52px; width: min(100%, 360px); padding: 12px 28px; border: 1px solid #d8be83; border-radius: 6px; background: linear-gradient(110deg, #14343bea, #091725f2); color: #f9e6ba; font: 600 17px/1.5 "KaiTi", "STKaiti", "Noto Serif SC", serif; letter-spacing: .12em; text-decoration: none; box-shadow: 0 0 24px #67c6e519, inset 0 0 24px #c8b47d0d; transition: border-color .2s, background .2s; }
    .enter span { font-family: sans-serif; font-size: 21px; line-height: 1; }
    .enter:hover { border-color: #ffedbf; background: #153c46; }
    a:focus-visible { outline: 3px solid #b6e9fb; outline-offset: 5px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (min-width: 768px) and (orientation: landscape) {
      body::before { background-image: url("/free-token/welcome-desktop-v1.webp"); }
      .actions { padding-top: 16px; padding-bottom: max(24px, env(safe-area-inset-bottom)); }
      .enter { min-height: 54px; width: 340px; }
    }
    @media (max-height: 500px) and (orientation: landscape) {
      .actions { padding-top: 8px; padding-bottom: max(8px, env(safe-area-inset-bottom)); }
      .enter { min-height: 42px; padding: 7px 24px; font-size: 15px; }
    }
    @media (prefers-reduced-motion: reduce) { .enter { transition: none; } }
  </style>
</head>
<body>
  <main class="welcome">
    <h1 class="sr-only">免费 Token · 白嫖 Token？先叫声义父。</h1>
    <a class="back" href="/">← 返回首页</a>
    <div class="art">
      <picture>
        <source media="(min-width: 768px) and (orientation: landscape)" srcset="/free-token/welcome-desktop-v1.webp" width="1824" height="862">
        <img src="/free-token/welcome-mobile-v1.webp" width="941" height="1672" alt="LeonMinGod 免费 Token 海报：雪夜仙子递出青玉令牌。白嫖 Token？先叫声义父。Leon🌙 的见面礼，叫对了就送。" fetchpriority="high" decoding="async">
      </picture>
    </div>
    <nav class="actions" aria-label="领取入口">
      <a class="enter" href="/free-token/claim/">进入免费 Token <span aria-hidden="true">→</span></a>
    </nav>
  </main>
</body>
</html>`;
