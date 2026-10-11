# Geração de mundo, biomas e atmosfera

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Leitura estática (nada foi executado). Decisões em aberto sobre terreno e mundo contínuo estão nos ADRs 0002 e 0003 em `../decisions/README.md`; este documento só descreve o que o código faz. Campanha e Safe House: campaign e safe-house-and-quests (texto, sem link).

## Quem chama o quê

```
GameScene.create / DungeonFlowController.advanceToNextFloor
  -> DungeonFlowController.buildDungeonMap(1920, 1440, depth)
       escolhe o bioma, aplica WorldManager/PostFX/Atmosphere/Lighting
       -> DungeonGenerator.generate(w, h, biome)   -> RoomData[]
            gloomy_woods -> ProceduralForestGenerator.generate (1 sala)
            safe_house   -> sala única 800x600
            demais       -> BSP + autômato celular (salas, paredes, portas)
GameScene.update -> DungeonFlowController.updateChunkStream(player.x)
       -> ChunkStreamer.update -> onLoad/onUnload -> loadChunkBiome/unloadChunkBiome
```

| Classe | Estado hoje |
|---|---|
| `DungeonGenerator` | gerador principal; instancia `HeightmapGenerator(1995)` e `PathDrivenGenerator` |
| `ProceduralForestGenerator` | chamado por `DungeonGenerator.generate` quando `biome === 'gloomy_woods'`; substitui `heightGenerator` do `DungeonGenerator` pelo seu |
| `PathDrivenGenerator` | construído em `DungeonGenerator`, mas `generate()` não é chamado fora de testes. Produção só lê `lastZones` (`DungeonFlowController`) e `isWaterTileAt` (`Player.ts`, `Enemy.ts`); ambos ficam vazios/falsos |
| `HeightmapGenerator` | value noise determinístico (semente 1995), elevação 0..4; ver ADR 0002 |

## Mapa de masmorra (biomas não florestais)

`DungeonGenerator.generate` (mapa 1920x1440, margens 90/70):
- **Salas:** `bspSplit` até 6 a 9 folhas (mín. 380x320, corte 42-58%); `computeCorridorZoneGrid` (6x5, autômato celular, 2 iterações) decide por folha preenchimento de 50-68% ("corredor") ou 74-90% ("cripta"); sala mínima 220x190 (`carveRoomFromLeaf`).
- **Tipos (`RoomData.type`):** `spawn` = sala mais perto do canto superior esquerdo; `boss` = a mais distante do spawn; `secret_treasure` = a seguinte mais distante; demais `chamber`.
- **Piso:** tiles 48x24 com `renderY = y - altura*2`, tint por bioma, autotiling de 4 vizinhos (`calculateBitmask`, `getGroundTextureKey`); falésias onde há desnível; props por Poisson disk em altura > 0 (35%).
- **Paredes:** perímetro externo mais paredes top/left de cada sala com porta de vão `DOOR_WIDTH = 80` e sprite `tile_door`; autotiling de parede (`getWallTextureKey`); colisão 32x32 em `wallsGroup`.
- **Conteúdo por sala:** boss: pentagrama decorativo; `chamber`: 40% de grupo de espinhos (3-6), 30% de barris (2-4); `secret_treasure`: 2 baús garantidos; demais não-spawn: 15% de 1 baú; `DungeonDetailFactory.scatterDetails(room, biome)`.
- **Tint (`BIOME_TINTS`, piso/parede):** fosso_chagas 0x86efac/0x15803d, catacumbas_martires 0xcccccc/0x475569, santuario_sangue 0xfca5a5/0x991b1b, gloomy_woods 0x5e796e/0x2f3e46, safe_house sem tint.
- **Safe House:** sala 800x600 centrada, paredes `tile_wood_wall`, piso de madeira (variantes e tapete por ruído), `SafeHouseDetailFactory`; retorna antes de qualquer lógica de masmorra.

Inimigos (`buildDungeonMap`, bioma != safe_house e != gloomy_woods): onda `waves.json[min(depth-1, 6)]`. Sala boss: `bossMonsterId` da onda ou `necro_lord_boss`, mais 2 `cultist_acolyte` (3 com o modificador `blood_tide`). Salas comuns: 2-3 + min(2, depth-1) inimigos sorteados de `monsterPool` (arredondado x1,4 com `blood_tide`); cada sala não-spawn tem 75% de 1-2 `Scavengeable`. Spawns entram em `pendingEnemySpawns` e ativam até o cap (`getActiveEnemyCap`: 18; 24 no andar 4; 30 do 5 em diante). No andar 1 fora da Safe House, `spawnInitialSiege` cria 3 `scout_beast` e 1 `skeleton_warrior` em windup.

## Floresta (gloomy_woods)

