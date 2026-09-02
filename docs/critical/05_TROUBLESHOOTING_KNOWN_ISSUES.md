---
agent_context: all devs
target_module: all
priority: high
status: active
last_updated: 2026-08-21
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
12. [Unhandled Promise Rejection com Objeto Vazio (`reason: {}`) no Logger](#12-unhandled-promise-rejection-com-objeto-vazio-reason--no-logger)
13. [Regressão: `preload()` Gerando Fallback Procedural Antes de Tentar o Asset Real (TitleScene/SettingsScene/RecordsScene)](#13-regressão-preload-gerando-fallback-procedural-antes-de-tentar-o-asset-real)
14. [Corrupção de PNG/JPG "Volta Sozinha" Após Recuperação Manual (Corrupção Committada + Fonte de Recuperação Também Contaminada)](#14-corrupção-de-pngjpg-volta-sozinha-após-recuperação-manual-corrupção-committada--fonte-de-recuperação-também-contaminada)
15. [Reconstrução do Spritesheet do Jogador a Partir do PixelLab (e a Armadilha 48x48 vs 68x68)](#15-reconstrução-do-spritesheet-do-jogador-a-partir-do-pixellab-e-a-armadilha-48x48-vs-68x68)
16. [Conflito entre Sistemas Paralelos de Conquistas e Notificações (Phaser Canvas vs React Overlay)](#16-conflito-entre-sistemas-paralelos-de-conquistas-e-notificações-phaser-canvas-vs-react-overlay)
17. [Tabela de Diagnóstico Rápido](#17-tabela-de-diagnóstico-rápido)

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

## 13. Regressão: `preload()` Gerando Fallback Procedural Antes de Tentar o Asset Real

### 🔴 Sintoma
O menu principal (`TitleScene`), tela de ajustes (`SettingsScene`) e tela de recordes (`RecordsScene`) sempre exibem os placeholders geométricos dourados do fallback procedural, mesmo com os arquivos `.png`/`.jpg` do Lovable presentes e íntegros em `src/assets/ui/`. Verificar a integridade binária dos arquivos (`file src/assets/ui/*` ou `Format-Hex` no PowerShell) confirma que os arquivos estão válidos — o problema não é o asset em si.

### 🔍 Causa-Raiz
Um commit (`fca4fa5`, mensagem "fix: resolve UI asset load errors with pure procedural generation") removeu, das três cenas acima, o carregamento real via `this.load.image(chave, urlImportadaViaVite)` e deixou apenas:
```ts
preload() {
  generateUITextures(this); // gera TODAS as chaves incondicionalmente
}
```
Como `generateUITextures(this)` (sem filtro de chaves) roda incondicionalmente no `preload()`, as texturas procedurais ocupam as chaves (`altar`, `gargoyleTop`, `uiCorner`, etc.) antes de qualquer tentativa de carregar o arquivo real. O Phaser se recusa a sobrescrever uma chave de textura já existente, então mesmo que o asset físico seja perfeitamente válido, ele nunca tem a chance de ser carregado — o fallback procedural "ganha" sempre, por ordem de execução, não por falha real de carregamento. O código em `create()` que filtra `missingKeys` e gera fallback seletivo continuou intacto e correto, mas ficava morto: `missingKeys` nunca tinha nada porque o `preload()` já tinha preenchido todas as chaves antes.

Esse mesmo commit também corrompeu (texto UTF-8 sobre binário) `src/assets/ui/*`, `public/assets/sprites/player/bloodmage.png` e `public/assets/sprites/items/chest*` — e reduziu o histórico do repositório para 2 commits, então `git restore`/`git log` não ajudam a recuperar versões anteriores. A causa raiz completa do incidente de 2026-08-21 teve portanto duas partes independentes: (1) binários corrompidos, resolvido restaurando a arte original do export do Lovable (`temp_lovable/`) e regenerando `bloodmage.png`/baú via os scripts em `scripts/`; (2) o código de carregamento removido, resolvido restaurando os `this.load.image(...)` com imports Vite (`import x from "../../assets/ui/nome.png"`, com os `declare module '*.png'` já presentes em `src/vite-env.d.ts`).

### 🧬 Cadeia Completa de Culpados (scripts ad-hoc na raiz do projeto)
A remoção do carregamento real não foi um evento único — foi uma sequência de scripts de patch avulsos, todos rastreados no repositório, cada um removendo mais uma peça do pipeline correto:

| Script | O que fez |
|---|---|
| `update_assets.cjs` / `update_assets.js` | Substituiu as variáveis dos imports Vite (`altarUrl`, `torchUrl`, …) por **strings literais** `"/assets/ui/altar.png"`. Esses caminhos apontam para `public/assets/ui/`, que **não existe** — a arte vive em `src/assets/ui/` e só é resolvida via `import`. Resultado: todo `load.image` passou a dar 404. `update_assets.js` ainda removia os `import ... from "@/assets/ui/..."` antes disso. |
| `fix_scenes.cjs` | Removeu os `import \w+Url from "@/assets/ui/..."` restantes **e** o handler de `loaderror` que fazia fallback seletivo por chave — apagando justamente a visibilidade do problema. |
| `fix_remaining.cjs` | Removeu as chamadas `this.load.image("uiCorner"/"uiPlaque"/"uiGem"/"uiCap", ...)` de `SettingsScene.ts` e `RecordsScene.ts`. |
| `fix_imports.cjs` | Tentativa posterior de reverter, reinserindo os imports com alias `@/assets/ui/...`. |

Com os caminhos quebrados, o menu caía em fallback de forma legítima (404 real). O commit `fca4fa5` então "resolveu" o sintoma da pior maneira possível: em vez de consertar os caminhos, removeu o carregamento por completo e deixou `generateUITextures(this)` incondicional no `preload()`.

**Ação:** esses 7 scripts (`fix_imports.cjs`, `fix_remaining.cjs`, `fix_scenes.cjs`, `patch_audio.cjs`, `patch_pipelines.cjs`, `update_assets.cjs`, `update_assets.js`) devem ser removidos do repositório (`git rm`). Scripts de patch descartáveis que reescrevem código-fonte com regex não devem ser versionados — qualquer alteração estrutural em cenas deve ser feita e revisada como diff normal.

### 🛠️ Procedimento de Resolução
1. Em cada cena afetada, importe os assets via Vite (`import altarUrl from "../../assets/ui/altar.png";` etc.) e enfileire-os em `preload()` com `this.load.image(chave, url)` — **nunca** chame `generateUITextures(this)` sem filtro no `preload()`.
2. Mantenha a lógica de `create()` como está: `const missingKeys = uiKeys.filter(k => !this.textures.exists(k))` seguido de `generateUITextures(this, missingKeys)` — isso já implementa corretamente o fallback seletivo, só precisa que o `preload()` dê ao asset real a chance de carregar primeiro.
3. Adicione um listener de `loaderror` no `preload()` chamando `logger.warn('ASSET_LOADER', ...)` para visibilidade imediata no console de qual chave caiu no fallback.
4. Antes de aceitar qualquer commit com mensagem do tipo "fix... with pure procedural generation" ou similar, revise o diff manualmente — é um sinal de alerta de que o carregamento real pode ter sido removido em vez de corrigido.

---

## 14. Corrupção de PNG/JPG "Volta Sozinha" Após Recuperação Manual (Corrupção Committada + Fonte de Recuperação Também Contaminada)

### 🔴 Sintoma
Depois de copiar manualmente os arquivos originais (ex.: `Copy-Item -Force` do export limpo do Lovable em `temp_lovable/` para `src/assets/ui/`, ou de `sprites_importados/gothic_chest/...` para `public/assets/sprites/items/chest/`), o `pnpm verify` continua reportando exatamente os mesmos 21 arquivos como corrompidos (`EF BF BD` no lugar do byte mágico `0x89` do PNG). O tamanho do arquivo "recuperado" nem bate com o tamanho do arquivo de origem, o que descarta erro de digitação no comando de cópia.

Agravante: o hook `pre-commit` do husky roda `pnpm verify`, que falha justamente por causa desses arquivos — criando um **deadlock**, já que a correção não pode ser commitada enquanto a verificação não passar, e a verificação não passa enquanto a correção não for aplicada e persistida.

### 🔍 Causa-Raiz (duas causas independentes, confirmadas por inspeção binária + timestamps)

**(a) Para `src/assets/ui/*` (12 arquivos): a corrupção está *committada* no Git, não só no working tree.**
Os `mtime` dos 12 PNGs/JPGs de `src/assets/ui/` mostram que todos foram regravados **no mesmo instante** (`2026-08-21T14:42:01Z`, span de ~100ms) em que `package.json`, `AGENTS.md` e `tsconfig.base.json` também foram regravados — arquivos que só se movem juntos por uma operação de Git (stash pop, checkout, restore, merge, pull) tocando várias pastas de uma vez, nunca por um `Copy-Item` isolado de PNGs. Ou seja: a cópia manual funcionou no momento em que foi executada, mas uma operação de Git subsequente sobrescreveu o working tree de volta com o blob corrompido presente no índice/histórico. Enquanto esse blob permanecer commitado, qualquer operação de Git que descarte alterações locais nesses caminhos reintroduz a corrupção.

Comprovação adicional do mecanismo da corrupção: reproduzindo em Node um round-trip UTF-8 sobre o `altar.png` limpo (`Buffer.from(buf.toString("utf8"), "utf8")`), o resultado tem 1.187.977 bytes — praticamente idêntico aos 1.186.828 bytes do arquivo corrompido no repositório. A diferença residual de ~1.1 KB indica que o arquivo commitado no repo não era byte-idêntico ao export do Lovable (foi reotimizado em algum momento) e **foi essa versão do repo que sofreu o round-trip UTF-8**.

**(b) Para `public/assets/sprites/items/chest/*` (9 arquivos): a fonte de recuperação usada estava corrompida.**
`sprites_importados/gothic_chest/Idle/rotations/south.png` é **byte-idêntico** (mesmo hash MD5) ao arquivo de destino corrompido, e já começa com `EF BF BD`. Seu `mtime` é `2026-08-19T12:47:51Z` — dois dias *antes* do incidente do `preload()` (item 13), ou seja, um incidente separado: a pasta `sprites_importados/gothic_chest` (importada via `scripts/pixellab_client.cjs download`) nunca teve versão limpa. Copiar dela apenas propagava a mesma corrupção.

### ✅ Fonte de Recuperação Correta: o diretório `dist/`
O `dist/` (saída de build, fora do controle do Git via `.gitignore`) **não é afetado pela corrupção do working tree**, porque contém o resultado de um `vite build` executado antes do incidente. Ele foi a fonte de recuperação definitiva para o baú:

| Arquivo | Corrompido | Recuperado de `dist/` |
|---|---|---|
| `chest/east.png` | 6.354 bytes | 3.508 bytes — PNG 48x48 válido |
| `chest/north.png` | 4.563 bytes | 2.542 bytes — PNG 48x48 válido |
| `chest/south.png` | 6.481 bytes | 3.603 bytes — PNG 48x48 válido |
| *(demais 6 rotações + `chest.png`)* | inflados | todos PNG 48x48 válidos |

O `dist/assets/*.png|jpg` também continha os 12 assets de UI com hash idêntico ao export limpo do Lovable (`altar-B9hV2CcF.png` = 654.685 bytes), confirmando de forma independente qual era a versão correta.

### 🛠️ Procedimento de Resolução
1. **Nunca use `Copy-Item`/`cp` do PowerShell para restaurar binários neste projeto sem validar depois** — valide sempre com `Format-Hex -Count 4` (deve ser `89 50 4E 47` para PNG, `FF D8 FF` para JPG).
2. **UI (`src/assets/ui/*`):** restaure de `temp_lovable/.../src/assets/*` (ou de `dist/assets/<nome>-<hash>.png`).
3. **Baú (`public/assets/sprites/items/chest/*` + `chest.png`):** restaure de `dist/assets/sprites/items/chest/*` — **não** de `sprites_importados/gothic_chest/`, que está corrompida na origem. Se o `dist/` não existir mais, rode um build a partir de um commit anterior íntegro, ou regenere via PixelLab com `node scripts/pixellab_client.cjs download <character_id> sprites_importados/gothic_chest_v2` (pasta nova, para não confundir com a corrompida) e valide os bytes antes de copiar.
4. **Commite imediatamente após restaurar**, sem rodar nenhuma outra operação de Git no meio: `git add src/assets/ui public/assets/sprites/items && git commit -m "fix: restaura binarios corrompidos dos assets"`. Só depois disso é seguro fazer `pull`/`stash pop`/`checkout`.
5. **Se o deadlock do husky bloquear o commit** (verify falha → não commita → não corrige), use `git commit --no-verify` *apenas* nesse commit específico de restauração, e rode `pnpm verify` manualmente logo em seguida para confirmar.
6. **Regra geral:** valide qualquer fonte de recuperação **antes** de usá-la. Um "backup" pode já estar contaminado — foi exatamente o que aconteceu com `sprites_importados/gothic_chest/`.

### 🛡️ Prevenção
- `.gitattributes` já marca `*.png`/`*.jpg`/`*.webp` como `binary` — mantenha, mas saiba que isso protege o Git, **não** protege contra um script Node que leia/escreva o arquivo como string UTF-8.
- Nenhum script deve usar `fs.readFileSync(path, 'utf8')` seguido de `fs.writeFileSync` em arquivos de mídia. Os scripts do pipeline (`pixellab_client.cjs`, `fetch-spritecook-sprite.cjs`, `generate-asset.mjs`) já usam `Buffer` corretamente.
- **Os scripts de patch da raiz foram auditados e NÃO são a origem da corrupção binária.** Todos os 7 (`fix_imports.cjs`, `fix_remaining.cjs`, `fix_scenes.cjs`, `patch_audio.cjs`, `patch_pipelines.cjs`, `update_assets.cjs`, `update_assets.js`) usam `readFileSync(file, 'utf8')`, mas operam **exclusivamente sobre arquivos `.ts`/`.tsx`** — nenhum deles abre PNG ou JPG. Eles são responsáveis pela regressão de *carregamento* (item 13), não pela corrupção de *bytes*.
- A origem da corrupção binária permanece não atribuída a um script versionado; o padrão (`EF BF BD` substituindo bytes não-UTF-8, em lote, em vários diretórios ao mesmo tempo) é consistente com uma ferramenta de edição/agente que gravou os arquivos como texto. A defesa prática é o `scripts/verify-assets.cjs` no `pre-commit`, que barra o commit assim que isso acontecer.
- `scripts/verify-assets.cjs` (rodando no `pre-commit`) detecta exatamente esse padrão — trate qualquer falha dele como bloqueante, nunca como falso positivo.

---

## 15. Reconstrução do Spritesheet do Jogador a Partir do PixelLab (e a Armadilha 48x48 vs 68x68)

### 🔴 Sintoma
O personagem controlado aparece como arte procedural (bonecos geométricos gerados por código) mesmo com o pipeline de animação funcionando corretamente — as 22 animações do bloodmage tocam, as direções respondem, mas os pixels são de placeholder.

### 🔍 Causa-Raiz
`public/assets/sprites/player/bloodmage.png` era gerado por `scripts/generate_bloodmage_spritesheet.cjs`, que é **100% procedural** (desenha o personagem via buffer de pixels + zlib, sem ler nenhum arquivo de arte). Ele foi criado como recuperação de emergência durante o incidente de corrupção de 2026-08-21, quando **toda** a arte original do PixelLab em `sprites_importados/` foi destruída pela corrupção UTF-8 (item 14) — incluindo os GIFs em `public/assets/sprites/player/animated/`, cujo header `GIF89a` sobreviveu por ser ASCII mas cujo conteúdo tinha milhares de sequências `EF BF BD`.

Ou seja: **não havia bug de integração.** `BootScene` já fazia tudo na ordem correta (`queueAssetLoading` no `preload`, depois `generateGameTextures(this, { force: false })` e `registerAllAnimations(this)` no `create`), e `animationManager.ts` já tinha os índices de frame corretos. Faltava apenas a arte.

### 🛠️ Procedimento de Resolução
```powershell
# 1. Rebaixar a arte original (o character_id está em sprites_importados/<pasta>/metadata.json)
node scripts/pixellab_client.cjs download 5b677987-c87a-4f2e-a3d7-c0fdcea7eeb5 sprites_importados/blood_mage_v2

# 2. Montar o spritesheet no layout que o jogo espera
node scripts/build_bloodmage_spritesheet.cjs

# 3. Validar
pnpm verify
```

`scripts/build_bloodmage_spritesheet.cjs` compõe 72 frames numa grade de 8 colunas x 9 linhas de células 68x68 (544x612), exatamente no layout que `animationManager.ts` espera:

| Linha | Conteúdo | Frames |
|---|---|---|
| 0 | Idle — 1 frame por direção | 0-7 |
| 1-8 | Walk — 8 frames por direção | 8-71 |

Ordem canônica das direções em ambos: `south, south-east, east, north-east, north, north-west, west, south-west`. Alterar essa ordem no montador **sem** alterar `animationManager.ts` faz o personagem andar virado para o lado errado.

### ⚠️ A Armadilha: Tamanhos de Origem Diferentes
O export do PixelLab **não é homogêneo**:

| Origem | Tamanho |
|---|---|
| `Idle/rotations/*.png` (8 frames idle) | **48x48** |
| `Idle/animations/Walking/<dir>/frame_00N.png` (64 frames) | **68x68** |

O canvas dos frames de Walking vem com folga extra para acomodar o movimento. **Alinhar pela borda do arquivo faz o personagem "pular" alguns pixels na transição entre parado e andando** — um defeito sutil, constante, e difícil de diagnosticar depois.

A solução implementada é alinhar pelo **conteúdo**, não pela tela do arquivo: o montador calcula a caixa delimitadora dos pixels não-transparentes de cada frame (`contentBounds`) e ancora todos pelo centro horizontal da célula com os pés a `BOTTOM_MARGIN` do fundo. Resultado verificado nos 72 frames: base em `y=63` e centro em `x≈33.5` em todos, sem nenhuma célula vazia.

Como as células continuam 68x68, **nada mais precisa mudar** — nem `assetManifest.json` (`frameWidth`/`frameHeight`), nem o tamanho do personagem em tela.

### 🛡️ Guardrails do Montador
- **Recusa fonte corrompida.** Valida header PNG e a ausência de `EF BF BD` em cada arquivo de origem, abortando com `exit 1` e mensagem apontando para o item 14. Lição direta do incidente em que uma "recuperação" propagou a corrupção por copiar de `sprites_importados/gothic_chest/`, que já estava contaminada.
- **Sem dependências externas.** Decodifica e codifica PNG com `zlib` nativo (suporta bit depth 8, color types 0/2/3/4/6, não-entrelaçado). Não depende de `pngjs` nem de `canvas`.
- **Detecta a pasta de estado.** O PixelLab nomeia a subpasta conforme o personagem; o script procura automaticamente a que contém `rotations/` (preferindo a que também tem `animations/Walking`).

### 📌 Notas Operacionais
- Os frames de `casting_a_fireball` (8 direções x 6 frames) também vêm limpos no download. Para usá-los, estenda o sheet para 15 linhas e acrescente as definições em `animationManager.ts` — a animação `bloodmage_cast` hoje é um alias que reaproveita os frames de walk.
- Após confirmar a arte em jogo, **apague ou coloque no `.gitignore` as árvores corrompidas** em `sprites_importados/` (`blood_mage`, `gothic_chest`, `grimdark_playable`). Mantê-las lado a lado com as boas é o cenário exato que causou a recuperação a partir de fonte podre no item 14.
- O `scripts/generate_bloodmage_spritesheet.cjs` (procedural) deve ser tratado como **último recurso**, não como pipeline. Se ele voltar a ser a origem do `bloodmage.png`, o personagem volta a ser placeholder silenciosamente — o `verify` não detecta isso, porque o arquivo é um PNG perfeitamente válido.

---

## 16. Conflito entre Sistemas Paralelos de Conquistas e Notificações (Phaser Canvas vs React Overlay)

### 🔴 Sintoma
Existência de dois sistemas independentes e concorrentes de conquistas (`AchievementSystem.ts` no motor Phaser e `achievements` no `gameStore.ts`). Além disso, as notificações de conquista eram renderizadas diretamente dentro do canvas do Phaser através de `AchievementNotification.ts` (usando `Phaser.GameObjects.Container`, `Graphics` e `Text`), violando a **Guardrail 7 (Strict UI Layering: React DOM vs Phaser Canvas)**.

### 🔍 Causa-Raiz
Durante fases anteriores do desenvolvimento, um sistema de conquistas procedural foi instanciado dentro de `GameScene.ts` enquanto a UI do HUD React e o catálogo de dados (`src/data/achievements.json`) evoluíam na camada React/Zustand. Isso causava discrepâncias de pontuação/recompensas, duplicação de persistência e renderização de elementos de UI diretamente sobre a camada WebGL/Canvas em vez do DOM.

### 🛠️ Procedimento de Resolução
1. **Desacoplamento do Motor Phaser e Transição para Zustand**: As classes de visualização e rastreamento legadas (`AchievementNotification.ts` e `AchievementSystem.ts`) deixaram de ser invocadas no render loop de `GameScene.ts`.
2. **Avaliação Centralizada no Zustand (`src/store/gameStore.ts`)**: Adição de `runStats` e do método unificado `evaluateAchievements(stats, state)`. Qualquer evento de combate (morte de monstro, avanço de andar, dano tomado, knockout, desmembramento, feitiço desbloqueado) notifica a store via `incrementRunStat` ou `setRunStat`.
3. **UI Exclusiva no React DOM (`src/components/hud/AchievementToast.tsx`)**: O componente React subscrito a `lastUnlockedAchievement` renderiza o toast animado com badge de raridade e recompensas no topo da tela e executa auto-dismiss após 4.5 segundos.
4. **Persistência Segura**: Conquistas salvas em `localStorage` validadas estritamente via Zod schemas em `src/utils/localStorage.ts`.

---

## 17. Joystick Virtual com Base Fixa Impedia Movimento Confiável para a Esquerda (Ancoragem vs. Zona de Toque)

### 🔴 Sintoma
Reportado pelo usuário (2026-09-02): tocar com o dedo na região esquerda da tela fazia o personagem **andar para a direita**; mover o dedo mais para a esquerda apenas fazia o personagem **parar**; nunca era possível mover para a esquerda de forma confiável. Comportamento diferente do esperado em referências como Diablo Immortal e Mobile Legends.

### 🔍 Causa-Raiz
`VirtualJoystickSystem.ts` suporta dois modos de posicionamento da base do stick, controlados pela config `floatingStick`:
- `false` (era o default em `localStorage.ts` e `SettingsScene.ts`): a base fica **ancorada num ponto fixo** perto da borda, calculado em `init()` como `baseX = min(width * 0.12, 100)` — ou seja, ~100px da borda esquerda numa tela típica.
- `true`: a base **nasce onde o dedo toca** (`handlePointerDown`: `if (floatingStick) { baseX = pointer.x; baseY = pointer.y; }`), estilo Mobile Legends/Diablo Immortal.

O problema: a **zona de toque** que ativa o stick (`handlePointerDown`) aceita qualquer toque em até 48% da largura da tela (`pointer.x < width * 0.48`) — uma área bem maior que o pequeno ponto de ancoragem fixo. Com `floatingStick: false`, qualquer toque dentro dessa zona ampla que não fosse bem próximo dos ~100px da borda calculava `dx = pointer.x - baseX` **positivo** (direita) em relação à base fixa — fazendo o personagem andar para a direita mesmo com o toque "na região esquerda da tela". Arrastar o dedo de volta em direção à base fixa reduzia esse `dx` até quase zero (personagem "parava"), mas cruzar para um vetor negativo (esquerda) de verdade exigia tocar bem colado na borda esquerda, praticamente inalcançável com o polegar em uso normal.

O mesmo padrão de bug (config existente mas com default errado) afetava `dragToFollow` — nunca era passado por `GameScene.ts` em nenhuma chamada de `updateConfig`, então o default de classe (`false`) sempre prevalecia, desativando silenciosamente o "glide" ao arrastar além do raio máximo, mesmo com o comentário no código já descrevendo esse comportamento como "Mobile Legends / Diablo Immortal Drag-to-Follow Mechanic".

### 🔧 Como Diagnosticar
1. Reproduzir: tocar em qualquer ponto da metade esquerda da tela que não seja bem próximo da borda (~100px) e observar a direção inicial do movimento.
2. Inspecionar `settings.floatingStick` no `gameStore` — se `false`, a base está ancorada num ponto fixo.
3. Escrever um teste como os dois novos casos em `VirtualJoystickSystem.test.ts` (describe `regression: fixed-base stick...`): com `floatingStick: false`, um toque longe da base fixa produz `vec.x > 0` mesmo em um ponto "à esquerda" da tela.

### 🛠️ Procedimento de Resolução
1. `floatingStick: true` como novo default em `src/utils/localStorage.ts` (settings persistidos) e em `src/game/scenes/SettingsScene.ts` (`toggleDefs` e bloco de reset) — o jogador ainda pode desativar manualmente nas Configurações se preferir o modo fixo.
2. `dragToFollow` alterado para `true` como default de classe em `VirtualJoystickSystem.ts`, já que nunca é passado via `updateConfig` — sem isso o "glide" documentado no código nunca ativava de fato.
3. Testes de regressão adicionados em `VirtualJoystickSystem.test.ts` fixando os dois comportamentos (bug antigo reproduzido com `floatingStick: false` explícito + comportamento corrigido com `floatingStick: true`).

---

## 18. Tabela de Diagnóstico Rápido

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
| Corrupção de PNG volta após `Copy-Item`/`cp` de restauração | Blob corrompido ainda commitado no Git; operação de Git posterior sobrescreve o working tree | `git log --oneline -- <arquivo>` + comparar `mtime` dos arquivos afetados | Restaurar e commitar imediatamente (`git commit --no-verify` se o husky bloquear) |
| Restaurar de um backup e o arquivo continua corrompido | A própria fonte de recuperação está contaminada (ex.: `sprites_importados/gothic_chest/`) | `md5sum fonte destino` — se forem iguais, a fonte é o problema | Recuperar de `dist/` (build pré-corrupção) ou regerar via API |
| `pnpm verify` falha no `pre-commit` impedindo o commit da própria correção | Deadlock do hook husky | `husky - pre-commit script failed (code 1)` | `git commit --no-verify` só no commit de restauração + `pnpm verify` manual em seguida |
| Personagem em arte procedural com animações funcionando | `bloodmage.png` foi gerado pelo script procedural, não pela arte real | Abrir o PNG: bonecos geométricos = placeholder | `pixellab_client.cjs download` + `build_bloodmage_spritesheet.cjs` |
| Personagem "pula" alguns pixels ao parar de andar | Frames idle (48x48) e walk (68x68) alinhados pela borda do arquivo | Comparar dimensões dos PNGs de origem | Alinhar pela caixa do conteúdo, não pela tela (item 15) |
| Personagem anda virado para a direção errada | Ordem das direções do montador difere da de `animationManager.ts` | Conferir o array `DIRS` nos dois arquivos | Manter `south, south-east, east, north-east, north, north-west, west, south-west` |
| Conquistas e notificações desenhadas no canvas do jogo | Sistema legado de conquistas no Phaser (`AchievementSystem`/`AchievementNotification`) | Inspecionar instâncias em `GameScene.ts` | Migrar para `runStats` no Zustand + overlay React `AchievementToast.tsx` |
| Toque na esquerda da tela move o personagem pra DIREITA / nunca move pra esquerda | `floatingStick: false` (base fixa) + zona de toque bem mais larga que a base ancorada em `VirtualJoystickSystem.ts` | Testes de regressão em `VirtualJoystickSystem.test.ts` (`describe('regression: fixed-base stick...')`) | Definir `floatingStick: true` como default (`localStorage.ts`, `SettingsScene.ts`) |


---

## 🔗 Referências Relacionadas
- [[docs/critical/00_ANTI_REGRESSION_GUIDE.md]] — Regras e guardrails de estabilidade.
- [[docs/integration/00_LOVABLE_INTEGRATION.md]] — Diretrizes de integração de assets e telas do Lovable.
- [[docs/architecture/03_PHASER_PATTERNS.md]] — Padrões de ciclo de vida do Phaser.
