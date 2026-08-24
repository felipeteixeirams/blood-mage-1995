# 🤖 Agent Instructions & Project Guidelines (AIDD-Optimized)

## 📌 Context Budgeting & Efficiency Guidelines (MUST OBEY)

To prevent context window bloat, reduce token cost, and prevent hallucinations/regression:
1. **Never read multiple full source files unless absolutely necessary.** Use targeted tools like specific file reading, `grep`, or documentation indexing.
2. **Prioritize documentation over code investigation.** Consult `/docs/README.md` first to find out which targeted document has your answers.
3. **If you must modify a file above 400 lines (e.g. `GameScene.ts` or `GameplayHUD.tsx`), perform surgery with surgical accuracy.** Use precise search-and-replace or git merge diff blocks. Never rewrite or replace the entire file.

---

## 🚦 Mode Selection & Spec-Driven Discipline (MUST OBEY)

> **Princípio Fundamental:** Nem toda interação exige especificação formal.
> Evite burocracia desnecessária. Classifique a solicitação antes de qualquer ação:

### 1. Conversational Mode (Zero-Overhead / Baixo Atrito)
- **Gatilhos:** Perguntas conceituais, dúvidas rápidas, brainstorm de design/game feel, opiniões técnicas, alinhamentos simples.
- **Regra:** Responda diretamente, de forma concisa e útil. **PROIBIDO** criar specs formais, arquivos em `docs/specs/` ou planos de implementação não solicitados.

### 2. Architecture Mode (Tradeoffs & Decisões Estruturais)
- **Gatilhos:** Discussão estrutural, tradeoffs técnicos, desenho de sistemas ou fluxos de integração.
- **Regra:** Apresente prós/contras e alternativas pragmáticas. Gere mini-specs **apenas se solicitado**.

### 3. Spec-Driven Mode (Implementações Relevantes & Refatorações Críticas)
- **Gatilhos:** APENAS quando o usuário pedir implementação de nova feature relevante, refatoração de múltiplos módulos ou mudança em persistência/arquitetura.
- **Regra:** Siga o ciclo formal em 3 fases: `Spec Phase` ➔ `Contract Phase` ➔ `Implementation Phase` (ver `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`).

---

## 🛡️ Absolute Game Rules & Architectural Guardrails

Every agent modifying this codebase MUST respect the following strict, non-negotiable boundaries:

### 1. Hybrid Asset Architecture (Assets Externos + Fallback Procedural)
- **Permissão de Assets Externos:** Assets físicos (imagens PNG/WebP e áudios MP3/OGG) são permitidos desde que integrados estritamente sob o pipeline híbrido com fallback procedural unificado para evitar regressões visuais ou quebras de áudio.
- **Mecanismo de Chave Única e Fallback Procedural Mandatório:** Nunca associe ou mude as chaves de forma destrutiva. O código deve sempre tentar carregar o arquivo físico em primeiro lugar. Caso o carregamento falhe, falhe silenciosamente, acione a telemetria do Sentry e execute o gerador de canvas (`src/utils/textureGenerator.ts` para texturas) ou síntese de som (`src/utils/soundEngine.ts` para áudio) sob a mesma chave de identificação.
- **UI do React Fatiada (9-Slice):** Painéis e botões de interface de usuário gótica no React devem usar fatiamento de imagem via CSS `border-image` com propriedades Tailwind para máxima responsividade mobile e compatibilidade comercial (Steam, Play Store e PWA).
- **Orçamento de VRAM e Compactação:** Novos assets devem respeitar resoluções retrô pixeladas restritas (máximo de 64x64 para sprites de personagens/inimigos comuns e 64x32 para tiles) e ser compactados agressivamente via `pngquant` ou convertidos para `.webp` para manter o pacote inicial abaixo de 2.5 MB.
- **Fontes locais:** As fontes continuam hospedadas offline em `public/fonts/` e configuradas em `index.css`.
- **Manifesto com Flag `required` (Cobertura de Assets):** `src/game/assets/assetManifest.json` é a fonte única de verdade sobre quais assets físicos existem. Cada entrada tem `required: true|false`. `required: true` significa que o arquivo DEVE existir em `public/<path>` com dimensões compatíveis com `frameWidth`/`frameHeight` — `pnpm verify` (via `scripts/verify-assets.cjs`) **falha o build** se isso não for verdade. `required: false` marca um asset "planejado": ainda não foi produzido, o fallback procedural cobre ele por enquanto, e o build não falha — apenas reporta como pendente. **Ao adicionar um asset físico novo (gerar → stitch → colocar em `public/assets/...`), rode `pnpm verify` e só então mude `required` para `true`** no manifesto; nunca marque como obrigatório antes de o arquivo estar de fato commitado, ou o build quebra para todo mundo.

### 2. Physical and Combat Mechanics Guardrails
- **Passive contact damage ('touch damage') from enemies is forbidden.**
- Every physical or melee attack from any enemy must transition through a fully-telegraphed Finite State Machine (FSM): `Windup` -> `Strike` -> `Recovery`.
- When calculating Line of Sight (LoS) or hearing ranges for active entities, prune computations using quick spatial/distance boundaries (AABB / squared distance) before executing Phaser's geometric raycast.
- Ensure combat-related projectile collisions retain accurate wall/boundary checks to prevent bugs like wall-hacking.

### 3. State Management and Persistence
- **No Direct LocalStorage Mutations.**
- All data read or written to `localStorage` must pass strictly through `src/utils/localStorage.ts`, using robust validation via **Zod schemas** with safe-parse fallbacks to prevent state corruption, prototype pollution, or crash on outdated save files.
- Phaser-to-React communications must be decoupled using a unified event broker or global state (`src/store/gameStore.ts`). Click/pointer events in React overlays must call `e.stopPropagation()` and `e.nativeEvent.stopImmediatePropagation()` to prevent underlying canvas click triggers.

