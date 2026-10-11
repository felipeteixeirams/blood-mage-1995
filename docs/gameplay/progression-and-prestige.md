# Progressão e Prestígio

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Leitura estática do código (sem rodar o jogo). Traz valores, limites e o que o código lê ou deixa de ler. Status de sobrevivência: ver `status-and-feedback`. Itens e relíquias estão em loot-and-items.

## XP e níveis
- `Player.addXp(amount)`: soma em `currentXp`, soma `floor(amount/2)` em `souls`; se `currentXp >= nextLevelXp`, sobe 1 nível, subtrai `nextLevelXp`, faz `nextLevelXp = floor(nextLevelXp * 1.4)` e soma 1 em `pendingStatPoints`. Retorna `true` se subiu. Sobe no máximo 1 nível por chamada (XP excedente fica acumulado).
- Início: nível 1, `nextLevelXp` 50 (`Player` e `defaultPlayerStats`). Após prestígio: nível 1, `nextLevelXp` 100.
- Fontes de XP: `enemy.config.xpDrop` ao morrer (x1.5 com `fury_pit`); baú de tesouro (30); recompensa de contrato (`xpBonus`); quest e diálogo de campanha (`give_xp`).
- Só a morte de inimigo e o contrato chamam `triggerLevelUp` quando `addXp` retorna `true`. Baú e `give_xp` ignoram o retorno: o nível sobe sem abrir o modal de upgrade.
- `pendingStatPoints` só é incrementado e zerado (prestígio); nenhum código o consome (dúvida: pontos sem uso).

## Upgrades de level-up (`src/data/upgrades.json`, 21 registros)
- `CombatEffectsSystem.triggerLevelUp` sorteia 3 opções distintas do pool e chama `callbacks.onLevelUp`, que abre `LevelUpModal` via `levelUpData` (estado da store). O jogo não pausa. A escolha chama `GameScene.applyUpgradeChoice`.
- Pool normal: os 21 registros. Nos níveis 5 e 10 o pool é filtrado para `isSpellEvolution`, `rarity: legendary` ou `category: spell` (7 registros).
- Os upgrades não são removidos do pool: a mesma opção pode ser escolhida de novo, e as evoluções `evo_*` aparecem sem exigir a magia correspondente.

| Categoria/raridade | Qtde | Exemplos (id: efeito) |
|---|---|---|
| stat common | 5 | `upgrade_damage_boost` dano +25%; `upgrade_cooldown_red` recarga -18%; `upgrade_vitality` HP +40; `upgrade_movespeed` velocidade +20%; `upgrade_mana_flow` mana +50 |
| spell rare | 2 | `upgrade_extra_proj` +1 projétil; `upgrade_sacrificial_pact` dano +35% |
| passive rare | 1 | `upgrade_vampirism` vampirismo +12% |
| passive legendary | 1 | `upgrade_legendary_archmage` dano +40%, velocidade +20%, +1 projétil, HP +50 |
| spell legendary (`isSpellEvolution`) | 4 | `evo_crimson_scythe_range` dano +30%; `evo_crimson_scythe_bleed` vampirismo +15%; `evo_hellfire_nova_shards` +2 projéteis; `evo_hellfire_nova_vamp` vampirismo +10% |

`applyUpgradeChoice` aplica só os campos de `effect` em `player.stats`, de forma global: `hpMaxAdd` e `manaMaxAdd` somam e enchem a barra; `moveSpeedPercent` e `damageMultiplierPercent` multiplicam; `cooldownReductionPercent` soma com teto 0.6 em `stats`; `vampirismPercent/100` soma; `projectileAdd` soma em `projectileBonus`. Textos que citam uma magia específica (alcance, sangramento, "artes sacrificiais") não têm efeito além desses campos.

Teto efetivo de recarga em `Player.getEffectiveCooldownReduction`: 0.75 (stats + relíquias + selos).

