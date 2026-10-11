# Campanha e Safe House

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

## Safe House

Montada em `DungeonFlowController.buildDungeonMap` quando `biome === 'safe_house'`; sala única 800x600 no centro do mapa 1920x1440 (`DungeonGenerator.generate`), sem inimigos (`totalFloorMonsters = 0`).

| Elemento | Detalhe |
|---|---|
| Lareira, cama | sprites `spr_hearth_fireplace`, `spr_straw_bed` em `wallsGroup` |
| Baú de suprimentos | `chestsGroup`, `setData('questChest','starter_dagger')`; abrir dá a Adaga de Aço fixa e avança `collect_item`/`starter_dagger` (`CollisionHandlers.ts`) |
| Maelen | sprite `spr_npc_maelen`, `npcType = 'maelen'`, marcador âmbar; interação a 50 px (tecla E ou botão "FALAR COM NPC") |
| Porta de saída | `revealDescentDoor` ativa o portal (`isPortalActive`) ao fundo da sala; encostar a menos de 35 px chama `advanceToNextFloor` |
| Animações e props | `SafeHouseAnimationController` (destruído ao trocar de andar); `SafeHouseDetailFactory.scatterDetails` |

Interação com Maelen: `getMaelenDialogueTreeId(quests)` (`types/campaign.ts`) escolhe a árvore pela quest concluída mais avançada.

| Quest concluída | Árvore aberta |
|---|---|
| nenhuma | `safe_house_maelen_intro` |
| quest_ch1_first_steps | `safe_house_maelen_ch2_return` |
| quest_ch2_the_pit | `safe_house_maelen_ch3_return` |
| quest_ch3_the_martyrs_rest | `safe_house_maelen_ch4_return` |

Concluir a ch4 não troca a árvore (continua `..._ch4_return`). Os outros 4 NPCs (`NPCData.role`) não têm árvore de diálogo em `dialogues.json`; `NPCData` em `types/campaign.ts` não é usado por nenhum outro arquivo de `src`.

## Quests (`src/data/campaignQuests.json`, 4 quests)

Recompensa ao completar (todos os objetivos no alvo): cristais direto na store; `spellUnlockId` direto; XP e item entram na fila `CampaignEffect`.

| Quest | Objetivos (tipo: alvo xN) | XP | Cristais | Magia |
|---|---|---|---|---|
| ch1 `quest_ch1_first_steps` | collect_item: starter_dagger x1; kill_enemy: scout_beast x4; discover_zone: altar_crimson x1 | 150 | 25 | blood_bolt |
| ch2 `quest_ch2_the_pit` (pré: ch1) | kill zombie_shambler x10, bat_swarm x8, hell_hound x5; discover_zone: fosso_chagas x1 | 350 | 60 | corpse_burst |
| ch3 `quest_ch3_the_martyrs_rest` (pré: ch2) | discover_zone: catacumbas_martires x1; kill skeleton_warrior x10, cultist_acolyte x6, blood_specter x4 | 500 | 80 | bone_shield |
| ch4 `quest_ch4_blood_sanctuary` (pré: ch3) | discover_zone: santuario_sangue x1; kill vampire_stalker x8, gore_abomination x8, werewolf_lycan x8, necro_lord_boss x1 | 1200 | 200 | crimson_scythe |

Regras (`gameStore.ts`):
- Ativar: ação de diálogo `give_quest` chama `advanceQuestObjective(questId, 'start')`; cria o log `active` se não existir. `prerequisiteQuestId` e `requiredLevel` não são checados em código (só a árvore de diálogo liberada controla a ordem).
- `advanceQuestObjectiveByTarget(tipo, alvo)` varre quests `active` e avança o objetivo de mesmo tipo e alvo. Progresso limita em `targetCount`.
- Gatilhos que existem: `kill_enemy` em `onEnemyKilled`; `collect_item` no baú da Safe House; `discover_zone` só em `GameScene.update` para marcos de `campaignDiscoverables`.
- Tipo `talk_npc` existe no tipo, mas nenhuma quest o usa e nenhum código o avança.
- HUD: `QuestTracker.tsx` lista quests `active`, recolhido por padrão.

