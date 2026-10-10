# Campanha trava com `Cannot read properties of null (reading 'resolution')`

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `src/game/systems/DungeonFlowController.ts` (`markOwnFloorChunkAsBuilt`, chamado em `buildDungeonMap` quando `gameMode === 'campaign'`), `src/game/systems/DungeonFlowController.test.ts`

## Sintoma
No modo Campanha o personagem não aparece e o console mostra `TypeError: Cannot read properties of null (reading 'resolution')` dentro do renderer WebGL do Phaser. No modo Arcade o mesmo fluxo funciona.

## Causa raiz
`buildDungeonMap()` monta o piso da campanha com o bioma `campaignState.currentZone` (`safe_house` no início). Em paralelo, `updateChunkStream()` (todo `update()`) carrega via `ChunkStreamer` a sequência `CAMPAIGN_ZONE_CHUNKS`, cujo chunk 0 também é `safe_house`. `loadChunkBiome()` roda de novo para esse chunk e chama `SafeHouseDetailFactory.bakeDetailTextures()`, que remove e recria as texturas por chave (`textures.remove`) por cima do que já estava montado. Os sprites já criados ficam com frame de textura destruída e o render quebra.

Confirmado por teste: sem a marcação, `dungeonGenerator.generate` roda duas vezes (chunk 0 e vizinho) em vez de uma. O crash do renderer em si foi observado em execução e não é reproduzido por teste headless. Em Arcade o bioma do piso nunca coincide com o do chunk 0, por isso não ocorre.

## Solução
`markOwnFloorChunkAsBuilt(biome)` marca em `builtChunkIndices` o índice de `CAMPAIGN_ZONE_CHUNKS` cujo bioma é o do piso; `loadChunkBiome()` pula índices já marcados e os chunks vizinhos continuam carregando.

## Como verificar
```bash
pnpm test -- --run src/game/systems/DungeonFlowController.test.ts
```
Casos: `sem markOwnFloorChunkAsBuilt ... (bug real reproduzido)`, `... impede que updateChunkStream regenere ... (fix)`, `... não afeta chunks vizinhos`. Não executado nesta data (sem `node_modules`). Manual: iniciar uma Campanha e conferir que o jogador aparece e o console não tem o `TypeError`.
