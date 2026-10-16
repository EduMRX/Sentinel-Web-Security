/* Popup Sentinel — UI moderna, sem bibliotecas. */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const state = {
  tabId: null, tabUrl: '', enabled: false, granted: false,
  requests: [], document: null, cookies: [], findings: [],
  view: 'overview', lastCookieRead: 0, busy: false, loading: false
};

const HEADER_LABELS = [
  ['content-security-policy', 'Content-Security-Policy'],
  ['strict-transport-security', 'Strict-Transport-Security'],
  ['x-content-type-options', 'X-Content-Type-Options'],
  ['x-frame-options', 'X-Frame-Options'],
  ['referrer-policy', 'Referrer-Policy'],
  ['permissions-policy', 'Permissions-Policy'],
  ['cross-origin-opener-policy', 'Cross-Origin-Opener-Policy']
];

const METHOD_CLASSES = {
  GET: 'get', POST: 'post', PUT: 'put', PATCH: 'patch',
  DELETE: 'delete', HEAD: 'head', OPTIONS: 'options'
};

function node(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== '') el.textContent = String(text);
  return el;
}
function append(p, ...c) { p.append(...c); return p; }
function empty(el) { el.replaceChildren(); }
function tabSupported(url) { return /^https?:\/\//i.test(url || ''); }
function toHostname(url) {
  try { return new URL(url).hostname; } catch { return '—'; }
}
function requestPath(url) {
  try {
    const p = new URL(url);
    const path = p.pathname === '/' ? '/' : p.pathname;
    return path + (p.search || '') + (p.hash || '');
  } catch { return url; }
}
function statusClass(s) {
  if (s == null || s >= 500) return 'bad';
  if (s >= 400) return 'warn';
  return 'ok';
}
function timeStr(d) { return d == null ? '—' : `${d} ms`; }
function fileStamp() { return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); }
function communicate(m) { return chrome.runtime.sendMessage(m); }

function hint(msg, error = false) {
  const el = $('#hint');
  if (!msg) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = msg;
  el.classList.toggle('error', error);
}

function makeRequestRow(item) {
  const method = String(item.method || 'GET').toUpperCase();
  const mcls = METHOD_CLASSES[method] || 'head';
  const row = node('div', 'request-row');
  append(row,
    node('span', `method-badge ${mcls}`, method),
    node('span', 'req-path', requestPath(item.url)),
    node('span', `http-status ${statusClass(item.status)}`, item.status ?? 'ERR'),
    node('span', 'time', timeStr(item.duration))
  );
  return row;
}

function makeHeadersBlock(headers) {
  const block = node('div', 'headers-block');
  const entries = Object.entries(headers || {});
  if (!entries.length) { block.append(node('div', 'header-line', '(nenhum)')); return block; }
  for (const [k, v] of entries) {
    const line = node('div', 'header-line');
    append(line, node('strong', '', `${k}: `), document.createTextNode(String(v)));
    block.append(line);
  }
  return block;
}

