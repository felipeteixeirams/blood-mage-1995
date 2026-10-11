# Bônus de equipamento acumulam e atributos sem efeito (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `Player.equipLoot` (`src/game/objects/Player.ts`) e `LootSystem.generateLoot` (`src/game/systems/LootSystem.ts`). Não validado em execução.

## Contexto
- `CollisionHandlers.handleCollectLoot` chama `player.equipLoot(item)` e depois `store.equipItem(item)`.
- `equipItem` (`gameStore.ts`) **substitui** o slot `weapon`/`armor` (e mantém até 3 relíquias, descartando a mais antiga). A store guarda só o item atual.
- `Player.equipLoot` faz `equippedLoot.push(item)` e **soma** em `player.stats`: `maxHpBonus` (e cura o mesmo valor), `damageMultiplier` e `lifestealBonus` (em `vampirism`). Nunca subtrai o item substituído nem o descartado; `equippedLoot` só cresce e nenhum código o lê. Resultado: a cada pickup o bônus acumula, apesar de o slot mostrar um só item.
- `LootSystem.generateLoot` gera `critChanceBonus` (arma), `hpRegenBonus` (armadura) e `cooldownReductionBonus` (relíquia). `equipLoot` não os lê; `PlayerStats` não tem campo de crítico; `getEffectiveCooldownReduction` soma só `stats.cooldownReduction`, relíquias do catálogo (`getRelicModifiers`) e prestígio; a regeneração (`Player.ts` ~l.363) lê só `relicMods.hpRegenBonus`. As descrições geradas prometem esses efeitos ("Crítico em +X%", "+X HP/s", "Reduz Cooldowns").
- A Adaga de Aço (`starter_dagger`, `critChanceBonus` 0.02) cai no mesmo caminho.

## Objetivo
**Proposta:** os bônus de `player.stats` refletem exatamente os itens equipados agora (trocar um item remove o bônus do anterior) e todo atributo anunciado na descrição tem efeito de jogo, ou deixa de ser anunciado.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Modelo de cálculo | A) subtrair o item substituído em `equipLoot`; B) derivar os bônus de `store.equipment` em `getEffective*` (sem mutar `stats`) | B: fonte única, não deriva e funciona após carregar/morrer |
| 2 | Efeito de `critChanceBonus` | A) implementar crítico (chance, multiplicador de dano); B) remover o atributo e o texto | Responsável decide: exige regra de balance (multiplicador do crítico). Sem decisão, B |
| 3 | `hpRegenBonus` e `cooldownReductionBonus` | A) ler dos itens em `getEffectiveCooldownReduction` e na regeneração; B) remover | A: a infraestrutura de relíquias já faz o mesmo e o teto 0.75 já existe |
| 4 | Relíquia gerada fora do catálogo | A) conta bônus como as demais; B) fica só cosmética | A, por consistência com `getRelicModifiers` |
| 5 | Saves/runs existentes | Bônus já acumulados em `stats` somem ao recalcular | Aceitar: `equipment` de arma/armadura não persiste de qualquer forma |

## Escopo
- Garantir que substituir arma/armadura (e descartar relíquia por slot cheio) remova o bônus antigo.
- Aplicar (ou retirar) `critChanceBonus`, `hpRegenBonus` e `cooldownReductionBonus` conforme as decisões 2 e 3.
- Alinhar `description` gerada em `LootSystem` e a UI de `InventoryModal` ao efeito real.

## Fora de escopo
- Rebalancear os valores base de loot (0.08, 0.03, 0.2, 15, 12) ou os multiplicadores de raridade.
- Persistência de weapon/armor; relíquias do catálogo (`relics.json`).

## Arquivos e contratos
- Alterar: `src/game/objects/Player.ts` (`equipLoot`, `getEffective*`, regeneração, remoção de `equippedLoot` se ficar morto), `src/game/systems/LootSystem.ts` (descrições, se a decisão 2 for B), `src/types/game.ts` (campo de crítico, se A), `src/store/gameStore.ts` (só se a decisão 1 for B e precisar de seletor).
- Se houver crítico (decisão 2 A): os números (chance máxima, multiplicador) vêm do responsável; teste dedicado de fórmula (regra de combate do projeto).
- Não tocar: `relics.json`, `Enemy.ts`.

## Critérios de aceite
- **EQ-1** Quando o jogador equipa uma arma que substitui outra, o Player deve ter `damageMultiplier` igual ao valor base mais o bônus da arma nova somente.
- **EQ-2** Quando o jogador equipa uma armadura que substitui outra, o Player deve ter `maxHp` igual ao valor base mais o bônus da armadura nova somente.
- **EQ-3** Quando uma relíquia entra em slots cheios, o Player deve remover o bônus da relíquia descartada.
- **EQ-4** Enquanto uma armadura com `hpRegenBonus` estiver equipada, o Player deve regenerar esse valor de HP por segundo (decisão 3 = A).
- **EQ-5** Enquanto uma relíquia com `cooldownReductionBonus` estiver equipada, o Player deve somá-lo à redução de cooldown efetiva, respeitado o teto de 0.75 (decisão 3 = A).
- **EQ-6** Onde `critChanceBonus` for mantido (decisão 2 = A), o sistema de dano deve aplicar a chance de crítico somada dos itens equipados.
- **EQ-7** Se um atributo não tiver efeito de jogo, então a `description` do item não deve citá-lo.
- **EQ-8** Se o jogador morrer, então o Player deve ficar sem nenhum bônus de itens ao renascer sem recuperar o corpo.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EQ-1..EQ-3, EQ-8 | Teste unitário (Vitest) de `Player`/seletor: equipar A, equipar B, comparar stats; nunca A+B |
| EQ-4, EQ-5 | Teste unitário dos `getEffective*` e da regeneração com item mockado |
| EQ-6 | Teste dedicado da fórmula de crítico |
| EQ-7 | Teste sobre `LootSystem.generateLoot` (descrição só cita atributos ativos) |
| Todos | Manual: pegar 3 armas seguidas e conferir dano em `InventoryModal` (não validado: precisa de playtest humano) |

## Questões em aberto
- O dano de crítico existe como conceito do jogo? (nenhum sistema o define hoje).
- O recálculo deve valer para itens recuperados do corpo (`retrieveCorpseLoot`, `droppedCorpse.equipment`)?

## Referências
- [loot-and-items](../../gameplay/loot-and-items.md)
- `src/game/objects/Player.ts`, `src/game/systems/LootSystem.ts`, `src/game/systems/CollisionHandlers.ts`, `src/store/gameStore.ts`
