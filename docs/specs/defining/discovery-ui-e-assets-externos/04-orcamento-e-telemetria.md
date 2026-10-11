# Evolução de UI e assets externos góticos: orçamento e telemetria (parte 4)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: `PerformanceMonitor` (ativado por `?perf`), `src/utils/logger.ts` (envia ao `/api/log`), `Sentry.init` em `src/main.tsx` (só com `VITE_SENTRY_DSN`), CSP com `connect-src` para Sentry em `vercel.json`, `vite-plugin-pwa` com `globPatterns` `**/*.{js,css,html,woff2,png,svg}` e limite de 5 MB por arquivo em `vite.config.ts`. Falta: qualquer medição do tamanho do pacote inicial ou da VRAM, teste ou script que imponha os limites abaixo, tamanho máximo de frame validado, `webp`/`json`/`mp3` no precache do PWA, envio de `loaderror` ao Sentry (a cargo de [AES](../discovery-assets-externos-e-sprites.md)).

Parte 4 de 6. Índice das partes: [README](README.md).

## Escopo
Se aprovado, todo asset externo respeita um orçamento. Os limites abaixo são do original e sem aprovação; o **mecanismo** (lazy-loading, compressão, atlas, telemetria de imagem) é de [AES](../discovery-assets-externos-e-sprites.md).

| Item | Limite proposto |
|---|---|
| Piso isométrico / parede | 64x32 / 32x32 |
| Personagem e inimigo médio, por frame | 48x48 ou 64x64 |
| Inimigo grande ou chefe, por frame | 128x128 |
| Ícone de menu ou skill | 32x32 ou 48x48 |
| Pacote inicial do PWA (Título, Menu, Safe Zone) | 2,5 MB |
| PNG de produção | paleta de 256 cores via `pngquant` |
| Fundos e tilesets em WebP | qualidade 80 |
| Ícones de inventário e magias | um único atlas (1 draw call) |

Telemetria de falha de áudio e de imagem: o original propunha um listener `loaderror` que registra no `logger` e envia `captureMessage` ao Sentry com tags `system: 'asset-loader'`, `asset_key` e `asset_type`, e `extra` com URL tentada e `userAgent`. Esse comportamento é especificado em AES (critérios AES-6 e AES-7); o de áudio físico está na parte 3. O exemplo do original usa `window.Sentry` e `fileObj: any`, que não servem neste projeto (o Sentry é importado de `@sentry/react`; TypeScript strict proíbe `any`).

## Fora de escopo
- Implementar o loader, a compressão e o CI (AES).
- Medir VRAM em aparelhos reais além do que a decisão do ADR 0013 vier a definir.
- Criar a infraestrutura de Sentry (já existe, `src/main.tsx`).

## Arquivos e contratos
- Criar: verificação do orçamento (script ou teste) em `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (estender, sem novo arquivo se possível).
- Alterar: `vite.config.ts` (`globPatterns` do PWA, se formatos novos forem usados).
- Atualizar no mesmo commit: `docs/engineering/performance.md`, `docs/engineering/performance-metrics.md`, `docs/operations/pwa.md` e `Verificado em`.
- Não tocar: `PerformanceMonitor.ts`.
- Contrato: limites da tabela acima; a verificação falha com a chave e a medida excedida.

Critérios, verificação e pendências: [parte 6](06-criterios-e-pendencias.md).

## Referências
- [Performance](../../../engineering/performance.md), [Métricas de performance](../../../engineering/performance-metrics.md), [ADR 0013](../../../decisions/0013-metas-de-performance.md)
- [Telemetria e logs](../../../operations/telemetry-and-logging.md), [PWA](../../../operations/pwa.md)
