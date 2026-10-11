# Build e Deploy

**Mestre:** [operations](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `.husky/pre-commit`, `api/log.ts`, `scripts/post-merge.sh`, `dist/manifest.webmanifest`

Nota de verificação: leitura estática; nenhum build ou deploy executado; o que não deu para conferir está em "Não verificado".

Conferido por leitura de `package.json`, `vercel.json`, `api/log.ts`, `vite.config.ts`, `scripts/*.sh`, `.replit`, `.husky/pre-commit`. Nenhum build, deploy ou script foi executado.

## Vercel (configuração no repositório)

`vercel.json`: `buildCommand: pnpm run build`, `outputDirectory: dist`, `installCommand: pnpm install`. Cabeçalhos para todas as rotas:

| Cabeçalho | Valor (resumo) |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; scripts `'self' 'unsafe-inline' 'unsafe-eval'`; estilos `'self' 'unsafe-inline'` + `fonts.googleapis.com`; fontes `fonts.gstatic.com`; imagens `data:`/`blob:`; mídia `'self'`/`data:`/`blob:`; `connect-src` `'self'`, `*.sentry.io`, `*.ingest.us.sentry.io`; `object-src 'none'`; `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |

Não há `rewrites` em `vercel.json`. Qualquer recurso externo novo (CDN, API) precisa entrar na CSP.

## Comandos de build

`package.json` (raiz, pacote `@workspace/bloodmage`, workspace pnpm): `build` = `vite build --config vite.config.ts` (sem `tsc`); `typecheck` = `tsc -p tsconfig.json --noEmit`; `verify` = `node scripts/verify-assets.cjs && npm run typecheck && npm run build`. O pre-commit (`.husky/pre-commit`) roda `pnpm run docs:check` e `pnpm run verify`.

## `/api/log`

`api/log.ts` (função serverless no padrão Vercel): aceita `POST` e `OPTIONS` (outros métodos: 405), com CORS `*`; recebe uma entrada, um array ou `{logs: []}`; escreve cada entrada em `console.error/warn/info/log` conforme o nível, com prefixo `[VERCEL_RUNTIME]`; responde `{success, processed}` (500 em erro). Não valida o corpo nem limita tamanho. Não persiste nada. O cliente (`src/utils/logger.ts`, endpoint padrão `/api/log`) envia em lote, e usa `sendBeacon` em `visibilitychange`/`beforeunload` (conferido em `logger.ts`). Detalhes: [telemetry-and-logging.md](telemetry-and-logging.md).

## PWA

- Gerado em build por `vite-plugin-pwa` (`registerType: 'prompt'`, `generateSW`, cache de até 5 MB por arquivo, `skipWaiting` e `clientsClaim`). Detalhes: [pwa.md](pwa.md).
- `scripts/build-pwa.sh`: `npx tsc -p tsconfig.json --noEmit`, `npm run build`, avisa se `dist/sw.js` não existir, falha se `dist/manifest.webmanifest` não existir. Usa `npm`/`npx`, não `pnpm`; a Vercel não o chama (usa `vercel.json`).
- Chunks separados: `phaser` e `vendor` (`manualChunks`).

## Scripts de TWA e Steam

| Script | O que faz | Estado no repositório |
|---|---|---|
| `scripts/build-twa.sh` | exige `bubblewrap` no PATH, roda `npm run build`, cria `twa-manifest.json` padrão se faltar (com fingerprint placeholder), roda `bubblewrap build` | `twa-manifest.json` não existe |
| `scripts/build-steam.sh` (argumento win, linux, mac ou all) | instala `electron`/`electron-builder` se faltar, `npm run build`, cria `electron-builder.yml` padrão se faltar, roda `electron-builder` | `electron-builder.yml`, `main.js` e dependência `electron` não existem; o `yml` padrão lista `main.js` |

Ambos os scripts têm URL, `packageId` e IDs embutidos no texto; não foram executados.

## Replit

- `.replit`: módulo `nodejs-24`, deploy `autoscale`, `postBuild` roda `pnpm store prune`, `postMerge` roda `scripts/post-merge.sh` (timeout 20000 ms). `[userenv.shared]` define `VITE_SENTRY_DSN` (valor não reproduzido aqui).
- `scripts/post-merge.sh`: `pnpm install --frozen-lockfile` e `pnpm --filter db push` (o pacote é `@workspace/db`; `pnpm ls --filter db` resolve para ele, e o script `push` dele é `drizzle-kit push`). Exige `DATABASE_URL`.

## Não verificado

- Que o projeto Vercel está ligado a este repositório com deploy automático por push, e a URL de produção (sem evidência no repositório; não há `.github/`).
- Execução de qualquer build ou script; Lighthouse; tamanho do bundle.
- Se `pnpm --filter db push` executa com sucesso (só o casamento do filtro foi conferido).
- Qualquer processo de assinatura, publicação em Play Store ou Steam.
