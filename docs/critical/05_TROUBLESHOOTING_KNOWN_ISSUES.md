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

### 🔍 Causas-Raiz Detalhadas (Investigação Aprofundada)
1. **Corrupção de Arquivos Binários de Imagem:** Gravação ou sincronização indevida de imagens binárias (PNG/JPG em `src/assets/ui/` e `public/`) através de ferramentas de edição de texto ou conversão implícita UTF-8. Quando um binário é salvo como string UTF-8, bytes arbitrários são substituídos pelo caractere de substituição `\uFFFD` (hex `EF BF BD`), destruindo o cabeçalho mágico de 8 bytes do PNG (`\x89PNG\r\n\x1a\n`), as dimensões do chunk IHDR (gerando larguras ou alturas negativas nos bytes de metadados) ou o cabeçalho JPEG (`\xFF\xD8\xFF`). O utilitário `file` passa a reportar o arquivo genericamente como `data` em vez de imagem válida.
2. **Sobrescrita Indevida no `preload()` de Cenas:** Em implementações anteriores de `TitleScene.ts`, `SettingsScene.ts` e `RecordsScene.ts`, o método `preload()` chamava `generateUITextures(this)` de forma incondicional. Isso fazia com que o gerador procedural de canvas apagasse e substituísse do `TextureManager` as texturas físicas recém-carregadas. A regra correta é que `preload()` registre os assets físicos via `this.load.image()` e apenas no `create()` os fallbacks sejam gerados estritamente para chaves ausentes (`missingKeys`).
3. **Ativação do Fallback de Resiliência do Phaser:** Quando o carregador do Phaser tenta decodificar um arquivo binário corrompido, o navegador emite um erro de decodificação de imagem (`loaderror`). O sistema híbrido de assets do jogo aciona o fallback procedural (`textureGenerator.ts`), gerando a moldura geométrica dourada e textos básicos em canvas para prevenir um crash total da aplicação.
4. **Corrupção em Cadeia no Git Index:** A tentativa de indexar ou manipular arquivos binários alterados como texto pode corromper os objetos soltos (`.git/objects/`) ou os índices de pacote (`pack-*.idx`), gerando erros como `fatal: loose object is corrupt` ou `fatal: unknown index entry format`.

---

### ⚠️ Análise Post-Mortem da Regressão (Incidente e Resolução Definitiva)

* **Sintoma Observado:** O menu principal voltou a exibir o layout geométrico amarelo/dourado antigo em vez dos assets de alta resolução do Lovable (altar, tochas animadas, logo gótico, gárgulas e arco rúnico).
* **Fatores Desencadeantes:**
  1. Corrupção de bytes em assets binários por manipulação textual.
  2. Chamada incondicional de `generateUITextures(this)` no ciclo de `preload()` das cenas Phaser.
* **Mecanismo de Falha:** O `TitleScene.preload()` disparou o `loaderror` e/ou substituiu as chaves da textura no `TextureManager`.
* **Ação Corretiva e Blindagem Executada:**
  1. **Restauração Pura via Git Blobs API:** Download dos blobs de SHA originais do repositório remoto via API REST (`/repos/.../git/blobs/:sha`) convertendo diretamente de base64 para `Buffer` binário em Node.js (sem parsing ou encoding UTF-8).
  2. **Separação de Ciclo de Vida no Phaser:** Atualização do `preload()` em `TitleScene.ts`, `SettingsScene.ts` e `RecordsScene.ts` para enfileirar os assets físicos com `this.load.image()`, delegando a geração de fallback no `create()` estritamente para chaves não existentes em cache (`!this.textures.exists(k)`).
  3. **Script de Verificação Automática (`scripts/verify-assets.cjs`):** Scanner completo com validação de magic bytes, detecção de sequências `\xEF\xBF\xBD` e validação de bounds IHDR em todos os diretórios `src/assets`, `public/assets`, `public/fonts` e `public`.
  4. **Teste Unitário Automatizado (`src/game/assets/assetIntegrity.test.ts`):** Suíte Vitest integrada aos testes padrão do projeto (`npm test` e `npm run verify`), bloqueando deploys e commits caso qualquer asset binário seja corrompido.
  5. **Configuração Estrita em `.gitattributes`:** Marcação explícita de `binary -text -diff merge=binary` para `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.woff2`, `.mp3`, `.ogg` e `.wav`.

---

