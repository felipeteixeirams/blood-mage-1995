# 🤖 Agent Instructions & Project Guidelines (AIDD-Optimized)

## 📌 Context Budgeting & Efficiency Guidelines (MUST OBEY)

To prevent context window bloat, reduce token cost, and prevent hallucinations/regression:
1. **Never read multiple full source files unless absolutely necessary.** Use targeted tools like specific file reading, `grep`, or documentation indexing.
2. **Prioritize documentation over code investigation.** Consult `/docs/README.md` first to find out which targeted document has your answers.
3. **Always consult `docs/specs/README.md` right after reading this document** to understand the active development pipeline, current Kanban board state, maturation metrics, and ongoing specs. It is the absolute master index for the project's specification status.
4. **If you must modify a file above 400 lines (e.g. `GameScene.ts` or `GameplayHUD.tsx`), perform surgery with surgical accuracy.** Use precise search-and-replace or git merge diff blocks. Never rewrite or replace the entire file.

---

## 🛡️ Absolute Game Rules & Architectural Guardrails

Every agent modifying this codebase MUST respect the following strict, non-negotiable boundaries:

### 1. Unified Game Domain & Explicit Confirmation (CRITICAL)
- **Layer Protection:** Any modifications, refactoring, or adjustments touching core gameplay/business rules in the domain (Combat FSM/telegraphed attacks, touch-damage prohibitions, status conditions, player unconsciousness, and Safe Town mechanics) **MUST receive explicit, formal confirmation from the user before applying changes**.
- **Spec-Driven Development (SDD):** All code modifications must strictly correspond to an authorized functional specification written inside `docs/` (such as `docs/domain/domain_rules.md`). Do not invent or remove domain features arbitrarily.

### 2. Hybrid Asset Architecture (Assets Externos + Fallback Procedural)
- **Permissão de Assets Externos:** Assets físicos (imagens PNG/WebP e áudios MP3/OGG) são permitidos desde que integrados estritamente sob o pipeline híbrido com fallback procedural unificado para evitar regressões visuais ou quebras de áudio.
- **Mecanismo de Chave Única e Fallback Procedural Mandatório:** Nunca associe ou mude as chaves de forma destrutiva. O código deve sempre tentar carregar o arquivo físico em primeiro lugar. Caso o carregamento falhe, falhe silenciosamente, acione a telemetria do Sentry e execute o gerador de canvas (`src/utils/textureGenerator.ts` para texturas) ou síntese de som (`src/utils/soundEngine.ts` para áudio) sob a mesma chave de identificação.
- **UI do React Fatiada (9-Slice) & Mobile First:** Painéis e botões de interface de usuário gótica no React devem usar fatiamento de imagem via CSS `border-image` com propriedades Tailwind para máxima responsividade mobile e compatibilidade comercial. Standardized borders (`border-2 border-[#b8860b]/40`) and Charcoal colors (`bg-[#171309]/95`) are the visual standard. Mobile usability represents the highest layout hierarchy.
- **Orçamento de VRAM e Compactação:** Novos assets devem respeitar resoluções retrô pixeladas restritas (máximo de 64x64 para sprites de personagens/inimigos comuns e 64x32 para tiles) e ser compactados agressivamente via `pngquant` ou convertidos para `.webp` para manter o pacote inicial abaixo de 2.5 MB.
- **Fontes locais:** As fontes continuam hospedadas offline em `public/fonts/` (Cinzel, VT323, Press Start 2P) and must be exclusively used without modern sans-serif or system fallbacks.

### 3. Physical and Combat Mechanics Guardrails
- **Passive contact damage ('touch damage') from enemies is forbidden.**
- Every physical or melee attack from any enemy must transition through a fully-telegraphed Finite State Machine (FSM): `Windup` -> `Strike` -> `Recovery`.
- When calculating Line of Sight (LoS) or hearing ranges for active entities, prune computations using quick spatial/distance boundaries (AABB / squared distance) before executing Phaser's geometric raycast.
- Ensure combat-related projectile collisions retain accurate wall/boundary checks to prevent bugs like wall-hacking.

### 4. State Management and Persistence
- **No Direct LocalStorage Mutations.**
- All data read or written to `localStorage` must pass strictly through `src/utils/localStorage.ts`, using robust validation via **Zod schemas** with safe-parse fallbacks to prevent state corruption, prototype pollution, or crash on outdated save files.
- Phaser-to-React communications must be decoupled using a unified event broker or global state (`src/store/gameStore.ts`). Click/pointer events in React overlays must call `e.stopPropagation()` and `e.nativeEvent.stopImmediatePropagation()` to prevent underlying canvas click triggers.

### 5. Code Standards & Typing
- **TypeScript strict mode must pass with 0 errors.** (`pnpm run typecheck` / `pnpm run verify`).
- Do not use `any`. Define strict union types or configurations.
- Use Named Arguments/Objects for functions with more than 3 parameters to avoid parameter-swapping bugs.

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
