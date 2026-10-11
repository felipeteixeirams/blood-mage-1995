# Loot e Itens

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Leitura estática do código (sem rodar o jogo). Cobre drops de equipamento, raridades, atributos, equipamento/inventário, relíquias, itens de campanha e orbes. XP, upgrades e prestígio estão em progression-and-prestige.

## Drop de equipamento (`LootSystem`)
| Origem | Chance | Gerador |
|---|---|---|
| Morte de inimigo (`CombatEffectsSystem.handleEnemyDeath`) | `0.25 * dropMult` (com `blood_tide` ativo: `0.325 * dropMult`) | `generateLoot(floorDepth)` |
| Baú de tesouro (`CollisionHandlers.handlePlayerOpenChest`) | sempre 1 item, mais 30 XP e 15 a 30 Cristais | `generateLoot(floorDepth, true)` |
| Saque de `Scavengeable` (`ScavengingSystem`) | 25% se cadáver, 10% se outro; também dá 10 a 39 (cadáver) ou 10 a 24 Cristais | `generateLoot(floorDepth, false)` |
| Baú de quest `starter_dagger` | item fixo (sem sorteio, sem XP, sem Cristais) | `LootSprite` direto |
| Ação de diálogo `give_weapon` | item de `campaignItems.json` pelo `itemId` | `GameScene.update` drena `drainCampaignEffects` |

`dropMult` vem de `getPrestigeModifiers().dropMult` (selo `macabre_fortune`). Inimigo elite (`eliteAffix` diferente de `none`) dá ainda 4 a 7 Cristais, independente do drop de equipamento.

## Raridade e tipo
Rolagem `Math.random()` em `generateLoot`:
| Raridade | Inimigo/saque | Baú |
|---|---|---|
| common | 55% | não sai |
| rare | 27% | 45% |
| epic | 14% | 40% |
| legendary | 4% | 15% |

Tipo: weapon 35%, armor 35%, relic 30%. O nome é sorteado de listas fixas (3 nomes por tipo e raridade, constantes em `LootSystem.ts`). Id: `loot_<Date.now()>_<0-9999>`. Cada geração emite o evento de telemetria `loot_generated`.

## Atributos gerados
`mult` por raridade: common 1.0, rare 1.6, epic 2.5, legendary 4. `scaling = 1 + (floorDepth - 1) * 0.12`.
| Tipo | Atributos |
|---|---|
| weapon | `damageMultiplier = 0.08*mult*scaling`; `critChanceBonus = 0.03*mult`; epic/legendary: `lifestealBonus = 0.02*mult` |
| armor | `maxHpBonus = round(15*mult*scaling)`; `hpRegenBonus = 0.2*mult` |
| relic (gerada) | `cooldownReductionBonus = 0.03*mult`; `maxHpBonus = round(12*mult*scaling)`; epic/legendary: `lifestealBonus = 0.015*mult` |

Não há afixos aleatórios no item: os atributos são fixos por tipo e raridade. "Afixo" existe só em inimigos elite (`frenzied`, `vampiric`, `cursed`, `spectral`), sem relação com o item.

## Pegar, equipar e perder
- `LootSprite` (`objects/Loot.ts`): textura `spr_item_<tipo>` (fallback `particle_orb_blue`), tint por raridade (common cinza, rare azul, epic roxo, legendary dourado), tween de flutuação.
- Tocar no item chama `CollisionHandlers.handleCollectLoot`: equipa na hora (sem confirmação, sem mochila), via `Player.equipLoot` e `gameStore.equipItem`.
- `equipItem`: weapon e armor substituem o slot; relic entra em `equipment.relics` (máximo 3; cheio, descarta a mais antiga). `equipment` é `{ weapon, armor, relics }`. Só os ids de `relics` são persistidos (`saveEquippedRelicIds`); weapon e armor não persistem.
- `Player.equipLoot` soma em `player.stats`: `maxHpBonus` (e cura o mesmo valor), `damageMultiplier` e `lifestealBonus` (em `vampirism`). Não subtrai o item substituído: os bônus acumulam em `stats` a cada pickup, enquanto a store guarda só o item atual. `critChanceBonus`, `cooldownReductionBonus` e `hpRegenBonus` de itens gerados não são lidos por nenhum sistema de gameplay.
- Morte: `GameScene` chama `clearInventoryOnDeath` (zera weapon, armor, relics e curativos); `retrieveCorpseLoot` (chamado em `ScavengingSystem`) devolve `droppedCorpse.equipment` e curativos.
- `recentLootLog` guarda as 5 mensagens mais recentes (`addLootLog`), exibidas em `hud/LootLog.tsx`.

