# Desenvolvimento Local

**Mestre:** [operations](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `.husky/`, `.husky/pre-commit`, `artifacts/api-server`, `artifacts/bloodmage`

Verificação por leitura estática de `package.json`, `vite.config.ts`, `playwright.config.ts`, `.husky/`. Nenhum comando foi executado.

## Comandos (`package.json` da raiz)

| Comando | O que faz |
|---|---|
| `pnpm install` | instala dependências (gerenciador: pnpm; `pnpm-workspace.yaml` com `minimumReleaseAge: 1440`) |
| `pnpm dev` | `vite --config vite.config.ts --host 0.0.0.0` |
| `pnpm build` | `vite build --config vite.config.ts` (saída em `dist/`) |
| `pnpm serve` | `vite preview` |
| `pnpm typecheck` | `tsc -p tsconfig.json --noEmit` |
| `pnpm lint` | `tsc --noEmit` (não há ESLint no script) |
| `pnpm test` | `vitest run` |
| `pnpm test:coverage` | `vitest run --coverage` |
| `pnpm e2e` / `pnpm e2e:update` | Playwright em `tests/e2e/` (chromium; sobe `npm run dev` em `http://localhost:3000`) |
| `pnpm verify` | `node scripts/verify-assets.cjs` + typecheck + build |
| `pnpm verify:all` | typecheck + `typecheck:game` + testes |
| `pnpm audio:render` | `node scripts/render_bgm_samples.cjs` |

- `typecheck:game` aponta para `artifacts/bloodmage/tsconfig.json`.
- `scripts/verify-assets.cjs` confere assinatura de arquivos binários (png, jpg, gif, woff2, ogg, webp) em `src/assets`, `public/assets`, `public/fonts`.

## Servidor de desenvolvimento

`vite.config.ts`: host `0.0.0.0`, porta `process.env.PORT` ou 3000, `strictPort: true`. `DISABLE_HMR=true` desliga HMR e o file watching. Alias `@` = `src`, `@assets` = `attached_assets`.

## Hook de commit

`.husky/pre-commit` roda `pnpm run docs:check` e depois `pnpm run verify`.

## Estrutura duplicada

Além do app na raiz (`src/`, `vite.config.ts`), existe `artifacts/bloodmage/` com `package.json` (`@workspace/bloodmage`), `vite.config.ts` próprio (usa `BASE_PATH` e plugins Replit) e `public/`. `pnpm-workspace.yaml` inclui `artifacts/*`, `lib/*`, `lib/integrations/*`. `artifacts/api-server` (Express) e `artifacts/mockup-sandbox` também existem. `vercel.json` na raiz compila o app da raiz.

## Não verificado

- Se `pnpm dev`/`build`/testes passam hoje (nada foi executado).
- Qual dos dois apps (raiz ou `artifacts/bloodmage`) o time considera canônico.
