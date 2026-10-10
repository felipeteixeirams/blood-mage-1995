# Stack e Convenções

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Verificado por leitura de `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig*.json`, `vercel.json`, `.husky/` e dos diretórios. **Nenhum script foi executado** (o checkout não tem `node_modules`); a tabela de scripts diz isso por linha.

## Stack (versões do `package.json` e resolvidas no `pnpm-lock.yaml`)

| Tecnologia | Declarada | Resolvida no lock | Uso confirmado no código |
|---|---|---|---|
| Phaser | `^4.2.1` | 4.2.1 | `src/game/` |
| React / React DOM | `19.1.0` | 19.1.0 | `src/components/`, `src/App.tsx` |
| TypeScript | `^5.8.2` | 5.9.3 | `tsconfig.base.json` |
| Vite | `^7.3.2` | 7.3.6 | `vite.config.ts` (plugins: react, tailwindcss, VitePWA) |
| Tailwind CSS | `^4.1.14` | 4.3.3 | via `@tailwindcss/vite` |
| Zustand | `^5.0.14` | 5.0.14 | `src/store/gameStore.ts` |
| Zod | `^3.25.76` | 3.25.76 | `src/utils/localStorage.ts`, `src/utils/SaveMigration.ts` |
| Vitest | `^4.1.10` | 4.1.10 | `vitest.config.ts` (jsdom, globals) |
| Playwright | `^1.62.1` | 1.62.1 | `playwright.config.ts`, `tests/e2e/` |
| Sentry (`@sentry/react`) | `^10.69.0` | 10.69.0 | `src/main.tsx`, só ativo com `VITE_SENTRY_DSN` |
| Motion (`motion/react`) | `^12.43.0` | 12.43.0 | 13 arquivos em `src/` |
| `framer-motion` | `^12.23.24` | 12.42.2 | 1 arquivo (`components/hud/AchievementToast.tsx`) |
| Radix UI (ex.: `react-dialog`), `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` | vários | `react-dialog` 1.1.23, `lucide-react` 0.545.0, `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` 3.6.0 | `src/components/ui/` (58 arquivos, padrão shadcn; `components.json` na raiz) |
| `vite-plugin-pwa` / `workbox-window` | `^1.3.0` / `^7.4.1` | 1.3.0 / 7.4.1 | PWA (`registerType: 'prompt'`, `generateSW`) |
| pnpm | não fixado | — | gerenciador do workspace; `pnpm-lock.yaml` presente |

Dependências declaradas no `package.json` raiz **sem nenhum import em `src/`** (busca em 2026-10-10): `wouter`, `@tanstack/react-query`, `react-icons`, `date-fns`, `omggif`, `pngjs`. Outras (`recharts`, `react-hook-form`, `sonner`, `next-themes`, `cmdk`, `vaul`, `embla-carousel-react`) aparecem em exatamente 1 arquivo cada.

Áudio: `src/utils/soundEngine.ts` e `bgmSynthesizer.ts` (síntese via Web Audio) e amostras `.wav` em `public/audio_samples/` (5 arquivos). O `Phaser.Game` principal usa `audio.noAudio: true`.

## Estrutura de diretórios

