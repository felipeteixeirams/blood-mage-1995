---
agent_context: game-engine, qa
target_module: src/game/systems/DungeonFlowController.ts, src/game/systems/DungeonGenerator.ts, src/game/systems/ProceduralForestGenerator.ts
priority: high
criticality: high
status: backlog
last_updated: 2026-10-07
tags: [specs, chunk-streaming, bug, visual, campanha, arcade, ears]
---

# Spec 35.04 — Contaminação de Biomas no Chunk Streaming (Offset Ignorado + Streaming no Arcade)

> Satélite de [35.00 — Índice Mestre](./35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).
> Achado coberto: **A9**. Pré-requisito: [35.02](./35_02_GATE_E2E_JOGABILIDADE_ARCADE_CAMPANHA.md).

## 1. Contexto

### 1.1 Sintoma (execução real, 2026-10-07)
- **Campanha / Safe House:** linhas verdes em zigue-zague sobre o piso de
  madeira. Medido: 1.350 sprites `forest_grass` em x∈[192, 2528], y∈[400, 1568],
  depth −1000, todos visíveis; piso `tile_wood_floor_*` em x∈[0, 1896]. Os tiles
  de madeira são losangos com cantos transparentes → a grama (atrás, depth −1000)
  aparece pelas frestas. Mesma mecânica descrita no ADR 2026-09-06 de
  `docs/architecture/07_DECISION_LOG.md` (piso depende de opacidade total).
- **Arcade:** a masmorra (`tile_ground_var_0` em x∈[144, 1656]) e o piso da
  Safe House (`tile_wood_floor_*` em x∈[0, 1896]) e a floresta (`forest_grass`)
  coexistem **na mesma região**; 477 `spr_wall` em vez de 160.

### 1.2 Causa-raiz (leitura de código, confirmada pelos bounds medidos)
1. `DungeonFlowController.loadChunkBiome(biome, chunkIndex)` (`:143-163`) calcula
   `const offsetX = chunkIndex * CHUNK_WIDTH` mas chama
   `dungeonGenerator.generate(CHUNK_WIDTH, CHUNK_HEIGHT, biome)` **sem** o offset —
   `offsetX` só vai para `telemetry.trackEvent`.
2. `DungeonGenerator.generate(mapW, mapH, biome, _offsetX = 0, _offsetY = 0)` (`:76`)
   **ignora** os offsets (prefixo `_`), e no ramo `gloomy_woods` chama
   `forestGen.generate(mapW, mapH)` sem repassá-los — embora
   `ProceduralForestGenerator.generate(mapW, mapH, offsetX, offsetY)` (`:89-94`)
   já os suporte (`cameraOffsetX = CAMERA_OFFSET_X + offsetX`).
3. Para biomas de masmorra, `generate` posiciona tudo a partir de
   `const originX = 90` (`:~100`) — sem offset.
4. `GameScene.update()` chama `dungeonFlow.updateChunkStream(this.player.x)`
   (`GameScene.ts:1644-1646`) **em qualquer `gameMode`**, então o Arcade também
   carrega `CAMPAIGN_ZONE_CHUNKS` (`safe_house`, `gloomy_woods`, …).
5. Efeito colateral latente: `unloadChunkBiome` (`:165+`) destrói filhos por faixa
   `[chunkIndex*CHUNK_WIDTH, +CHUNK_WIDTH)`. Como o conteúdo de todo chunk nasce
   em x≈0–2500, descarregar um chunk pode destruir o piso de **outro** chunk.

