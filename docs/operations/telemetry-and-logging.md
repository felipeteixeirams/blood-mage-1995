# Telemetry and Logging

**Mestre:** [operations](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/main.tsx`, `api/log.ts`, `src/utils/logger.ts`, `src/utils/telemetry.ts`

Logs, telemetria, Sentry e a rota `/api/log`, por leitura estática. Variáveis de ambiente: [environment-variables](environment-variables.md). Segurança: [security](../engineering/security.md).

## Logger (`src/utils/logger.ts`)
| Item | Valor |
|---|---|
| API | `logger.debug/info/warn/error(namespace, message, data?)`; singleton `logger` |
| Buffer em memória | 250 entradas (`MAX_BUFFER_SIZE`), mais recente primeiro |
| Console | método por nível; `debug` é descartado quando `import.meta.env.PROD` |
| Sessão | `sessionId` `sess_<tempo>_<aleatório>` por carga da página |
| Exportação | `exportLogsJson()` (campo `version` fixo `1.5.0` no código; `package.json` diz `0.0.0`) |
| Uso | 18 arquivos importam o logger (grep); a UI de leitura é `ObservabilityModal` (tecla `O` em `App.tsx`) |

## Envio remoto
- `remoteEnabled` começa `true`. Entram na fila: `ERROR`, `WARN` e namespaces que começam com `TELEMETRY` ou `EVENT:`.
- Envio: `fetch` POST JSON `{logs: [...]}` em `/api/log` quando a fila chega a 10 (`MAX_QUEUE_BATCH`) ou 1 s depois da primeira entrada (`FLUSH_INTERVAL_MS`).
- Falha (resposta não-ok ou exceção): reenfileira o lote se a fila tiver menos de 250; sem erro visível.
- Aba escondida (`visibilitychange`) ou `beforeunload`: `navigator.sendBeacon` com o resto da fila.
- Controles `setRemoteEnabled`, `setRemoteEndpoint`, `flushRemote`: nenhum chamador fora de `logger.ts` e testes (grep).

## Handlers globais
| Handler | Comportamento |
|---|---|
| `window.onerror` | loga `ERROR` em `GLOBAL_EXCEPTION` (source, linha, coluna, stack) |
| `window.onunhandledrejection` | loga `ERROR` em `UNHANDLED_REJECTION` com a razão formatada; rejeições "benignas" (mensagem com `play() request was interrupted`, `user didn't interact`, `ResizeObserver loop`, `Failed to execute 'play'`, `audio context`) viram `debug` |

`src/main.tsx` também sobrescreve `AudioContext.prototype.resume` e `HTMLMediaElement.prototype.play` para engolir rejeições (`catch` vazio).

## Telemetria (`src/utils/telemetry.ts`)
- `telemetry.trackEvent(nome, props)`: guarda até 100 eventos em memória e chama `logger.info('EVENT:<NOME>')`, que segue para `/api/log`.
- `updatePerformanceMetrics(fps, frameTimeMs, entityCount, activeVoices)` é chamado em `GameScene.ts`; `getMetrics()` e `getEventHistory()` alimentam o `ObservabilityModal`.
- Ao iniciar emite `TELEMETRY` com o `sessionId`.
- Eventos emitidos (grep): `campaign_start`, `arcade_start`, `game_continue`, `upgrade_selected`, `game_over` (`App.tsx`); `loot_generated` (`LootSystem.ts`); `chunk_load`, `chunk_unload`, `floor_start` (`DungeonFlowController.ts`).
- Só o `sessionId` identifica a origem; o conteúdo exato dos `data` enviados não foi auditado.

## Sentry (`src/main.tsx`)
- `Sentry.init` só roda se a variável `VITE_SENTRY_DSN` existir (lida em build e embutida no bundle). Sem ela, Sentry fica desligado.
- Opções: `environment` = modo do Vite, `tracesSampleRate` 0.1, `replaysOnErrorSampleRate` 1.0. Nenhuma integração de replay é configurada; suspeito que a taxa de replay não tenha efeito (não verificado).
- Captura: `Sentry.ErrorBoundary` em volta de `<App />`, com fallback de tela "ERRO CRÍTICO". O `logger` não chama o Sentry. A precedência entre `onerror`/`onunhandledrejection` do logger e os do SDK não foi verificada.
- `@sentry/vite-plugin` está em `package.json`, mas `vite.config.ts` não o usa.
- A CSP (`vercel.json`) libera `connect-src` para `https://*.sentry.io` e `https://*.ingest.us.sentry.io`.

## `api/log.ts`
| Aspecto | Comportamento |
|---|---|
| Método | `POST`; `OPTIONS` responde 200; outro método 405 |
| CORS | `Access-Control-Allow-Origin: *`, métodos `POST, OPTIONS`, header `Content-Type` |
| Corpo | aceita array, `{logs: []}` ou objeto único; JSON inválido vira `{raw}` |
| Limites | nenhum no código: sem tamanho de corpo, número de entradas, rate limit ou autenticação |
| Processamento | imprime cada entrada com `console.error/warn/info/log`, prefixo `[VERCEL_RUNTIME]`, nível, namespace e sessão; não persiste |
| Resposta | 200 `{success, processed}`; 500 em exceção |
| Chamadores | só `logger.ts` (`fetch` e `sendBeacon`) |

Suspeito: o objeto `payload` montado em `processLogEntry` nunca é usado.

## Onde fica no código
`src/utils/logger.ts` (`logger`, `LoggerService`), `src/utils/telemetry.ts` (`telemetry`), `src/components/ObservabilityModal.tsx`, `src/main.tsx` (Sentry, patches de áudio), `api/log.ts` (`handler`), `vercel.json` (CSP).

Relacionados: [pwa](pwa.md), [persistência](../architecture/persistence.md), [environment-variables](environment-variables.md), [security](../engineering/security.md).
