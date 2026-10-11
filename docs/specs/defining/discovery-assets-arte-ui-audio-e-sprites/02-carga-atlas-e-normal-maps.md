# Assets de arte, UI, áudio e sprites: carga, atlas e normal maps (parte 2)

**Mestre:** [discovery-assets-arte-ui-audio-e-sprites](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Origem:** consolidada de discovery-assets-externos-e-sprites (2026-10-11)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: manifesto `src/game/assets/assetManifest.json` + `assetManifest.ts` (`queueAssetLoading`, chamado em `BootScene.preload`, enfileira o manifesto inteiro; spritesheet do jogador e imagens do baú com `required: true`; inimigos, projéteis, itens e tiles com `required: false`, sem arquivo em `public/`); fallback procedural por chave (`generateGameTextures(this, { force: false })` em `BootScene.create`, que só gera se `textures.exists(key)` é falso); `loaderror` tratado só com `logger` (também em `TitleScene`, `SettingsScene`, `RecordsScene`); `generateNormalMap` em `src/utils/textureGenerator.ts`; `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (cabeçalhos binários). Falta: `AssetLoader` com `loadScene`, mapa cena -> chaves, carga de atlas JSON, consumidor do `normalMapPath` (declarado, sem uso), reporte de falha ao Sentry (`Sentry.init` só em `src/main.tsx`), compressão `pngquant`/`cwebp`, CI (`.github/` ausente), guia para artistas. Aura de inimigo não implementada (`Enemy.applyEliteGlow` cobre só elites).

Parte 2 de 6. Índice: [README](README.md).

## Contexto
Esta parte é a **infraestrutura de carga** dos assets de imagem do Phaser; o que entra (arte, orçamento, áudio, licenças) está nas partes 1, 3, 4 e 5. O fallback procedural por chave existe e o loader novo não pode removê-lo. A telemetria de `loaderror` de imagem e spritesheet é desta parte; a de áudio físico está na [parte 4](04-audio-hibrido.md).

## Objetivo
Se aprovada, arte externa entra por chave, sem quebrar o fallback procedural, carregando por cena e reportando falhas, sem perder FPS.

## Decisões de que depende
Ver [parte 1](01-visao-e-direcao-artistica.md): ADR 0013 (metas), 0010 (canais, cache e formatos), 0008 (`/api/log`, canal de telemetria existente).

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `BootScene` enfileira o manifesto inteiro e depois gera texturas com `force: false` | `src/game/scenes/BootScene.ts` (linhas 72 e 77) | 2026-10-11 |
| `loaderror` só chama `logger` (`error` se `required`, `debug` se planejado) | `src/game/assets/assetManifest.ts` | 2026-10-11 |
| `normalMapPath` existe no tipo e nenhum código o lê | `assetManifest.ts` (tipo), busca em `src/` | 2026-10-11 |
| Tipos do manifesto: `image`, `spritesheet`, `audio`; não há `atlas` | `assetManifest.ts` | 2026-10-11 |
| `.github/workflows` e scripts `pngquant`/`cwebp` não existem | listagem de `scripts/`, ausência de `.github/` | 2026-10-11 |
| CSP libera `connect-src` só para `'self'` e Sentry | `vercel.json` | 2026-10-11 |
| `verify-assets` valida assinatura, tamanho e IHDR dos PNGs e, para spritesheet `required`, a grade contra `frameWidth`/`frameHeight`; grade errada em não `required` gera só aviso | `scripts/verify-assets.cjs` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 12 | Carga por cena (ex-AES 1) | A) tudo no Boot; B) `SCENE_ASSET_MANIFEST` com `loadScene` | B só quando houver arte externa que pese; antes, A |
| 13 | Atlas JSON e `normalMapPath` (ex-AES 2) | A) só imagens soltas; B) atlas + normal map externo | B por chave, com fallback procedural preservado |
| 14 | Destino da telemetria de falha (ex-AES 3) | A) só `logger`; B) `logger` + Sentry | B, mesmo DSN opcional de `main.tsx` |
| 15 | Compressão no CI (ex-AES 4) | A) script manual; B) CI com validação | A agora; B exige aprovar CI (não existe) |
| 16 | Aura de inimigo (ex-AES 5) | A) adiar até haver atlas com normais e blend aditivo; B) agora | A: glow sobre sprite plano polui a tela |
| 17 | Formatos PNG/WebP/atlas (ex-AES 6) | A) PNG com `pngquant`; B) WebP quando compatível | A para sprites, B para fundos |

## Escopo
Se aprovado:
- Mapa cena -> chaves e `loadScene` com carga sob demanda, mantendo o manifesto como fonte de verdade.
- Tipo `atlas` no manifesto e consumo de `normalMapPath`, com fallback procedural por chave.
- Reporte de `loaderror` ao Sentry, com tags de chave e tipo (`system: 'asset-loader'`, `asset_key`, `asset_type`; `extra` com URL e `userAgent`). O exemplo do original usava `window.Sentry` e `any`, que não servem aqui (`@sentry/react`; TypeScript strict).
- Script de compressão (`pngquant`, `cwebp` para fundos) e validação de atlas (CI só se aprovado).
- Guia para artistas (exportação e nome por chave) em `docs/`.

## Fora de escopo
- Orçamento, direção artística, 9-slice, áudio e licenças (outras partes); produção de arte; aura de inimigo (decisão 16); mudar a chave de texturas existentes.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.ts`, `assetManifest.json`, `src/game/scenes/BootScene.ts`, `scripts/verify-assets.cjs`, `assetIntegrity.test.ts`; criar o script de compressão em `scripts/` e o guia em `docs/`.
- Atualizar no mesmo commit: [asset-scripts](../../../operations/asset-scripts.md), [performance](../../../engineering/performance.md) e `Verificado em`.
- Não tocar: `textureGenerator.ts` (chave e fallback), `soundEngine.ts`.
- Contrato: uma chave por textura; asset externo e procedural usam a mesma chave; asset `required: true` ausente falha `pnpm run verify`.

Critérios: [parte 6](06-criterios-e-pendencias.md) (`AAS-1` a `AAS-9`).

## Referências
- [asset-scripts](../../../operations/asset-scripts.md), [performance](../../../engineering/performance.md), [lighting-and-effects](../../../gameplay/lighting-and-effects.md), [evolução gráfica](../discovery-grafico-evolucao-pendente.md) (Eixo B)
