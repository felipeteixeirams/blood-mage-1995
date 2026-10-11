# Conquistas e Códice inalcançáveis (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/data/achievements.json`, `src/data/codex.json`, `CombatEffectsSystem` e `gameStore`. Não validado em execução.

> O [ADR 0006](../../decisions/0006-audio-e-conquistas.md) (Proposta) trata do sistema paralelo `AchievementSystem.ts`; esta spec não o duplica.

## Contexto
Verificado com `grep` em `src/` (sem testes):

| Item | Evidência |
|---|---|
| `bloodless_floor`, `speedrun_f3`, `survival_time_run` | só aparecem em `types/game.ts`, `localStorage.ts` e `resetRunStats`; nenhum `incrementRunStat`/`setRunStat` os escreve. As conquistas `bloodless_victory`, `speedrun_floor3` e `abyss_walker` nunca desbloqueiam |
| `gargoyle_hunter` | `CombatEffectsSystem` (~linha 120) conta `kills_gargoyle` só para `gargoyle`/`stone_gargoyle`; `monsters.json` não tem esses ids |
| `all_spells` | exige 7 (`spells_unlocked_total`); `spells.json` tem 9 magias, 8 além de `blood_bolt`. A contagem vem de `campaignState.unlockedSpellIds.length`, só na Campanha (`unlockCampaignSpell`). `CAMPAIGN_SPELL_UNLOCK_LEVEL` cobre 6; as outras 2 dependem de quest/escolha |
| `unlockCodexEntry` | definido em `gameStore.ts` (~linha 697); sem chamador. `relic_olho_de_carmim`, `relic_anel_do_pacto_sanguineo`, `lore_ordem_dos_martires` e `lore_santuario_sangue` nunca desbloqueiam; `unlockCriteria` do JSON não é aplicado |
| `scout_beast` | existe em `monsters.json`, é o inimigo do spawn inicial, mas não tem entrada em `codex.json` |
| `redeemAchievement` | soma `rewardAmount` direto a `bloodCrystals` (sem `addBloodCrystals`, sem `bloodCrystalMultiplier`); `claimCodexMilestone` usa `addBloodCrystals` |
| Contadores | `mana_orbs_run` ("em uma única run") e `survival_time_run` acumulam entre runs; `resetRunStats` só é chamado por testes |

## Objetivo
Proposta: toda conquista e entrada do Códice tem um caminho real de desbloqueio, a descrição bate com a regra, e a recompensa segue a mesma regra de cristais.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | 3 conquistas sem escritor | A) implementar os escritores; B) remover do JSON; C) manter e marcar "em breve" | A para `speedrun_f3` e `survival_time_run` (dados simples); B para `bloodless_floor` se não houver rastreio de dano/poção por andar |
| 2 | `gargoyle_hunter` | trocar por monstro existente; criar gárgula; remover | Trocar por monstro existente: não cria conteúdo novo |
| 3 | `all_spells` | alvo 8; alvo 9 (com `blood_bolt`); derivar de `spells.json` | Derivar de `spells.json` e documentar que só vale na Campanha (ou contar também no Arcade) |
| 4 | Entradas do Códice sem chamador | ligar cada `unlockCriteria` a um evento; desbloquear por nível/andar | Ligar cada critério existente (ex.: andar 5, nível 5, 100 abates) |
| 5 | `scout_beast` no Códice | criar entrada; omitir de propósito | Criar entrada (texto e marcos são do responsável) |
| 6 | Multiplicador de relíquia no resgate | aplicar; não aplicar | Aplicar (mesma regra do Códice) |
| 7 | Contadores "por run/andar" | reset ao iniciar run/andar; renomear; manter acumulado | Reset por run, mantendo os acumulados de vida inteira |

## Escopo
- Aplicar as decisões 1 a 7 em dados e store.
- Testes unitários da store e de `CodexSystem` para cada caso.

## Fora de escopo
- Remover `AchievementSystem.ts` (ADR 0006); balance de recompensas; nova UI.

## Arquivos e contratos
- Alterar: `src/data/achievements.json`, `src/data/codex.json`, `src/store/gameStore.ts` (`redeemAchievement`, `resetRunStats`, chamadas de `unlockCodexEntry`, `unlockCampaignSpell`), `src/game/systems/CombatEffectsSystem.ts`, `src/game/systems/DungeonFlowController.ts` (andar/tempo), `src/game/systems/CodexSystem.ts` se preciso.
- Testes: `gameStore` e `CodexSystem` (arquivos de teste existentes).
- Docs no mesmo commit: `docs/gameplay/achievements.md`.
- Valores concretos (alvos, tempos): dependem das decisões.

## Critérios de aceite (provisórios)
- **CQ-1** Para cada conquista de `achievements.json`, o gameStore deve ter ao menos um escritor da métrica correspondente.
- **CQ-2** Quando o jogador chega ao andar 3 antes do tempo definido, o gameStore deve desbloquear `speedrun_floor3` (se mantida).
- **CQ-3** Quando o total de magias desbloqueadas atinge o alvo definido, o gameStore deve desbloquear `all_spells`.
- **CQ-4** Quando a condição de uma entrada do Códice é cumprida, o CodexSystem deve incluí-la em `unlockedEntries`.
- **CQ-5** Quando o jogador resgata uma conquista, o gameStore deve somar a recompensa pelo mesmo cálculo de `addBloodCrystals`.
- **CQ-6** Se o jogador resgata uma conquista já resgatada, então o gameStore não deve alterar `bloodCrystals`.
- **CQ-7** Quando uma nova run começa, o gameStore deve zerar as métricas definidas como "por run".

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CQ-1 | Teste que cruza métricas do JSON com `RunStats` e com `incrementRunStat`/`setRunStat` |
| CQ-2 a CQ-4 | Testes unitários da store simulando o evento |
| CQ-5, CQ-6 | Teste de `redeemAchievement` com relíquia de multiplicador equipada |
| CQ-7 | Teste de `resetRunStats` parcial |
| Todos | Manual: jogar uma run e abrir Conquistas e Códice (playtest humano, não validado) |

## Questões em aberto
- Quais 2 magias fora de `CAMPAIGN_SPELL_UNLOCK_LEVEL` desbloqueiam por quest e isso basta para o alvo?
- `crystals_hoarded` e `deaths_total` devem continuar acumulados de vida inteira?

## Referências
- `docs/gameplay/achievements.md`; [ADR 0006](../../decisions/0006-audio-e-conquistas.md)
