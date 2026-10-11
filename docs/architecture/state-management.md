# Estado e Ponte Phaser-React (Zustand)

**Mestre:** [architecture](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `src/`, `src/data/achievements.json`, `src/game/PhaserGame.tsx`, `src/store/gameStore.ts`

Descreve `src/store/gameStore.ts` (1272 linhas) e como React e Phaser trocam informação hoje. Verificação por leitura estática de `gameStore.ts`, `PhaserGame.tsx`, `GameScene.ts`, `Player.ts` e `localStorage.ts`; nada foi executado.

## Store

`useGameStore` (Zustand 5, `create<GameStore>`) guarda, entre outros: `gameState` (`'menu' | 'playing' | 'paused'`), `playerStats`, `equipment`, `settings`, `highScores`, `bloodCrystals`, `talentLevels`, `codexState`, `unlockedRelics`, `prestige`, `gameMode` e `campaignState` (zona, quests, diálogo ativo, magias liberadas), flags de abertura de modais (`isInventoryOpen` etc.), `achievements`, `runStats`, `minimapRooms`, `currentTarget`, `activeScavengeable`, `closestNPCType`, `activeContracts`, `activeModifiers`, `onboarding`.

Não há middleware `persist`/`devtools`. Persistência é explícita: as ações do store chamam `save*()` de `src/utils/localStorage.ts` (e `load*()` na inicialização). Esse arquivo valida com Zod (`BloodCrystalsSchema`, `TalentLevelsSchema`, `PrestigeDataSchema` e outros; vários usam `.strict()`), com `.catch(...)` de fallback; `src/utils/SaveMigration.ts` também importa Zod.

## Ponte Phaser-React

Não há `window.dispatchEvent`/`CustomEvent` de gameplay em `src/` (busca em 2026-10-10: só `addEventListener` nativo de `gamepadconnected`/`gamepaddisconnected` em `App.tsx` e `InputManager.ts`). Os canais são:

### React para Phaser

Aplicados por `useEffect` em `src/game/PhaserGame.tsx`, que chama métodos de `GameScene`.

| Campo do store | Padrão | Efeito em `GameScene` |
|---|---|---|
| `activeSkillTrigger` | comando + reset (volta a `null`) | `triggerSkill()` |
| `activeCurativeTrigger` | comando + reset (`null`) | `useCurativeItem()` |
| `respawnRequested` | comando + reset (`false`) | `respawnPlayer()` (setado por `GameOverModal`) |
| `prestigeResetRequested` | comando + reset (`false`) | `applyPrestigeReset()` (setado dentro de `performPrestige()`) |
| `touchMoveInput`, `touchAimInput` | valor contínuo | `setTouchInputs()` |
| `dragAim` (`phase`: `start`/`move`/`end`) | valor contínuo | `handleDragAimStart/Move/End()` |
| `cosmeticTintVersion` | contador; só a mudança importa | `applyCosmeticTint()` |
| `gameState` | valor | `GameScene.isPaused = (gameState === 'paused')` |

### Phaser para React

| Origem | Destino |
|---|---|
| `Player.ts` chama `useGameStore.getState().setPlayerStats({ ...stats })` | `playerStats` |
| `GameScene.update()` chama `callbacks.onStatsUpdate(...)` a cada frame; em `PhaserGame` esse callback é `setPlayerStats` | `playerStats` |
| `callbacks.onLevelUp` e `callbacks.onGameOver`, chamados por `CombatEffectsSystem` (`onLevelUp` grava `levelUpData` via `setLevelUpData`; `onGameOver` é a prop vinda de `App`) | `levelUpData`, fim de jogo |
| `Player.ts` chama `notifyLootPickup(item)` | `lastLootPickup` (toast do `LootLog`; `id` incrementa a cada pickup) |
| `GameScene` chama `setMinimapRooms`, `setClosestNPCType`, `setActiveScavengeable`, `setActiveNPC`; `Enemy.ts` chama `setCurrentTarget` | HUD, minimapa, modais de NPC |
| `Enemy`, `CombatFeel`, `ContractSystem`, `CollisionHandlers`, `CombatEffectsSystem` etc. leem/escrevem o store via `useGameStore.getState()` | vários |

`GameSceneCallbacks` (`onStatsUpdate`, `onLevelUp`, `onGameOver`) é um segundo canal, fora do store: `PhaserGame` grava o objeto em `game.registry` (`'reactCallbacks'`) antes de qualquer cena rodar e `GameScene.init()` o lê de lá. Portanto "100% Zustand" vale para eventos de gameplay do React para o Phaser; do Phaser para o React, `onStatsUpdate`/`onLevelUp`/`onGameOver` passam por callbacks (que por sua vez chamam ações do store).

## Efeitos de campanha

`queueCampaignEffect()` enfileira `CampaignEffect` (`heal_player`, `give_xp`, `give_weapon`) em `pendingCampaignEffects`; `GameScene.update()` (linha ~1537) os drena com `drainCampaignEffects()`. A fila não é persistida.

## Conquistas e estatísticas de run

- `RunStats` (`src/types/game.ts`): `bloodless_floor`, `kills_total`, `kills_gargoyle`, `speedrun_f3`, `deaths_total`, `hp_healed_magic`, `dismemberments_total`, `mana_orbs_run`, `crystals_hoarded`, `survival_time_run`, `floor_depth_max`, `spells_unlocked_total`, `knockouts_total`.
- `incrementRunStat`/`setRunStat` atualizam o stat, salvam (`saveRunStats`) e comparam com cada entrada de `src/data/achievements.json` cuja `metric` é o stat alterado (`stat >= target`). Ao atingir, marcam `achievements[id].unlocked = true`, tocam som e publicam `lastUnlockedAchievement`.
- `redeemAchievement(id, reward)` (resgate explícito) marca `redeemed` e soma `reward` a `bloodCrystals`. O desbloqueio em si não credita cristais nem pontos de talento.
- O toast é o componente React `components/hud/AchievementToast.tsx`. Os módulos `systems/AchievementSystem.ts` e `systems/AchievementNotification.ts` não são usados em produção (ver [game-systems.md](game-systems.md)).

## Limites da verificação

- Dois comentários em `src/` (em `gameStore.ts` e `PhaserGame.tsx`) ainda apontam para um documento de migração que não existe mais; são comentários de código, não foram alterados.
- Não foi conferida cada ação do store; só as citadas acima.
