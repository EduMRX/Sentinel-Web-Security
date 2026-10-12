# 🛡️ Sentinel Web Security `v0.1.4`

> 🔍 Monitor HTTP(S) local para **Chrome / Edge (Manifest V3)** com interface popup moderna.
> Captura integral de URLs, cabeçalhos, corpos de requisição e cookies — **sem limites artificiais**.

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.4-10b981?style=flat-square" alt="version">
  <img src="https://img.shields.io/badge/manifest-v3-3b82f6?style=flat-square" alt="mv3">
  <img src="https://img.shields.io/badge/chrome-%E2%89%A5102-f59e0b?style=flat-square" alt="chrome">
  <img src="https://img.shields.io/badge/license-no--license-6b7280?style=flat-square" alt="license">
</p>

---

## ⚠️ Aviso antes de tudo

> 🚨 **Ferramenta de laboratório.**
> Captura **tokens, cookies, `Authorization`, senhas de formulário e PII** por design.
> Use **somente** em sites que você possui ou tem autorização escrita para testar.
> 🚫 Nunca compartilhe exportações sem revisar.
> ⚖️ Uso não autorizado pode violar leis de acesso indevido. **Você é o único responsável.**

---

## ✨ Recursos

### 🌐 Captura de rede
- 🔗 **URL completa** — query string, hash e credenciais embutidas preservadas
- 📡 Método, status, duração aproximada, IP remoto, redirecionamentos e erros
- 📥 **Cabeçalhos de requisição e resposta na íntegra** — inclui `Authorization`, `Cookie`, `Set-Cookie`, `X-CSRF-Token`
- 📦 **Corpo de requisição** — `formData` e `raw` (UTF-8) sem truncamento
- 🍪 **Cookies completos** — nome, valor, domínio, path, `Secure`, `HttpOnly`, `SameSite`, `hostOnly`, `storeId`, `expirationDate`

### 🧠 Heurísticas de segurança
- 🛡️ CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`
- 🔒 Referrer-Policy, Permissions-Policy, COOP
- 🌍 CORS mal configurado
- 🍪 Cookies sem `Secure` / `HttpOnly` / `SameSite`
- 🕵️ Fingerprinting via `Server` e `X-Powered-By`

### 💾 Interface
- 🎨 Popup escuro, moderno, com 4 abas
- 🔍 Busca e filtro por status no tráfego
- 📋 Expansão de cada requisição com headers e corpo
- 📤 Exportação **JSON** completa e **CSV** de requisições
- 🧹 Limpar aba • 🔄 Pausar • 🗑️ Revogar acesso
- 🚫 Zero servidor • 🚫 Zero telemetria • 🚫 Zero chamadas externas

---

## 🚀 Instalação

| Passo | Ação |
|:---:|---|
| 1️⃣ | 📥 Extraia este ZIP em uma pasta permanente |
| 2️⃣ | 🌐 Abra `chrome://extensions` ou `edge://extensions` |
| 3️⃣ | 🔧 Ative o **Modo do desenvolvedor** (canto superior direito) |
| 4️⃣ | 📂 Clique em **Carregar sem compactação** → selecione a pasta com `Sentinel-Web-Security-God.crx` |
| 5️⃣ | 📌 Fixe o ícone do Sentinel na barra de extensões |
| 6️⃣ | ✅ Abra um site autorizado, clique no ícone → **Start Monitoring** |
| 7️⃣ | 🔓 Conceda a permissão `<all_urls>` solicitada |
| 8️⃣ | 🔄 Recarregue a aba (`Ctrl+R`) para capturar os headers do documento |

---
<!-- ██ TABELA 1 — Cabeçalho VERMELHO ██ -->
<table style="border-collapse:collapse;width:100%;font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;margin:20px 0">
  <thead>
    <tr style="background:#d94a3d;color:#fff;text-align:left">
      <th style="padding:12px 16px;font-weight:700">Aba</th>
      <th style="padding:12px 16px;font-weight:700">Função</th>
      <th style="padding:12px 16px;font-weight:700">Destaque</th>
      <th style="padding:12px 16px;font-weight:700">Atalho</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px">🏠 Overview</td>
      <td style="padding:11px 16px">Status + métricas</td>
      <td style="padding:11px 16px">HTTPS, reqs, latência, alertas</td>
      <td style="padding:11px 16px">—</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px">📡 Network</td>
      <td style="padding:11px 16px">Tráfego HTTP(S)</td>
      <td style="padding:11px 16px">Busca + filtro + expansão</td>
      <td style="padding:11px 16px">—</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px">🛡️ Security</td>
      <td style="padding:11px 16px">Achados heurísticos</td>
      <td style="padding:11px 16px">Headers + severidade</td>
      <td style="padding:11px 16px">—</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px">🍪 Cookies</td>
      <td style="padding:11px 16px">Cookies da aba</td>
      <td style="padding:11px 16px">Nome, valor, atributos</td>
      <td style="padding:11px 16px">—</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px">⚙️ Settings</td>
      <td style="padding:11px 16px">Revogar acesso</td>
      <td style="padding:11px 16px">Pausa + limpa + remove permissão</td>
      <td style="padding:11px 16px">topo direito</td>
    </tr>
  </tbody>