## Diálogos (`src/data/dialogues.json`, 4 árvores)

Estrutura `DialogueTree` (`npcId`, `initialNodeId`, `nodes`) com `choices` (`id`, `text`, `nextNodeId`, `action`, `actionPayload`). Todas pertencem a `npc_maelen`.

| Árvore | Nós | Termina em |
|---|---|---|
| safe_house_maelen_intro | 6 | `give_quest` quest_ch1_first_steps |
| safe_house_maelen_ch2_return | 6 | `give_quest` quest_ch2_the_pit (3 escolhas) |
| safe_house_maelen_ch3_return | 4 | `give_quest` quest_ch3_the_martyrs_rest, ou `close_dialogue` |
| safe_house_maelen_ch4_return | 3 | `give_quest` quest_ch4_blood_sanctuary |

`selectDialogueChoice`: com `nextNodeId` avança o nó, sem ele fecha o diálogo; depois executa a ação: `give_quest`, `give_spell` (`unlockCampaignSpell`), `open_shop` (`setActiveNPC`), `heal_player` e `give_weapon` (fila `CampaignEffect`). `close_dialogue` não tem ramo próprio (fecha por não ter `nextNodeId`). Só `give_quest` e `close_dialogue` aparecem nos dados. `requiredQuestState` está no tipo mas nenhum código o lê. `DialogueModal.tsx` renderiza o nó ativo.

## Itens de campanha

`src/data/campaignItems.json`: 1 item, `starter_dagger` (arma, common, `damageMultiplier` 0.05, `critChanceBonus` 0.02). `give_weapon`/`itemRewardId` o resolvem por esse JSON em `GameScene.update`; o baú da Safe House usa um objeto equivalente escrito direto em `CollisionHandlers.ts` (duplicado, não lê o JSON). Nenhuma quest define `itemRewardId`.

## Marcos descobríveis

`scene.campaignDiscoverables` (reiniciado a cada `buildDungeonMap`). Único marco existente: Altar Ancestral (`spr_altar_crimson`, `campaignDiscoverableId = 'altar_crimson'`), criado só em `gloomy_woods`, na sala `secret_treasure` ou, se não houver, na última sala (na floresta é a única sala, de spawn). Em `GameScene.update`: a menos de 70 px marca `discovered`, avança `discover_zone` com o id, mostra "ALTAR DESCOBERTO" e desbloqueia `blood_bolt` (`SPELL_UNLOCK_BY_DISCOVERABLE`). Raio de realce visual: 260 px (`lightingPolish.updateAltarProximity`). Não existe marco para `fosso_chagas`, `catacumbas_martires` nem `santuario_sangue`.

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
| `src/store/gameStore.ts` | `gameMode`, `campaignState`, `startDialogue`, `selectDialogueChoice`, `advanceQuestObjective(ByTarget)`, `setCampaignZone`, `unlockCampaignSpell`, `checkLevelSpellUnlocks`, `resetCampaignProgress`, `drainCampaignEffects` |
| `src/game/systems/DungeonFlowController.ts` | `buildDungeonMap` (ramo `safe_house`, altar), `getNextCampaignZone`, `advanceToNextFloor` |
| `src/game/scenes/GameScene.ts` | `update` (marcos, nível, efeitos de campanha, interação com Maelen) |
| `src/game/systems/CollisionHandlers.ts` | baú `questChest` |
| `src/utils/localStorage.ts` | `loadCampaignState`, `saveCampaignState` |
| `src/data/` | `campaignQuests.json`, `dialogues.json`, `campaignItems.json` |
| `src/components/` | `hud/DialogueModal.tsx`, `hud/QuestTracker.tsx`, `GameplayHUD.tsx`; `App.tsx` (`executeStartCampaign`) |
