/* Popup Sentinel — UI sem bibliotecas e sem HTML não-confiável. */
'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = {
  tabId: null, tabUrl: '', tabTitle: '', enabled: false, granted: false,
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

function node(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== '') el.textContent = String(text);
  return el;
}
function append(parent, ...children) { parent.append(...children); return parent; }
function empty(el) { el.replaceChildren(); }
function placeholder(parent, message) { parent.replaceChildren(node('div', 'empty', message)); }
function notice(message, error = false) {
  $('#notice').textContent = message;
  $('#notice').classList.toggle('error', error);
}
function tabSupported(url) { return /^https?:\/\//i.test(url || ''); }
function toHostname(url) {
  try { return new URL(url).hostname; } catch { return 'Aba não compatível'; }
}
function requestPath(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === '/' ? '/' : parsed.pathname;
    return parsed.hostname + path + (parsed.search || '') + (parsed.hash || '');
  } catch { return url; }
}
function statusClass(status) {
  return status == null || status >= 500 ? 'bad' : status >= 400 ? 'warn' : '';
}
function roundTime(duration) { return duration == null ? '—' : `${duration} ms`; }
function fileStamp() { return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); }
function communicate(message) { return chrome.runtime.sendMessage(message); }

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

function makeRequest(item, detailed = false) {
  const status = node('span', 'http-status ' + statusClass(item.status), item.status ?? 'ERR');
  const bar = node('div', 'req');
  append(bar,
    node('span', 'method ' + item.method.toLowerCase(), item.method),
    node('span', 'req-path', requestPath(item.url)),
    status,
    node('span', 'time', roundTime(item.duration))
  );
  if (!detailed) return bar;
  const wrapper = node('details', 'request-detail');
  const summary = node('summary');
  summary.append(bar);
  const details = node('div', 'detail-content');
  const lines = [
    ['URL completa', item.url],
    ['Método', item.method],
    ['Tipo', item.type],
    ['Início', new Date(item.at).toLocaleTimeString('pt-BR')],
    ['Duração aproximada', roundTime(item.duration)],
    ['Cache', item.fromCache ? 'Sim' : 'Não']
  ];
  if (item.ip) lines.push(['IP remoto', item.ip]);
  if (item.redirectUrl) lines.push(['Redirecionado para', item.redirectUrl]);
  if (item.error) lines.push(['Erro', item.error]);
  for (const [label, value] of lines) {
    const div = node('div');
    append(div, node('strong', '', `${label}: `), document.createTextNode(value));
    details.append(div);
  }
  if (item.requestHeaders) {
    const wrap = node('div');
    wrap.append(node('strong', '', 'Cabeçalhos de requisição:'));
    wrap.append(makeHeadersBlock(item.requestHeaders));
    details.append(wrap);
  }
  if (item.requestBody) {
    const bodyBlock = makeBodyBlock(item.requestBody);
    if (bodyBlock) {
      const wrap = node('div');
      wrap.append(node('strong', '', 'Corpo da requisição:'));
      wrap.append(bodyBlock);
      details.append(wrap);
    }
  }
  if (item.responseHeaders) {
    const wrap = node('div');
    wrap.append(node('strong', '', 'Cabeçalhos de resposta:'));
    wrap.append(makeHeadersBlock(item.responseHeaders));
    details.append(wrap);
  }
  append(wrapper, summary, details);
  return wrapper;
}

function makeFinding(finding) {
  const row = node('div', `finding ${finding.severity}`);
  const symbol = finding.severity === 'high' ? '!' : finding.severity === 'info' ? 'i' : '⚠';
  const copy = node('div');
  append(copy, node('div', 'finding-title', finding.title), node('div', 'finding-description', finding.detail));
  return append(row, node('span', 'finding-icon', symbol), copy);
}

function renderRequests() {
  const recent = $('#recentRequests');
  empty(recent);
  if (!state.requests.length) placeholder(recent, 'Nenhuma requisição registrada. Inicie e recarregue a aba (Ctrl+R).');
  else state.requests.slice(0, 4).forEach(r => recent.append(makeRequest(r)));

  const term = $('#search').value.toLowerCase().trim();
  const code = $('#statusFilter').value;
  const filtered = state.requests.filter(r => {
    if (term && !(`${r.method} ${r.url} ${r.type} ${JSON.stringify(r.requestHeaders||{})} ${JSON.stringify(r.responseHeaders||{})}`.toLowerCase().includes(term))) return false;
    if (code === 'all') return true;
    if (code === 'errors') return r.status == null;
    return r.status != null && Math.floor(r.status / 100) === Number(code[0]);
  });
  const list = $('#requestList');
  empty(list);
  if (!filtered.length) placeholder(list, 'Nenhuma requisição corresponde a este filtro.');
  else filtered.forEach(r => list.append(makeRequest(r, true)));
}

