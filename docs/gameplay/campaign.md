# Campanha

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Leitura estática do código (nada foi executado). A geração dos mapas está em world-generation (texto, sem link).

## Modo Campanha x Arcade

| Aspecto | Campanha | Arcade |
|---|---|---|
| Fonte do modo | `useGameStore.gameMode` (`'arcade' \| 'campaign'`); `CampaignState` não tem o campo | idem |
| Início | `App.tsx` `executeStartCampaign`: `resetCampaignProgress()`, `setGameMode('campaign')`, `setCampaignZone('safe_house')`. Se já há progresso (zona != safe_house, quests ou magias), pede confirmação antes | `handleStartArcade`: só `setGameMode('arcade')` |
| Continuar | `handleContinueGame` não altera o modo; o modo vem do save carregado | idem |
| Bioma do andar | `campaignState.currentZone` (andar 1 = `safe_house`) | por profundidade: >=5 `santuario_sangue`, >=3 `catacumbas_martires`, senão `fosso_chagas` |
| Avanço de andar | `advanceToNextFloor` chama `setCampaignZone(getNextCampaignZone(zona))` | só `currentFloorDepth++` |
| Magias | só as de `unlockedSpellIds` (`isCampaignSpellUnlocked`) | todas liberadas (retorna `true` fora da Campanha) |
| NPCs no spawn | Maelen na Safe House (nenhum nos outros andares) | 4 NPCs de vila no spawn de todo andar: `cleric`, `alchemist`, `blacksmith`, `elder` (lojas via `setActiveNPC`) |
| Ataque inicial | sem `blood_bolt` desbloqueado: corpo a corpo com adaga, só se `equipment.weapon !== null` (`Player.ts`) | blood bolt |

Efeitos de progresso (quests, magias, `kill_enemy`) dependem do estado salvo, não do modo: `onEnemyKilled` avança objetivos de quests ativas em qualquer modo.

## Zonas e capítulos

`ZoneType` é alias de `BiomeType`; não há conceito separado de zona. Ordem linear em `CAMPAIGN_ZONE_CHUNKS` (`DungeonFlowController.ts`); `getNextCampaignZone` satura no último.

| Andar (campanha) | Zona/bioma | Quest do capítulo (`campaignQuests.json`) |
|---|---|---|
| 1 | `safe_house` | quest_ch1_first_steps (cap. 1) |
| 2 | `gloomy_woods` | idem (orla da floresta: 4 batedores + altar) |
| 3 | `fosso_chagas` | quest_ch2_the_pit (cap. 2) |
| 4 | `catacumbas_martires` | quest_ch3_the_martyrs_rest (cap. 3) |
| 5+ | `santuario_sangue` | quest_ch4_blood_sanctuary (cap. 4) |

O campo `chapter` existe no estado e no save (inicia em 1), mas nenhum código o altera depois de `resetCampaignProgress`. O capítulo "atual" na prática é decidido por `getMaelenDialogueTreeId`.

## Desbloqueio de magias (Campanha)

`unlockedSpellIds` começa vazio. Fontes: `blood_bolt` (altar ou recompensa da ch1), recompensas de quest (`corpse_burst`, `bone_shield`, `crimson_scythe`), ação `give_spell`, e nível via `checkLevelSpellUnlocks` (checado em `GameScene.update` quando o nível sobe) com `CAMPAIGN_SPELL_UNLOCK_LEVEL`.

Níveis: hellfire_nova 3, bone_shield 5, crimson_scythe 7, syphon_soul 9, hemomancy_beam 11, blood_ritual_circle 13.

`blood_tendrils` (existe em `spells.json`) não tem gatilho de desbloqueio na Campanha. Magia bloqueada ao usar mostra "FEITIÇO NÃO DESCOBERTO" (`PlayerSkillSystem.triggerSkill`); `SkillsOverlay.tsx` marca como trancada.

## Estado salvo

Chave `localStorage` `bloodmage_1995_campaign_state`, via `loadCampaignState`/`saveCampaignState` (`src/utils/localStorage.ts`, schema Zod `.strict()` com `.catch` de padrão).

| Campo | Padrão |
|---|---|
| `gameMode` | `'arcade'` |
| `currentZone` | `'safe_house'` |
| `chapter` | 1 |
| `storyFlags` | `{}` (nenhum código lê ou escreve) |
| `quests` | `{}` (`questId`, `status`, `currentObjectiveIndex`, `objectivesProgress`) |
| `discoveredZones` | `['safe_house']` |
| `unlockedSpellIds` | `[]` |

Não persistidos: diálogo aberto (`activeDialogueTree`, `activeDialogueNodeId`) e a fila `pendingCampaignEffects` (reload perde efeitos pendentes). `persistCampaignSnapshot` roda após `setGameMode`, `advanceQuestObjective`, `setCampaignZone`, `unlockCampaignSpell` e `resetCampaignProgress`. O andar (`currentFloorDepth`) não é salvo.

## Onde fica no código

| Arquivo | Símbolos |
|---|---|
| `src/types/campaign.ts` | tipos de campanha, `getMaelenDialogueTreeId`, `CampaignEffect` |
| `src/store/gameStore.ts` | `gameMode`, `campaignState`, `setCampaignZone`, `unlockCampaignSpell`, `checkLevelSpellUnlocks`, `resetCampaignProgress`, `drainCampaignEffects` |
| `src/game/systems/DungeonFlowController.ts` | `getNextCampaignZone`, `advanceToNextFloor`, `CAMPAIGN_ZONE_CHUNKS` |
| `src/game/scenes/GameScene.ts` | `update` (nível, efeitos de campanha) |
| `src/utils/localStorage.ts` | `loadCampaignState`, `saveCampaignState` |
| `src/components/` | `App.tsx` (`executeStartCampaign`, `handleStartArcade`, `handleContinueGame`) |

Relacionados: safe-house-and-quests (Safe House, Maelen, quests, diálogos); [risky-files](../engineering/risky-files.md), [state-management](../architecture/state-management.md), [decisions](../decisions/README.md).
