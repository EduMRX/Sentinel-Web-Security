/* Regras heurísticas, sem scanner ativo e sem acesso a dados secretos. */
'use strict';
const SentinelSecurity = (() => {
  function analyze(documentInfo, cookies = []) {
    const findings = [];
    const add = (severity, title, detail) => findings.push({ severity, title, detail });
    const url = documentInfo?.url || '';
    const h = documentInfo?.headers;

    if (!url) return findings;
    if (url.startsWith('http://')) {
      add('high', 'Conexão sem HTTPS', 'Esta página foi carregada por HTTP; o transporte não fornece confidencialidade TLS.');
    }
    if (h) {
      const csp = (h['content-security-policy'] || '').toLowerCase();
      const framePolicy = csp.includes('frame-ancestors') || Boolean(h['x-frame-options']);
      if (!h['content-security-policy']) {
        add('medium', 'CSP não identificado', 'Nenhum Content-Security-Policy foi observado na resposta do documento. Verifique se há outras proteções aplicáveis.');
      }
      if (url.startsWith('https://') && !h['strict-transport-security']) {
        add('medium', 'HSTS não identificado', 'O cabeçalho Strict-Transport-Security não apareceu nesta resposta HTTPS.');
      }
      if ((h['x-content-type-options'] || '').toLowerCase().trim() !== 'nosniff') {
        add('low', 'Proteção MIME incompleta', 'Considere X-Content-Type-Options: nosniff.');
      }
      if (!framePolicy) {
        add('low', 'Proteção contra incorporação ausente', 'Nem frame-ancestors (CSP) nem X-Frame-Options foram identificados.');
      }
      if (!h['referrer-policy']) {
        add('info', 'Referrer-Policy não explícita', 'O navegador aplicará sua política padrão, que pode ser adequada dependendo do caso.');
      }
      const allowOrigin = (h['access-control-allow-origin'] || '').trim();
      const allowCredentials = (h['access-control-allow-credentials'] || '').trim().toLowerCase();
      if (allowOrigin === '*' && allowCredentials === 'true') {
        add('low', 'Configuração CORS incompatível', 'Access-Control-Allow-Origin: * junto de Allow-Credentials: true é rejeitado por navegadores para requisições com credenciais; não implica vazamento.');
      }
      if (/\bunsafe-inline\b/.test(csp)) {
        add('low', 'CSP permite unsafe-inline', 'Uma política CSP contendo unsafe-inline pode reduzir a proteção contra XSS, conforme o restante da política.');
      }
      if (h['server']) {
        add('info', 'Server header exposto', `A resposta revela "${h['server']}". Reduza fingerprint quando possível.`);
      }
      if (h['x-powered-by']) {
        add('low', 'X-Powered-By exposto', `Stack revelada: "${h['x-powered-by']}". Considere removê-lo.`);
      }
      if (h['access-control-allow-origin'] === '*' && !h['access-control-allow-credentials']) {
        add('info', 'CORS aberto (sem credenciais)', 'Access-Control-Allow-Origin: * permite leitura por qualquer origem, mas sem cookies.');
      }
    }
    for (const cookie of cookies) {
      const label = cookie.name ? `Cookie “${String(cookie.name).slice(0, 60)}”` : 'Cookie';
      if (url.startsWith('https://') && !cookie.secure) {
        add('medium', `${label} sem Secure`, 'Pode ser transmitido também por conexões HTTP compatíveis com domínio/escopo.');
      }
      if (cookie.sameSite === 'no_restriction' && !cookie.secure) {
        add('medium', `${label} com SameSite=None sem Secure`, 'Atributos de cookie incompatíveis com requisitos atuais de navegadores.');
      }
      if (!cookie.httpOnly && /session|sess|auth|token|jwt/i.test(cookie.name || '')) {
        add('low', `${label} sem HttpOnly`, 'O nome sugere autenticação, mas isso é apenas uma heurística: confirme a finalidade do cookie.');
      }
    }
    const order = { high: 0, medium: 1, low: 2, info: 3 };
    return findings.sort((a, b) => order[a.severity] - order[b.severity]);
  }
  return { analyze };
})();
if (typeof module !== 'undefined') module.exports = SentinelSecurity;