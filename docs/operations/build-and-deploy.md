# Build e Deploy

**Mestre:** [operations](README.md)
**Status:** não verificado
**Verificado em:** —

Leitura estática de `vercel.json`, `api/log.ts`, `vite.config.ts`, `scripts/*.sh`, `.replit`. Nenhum build, deploy ou script foi executado.

## Vercel (configuração no repositório)

`vercel.json`: `buildCommand: pnpm run build`, `outputDirectory: dist`, `installCommand: pnpm install`. Cabeçalhos para todas as rotas:

| Cabeçalho | Valor (resumo) |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; scripts `'self' 'unsafe-inline' 'unsafe-eval'`; estilos `'self' 'unsafe-inline'` + `fonts.googleapis.com`; fontes `fonts.gstatic.com`; imagens `data:`/`blob:`; `connect-src` `'self'`, `*.sentry.io`, `*.ingest.us.sentry.io`; `object-src 'none'`; `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |

Não há `rewrites` em `vercel.json`. Qualquer recurso externo novo (CDN, API) precisa entrar na CSP.

## `/api/log`

`api/log.ts` (função serverless no padrão Vercel): aceita só `POST` (e `OPTIONS`), com CORS `*`; recebe uma entrada, um array ou `{logs: []}`; escreve cada entrada em `console.*` com prefixo `[VERCEL_RUNTIME]`; responde `{success, processed}`. Não persiste nada. O cliente (`src/utils/logger.ts`, endpoint padrão `/api/log`) envia em lote, e usa `sendBeacon` em `visibilitychange`/`beforeunload`.

## PWA

- Gerado em build por `vite-plugin-pwa` (config em `vite.config.ts`; detalhes em [product](../product/README.md), documento release-strategy).
- `scripts/build-pwa.sh`: `tsc` typecheck, `npm run build`, avisa se `dist/sw.js` não existir, falha se `dist/manifest.webmanifest` não existir. Usa `npm`, não `pnpm`.
- Chunks separados: `phaser` e `vendor` (`manualChunks`).

## Scripts de TWA e Steam

| Script | O que faz | Estado no repositório |
|---|---|---|
| `scripts/build-twa.sh` | exige `bubblewrap` no PATH, roda `npm run build`, cria `twa-manifest.json` padrão se faltar (com fingerprint placeholder), roda `bubblewrap build` | `twa-manifest.json` não existe |
| `scripts/build-steam.sh` (argumento win, linux, mac ou all) | instala `electron`/`electron-builder` se faltar, `npm run build`, cria `electron-builder.yml` padrão se faltar, roda `electron-builder` | `electron-builder.yml`, `main.js` e dependência `electron` não existem; o `yml` padrão lista `main.js` |

Ambos os scripts têm URL, `packageId` e IDs embutidos no texto; não foram executados.

## Replit

- `.replit`: módulo `nodejs-24`, deploy `autoscale`, `postMerge` roda `scripts/post-merge.sh` (timeout 20000 ms).
- `scripts/post-merge.sh`: `pnpm install --frozen-lockfile` e `pnpm --filter db push` (o pacote se chama `@workspace/db`; o filtro `db` pode não casar, não testado). Exige `DATABASE_URL`.

## Não verificado

- Que o projeto Vercel está ligado a este repositório com deploy automático por push, e a URL de produção (sem evidência no repositório; não há `.github/`).
- Execução de qualquer build ou script; Lighthouse; tamanho do bundle.
- Se `pnpm --filter db push` funciona.
- Qualquer processo de assinatura, publicação em Play Store ou Steam.
