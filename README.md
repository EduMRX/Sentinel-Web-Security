# Sentinel Web Security 0.1.2

Versão **sem limites** da extensão: captura integral de URLs, cabeçalhos de requisição e resposta, corpos de requisição e cookies (nome + valor + atributos). Feita para laboratório controlado.

## Instalação

1. Extraia este ZIP.
2. Acesse `chrome://extensions` ou `edge://extensions` e ative o **modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione esta pasta (onde fica `manifest.json`).
4. Abra um site sobre o qual você possui autorização, clique em **Iniciar monitoramento** e conceda a permissão solicitada.
5. Recarregue a aba para capturar os cabeçalhos do documento.

## O que a 0.1.2 captura

- URL completa (query string, hash e credenciais embutidas preservadas, sem `slice`).
- Métodos, status, tempos aproximados, IP remoto, redirecionamentos e erros observados via `chrome.webRequest`.
- **Cabeçalhos de requisição e resposta na íntegra** — inclui `Authorization`, `Cookie`, `Set-Cookie`, `X-CSRF-Token` etc.
- **Corpo de requisição** em `onBeforeRequest` (`formData` e `raw` decodificado integralmente, sem corte em 8 KB).
- **Valores de cookies** com nome, valor, domínio, path, atributos, `hostOnly`, `storeId` e `expirationDate` completos.
- Heurísticas sobre cabeçalhos, CORS, cookies, `Server`, `X-Powered-By`.
- Exportação JSON/CSV completa.
- Monitor desativado por padrão; permissão solicitada ao usuário ao ativar.

## Avisos importantes

- **Contém dados sensíveis por design.** `Authorization`, `Cookie`, `Set-Cookie`, tokens CSRF, senhas de formulário e PII podem ser capturados, exibidos e exportados. Nunca compartilhe os arquivos exportados sem revisar.
- A permissão `<all_urls>` concede visibilidade ampla no navegador — **não** fica restrita à aba ativa.
- `chrome.storage.session` **não** criptografa contra ameaças locais. `unlimitedStorage` foi adicionado ao manifest para reduzir falhas de cota, mas o storage de sessão ainda tem custo em memória.
- O `service worker` pode ser suspenso; temporizações e eventos assíncronos podem gerar registros incompletos.
- A observação é apenas do tráfego do próprio navegador — não do computador inteiro.
- Status e heurísticas **não comprovam vulnerabilidade**. Faça testes somente com autorização.
- Exportações em páginas grandes podem chegar a dezenas de MB; alguns visualizadores podem travar.

## Limites técnicos que permanecem

- `chrome.webRequest` **não** vê corpos de resposta (seria necessário `chrome.debugger`, com banner de aviso ao usuário).
- WebSocket, HTTP/2 push e alguns pré-voos podem não aparecer.
- `extraHeaders` só funciona com host permission concedida no domínio.
- Cabeçalhos duplicados são concatenados com vírgula.

## Verificações locais

```bash
node --check background.js
node --check popup.js
node --check security.js