```
src/
  App.tsx, main.tsx, index.css
  components/        modais e telas React; hud/ (HUD em jogo); ui/ (shadcn/Radix)
  data/              JSON de domínio (achievements, campaignItems, campaignQuests, codex,
                     contracts, dialogues, monsters, palettes, relics, runModifiers, spells,
                     talents, upgrades, waves)
  game/
    PhaserGame.tsx   monta o Phaser.Game principal
    scenes/          BootScene, GameScene, TitleScene, SettingsScene, RecordsScene
    objects/         Player, Enemy, Projectile, Collectible, Loot, Scavengeable, Traps
    systems/         41 módulos de produção + testes
    shaders/         AtmosphericTreeShader
    animations/      animationManager
    assets/          assetManifest (.ts/.json) e teste de integridade
  hooks/             useFloatingJoystick, useGamepadUINavigation, useJoystick, usePWA,
                     use-mobile, use-toast
  i18n/              ptBR.ts, enUS.ts, index.ts
  lib/utils.ts       helper de classes (alias @/lib/utils)
  pages/             not-found.tsx
  store/             gameStore.ts
  types/             game.ts, campaign.ts
  utils/             soundEngine, bgmSynthesizer, localStorage, SaveMigration, logger,
                     telemetry, textureGenerator, uiTextures, equipmentPalette, haptics,
                     joystickResponse, orientation
tests/               setup.ts (setup global do Vitest) e e2e/ (Playwright)
api/log.ts           handler HTTP (IncomingMessage/ServerResponse) na raiz
artifacts/           api-server, bloodmage, mockup-sandbox (workspaces)
lib/                 api-client-react, api-spec, api-zod, db (workspaces)
scripts/             utilitários .cjs/.py/.sh (assets, PWA, auditoria de docs) + pacote @workspace/scripts
public/              assets, fonts, audio_samples, ícones e manifest PWA
```

- `src/` não importa nada de `lib/` nem de `@workspace/*` (busca em 2026-10-10); `@/lib/utils` é `src/lib/utils.ts`.
- `artifacts/bloodmage/` tem `package.json`, `vite.config.ts`, `index.html` e `public/`, sem `src/` próprio; seu `tsconfig.json` inclui `../../src/**/*`. O `package.json` dele usa o mesmo nome (`@workspace/bloodmage`) do `package.json` da raiz.

## Configuração relevante

| Arquivo | Fato |
|---|---|
| `tsconfig.base.json` | `target` es2022, `module` esnext, `moduleResolution: bundler`, `isolatedModules`; **sem `"strict": true`**: liga `noImplicitAny`, `strictNullChecks`, `strictPropertyInitialization`, `strictBindCallApply`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`; `strictFunctionTypes: false`, `noUnusedLocals: false`. Aliases `@/*` para `src/*` e `@assets/*` para `attached_assets/*` |
| `tsconfig.json` | `include`: `src`, `lib`, `tests`, `vite.config.ts` |
| `vite.config.ts` | dev em `0.0.0.0`, porta `PORT` ou 3000 com `strictPort`; HMR desligável com `DISABLE_HMR=true`; chunks manuais `phaser` e `vendor` |
| `vitest.config.ts` | `environment: 'jsdom'`, `globals: true`, `include: src/**/*.test.{ts,tsx}`, `setupFiles: ./tests/setup.ts` (mock global mínimo de `phaser`); cobertura v8 com limite de 80% (linhas, statements, funções) só para 7 arquivos listados |
| `playwright.config.ts` | `testDir: ./tests/e2e`, 1 worker, projeto `chromium`, `baseURL` `http://localhost:3000`, sobe `npm run dev` se a porta estiver livre |
| `vercel.json` | `buildCommand: pnpm run build`, `outputDirectory: dist`, `installCommand: pnpm install`; cabeçalhos de segurança (CSP, `X-Frame-Options: DENY` etc.) |
| `.husky/pre-commit` | executa `pnpm run docs:check` e depois `pnpm run verify` |
| `.npmrc` | `auto-install-peers=false`, `strict-peer-dependencies=false` |
| `pnpm-workspace.yaml` | `minimumReleaseAge: 1440` (pacotes precisam ter 1 dia de publicados); workspaces `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts` |
| `.env.example` | `GEMINI_API_KEY`, `SPRITECOOK_API_KEY`, `PIXELLAB_API_KEY`, `APP_URL`; `VITE_SENTRY_DSN` é lida em `main.tsx` e não está no exemplo |

## Scripts (`package.json` raiz)

