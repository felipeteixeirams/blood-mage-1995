# Sistemas do Jogo (src/game/systems)

**Mestre:** [architecture](README.md)
**Status:** não verificado
**Verificado em:** —

Inventário dos arquivos de `src/game/systems/` (41 módulos de produção, fora `*.test.ts`) e de quem os consome. O vínculo "quem importa quem" foi conferido por `grep` em 2026-10-10. A coluna "Papel" vem do comentário de cabeçalho/nome do arquivo; o comportamento interno de cada sistema não foi lido.

Falta conferir: comportamento real de cada sistema (os papéis abaixo são os declarados nos comentários), ordem de `create()` em `GameScene`, números como profundidades (`depth`) citados em cabeçalhos.

## Consumidos diretamente por `GameScene`

| Sistema | Papel declarado |
|---|---|
| `PlayerSkillSystem`, `CollisionHandlers`, `DungeonFlowController`, `ScavengingSystem`, `CombatEffectsSystem` | Extraídos de `GameScene` (ver [architecture.md](architecture.md)) |
| `ScreenEffects` | Vinhetas, darkness overlay, distorção (Canvas 2D) |
| `PostFXSystem` | Pós-processamento via filtros de câmera do Phaser 4; ligado/desligado por `settings.postProcessingEnabled` |
| `LightingSystem` | Light2D do Phaser 4; vira no-op em Canvas ou com `postProcessingEnabled` desligado, e o `darknessOverlay` de `GameScene` permanece como fallback |
| `LightingPolish` | Glow/flash de impacto e iluminação refinada, integrado ao `LightingSystem` |
| `AtmosphereSystem` | Névoa de solo, bruma e partículas de clima; usa `WorldManager` |
| `AdvancedParticles`, `BloodSplatterSystem`, `ScreenShake` | Partículas, decals de sangue com descarte FIFO, screen shake |
| `ShadowSystem`, `ReflectionSystem` | Sombras dinâmicas e reflexos sobre líquidos |
| `StatusEffectSystem`, `StatusConditionVeil` | Efeitos de status e véu visual de condições do jogador |
| `EnemyTelegraphSystem` | Indicadores no chão durante o windup de ataques de inimigos |
| `DismembermentSystem` | Cálculo do desfecho de desmembramento |
| `ContractSystem`, `LootSystem` | Contratos da run e drop de loot |
| `InputManager` (`init()` estático), `VirtualJoystickSystem` | Teclado/gamepad e joysticks virtuais |
| `ObjectPool`, `ViewportCuller`, `PerformanceMonitor` | Pool de projéteis, culling de inimigos fora da viewport, monitor de FPS |
| `CombatFeel` | Utilitários de feedback de combate (hit-stop etc.); também usado por `Player`, `Enemy`, `SkillsOverlay` |

## Consumidos por outros sistemas

| Sistema | Consumido por | Papel declarado |
|---|---|---|
| `DungeonGenerator` | `GameScene` | Geração de salas/piso; `calculateBitmask()` existe para autotiling |
| `ProceduralForestGenerator` | `DungeonGenerator` | Gera o bioma `gloomy_woods` |
| `PathDrivenGenerator` | `DungeonGenerator` (instanciado) | Topologia contínua por caminho; **não é chamado em `generate()`** (comentário no código: decisão pendente) |
| `HeightmapGenerator` | `DungeonGenerator`, `ProceduralForestGenerator`, `TerrainDetailFactory` | Elevação e projeção isométrica |
| `DungeonDetailFactory`, `SafeHouseDetailFactory`, `TerrainDetailFactory` | `DungeonGenerator` / `ProceduralForestGenerator` / `PathDrivenGenerator` | Props decorativos assados em textura |
| `SafeHouseAnimationController` | `DungeonFlowController` | Animações e partículas da Safe House |
| `ChunkStreamer`, `WorldManager` | `DungeonFlowController` (`WorldManager` também em `AtmosphereSystem`) | `ChunkStreamer` decide o próximo bioma da campanha; o gatilho continua sendo a colisão com o portal. `WorldManager` guarda a config de ambiente por bioma |
| `FloatingTextDispatcher` | `CombatEffectsSystem` | Evita sobreposição de textos flutuantes |
| `CodexSystem` | `gameStore`, `CodexModal` | Regras do codex e marcos de kills |

## Sem consumidor de produção

`AchievementSystem.ts` e `AchievementNotification.ts` não são importados por nenhum arquivo de produção (`AchievementSystem.test.ts` importa o primeiro; `AchievementNotification.ts` não tem teste). As conquistas rodam por `incrementRunStat`/`setRunStat` em `gameStore.ts` e o toast é o componente React `hud/AchievementToast.tsx` (ver [state-management.md](state-management.md)).
