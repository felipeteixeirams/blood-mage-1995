# Stack e Configuração

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Verificado por leitura de `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig*.json` e `vercel.json`. **Nenhum script foi executado** (o checkout não tem `node_modules`); a tabela de scripts diz isso por linha.

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

## Configuração relevante

| Arquivo | Fato |
|---|---|
| `tsconfig.base.json` | `target` es2022, `module` esnext, `moduleResolution: bundler`, `isolatedModules`; **sem `"strict": true`**: liga `noImplicitAny`, `strictNullChecks`, `strictPropertyInitialization`, `strictBindCallApply`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`; `strictFunctionTypes: false`, `noUnusedLocals: false`. Aliases `@/*` para `src/*` e `@assets/*` para `attached_assets/*` |
| `tsconfig.json` | `include`: `src`, `lib`, `tests`, `vite.config.ts` |
| `vite.config.ts` | dev em `0.0.0.0`, porta `PORT` ou 3000 com `strictPort`; HMR desligável com `DISABLE_HMR=true`; chunks manuais `phaser` e `vendor` |
| `vitest.config.ts` | `environment: 'jsdom'`, `globals: true`, `include: src/**/*.test.{ts,tsx}`, `setupFiles: ./tests/setup.ts` (mock global mínimo de `phaser`); cobertura v8 com limite de 80% (linhas, statements, funções) só para 7 arquivos listados |
| `playwright.config.ts` | `testDir: ./tests/e2e`, 1 worker, projeto `chromium`, `baseURL` `http://localhost:3000`, sobe `npm run dev` se a porta estiver livre |
| `vercel.json` | `buildCommand: pnpm run build`, `outputDirectory: dist`, `installCommand: pnpm install`; cabeçalhos de segurança (CSP, `X-Frame-Options: DENY` etc.) |
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
- `scripts/post-merge.sh` roda `pnpm install --frozen-lockfile` e `pnpm --filter db push`; `scripts/build-pwa.sh`, `build-steam.sh` (Electron) e `build-twa.sh` existem e não foram executados.

## Limites da verificação

- Nenhum comando foi executado: não se sabe se `typecheck`, `build`, `test` ou `verify` passam hoje.
- Só foi lida no lock a versão de `@radix-ui/react-dialog` entre os pacotes Radix.
- As configurações listadas foram lidas diretamente.