function renderSecurity() {
  const quick = $('#quickFindings');
  const full = $('#findingsList');
  empty(quick); empty(full);
  if (!state.document?.headers) {
    placeholder(quick, 'Aguardando cabeçalhos. Atualize a página com o monitor ativo.');
    placeholder(full, 'Os cabeçalhos do documento ainda não foram capturados.');
  } else if (!state.findings.length) {
    placeholder(quick, 'Nenhuma configuração suspeita identificada pelas regras básicas.');
    placeholder(full, 'Sem achados nas verificações heurísticas disponíveis.');
  } else {
    state.findings.slice(0, 2).forEach(f => quick.append(makeFinding(f)));
    state.findings.forEach(f => full.append(makeFinding(f)));
  }
  const list = $('#headerList');
  empty(list);
  if (!state.document?.headers) { placeholder(list, 'Sem dados para a navegação atual.'); return; }
  for (const [key, label] of HEADER_LABELS) {
    const value = state.document.headers[key];
    const row = node('div', 'header-row');
    const main = node('div', 'header-main');
    append(main, node('div', 'header-name', label), node('div', 'header-value', value || 'Não observado nesta resposta'));
    append(row, main, node('span', `header-tag ${value ? '' : 'missing'}`, value ? 'OK' : '—'));
    list.append(row);
  }
}

function cookieChip(text, valid = true) { return node('span', 'chip ' + (valid ? '' : 'off'), text); }
function renderCookies() {
  $('#cookieCount').textContent = `${state.cookies.length} encontrados`;
  const list = $('#cookieList');
  empty(list);
  if (!state.enabled || !state.granted) {
    placeholder(list, 'Inicie o monitor para analisar os cookies desta página.');
    return;
  }
  if (!state.cookies.length) { placeholder(list, 'Nenhum cookie retornado para a URL da aba.'); return; }
  for (const c of state.cookies) {
    const row = node('div', 'cookie-row');
    const title = node('div', 'cookie-title');
    append(title, node('span', '', c.name || '(sem nome)'), node('span', 'mini-label', c.session ? 'Sessão' : 'Persistente'));
    const meta = node('div', 'mini-label');
    meta.textContent = `Domínio: ${c.domain || '—'} • Path: ${c.path || '/'}${c.storeId ? ' • StoreId: ' + c.storeId : ''}${c.hostOnly ? ' • hostOnly' : ''}${c.expirationDate ? ' • expira ' + new Date(c.expirationDate * 1000).toLocaleString('pt-BR') : ''}`;
    const chips = node('div', 'cookie-badges');
    append(chips,
      cookieChip(c.secure ? 'Secure' : 'Sem Secure', c.secure),
      cookieChip(c.httpOnly ? 'HttpOnly' : 'Sem HttpOnly', c.httpOnly),
      node('span', 'chip neutral', `SameSite: ${c.sameSite || 'não definido'}`)
    );
    const value = node('div', 'cookie-value');
    append(value, node('strong', '', 'Valor: '), document.createTextNode(c.value ?? '(vazio)'));
    append(row, title, meta, chips, value);
    list.append(row);
  }
}
function renderSite() {
  $('#hostname').textContent = toHostname(state.tabUrl);
  $('#protocol').textContent = state.tabUrl.startsWith('https:') ? 'HTTPS • conexão criptografada' : state.tabUrl.startsWith('http:') ? 'HTTP • sem criptografia TLS' : 'Esquema não monitorável';
  $('#siteState').textContent = state.tabUrl.startsWith('https:') ? '🔒' : '⚠';
  $('#siteState').classList.toggle('warn', !state.tabUrl.startsWith('https:'));
}
function renderStatus() {
  $('#statusPill').classList.toggle('running', state.enabled);
  $('#statusText').textContent = state.enabled ? 'ATIVO' : 'PARADO';
  $('#toggleBtn').classList.toggle('pause', state.enabled);
  $('#toggleLabel').textContent = state.enabled ? 'Pausar monitoramento' : 'Iniciar monitoramento';
  $('#toggleIcon').textContent = state.enabled ? 'Ⅱ' : '▶';
  $('#toggleBtn').disabled = state.busy || !tabSupported(state.tabUrl);
  $('#clearBtn').disabled = state.busy || state.tabId == null;
  $('#revokeBtn').disabled = state.busy || !state.granted;
  renderSite();
}
function renderStats() {
  const durations = state.requests.filter(r => r.duration != null).map(r => r.duration);
  const avg = durations.length ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : null;
  $('#requestCount').textContent = state.requests.length;
  $('#findingCount').textContent = state.document?.headers ? state.findings.filter(f => f.severity !== 'info').length : '—';
  $('#averageTime').textContent = avg === null ? '—' : String(avg);
}
function render() { renderStatus(); renderStats(); renderRequests(); renderSecurity(); renderCookies(); }

async function loadCookies(force = false) {
  if (!state.enabled || !state.granted || !tabSupported(state.tabUrl)) { state.cookies = []; return; }
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
    console.warn('Sentinel: não foi possível consultar cookies', error);
  }
}