`ProceduralForestGenerator.generate(1920, 1440)`: grid 30x45 (pixels / 64x32), origem isométrica (1600, 400); piso `forest_grass` opaco em depth fixo -1000 (altura não desloca o piso; só tint e falésias), manchas de luz aditivas, flora (`TerrainDetailFactory.scatterRichFlora`, 240 itens), 14 árvores de fundo em paralaxe (scrollFactor 0,65) e 44 de primeiro plano (2 fixas ao centro + 42) com colisão invisível 16x10 no tronco. Retorna **uma única sala** `spawn` de 400x400 no centro. Consequência em `buildDungeonMap`: sem chefe, sem baús, sem armadilhas, sem `Scavengeable`; só 4 `scout_beast` (`pendingEnemySpawns`) e o Altar Ancestral na mesma sala. Partículas ambientes via `advancedParticles.startForestAmbient`.

## Mundo contínuo (ChunkStreamer)

`ChunkStreamer<T>`: janela deslizante sobre chunks ordenados por `index`, `update(playerX)` carrega/descarrega (`onLoad`/`onUnload`) os chunks a `loadRadius` do atual; `getChunkIndexAt` satura nas pontas.

`DungeonFlowController` o instancia com `loadRadius: 1` e 5 chunks de 1920x1440, um por bioma, na ordem safe_house, gloomy_woods, fosso_chagas, catacumbas_martires, santuario_sangue (`CAMPAIGN_ZONE_CHUNKS`). A cada frame:
- `zoneStreamer.update(x)`; `onLoad` = `loadChunkBiome` (gera o bioma via `generate`, acrescenta salas a `scene.rooms`, troca bioma de store/WorldManager/PostFX/Atmosphere/Lighting); `onUnload` destrói paredes, baús e `Scavengeable` com x dentro do chunk.
- `syncWorldBoundsWithStreamer`: limites de mundo e câmera = união dos chunks carregados.
- `updateBoundaryTransitions`: a 400 px da fronteira entre chunks, calcula `blendT` e chama `blendBiomes` em WorldManager, AtmosphereSystem e PostFX, e atualiza o áudio de ambiente.
- Na Campanha, `markOwnFloorChunkAsBuilt(biome)` evita regenerar o chunk do piso atual (evita crash de rebake da Safe House).
- O gatilho de avanço de andar continua sendo o portal, não o streamer (`getNextCampaignZone`).

`loadChunkBiome` chama `generate(1920, 1440, biome)` sem deslocamento: `DungeonGenerator.generate` ignora `_offsetX/_offsetY` (`offsetX` só vai para telemetria). Comentários antigos em `ChunkStreamer.ts` e `DungeonFlowController.ts` ("prova de conceito", "no-ops") não descrevem o comportamento atual.

## Portais, portas e andares

- Safe House: `revealDescentDoor` (porta `tile_door`, tocha) ativa no início; Arcade/demais andares: `CombatEffectsSystem.handleEnemyDeath` chama `revealDescentPortal` (sprite `spr_portal` girando, brilho) quando `enemiesGroup.countActive() === 0` e `pendingEnemySpawns` vazio.
- `GameScene.update`: portal ativo e distância ao jogador < 35 px chama `advanceToNextFloor`.
- `advanceToNextFloor`: som, `ContractSystem.onFloorCompleted`, Campanha avança a zona, `currentFloorDepth++`, cura 35 HP e 50 de mana, limpa grupos (paredes, baús, coletáveis, projéteis, `Scavengeable`, loot, manchas), perde o cadáver do jogador se não coletado, `buildDungeonMap(1920, 1440, depth)`.
- Banner `showFloorBanner` mostra título por `(depth-1) % 4` (4 títulos).

## Ambiente por bioma

Três sistemas independentes, todos indexados por `BiomeType`.

| Bioma | WorldManager: interno?, raio de luz, escuridão (cor/alpha), névoa, reverb, drone Hz, partícula | LightingSystem: luz do jogador (raio/cor), tocha (raio/cor) | AtmosphereSystem: névoa solo, bruma alta, tint, clima |
|---|---|---|---|
| fosso_chagas | sim, 320, 0x0f0e14/0,15, 0,15, 0,3, 65, spores | 180/0xff5522, 120/0xff9933 | 0,12, 0,04, 0x948075, spores |
| catacumbas_martires | sim, 300, 0x080812/0,20, 0,20, 0,4, 45, ash_embers | 140/0x8866ff, 100/0xaa88ff | 0,15, 0,05, 0x94a3b8, ash_embers |
| santuario_sangue | não, 400, 0x141220/0,10, 0,10, 0,1, 110, blood_rain | 320/0xff4433, 150/0xffaa33 | 0,09, 0,03, 0x991b1b, blood_rain |
| safe_house | sim, 360, 0x1c130e/0,08, 0,05, 0,05, 0, none | 220/0xff9944, 180/0xffaa44 | 0,04, 0,02, 0xd97706, none |
| gloomy_woods | não, 380, 0x0a1014/0,14, 0,18, 0,15, 55, ash_embers | 200/0x66aaff, 140/0xff9944 | 0,16, 0,06, 0x64748b, ash_embers |

