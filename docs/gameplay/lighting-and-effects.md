# Iluminação e efeitos visuais

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/App.tsx`, `src/game/scenes/GameScene.ts`, `src/game/systems/`, `src/game/systems/DungeonFlowController.ts`

O que cada sistema de luz, cor, névoa, sombra e feedback de tela faz hoje, quais flags o ligam e os valores por bioma. Leitura estática; o resultado visual não foi visto (não validado: precisa de playtest humano em mais de um bioma). Decisões sobre escuridão e vinheta: [0005](../decisions/0005-iluminacao-escuridao-e-vinheta.md). Mapa dos módulos e achados dormentes: [world-systems.md](../architecture/world-systems.md).

## Sistemas

| Sistema | O que faz | Sem WebGL |
|---|---|---|
| `LightingSystem` | Light2D (`scene.lights`): cor ambiente por andar, luz do jogador, tochas e braseiros com flicker | no-op (`enabled = isWebGL`) |
| `PostFXSystem` | Filtros de câmera: Vignette, ColorMatrix (gradação por bioma e tint) e Displacement | sem filtros (`isFilterActive` falso) |
| `LightingPolish` | Filtro Glow por objeto (itens, monstros, spells, portal, altar, cajado) e luzes de flash (crítico, morte, cura, level up) | sem filtros |
| `AtmosphereSystem` | `TileSprite` de névoa de solo (depth 750), bruma superior (depth 1995) e emissor de clima (depth 1996) | independe de WebGL |
| `ShadowSystem` | Elipse sob entidades (depth 8), deslocada e esticada pela luz mais próxima | independe |
| `ReflectionSystem` | Reflexo invertido (depth 12) de entidades sobre zonas líquidas | independe |
| `AdvancedParticles` | 9 emissores nomeados (sangue, poeira de osso, ácido, explosão espectral, crítico, névoa, brasas, pólen, rastro de spell) | independe |
| `ScreenShake` | Tremor por deslocamento da câmera | independe |
| `ScreenEffects` | Estado de vinheta, escuridão e distorção em canvas 2D | `render` nunca é chamado (ver world-systems) |

## Flags de configuração (`GameSettings`, padrão em `localStorage.ts`)

| Flag | Padrão | Efeito |
|---|---|---|
| `postProcessingEnabled` | true | Lida em `GameScene.create` (`postFX.setEnabled`, `lightingSystem.setEnabled`) e em `AtmosphereSystem.initialize`/`EnemyTelegraphSystem` (camadas desligadas), `LightingPolish` (sem Glow), `triggerShockwave`. Não há controle na UI encontrado (`GameplayHUD`, `SettingsScene`); só o valor salvo |
| `lowPerformanceParticles` | false | `AdvancedParticles.emit` usa 45% das partículas (mín. 3); clima do `AtmosphereSystem` reduz frequência (x1,4) e `quantity` 0; `LightingPolish` sem Glow |
| `crtFilter` | true | `PostFXSystem.apply` soma 0,12 à vinheta e 0,003 ao displacement; `App.tsx` desenha `.crt-overlay` (z 120) |
| `fearDistortionEnabled` | true | Libera `triggerFearDistortion` (`PostFXSystem`) |
| `screenShakeEnabled` | true | Bloqueia `CombatFeel.triggerScreenShake` e o `cameras.main.shake(150, 0.015)` ao jogador tomar dano. Não bloqueia `ScreenShake` (light/medium/heavy) |
| `flashesEnabled` | true | Bloqueia `cameras.main.flash(100, 150, 0, 0)` ao tomar dano (`CollisionHandlers`) |
| `atmosphereEffectsEnabled` | true | Liga o indicador de ameaça fora da tela, o cálculo de `alertCount` (que alimenta `setDangerTension`) e os efeitos de áudio de ameaça ([audio.md](audio.md)). Desligada, `alertCount` fica 0 |

Há quatro toggles de UI no `GameplayHUD` (`crtFilter`, `screenShakeEnabled`, `flashesEnabled`, `atmosphereEffectsEnabled`); o `SettingsScene` expõe `crtFilter`, `fearDistortionEnabled`, `tinnitusEnabled`, `leftHandedMode` e `floatingStick`.

## Luz por bioma (`LightingSystem.BIOME_LIGHTING`)

| Bioma | ambientColor (não aplicado) | Raio do jogador | Cor do jogador | Raio da tocha | Cor da tocha |
|---|---|---|---|---|---|
| fosso_chagas | 0x1a0a10 | 180 | 0xff5522 | 120 | 0xff9933 |
| catacumbas_martires | 0x0a0a1e | 140 | 0x8866ff | 100 | 0xaa88ff |
| santuario_sangue | 0x3a0a12 | 320 | 0xff4433 | 150 | 0xffaa33 |
| safe_house | 0x3d2314 | 220 | 0xff9944 | 180 | 0xffaa44 |
| gloomy_woods | 0x101a24 | 200 | 0x66aaff | 140 | 0xff9944 |

- `ambientColor` da tabela não é aplicado: `enable(biome, floorDepth)` calcula a cor ambiente por profundidade, de 0x101b38 (andar 1) a 0x4a050d (andar 9 ou mais), `depthProgress = (andar - 1) / 8` limitado a 1, e chama `lights.setAmbientColor`.
- `updatePlayerLight(hpRatio)`: raio = `playerLightRadius * (0,6 + 0,4 * hp)`.
- Tochas: braseiro usa raio x1,6, cor 0xff6622 e intensidade 1,0; tocha usa 0,9. `update` aplica flicker (intensidade limitada a 0,4 a 1,4; raio mínimo 30).
- `createPlayerLight` remove a luz anterior antes de recriar (evita luz órfã a cada andar). `applyLightPipeline` seta o pipeline `Light2D` no objeto.

## Gradação de cor por bioma (`PostFXSystem.biomeColor`)

| Bioma | saturação | matiz | brilho |
|---|---|---|---|
| fosso_chagas | -0,1 | -5 | -0,02 |
| catacumbas_martires | -0,3 | 190 | -0,05 |
| santuario_sangue | 0,1 | -15 | 0,03 |
| safe_house | 0,15 | 15 | 0,02 |
| gloomy_woods | 0 | 0 | -0,08 |

Por profundidade: matiz `-30 * depthProgress`, saturação `+0,2 * depthProgress` (mesma escala 0 a 8 do `LightingSystem`). `blendBiomes(A, B, t)` interpola os três valores nas fronteiras de chunk.

## Vinheta e tensão (`PostFXSystem`)

| Situação | Vinheta | Pulso | Tint |
|---|---|---|---|
| `gloomy_woods` (`setBiome`) | 0,40 fixa | não | não |
| Perigo alto (chefe ativo, mais de 10 em alerta, ou HP <= 25%) | 0,45 a 0,85 | 800 ms (1200 ms se HP baixo) | 0xef4444 |
| Perigo médio (4 a 10 em alerta) | 0,35 a 0,65 | 2000 ms | remove o vermelho |
| Calmo | 0 (ease 400 ms) | não | limpa |
| Morte (`effectDeath`) | 0,9 | não | 0x8b0000, displacement 0,15 |

`setDangerTension` roda todo frame em `updateThreatIndicator`. Efeitos pontuais: `triggerShockwave` (displacement), `triggerBossImpactFX` (vinheta 0,7), `triggerLevelUpFX` (tint amarelo), `triggerFearDistortion` (tint 0x581c87), `effectCriticalDamage`, `effectInfection`. Uma contagem de sequência (`nextSeq`) invalida restaurações pendentes de efeito anterior. Dano alto também aciona `setChromaticAberration` (0,15 acima de 100 de dano, 0,08 acima de 50).

## Névoa e clima (`AtmosphereSystem.biomeAtmosphereConfigs`)

| Bioma | Névoa de solo | Bruma | Tint | Clima |
|---|---|---|---|---|
| fosso_chagas | 0,12 | 0,04 | 0x948075 | spores |
| catacumbas_martires | 0,15 | 0,05 | 0x94a3b8 | ash_embers |
| santuario_sangue | 0,09 | 0,03 | 0x991b1b | blood_rain |
| safe_house | 0,04 | 0,02 | 0xd97706 | nenhum |
| gloomy_woods | 0,16 | 0,06 | 0x64748b | ash_embers |

Em combate pesado (chefe ou mais de 6 inimigos ativos) o alpha cai por `visibilityGuard` até 0,65 (suavização 0,04 por frame). A névoa desliza por `driftSpeedX/Y`.

## Outros efeitos

| Sistema | Valores |
|---|---|
| `ShadowSystem` | alpha 0,35 no registro; com luz: deslocamento até 16 px, esticamento até x1,35, alpha entre 0,18 e 0,50; sem luz: 0,28. Fontes de luz passadas por `GameScene.update`: jogador (raio 220) e tochas (`lightSprites`, raio 140, intensidade 0,8) |
| `ReflectionSystem` | alpha 0,28 a 0,35, ondulação por seno; zonas líquidas vêm de `addLiquidZone` |
| `ScreenShake` | light 3 px/100 ms, medium 6/150, heavy 10/200, `continuous(5, 500)`; decai linearmente; usada em dano ao jogador, vitória e morte |
| `LightingPolish` | no máximo 16 alvos de Glow simultâneos (`MAX_ACTIVE_BLOOM_TARGETS`); Glow de item por raridade: common 0x94a3b8/0,35, rare 0x3b82f6/0,65, epic 0xa855f7/0,85, legendary 0xf59e0b/1,1; portal 0x06b6d4/0,95 |
| `AdvancedParticles` | `startForestAmbient` só é chamado pelo `ProceduralForestGenerator` (floresta); `startAmbient` (névoa/brasas) não tem chamada; `emitDashTrail` é chamado por `Player` |

## Achados suspeitos (descritos, não corrigidos)

| Item | O que o código faz |
|---|---|
| `darknessOverlay`, `ScreenEffects.render`, `addLightSource` | Ver [world-systems](../architecture/world-systems.md) e [0005](../decisions/0005-iluminacao-escuridao-e-vinheta.md) |
| `ambientColor` e `WorldManager` | `BIOME_LIGHTING.ambientColor` não é usado; `darknessColor`, `darknessAlpha`, `lightRadius`, `fogAlpha` e `ambientDroneFreq` de `WorldManager` não têm consumidor fora de `WorldManager`; só `isIndoor` e `reverbLevel` são lidos (e o áudio ignora `reverbLevel`, ver [audio.md](audio.md)) |
| `postProcessingEnabled` | Sem controle visível na UI; mudar o valor em runtime não reaplica `AtmosphereSystem` (lido só em `initialize`) |
| Dois tremores | `ScreenShake` (offset da câmera) e `cameras.main.shake` (Phaser) coexistem; só o segundo respeita `screenShakeEnabled` |

## Onde fica no código
- `src/game/systems/`: `LightingSystem.ts`, `LightingPolish.ts`, `PostFXSystem.ts`, `AtmosphereSystem.ts`, `ShadowSystem.ts`, `ReflectionSystem.ts`, `AdvancedParticles.ts`, `ScreenShake.ts`, `ScreenEffects.ts`, `WorldManager.ts`, `CombatFeel.ts`, `CollisionHandlers.ts`
- `src/game/scenes/GameScene.ts` (criação dos sistemas, `update`, `updateThreatIndicator`), `src/game/systems/DungeonFlowController.ts` (`lightingSystem.enable`, `createPlayerLight`, `addTorchLights`, `registerEntityEffects`)
- `src/utils/localStorage.ts` e `src/types/game.ts` (`GameSettings`); `src/App.tsx` (`.crt-overlay`)

Relacionados: [audio.md](audio.md), [status-and-feedback.md](status-and-feedback.md), [combat.md](combat.md), [world-generation.md](world-generation.md), [../decisions/0005-iluminacao-escuridao-e-vinheta.md](../decisions/0005-iluminacao-escuridao-e-vinheta.md), [../decisions/0006-audio-e-conquistas.md](../decisions/0006-audio-e-conquistas.md), [../architecture/world-systems.md](../architecture/world-systems.md).