### 🛡️ Regras Anti-Regressão para Arquivos Binários

1. **PROIBIDO usar ferramentas de texto em binários:** Nunca utilize ferramentas de edição de texto (`edit_file`, `create_file`, `cat`, `sed`, `awk`, `echo`) em arquivos de extensão `.png`, `.jpg`, `.jpeg`, `.webp`, `.woff2`, `.mp3` ou `.ogg`.
2. **Restauração Segura via Git Blobs (Buffer Binário):** Sempre que precisar restaurar ou baixar um asset, utilize buffers binários nativos (`Buffer.from(data, "base64")` ou `stream.pipe()`).
3. **Validação Obrigatória pré-commit e pré-build:** Execute `node scripts/verify-assets.cjs` e `npm test` para assegurar integridade 100% verde.

### 🧪 Como Diagnosticar
Execute no terminal:
```bash
node scripts/verify-assets.cjs
file src/assets/ui/* public/assets/ui/*
```
* **Correto:** `PNG image data, 1088 x 608, 8-bit/color RGBA...`
* **Corrompido:** `src/assets/ui/title-logo.png: data` ou `Dimensões IHDR inválidas`

### 🛠️ Procedimento de Resolução Automatizado
Para restaurar qualquer asset corrompido diretamente do repositório git:
```bash
node -e '
const https = require("https");
const fs = require("fs");
const path = require("path");
const token = process.env.GITHUB_TOKEN_PERSONAL;
const repo = "felipeteixeirams/blood-mage-1995";

const assetBlobs = [
  { path: "src/assets/ui/altar.png", sha: "9d007ca257de9d91c57ddd5f4c988dd7c6bcc122" },
  { path: "src/assets/ui/gargoyle-bottom.png", sha: "f5085b79f96d865fb685906a249cc248624465d8" },
  { path: "src/assets/ui/gargoyle-top.png", sha: "ac124e81f251322ea35984b7b9b86d3c0790af09" },
  { path: "src/assets/ui/rock-tile.jpg", sha: "89171a9481b370d259bcb51d296cdccccb372623" },
  { path: "src/assets/ui/rune-arch.png", sha: "fe57c0da7949ddeb3026504f23842ae897d9c183" },
  { path: "src/assets/ui/stone-tile.jpg", sha: "f6703db30fb10608bb343b7461cbd9c5ad809f0e" },
  { path: "src/assets/ui/title-logo.png", sha: "6c3a241cb8ba38e07aa840de7f371bb849e83447" },
  { path: "src/assets/ui/torch.png", sha: "ade07512492b69b1ea2599aaaefd84a4df94deb0" },
  { path: "src/assets/ui/ui-corner.png", sha: "f3ba0583de9a2c90c76f4a290d04ba18c2ff263e" },
  { path: "src/assets/ui/ui-gem.png", sha: "04a6b33e2df42fced490c212836164102efcf993" },
  { path: "src/assets/ui/ui-plaque.png", sha: "83170d00f96343c5931857be004228dd30245128" },
  { path: "src/assets/ui/ui-slider-cap.png", sha: "c78309a69e614d7885b736da589bfd6d284ab6e8" }
];

assetBlobs.forEach(item => {
  https.get({
    hostname: "api.github.com",
    path: `/repos/${repo}/git/blobs/${item.sha}`,
    headers: { "User-Agent": "NodeJS", "Authorization": `token ${token}` }
  }, res => {
    let data = ""; res.on("data", d => data += d);
    res.on("end", () => {
      const json = JSON.parse(data);
      if (json.content) {
        fs.mkdirSync(path.dirname(item.path), { recursive: true });
        fs.writeFileSync(item.path, Buffer.from(json.content, "base64"));
      }
    });
  });
});
'
node scripts/verify-assets.cjs
npm run verify
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

## 13. Expansão de Animações do Blood Mage (Spritesheet de 17 Linhas com Cast 8-Direcional)

### 🔴 Sintoma
Durante a conjuração de magias ativas (como Hellfire Nova, Syphon Soul, Bone Shield, Crimson Scythe e Blood Ritual Circle), o personagem permanecia estático ou utilizava a animação de caminhada genérica (`bloodmage_walk_down`), sem feedback visual dedicado de conjuração na direção do alvo/mira.

### 🔍 Causa-Raiz
1. **Spritesheet Legado Restrito:** O spritesheet original possuía apenas 9 linhas (544x612 pixels: Linha 0 = Idle 8-dir, Linhas 1..8 = Walk 8-dir).
2. **Ausência de Frames de Cast no Gerador:** O gerador procedural e o spritesheet estático não continham linhas para os frames de conjuração (`cast`), limitando a animação `bloodmage_cast` a apontar para frames de caminhada.

### 🛠️ Procedimento de Resolução
1. **Expansão do Gerador para 17 Linhas (544x1156 pixels):**
   - Linha 0 (frames 0..7): Idle direcional (8 direções).
   - Linhas 1..8 (frames 8..71): Walk direcional (8 frames por direção = 64 frames).
   - Linhas 9..16 (frames 72..135): Cast direcional (8 frames por direção = 64 frames com elevação do cajado, orbe pulsante e centelhas carmesins).
2. **Atualização do Pipeline Híbrido (`scripts/generate_bloodmage_spritesheet.cjs` e `src/utils/textureGenerator.ts`):**
   - Ambos os geradores atualizados para renderizar com precisão o novo layout de 17 linhas.
3. **Registro das Animações em `src/game/animations/animationManager.ts`:**
   - Adicionadas as 8 animações `bloodmage_cast_south`, `bloodmage_cast_south_east`, `bloodmage_cast_east`, `bloodmage_cast_north_east`, `bloodmage_cast_north`, `bloodmage_cast_north_west`, `bloodmage_cast_west` e `bloodmage_cast_south_west`.
4. **Acionamento em `src/game/objects/Player.ts`:**
   - O `update()` do jogador avalia `isAttackingOrManualAim` para reproduzir o `animState = 'cast'`, acionado imediatamente por disparos automáticos e pelo lançamento de qualquer magia ativa.

---

## 14. Corrupção de Assets de Baú / Menu e Desalinhamento de FrameSize de Spritesheet

### 🔴 Sintoma
Ao carregar o jogo em produção na Vercel, o menu principal e os elementos do mundo (como baús e o jogador) revertem para gráficos procedurais dourados/geométricos em vez dos assets de alta fidelidade em pixel art.

### 🔍 Causa-Raiz
1. **Corrupção de Bytes em Arquivos Binários (UTF-8 Replacement):** Arquivos binários (`.png`, `.jpg`) de UI e itens foram manipulados através de ferramentas com parsing de texto UTF-8, corrompendo os bytes iniciais (`\x89PNG` transformado em `\xEF\xBF\xBD\x50\x4E\x47`). O navegador falha ao decodificar a imagem física (`loaderror`), acionando o fallback procedural do `textureGenerator.ts`.
2. **Descompasso de Dimensões no Manifest e Fallbacks:** O manifest de assets (`assetManifest.ts`) e os geradores de fallback e spritesheet apresentavam variações entre 48x48 e 68x68, causando descompasso nos frames ou hitbox do jogador.

### 🛠️ Procedimento de Resolução
1. **Restauração Pura de UI via Git Blobs API:** Download dos bytes binários puros dos assets de UI (`altar.png`, `title-logo.png`, `gargoyle-*.png`, `torch.png`, `rune-arch.png`, etc.) a partir dos hashes de blobs válidos no GitHub.
2. **Geração Limpa de Sprites Binários com `pngjs`:** Criação dos scripts `scripts/generate_chest_assets.cjs`, `scripts/generate_pwa_icons.cjs` e `scripts/generate_bloodmage_spritesheet.cjs` que constroem e gravam os arquivos PNG diretamente como buffers binários em 48x48 (spritesheet de 384x816 para o jogador com 17 linhas: idle, 8 walk e 8 cast; e 8 baús góticos direcionais em 48x48).
3. **Unificação de Dimensões do `spr_bloodmage` e `spr_chest`:** Alinhado `assetManifest.ts`, `textureGenerator.ts` e `Player.ts` para 48x48 (`frameWidth: 48, frameHeight: 48`).
4. **Validação Automática:** Execução de `node scripts/verify-assets.cjs` (103 assets verificados com sucesso) e `npm test` (24 test files / 206 tests aprovados).

---

## 15. Tabela de Diagnóstico Rápido

| Sintoma | Causa Mais Provável | Ferramenta / Comando de Diagnóstico | Ação Imediata |
|---|---|---|---|
| Menu retrô com formas geométricas em vez de texturas | PNG/JPG corrompidos ou sobrescrita no preload | `node scripts/verify-assets.cjs` ou `file src/assets/ui/*` | Restaurar via Git Blobs API (Buffer puro) e garantir `this.load.image` no preload |
| Gráficos procedurais no baú e jogador na Vercel | PNGs de itens/UI corrompidos com UTF-8 replacement ou frameWidth incorreto | `node scripts/verify-assets.cjs` | Rodar geradores binários (`generate_chest_assets.cjs`, `generate_bloodmage_spritesheet.cjs`) e ajustar frame dimensions no manifest |
| Modal Phaser invisível / tela preta | Container pai com `height: 0` | Inspecionar DOM (`computed style`) | Adicionar `h-[540px] aspect-[16/9]` |
| Game duplicando canvas | Dependências instáveis no `useEffect` | Checar array de deps no React | Isolar ciclo de vida do Phaser em `[]` |
| Erro de Lockfile na Vercel | `pnpm-lock.yaml` desincronizado com `package.json` | Logs da Vercel | Rodar `pnpm install` e commitar o lockfile |
| Cenário escuro / vinheta vermelha | Overlay de escuridão ativo em `GameScene` | Inspecionar `darknessOverlay` | Limpar overlay e remover restrições de visão |
| `Failed to process file ... spritesheet` no console | Arquivo externo listado no manifest não existe em `public/` | `isAssetPhysicallyAvailable` no `assetManifest.ts` | Filtrar assets no `queueAssetLoading` antes do `scene.load` |
| Touchpad / Joystick Virtual não move o personagem | Zonas de toque sem `pointer-events-auto` no overlay | Inspecionar `#touchpad-move-zone` no DOM | Adicionar `pointer-events-auto` e estabilizar `useFloatingJoystick` |
| `TypeError: undefined is not an object (evaluating 'this.scene.tweens')` | Inimigo destruído antes de callback de timer (`spawnGibs`, `delayedCall`) | Inspecionar stack trace no console | Capturar `const scene = this.scene` no escopo externo e usar guards `scene?.tweens` |
| `Assets in public directory cannot be imported` no log do Vite | Arquivo de teste/rascunho no root importando via `import.meta.glob('/public/...')` | `grep -rn "public/assets" .` | Remover arquivos temporários e referenciar caminhos relativos ao `public/` sem `/public/` |
| Fallbacks procedurais sem visibilidade no console | Falta de `logger.warn` em falhas de carregamento e no `localStorage` | Inspecionar Observability Modal | Usar `logger.warn('ASSET_LOADER', ...)` e `logger.warn('PERSISTENCE', ...)` |
| Personagem Blood Mage como sombra preta | Spritesheet ausente / incompatível com shader Light2D | Inspecionar textura `spr_bloodmage` | Gerar spritesheet 544x1156 e integrar no pipeline híbrido |
| Atiradores atacando fora da tela / avançando demais | `visionDistance` e `attackRange` excessivos + lunge indevido | Inspecionar `monsters.json` e `Enemy.ts` | Calibrar velocidades, kiting tático a 80-100% de alcance e travar lunge para ranged |
| Botões do React DOM sobrepondo tela inicial do Lovable | Camada redundante de botões HTML em `MainMenu.tsx` | Inspecionar DOM em `MainMenu.tsx` | Remover botões DOM sobrepostos e restaurar `buildHud()` / `buildMenu()` nativos do `TitleScene.ts` |
| `[UNHANDLED_REJECTION] Unhandled Promise Rejection {"reason": {}}` | Propriedades não-enumeráveis de `Error` no logger + conflito de SoundManager do Phaser / autoplay | Inspecionar `logger.ts` e logs de áudio | Extrair propriedades completas de `Error`, monkey-patch em `resume()` e configurar `audio: { noAudio: true }` no Phaser |
| Falta de animação de conjuração direcional no Blood Mage | Spritesheet de apenas 9 linhas sem frames de cast | Inspecionar `bloodmage_cast_*` em `animationManager.ts` | Expandir para 17 linhas (544x1156) e registrar animações 8-direcionais de cast |

---

## 🔗 Referências Relacionadas
- [[docs/critical/00_ANTI_REGRESSION_GUIDE.md]] — Regras e guardrails de estabilidade.
- [[docs/integration/00_LOVABLE_INTEGRATION.md]] — Diretrizes de integração de assets e telas do Lovable.
- [[docs/architecture/03_PHASER_PATTERNS.md]] — Padrões de ciclo de vida do Phaser.