- **WorldManager** (singleton `worldManager`): `setBiome` devolve se houve transição interno/externo (a câmera dá flash claro ou escuro); `blendBiomes(A, B, t)` interpola raio, alpha, névoa, reverb e drone; `updateLighting` aproxima `currentLightRadius` do alvo.
- **LightingSystem:** só ativo em WebGL; `enable(biome, depth)` define a cor ambiente pela **profundidade** (azul 0x101b38 até vermelho 0x4a050d, saturando no andar 9), não pela do bioma; o campo `ambientColor` de `BIOME_LIGHTING` não é lido. Luz do jogador: raio base x (0,6 + 0,4 x HP%). Tochas: braseiro = raio x1,6 e cor 0xff6622; flicker por duas ondas senoidais em `update`. `GameScene.create` posiciona tochas por sala (4 flanqueando portas e cantos; `chamber` só 2 cantos; boss ganha braseiro).
- **AtmosphereSystem:** `tileSprite` de névoa (depth 750) e bruma (depth 1995) com deriva; emissor de clima segue a câmera (depth 1996); `visibilityGuard` reduz a névoa a 0,65 em combate intenso; desligado se `postProcessingEnabled === false`; `lowPerformanceParticles` reduz a taxa.
- `src/data/palettes.json` **não** são paletas de bioma: são 4 cores de sangue do jogador (crimson, corrupted, golden, shadow; compradas com cristais) lidas por `GameplayHUD.tsx` e `Player.ts`.

## Armadilhas e coletáveis

| Objeto | Comportamento (código) |
|---|---|
| `SpikeTrap` | ciclo `hidden` 2000 ms, `warn` 1000 ms, `active` 2000 ms (início com atraso aleatório até 2 s); overlap em `active` causa 10 de dano ao jogador (ignorado em dash/invulnerável) e aos inimigos |
| `ExplosiveBarrel` | corpo estático bloqueante; projétil do jogador ou inimigo o detona: raio 80, 100 de dano ao jogador e inimigos, shake de câmera |
| `Scavengeable` | tipos `skeleton` (1500 ms), `corpse` (3000), `crate` (1800), `player_corpse` (4000, tint vermelho); interação a menos de 48 px (tecla E) |

`ScavengingSystem.completeScavenging`: `player_corpse` devolve o equipamento (`retrieveCorpseLoot`). Os demais dão XP (corpse 25, skeleton 15, crate 10), cristais (10 + até 30 corpse / até 15 outros), loot com chance 25% (corpse) ou 10%, e 35% de 1 curativo (atadura, antídoto ou antibiótico). O progresso é acumulado em `GameScene.update` (`scavengeTimeElapsed`).

## Onde fica no código

| Arquivo | Símbolos |
|---|---|
| `src/game/systems/DungeonGenerator.ts` | `generate`, `bspSplit`, `carveRoomFromLeaf`, `calculateBitmask`, `DOOR_WIDTH`, `BIOME_TINTS`, `hasLineOfSight` |
| `src/game/systems/ProceduralForestGenerator.ts` | `generate`, `renderForestFloor`, `generateAndRenderTrees` |
| `src/game/systems/PathDrivenGenerator.ts` | `generate`, `isWaterTileAt`, `lastZones` (sem uso em produção) |
| `src/game/systems/HeightmapGenerator.ts` | `getHeightAt`, `getCliffEdges`, `isTraversable`, `samplePoissonDisk` |
| `src/game/systems/ChunkStreamer.ts` | `ChunkStreamer`, `ChunkSpec` |
| `src/game/systems/DungeonFlowController.ts` | `buildDungeonMap`, `advanceToNextFloor`, `updateChunkStream`, `revealDescentDoor/Portal`, `spawnInitialSiege` |
| `src/game/systems/WorldManager.ts` | `worldManager`, `BiomeEnvironmentConfig` |
| `src/game/systems/LightingSystem.ts`, `AtmosphereSystem.ts` | `BIOME_LIGHTING`, `biomeAtmosphereConfigs` |
| `src/game/objects/Traps.ts`, `Scavengeable.ts`; `src/game/systems/ScavengingSystem.ts` | `SpikeTrap`, `ExplosiveBarrel`, `Scavengeable`, `completeScavenging` |

Relacionados: [campaign](campaign.md); [world-systems](../architecture/world-systems.md), [risky-files](../engineering/risky-files.md); ADRs [0002](../decisions/0002-geracao-de-terreno-e-piso.md) e [0003](../decisions/0003-mundo-continuo-e-geradores-de-floresta.md).