## Contratos (`src/data/contracts.json`, 5 registros; `ContractSystem`)
- No andar 1 (`DungeonFlowController`) `initRunContracts` zera os contadores e sorteia 3 dos 5 (embaralhamento por `sort` aleatório) para `activeContracts` da store. Não são persistidos. `ContractHUD` mostra a lista.
- Concluir (`triggerReward`): `completeContract`, `addBloodCrystals(bloodCrystals)` (passa pelo multiplicador de relíquias) e `player.addXp(xpBonus)`, com texto flutuante e `triggerLevelUp` se subir.

| id | Condição | Cristais | XP | Gatilho |
|---|---|---|---|---|
| no_scythe_floor3 | andar 3 sem lançar `crimson_scythe` | 50 | 15 | `onFloorCompleted` (andar 3, 0 casts no andar) |
| kill_10_hounds_nodamage | 10 `hell_hound` sem tomar dano | 80 | 25 | `onEnemyKilled`; `onPlayerDamaged` zera a sequência |
| floor_low_hp | completar andar com HP abaixo de 30% | 60 | 20 | `onFloorCompleted` (`hpRatio < threshold`) |
| open_3_chests | 3 baús no mesmo andar | 40 | 15 | `onChestOpened`; zera ao completar o andar |
| make_3_executions | 3 execuções | 70 | 30 | `onExecutionDone` (execução ou `total_destruction`) |

Detalhes: `make_3_executions` e a sequência de cães não zeram ao trocar de andar (a descrição do contrato diz "sob 15% HP", mas o contador não checa HP: conta toda execução ou destruição total). `onSpellCasted` só registra casts (o ramo de falha de `no_scythe_floor3` é vazio).

## Modificadores de run (`src/data/runModifiers.json`, 3 registros)
Ativos em `gameStore.activeModifiers` (ids), alterados por `toggleModifier`/`clearModifiers`. Nenhum componente chama `toggleModifier`: só os testes da store ativam modificadores (não há UI de seleção hoje).
| id | O que o código aplica | Campo do JSON sem leitura no código |
|---|---|---|
| blood_tide | inimigos de câmara x1.4 (`DungeonFlowController`); chance de drop 0.325 em vez de 0.25 | `effects.*` não é lido; valores estão fixos nos sistemas |
| rune_famine | custo de feitiços x2 em `Player.cast*` | `crystalMultiplier: 2` não tem leitura |
| fury_pit | inimigos nascem em `frenzy` (`Enemy`); XP x1.5 | `startFrenzy`/`xpMultiplier` não lidos |

## Prestígio e dificuldades (valores)
Conferido em `gameStore.ts`, `localStorage.ts` e `PrestigeModal.tsx`; valores são o que o código faz hoje, não balance ratificado (não validado: precisa de playtest humano):
- `PrestigeModal.tsx` (lazy em `App.tsx`) abre pela tecla P ou pelo botão em `hud/ActionButtons.tsx`, sobre `ModalBase`. `canPrestige`: nível >= 10, ou `floorDepth` >= 3, ou 30 abates. O reset da instância viva usa o comando `prestigeResetRequested`, tratado em `PhaserGame.tsx` por `GameScene.applyPrestigeReset()`.
- `getPrestigeModifiers()` por ponto de selo: `carnage` dano x(1 + 0.03n); `dark_vitality` HP máx +8n; `runic_flow` recarga +0.025n; `deep_vampirism` vampirismo +0.005n; `macabre_fortune` drop x(1 + 0.06n). Teto 5 por selo (`allocateBloodSeal` retorna `false` acima). Uso em `Player.getEffective*` e `CombatEffectsSystem` (`dropMult`).
- `performPrestige`: `level = min(10, level + 1)`; `unspentSealPoints + 1`; `totalSacrifices + 1`. O modal chama `performPrestige()` sem selo, então o ponto fica pendente para `allocateBloodSeal`. Zera só `playerStats` (nível 1, XP 0, `nextLevelXp` 100, HP/mana cheios, onda 1, andar 1, `pendingStatPoints` 0); equipamento, relíquias, talentos e Cristais não mudam.
- Persistência: `bloodmage_1995_prestige`, Zod com `.catch`: `level` 0-10, `unspentSealPoints` 0-10 (acima de 10 o campo cai para 0 ao carregar), selos 0-5.
- Dificuldades `normal`, `nightmare` (desbloqueia no prestígio 1), `inferno` (prestígio 3). `setDifficulty` só grava `selectedDifficulty` se estiver desbloqueada. Nenhum sistema de gameplay lê `selectedDifficulty`: os textos do modal ("+50% HP/Dano", "+25% Cristais", "+120%", "+75%") não têm implementação no código. O escalonamento de `Enemy` é por andar (+6% HP e +4% dano por andar além do 1).
- Divergência no texto: `PrestigeModal` descreve `macabre_fortune` como +10% por ponto; o código aplica +6% (0.06).

