# Custo de skill duplicado e inconsistências de progressão (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `GameplayHUD.handleSkillAction` (`src/components/GameplayHUD.tsx`) e `Player.cast*` (`src/game/objects/Player.ts`). Não validado em execução.

## Contexto
**Custo duplicado.** `handleSkillAction` (l.165) calcula custo fixo no HUD (nova 15 HP; bone_shield 20 mana; syphon 15 mana; crimson_scythe 10 HP), subtrai e faz `setPlayerStats` na store, e só então `onSkillClick`. O caminho continua em `PlayerSkillSystem.triggerSkill` → `Player.cast*`, que cobra `bloodCost` de `spells.json` (12, 20, 24, 11...) em HP, com desconto de relíquia e dobro em rune_famine. Dois sistemas de custo, valores diferentes entre si; o do HUD cobra até se a conjuração falha (cooldown, magia bloqueada) e ignora relíquias e rune_famine. `Player.stats` é a fonte da verdade: o desconto do HUD afeta a store e pode ser sobrescrito pelo próximo `setPlayerStats({...this.stats})` (efeito exato: não validado em execução). `SkillsOverlay.checkCanCast` ainda exige mana, que `Player.cast*` não gasta.

**Progressão.**
- `blood_tendrils`: usável pelo HUD, mas ausente de `CAMPAIGN_SPELL_UNLOCK_LEVEL` (`gameStore.ts`, só 6 magias) e de `campaignQuests.json`; na campanha nunca é desbloqueada (`corpse_burst` vem de quest).
- `sacrificeDiscount`: `Player.ts` l.~112 soma o bônus de `escudo_ossos_aprimorado` em `stats`; nenhum código o consome.
- Descrições de `talents.json`: `tempestade_continua` diz "10% por nível" (valor `+16` moveSpeed); `abyssal_haste` cita velocidade e `martyr_vitality` cita regeneração, mas cada nó tem um só `statKey`.
- `upgradeTalent` (store) não valida `maxLevel`; só `TalentsModal` (l.64) bloqueia.
- `PrestigeModal`: `macabre_fortune` diz "+10%" (código +6%); textos de dificuldade ("+50% HP/Dano", "+25% Cristais", "+120%", "+75%") sem implementação; `selectedDifficulty` só é gravado (`setDifficulty`) e exibido.
- `Player.addXp` devolve `true` ao subir de nível, mas o retorno é ignorado em `CollisionHandlers` (baú, `addXp(30)`), `GameScene` (`give_xp`) e `ScavengingSystem`: nível e pontos sobem sem abrir `LevelUpModal` (`CombatEffectsSystem.triggerLevelUp` só roda em morte de inimigo e contrato).

## Objetivo
**Proposta:** cada conjuração cobra o custo uma só vez, só quando bem-sucedida; toda magia da campanha tem gatilho; descrições e textos batem com o código; todo ganho de nível abre a escolha de upgrade.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Fonte do custo | A) só `Player.cast*` (`bloodCost`); B) só HUD | A: já trata relíquia, rune_famine e falha; remover custo do HUD |
| 2 | Mana | A) HUD deixa de exigir mana; B) skills passam a gastar mana | Responsável decide (design de recurso); sem decisão, A |
| 3 | Desbloqueio de `blood_tendrils` | Nível (ex.: 15) ou quest | Nível, no mesmo mapa; valor do responsável |
| 4 | `sacrificeDiscount` | A) aplicar como redução de dano recebido (texto do talento); B) remover o talento | A, pois o texto já descreve esse efeito |
| 5 | Textos de talento | Ajustar o texto ao valor, ou o valor ao texto | Ajustar o texto (não muda balance) |
| 6 | Dificuldades | A) implementar; B) remover os textos | B agora; A é feature separada com ADR |
| 7 | `macabre_fortune` | Texto +6% ou código +10% | Texto +6% |
| 8 | Nível via baú/`give_xp`/scavenging | Abrir `LevelUpModal` na hora ou enfileirar | Abrir via o mesmo caminho de `triggerLevelUp` |

## Escopo
Itens da seção Contexto, conforme as decisões acima.

## Fora de escopo
Rebalancear custos de `spells.json`, redesenhar talentos ou o modal de prestígio, implementar dificuldades como feature.

## Arquivos e contratos
- Alterar: `src/components/GameplayHUD.tsx`, `src/components/hud/SkillsOverlay.tsx`, `src/game/objects/Player.ts`, `src/store/gameStore.ts` (`CAMPAIGN_SPELL_UNLOCK_LEVEL`, `upgradeTalent`), `src/data/talents.json`, `src/components/PrestigeModal.tsx`, `src/game/systems/CollisionHandlers.ts`, `src/game/scenes/GameScene.ts`, `src/game/systems/ScavengingSystem.ts`, `src/game/systems/CombatEffectsSystem.ts`.
- Contrato `upgradeTalent(id, cost)`: devolve `false` sem alterar nada se `level >= maxLevel`.

## Critérios de aceite
- **CS-1** Quando o jogador aciona uma skill com sucesso, o Player deve descontar o custo uma única vez.
- **CS-2** Se a conjuração falha (cooldown, bloqueada ou HP insuficiente), então o HUD não deve descontar nenhum recurso.
- **CS-3** Enquanto uma relíquia com `spellCostDiscount` está equipada, o custo cobrado deve refletir o desconto, sem outra dedução.
- **CS-4** Quando a campanha atinge o nível definido, o gameStore deve desbloquear `blood_tendrils`.
- **CS-5** Enquanto `escudo_ossos_aprimorado` está no nível N, o Player deve reduzir o dano recebido em N x 5% (decisão 4 = A).
- **CS-6** Se `talentLevels[id]` já é `maxLevel`, então `upgradeTalent` deve retornar `false` sem gastar Cristais.
- **CS-7** O `talents.json` e o `PrestigeModal` devem descrever os valores que o código aplica.
- **CS-8** Quando `addXp` retorna `true` no baú, em `give_xp` ou em scavenging, a GameScene deve abrir o `LevelUpModal`.
- **CS-9** Se o nível sobe com o modal já aberto, então a escolha deve ser enfileirada, sem perder o ponto.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CS-1..CS-3 | Teste unitário: HP antes/depois de `triggerSkill` por skill; falha não altera `stats` nem store |
| CS-4 | Teste de `checkLevelSpellUnlocks` |
| CS-5 | Teste de fórmula de dano recebido |
| CS-6 | Teste de `upgradeTalent` no nível máximo |
| CS-7 | Teste que compara texto com `bonusPerLevel` ou revisão manual |
| CS-8, CS-9 | Teste de integração com `addXp` mockado; manual: abrir baú no limiar de XP (playtest humano) |

## Questões em aberto
- Valor de nível para `blood_tendrils`.
- `corpse_burst` deve ter também gatilho por nível além da quest?

## Referências
- [spells-and-skills](../../gameplay/spells-and-skills.md), [talents](../../gameplay/talents.md), [progression-and-prestige](../../gameplay/progression-and-prestige.md), [loot-and-items](../../gameplay/loot-and-items.md)