| Script | Comando | Executado? |
|---|---|---|
| `dev` | `vite --config vite.config.ts --host 0.0.0.0` | Não |
| `build` | `vite build --config vite.config.ts` | Não |
| `serve` | `vite preview --config vite.config.ts --host 0.0.0.0` | Não |
| `lint` | `tsc --noEmit` (não é ESLint; não há config de ESLint na raiz) | Não |
| `typecheck` | `tsc -p tsconfig.json --noEmit` | Não |
| `typecheck:game` | `tsc -p artifacts/bloodmage/tsconfig.json --noEmit` (o tsconfig existe e inclui `../../src`) | Não |
| `test` | `vitest run` (54 arquivos `*.test.*` em `src/`) | Não |
| `test:coverage` | `vitest run --coverage` | Não |
| `e2e` / `e2e:update` | `playwright test` / `playwright test --update-snapshots` | Não |
| `audio:render` | `node scripts/render_bgm_samples.cjs` (arquivo existe) | Não |
| `verify` | `node scripts/verify-assets.cjs && npm run typecheck && npm run build` | Não |
| `verify:all` | `npm run typecheck && npm run typecheck:game && npm run test` | Não |
| `prepare` | `husky` | Não |

- Os scripts `verify*` chamam `npm run`, embora o gerenciador do projeto seja pnpm.
- `verify-assets.cjs` confere cabeçalhos (magic bytes) de arquivos de imagem, áudio e fonte em `src/assets`, `public/assets` e `public/fonts`.
- O `package.json` tem bloco `lint-staged` (`*.{ts,tsx}`: `vitest related`), mas `.husky/pre-commit` não o invoca.
- `scripts/post-merge.sh` roda `pnpm install --frozen-lockfile` e `pnpm --filter db push`; `scripts/build-pwa.sh`, `build-steam.sh` (Electron) e `build-twa.sh` existem e não foram executados.

## Convenções de código em uso

| Tema | Observado |
|---|---|
| Nomes de arquivo | PascalCase para classes, componentes e modais (`GameScene.ts`, `InventoryModal.tsx`); camelCase para utilitários e hooks (`soundEngine.ts`, `useJoystick.ts`); `components/ui/` é majoritariamente kebab-case (shadcn), com exceções PascalCase (`ModalBase.tsx`, `OfflineStatusBadge.tsx`, `PWAInstallBanner.tsx`) |
| Testes | Ao lado do código, `*.test.ts(x)`, `describe`/`it`; Vitest com mock global de `phaser` (`tests/setup.ts`); suítes podem sobrescrevê-lo com `vi.mock('phaser', ...)` |
| Imports | Caminhos relativos em `game/`, `store/` e na maior parte do restante (96 arquivos usam `../`); o alias `@/` aparece em 54 arquivos, 52 deles em `components/ui/` e nenhum em `game/` ou `store/` |
| UI | React + Tailwind; estado compartilhado com o jogo só pelo Zustand ([../architecture/state-management.md](../architecture/state-management.md)) |
| Sistemas de jogo | Classes em `src/game/systems/` que recebem a cena ([../architecture/phaser-patterns.md](../architecture/phaser-patterns.md)) |
| Comentários e textos | Comentários em português, com trechos em inglês; textos de UI em `i18n/ptBR.ts` e `enUS.ts` |
| Logs | `logger` de `src/utils/logger.ts` |
| Dados de domínio | JSON em `src/data/`, importado direto (`resolveJsonModule`) |
| Persistência | `localStorage` via funções `load*`/`save*` e schemas Zod (`src/utils/localStorage.ts`) |

## Limites da verificação

- Nenhum comando foi executado: não se sabe se `typecheck`, `build`, `test` ou `verify` passam hoje.
- Só foi lida no lock a versão de `@radix-ui/react-dialog` entre os pacotes Radix.
- Convenções de nomes e imports vêm de listagens de diretórios e de `grep`, não de análise exaustiva. A estrutura de diretórios e as configurações listadas foram lidas diretamente.