> Isso contradiz `delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md` fase B.2
> ("`DungeonGenerator.generate()` e `ProceduralForestGenerator` com suporte a
> `offsetX`/`offsetY`"): o parâmetro existe, a ligação não.

Skill a consultar: **`phaser-4-procedural-generation`** (determinismo por seed,
ordem de profundidade de piso).

## 2. Objetivo

Cada chunk de bioma deve ser construído dentro da sua própria faixa de mundo,
e o Arcade não deve carregar chunks da Campanha.

## 3. Escopo

### 3.1 Dentro do Escopo
- Repassar `offsetX/offsetY` de `loadChunkBiome` → `DungeonGenerator.generate` → `ProceduralForestGenerator.generate`.
- Aplicar o offset no ramo de masmorra de `DungeonGenerator.generate` (origem BSP e todo `scene.add.*` derivado dela).
- Restringir `updateChunkStream` ao modo Campanha (default — ver §6).
- Testes de bounds por chunk.

### 3.2 Fora do Escopo
- Trocar `ProceduralForestGenerator` por `PathDrivenGenerator` (decisão pendente registrada em `DungeonGenerator.ts:78-82`).
- Mudar `CHUNK_WIDTH`, a ordem de `CAMPAIGN_ZONE_CHUNKS` ou a lógica de blend de bioma.
- Redesenho do piso da Safe House (tornar os losangos opacos) — corrigir a sobreposição remove a causa, não o sintoma.

## 4. Requisitos (EARS)

| ID | Requisito | Verificação |
|---|---|---|
| R35.04-01 | **QUANDO** `loadChunkBiome(biome, i)` for executado, o sistema **DEVE** chamar `dungeonGenerator.generate(CHUNK_WIDTH, CHUNK_HEIGHT, biome, i * CHUNK_WIDTH, 0)`. | `DungeonFlowController.test.ts` (spy nos argumentos) |
| R35.04-02 | **ONDE** `biome === 'gloomy_woods'`, `DungeonGenerator.generate` **DEVE** repassar `offsetX, offsetY` para `ProceduralForestGenerator.generate`. | `DungeonGenerator.test.ts` |
| R35.04-03 | **ONDE** o bioma for de masmorra (`safe_house`, `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`), `DungeonGenerator.generate` **DEVE** somar `offsetX/offsetY` à origem do layout, de modo que todo sprite criado tenha `x ∈ [offsetX − margem, offsetX + mapW + margem]`, com margem ≤ 64 px. | `DungeonGenerator.test.ts` (bounds de todos os `scene.add.*` mockados) |
| R35.04-04 | Com offset `0`, `DungeonGenerator.generate` **DEVE** produzir exatamente as mesmas posições de hoje (mesma seed 1995 → mesmo layout), preservando o determinismo. | snapshot de posições antes/depois em teste |
| R35.04-05 | **ENQUANTO** `gameMode === 'arcade'`, `GameScene.update` **NÃO DEVE** chamar `dungeonFlow.updateChunkStream` (default de §6). | teste + sonda E2E: 0 sprites `tile_wood_floor_*` e 0 `forest_grass` no Arcade andar 1 |
| R35.04-06 | **ENQUANTO** a Campanha estiver na Safe House com o jogador em x < `CHUNK_WIDTH`, **NÃO DEVE** existir sprite `forest_grass` com `x < CHUNK_WIDTH − 64`. | sonda E2E (mesma técnica da auditoria) em `smoke-playable.spec.ts` |
| R35.04-07 | **QUANDO** `unloadChunkBiome(biome, i)` for executado, os objetos destruídos **DEVEM** ser apenas os criados por aquele chunk (garantido por R35.04-03 + teste que carrega chunks 0 e 1, descarrega 1 e verifica o piso do 0 intacto). | `DungeonFlowController.test.ts` |
| R35.04-08 | **SE** o crash de `3a52786` voltar (rebake da Safe House sobre si mesma), **ENTÃO** o gate 35.02 **DEVE** falhar — o fix `markOwnFloorChunkAsBuilt` não pode ser removido por esta spec. | `pnpm e2e:smoke` |

## 5. Requisitos Técnicos e Arquivos-Alvo

| Arquivo | Mudança |
|---|---|
| `src/game/systems/DungeonFlowController.ts:150` | `generate(CHUNK_WIDTH, CHUNK_HEIGHT, biome, offsetX, 0)` |
| `src/game/systems/DungeonGenerator.ts:76-86` | renomear `_offsetX/_offsetY` → `offsetX/offsetY`; `forestGen.generate(mapW, mapH, offsetX, offsetY)` |
| `src/game/systems/DungeonGenerator.ts:100-139` (ramo masmorra) | **Não** somar em `originX` — `usableW = mapW - originX - 90` (`:102`) depende dele. Manter o layout BSP em coordenadas locais e **transladar** por `offsetX/offsetY` no ponto de conversão para mundo (onde cada `scene.add.*` recebe x/y) e nos `RoomData` retornados. Auditar que nenhuma posição do método usa constante absoluta fora desse ponto |
| `src/game/scenes/GameScene.ts:1644-1646` | condicionar a `useGameStore.getState().gameMode === 'campaign'` (⚠️ arquivo crítico — só a condição) |
| `src/game/systems/DungeonGenerator.test.ts`, `DungeonFlowController.test.ts` | testes de bounds/argumentos |

## 6. Decisões de Produto Necessárias

| Decisão | Default seguro |
|---|---|
| O Arcade deve ter mundo contínuo com os biomas da Campanha? | **Não.** O Arcade constrói o próprio andar em `buildDungeonMap` desde antes da spec 25, e a spec 25 descreve a "estrutura de campanha LINEAR". Se o Felipe quiser streaming no Arcade, isso vira spec própria com sequência de chunks do Arcade. |

## 7. Testes e Critério de Aceite

1. `pnpm test -- --run`, `pnpm run typecheck`, `pnpm run build` passam.
2. `pnpm e2e:smoke` passa com R35.04-05 e R35.04-06.
3. Screenshots da Safe House (sem zigue-zague verde) e do Arcade andar 1
   (sem piso de madeira) anexados ao changelog.
4. Caminhar da Safe House até `gloomy_woods` na Campanha: a floresta aparece a
   partir de x≈1920 — **validação manual** (registrar se feita por sonda ou por playtest).

## 8. Guardrails

- Não remover nem alterar `markOwnFloorChunkAsBuilt` (item 20 de `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`).
- Não mudar seed nem ordem de geração (determinismo, spec 30).
- Contagem total de objetos deve **cair** (menos chunks sobrepostos) — registrar antes/depois.

## 9. Referências

- [[35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE]], [[delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING]], [[delivered/30_DETERMINISMO_SEED_POISSON_DISK]]
- `docs/architecture/07_DECISION_LOG.md` — ADR 2026-09-06 (piso por opacidade)

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação (achado A9): bounds medidos em execução + causa-raiz no código (`offsetX` calculado e descartado) | Claude |