### 4. Code Standards & Typing
- **TypeScript strict mode must pass with 0 errors.** (`pnpm run typecheck` / `pnpm run verify`).
- Do not use `any`. Define strict union types or configurations.
- Use Named Arguments/Objects for functions with more than 3 parameters to avoid parameter-swapping bugs.

### 5. Mandatory Troubleshooting Documentation (Root-Cause Logging)
- **Always document non-trivial/complex bugs**: Any bug, regression, asset corruption, state mismatch, or lifecycle/rendering issue that required multi-step investigation or significant debugging time **MUST** be immediately logged in `/docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`.
- **Standard Entry Structure**: Each entry must include:
  1. **Sintoma** (o que quebrou ou como se manifesta visualmente/em runtime).
  2. **Causa-Raiz** (explicação técnica exata do motivo da falha).
  3. **Como Diagnosticar** (comandos, logs ou testes para identificar rapidamente).
  4. **Procedimento de Resolução** (passo a passo claro para correção sem regressão).
  5. Atualização da **Tabela de Diagnóstico Rápido** no final do documento.

---

## 🧪 Testing and Safety Gates

- Every modification MUST be followed by running the unit tests to prevent regression:
  ```bash
  pnpm test
  ```
- To test frontend/UI visual regressions, run Playwright E2E tests:
  ```bash
  pnpm test:e2e
  ```
- Before creating a commit, ensure that code complies with all hooks. The hook runs `pnpm run verify` which compiles TS and runs tests.

---

## 🐙 GitHub Repository & Git Integration

When requested by the user to commit and push changes to the remote GitHub repository (`https://github.com/felipeteixeirams/blood-mage-1995.git`), use the personal access token stored in the environment variable `GITHUB_TOKEN_PERSONAL`.

### Git Remote Authentication & Push Workflow:
1. Configure git user identity if not already set:
   ```bash
   git config --global user.name "Felipe Teixeira"
   git config --global user.email "felipeteixeirams@gmail.com"
   ```
2. Set the remote URL with the PAT token authentication:
   ```bash
   git remote set-url origin https://x-access-token:${GITHUB_TOKEN_PERSONAL}@github.com/felipeteixeirams/blood-mage-1995.git
   ```
3. Stage, commit, and push changes:
   ```bash
   git add .
   git commit -m "Your descriptive commit message here"
   git push origin main
   ```

### 6. Binary Files Anti-Corruption Guardrail (CRITICAL)
- **NEVER** use text-based editing tools (`edit_file`, `create_file`, `cat`, `sed`, `awk`, `echo`) on binary files (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.woff2`, `.mp3`, `.ogg`).
- Doing so converts non-UTF-8 bytes to the replacement character `\uFFFD` (`EF BF BD`), corrupting the asset's binary header permanently.
- If you need to generate, move, or download a binary asset, you MUST use pure binary stream handlers (e.g., `Buffer` in Node.js, `wget`, or `curl --output`) and verify its integrity using `file <path>` before proceeding.
- **Valide toda fonte de recuperação ANTES de copiar dela.** Um backup pode já estar contaminado — foi exatamente o que aconteceu com `sprites_importados/gothic_chest/` no incidente de 2026-08-21, onde restaurar de lá apenas propagou a corrupção. Cheque o header (`89 50 4E 47` para PNG, `FF D8 FF` para JPG) e a ausência de `EF BF BD` no corpo do arquivo.
- **Após restaurar um binário, commite imediatamente**, antes de qualquer outra operação de Git. Enquanto o blob corrompido estiver no histórico, um `stash pop`/`checkout`/`restore` reintroduz a corrupção no working tree.

### 6b. Spritesheet do Jogador — Pipeline Correto
- A origem de `public/assets/sprites/player/bloodmage.png` é a arte do PixelLab, montada por `scripts/build_bloodmage_spritesheet.cjs` (grade 8x9 de células 68x68, linha 0 = idle, linhas 1-8 = walk).
- `scripts/generate_bloodmage_spritesheet.cjs` é **procedural** e existe apenas como último recurso de emergência. Se ele voltar a ser a origem do arquivo, o personagem vira placeholder **silenciosamente** — o `pnpm verify` não detecta, porque o PNG gerado é perfeitamente válido.
- O export do PixelLab não é homogêneo: rotações idle vêm em **48x48** e frames de Walking em **68x68**. O montador alinha pela caixa delimitadora do conteúdo, não pela borda do arquivo; alinhar pela borda faz o personagem "pular" ao alternar entre parado e andando. Detalhes no item 15 do troubleshooting.

### 7. Strict UI Layering (React DOM vs Phaser Canvas) - CRITICAL
- **NEVER render user interface elements (Buttons, Menus, Text, Modals, HUDs) inside Phaser Scenes.**
- The Phaser engine (`<canvas>`) is STRICTLY reserved for the game world, entities, environment, combat, and background effects.
- **ALL UI MUST be built as React overlays (`.tsx` files)** using Tailwind CSS and HTML DOM elements floating over the canvas.
- If you are asked to build a Menu, Inventory, Pause Screen, or HUD, you MUST create or modify a React component (e.g., `src/components/...`) and use Zustand (`src/store/gameStore.ts`) to communicate with Phaser.
- **Forbidden Phaser methods for UI**: Do not use `this.add.text()`, `this.add.dom()`, or interactive `this.add.rectangle()` to simulate UI buttons in any Scene.
