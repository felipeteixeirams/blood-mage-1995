# 🤖 Agent Instructions & Project Guidelines (AIDD-Optimized)

## 📌 Context Budgeting & Efficiency Guidelines (MUST OBEY)

To prevent context window bloat, reduce token cost, and prevent hallucinations/regression:
1. **Never read multiple full source files unless absolutely necessary.** Use targeted tools like specific file reading, `grep`, or documentation indexing.
2. **Prioritize documentation over code investigation.** Consult `/docs/README.md` first to find out which targeted document has your answers.
3. **If you must modify a file above 400 lines (e.g. `GameScene.ts` or `GameplayHUD.tsx`), perform surgery with surgical accuracy.** Use precise search-and-replace or git merge diff blocks. Never rewrite or replace the entire file.

---

## 🛡️ Absolute Game Rules & Architectural Guardrails

Every agent modifying this codebase MUST respect the following strict, non-negotiable boundaries:

### 1. Zero External Assets Architecture
- **Absolutely NO external assets (images, audios, fonts) are allowed.**
- All game textures must be generated dynamically on-the-fly inside HTML5 Canvas elements (see `src/utils/textureGenerator.ts`).
- All background music (BGM) and sound effects (SFX) must be synthesized dynamically using the Web Audio API (see `src/utils/soundEngine.ts`).
- Fonts are hosted offline in `public/fonts/` and configured in `index.css`.

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