</table>


<!-- ██ TABELA 2 — Cabeçalho PRETO ██ -->
<table style="border-collapse:collapse;width:100%;font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;margin:20px 0">
  <thead>
    <tr style="background:#111;color:#fff;text-align:left">
      <th style="padding:12px 16px;font-weight:700">Método</th>
      <th style="padding:12px 16px;font-weight:700">Path</th>
      <th style="padding:12px 16px;font-weight:700">Status</th>
      <th style="padding:12px 16px;font-weight:700">Tempo</th>
      <th style="padding:12px 16px;font-weight:700">Tipo</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#10b981;font-weight:700">GET</td>
      <td style="padding:11px 16px;font-family:monospace">/api/login</td>
      <td style="padding:11px 16px;color:#10b981;font-weight:700">200</td>
      <td style="padding:11px 16px">123 ms</td>
      <td style="padding:11px 16px">xhr</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px;color:#3b82f6;font-weight:700">POST</td>
      <td style="padding:11px 16px;font-family:monospace">/api/auth</td>
      <td style="padding:11px 16px;color:#f59e0b;font-weight:700">302</td>
      <td style="padding:11px 16px">241 ms</td>
      <td style="padding:11px 16px">xhr</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#10b981;font-weight:700">GET</td>
      <td style="padding:11px 16px;font-family:monospace">/assets/app.js</td>
      <td style="padding:11px 16px;color:#10b981;font-weight:700">200</td>
      <td style="padding:11px 16px">44 ms</td>
      <td style="padding:11px 16px">script</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px;color:#10b981;font-weight:700">GET</td>
      <td style="padding:11px 16px;font-family:monospace">/api/profile</td>
      <td style="padding:11px 16px;color:#ef4444;font-weight:700">401</td>
      <td style="padding:11px 16px">188 ms</td>
      <td style="padding:11px 16px">xhr</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#f59e0b;font-weight:700">PUT</td>
      <td style="padding:11px 16px;font-family:monospace">/api/settings</td>
      <td style="padding:11px 16px;color:#f59e0b;font-weight:700">304</td>
      <td style="padding:11px 16px">96 ms</td>
      <td style="padding:11px 16px">xhr</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px;color:#a855f7;font-weight:700">PATCH</td>
      <td style="padding:11px 16px;font-family:monospace">/api/user/1</td>
      <td style="padding:11px 16px;color:#10b981;font-weight:700">204</td>
      <td style="padding:11px 16px">52 ms</td>
      <td style="padding:11px 16px">xhr</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#ef4444;font-weight:700">DELETE</td>
      <td style="padding:11px 16px;font-family:monospace">/api/session</td>
      <td style="padding:11px 16px;color:#ef4444;font-weight:700">500</td>
      <td style="padding:11px 16px">412 ms</td>
      <td style="padding:11px 16px">xhr</td>
    </tr>
  </tbody>
</table>


<!-- ██ TABELA 3 — Cabeçalho VERDE ██ -->
<table style="border-collapse:collapse;width:100%;font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;margin:20px 0">
  <thead>
    <tr style="background:#2ecc71;color:#fff;text-align:left">
      <th style="padding:12px 16px;font-weight:700">Severidade</th>
      <th style="padding:12px 16px;font-weight:700">Achado</th>
      <th style="padding:12px 16px;font-weight:700">Detalhe</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#ef4444;font-weight:700">🔴 ALTO</td>
      <td style="padding:11px 16px">Conexão sem HTTPS</td>
      <td style="padding:11px 16px">Página carregada por HTTP, sem TLS</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px;color:#f59e0b;font-weight:700">🟡 MÉDIO</td>
      <td style="padding:11px 16px">Missing CSP</td>
      <td style="padding:11px 16px">Nenhum Content-Security-Policy detectado</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#f59e0b;font-weight:700">🟡 MÉDIO</td>
      <td style="padding:11px 16px">HSTS not detected</td>
      <td style="padding:11px 16px">Strict-Transport-Security ausente</td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px;color:#f59e0b;font-weight:700">🟡 MÉDIO</td>
      <td style="padding:11px 16px">Cookie sem Secure</td>
      <td style="padding:11px 16px">Pode trafegar em conexões HTTP</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#3b82f6;font-weight:700">🔵 BAIXO</td>
      <td style="padding:11px 16px">X-Content-Type-Options ausente</td>
      <td style="padding:11px 16px">Considere adicionar <code>nosniff</code></td>
    </tr>
    <tr style="background:#ececec">
      <td style="padding:11px 16px;color:#3b82f6;font-weight:700">🔵 BAIXO</td>
      <td style="padding:11px 16px">CSP permite unsafe-inline</td>
      <td style="padding:11px 16px">Reduz proteção contra XSS</td>
    </tr>
    <tr style="background:#f7f7f7">
      <td style="padding:11px 16px;color:#6b7785;font-weight:700">⚪ INFO</td>
      <td style="padding:11px 16px">Referrer-Policy não explícita</td>
      <td style="padding:11px 16px">Navegador usará política padrão</td>
    </tr>
  </tbody>
