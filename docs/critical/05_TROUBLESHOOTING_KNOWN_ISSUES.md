---
agent_context: all devs
target_module: all
priority: high
status: active
last_updated: 2026-08-13
tags: [critical, troubleshooting, known-issues, assets, phaser]
---

# 🛠️ Troubleshooting & Known Issues (Problemas Conhecidos e Resoluções)

> **Resumo:** Guia prático de diagnóstico, causas-raiz e procedimentos de correção para problemas conhecidos de carregamento de assets híbridos, renderização de cenas Phaser e integração de UI React.

---

## 📌 Índice de Problemas Conhecidos

1. [Menu com Fallback Procedural em vez dos Assets Pixel Art do Lovable](#1-menu-com-fallback-procedural-em-vez-dos-assets-pixel-art)
2. [Canvas com Altura Zero ou Colapso em Modais React](#2-canvas-com-altura-zero-ou-colapso-em-modais-react)
3. [Instanciação Repetida / Memory Leak do Phaser no React](#3-instanciação-repetida--memory-leak-do-phaser-no-react)
4. [Erro de Lockfile na Vercel (`ERR_PNPM_OUTDATED_LOCKFILE`)](#4-erro-de-lockfile-na-vercel-err_pnpm_outdated_lockfile)
5. [Remoção de Limitação de Visão e Overlay de Escuridão](#5-remoção-de-limitação-de-visão-e-overlay-de-escuridão)
6. [Tabela de Diagnóstico Rápido](#6-tabela-de-diagnóstico-rápido)

---

## 1. Menu com Fallback Procedural em vez dos Assets Pixel Art

### 🔴 Sintoma
A tela inicial (`TitleScene`), configurações (`SettingsScene`) ou salão de recordes (`RecordsScene`) exibe gráficos geométricos simples em linhas e caixas douradas (fallback procedural gerado por `textureGenerator.ts`), em vez dos assets de alta fidelidade do Lovable (altar gótico, gárgulas em pedra, tochas vivas com partículas, arco rúnico e logotipo).

### 🔍 Causa-Raiz Detalhada
1. **Corrupção de Arquivos Binários de Imagem:** Gravação ou sincronização indevida de imagens binárias (PNG/JPG em `src/assets/ui/` e `public/`) através de ferramentas de edição de texto ou conversão implícita UTF-8. Quando um binário é salvo como string UTF-8, bytes arbitrários são substituídos pelo caractere de substituição `\uFFFD` (hex `EF BF BD`), destruindo o cabeçalho mágico de 8 bytes do PNG (`\x89PNG\r\n\x1a\n`) ou JPEG (`\xFF\xD8\xFF`). O utilitário `file` passa a reportar o arquivo genericamente como `data` em vez de imagem válida.
2. **Ativação do Fallback de Resiliência do Phaser:** Quando o carregador do Phaser tenta decodificar um arquivo binário corrompido, o navegador emite um erro de decodificação de imagem (`loaderror`). O sistema híbrido de assets do jogo aciona o fallback procedural (`textureGenerator.ts`), gerando a moldura geométrica dourada e textos básicos em canvas para prevenir um crash total da aplicação.
3. **Corrupção em Cadeia no Git Index:** A tentativa de indexar ou manipular arquivos binários alterados como texto pode corromper os objetos soltos (`.git/objects/`) ou os índices de pacote (`pack-*.idx`), gerando erros como `fatal: loose object is corrupt` ou `fatal: unknown index entry format`.

---

### ⚠️ Análise Post-Mortem da Regressão (Incidente 2026-08-14)

* **Sintoma Observado:** O menu principal voltou a exibir o layout geométrico amarelo/dourado antigo em vez dos assets de alta resolução do Lovable (altar, tochas animadas, logo gótico, gárgulas e arco rúnico).
* **Fator Desencadeante:** Os arquivos em `src/assets/ui/*.png` e `public/icon-*.png` tiveram seus primeiros bytes convertidos para `efbfbd504e470d0a...` (UTF-8 replacement byte sequence), invalidando o header PNG.
* **Mecanismo de Falha:** O `TitleScene.preload()` disparou o `loaderror` silencioso e invocou o gerador procedural de textura.
* **Ação Corretiva Executada:**
  1. Download dos arquivos binários puros a partir do GitHub via API REST (`/repos/.../contents/...`) com decodificação direta de `base64` para `Buffer` binário no Node.js (sem passar por strings intermediárias).
  2. Reparação do `.git` local com `git clone --bare` + `git reset`.
  3. Validação dos cabeçalhos binários com `file src/assets/ui/*`.
  4. Execução de `npm run typecheck && npm test` (133 testes verdes).
  5. Reinicialização do servidor de desenvolvimento.

---

### 🛡️ Regras Anti-Regressão para Arquivos Binários

1. **PROIBIDO usar ferramentas de texto em binários:** Nunca utilize ferramentas de edição de texto (`edit_file`, `create_file`, concatenação em bash) em arquivos de extensão `.png`, `.jpg`, `.webp`, `.woff2`, `.mp3` ou `.ogg`.
2. **Restauração Segura via Base64/Buffer:** Sempre que precisar restaurar ou baixar um asset, utilize buffers binários nativos (`Buffer.from(data, "base64")` ou `stream.pipe()`).
3. **Validação Obrigatória pré-commit:** Execute `file src/assets/ui/*` e certifique-se de que todos retornam `PNG image data` ou `JPEG image data`.

### 🧪 Como Diagnosticar
Execute no terminal:
```bash
file src/assets/ui/*
```
* **Correto:** `PNG image data, 1088 x 608, 8-bit/color RGBA...`
* **Corrompido:** `src/assets/ui/title-logo.png: data`

Verifique os checksums contra a fonte original do zip:
```bash
unzip -p animated-spark-art-main.zip animated-spark-art-main/src/assets/title-logo.png | md5sum
md5sum src/assets/ui/title-logo.png
```

### 🛠️ Procedimento de Resolução
1. **Opção A (A partir do Zip Local):**
   ```bash
   unzip -o animated-spark-art-main.zip "animated-spark-art-main/src/assets/*" -d src/assets/ui/
   mv src/assets/ui/animated-spark-art-main/src/assets/* src/assets/ui/
   rm -rf src/assets/ui/animated-spark-art-main
   ```
   **Opção B (Download Binário Direto do Repositório GitHub):**
   ```bash
   node -e '
   const https = require("https");
   const fs = require("fs");
   const token = process.env.GITHUB_TOKEN_PERSONAL;
   const repo = "felipeteixeirams/blood-mage-1995";
   const files = ["altar.png","gargoyle-bottom.png","gargoyle-top.png","rock-tile.jpg","rune-arch.png","stone-tile.jpg","title-logo.png","torch.png","ui-corner.png","ui-gem.png","ui-plaque.png","ui-slider-cap.png"];
   files.forEach(f => {
     https.get({ hostname: "api.github.com", path: `/repos/${repo}/contents/src/assets/ui/${f}`, headers: { "User-Agent": "NodeJS", "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json" } }, res => {
       let data = ""; res.on("data", c => data += c);
       res.on("end", () => {
         const j = JSON.parse(data);
         if (j.content) fs.writeFileSync(`src/assets/ui/${f}`, Buffer.from(j.content, "base64"));
       });
     });
   });
   '
   ```
2. Remova qualquer manipulação forçada de `imageLoadType` do método `preload()` das cenas.
3. Valide o tipo dos arquivos com `file src/assets/ui/*`.
4. Execute os testes e verificação de tipos:
   ```bash
   npm run typecheck && npm test
   ```

---

## 2. Canvas com Altura Zero ou Colapso em Modais React

### 🔴 Sintoma
Ao abrir o `SettingsModal` ou o `HighScoresModal`, o modal aparece com fundo escuro, mas o canvas do Phaser fica com altura 0px, invisível ou distorcido.

### 🔍 Causa-Raiz
Sobrescrita de estilos CSS no container pai (`[&_canvas]:!max-w-full [&_canvas]:!h-auto [&_canvas]:!w-auto`) associado a uma `<div>` sem altura explícita e com `max-w-2xl` colapsando a altura calculada pelo `Phaser.Scale.FIT`.

### 🛠️ Procedimento de Resolução
Defina dimensões base estruturais com proporção 16:9 (`960x540`) no container pai do React:
```tsx
<div 
  ref={containerRef}
  className="w-full max-w-5xl h-[540px] max-h-[90vh] aspect-[16/9] flex items-center justify-center relative shadow-2xl"
/>
```
Configure o Phaser Game com escala proporcional:
```ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

---

## 3. Instanciação Repetida / Memory Leak do Phaser no React

### 🔴 Sintoma
Queda gradual de FPS no menu principal, efeitos de áudio disparando duplicados ou logs de múltiplos games Phaser sendo criados.

### 🔍 Causa-Raiz
O `useEffect` de instanciação do `Phaser.Game` incluía funções mutáveis de callback (como `onStartGame`, `onOpenSettings`) no array de dependências, provocando destruição e recriação do ciclo de vida da engine a cada re-render do React.

### 🛠️ Procedimento de Resolução
1. Mantenha o `useEffect` de criação com dependências vazias `[]`:
   ```tsx
   useEffect(() => {
     if (!containerRef.current) return;
     const game = new Phaser.Game(config);
     gameRef.current = game;
     return () => {
       game.destroy(true);
       gameRef.current = null;
     };
   }, []);
   ```
2. Atualize callbacks dinâmicos via `game.registry.set(...)` em um segundo `useEffect` leve dependente das props.

---

## 4. Erro de Lockfile na Vercel (`ERR_PNPM_OUTDATED_LOCKFILE`)

### 🔴 Sintoma
O build falha na Vercel com o erro:
`ERR_PNPM_OUTDATED_LOCKFILE: Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json` (especificamente devido a dependências adicionadas como `omggif` e `pngjs`).

### 🔍 Causa-Raiz
Em ambientes CI/CD como a Vercel, o `pnpm install` roda por padrão com `--frozen-lockfile`. Se novas dependências foram adicionadas diretamente no `package.json` sem atualizar e commitar o `pnpm-lock.yaml`, o build falha por inconsistência de hash.

### 🛠️ Procedimento de Resolução
1. Execute localmente para atualizar o lockfile:
   ```bash
   pnpm install
   ```
2. Certifique-se de commitar e enviar o `pnpm-lock.yaml` atualizado:
   ```bash
   git add pnpm-lock.yaml
   git commit -m "fix(deps): update pnpm-lock.yaml for new dependencies"
   git push origin main
   ```

---

## 5. Remoção de Limitação de Visão e Overlay de Escuridão

### 🔴 Sintoma
O usuário reporta que o gameplay está muito escuro, com efeitos vermelhos cobrindo o personagem e os elementos do jogo devido ao sistema de vinheta dinâmica e raio de luz reduzido (`lightRadius`).

### 🔍 Causa-Raiz
O `GameScene` aplicava um `darknessOverlay` com gráficos em formato de furo ao redor do player e pulsos de alerta baseados em perigo, além de configurações restritivas de raio de luz em `WorldManager.ts`.

### 🛠️ Procedimento de Resolução
1. Limpar e desativar o `darknessOverlay` no loop de atualização do `GameScene`:
   ```ts
   if (this.darknessOverlay) {
     this.darknessOverlay.clear();
   }
   ```
2. Garantir que o mapa seja renderizado por completo sem vinhetas escuras ou restrições artificiais de visão.

---

## 6. Tabela de Diagnóstico Rápido

| Sintoma | Causa Mais Provável | Ferramenta / Comando de Diagnóstico | Ação Imediata |
|---|---|---|---|
| Menu retrô com formas geométricas em vez de texturas | PNG/JPG corrompidos em `src/assets/ui/` | `file src/assets/ui/*` | Reextrair do zip original |
| Modal Phaser invisível / tela preta | Container pai com `height: 0` | Inspecionar DOM (`computed style`) | Adicionar `h-[540px] aspect-[16/9]` |
| Game duplicando canvas | Dependências instáveis no `useEffect` | Checar array de deps no React | Isolar ciclo de vida do Phaser em `[]` |
| Erro de Lockfile na Vercel | `pnpm-lock.yaml` desincronizado com `package.json` | Logs da Vercel | Rodar `pnpm install` e commitar o lockfile |
| Cenário escuro / vinheta vermelha | Overlay de escuridão ativo em `GameScene` | Inspecionar `darknessOverlay` | Limpar overlay e remover restrições de visão |

---

## 🔗 Referências Relacionadas
- [[docs/critical/00_ANTI_REGRESSION_GUIDE.md]] — Regras e guardrails de estabilidade.
- [[docs/integration/00_LOVABLE_INTEGRATION.md]] — Diretrizes de integração de assets e telas do Lovable.
- [[docs/architecture/03_PHASER_PATTERNS.md]] — Padrões de ciclo de vida do Phaser.