async function refresh() {
  if (state.loading || state.busy) return;
  state.loading = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { notice('Não foi possível identificar a aba ativa.', true); return; }
    const changed = state.tabId !== tab.id || state.tabUrl !== tab.url;
    state.tabId = tab.id;
    state.tabUrl = tab.url || '';
    if (changed) { state.cookies = []; state.lastCookieRead = 0; }
    const response = await communicate({ type: 'GET_STATE', tabId: tab.id });
    if (!response?.ok) throw new Error(response?.error || 'Não foi possível ler o monitor.');
    state.enabled = response.enabled;
    state.granted = response.granted;
    const documentUrl = response.document?.url;
    const currentUrl = (() => { try { return new URL(state.tabUrl).href; } catch { return null; } })();
    state.document = documentUrl === currentUrl ? response.document : null;
    state.requests = response.requests || [];
    if (tabSupported(state.tabUrl)) await loadCookies(changed);
    else state.cookies = [];
    state.findings = SentinelSecurity.analyze(state.document, state.cookies);
    if (!tabSupported(state.tabUrl)) notice('Abra um site HTTP ou HTTPS para monitorar. Páginas internas não são acessíveis.');
    else if (!state.granted) notice('Ao iniciar, o navegador solicitará acesso aos sites. Nenhuma coleta antes da sua autorização.');
    else if (!state.enabled) notice('Monitor pausado. Clique em Iniciar e atualize a página para obter os cabeçalhos.');
    else if (!state.document?.headers) notice('Monitor ativo. Atualize a aba (Ctrl+R) para capturar os cabeçalhos principais.');
    else notice('Monitor ativo • modo sem limites • URLs, headers, corpos e cookies completos.');
    render();
  } catch (error) {
    notice(`Falha: ${error.message}`, true);
  } finally { state.loading = false; }
}

async function toggleMonitoring() {
  if (state.busy) return;
  state.busy = true;
  renderStatus();
  try {
    if (!state.enabled) {
      const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
      if (!granted) { notice('Permissão não concedida. O monitor continua desligado.', true); return; }
    }
    const response = await communicate({ type: 'SET_MONITORING', enabled: !state.enabled });
    if (!response?.ok) throw new Error(response?.error || 'Falha ao mudar estado.');
    state.enabled = response.enabled;
    state.granted = state.granted || state.enabled;
    if (!state.enabled) { state.cookies = []; state.findings = SentinelSecurity.analyze(state.document, []); }
  } catch (error) {
    notice(`Erro: ${error.message}`, true);
  } finally {
    state.busy = false;
    renderStatus();
    await refresh();
  }
}

async function clearTab() {
  if (state.busy || state.tabId == null) return;
  state.busy = true;
  try {
    const result = await communicate({ type: 'CLEAR_TAB', tabId: state.tabId });
    if (!result.ok) throw new Error(result.error);
    state.requests = []; state.document = null; state.cookies = [];
    state.lastCookieRead = 0;
  } catch (error) { notice(`Não foi possível limpar: ${error.message}`, true); }
  finally { state.busy = false; await refresh(); }
}

async function revokeAccess() {
  if (state.busy) return;
  state.busy = true;
  try {
    await communicate({ type: 'SET_MONITORING', enabled: false });
    await communicate({ type: 'CLEAR_ALL' });
    await chrome.permissions.remove({ origins: ['<all_urls>'] });
    state.enabled = false; state.granted = false; state.cookies = [];
    state.requests = []; state.document = null;
  } catch (error) { notice(`Falha ao revogar: ${error.message}`, true); }
  finally { state.busy = false; await refresh(); }
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
  const payload = {
    tool: 'Sentinel Web Security', version: '0.1.2-full',
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
  const headings = ['timestamp', 'method', 'status', 'duration_ms', 'type', 'url', 'ip', 'redirect_url', 'error'];
  const csvEscape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headings.join(',')];
  for (const r of state.requests) {
    lines.push([new Date(r.at).toISOString(), r.method, r.status, r.duration, r.type, r.url, r.ip, r.redirectUrl, r.error].map(csvEscape).join(','));
  }
  download(`sentinel-requests-${fileStamp()}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

function switchView(view) {
  state.view = view;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  $$('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
}
$('#toggleBtn').addEventListener('click', toggleMonitoring);
$('#clearBtn').addEventListener('click', clearTab);
$('#revokeBtn').addEventListener('click', revokeAccess);
$('#exportJson').addEventListener('click', exportJson);
$('#exportCsv').addEventListener('click', exportCsv);
$('#search').addEventListener('input', renderRequests);
$('#statusFilter').addEventListener('change', renderRequests);
$$('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
$$('[data-jump]').forEach(t => t.addEventListener('click', () => switchView(t.dataset.jump)));
void refresh();
setInterval(() => { if (!document.hidden) void refresh(); }, 1800);