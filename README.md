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
| 4️⃣ | 📂 Clique em **Carregar sem compactação** → selecione a pasta com `manifest.json` |
| 5️⃣ | 📌 Fixe o ícone do Sentinel na barra de extensões |
| 6️⃣ | ✅ Abra um site autorizado, clique no ícone → **Start Monitoring** |
| 7️⃣ | 🔓 Conceda a permissão `<all_urls>` solicitada |
| 8️⃣ | 🔄 Recarregue a aba (`Ctrl+R`) para capturar os headers do documento |

---

## 🖥️ A interface

```
┌──────────────────────────────────────────────┐
│ 🛡️  Sentinel Web Security         v0.1.4  ⚙️ │
├──────────────────────────────────────────────┤
│ 🏠 Overview │ 📡 Network │ 🛡️ Security │ 🍪 Cookies │
├──────────────────────────────────────────────┤
│  🌍  Current page          Monitor status    │
│      demo-app.local        🟢 Active         │
│                                              │
│  🔒 HTTPS        📄 Requests     ⏱️ Latency   ⚠️ Alerts │
│  Enabled         128             214 ms        3        │
│                                              │
│  ⏱️ Recent Requests                View all →│
│  GET  /api/login     200   123 ms           │
│  POST /api/auth      302   241 ms           │
│  GET  /assets/app.js 200    44 ms           │
│                                              │
│  🛡️ Security Findings         View details → │
│  ❌ Missing CSP                              │
│  ⚠️ Cookie without SameSite                  │
│  ⚠️ HSTS not detected                        │
├──────────────────────────────────────────────┤
│ ▶️ Start  ⏸️ Pause  🗑️ Clear  📤 Export       │
└──────────────────────────────────────────────┘
```

### 📑 Abas em detalhe

| Aba | Conteúdo |
|:---:|---|
| 🏠 **Overview** | Status do site, 4 métricas rápidas, últimas requisições e top 3 achados |
| 📡 **Network** | Tráfego completo com busca, filtro e expansão de cada requisição |
| 🛡️ **Security** | Achados heurísticos + tabela de headers de proteção |
| 🍪 **Cookies** | Cookies da aba com valores, atributos e expiração |

---

## 📁 Estrutura do pacote

```
sentinel-web-security/
├── 📄 manifest.json     →  Manifest V3, permissões e popup
├── ⚙️ background.js     →  Service worker, captura via chrome.webRequest
├── 🧠 security.js       →  Regras heurísticas
├── 🎨 popup.html        →  Interface popup
├── 💅 popup.css         →  Tema escuro, layout moderno
├── 🧩 popup.js          →  Lógica da interface
└── 🖼️ icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

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

## ✅ Verificações locais

```bash
node --check background.js
node --check popup.js
node --check security.js
```

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