## Relíquias (`src/data/relics.json`, 8 registros)
`getRelicModifiers()` combina as equipadas: `damageMultiplier`, `maxHpBonus`, `speedBonus`, `lifestealBonus`, `cooldownReductionBonus`, `hpRegenBonus`, `bleedDamagePerSecond`, `spellCostDiscount` somam; `bloodCrystalMultiplier` multiplica; `bleedChanceOnHit` usa o maior.
| id | Raridade | Efeito (`effect`) |
|---|---|---|
| anel_do_pacto_sanguineo | common | dano +0.15 |
| manta_vampirica | common | vampirismo +0.08 |
| olho_de_carmim | rare | velocidade +20, vampirismo +0.05 |
| amuleto_do_martir | rare | desconto de custo de feitiço 0.2, velocidade -10 |
| selo_hemorragico | epic | 30% de sangramento no acerto, 10 DPS, dano +0.1 |
| calice_amaldicoado | epic | Cristais x1.5, regeneração -0.5/s |
| coracao_abissal | legendary | HP máx +40, recarga -0.15 |
| fragmento_abissal | legendary | Cristais x1.75, dano +0.2 |

- Padrão: desbloqueadas `selo_hemorragico`, `olho_de_carmim`, `anel_do_pacto_sanguineo`; equipada `selo_hemorragico` (`localStorage.ts`). Chaves `bloodmage_1995_unlocked_relics` (máx. 50 ids) e `bloodmage_1995_equipped_relic_ids` (máx. 3), com Zod.
- `equipRelicById`/`unequipRelicById` são usados pela galeria de `InventoryModal` (arma, armadura, 3 relíquias ativas e galeria `desbloqueadas/total`).
- Consumidores: dano, vampirismo, velocidade, HP máx e recarga em `Player.getEffective*`; regeneração em `Player.updatePlayer`; desconto em `Player.cast*`; sangramento em `PlayerSkillSystem`; Cristais em `gameStore.addBloodCrystals` (só valores positivos, com `Math.round`).
- `unlockRelic` existe na store, mas nenhum código fora dela o chama: as 5 relíquias não padrão não têm fonte de desbloqueio hoje (possível gancho faltando).

## Itens de campanha (`src/data/campaignItems.json`)
Objeto indexado por id, 1 registro: `starter_dagger` (Adaga de Aço, weapon, common, `damageMultiplier` 0.05, `critChanceBonus` 0.02). O baú de quest em `handlePlayerOpenChest` recria o mesmo objeto inline (duplicação do JSON) e avança o objetivo `collect_item`.

## Orbes e coletáveis (`objects/Collectible.ts`)
- Tipos `hp` (textura `orb_hp`) e `mana` (`orb_mana`), com `amount`. A cena atrai o orbe ao jogador a menos de 120 px (`attractToPlayer`, velocidade 220).
- `CollisionHandlers.handleCollectItem`: `hp` cura `amount`; `mana` recarrega `amount` e conta a run stat `mana_orbs_run`.
- Nenhum código instancia `new Collectible(...)`: o grupo `collectiblesGroup` só é atraído e limpo ao trocar de andar, então orbes não aparecem hoje (achado).

## Onde fica no código
- `src/game/systems/LootSystem.ts`: `rollLootChance`, `generateLoot`.
- `src/game/objects/Loot.ts` (`LootSprite`), `src/game/objects/Collectible.ts`.
- `src/game/systems/CombatEffectsSystem.ts` (`handleEnemyDeath`), `CollisionHandlers.ts` (`handlePlayerOpenChest`, `handleCollectLoot`, `handleCollectItem`), `ScavengingSystem.ts`.
- `src/store/gameStore.ts`: `equipment`, `equipItem`, `equipRelicById`, `getRelicModifiers`, `addBloodCrystals`, `clearInventoryOnDeath`, `retrieveCorpseLoot`, `addLootLog`.
- `src/utils/localStorage.ts`: `loadUnlockedRelics`, `loadEquippedRelicIds` e savers.
- `src/components/InventoryModal.tsx`, `src/components/hud/LootLog.tsx`; tipos em `src/types/game.ts` (`LootItem`, `RelicItem`, `RelicEffect`, `EquipmentSlots`).
