# Arquitetura do Sistema

**Mestre:** [architecture](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Mapa do que o código faz hoje. Verificação por leitura estática (imports, `grep`, contagem de linhas); nada foi executado.

## UI híbrida

| Camada | Tecnologia | O que faz hoje |
|---|---|---|
| Jogo | Phaser 4.2.1 (WebGL/Canvas via `Phaser.AUTO`, Arcade Physics sem gravidade) | Simulação em tempo real, colisões, geração de mapa, partículas, iluminação |
| UI | React 19 | HUD, modais (inventário, talentos, codex, conquistas, configurações, game over etc.), menu principal |
| Ponte | Zustand (`src/store/gameStore.ts`) | Único canal de estado entre as duas camadas (ver [state-management.md](state-management.md)) |

```
React (HUD, modais)  <-- Zustand (gameStore) -->  Phaser.Game (BootScene + GameScene)
```

## Instâncias de `Phaser.Game`

Há quatro pontos que criam `new Phaser.Game(...)`:

| Onde | Cenas | Observação |
|---|---|---|
| `src/game/PhaserGame.tsx` | `BootScene`, `GameScene` | Jogo principal. `pixelArt: true`, `Scale.RESIZE`, `audio.noAudio: true` (áudio vem do `soundEngine`, não do Phaser), `activePointers: 3` |
| `src/components/MainMenu.tsx` | `TitleScene` | Instância própria |
| `src/components/SettingsModal.tsx` | `SettingsScene` | Instância própria |
| `src/components/HighScoresModal.tsx` | `RecordsScene` | Instância própria |

`App.tsx` carrega `PhaserGame`, `GameplayHUD` e todos os modais com `React.lazy`, então Phaser e `GameScene` só entram no bundle depois do splash/menu. `vite.config.ts` separa `node_modules/phaser` no chunk `phaser` e o restante de `node_modules` no chunk `vendor`.

`BootScene` gera as texturas procedurais (`generateGameTextures`), enfileira o carregamento de assets (`queueAssetLoading`), registra animações (`registerAllAnimations`) e inicia `GameScene`.

## Entrada e ciclo de vida

- `src/main.tsx`: monta `<App/>` dentro de `Sentry.ErrorBoundary`; `Sentry.init` só roda se `VITE_SENTRY_DSN` estiver definido.
- `src/App.tsx`: estado de boot/menu, orientação, registro do service worker (`virtual:pwa-register`) e montagem condicional do jogo conforme `gameState` (`'menu' | 'playing' | 'paused'`).
- Pausa: `PhaserGame` copia `gameState === 'paused'` para `GameScene.isPaused`; o `Phaser.Game` não é destruído ao pausar.

## `GameScene` e sistemas extraídos

`src/game/scenes/GameScene.ts` tem 2021 linhas (`create()` começa na linha 228; `update()` vai da linha 1050 a cerca da 1678, mais os métodos privados `updateDragAimPreview()` e `updateThreatIndicator(time)` que ele chama no fim). O `update()` não foi movido para `systems/`.

Sistemas que recebem a cena (`constructor(private scene: GameScene)`), instanciados em `create()`:

| Sistema | Arquivo | Responsabilidade (cabeçalho do arquivo) |
|---|---|---|
| `PlayerSkillSystem` | `systems/PlayerSkillSystem.ts` | Execução das habilidades do jogador, drag-to-aim, blood bolt |
| `CollisionHandlers` | `systems/CollisionHandlers.ts` | Callbacks de colisão: projétil x parede/inimigo, baú, dano ao jogador, coleta de orbs/loot |
| `DungeonFlowController` | `systems/DungeonFlowController.ts` | Geração de piso/zona, fila de spawn, portal, avanço de andar, encadeamento de zonas da campanha |
| `ScavengingSystem` | `systems/ScavengingSystem.ts` | Scavenging de corpses/skeletons/`player_corpse` e uso rápido de curativos |
| `CombatEffectsSystem` | `systems/CombatEffectsSystem.ts` | Texto flutuante, slash, combo kill, morte de inimigo (gore/dismemberment/loot/XP), level-up, game over |

Os demais sistemas (renderização, iluminação, input, geração de mapa etc.) e o que cada um faz estão em [game-systems.md](game-systems.md). Padrões de implementação: [phaser-patterns.md](phaser-patterns.md).

## Dados e persistência

- `src/data/*.json`: achievements, campaignItems, campaignQuests, codex, contracts, dialogues, monsters, palettes, relics, runModifiers, spells, talents, upgrades, waves.
- `src/types/game.ts` e `src/types/campaign.ts`: tipos de domínio (`BiomeType` = `fosso_chagas | catacumbas_martires | santuario_sangue | safe_house | gloomy_woods`).
- Persistência: `localStorage`, por funções `load*`/`save*` de `src/utils/localStorage.ts` chamadas explicitamente pelo store (não há middleware `persist` do Zustand). Validação com Zod em `localStorage.ts` e `SaveMigration.ts`.
- Backend: não há. `api/log.ts` existe na raiz; `artifacts/` e `lib/` são do scaffolding do workspace (ver [../engineering/stack-and-conventions.md](../engineering/stack-and-conventions.md)).

## Idiomas, telemetria e observabilidade

- `src/i18n/`: `ptBR.ts` e `enUS.ts`.
- `src/utils/logger.ts`, `src/utils/telemetry.ts`; modal `ObservabilityModal.tsx`; Sentry opcional (ver acima).
- `GameScene` cria `PerformanceMonitor` quando a URL tem o parâmetro `?perf`.

## Status de sobrevivência e prestígio
Verificado em 2026-10-10 por leitura estática; valores são o que o código faz hoje, não balance ratificado. Não validado: precisa de playtest humano.
- **Status de sobrevivência.** `statusEffectOnHit` em `src/data/monsters.json` está em 8 monstros (sangramento, infecção, veneno). `CollisionHandlers.playerHitByEnemy` rola a chance e chama `setStatusCondition`, só se a condição não estiver ativa e o jogador não estiver inconsciente nem morto. `Player.updateStatusConditions` roda a cada frame: sangramento drena 2% do `maxHp` por segundo só enquanto o jogador se move; veneno 1,5% por segundo; infecção limita o `hp` a 80% do `maxHp` e bloqueia a regeneração passiva durante a inconsciência. `applyStatusDamage` é separado de `takeDamage` (sem frames de invulnerabilidade) e reaproveita o fluxo de desmaio e morte. A cura usa `useCurative` no `gameStore` (atalhos Z/X/V em `components/hud/PlayerStatus.tsx`); o Clérigo em `GameplayHUD.tsx` limpa as 3 condições por 15 Cristais.
- **Prestígio.** `PrestigeModal.tsx` (lazy em `App.tsx`) abre pela tecla P ou pelo botão em `hud/ActionButtons.tsx`, sobre `ModalBase`. `canPrestige`: nível >= 10, ou `floorDepth` >= 3, ou 30 abates. `performPrestige()` sobe o nível de prestígio (máx. 10) e dá 1 ponto de selo pendente em `unspentSealPoints`; `allocateBloodSeal` aloca (máx. 5 por selo) entre `carnage`, `dark_vitality`, `runic_flow`, `deep_vampirism` e `macabre_fortune`, que alimentam `getPrestigeModifiers()`. Dificuldades `nightmare` (prestígio 1) e `inferno` (prestígio 3). O reset da instância viva usa o comando `prestigeResetRequested`, tratado em `PhaserGame.tsx` por `GameScene.applyPrestigeReset()`.

## Limites da verificação

- Contagens de linhas foram feitas por `wc -l` em 2026-10-10 e mudam a cada commit.
- A lista de sistemas de `GameScene` reflete os `new ...(this)` e imports lidos; ordem de dependência em `create()` não foi auditada.
