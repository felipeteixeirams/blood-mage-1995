# PWA: manifest com arquivos ausentes e service worker duplicado (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `public/manifest.webmanifest`, `vite.config.ts` (`VitePWA`), `src/main.tsx`, `src/App.tsx`, `src/hooks/usePWA.ts`, `src/components/ui/PWAInstallBanner.tsx` e `src/utils/logger.ts` (`exportLogsJson`). Não validado em execução (nenhum build rodado).

## Contexto
Ver [pwa](../../operations/pwa.md) e [telemetria e logs](../../operations/telemetry-and-logging.md).
- **Arquivos ausentes.** `public/` tem `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`. O manifest referencia também `icon-192-maskable.png`, `icon-96.png`, `icon-96-trophy.png` (shortcuts), `screenshot-1.png` e `screenshot-2.png`: nenhum existe (404; ícone maskable e screenshots de instalação ficam quebrados).
- **`share_target`.** Aponta para `POST /share`. Não há rota `/share` (`api/` só tem `log.ts`; sem rota correspondente em `src/`).
- **Service worker duas vezes.** `src/main.tsx` (só em produção) chama `navigator.serviceWorker.register('/sw.js')` e agenda `update()` a cada 6 h; `src/App.tsx` chama `registerSW` de `virtual:pwa-register` (mesmo escopo, mesmo script).
- **Atualização sem confirmação.** `vite.config.ts`: `registerType: 'prompt'`, mas `workbox.skipWaiting: true` e `clientsClaim: true`. O SW novo assume sem o aviso `onNeedRefresh` de `App.tsx`, que existe para o fluxo `prompt`.
- **Banner e hook órfãos.** `usePWA` e `PWAInstallBanner` só se importam entre si (grep em `src/`); `App.tsx` não monta nenhum. O banner nunca aparece.
- **Sentry.** `src/main.tsx` passa `replaysOnErrorSampleRate: 1.0` a `Sentry.init`, sem `replayIntegration` (grep): a taxa não tem efeito. `@sentry/vite-plugin` está em `package.json` e não aparece em `vite.config.ts` nem em `scripts/` (sem upload de sourcemaps).
- **Versão do log.** `exportLogsJson` (`logger.ts` l.203) grava `version: '1.5.0'`; `package.json` tem `"version": "0.0.0"`.
- Não verificado (exige build): nome real do SW gerado e se o plugin gera manifest próprio (a opção `manifest` não está definida).

## Objetivo
**Proposta:** o manifest só referencia arquivos e rotas existentes; há um único registro de SW com atualização coerente com `registerType`; o que não é usado sai ou é montado; a versão exportada vem de uma fonte única.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Ícones e screenshots ausentes | A) criar os arquivos (arte é do responsável); B) remover as entradas do manifest | B agora, A quando houver arte; PNG não se edita por texto |
| 2 | `share_target` | A) remover; B) criar a rota | A: o jogo não tem o que receber de compartilhamento |
| 3 | Registro do SW | A) só `registerSW` (App.tsx); B) só `main.tsx` | A: integra `onNeedRefresh`; a atualização periódica migra para `onRegisteredSW` |
| 4 | Política de atualização | A) `prompt` sem `skipWaiting`/`clientsClaim` (aviso ao usuário); B) `autoUpdate` | A: evita trocar o SW no meio de uma partida |
| 5 | Banner de instalação | A) montar `PWAInstallBanner`; B) remover banner e hook | Responsável decide (UX de instalação); sem decisão, B |
| 6 | Replay do Sentry | A) adicionar `replayIntegration`; B) remover a taxa | B: replay grava a tela e é decisão de privacidade |
| 7 | `@sentry/vite-plugin` | A) usar (sourcemaps); B) remover a dependência | Responsável decide (ver ADR 0015); sem decisão, B |
| 8 | Versão do export | A) injetar a de `package.json` via `define` do Vite; B) manter fixa | A |

## Escopo
Decisões 1 a 8 que o responsável aprovar.

## Fora de escopo
- Estratégia offline e `runtimeCaching`.
- `/api/log`: ver [ADR 0008](../../decisions/0008-endpoint-api-log.md).
- Criar arte nova.

## Arquivos e contratos
- Alterar: `public/manifest.webmanifest`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/utils/logger.ts`; conforme decisões: `src/hooks/usePWA.ts`, `src/components/ui/PWAInstallBanner.tsx`, `package.json`.
- Atualizar no mesmo commit: `docs/operations/pwa.md`, `docs/operations/telemetry-and-logging.md`.
- Não tocar: `src/game/**`.
- Contrato: todo `src` do manifest resolve a um arquivo de `public/` e toda URL de `shortcuts`/`share_target` a uma rota do app.

## Critérios de aceite (provisórios)
- **PW-1** Quando o manifest for lido, o sistema deve ter, em `public/`, cada arquivo referenciado em `icons`, `screenshots` e `shortcuts`.
- **PW-2** Onde `share_target` permanecer, a rota alvo deve responder sem 404.
- **PW-3** Quando o app carregar em produção, o sistema deve registrar o service worker uma única vez.
- **PW-4** Quando houver versão nova do SW (decisão 4 = A), o sistema deve exibir o aviso de atualização e só trocar o SW após confirmação.
- **PW-5** Se um registro de SW falhar, o sistema deve logar o erro via `logger` e continuar funcionando.
- **PW-6** Quando `exportLogsJson` rodar, o campo `version` deve igualar a versão da fonte única.
- **PW-7** Onde a decisão 6 for A, o `Sentry.init` deve incluir a integração de replay.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PW-1 | teste que lê o manifest e checa `existsSync` em `public/`; Lighthouse PWA manual |
| PW-2 | `pnpm run build` e checagem da rota no preview (manual) |
| PW-3, PW-4 | build de produção; DevTools > Application: um registro e fluxo de aviso (manual) |
| PW-5 | teste com `registerSW` simulado que rejeita |
| PW-6 | teste em `src/utils/logger.test.ts` |
| PW-7 | leitura de `main.tsx` ou teste com mock do Sentry |

Rodar `pnpm run verify` e `pnpm run docs:check`.

## Questões em aberto
- O `generateSW` emite `/sw.js` e um manifest próprio? (exige build)
- Existe arte de ícones e screenshots?

## Referências
[pwa](../../operations/pwa.md), [telemetria e logs](../../operations/telemetry-and-logging.md), [build e deploy](../../operations/build-and-deploy.md), [persistência](../../architecture/persistence.md), [ADR 0008](../../decisions/0008-endpoint-api-log.md), [ADR 0010](../../decisions/0010-canais-de-distribuicao.md).
