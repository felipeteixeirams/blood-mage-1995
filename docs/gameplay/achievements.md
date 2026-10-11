# Conquistas

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/data/achievements.json`, `src/utils/localStorage.ts`, `src/`, `src/components/AchievementsModal.tsx`

Meta-progressão por conquistas, persistida em `localStorage` e paga em Cristais de Sangue (`bloodCrystals`): `src/data/achievements.json`. Leitura estática do código; nenhum teste rodado.

## Conquistas

`achievements.json` tem **16** registros, todos com os campos `id, title, description, category, metric, target, reward`. Uma conquista desbloqueia quando `runStats[metric] >= target`.

| id | categoria | metric | target | reward | Quem escreve a métrica |
|---|---|---|---|---|---|
| first_blood | combat | kills_total | 1 | 25 | `CombatEffectsSystem` (incrementa 1 por morte) |
| slayer_10 | combat | kills_total | 10 | 50 | idem |
| slayer_50 | combat | kills_total | 50 | 120 | idem |
| gargoyle_hunter | combat | kills_gargoyle | 15 | 100 | `CombatEffectsSystem`, só se `config.id` for `gargoyle` ou `stone_gargoyle` (ver Pontos a verificar) |
| butcher | combat | dismemberments_total | 50 | 150 | `CombatEffectsSystem` (morte com desmembramento diferente de `normal_collapse`) |
| depth_10 | progression | floor_depth_max | 10 | 200 | `DungeonFlowController` (`setRunStat` com `currentFloorDepth`) |
| depth_25 | progression | floor_depth_max | 25 | 500 | idem |
| inevitable_sacrifice | progression | deaths_total | 10 | 50 | `Player` (morte) |
| dark_wealth | progression | crystals_hoarded | 1000 | 250 | `addBloodCrystals` (`setRunStat` com o saldo total) |
| all_spells | magic | spells_unlocked_total | 7 | 300 | store, ao desbloquear magia na campanha (`unlockedSpellIds.length`) |
| blood_master | magic | hp_healed_magic | 500 | 120 | `Player` (`incrementRunStat` com HP curado) |
| five_knockouts | challenge | knockouts_total | 5 | 150 | `Player` (nocaute) |
| bloodless_victory | challenge | bloodless_floor | 1 | 150 | nenhum escritor encontrado |
| speedrun_floor3 | challenge | speedrun_f3 | 1 | 200 | nenhum escritor encontrado |
| abyss_walker | challenge | survival_time_run | 900 | 300 | nenhum escritor encontrado |
| rune_collector | collection | mana_orbs_run | 50 | 80 | `CollisionHandlers` (orbe de mana) |

Total de recompensas: 16 conquistas somam 2.745 cristais (soma dos `reward` da tabela).

### Estado e fluxo

- `runStats` (`RunStats`, 13 métricas numéricas) e `achievements` (`Record<id, {id, unlocked, redeemed}>`) vivem no `gameStore`, carregados de `loadRunStats()`/`loadAchievements()` (`src/utils/localStorage.ts`, chaves `bloodmage_1995_run_stats` e `bloodmage_1995_achievements`, validados por Zod).
- `incrementRunStat(metric, amount)` soma; `setRunStat(metric, value)` sobrescreve (não toma o máximo). Ambos salvam `runStats` e testam todas as conquistas da métrica; as novas viram `unlocked: true`, tocam `soundEngine.playContractComplete()` e preenchem `lastUnlockedAchievement` (só a última do lote vira notificação).
- `unlockAchievement(id)` desbloqueia direto (sem checar métrica). Nenhum chamador fora da store foi encontrado.
- **Desbloqueio e resgate são separados.** Desbloquear não paga nada. `redeemAchievement(id, reward)` só age se `unlocked && !redeemed`: marca `redeemed: true` e soma `reward` a `bloodCrystals` direto (sem multiplicador de relíquia, não passa por `addBloodCrystals`). O valor pago é o argumento recebido (o modal passa `achievement.reward`).
- `resetRunStats()` zera as 13 métricas e salva; só testes o chamam. Os `runStats` são acumulados entre runs (persistem), apesar dos sufixos `_run` nos nomes.

### AchievementsModal

Aberto por `isAchievementsOpen` (menu principal via `TitleScene` -> `onOpenAchievements`; montado em `App.tsx`). Usa `ModalBase`. Lista todas as 16 na ordem do JSON. Por linha:

| Estado | Visual |
|---|---|
| Bloqueada | barra de progresso `runStats[metric]/target` (limitada a 100%) e rótulo "Bloqueado" |
| Desbloqueada, não resgatada | borda vermelha pulsante e botão "Resgatar" (chama `redeemAchievement`, toca `playContractComplete`) |
| Resgatada | opaca, selo "Resgatado" |

Textos vêm de `t('achievements.title')` (-> "CONQUISTAS GÓTICAS") e `common.claim/claimed/locked`; as demais chaves `achievements.*` do i18n não são usadas pelo modal. Título e descrição das conquistas vêm do JSON (pt-BR, sem i18n).

`AchievementToast` (HUD) mostra por 4,5 s a `lastUnlockedAchievement` (título, descrição, recompensa).

### Pontos a verificar

- `monsters.json` não tem `gargoyle` nem `stone_gargoyle` (12 ids: scout_beast, skeleton_warrior, cultist_acolyte, hell_hound, flesh_golem, blood_specter, zombie_shambler, vampire_stalker, werewolf_lycan, bat_swarm, gore_abomination, necro_lord_boss): `gargoyle_hunter` não é alcançável com esses dados.
- `bloodless_floor`, `speedrun_f3` e `survival_time_run` não têm escritor em `src/`: 3 conquistas não desbloqueiam.
- `all_spells` exige 7, mas `spells.json` tem 8 magias além de `blood_bolt`; a contagem real é `campaignState.unlockedSpellIds.length` (conteúdo dessa lista não conferido).
- `AchievementSystem.ts` (`src/game/systems/`, com `AchievementNotification.ts`) é um sistema paralelo (outro formato, chave `bloodmage_1995_achievements_progress`) sem importadores fora de testes e de `localStorage.ts`.

## Onde fica no código

- `src/data/achievements.json`.
- `src/store/gameStore.ts`: `achievements`, `runStats`, `incrementRunStat`, `setRunStat`, `redeemAchievement`, `unlockAchievement`, `resetRunStats`, `lastUnlockedAchievement`.
- `src/components/AchievementsModal.tsx`, `hud/AchievementToast.tsx`.
- `src/utils/localStorage.ts` (`loadAchievements`, `loadRunStats`, `RunStatsSchema`); tipos em `src/types/game.ts` (`RunStats`, `AchievementState`).

Relacionados: Códice (codex.md, outra meta-progressão paga em cristais); [state-management](../architecture/state-management.md); [modals-and-screens](../ui/modals-and-screens.md).
