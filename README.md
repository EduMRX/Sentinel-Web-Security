# Sentinel Web Security

Monitor HTTP(S) local para **Chrome / Edge (Manifest V3)**, com interface popup. Captura passiva de URLs, cabeçalhos de requisição e resposta, corpos de requisição e cookies (nome + valor + atributos), além de aplicar regras heurísticas de segurança.

> ⚠️ **Uso restrito.** Ferramenta de inspeção pessoal e testes autorizados. Captura dados sensíveis (tokens, cookies, `Authorization`, senhas de formulário). Nunca opere em sites de terceiros sem autorização escrita, e nunca compartilhe exportações sem revisar.

---

## Recursos

- **URL completa** — query string, hash e credenciais embutidas preservadas.
- **Cabeçalhos de requisição e resposta** — inclui `Authorization`, `Cookie`, `Set-Cookie`, `X-CSRF-Token`.
- **Corpo de requisição** — `formData` e `raw` (UTF-8) capturados via `onBeforeRequest`.
- **Cookies** — nome, valor, domínio, path, `Secure`, `HttpOnly`, `SameSite`, `hostOnly`, `storeId`, `expirationDate`.
- **Metadados de rede** — método, status, duração aproximada, IP remoto, redirecionamentos e erros.
- **Heurísticas** — CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer-Policy, CORS, cookies sem flags, fingerprinting via `Server` / `X-Powered-By`.
- **Exportação** — JSON completo e CSV das requisições.
- **100% local** — sem servidor, sem cadastro, sem analytics, sem chamadas externas.

## Instalação

1. Clone ou baixe este repositório.
2. Abra `chrome://extensions` (ou `edge://extensions`) e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta onde está o `manifest.json`.
4. Fixe o ícone do Sentinel na barra de extensões.
5. Abra um site **que você tem autorização para testar**, clique no ícone e pressione **Iniciar monitoramento**.
6. Conceda a permissão `<all_urls>` quando o navegador solicitar.
7. Recarregue a aba (`Ctrl+R`) para capturar os cabeçalhos do documento.

## Como usar

- **Visão geral** — últimas requisições e diagnósticos rápidos.
- **Rede** — tráfego completo, com busca e filtro por status. Clique em qualquer entrada para expandir headers e corpo.
- **Segurança** — achados heurísticos e cabeçalhos de proteção do documento principal.
- **Cookies** — todos os cookies acessíveis à aba, com valores.
- **↓ Exportar JSON / CSV** — salva o snapshot da aba atual.
- **↺** — limpa dados da aba atual.
- **Revogar acesso** — pausa, limpa tudo e remove a permissão.

## Arquivos

```
.
├── manifest.json     # Configuração MV3 e permissões
├── background.js     # Service worker: captura via chrome.webRequest
├── popup.html        # Interface popup
├── popup.css         # Estilos
├── popup.js          # Lógica da UI
├── security.js       # Regras heurísticas
└── icons/            # Ícones (16, 32, 48, 128)
```

## Permissões

| Permissão | Finalidade |
|---|---|
| `storage` | Estado e captura em `chrome.storage.session` |
| `tabs` | Identificar a aba ativa |
| `webRequest` | Observar requisições HTTP(S) |
| `cookies` | Ler cookies da aba (nome + valor + atributos) |
| `unlimitedStorage` | Evitar estouro de cota |
| `optional_host_permissions: <all_urls>` | Solicitada **somente** ao clicar em "Iniciar" |

Nenhuma permissão é usada em segundo plano sem ativação manual.

## Limitações

- `chrome.webRequest` **não** vê corpos de resposta. Para isso seria necessário `chrome.debugger`, que exibe banner de aviso ao usuário.
- WebSocket, HTTP/2 push e alguns pré-voos CORS podem não aparecer.
- `extraHeaders` só funciona com host permission concedida.
- Cabeçalhos duplicados são concatenados com vírgula.
- Páginas internas (`chrome://`, `edge://`, Chrome Web Store) não são monitoráveis.
- O service worker MV3 pode ser suspenso; requisições iniciadas antes da ativação podem aparecer sem duração.

## Aviso legal

Este projeto **não** faz pentest, interceptação TLS, varredura ativa ou inspeção de certificados. Ele observa apenas o tráfego do **próprio navegador** onde foi instalado. O indicador HTTPS reflete apenas o esquema da URL, não a validade do certificado.

O uso em sistemas de terceiros sem autorização pode violar leis de acesso não autorizado (por exemplo, Lei 12.737/2012 no Brasil, Computer Fraud and Abuse Act nos EUA). **Você é o único responsável pelo uso.**

## Licença

Defina a licença de sua preferência. Se não pretende abrir para contribuições, escolha **No license** ao criar o repositório — a imagem que você mostrou está com essa opção selecionada, o que significa "todos os direitos reservados" por padrão.
```
