# Assets: carga por cena, atlas e normal maps

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** C
**Depende de:** ADR 0008, ADR 0010, ADR 0013
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Origem:** dividida de discovery-assets-arte-ui-audio-e-sprites (parte 02 e critérios AAS-1..9), 2026-10-11 (ex-AES)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: manifesto `src/game/assets/assetManifest.json` + `assetManifest.ts` (`queueAssetLoading`, chamado em `BootScene.preload`, enfileira o manifesto inteiro; spritesheet do jogador e imagens do baú com `required: true`; inimigos, projéteis, itens e tiles com `required: false`, sem arquivo em `public/`); fallback procedural por chave (`generateGameTextures(this, { force: false })` em `BootScene.create`, que só gera se `textures.exists(key)` é falso); `loaderror` tratado só com `logger` (também em `TitleScene`, `SettingsScene`, `RecordsScene`); `generateNormalMap` em `src/utils/textureGenerator.ts`; `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (cabeçalhos binários). Falta: `AssetLoader` com `loadScene`, mapa cena -> chaves, carga de atlas JSON, consumidor do `normalMapPath` (declarado, sem uso), reporte de falha ao Sentry (`Sentry.init` só em `src/main.tsx`), compressão `pngquant`/`cwebp`, CI (`.github/` ausente), guia para artistas. Aura de inimigo não implementada (`Enemy.applyEliteGlow` cobre só elites). Nenhum critério abaixo está implementado.

## Contexto
Infraestrutura de carga dos assets de imagem do Phaser; o que entra (arte, orçamento, áudio, licenças) está nas specs vizinhas. O fallback procedural por chave existe e o loader novo não pode removê-lo. A telemetria de `loaderror` de imagem e spritesheet é desta spec; a de áudio físico está em [feature-audio-fisico-hibrido](feature-audio-fisico-hibrido.md).

## Objetivo
Se aprovada, arte externa entra por chave, sem quebrar o fallback procedural, carregando por cena e reportando falhas, sem perder FPS.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0008](../../decisions/0008-endpoint-api-log.md) | `/api/log`, canal de telemetria existente | Aprovada |
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais (cache e formatos) | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance ("sem queda de FPS") | Proposta |

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
Numeração original (preservada).

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
- Orçamento, direção artística, 9-slice, áudio e licenças (outras specs); produção de arte; aura de inimigo (decisão 16); mudar a chave de texturas existentes.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.ts`, `assetManifest.json`, `src/game/scenes/BootScene.ts`, `scripts/verify-assets.cjs`, `assetIntegrity.test.ts`; criar o script de compressão em `scripts/` e o guia em `docs/`.
- Atualizar no mesmo commit: [asset-scripts](../../operations/asset-scripts.md), [performance](../../engineering/performance.md) e `Verificado em`.
- Não tocar: `textureGenerator.ts` (chave e fallback), `soundEngine.ts`.
- Contrato: uma chave por textura; asset externo e procedural usam a mesma chave; asset `required: true` ausente falha `pnpm run verify`.

## Critérios de aceite
Prefixo `CAR`; ID antigo entre parênteses. Provisórios.
- **CAR-1** (AAS-1, AES-1) Quando um asset externo de chave K existe e carrega, o BootScene deve usar a textura externa sob a chave K (provisório).
- **CAR-2** (AAS-2, AES-2) Se o arquivo de uma chave não carrega, então o BootScene deve gerar a textura procedural sob a mesma chave (provisório).
- **CAR-3** (AAS-3, AES-3) Quando o jogo entra em uma cena, o AssetLoader deve carregar apenas as chaves mapeadas a essa cena que ainda não estão em cache (provisório).
- **CAR-4** (AAS-4, AES-4) Se uma chave de cena não carrega, então o AssetLoader deve prosseguir com o fallback procedural sem travar a transição (provisório).
- **CAR-5** (AAS-5, AES-5) Onde uma entrada do manifesto declara `normalMapPath`, o loader deve associar o normal map externo à textura; sem o arquivo, o `generateNormalMap` procedural continua valendo (provisório).
- **CAR-6** (AAS-6, AES-6) Quando um `loaderror` ocorre e o Sentry está inicializado, o AssetLoader deve enviar a chave, o tipo e a URL ao Sentry (provisório).
- **CAR-7** (AAS-7, AES-7) Se o Sentry não está inicializado (sem `VITE_SENTRY_DSN`), então o AssetLoader deve registrar a falha só no `logger` sem lançar erro (provisório).
- **CAR-8** (AAS-8, AES-8) Se um asset `required: true` falta ou está corrompido, então o `verify-assets` deve falhar com a chave no erro (provisório).
- **CAR-9** (AAS-9, AES-9) O script de compressão deve produzir PNGs de até 256 cores a partir de entradas coloridas (provisório; limite em [discovery-assets-orcamento-licencas-e-creditos](discovery-assets-orcamento-licencas-e-creditos.md)).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CAR-1, CAR-2 | Teste unitário do manifesto com cena simulada; manual: apagar `spr_chest` temporariamente e abrir o jogo (não validado) |
| CAR-3, CAR-4 | Teste unitário do AssetLoader (novo) com mapa e falha simulada |
| CAR-5 | Teste unitário de `textureGenerator`/loader com e sem `normalMapPath` |
| CAR-6, CAR-7 | Teste unitário com mock de `@sentry/react` |
| CAR-8 | `pnpm run verify` com arquivo `required` removido; `assetIntegrity.test.ts` |
| CAR-9 | Rodar o script sobre uma imagem de teste e contar a paleta |
| Sem queda de FPS | Não validado: precisa de playtest humano (`?perf`) |

## Questões em aberto
Numeração original entre parênteses.
1. (Q2) Pré-carregar versus transmitir (streaming) por cena.
2. (Q3) Aprovação de CI e escolha da ferramenta (TexturePacker, Shoebox, Laigter são só sugestões); custo de `pngquant`/WebP no build.
3. (Q11, referência cruzada) Conflito registrado: CAR-6 envia chave, tipo e URL ao Sentry; o critério de áudio AUD-3 só a chave. A questão pertence a [feature-audio-fisico-hibrido](feature-audio-fisico-hibrido.md) e deve ser reconciliada junto com CAR-6.

## Pendências para promover a backlog
- Discovery: sem aprovação do responsável.
- Aprovar as decisões 12 a 17 e os ADRs 0010 e 0013 (0008 já aprovado).
- Fechar as questões acima e trocar valores "propostos" por aprovados; aprovar CI antes de qualquer item que o exija (decisão 15B).

## Referências
- [asset-scripts](../../operations/asset-scripts.md), [performance](../../engineering/performance.md), [lighting-and-effects](../../gameplay/lighting-and-effects.md), [evolução gráfica](feature-grafico-efeitos-restantes.md) (Eixo B)
