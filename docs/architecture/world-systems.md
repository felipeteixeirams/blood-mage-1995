# Sistemas do Jogo: mundo, iluminação e pós-processamento

**Mestre:** [architecture](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Continuação de [game-systems.md](game-systems.md) (que traz a ordem de `create()`, combate, feedback e entrada). Cobre os módulos de `src/game/systems/` de geração de mundo, fluxo de piso, iluminação, atmosfera e pós-processamento. Verificação por leitura estática; nenhum teste ou build foi executado.

## Mundo e geração

| Módulo | Papel | Entradas/saídas | Dependências | Instanciado/chamado por |
|---|---|---|---|---|
| `DungeonFlowController` | Gera o piso (`buildDungeonMap`), spawn inicial e incremental de inimigos (teto 18, 24 no piso 4, 30 do piso 5), portal de descida, avanço de piso, streaming de zonas da campanha | `buildDungeonMap`, `updateChunkStream(playerX)`, `advanceToNextFloor`, `checkAndSpawnPendingEnemies`, `getNextCampaignZone` | `ChunkStreamer`, `WorldManager`, `SafeHouseAnimationController`, `ContractSystem`, `DungeonGenerator`, `PostFXSystem`, `AtmosphereSystem`, `LightingSystem`, `LightingPolish` | `GameScene.create` (item 4); `updateChunkStream` em `GameScene.update` |
| `DungeonGenerator` | Gera salas e corredores por BSP, paredes com bitmask, báus, safe house; delega `gloomy_woods` ao `ProceduralForestGenerator` | `generate(w, h, biome)` devolve `RoomData[]`; `isTraversable`, `hasLineOfSight`, `calculateBitmask`, `calculateWallBitmask` | `HeightmapGenerator`, `ProceduralForestGenerator`, `DungeonDetailFactory`, `SafeHouseDetailFactory`, `PathDrivenGenerator` | `GameScene.create` (item 2). `generate` ignora `_offsetX/_offsetY` |
| `ProceduralForestGenerator` | Floresta isométrica por ruído (árvores em camadas, grama, relevo) do bioma `gloomy_woods` | `generate(w, h)`, `drawFractalTreeGraphics` | `HeightmapGenerator`, `TerrainDetailFactory`, `AdvancedParticles` (poeira) | `DungeonGenerator.generate` |
| `PathDrivenGenerator` | Topologia contínua por caminho com cabana, lago e entrada de caverna | `generate`, `inject*`, `isWaterTileAt`, `lastZones` | `TerrainDetailFactory` | instanciado no construtor de `DungeonGenerator`; **`generate` nunca é chamado** (dormente) |
| `HeightmapGenerator` | Mapa de altura com seed (padrão 1995), arestas de penhasco, funções `isoToScreen`/`screenToIso`/`calculateIsometricDepth` | `generateHeightmap`, `getHeightAt`, `getCliffEdges`, `isPathTraversable` | nenhuma | `DungeonGenerator`, `ProceduralForestGenerator`, `TerrainDetailFactory` |
| `DungeonDetailFactory` | Assa texturas e espalha props decorativos por bioma nas salas | `bakeDetailTextures`, `scatterDetails(room, biome)` | `DungeonGenerator` (tipos) | `DungeonGenerator` (nova instância a cada `generate`) |
| `SafeHouseDetailFactory` | Idem, para a Safe House (tapete, estantes, velas, barris, estandarte) | `bakeDetailTextures`, `scatterDetails(room)` | `DungeonGenerator` (tipos) | `DungeonGenerator` |
| `TerrainDetailFactory` | Tufos de grama, arbustos, cogumelos, pedras e troncos assados em textura | `bakeAllFloraTextures`, `scatterTufts`, `scatterRichFlora` | `HeightmapGenerator` | `ProceduralForestGenerator`, `PathDrivenGenerator` |
| `SafeHouseAnimationController` | Animações da Safe House: patrulha e olhar da Maelen, chama da lareira, shimmer do portal | `initialize`, `destroy` | cena (`npcsGroup`, `wallsGroup`, `portalSprite`) | `DungeonFlowController` ao montar a Safe House |
| `ChunkStreamer<T>` | Janela deslizante de chunks ordenados por X; chama `onLoad`/`onUnload` | `update(playerX)`, `getChunkIndexAt`, `getLoadedIndices`, `getTotalWidth` | nenhuma (puro) | `DungeonFlowController` (`zoneStreamer`) |
| `WorldManager` | Singleton (`worldManager`) com a config de ambiente por bioma (raio de luz, escuridão, névoa, reverb, drone, clima) e interpolação entre dois biomas | `setBiome`, `blendBiomes`, `getCurrentConfig`, `getBiomeConfig` | nenhuma | `DungeonFlowController`, `AtmosphereSystem`. `updateLighting(delta)` sem chamada |

### Como `ChunkStreamer` dirige a campanha

`DungeonFlowController` mantém `CAMPAIGN_ZONE_CHUNKS` (cinco chunks de 1920 x 1440: `safe_house`, `gloomy_woods`, `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`) e um `ChunkStreamer` com `loadRadius: 1`. A cada frame em que o jogador está ativo, `updateChunkStream(player.x)`:

1. atualiza a janela de chunks; `onLoad` chama `DungeonGenerator.generate` para o bioma do chunk, soma as salas a `scene.rooms` e aplica o bioma a `WorldManager`, `PostFXSystem`, `AtmosphereSystem` e `LightingSystem`; `onUnload` destrói paredes, báus e saqueáveis cujo `x` cai no intervalo do chunk;
2. reajusta os limites do mundo e da câmera à janela carregada (`syncWorldBoundsWithStreamer`);
3. numa faixa de 400 px em volta da fronteira entre chunks, interpola ambiente, névoa, pós-processamento e áudio (`updateBoundaryTransitions`).

`getNextCampaignZone` usa a mesma lista para o próximo bioma. O comentário de cabeçalho de `ChunkStreamer.ts` ("prova de conceito isolada") está desatualizado em relação a este uso. `loadChunkBiome` chama `generate` sem deslocamento X, e `generate` ignora `_offsetX/_offsetY`; o efeito espacial disso em runtime não foi verificado.

## Iluminação e pós-processamento

| Módulo | Papel | Entradas/saídas | Dependências | Instanciado/chamado por |
|---|---|---|---|---|
| `LightingSystem` | Light2D do Phaser 4: cor ambiente por bioma e profundidade, luz do jogador por HP, tochas; no-op fora de WebGL ou com `postProcessingEnabled` desligado | `enable(biome, depth)`, `applyLightPipeline(obj)`, `createPlayerLight`, `updatePlayerLight`, `addTorchLights`, `update` | `scene.lights` | `GameScene.create` (item 3); `applyLightPipeline` chamado por geradores e objetos. Não existe `addLightSource` |
| `LightingPolish` | Filtro Glow por objeto (itens, monstros, spells, portal, altar, staff) e flashes de impacto, cura, morte e level up | `add*Glow`, `updateAltarProximity`, `cleanup` | `scene.lights`, filtros do Phaser 4 | `GameScene.create` (item 6) |
| `PostFXSystem` | Filtros de câmera (Vignette, ColorMatrix, Displacement) por bioma, tensão de HP/perigo, shockwave, medo, morte | `setBiome`, `blendBiomes`, `setDangerTension`, `triggerShockwave`, `triggerFearDistortion`, `effectDeath`, `setEnabled`, `reset`, `update` | `camera.filters` | `GameScene.create` (item 3); sem filtro fora de WebGL |
| `ScreenEffects` | Overlay Canvas 2D (vinheta, distorção, escuridão) | `update`, `effectDeath`, `setChromaticAberration`, `triggerFearDistortion`; `render(canvas)` | DOM canvas | `GameScene.create` (item 3); dormente, ver abaixo |
| `AtmosphereSystem` | Névoa de solo (depth 750), bruma (1995) e partículas de clima (1996) por bioma | `initialize`, `setBiome`, `blendBiomes`, `update`, `cleanup` | `WorldManager` | `GameScene.create` (item 5) |
| `ShadowSystem` | Sombra elíptica (depth 8) sob entidades registradas, deslocada por fontes de luz | `registerEntity`, `update(lightSources)`, `destroy` | textura `spr_shadow_disc` (com fallback) | `GameScene.create` (item 8); entidades registradas por `DungeonFlowController` |
| `ReflectionSystem` | Reflexo invertido (depth 12) de entidades sobre zonas líquidas | `registerEntity`, `addLiquidZone`, `update(time)`, `destroy` | zonas vindas de `BloodSplatterSystem` | `GameScene.create` (item 8) |

## Achados que afetam o leitor

| Item | Situação |
|---|---|
| `PostFXSystem` fora de WebGL | O cabeçalho diz que delega ao `ScreenEffects`; o código não faz isso (não há referência a `ScreenEffects` no arquivo). Sem WebGL, `PostFXSystem` não cria filtros. |
| `ScreenEffects` | `render(gameCanvas)` nunca é chamado e `getCanvas()` não tem consumidor. O estado é atualizado, mas nenhuma saída visual é composta. |
| `darknessOverlay` (`GameScene`) | Graphics depth 1990 preenchido uma vez na criação com 0x050510 / alpha 0.32; `updateThreatIndicator` (chamado em `GameScene.update`) chama `clear()` nele a cada frame, então o preenchimento não persiste. Não é fallback ativo, ao contrário do que o cabeçalho de `LightingSystem` afirma. |
| `PathDrivenGenerator` | `generate` sem chamada: `lastZones` fica vazio e `isWaterTileAt` (usado por `Player` e `Enemy`) sempre retorna falso. |
| Luz da lareira | `SafeHouseAnimationController` só cria a luz se `lightingSystem.addLightSource` existir; `LightingSystem` não tem esse método, então o ramo nunca roda. |
| `WorldManager.updateLighting` | Sem chamada: `currentLightRadius` não é interpolado ao longo do tempo. |

Decisões pendentes sobre manter ou remover o que está dormente ficam em `docs/decisions` (iluminação, vinheta e escuridão; conquistas) e não são tomadas aqui.
