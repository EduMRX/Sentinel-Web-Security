/* Sentinel Web Security — MV3 service worker
 * Captura sem limites artificiais: URLs completas, todos os headers de req/resp,
 * corpos de requisição integrais e cookies completos (nome + valor + atributos).
 * Coleta somente após permissão explícita e ativação pelo usuário.
 */
'use strict';

const SESSION_KEY = 'sentinel.session.v1';
const ENABLED_KEY = 'sentinel.enabled.v1';

const MAX_REQUESTS_PER_TAB = 100000;
const MAX_TABS = 10000;
const MAX_PENDING = 100000;

let enabled = false;
let store = { requests: {}, documents: {}, touched: {} };
const pending = new Map();
let saveTimer = null;

const ready = (async () => {
  try {
    const [local, session] = await Promise.all([
      chrome.storage.local.get(ENABLED_KEY),
      chrome.storage.session.get(SESSION_KEY)
    ]);
    enabled = local[ENABLED_KEY] === true;
    if (session[SESSION_KEY]) {
      const saved = session[SESSION_KEY];
      store = {
        requests: saved.requests || {},
        documents: saved.documents || {},
        touched: saved.touched || {}
      };
    }
    const access = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    if (!access) enabled = false;
  } catch (error) {
    console.warn('Sentinel: falha ao iniciar armazenamento', error);
    enabled = false;
  }
  await updateBadge();
})();

