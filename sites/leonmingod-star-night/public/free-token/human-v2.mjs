let loader;
function load() {
  if (window.turnstile) return Promise.resolve();
  if (!loader) loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.onload = resolve; script.onerror = () => { loader = null; reject(new Error('验证加载失败，请稍后再试。')); };
    document.head.append(script);
  });
  return loader;
}
export async function verifyHuman(action) {
  const response = await fetch('/api/free-token/security', { cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw new Error('暂时无法验证，请稍后再试。');
  const config = await response.json();
  if (config.local && ['localhost', '127.0.0.1'].includes(location.hostname)) return 'local-test';
  if (config.required === false) return '';
  if (!config.siteKey) throw new Error('验证暂时不可用，请稍后再试。');
  await load();
  return new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog'), label = document.createElement('p'), host = document.createElement('div');
    dialog.style.cssText = 'color:#e5edda;background:#0b242b;border:1px solid #91ae8b;border-radius:18px;padding:18px;max-width:calc(100vw - 48px)';
    label.textContent = '验证后继续'; label.style.cssText = 'margin:0 0 12px;text-align:center';
    dialog.append(label, host); document.body.append(dialog); dialog.showModal();
    let widget, settled = false;
    const timeout = setTimeout(() => finish(new Error('验证超时，请重试。')), 120000);
    const finish = (error, token) => {
      if (settled) return; settled = true; clearTimeout(timeout);
      if (widget !== undefined) window.turnstile.remove(widget);
      dialog.close(); dialog.remove(); error ? reject(error) : resolve(token);
    };
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(new Error('验证已取消。')); });
    widget = window.turnstile.render(host, { sitekey: config.siteKey, action, theme: 'dark', size: 'compact', callback: token => finish(null, token), 'error-callback': () => finish(new Error('验证失败，请重试。')), 'expired-callback': () => finish(new Error('验证已过期，请重试。')) });
  });
}
