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
6. [Erros de Carregamento de Sprites Inexistentes no Loader Phaser (`Failed to process file`)](#6-erros-de-carregamento-de-sprites-inexistentes-no-loader-phaser)
7. [Controles de Toque / Touchpad / Joystick Virtual Não Respondendo](#7-controles-de-toque--touchpad--joystick-virtual-não-respondendo)
8. [Erro de Execução em Callbacks Assíncronos (`this.scene.tweens`) e `setTintFill` no Phaser 4](#8-erro-de-execução-em-callbacks-assíncronos-thisscenetweens-e-settintfill-no-phaser-4)
9. [Classificação de Severidade de Logs (Assets Inexistentes e Fallbacks como WARN)](#9-classificação-de-severidade-de-logs-assets-inexistentes-e-fallbacks-como-warn)
10. [Sprite do Personagem Blood Mage Renderizando como Sombra Preta e Pacing de IA / Atiradores](#10-sprite-do-personagem-blood-mage-renderizando-como-sombra-preta-e-pacing-de-ia--atiradores)
11. [Sobreposição Indevida de Menus React DOM sobre o Logotipo e Arte do TitleScene](#11-sobreposição-indevida-de-menus-react-dom-sobre-o-logotipo-e-arte-do-titlescene)
12. [Tabela de Diagnóstico Rápido](#12-tabela-de-diagnóstico-rápido)

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

## 6. Erros de Carregamento de Sprites Inexistentes no Loader Phaser (`Failed to process file`)

### 🔴 Sintoma
O console do navegador exibe múltiplos erros de carregamento durante a inicialização (`BootScene`):
`Failed to process file: %s "%s" spritesheet spr_golem`
`Failed to process file: %s "%s" spritesheet spr_skeleton`
`Failed to process file: %s "%s" spritesheet spr_hound`
`Failed to process file: %s "%s" image proj_blood_bolt`...

### 🔍 Causa-Raiz
O `GAME_ASSET_MANIFEST` em `src/game/assets/assetManifest.ts` mapeia todos os assets externos planejados para o bestiário e projéteis. Quando o `BootScene` chamava `queueAssetLoading(this)` sem filtrar pela existência física em disco, o Phaser tentava carregar URLs de arquivos inexistentes (`/assets/sprites/enemies/skeleton.png`). Como o servidor Vite/Express retorna fallback SPA (`index.html`) para rotas 404, o decodificador de imagem do Phaser tentava interpretar o documento HTML como imagem binária, disparando `Image.onerror` e logando erros no console.

### 🛠️ Procedimento de Resolução
1. Utilizar detecção automática de arquivos físicos em tempo de build/dev com `import.meta.glob('/public/assets/**/*.{png,webp,jpg,jpeg,ogg,mp3,wav}', { eager: true })` via `isAssetPhysicallyAvailable(path)` em `src/game/assets/assetManifest.ts`.
2. Em `queueAssetLoading()`, enfileirar no `scene.load` apenas os assets que realmente existem em disco.
3. Para todos os demais itens do manifesto, o `BootScene` invoca `generateGameTextures(this, { force: false })`, gerando os fallbacks procedurais limpos sem ruído no console.

---

## 7. Controles de Toque / Touchpad / Joystick Virtual Não Respondendo

### 🔴 Sintoma
O jogador tenta mover ou mirar usando a tela de toque, touchpad de notebook ou arrasto de ponteiro/mouse, mas o personagem não se move e o joystick virtual não aparece nem responde aos gestos.

### 🔍 Causa-Raiz
1. **Herança de `pointer-events: none`:** O container raiz do `GameplayHUD` possui a classe `pointer-events-none` para permitir que cliques passem para o canvas do Phaser. As zonas de toque (`MOVE` à esquerda e `AIM` à direita) utilizavam apenas `touch-none` (que aplica apenas `touch-action: none;`), omitindo a classe explícita `pointer-events-auto`. Em decorrência disso, todos os eventos de ponteiro (`pointerdown`, `pointermove`, `pointerup`) eram bloqueados e ignorados pelo navegador.
2. **Detecção Rígida de Touch Device:** A verificação dependia estritamente de `('ontouchstart' in window) || navigator.maxTouchPoints > 0`, ignorando as preferências de `controlsMode` configuradas pelo usuário e falhando em ambientes de desktop/touchpad ou simuladores onde `maxTouchPoints` é 0.
3. **Parâmetro de Sensibilidade Desconectado:** O ajuste de sensibilidade de toque (`touchSensitivity`) nas configurações não era repassado para a função de curva de resposta do joystick (`applyJoystickResponse`).

### 🛠️ Procedimento de Resolução
1. Em `GameplayHUD.tsx`, adicionar explicitamente `pointer-events-auto select-none` e IDs únicos (`#touchpad-move-zone`, `#touchpad-aim-zone`) nas zonas interativas de movimento e mira.
2. Utilizar `showTouchControls` compatível com `settings.controlsMode !== 'keyboard'`, `window.matchMedia('(pointer: coarse)')`, touchscreens e touchpads.
3. Em `useFloatingJoystick.ts`, utilizar referências estáveis (`useRef`) para `onUpdate` e `responseConfig` com tratamento seguro de `setPointerCapture` e `releasePointerCapture`.
4. Integrar `sensitivity` em `applyJoystickResponse` (`src/utils/joystickResponse.ts`) e garantir o repasse contínuo de vetores para `GameScene.setTouchInputs()`.

---

## 8. Erro de Execução em Callbacks Assíncronos (`this.scene.tweens`) e `setTintFill` no Phaser 4

### 🔴 Sintoma
Durante o combate (morte de inimigos, execução de gibs/ragdoll ou acerto de projéteis), o jogo trava com a seguinte exceção no console:
`[ERROR] [GLOBAL_EXCEPTION] TypeError: undefined is not an object (evaluating 'this.scene.tweens')`
e avisos de:
``setTintFill(color)` is removed as of Phaser 4. Use setTint(color).setTintMode(Phaser.TintModes.FILL)` instead.`

### 🔍 Causa-Raiz
1. **Desvinculação do `scene` no Ciclo de Vida do Sprite (`this.destroy()`):** Quando um inimigo (`Enemy`) morre ou sofre dano letal excessivo, métodos como `spawnGibs()` ou `takeDamage()` agendam callbacks assíncronos (`time.addEvent`, `time.delayedCall`). Quando o timer atinge seu término (~500ms a 4s depois), o Sprite do inimigo já foi destruído (`this.destroy()`) pela cena ou pelo pool de objetos. A destruição no Phaser redefine `this.scene = undefined` na instância. Se a função dentro da closure tentar acessar `this.scene.tweens.add()`, ocorre um `TypeError` fatal que congela o loop de update do Phaser.
2. **Descontinuação do `setTintFill` no Phaser 4:** O método `setTintFill` foi substituído no pipeline de renderização WebGL do Phaser 4 por `setTint(color)` combinado com `setTintMode(Phaser.TintModes.FILL)`.

### 🛠️ Procedimento de Resolução
1. **Captura Local Imutável do `scene`:** Em qualquer método que crie partículas, efeitos ou timers assíncronos que sobrevivam à entidade, capture `const scene = this.scene; if (!scene || !scene.add || !scene.time) return;` no escopo da função antes de criar o evento.
2. **Guarda Defensiva de Objetos e Tweens:** No corpo de callbacks e timers, utilize a referência capturada `scene.tweens.add(...)` com verificações `if (scene && scene.tweens && gib.active)` e garanta a destruição segura `if (gib && gib.active) gib.destroy()`.
3. **Compatibilidade com Phaser 4 Tint Modes:** Substituir chamadas diretas a `setTintFill(0xffffff)` por `this.setTint(0xffffff)` e condicionar `setTintMode(Phaser.TintModes.FILL)` somente quando suportado pelo objeto.

---

## 9. Classificação de Severidade de Logs (Assets Inexistentes e Fallbacks como WARN)

### 🔴 Sintoma
1. Mensagens informativas no console (`[INFO]`) mascaravam eventos de degradação como assets físicos ausentes ou falha em parses de schemas no `localStorage`.
2. O servidor Vite exibia mensagens como `Assets in public directory cannot be imported from JavaScript` durante o arranque e pre-warming.

### 🔍 Causa-Raiz
1. **Logs de Fallback com Severidade Inadequada:** Quando assets físicos mapeados no `assetManifest.ts` não são encontrados no disco, o jogo ativa o fallback procedural. Tratar isso como `INFO` impedia que telemetrias e desenvolvedores identificassem quais assets físicos estavam faltando. Eventos de degradação controlada (como fallbacks procedurais, dados corrompidos no `localStorage` recuperados para defaults, ou quedas de FPS) pertencem estritamente ao nível `WARN`.
2. **Arquivos Temporários de Teste no Root:** Arquivos de rascunho (como `test_glob.ts`) que utilizavam `import.meta.glob('/public/assets/...')` eram indexados pelo Vite Dev Server durante o pre-warming, disparando avisos do bundler.

### 🛠️ Procedimento de Resolução
1. **Classificação Rigorosa de Logs (`logger.ts`):**
   - `ERROR`: Falhas não recuperáveis, exceções de I/O em disco/rede, erros críticos.
   - `WARN`: Assets físicos ausentes (ativação de fallback procedural), schemas inválidos no `localStorage` recuperados para defaults, degradação de FPS (<30 FPS), expansão dinâmica de pools.
   - `INFO`: Marcos de ciclo de vida (gamepads conectados, conclusão bem-sucedida de carregamento, inicialização de sistemas).
   - `DEBUG`: Gravações e leituras rotineiras de persistência (cristais, mortes, settings) em runtime.
2. **Remoção de Arquivos Temporários:** Remover scripts de rascunho do root (`test_glob.ts`, etc.) para manter o scanner do Vite limpo.

---

## 10. Sprite do Personagem Blood Mage Renderizando como Sombra Preta e Pacing de IA / Atiradores

### 🔴 Sintoma
1. O personagem Blood Mage é renderizado na tela de jogo como uma silhueta/sombra preta sem detalhes de textura visíveis.
2. Inimigos aproximam-se muito rapidamente do jogador, e monstros atiradores (como o *Acólito Sombrio*) iniciam ataques à distância fora do campo visual da tela e aproximam-se excessivamente em vez de manter uma distância de combate tática (ritmo estilo Dungeon Siege 1).

### 🔍 Causa-Raiz
1. **Pipeline de Iluminação Light2D sem Normal Map / Dimensões do Spritesheet:** O `LightingSystem` aplica o pipeline `Light2D` ao jogador. Quando o spritesheet procedural ou carregado não possuía mapeamento de normal maps ou havia descompasso no tamanho dos frames do spritesheet de 8 direções (`68x68`), o shader de luz 2D renderizava a silhueta com albedo nulo/escuro.
2. **Parâmetros de Velocidade, Visão e Lunge em Atiradores:**
   - As velocidades base dos monstros estavam calibradas em faixas muito elevadas (ex: 95 a 165 px/s), comprimindo o tempo de reação tática do jogador.
   - O raio de visão e alcance de ataque dos atiradores (`attackRange: 190`, `visionDistance: 360-500`) permitia que atacassem alvos fora do enquadramento da câmera.
   - A fase de golpe (`strike`) da FSM de ataque executava um lunge para frente mesmo quando `attackType === 'ranged'`, fazendo os magos avançarem em direção ao jogador em vez de manter a posição.

### 🛠️ Procedimento de Resolução
1. **Spritesheet e Normal Map Procedurais para o Player:**
   - Criado e injetado o gerador do spritesheet `spr_bloodmage` (544x612: grade 8x9 de frames 68x68 para as 8 direções em repouso e caminhada com cajado, orbe pulsante de sangue e túnica carmesim) em `src/utils/textureGenerator.ts` e exportado como PNG em `public/assets/sprites/player/bloodmage.png`.
   - Ajustado o `hitbox` físico (`setSize(22, 28)`, `setOffset(23, 24)`) em `Player.ts`.
2. **Calibração de Velocidade e Visão Estilo Dungeon Siege 1:**
   - Reduzidas as velocidades em `src/data/monsters.json`: `skeleton_warrior` (95 -> 68), `cultist_acolyte` (65 -> 50), `hell_hound` (140 -> 95), `flesh_golem` (55 -> 42), `blood_specter` (110 -> 75), `zombie_shambler` (70 -> 48), `vampire_stalker` (135 -> 90), `werewolf_lycan` (120 -> 85), `bat_swarm` (165 -> 105), `gore_abomination` (60 -> 45), `necro_lord_boss` (65 -> 52).
   - Reduzido o raio de visão dos monstros para 220–280px (boss para 320px) para garantir engajamento apenas dentro da tela.
3. **IA Tática para Atiradores e Conjuradores (`Enemy.ts`):**
   - Na fase de golpe (`strike`), conjuradores à distância não executam avanço físico (`setVelocity(0, 0)`).
   - O comportamento `ranged` mantém a distância ótima entre 80% e 100% do alcance (`attackRange: 160`), recuando taticamente com kiting se o jogador se aproximar e só disparando caso haja linha de visão direta desobstruída por paredes (`!hasWallBetweenPlayer`).

---

## 11. Camada Duplicada de Menu React DOM sobre a Tela Inicial do Lovable

### 🔴 Sintoma
Ao carregar a tela inicial, botões de React DOM ("INICIAR JORNADA", "CONTINUAR", "RECORDES", "CONQUISTAS", "GRIMÓRIO", "AJUSTES", etc.) eram desenhados por cima do canvas Phaser, gerando uma camada duplicada de interface sobre a tela gótica original gerada pelo Lovable.

### 🔍 Causa-Raiz
1. **Duplicação de UI em Camadas Diferentes:** O Lovable implementou a tela inicial inteiramente dentro do Phaser Canvas em `TitleScene.ts` (`buildHud` com os badges interativos `[C] CONTINUAR`, `[P] JOGAR`, `[O] OPÇÕES`, o troféu dourado `RECORDES` e o texto pulsante `PRESSIONE PARA INICIAR`, além do submenu `buildMenu`).
2. **Overlay DOM React Sobressalente em `MainMenu.tsx`:** Durante iterações anteriores, uma pilha de botões HTML/Tailwind foi adicionada ao `MainMenu.tsx`, ocultando e concorrendo diretamente com a tela inicial original em pixel art.

### 🛠️ Procedimento de Resolução
1. **Restauração Completa do `TitleScene.ts` (Motor Lovable):**
   - Reativadas as funções `buildHud()` e `buildMenu()`, provendo navegação 100% integrada no canvas com atalhos de teclado (`C`, `P`, `O`, `Space`, `Enter`, `Escape`), suporte a Gamepad e cliques diretos nos elementos góticos (altar, prompt, badges e troféu).
   - O submenu embutido "GRIMÓRIO & OPÇÕES" despacha as ações para abrir os modais React quando acionado (Bestiário, Conquistas, Recordes e Ajustes).
2. **Limpeza do `MainMenu.tsx`:**
   - Removidos todos os botões DOM sobrepostos ("INICIAR JORNADA", "CONTINUAR", etc.).
   - O `MainMenu.tsx` atua estritamente como montador do canvas de proporção 16:9 (`BASE_W = 960`, `BASE_H = 540`) com controles discretos de cabeçalho (badge de versão e alternador de áudio no canto).

---

## 12. Unhandled Promise Rejection com Objeto Vazio (`reason: {}`) no Logger

### 🔴 Sintoma
O console/logger exibia o erro:
```text
[17:22:37.624] [ERROR] [UNHANDLED_REJECTION] Unhandled Promise Rejection
{
  "reason": {}
}
```

### 🔍 Causa-Raiz
1. **Serialização de Objetos `Error` e `DOMException`:**
   - No JavaScript, instâncias nativas de `Error` e `DOMException` têm propriedades como `name`, `message`, `stack` e `code` definidas como não-enumeráveis (`enumerable: false`).
   - Quando o `logger.ts` encapsulava o evento como `{ reason: event.reason }` e repassava ao `JSON.stringify` ou `console.error`, os campos nativos do erro eram ignorados, gerando o objeto vazio `{ "reason": {} }` e ocultando a causa real.
2. **Rejeição de Promises por Políticas de Autoplay de Áudio do Navegador:**
   - Navegadores modernos (Chrome, Safari, Firefox) bloqueiam chamadas a `AudioContext.resume()` ou `HTMLMediaElement.play()` disparadas antes do primeiro gesto/clique do usuário no documento (`NotAllowedError`).
   - Múltiplas instâncias do Phaser (`MainMenu.tsx`, `PhaserGame.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`) criavam SoundManagers internos por padrão. Como o jogo utiliza seu próprio sintetizador Web Audio independente (`src/utils/soundEngine.ts`), os SoundManagers redundantes do Phaser tentavam desbloquear contextos de áudio e geravam rejeições de promessa não capturadas.

### 🛠️ Procedimento de Resolução
1. **Extração e Formatação Completa de Erros no `LoggerService` (`src/utils/logger.ts`):**
   - Implementado extrator explícito no listener `window.onunhandledrejection` que extrai `name`, `message`, `stack`, `code`, `cause` e todas as propriedades próprias de `event.reason`.
   - Adicionado filtro de supressão para rejeições inofensivas de autoplay ou loop de redimensionamento do navegador (`The play() request was interrupted`, `ResizeObserver loop`, etc.).
2. **Monkey-Patch Global de Áudio e Mídia (`src/main.tsx`):**
   - Adicionada blindagem com captura de exceções `.catch(() => {})` em `AudioContext.prototype.resume`, `AudioContext.prototype.suspend` e `HTMLMediaElement.prototype.play`.
3. **Desativação de Áudio Nativo Redundante no Phaser:**
   - Adicionada a propriedade `audio: { noAudio: true }` a todas as instâncias do `Phaser.Game` (`MainMenu.tsx`, `PhaserGame.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`), delegando 100% da síntese de áudio de forma segura para o `soundEngine.ts`.
4. **Tratamento no Registro de Service Worker (`src/App.tsx`):**
   - Adicionado callback `onRegisterError` e bloco `try/catch` ao `registerSW` do PWA.

---

## 13. Tabela de Diagnóstico Rápido

| Sintoma | Causa Mais Provável | Ferramenta / Comando de Diagnóstico | Ação Imediata |
|---|---|---|---|
| Menu retrô com formas geométricas em vez de texturas | PNG/JPG corrompidos em `src/assets/ui/` | `file src/assets/ui/*` | Reextrair do zip original ou restaurar via binary stream |
| Modal Phaser invisível / tela preta | Container pai com `height: 0` | Inspecionar DOM (`computed style`) | Adicionar `h-[540px] aspect-[16/9]` |
| Game duplicando canvas | Dependências instáveis no `useEffect` | Checar array de deps no React | Isolar ciclo de vida do Phaser em `[]` |
| Erro de Lockfile na Vercel | `pnpm-lock.yaml` desincronizado com `package.json` | Logs da Vercel | Rodar `pnpm install` e commitar o lockfile |
| Cenário escuro / vinheta vermelha | Overlay de escuridão ativo em `GameScene` | Inspecionar `darknessOverlay` | Limpar overlay e remover restrições de visão |
| `Failed to process file ... spritesheet` no console | Arquivo externo listado no manifest não existe em `public/` | `isAssetPhysicallyAvailable` no `assetManifest.ts` | Filtrar assets no `queueAssetLoading` antes do `scene.load` |
| Touchpad / Joystick Virtual não move o personagem | Zonas de toque sem `pointer-events-auto` no overlay | Inspecionar `#touchpad-move-zone` no DOM | Adicionar `pointer-events-auto` e estabilizar `useFloatingJoystick` |
| `TypeError: undefined is not an object (evaluating 'this.scene.tweens')` | Inimigo destruído antes de callback de timer (`spawnGibs`, `delayedCall`) | Inspecionar stack trace no console | Capturar `const scene = this.scene` no escopo externo e usar guards `scene?.tweens` |
| `Assets in public directory cannot be imported` no log do Vite | Arquivo de teste/rascunho no root importando via `import.meta.glob('/public/...')` | `grep -rn "public/assets" .` | Remover arquivos temporários e referenciar caminhos relativos ao `public/` sem `/public/` |
| Fallbacks procedurais sem visibilidade no console | Falta de `logger.warn` em falhas de carregamento e no `localStorage` | Inspecionar Observability Modal | Usar `logger.warn('ASSET_LOADER', ...)` e `logger.warn('PERSISTENCE', ...)` |
| Personagem Blood Mage como sombra preta | Spritesheet ausente / incompatível com shader Light2D | Inspecionar textura `spr_bloodmage` | Gerar spritesheet 544x612 e integrar no pipeline híbrido |
| Atiradores atacando fora da tela / avançando demais | `visionDistance` e `attackRange` excessivos + lunge indevido | Inspecionar `monsters.json` e `Enemy.ts` | Calibrar velocidades, kiting tático a 80-100% de alcance e travar lunge para ranged |
| Botões do React DOM sobrepondo tela inicial do Lovable | Camada redundante de botões HTML em `MainMenu.tsx` | Inspecionar DOM em `MainMenu.tsx` | Remover botões DOM sobrepostos e restaurar `buildHud()` / `buildMenu()` nativos do `TitleScene.ts` |
| `[UNHANDLED_REJECTION] Unhandled Promise Rejection {"reason": {}}` | Propriedades não-enumeráveis de `Error` no logger + conflito de SoundManager do Phaser / autoplay | Inspecionar `logger.ts` e logs de áudio | Extrair propriedades completas de `Error`, monkey-patch em `resume()` e configurar `audio: { noAudio: true }` no Phaser |


---

## 🔗 Referências Relacionadas
- [[docs/critical/00_ANTI_REGRESSION_GUIDE.md]] — Regras e guardrails de estabilidade.
- [[docs/integration/00_LOVABLE_INTEGRATION.md]] — Diretrizes de integração de assets e telas do Lovable.
- [[docs/architecture/03_PHASER_PATTERNS.md]] — Padrões de ciclo de vida do Phaser.