function cleanUrl(input) {
  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function captureHeaders(headers = []) {
  const result = {};
  for (const header of headers) {
    const rawName = String(header.name || '');
    if (!rawName) continue;
    const key = rawName.toLowerCase();
    const value = String(header.value || '');
    if (Object.hasOwn(result, key)) {
      result[key] = `${result[key]}, ${value}`;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function summarizeBody(body) {
  if (!body) return null;
  try {
    if (body.formData) {
      const out = {};
      for (const [k, v] of Object.entries(body.formData)) {
        out[k] = Array.isArray(v)
          ? v.map(item => typeof item === 'string' ? item : '[binário]')
          : [String(v)];
      }
      return { kind: 'formData', data: out };
    }
    if (body.raw && body.raw.length) {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let text = '';
      for (const chunk of body.raw) {
        if (chunk?.bytes) text += decoder.decode(chunk.bytes);
      }
      return { kind: 'raw', data: text };
    }
  } catch {}
  return null;
}

function touch(tabId) {
  store.touched[tabId] = Date.now();
  const ids = Object.keys(store.touched);
  if (ids.length > MAX_TABS) {
    ids.sort((a, b) => store.touched[a] - store.touched[b]);
    for (const id of ids.slice(0, ids.length - MAX_TABS)) {
      delete store.touched[id];
      delete store.requests[id];
      delete store.documents[id];
    }
  }
}

function queueSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    chrome.storage.session.set({ [SESSION_KEY]: store })
      .catch(error => console.warn('Sentinel: falha ao salvar sessão (cota?)', error));
  }, 200);
}

async function updateBadge() {
  await chrome.action.setBadgeBackgroundColor({ color: enabled ? '#0d9f77' : '#5b6473' });
  await chrome.action.setBadgeText({ text: enabled ? 'ON' : '' });
}

function record(details, error = null) {
  const first = pending.get(details.requestId);
  pending.delete(details.requestId);
  if (details.tabId < 0) return;
  const url = cleanUrl(details.url);
  if (!url) return;

  const row = {
    id: `${details.requestId}-${Math.round(details.timeStamp)}`,
    url,
    method: first?.method || details.method || 'GET',
    type: first?.type || details.type || 'other',
    status: error ? null : (details.statusCode ?? null),
    duration: first ? Math.max(0, Math.round(details.timeStamp - first.time)) : null,
    at: Math.round(details.timeStamp),
    error: error ? String(error) : null,
    fromCache: Boolean(details.fromCache),
    requestHeaders: first?.requestHeaders || null,
    responseHeaders: first?.responseHeaders || null,
    requestBody: first?.requestBody || null,
    redirectUrl: first?.redirectUrl || null,
    ip: details.ip || null
  };
  const key = String(details.tabId);
  const rows = store.requests[key] || [];
  rows.unshift(row);
  if (rows.length > MAX_REQUESTS_PER_TAB) rows.length = MAX_REQUESTS_PER_TAB;
  store.requests[key] = rows;
  touch(key);
  queueSave();
}

chrome.webRequest.onBeforeRequest.addListener(details => {
  void (async () => {
    await ready;
    if (!enabled || details.tabId < 0 || !cleanUrl(details.url)) return;
    if (pending.size > MAX_PENDING) pending.clear();
    pending.set(details.requestId, {
      time: details.timeStamp,
      method: details.method || 'GET',
      type: details.type,
      requestHeaders: null,
      responseHeaders: null,
      requestBody: summarizeBody(details.requestBody)
    });
    if (details.type === 'main_frame') {
      const key = String(details.tabId);
      store.requests[key] = [];
      store.documents[key] = {
        url: cleanUrl(details.url),
        headers: null,
        status: null,
        capturedAt: null
      };
      touch(key);
      queueSave();
    }
  })();
}, { urls: ['<all_urls>'] }, ['requestBody']);

chrome.webRequest.onBeforeSendHeaders.addListener(details => {
  void (async () => {
    await ready;
    if (!enabled || details.tabId < 0) return;
    const entry = pending.get(details.requestId);
    if (entry) entry.requestHeaders = captureHeaders(details.requestHeaders);
  })();
}, { urls: ['<all_urls>'] }, ['requestHeaders', 'extraHeaders']);

chrome.webRequest.onHeadersReceived.addListener(details => {
  void (async () => {
    await ready;
    if (!enabled || details.tabId < 0) return;
    const entry = pending.get(details.requestId);
    if (entry) entry.responseHeaders = captureHeaders(details.responseHeaders);
    if (details.type === 'main_frame') {
      const key = String(details.tabId);
      store.documents[key] = {
        url: cleanUrl(details.url),
        headers: captureHeaders(details.responseHeaders),
        status: details.statusCode || null,
        capturedAt: Date.now()
      };
      touch(key);
      queueSave();
    }
  })();
}, { urls: ['<all_urls>'] }, ['responseHeaders', 'extraHeaders']);

chrome.webRequest.onCompleted.addListener(details => {
  void (async () => {
    await ready;
    if (enabled) record(details);
    else pending.delete(details.requestId);
  })();
}, { urls: ['<all_urls>'] });

chrome.webRequest.onErrorOccurred.addListener(details => {
  void (async () => {
    await ready;
    if (enabled) record(details, details.error || 'Falha de rede');
    else pending.delete(details.requestId);
  })();
}, { urls: ['<all_urls>'] });

chrome.webRequest.onBeforeRedirect.addListener(details => {
  void (async () => {
    await ready;
    if (!enabled) { pending.delete(details.requestId); return; }
    const entry = pending.get(details.requestId);
    if (!entry) return;
    entry.redirectUrl = details.redirectUrl || null;
    entry.responseHeaders = entry.responseHeaders || captureHeaders(details.responseHeaders);
    record(details);
  })();
}, { urls: ['<all_urls>'] }, ['responseHeaders']);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void (async () => {
    await ready;
    const tabId = Number(message?.tabId);
    const key = String(tabId);
    switch (message?.type) {
      case 'GET_STATE': {
        const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
        sendResponse({
          ok: true, enabled, granted,
          requests: Number.isInteger(tabId) ? (store.requests[key] || []) : [],
          document: Number.isInteger(tabId) ? (store.documents[key] || null) : null
        });
        return;
      }
      case 'SET_MONITORING': {
        if (message.enabled === true) {
          const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
          if (!granted) { sendResponse({ ok: false, error: 'Permissão para sites não concedida.' }); return; }
        }
        enabled = message.enabled === true;
        if (!enabled) pending.clear();
        await chrome.storage.local.set({ [ENABLED_KEY]: enabled });
        await updateBadge();
        sendResponse({ ok: true, enabled });
        return;
      }
      case 'CLEAR_TAB': {
        if (!Number.isInteger(tabId) || tabId < 0) throw new Error('Aba inválida.');
        delete store.requests[key];
        delete store.documents[key];
        delete store.touched[key];
        await chrome.storage.session.set({ [SESSION_KEY]: store });
        sendResponse({ ok: true });
        return;
      }
      case 'CLEAR_ALL': {
        store = { requests: {}, documents: {}, touched: {} };
        pending.clear();
        await chrome.storage.session.set({ [SESSION_KEY]: store });
        sendResponse({ ok: true });
        return;
      }
      default: sendResponse({ ok: false, error: 'Comando desconhecido.' });
    }
  })().catch(error => sendResponse({ ok: false, error: String(error?.message || error) }));
  return true;
});

chrome.permissions.onRemoved.addListener(() => {
  void (async () => {
    await ready;
    const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    if (granted) return;
    enabled = false;
    pending.clear();
    store = { requests: {}, documents: {}, touched: {} };
    await Promise.all([
      chrome.storage.local.set({ [ENABLED_KEY]: false }),
      chrome.storage.session.remove(SESSION_KEY)
    ]);
    await updateBadge();
  })();
});

chrome.tabs.onRemoved.addListener(tabId => {
  void (async () => {
    await ready;
    const key = String(tabId);
    delete store.requests[key];
    delete store.documents[key];
    delete store.touched[key];
    queueSave();
  })();
});