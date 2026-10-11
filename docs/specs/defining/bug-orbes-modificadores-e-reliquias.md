# Orbes, modificadores de run e relíquias desconectados (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `Collectible` (sem `new`), `gameStore.toggleModifier` e `gameStore.unlockRelic` (sem chamador). Não validado em execução.

## Contexto
**Orbes.** `src/game/objects/Collectible.ts` define `Collectible` (`hp`/`mana`, `amount`). `CollisionHandlers.handleCollectItem` cura/recarrega e faz `incrementRunStat('mana_orbs_run', 1)`. Nenhum arquivo faz `new Collectible(...)`: `GameScene.collectiblesGroup` só é atraído (`attractToPlayer`, l.~1638) e limpo (`DungeonFlowController`, `collectiblesGroup.clear`). Logo `mana_orbs_run` nunca sobe e a conquista de `achievements.json` que a usa é inalcançável.

**Modificadores de run.** `src/data/runModifiers.json` define `blood_tide`, `rune_famine`, `fury_pit`. `gameStore.activeModifiers` é lido por id em código (`Enemy.ts` fury_pit; `CombatEffectsSystem` fury_pit e blood_tide; `DungeonFlowController` blood_tide; `Player.cast*` rune_famine), mas:
- `toggleModifier` não tem chamador (nem `.tsx`): nenhuma UI ativa modificador; `clearModifiers` idem.
- O JSON não é importado: multiplicadores estão hardcoded (1.4, 1.5, 0.325, x2 de custo).
- `crystalMultiplier` (2.0, rune_famine) não é aplicado: `addBloodCrystals` só usa `getRelicModifiers().bloodCrystalMultiplier`.

**Relíquias.** `loadUnlockedRelics` devolve por padrão `selo_hemorragico`, `olho_de_carmim`, `anel_do_pacto_sanguineo`. `unlockRelic` só é definido na store; as outras 5 de `relics.json` (`calice_amaldicoado`, `coracao_abissal`, `amuleto_do_martir`, `fragmento_abissal`, `manta_vampirica`) não têm fonte de desbloqueio; a galeria de `InventoryModal` as mostra bloqueadas.

## Objetivo
**Proposta:** orbes caem e podem ser coletados; o jogador consegue ativar/desativar modificadores de run, que aplicam todos os efeitos descritos no JSON; toda relíquia do catálogo tem uma forma de ser desbloqueada.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Fonte dos orbes | A) drop de inimigo; B) destrutíveis/baús; C) ambos | A, com chance baixa; hp e mana separados |
| 2 | Números (chance, `amount` hp/mana) | Valores do responsável | Propor depois do playtest; sem decisão não implementar |
| 3 | Onde ativar modificadores | A) tela pré-run/menu; B) após prestígio; C) remover o recurso | A, escolhidos antes de iniciar a run, sem troca no meio |
| 4 | Efeitos dos modificadores | A) ler `runModifiers.json` como fonte única; B) manter hardcode | A: evita divergência já existente (0.325 vs 1.3) |
| 5 | `crystalMultiplier` | Aplicar em `addBloodCrystals` junto com o da relíquia (multiplicar) ou só da run | Multiplicar; só em ganhos de run (não em compras) |
| 6 | Desbloqueio das 5 relíquias | A) conquistas; B) chefes; C) Cristais; D) drop de baú | Responsável decide (conteúdo/progressão); sem decisão, A |

## Escopo
- Instanciar `Collectible` conforme decisão 1 e 2; garantir limpeza no fim do andar já existente.
- Ligar UI a `toggleModifier` e ler os efeitos do JSON (decisões 3 a 5).
- Chamar `unlockRelic` nos gatilhos da decisão 6.

## Fora de escopo
- Novos modificadores/relíquias, arte dos orbes (texturas `orb_hp`/`orb_mana` já existem), rebalancear conquistas.

## Arquivos e contratos
- Alterar: `src/game/systems/CombatEffectsSystem.ts` (drop), `src/game/scenes/GameScene.ts` (grupo/atração, se necessário), `src/store/gameStore.ts` (`addBloodCrystals`, leitura do JSON), `src/data/runModifiers.json`, `src/game/objects/Player.ts`, `Enemy.ts`, `DungeonFlowController.ts` (trocar hardcode por leitura), componente novo de seleção de modificadores sob `src/components/`, ponto de desbloqueio de relíquia conforme decisão 6.
- Contrato: `unlockRelic(id)` já persiste via `saveUnlockedRelics` (Zod, máx. 50 ids).

## Critérios de aceite
- **OR-1** Quando um inimigo morre e o sorteio de orbe passa, a GameScene deve criar um `Collectible` do tipo definido na posição do inimigo.
- **OR-2** Quando o jogador coleta um orbe de mana, o gameStore deve incrementar `mana_orbs_run` em 1.
- **OR-3** Quando o jogador troca de andar, a GameScene deve remover os orbes remanescentes.
- **OR-4** Quando o jogador ativa um modificador antes da run, o gameStore deve ter o id em `activeModifiers` e a UI deve mostrá-lo ativo.
- **OR-5** Enquanto `rune_famine` estiver ativo, o gameStore deve multiplicar por `crystalMultiplier` os Cristais ganhos na run.
- **OR-6** Enquanto um modificador estiver ativo, os sistemas de jogo devem ler seus multiplicadores de `runModifiers.json`.
- **OR-7** Quando o gatilho de desbloqueio de uma relíquia ocorre, o gameStore deve chamar `unlockRelic` e a galeria deve mostrá-la desbloqueada.
- **OR-8** Se a relíquia já está desbloqueada, então `unlockRelic` não deve duplicar o id nem regravar.
- **OR-9** Se o jogador está com HP cheio, então o orbe de HP não deve ser consumido (proposta; confirmar).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| OR-1..OR-3 | Teste unitário do sorteio/handler; manual: matar 30 inimigos e contar orbes (playtest humano) |
| OR-4 | Teste de componente + store (`toggleModifier`) |
| OR-5, OR-6 | Teste unitário de `addBloodCrystals` com modificador e leitura do JSON |
| OR-7, OR-8 | Teste de store: `unlockRelic` duas vezes, `loadUnlockedRelics` após |
| OR-9 | Teste de `handleCollectItem` com HP cheio |

## Questões em aberto
- Modificadores valem só uma run ou ficam salvos? Têm bônus de pontuação?
- A chance de loot de `blood_tide` é 0.325 absoluto no código vs "+30%" na descrição: qual vale?

## Referências
- [loot-and-items](../../gameplay/loot-and-items.md), [progression-and-prestige](../../gameplay/progression-and-prestige.md)
- `src/game/objects/Collectible.ts`, `src/game/systems/CollisionHandlers.ts`, `src/store/gameStore.ts`, `src/data/runModifiers.json`, `src/data/relics.json`