## Run stats, pontuação e recordes
- `RunStats` (13 métricas, `bloodmage_1995_run_stats`) é persistido e **acumulado entre runs**; `resetRunStats` existe mas ninguém o chama. `incrementRunStat`/`setRunStat` checam `achievements.json` (16 conquistas com `metric`/`target`) e desbloqueiam.
- Escritas hoje: `kills_total`, `kills_gargoyle`, `dismemberments_total`, `deaths_total`, `knockouts_total`, `hp_healed_magic`, `spells_unlocked_total`, `crystals_hoarded` (recebe o total de Cristais), `floor_depth_max` (recebe o andar atual ao descer). Sem escritor encontrado: `bloodless_floor`, `speedrun_f3`, `survival_time_run`; `mana_orbs_run` só sobe por orbes, que não são gerados.
- Pontuação: `stats.score += config.scoreValue` do monstro em cada abate. `GameStats` mostra `PONTOS`; `GameOverModal` mostra a pontuação final.
- High scores: ao fim da run `App.handleGameOver` chama `addHighScore({score, kills, wave, timeSurvived "mm:ss", levelReached})`. `saveHighScore` ordena por `score` e guarda o top 10 em `bloodmage_1995_highscores` (Zod estrito, `score` até 10.000.000). Sem dado salvo, valem 2 recordes padrão (`defaultHighScores`).
- Exibição: `HighScoresModal` (menu principal, `store.highScores`) e `hud/RecordsDisplay` ("Salão dos Recordes" do HUD: até 8, nomes `BRUXO #n`; lista `DEMO` só se vazia).

## Onde fica no código
- `src/game/objects/Player.ts`: `addXp`, `getEffective*`. `src/game/scenes/GameScene.ts`: `applyUpgradeChoice`, `applyPrestigeReset`.
- `src/game/systems/CombatEffectsSystem.ts`: `handleEnemyDeath`, `triggerLevelUp`. `ContractSystem.ts`, `DungeonFlowController.ts` (`initRunContracts`, `onFloorCompleted`).
- `src/store/gameStore.ts`: `activeContracts`, `activeModifiers`, `prestige`, `canPrestige`, `performPrestige`, `allocateBloodSeal`, `setDifficulty`, `getPrestigeModifiers`, `runStats`, `highScores`, `levelUpData`.
- `src/utils/localStorage.ts`: `loadPrestigeData`, `loadHighScores`, `saveHighScore`, `loadRunStats`.
- `src/components/LevelUpModal.tsx`, `PrestigeModal.tsx`, `hud/ContractHUD.tsx`, `hud/GameStats.tsx`, `hud/RecordsDisplay.tsx`, `HighScoresModal.tsx`, `GameOverModal.tsx`.
- Dados: `src/data/upgrades.json`, `contracts.json`, `runModifiers.json`, `achievements.json`.

Relacionados: [talents](talents.md), [loot-and-items](loot-and-items.md), [achievements](achievements.md); [state-management](../architecture/state-management.md), [modals-and-screens](../ui/modals-and-screens.md) (nível, prestígio e recordes).