</table>
### 📑 Abas em detalhe

| Aba | Conteúdo |
|:---:|---|
| 🏠 **Overview** | Status do site, 4 métricas rápidas, últimas requisições e top 3 achados |
| 📡 **Network** | Tráfego completo com busca, filtro e expansão de cada requisição |
| 🛡️ **Security** | Achados heurísticos + tabela de headers de proteção |
| 🍪 **Cookies** | Cookies da aba com valores, atributos e expiração |

---
**PRINTS COM DADOS DE EXEMPLO**

<img width="412" height="616" alt="image" src="https://github.com/user-attachments/assets/e99e494f-cec4-4ab3-bc48-2e84a3439689" />
<img width="450" height="602" alt="image" src="https://github.com/user-attachments/assets/3f475244-c08d-421c-9e0c-907942fba7bf" />
<img width="417" height="627" alt="image" src="https://github.com/user-attachments/assets/0637448c-068a-4428-b99b-684e705454c1" />
<img width="412" height="630" alt="image" src="https://github.com/user-attachments/assets/b579b5b9-0736-4675-813f-dcc57c0df829" />


---

## 🔐 Permissões

| Permissão | 🎯 Finalidade |
|---|---|
| 💾 `storage` | Estado e captura em `chrome.storage.session` |
| 🗂️ `tabs` | Identificar a aba ativa |
| 📡 `webRequest` | Observar requisições HTTP(S) |
| 🍪 `cookies` | Ler cookies da aba (nome + valor + atributos) |
| ♾️ `unlimitedStorage` | Evitar estouro de cota |
| 🌐 `optional_host_permissions: <all_urls>` | Solicitada **somente** ao clicar em Start |

> ✅ Nenhuma permissão de host é usada antes da ativação manual.

---

## 💾 Limites de armazenamento

| Constante | Valor | Nota |
|---|:---:|---|
| `MAX_REQUESTS_PER_TAB` | **100 000** | por aba |
| `MAX_TABS` | **10 000** | abas rastreadas |
| `MAX_PENDING` | **100 000** | requisições em voo |
| Cookies exibidos | **sem limite** | — |
| Truncamento | **nenhum** | URLs, headers, corpos e cookies íntegros |

---

## ⚠️ Avisos importantes

- 🚨 **Contém dados sensíveis por design.** `Authorization`, `Cookie`, `Set-Cookie`, tokens CSRF, senhas e PII podem aparecer nas exportações.
- 🌐 `<all_urls>` concede visibilidade ampla no navegador — **não** fica restrita à aba ativa.
- 🔓 `chrome.storage.session` **não** criptografa contra ameaças locais.
- 💤 O service worker pode ser suspenso — temporizações e eventos assíncronos podem gerar registros incompletos.
- 🖥️ A observação é apenas do **próprio navegador**, não do computador inteiro.
- 🔍 Status e heurísticas **não comprovam vulnerabilidade**. Somente indícios.
- 📦 Exportações em páginas grandes podem chegar a **dezenas de MB** e travar visualizadores.
- 🔐 O indicador HTTPS reflete apenas o esquema da URL — **não** valida o certificado.

---

## 🧱 Limites técnicos que permanecem

- 🚫 `chrome.webRequest` **não** vê corpos de resposta (seria necessário `chrome.debugger`)
- 🔌 WebSocket, HTTP/2 push e alguns pré-voos podem não aparecer
- 🧾 `extraHeaders` só funciona com host permission concedida no domínio
- 📎 Cabeçalhos duplicados são concatenados com vírgula
- 🚷 Páginas internas (`chrome://`, `edge://`, Chrome Web Store) não são monitoráveis
- ⏱️ Requisições iniciadas antes da ativação podem aparecer sem duração

---

## ⚖️ Aviso legal

> 🛡️ Esta ferramenta observa **apenas o tráfego do próprio navegador** onde está instalada.
> ❌ **Não** faz pentest, interceptação TLS, varredura ativa nem inspeção de certificados.
> 🚫 O uso em sistemas de terceiros sem autorização pode violar leis de acesso não autorizado.
> 👤 **Você é o único responsável pelo uso.**

---

<p align="center">
  <sub>💚 Feito para aprendizado e testes autorizados</sub><br>
  <sub>🏠 100% local • 🚫 sem servidor • 🚫 sem telemetria</sub>
</p>