function makeBodyBlock(body) {
  if (!body) return null;
  const block = node('div', 'body-block');
  if (body.kind === 'formData') {
    block.textContent = Object.entries(body.data || {})
      .map(([k, v]) => `${k} = ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
  } else {
    block.textContent = body.data || '';
  }
  return block;
}

function makeRequestDetail(item) {
  const wrapper = node('details', 'request-detail');
  const summary = node('summary');
  summary.append(makeRequestRow(item));

  const details = node('div', 'detail-content');
  const lines = [
    ['URL completa', item.url],
    ['Método', item.method],
    ['Tipo', item.type],
    ['Início', new Date(item.at).toLocaleTimeString('pt-BR')],
    ['Duração', timeStr(item.duration)],
    ['Cache', item.fromCache ? 'Sim' : 'Não']
  ];
  if (item.ip) lines.push(['IP remoto', item.ip]);
  if (item.redirectUrl) lines.push(['Redirecionado para', item.redirectUrl]);
  if (item.error) lines.push(['Erro', item.error]);

  for (const [label, value] of lines) {
    const d = node('div');
    append(d, node('strong', '', `${label}: `), document.createTextNode(value));
    details.append(d);
  }

  if (item.requestHeaders) {
    const w = node('div');
    w.append(node('strong', '', 'Cabeçalhos de requisição:'));
    w.append(makeHeadersBlock(item.requestHeaders));
    details.append(w);
  }
  if (item.requestBody) {
    const b = makeBodyBlock(item.requestBody);
    if (b) {
      const w = node('div');
      w.append(node('strong', '', 'Corpo da requisição:'));
      w.append(b);
      details.append(w);
    }
  }
  if (item.responseHeaders) {
    const w = node('div');
    w.append(node('strong', '', 'Cabeçalhos de resposta:'));
    w.append(makeHeadersBlock(item.responseHeaders));
    details.append(w);
  }

  append(wrapper, summary, details);
  return wrapper;
}

function makeFinding(f) {
  const row = node('div', `finding ${f.severity}`);
  const symbol = f.severity === 'high' ? '!' : f.severity === 'medium' ? '!' : 'i';
  const icon = node('span', 'finding-icon', symbol);
  const body = node('div', 'finding-body');
  append(body,
    node('div', 'finding-title', f.title),
    node('div', 'finding-description', f.detail)
  );
  return append(row, icon, body);
}

function renderPageCard() {
  $('#hostname').textContent = toHostname(state.tabUrl) || '—';
  const pill = $('#statusPill');
  const txt = $('#statusText');
  if (state.enabled && state.granted) {
    pill.classList.add('active');
    txt.textContent = 'Active';
  } else {
    pill.classList.remove('active');
    txt.textContent = state.granted ? 'Inactive' : 'No access';
  }
}

function renderStats() {
  const isHttps = state.tabUrl.startsWith('https:');
  const httpsEl = $('#httpsValue');
  if (!tabSupported(state.tabUrl)) {
    httpsEl.textContent = '—';
    httpsEl.classList.remove('green', 'warning');
  } else {
    httpsEl.textContent = isHttps ? 'Enabled' : 'Disabled';
    httpsEl.classList.toggle('green', isHttps);
    httpsEl.classList.toggle('warning', !isHttps);
  }
  $('#requestCount').textContent = state.requests.length;
  const durations = state.requests.filter(r => r.duration != null).map(r => r.duration);
  const avg = durations.length
    ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
    : null;
  $('#averageTime').textContent = avg === null ? '—' : `${avg} ms`;
  const alerts = state.document?.headers
    ? state.findings.filter(f => f.severity !== 'info').length
    : 0;
  $('#findingCount').textContent = alerts;
}

function renderRecentRequests() {
  const el = $('#recentRequests');
  empty(el);
  if (!state.requests.length) {
    el.append(node('div', 'empty', 'Nenhuma requisição ainda. Inicie e recarregue a aba.'));
    return;
  }
  state.requests.slice(0, 4).forEach(r => el.append(makeRequestRow(r)));
}

function renderQuickFindings() {
  const el = $('#quickFindings');
  empty(el);
  if (!state.document?.headers) {
    el.append(node('div', 'empty', 'Aguardando cabeçalhos. Atualize a página com o monitor ativo.'));
    return;
  }
  const quick = state.findings.slice(0, 3);
  if (!quick.length) {
    el.append(node('div', 'empty', 'Nenhum achado nas regras básicas.'));
    return;
  }
  quick.forEach(f => el.append(makeFinding(f)));
}

function renderNetwork() {
  const list = $('#requestList');
  const term = $('#search').value.toLowerCase().trim();
  const code = $('#statusFilter').value;
  const filtered = state.requests.filter(r => {
    if (term) {
      const hay = [r.method, r.url, r.type,
        JSON.stringify(r.requestHeaders || {}), JSON.stringify(r.responseHeaders || {})].join(' ').toLowerCase();
      if (!hay.includes(term)) return false;
    }
    if (code === 'all') return true;
    if (code === 'errors') return r.status == null;
    return r.status != null && Math.floor(r.status / 100) === Number(code[0]);
  });
  const visible = filtered.slice(0, 200);
  $('#networkCount').textContent = String(filtered.length) + ' de ' + state.requests.length +
    ' requisições' + (filtered.length > visible.length ? ' · exibindo 200' : '');
  const old = new Map([...list.querySelectorAll('details.request-detail[data-request-key]')]
    .map(el => [el.dataset.requestKey, el]));
  const fragment = document.createDocumentFragment();
  if (!visible.length) {
    fragment.append(node('div', 'empty', 'Nenhuma requisição corresponde ao filtro.'));
  } else {
    for (const r of visible) {
      const key = String(r.id || [r.method,r.url,r.at].join(':'));
      let detail = old.get(key);
      if (!detail) detail = makeRequestDetail(r);
      detail.dataset.requestKey = key;
      fragment.append(detail);
    }
  }
  list.replaceChildren(fragment);
}

function renderSecurity() {
  const list = $('#findingsList');
  empty(list);
  if (!state.document?.headers) {
    list.append(node('div', 'empty', 'Os cabeçalhos do documento ainda não foram capturados.'));
  } else if (!state.findings.length) {
    list.append(node('div', 'empty', 'Nenhum achado nas verificações heurísticas.'));
  } else {
    state.findings.forEach(f => list.append(makeFinding(f)));
  }
  const headers = $('#headerList');
  empty(headers);
  if (!state.document?.headers) {
    headers.append(node('div', 'empty', 'Sem dados para a navegação atual.'));
    return;
  }
  for (const [key, label] of HEADER_LABELS) {
    const value = state.document.headers[key];
    const row = node('div', 'header-row');
    const main = node('div', 'header-main');
    append(main,
      node('div', 'header-name', label),
      node('div', 'header-value', value || 'Não observado nesta resposta')
    );
    append(row, main,
      node('span', `header-tag ${value ? '' : 'missing'}`, value ? 'OK' : '—')
    );
    headers.append(row);
  }
}

function renderCookies() {
  $('#cookieCount').textContent = `${state.cookies.length} encontrados`;
  const list = $('#cookieList');
  empty(list);
  if (!state.enabled || !state.granted) {
    list.append(node('div', 'empty', 'Inicie o monitor para analisar os cookies.'));
    return;
  }
  if (!state.cookies.length) {
    list.append(node('div', 'empty', 'Nenhum cookie retornado para a URL da aba.'));
    return;
  }
  for (const c of state.cookies) {
    const row = node('div', 'cookie-row');
    const title = node('div', 'cookie-title');
    append(title,
      node('span', '', c.name || '(sem nome)'),
      node('span', 'mini-label', c.session ? 'Sessão' : 'Persistente')
    );
    const meta = node('div', 'cookie-meta');
    meta.textContent = `Domínio: ${c.domain || '—'} • Path: ${c.path || '/'}` +
      (c.expirationDate ? ' • Expira: ' + new Date(c.expirationDate * 1000).toLocaleString('pt-BR') : '');
    const badges = node('div', 'cookie-badges');
    append(badges,
      node('span', `chip ${c.secure ? '' : 'off'}`, c.secure ? 'Secure' : 'Sem Secure'),
      node('span', `chip ${c.httpOnly ? '' : 'off'}`, c.httpOnly ? 'HttpOnly' : 'Sem HttpOnly'),
      node('span', 'chip neutral', `SameSite: ${c.sameSite || 'não definido'}`)
    );
    const value = node('div', 'cookie-value');
    append(value,
      node('strong', '', 'Valor: '),
      document.createTextNode(c.value ?? '(vazio)')
    );
    append(row, title, meta, badges, value);
    list.append(row);
  }
}

function renderFooter() {
  const startBtn = $('#toggleBtn');
  const lbl = $('#toggleLabel');
  const pauseBtn = $('#pauseBtn');
  if (state.enabled) {
    startBtn.classList.add('active');
    startBtn.disabled = true;
    lbl.textContent = 'Monitoring';
    pauseBtn.disabled = state.busy;
  } else {
    startBtn.classList.remove('active');
    startBtn.disabled = state.busy || !tabSupported(state.tabUrl);
    lbl.textContent = 'Start Monitoring';
    pauseBtn.disabled = true;
  }
  $('#clearBtn').disabled = state.busy || state.tabId == null;
  $('#exportBtn').disabled = state.busy || (!state.requests.length && !state.cookies.length);
}

function render() {
  renderPageCard();
  renderStats();
  renderRecentRequests();
  renderQuickFindings();
  renderNetwork();
  renderSecurity();
  renderCookies();
  renderFooter();
}

async function loadCookies(force = false) {
  if (!state.enabled || !state.granted || !tabSupported(state.tabUrl)) {
    state.cookies = [];
    return;
  }
  if (!force && Date.now() - state.lastCookieRead < 6000) return;
  try {
    const raw = await chrome.cookies.getAll({ url: state.tabUrl });
    state.cookies = raw.map(c => ({
      name: c.name || '',
      value: c.value || '',
      domain: c.domain || '',
      path: c.path || '/',
      secure: Boolean(c.secure),
      httpOnly: Boolean(c.httpOnly),
      sameSite: c.sameSite,
      session: Boolean(c.session),
      expirationDate: c.expirationDate || null,
      hostOnly: Boolean(c.hostOnly),
      storeId: c.storeId || ''
    }));
    state.lastCookieRead = Date.now();
  } catch (error) {
    state.cookies = [];
    console.warn('Sentinel: falha ao consultar cookies', error);
  }
}

async function refresh() {
  if (state.loading || state.busy) return;
  state.loading = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { hint('Não foi possível identificar a aba ativa.', true); return; }
    const changed = state.tabId !== tab.id || state.tabUrl !== tab.url;
    state.tabId = tab.id;
    state.tabUrl = tab.url || '';
    if (changed) { state.cookies = []; state.lastCookieRead = 0; }
    const response = await communicate({ type: 'GET_STATE', tabId: tab.id });
    if (!response?.ok) throw new Error(response?.error || 'Falha ao ler o monitor.');
    state.enabled = response.enabled;
    state.granted = response.granted;
    const documentUrl = response.document?.url;
    const currentUrl = (() => { try { return new URL(state.tabUrl).href; } catch { return null; } })();
    state.document = documentUrl === currentUrl ? response.document : null;
    state.requests = response.requests || [];
    if (tabSupported(state.tabUrl)) await loadCookies(changed);
    else state.cookies = [];
    state.findings = SentinelSecurity.analyze(state.document, state.cookies);
    if (!tabSupported(state.tabUrl)) {
      hint('Abra um site HTTP ou HTTPS. Páginas internas não são monitoráveis.', true);
    } else if (!state.granted) {
      hint('Clique em Start Monitoring para conceder acesso. Nenhuma coleta ocorre antes disso.');
    } else if (!state.enabled) {
      hint('Monitor pausado. Clique em Start Monitoring e recarregue a página.');
    } else if (!state.document?.headers) {
      hint('Monitor ativo. Recarregue a aba (Ctrl+R) para capturar os cabeçalhos principais.');
    } else {
      hint('');
    }
    render();
  } catch (error) {
    hint(`Falha: ${error.message}`, true);
  } finally {
    state.loading = false;
  }
}

async function startMonitoring() {
  if (state.busy || state.enabled) return;
  state.busy = true;
  renderFooter();
  try {
    const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    if (!granted) {
      hint('Permissão não concedida. O monitor continua desligado.', true);
      return;
    }
    const response = await communicate({ type: 'SET_MONITORING', enabled: true });
    if (!response?.ok) throw new Error(response?.error || 'Falha ao ativar.');
    state.enabled = response.enabled;
    state.granted = true;
  } catch (error) {
    hint(`Erro: ${error.message}`, true);
  } finally {
    state.busy = false;
    renderFooter();
    await refresh();
  }
}

async function pauseMonitoring() {
  if (state.busy || !state.enabled) return;
  state.busy = true;
  renderFooter();
  try {
    const response = await communicate({ type: 'SET_MONITORING', enabled: false });
    if (!response?.ok) throw new Error(response?.error || 'Falha ao pausar.');
    state.enabled = false;
    state.cookies = [];
    state.findings = SentinelSecurity.analyze(state.document, []);
  } catch (error) {
    hint(`Erro: ${error.message}`, true);
  } finally {
    state.busy = false;
    renderFooter();
    await refresh();
  }
}

async function clearTab() {
  if (state.busy || state.tabId == null) return;
  state.busy = true;
  try {
    const result = await communicate({ type: 'CLEAR_TAB', tabId: state.tabId });
    if (!result.ok) throw new Error(result.error);
    state.requests = [];
    state.document = null;
    state.cookies = [];
    state.lastCookieRead = 0;
  } catch (error) {
    hint(`Não foi possível limpar: ${error.message}`, true);
  } finally {
    state.busy = false;
    await refresh();
  }
}

async function revokeAccess() {
  if (state.busy) return;
  if (!confirm('Desativar e limpar todos os dados capturados de todas as abas?')) return;
  state.busy = true;
  try {
    await communicate({ type: 'SET_MONITORING', enabled: false });
    await communicate({ type: 'CLEAR_ALL' });
    // A permissão obrigatória deve ser alterada nas configurações da extensão.
    state.enabled = false;
    state.granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    state.cookies = [];
    state.requests = [];
    state.document = null;
  } catch (error) {
    hint(`Falha ao revogar: ${error.message}`, true);
  } finally {
    state.busy = false;
    await refresh();
  }
}

function download(filename, contents, mime) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJson() {
  if (!confirm('A exportação JSON pode conter cookies, senhas e tokens. Não compartilhe sem revisar. Continuar?')) return;
  const payload = {
    tool: 'Sentinel Web Security',
    version: '0.1.5',
    exportedAt: new Date().toISOString(),
    host: toHostname(state.tabUrl),
    document: state.document,
    requests: state.requests,
    findings: state.findings,
    cookies: state.cookies
  };
  download(`sentinel-${fileStamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

function exportCsv() {
  if (!confirm('O CSV pode conter URLs com dados privados. Revise antes de compartilhar. Continuar?')) return;
  const headings = ['timestamp','method','status','duration_ms','type','url','ip','redirect_url','error'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headings.join(',')];
  for (const r of state.requests) {
    lines.push([
      new Date(r.at).toISOString(), r.method, r.status, r.duration,
      r.type, r.url, r.ip, r.redirectUrl, r.error
    ].map(esc).join(','));
  }
  download(`sentinel-requests-${fileStamp()}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

function toggleExportMenu(show) {
  const menu = $('#exportMenu');
  const shouldShow = typeof show === 'boolean' ? show : menu.hidden;
  menu.hidden = !shouldShow;
}

function switchView(view) {
  state.view = view;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  $$('.view').forEach(s => s.classList.toggle('active', s.id === `view-${view}`));
  toggleExportMenu(false);
}

$('#toggleBtn').addEventListener('click', startMonitoring);
$('#pauseBtn').addEventListener('click', pauseMonitoring);
$('#clearBtn').addEventListener('click', clearTab);
$('#settingsBtn').addEventListener('click', revokeAccess);

$('#exportBtn').addEventListener('click', e => {
  e.stopPropagation();
  toggleExportMenu();
});
$('#exportMenu').addEventListener('click', e => {
  const btn = e.target.closest('button[data-format]');
  if (!btn) return;
  if (btn.dataset.format === 'json') exportJson();
  else if (btn.dataset.format === 'csv') exportCsv();
  toggleExportMenu(false);
});
document.addEventListener('click', e => {
  if (!e.target.closest('#exportMenu') && !e.target.closest('#exportBtn')) {
    toggleExportMenu(false);
  }
});

$('#search').addEventListener('input', renderNetwork);
$('#statusFilter').addEventListener('change', renderNetwork);

$$('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
$$('[data-jump]').forEach(t => t.addEventListener('click', () => switchView(t.dataset.jump)));

void refresh();
setInterval(() => { if (!document.hidden) void refresh(); }, 1800);