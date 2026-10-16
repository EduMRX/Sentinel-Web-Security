#!/usr/bin/env python3
"""Prepare the public-source FREE edition from the existing signed CRX.
Never includes PEM/private signing keys. Keeps PRO source outside the repo.
"""
from pathlib import Path
import io, json, zipfile

ROOT = Path(__file__).resolve().parents[1]
crx = ROOT / "Sentinel-Web-Security-God.crx"
raw = crx.read_bytes()
start = raw.find(b"PK\x03\x04")
if start < 0:
    raise SystemExit("CRX sem arquivos ZIP internos")
with zipfile.ZipFile(io.BytesIO(raw[start:])) as source:
    allowed = {"manifest.json","background.js","security.js","popup.html","popup.css","popup.js",
               "icons/icon16.png","icons/icon32.png","icons/icon48.png","icons/icon128.png"}
    for name in allowed:
        (ROOT / name).parent.mkdir(parents=True,exist_ok=True)
        (ROOT / name).write_bytes(source.read(name))

manifest = json.loads((ROOT/"manifest.json").read_text(encoding="utf-8-sig"))
manifest["name"]="Sentinel Web Security — Free"
manifest["short_name"]="Sentinel Free"
manifest["description"]="Inspeção HTTP(S), cabeçalhos de segurança e cookies, local e gratuita. Use somente em sites autorizados."
manifest["version"]="0.1.5"
manifest.pop("optional_host_permissions",None)
manifest["host_permissions"]=["<all_urls>"]
(ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

p = (ROOT/"popup.js").read_text(encoding="utf-8")
begin,end = p.index("function renderNetwork() {"),p.index("function renderSecurity() {")
network = """function renderNetwork() {
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

"""
p=p[:begin]+network+p[end:]
oldPermission="const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });"
assert oldPermission in p, "Padrão de permissão mudou"
p=p.replace(oldPermission,"const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });")
assert "await chrome.permissions.remove({ origins: ['<all_urls>'] });" in p
p=p.replace("await chrome.permissions.remove({ origins: ['<all_urls>'] });",
   "// A permissão obrigatória deve ser alterada nas configurações da extensão.")
p=p.replace("state.granted = false;",
   "state.granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });")
p=p.replace("Revogar acesso e limpar todos os dados capturados de todas as abas?",
            "Desativar e limpar todos os dados capturados de todas as abas?")
p=p.replace("version: '0.1.4'", "version: '0.1.5'")
p=p.replace("function exportJson() {", """function exportJson() {
  if (!confirm('A exportação JSON pode conter cookies, senhas e tokens. Não compartilhe sem revisar. Continuar?')) return;""")
p=p.replace("function exportCsv() {", """function exportCsv() {
  if (!confirm('O CSV pode conter URLs com dados privados. Revise antes de compartilhar. Continuar?')) return;""")
(ROOT/"popup.js").write_text(p,encoding="utf-8")

html=(ROOT/"popup.html").read_text(encoding="utf-8")
html=html.replace("v0.1.4","v0.1.5 · Free")
html=html.replace('title="Revogar acesso e limpar dados"',
    'title="Desativar e limpar dados (permissões nas configurações do navegador)"')
needle='        <div class="stats-grid">'
assert needle in html, "Não encontrou stats-grid"
cta = """        <div class="free-pro-cta" role="note">
          <div><strong>Conheça a Sentinel PRO</strong><span>Relatórios instantâneos e auditorias avançadas.</span></div>
          <a href="mailto:sentinel.suporte.oficial@gmail.com?subject=Interesse%20na%20Sentinel%20PRO">Saiba mais ↗</a>
        </div>

"""
html=html.replace(needle,cta+needle,1)
(ROOT/"popup.html").write_text(html,encoding="utf-8")
css=(ROOT/"popup.css").read_text(encoding="utf-8")
css += """
.free-pro-cta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;padding:11px 13px;border:1px solid rgba(16,185,129,.32);border-radius:12px;background:rgba(16,185,129,.055)}
.free-pro-cta div{display:flex;flex-direction:column;gap:4px;min-width:0}
.free-pro-cta strong{color:#dffef0;font-size:12px}
.free-pro-cta span{color:#9aa9b9;font-size:10px;line-height:1.4}
.free-pro-cta a{flex-shrink:0;color:#35e0a7;font-size:11px;font-weight:700;text-decoration:none}
.free-pro-cta a:hover{text-decoration:underline}
"""
(ROOT/"popup.css").write_text(css,encoding="utf-8")

(ROOT/"README.md").write_text("""# 🛡️ Sentinel Web Security — FREE

**Inspecione o tráfego HTTP(S) do navegador com clareza.** Extensão gratuita para profissionais de TI, desenvolvedores e estudantes, voltada exclusivamente para sistemas próprios ou com autorização de teste.

![Versão](https://img.shields.io/badge/vers%C3%A3o-0.1.5_Free-10b981) ![Chrome/Edge](https://img.shields.io/badge/Chrome%20%2F%20Edge-Manifest_V3-3b82f6) ![Preço](https://img.shields.io/badge/pre%C3%A7o-gr%C3%A1tis-brightgreen)

## O que a versão gratuita oferece

- **Overview:** estado do monitor, HTTPS, requisições capturadas e latência aproximada.
- **Network:** GET/POST, status, headers, corpos de requisição quando disponíveis, filtros e detalhes que **não se fecham sozinhos** durante atualizações.
- **Security:** verificações heurísticas de cabeçalhos de segurança.
- **Cookies:** análise dos atributos Secure, HttpOnly, SameSite e expiração.
- **Exportações JSON/CSV:** podem conter informações sensíveis e exigem confirmação.
- Interface local, sem conta obrigatória e sem telemetria.

## Instalação gratuita (Edge / Chrome)

1. Clique em **Code → Download ZIP** e extraia o projeto.
2. Acesse \`edge://extensions\` ou \`chrome://extensions\`.
3. Ative o **Modo do desenvolvedor** e clique em **Carregar sem compactação**.
4. Selecione **a pasta que contém o arquivo \`manifest.json\`**.
5. Leia as permissões. Em um site próprio ou autorizado, clique no ícone e selecione **Start Monitoring**. Recarregue a aba.

> **Atenção:** a extensão usa permissão ampla de acesso aos sites para monitoramento. O usuário pode pausar, limpar dados, desativar, restringir permissões nas configurações do navegador ou desinstalar.

## 📸 Prévia

![Overview com dados ilustrativos](https://github.com/user-attachments/assets/e99e494f-cec4-4ab3-bc48-2e84a3439689)

## ✨ Quer mais? Conheça a SENTINEL PRO

A edição **PRO** oferece relatórios instantâneos organizados, inspeção avançada de CSP/JWT, comparações de capturas, análises adicionais e recursos de produtividade.

**📩 Para saber detalhes, preço e disponibilidade, envie um e-mail para [sentinel.suporte.oficial@gmail.com](mailto:sentinel.suporte.oficial@gmail.com?subject=Quero%20conhecer%20a%20Sentinel%20PRO).**

A edição PRO **não** está incluída neste repositório gratuito.

## Privacidade e limitações

- O monitor pode coletar URLs completas, cookies, cabeçalhos e corpos de requisição, inclusive tokens e senhas. **Use apenas em ambientes próprios ou autorizados**.
- **Nunca compartilhe capturas brutas sem revisar ou ocultar segredos.**
- A nota HTTPS não valida certificados. Alertas heurísticos não equivalem a vulnerabilidades comprovadas.
- Recursos do navegador e cotas de memória podem limitar capturas em páginas muito grandes.

## Licença

Uso gratuito sujeito aos termos de [LICENSE-FREE.md](LICENSE-FREE.md). Código visível não significa licença open-source. Não revenda a edição Free nem utilize a marca comercialmente sem autorização.

**Contato oficial:** sentinel.suporte.oficial@gmail.com
""",encoding="utf-8")
(ROOT/"LICENSE-FREE.md").write_text("""# Licença de uso gratuito — Sentinel Web Security Free

Copyright © 2026, titular do projeto Sentinel Web Security. Todos os direitos reservados.

É concedida permissão gratuita, não exclusiva para instalar, usar e estudar a edição Free para fins pessoais, educacionais e profissionais lícitos em sistemas próprios ou autorizados.

É vedada a revenda, sublicenciamento ou redistribuição comercial da edição Free, ou a publicação de versões modificadas com a marca Sentinel, sem permissão prévia por escrito do titular.

A extensão é fornecida no estado em que se encontra, sem garantia de ausência de falhas, exatidão dos alertas ou adequação a fins específicos, nos limites permitidos pela legislação aplicável.

Contato: sentinel.suporte.oficial@gmail.com
""",encoding="utf-8")
(ROOT/"CHANGELOG.md").write_text("""# Histórico

## v0.1.5 Free
- Identidade Free e chamada para a versão PRO.
- Permissão de sites declarada no manifesto.
- Correção da Network: detalhes expandidos continuam abertos durante atualizações.
- Listagem limitada a 200 itens simultâneos para reduzir travamentos.
- Confirmação antes de exportar dados possivelmente sensíveis.

## v0.1.4
- Base de inspeção local HTTP(S), headers e cookies.
""",encoding="utf-8")
(ROOT/".gitignore").write_text("""*.pem
*.key
*.p12
*.pfx
.env
.env.*
node_modules/
.DS_Store
*.crx
*.zip
sentinel-*.json
sentinel-*.csv
""",encoding="utf-8")
(ROOT/"Sentinel-Web-Security-God.crx").unlink()
print("Sentinel Free v0.1.5 construída a partir do CRX existente.")
