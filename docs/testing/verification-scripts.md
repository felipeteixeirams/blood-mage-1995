# Scripts de Verificação e Pre-commit

**Mestre:** [testing](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

O que cada script do `package.json` faz hoje e o que o hook de pre-commit executa. Conferido por leitura de `package.json`, `.husky/pre-commit`, `scripts/verify-assets.cjs`, `vitest.config.ts` e `playwright.config.ts`. Executado de fato apenas `node scripts/verify-assets.cjs` (terminou sem falhas obrigatórias); `typecheck`, `build`, `test` e `e2e` não foram executados porque o worktree não tinha `node_modules`.

## Scripts

| Script | Comando real | Observação |
|---|---|---|
| `pnpm test` | `vitest run` | Testes unitários; ver [unit-tests](unit-tests.md) |
| `pnpm test:coverage` | `vitest run --coverage` | Provider v8; limites de 80% (linhas, statements, funções) em 7 arquivos |
| `pnpm e2e` | `playwright test` | Ver [e2e-tests](e2e-tests.md) |
| `pnpm e2e:update` | `playwright test --update-snapshots` | Regrava os screenshots de referência |
| `pnpm typecheck` | `tsc -p tsconfig.json --noEmit` | `tsconfig.json` inclui `src`, `lib`, `tests` e `vite.config.ts` |
| `pnpm typecheck:game` | `tsc -p artifacts/bloodmage/tsconfig.json --noEmit` | Typecheck do pacote em `artifacts/bloodmage` |
| `pnpm lint` | `tsc --noEmit` | Não há ESLint configurado: `lint` é só typecheck |
| `pnpm build` | `vite build --config vite.config.ts` | Não roda typecheck |
| `pnpm verify` | `node scripts/verify-assets.cjs && npm run typecheck && npm run build` | Não roda testes unitários nem e2e |
| `pnpm verify:all` | `npm run typecheck && npm run typecheck:game && npm run test` | Typecheck dos dois projetos e testes unitários; não faz build |

Não existe script `test:ui`.

## `scripts/verify-assets.cjs`

- Parte 1: confere a assinatura binária (magic bytes) de arquivos em `src/assets`, `public/assets` e `public/fonts` (`.png`, `.jpg`/`.jpeg`, `.gif`, `.woff2`, `.ogg`, `.webp`, `.mp3`); diretórios ausentes são ignorados.
- Parte 2: confere `src/game/assets/assetManifest.json` contra `public/`. Na execução de 2026-10-10: assets binários íntegros, 19 entradas obrigatórias OK, 18 "planejadas" ausentes (usam fallback procedural; não falham o script) e saída final "Verificação de assets concluída sem falhas obrigatórias". O script chama `process.exit` com erro quando `hasError` é verdadeiro (falha de assinatura ou item obrigatório ausente).

## Pre-commit (Husky)

- `.husky/pre-commit` contém duas linhas: `pnpm run docs:check` e `pnpm run verify`.
- `package.json` tem `"prepare": "husky"`, que instala o hook ao rodar `pnpm install`.
- Portanto, a cada commit roda: verificação de assets, `tsc` (typecheck) e `vite build`. **Testes unitários não rodam no commit.**
- `package.json` define `lint-staged` (`*.{ts,tsx}` -> `vitest related`), mas o hook não chama `lint-staged`; essa configuração não é executada por nenhum hook.
- Não existe pasta `.github` nem outro CI no repositório; deploy e verificação em servidor não foram localizados.

## Critério de bundle

`vite.config.ts` define `manualChunks` (`phaser` e `vendor`) e não define `chunkSizeWarningLimit`: o aviso de chunk grande do Vite usa o limite padrão e não falha o build.

## Não verificado

- Que `pnpm typecheck`, `pnpm build` e `pnpm test` passam hoje (não executados).
- Se o hook de pre-commit está instalado no clone do responsável (depende de `pnpm install` ter rodado `prepare`).
