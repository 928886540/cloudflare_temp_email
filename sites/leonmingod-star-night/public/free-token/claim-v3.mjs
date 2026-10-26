import { verifyHuman } from './human-v2.mjs';
(() => {
  'use strict';
  const form = document.getElementById('oath-form');
  const input = document.getElementById('oath-input');
  const openButton = document.getElementById('open-confirm');
  const confirmDialog = document.getElementById('confirm-dialog');
  const refuseDialog = document.getElementById('refuse-dialog');
  const credentialsDialog = document.getElementById('credentials-dialog');
  const accept = document.getElementById('accept');
  const reject = document.getElementById('reject');
  const error = document.getElementById('claim-error');
  const baseUrl = document.getElementById('base-url');
  const apiKey = document.getElementById('api-key');
  const copyStatus = document.getElementById('copy-status');
  let busy = false;

  input.addEventListener('input', () => {
    const ready = input.value.trim() === '义父';
    openButton.disabled = !ready;
    form.dataset.ready = String(ready);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value.trim() !== '义父') return;
    error.hidden = true;
    confirmDialog.showModal();
  });
  reject.addEventListener('click', () => {
    if (busy) return;
    confirmDialog.close();
    refuseDialog.showModal();
  });
  document.getElementById('close-refuse').addEventListener('click', () => refuseDialog.close());
  confirmDialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });

  accept.addEventListener('click', async () => {
    if (busy || input.value.trim() !== '义父') return;
    busy = true;
    accept.disabled = reject.disabled = true;
    accept.textContent = '正在准备见面礼…';
    error.hidden = true;
    try {
      const humanToken = await verifyHuman('oath_claim');
      const response = await fetch('/api/free-token/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ oath: input.value.trim(), confirmed: true, humanToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '领取失败，请稍后重试。');
      if (!data.baseUrl || !data.apiKey) throw new Error('见面礼还没准备好，请稍后重试。');
      baseUrl.value = data.baseUrl;
      apiKey.value = data.apiKey;
      copyStatus.textContent = '';
      confirmDialog.close();
      credentialsDialog.showModal();
    } catch (failure) {
      error.textContent = failure instanceof TypeError ? '网络有些波动，请再试一次。' : failure.message;
      error.hidden = false;
    } finally {
      busy = false;
      accept.disabled = reject.disabled = false;
      accept.textContent = '确认，拜义父';
    }
  });
  document.getElementById('close-credentials').addEventListener('click', () => credentialsDialog.close());
  credentialsDialog.addEventListener('close', () => { baseUrl.value = ''; apiKey.value = ''; copyStatus.textContent = ''; });

  async function copy(text, message, field) {
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = message;
    } catch {
      field.focus();
      field.select();
      copyStatus.textContent = '已选中，请长按或使用 Ctrl+C 复制。';
    }
  }
  document.getElementById('copy-url').addEventListener('click', () => copy(baseUrl.value, '接口地址已复制。', baseUrl));
  document.getElementById('copy-key').addEventListener('click', () => copy(apiKey.value, '贵宾密钥已复制。', apiKey));
  document.getElementById('copy-all').addEventListener('click', () => copy(`Base URL: ${baseUrl.value}\nAPI Key: ${apiKey.value}`, '接口地址与贵宾密钥已复制。', apiKey));
})();
