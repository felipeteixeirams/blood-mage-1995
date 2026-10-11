# Sistemas do Jogo (src/game/systems)

**Mestre:** [architecture](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Inventário dos 41 módulos de produção de `src/game/systems/` (fora `*.test.ts`), por leitura estática do código e de quem o instancia e chama (`grep` em `src/`). Esta página cobre combate, UI/feedback, entrada, dados/persistência e utilitários, mais a ordem de `create()`. Mundo, iluminação e pós-processamento: [world-systems.md](world-systems.md). Nenhum teste ou build foi executado; "sem chamada" significa nenhuma chamada em código de produção (testes não contam).

## Ordem em `GameScene.create()`

`ViewportCuller` nasce como inicializador de campo da classe (antes de `create()`). Dentro de `create()` (`src/game/scenes/GameScene.ts`):

| # | Instanciado | Observação |
|---|---|---|
| 1 | `ObjectPool` (projéteis do jogador e de inimigos) | `playerProjectilePool` é público; `PlayerSkillSystem` o usa |
| 2 | `DungeonGenerator` | recebe `wallsGroup` e `chestsGroup` |
| 3 | `ScreenEffects`, `PostFXSystem`, `LightingSystem` | criados antes do mapa; os dois últimos recebem `settings.postProcessingEnabled !== false` |
| 4 | `DungeonFlowController` e `buildDungeonMap()` | gera o primeiro piso e usa os sistemas acima |
| 5 | `AtmosphereSystem.initialize`, `EnemyTelegraphSystem.initialize`, `BloodSplatterSystem.initialize` | só depois do primeiro `buildDungeonMap()` |
| 6 | `AdvancedParticles`, `ScreenShake`, `LightingPolish` | idem |
| 7 | `PlayerSkillSystem`, `CollisionHandlers`, `ScavengingSystem`, `CombatEffectsSystem` | idem |
| 8 | `StatusEffectSystem`, `StatusConditionVeil`, `ShadowSystem`, `ReflectionSystem` | o jogador é registrado em sombra e reflexo |
| 9 | `InputManager.init()`, `PerformanceMonitor` (só com `?perf=` na URL) | |
| 10 | `VirtualJoystickSystem` x2 (movimento e mira), `init()` em cada | |

Consequência da ordem: o primeiro `buildDungeonMap()` roda quando `atmosphereSystem`, `lightingPolish`, `advancedParticles`, `shadowSystem` e `reflectionSystem` ainda não existem. O código do fluxo os acessa com guarda (`if (...)` ou `?.`), então o primeiro piso não recebe esses efeitos (por exemplo `addMonsterGlow`, `addAltarGlow`, `startForestAmbient`); trocas de piso posteriores recebem. Não verificado em runtime.

## Combate

| Módulo | Papel | Entradas/saídas | Dependências | Chamado por |
|---|---|---|---|---|
| `PlayerSkillSystem` | Executa habilidades do jogador (blood bolt, nova, syphon, bone shield, crimson scythe, ritual circle, hemomancy beam, blood tendrils, corpse burst), drag-aim e entrada de gamepad | `handleDragAim*`, `handleGamepadInput`, `execute*Effect`; cria projéteis do pool e dispara efeitos | `ObjectPool`, `InputManager`, `CombatFeel`, `ContractSystem`, `StatusEffectSystem` | `GameScene` |
| `CollisionHandlers` | Callbacks de overlap/collider: projétil x parede/inimigo, golpe corpo a corpo, báu, coleta de item/loot, armadilhas | `handle*(a, b)`; aplica dano, loot, shake, glow | `LootSystem`, `ContractSystem`, `CombatFeel`, `ScreenShake`, `PostFXSystem`, `AdvancedParticles`, `LightingPolish` | `GameScene` (wrappers dos `physics.add.*`) |
| `CombatEffectsSystem` | Morte de inimigo (gore, XP, loot, combo, conquistas via store), level up, game over, textos flutuantes, slash | `handleEnemyDeath`, `triggerLevelUpFX`, `triggerGameOver`, `spawnFloatingText`, `registerKillCombo` | `DismembermentSystem`, `LootSystem`, `ContractSystem`, `FloatingTextDispatcher`, `CombatFeel`, `PostFXSystem`, `ScreenEffects` | `GameScene` |
| `StatusEffectSystem` | DoT e estados elementais em alvos (burning, frozen, cursed, poison, bleeding) com emissores próprios | `applyStatus`, `hasStatus`, `removeStatus`, `update(time, delta)` | Phaser particles | `Enemy`, `PlayerSkillSystem`; `update` em `GameScene` |
| `EnemyTelegraphSystem` | Desenha no chão (depth 740) os telégrafos de windup/strike dos inimigos visíveis | `initialize()`, `update(time, enemiesGroup, camera)` | `gameStore` (`postProcessingEnabled`) | `GameScene` |
| `DismembermentSystem` | Métodos estáticos: calcula o desfecho de desmembramento (3 fatores) e executa gibs, sangue e feedback | `calculateDismemberment(params)`, `executeDismemberment(scene, enemy, result, spellId)` | `CombatFeel`, `BloodSplatterSystem` (via cena) | `Enemy`, `CombatEffectsSystem` |
| `LootSystem` | Métodos estáticos: rolagem de chance de drop e geração de item por profundidade | `rollLootChance(mult)`, `generateLoot(depth, isChest)` | dados de itens | `CollisionHandlers`, `CombatEffectsSystem`, `ScavengingSystem` |
| `ScavengingSystem` | Saque de cadáveres/esqueletos/corpo do jogador e uso rápido de curativos | `startScavenging`, `cancelScavenging`, `completeScavenging`, `useCurativeItem` | `LootSystem`, `LightingPolish` | `GameScene`, `PhaserGame.tsx` (curativos) |
| `ContractSystem` | Métodos estáticos: 3 contratos sorteados por run de `data/contracts.json` e progresso por evento | `initRunContracts`, `onSpellCasted`, `onEnemyKilled`, `onPlayerDamaged`, `onChestOpened`, `onExecutionDone`, `onFloorCompleted` | `gameStore` | `DungeonFlowController`, `PlayerSkillSystem`, `CollisionHandlers`, `CombatEffectsSystem` |

## UI e feedback

| Módulo | Papel | Entradas/saídas | Dependências | Chamado por |
|---|---|---|---|---|
| `CombatFeel` | Métodos estáticos: hit-stop (pausa a física), shake proporcional, vibração/haptic | `triggerHitStop`, `handleHitImpact`, `triggerVibration`, `triggerHapticFeedback` | `scene.physics`, configurações do store | `Enemy`, `Player`, `GameScene`, `CollisionHandlers`, `CombatEffectsSystem`, `PlayerSkillSystem`, `DismembermentSystem`, `SkillsOverlay.tsx` |
| `ScreenShake` | Tremor de câmera por perfil | `light()`, `medium()`, `heavy()`, `shake(profile)`, `update(delta)` | câmera principal | `CollisionHandlers`, `CombatEffectsSystem`, `PlayerSkillSystem`, `Player`, `Traps`; `update` em `GameScene`. `continuous()` e `isActive()` sem chamada |
| `AdvancedParticles` | Emissores de gore, sangue, rastro de dash e poeira da floresta | `emit`, `emitMonsterGore`, `emitDashTrail`, `startForestAmbient`, `stopAll` | Phaser particles | `CollisionHandlers`, `CombatEffectsSystem`, `Player`, `ProceduralForestGenerator`, `GameScene` (`stopAll`). `startAmbient`/`stopAmbient`/`emitDirectional`/`emitSpellTrail` não têm chamador externo (`emitSpellTrail` só é chamado por `emitDashTrail`) |
| `BloodSplatterSystem` | Decals de sangue no chão com teto FIFO (padrão 140), poças e pegadas | `addDecal`, `addDeathBlood`, `addCorpseDecal`, `addHitSplatter`, `addWallSplatter`, `addFootprintDecal`, `isNearWetBlood`, `update(time)` | registra zonas líquidas em `ReflectionSystem` | `GameScene`, `CollisionHandlers`, `DismembermentSystem` |
| `FloatingTextDispatcher` | Dispersa textos flutuantes para não se sobreporem (raio 45 px, janela de 1 s) | `calculateDispersion`, `registerText` | nenhuma | `CombatEffectsSystem` (instancia) |
| `StatusConditionVeil` | Overlay (depth 1500) para sangramento/veneno/infecção do jogador | `update(statusConditions, w, h)`, `destroy()` | `Phaser.Graphics` | `GameScene.update` |
| `AchievementNotification` | Toast Phaser de conquista | `show(config, duration)` | nenhuma | **sem chamada** (sem instância em produção) |

## Entrada, dados e utilitários

| Módulo | Papel | Entradas/saídas | Dependências | Chamado por |
|---|---|---|---|---|
| `InputManager` | Estado estático de teclado e Gamepad API | `init`, `getMovementInput`, `getAimInput`, `getGamepadState`, `wasButtonPressed`, `isGamepadConnected` | eventos do navegador | `GameScene.create` (`init`), `PlayerSkillSystem`, `TitleScene` |
| `VirtualJoystickSystem` | Joystick virtual touch (instâncias de movimento e de mira) | `init`, `update`, `getMovementVector`, `isActive`, `updateConfig`, `destroy` | `utils/joystickResponse` | `GameScene` |
| `ObjectPool` | Pool genérico de objetos reutilizáveis | `get(x, y, ...)`, `release`, `forEachActive` | nenhuma | `GameScene` (2 pools de `Projectile`). `releaseAll` sem chamada |
| `ViewportCuller` | Esconde inimigos fora da câmera (margem 150) | `update(camX, camY, w, h, objects)`, `isCulled` | nenhuma | `GameScene.update` |
| `PerformanceMonitor` | Overlay de FPS no DOM | `enable`, `update`, `getMetrics` | DOM | `GameScene`, só com `?perf=` na URL |
| `CodexSystem` | Estáticos: entradas do codex, marcos de kills, % de conclusão | `getEntries`, `isEntryUnlocked`, `recordKill`, `unlockEntry`, `claimMilestone`, `calculateCompletionPercentage` | `data` do codex | `gameStore`, `CodexModal.tsx` |
| `AchievementSystem` | Sistema de conquistas com `localStorage` e callback de unlock | `unlock`, `updateProgress`, `onUnlock` | `localStorage` | **sem chamada** em produção (só o teste). As conquistas rodam em `gameStore.ts` e o toast é `components/hud/AchievementToast.tsx` ([state-management.md](state-management.md)) |

## Código morto ou dormente

| Item | Situação | Evidência |
|---|---|---|
| `AchievementSystem`, `AchievementNotification` | Mortos: sem importador de produção | `grep` de imports |
| `ScreenEffects` | Dormente: `update` roda a cada frame e `effectDeath`/`setChromaticAberration`/`triggerFearDistortion` são chamados, mas `render(gameCanvas)` nunca é chamado e `getCanvas()` não tem consumidor; nada é desenhado | ver [world-systems.md](world-systems.md) |
| `ScreenShake.continuous`, `ObjectPool.releaseAll`, `ViewportCuller.getCulledCount`, `AdvancedParticles.startAmbient/emitDirectional` | Métodos públicos sem chamada | `grep` |

A decisão de manter ou remover esses módulos é do responsável (ver `docs/decisions`).
