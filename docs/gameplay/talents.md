# Talentos

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/data/talents.json`, `src/data/upgrades.json`, `src/utils/localStorage.ts`, `src/components/TalentsModal.tsx`

Leitura estática do código e dos dados (nada foi executado). Meta-progressão permanente comprada com Cristais de Sangue; fonte: `src/data/talents.json` (9 nós).

## Estrutura

- Lista plana com 3 categorias (`category`): offense, defense, utility. Não há campo de pré-requisito nem de posição na árvore; os únicos vínculos são `exclusive_with`.
- Campos por nó: `id`, `name`, `description`, `category`, `icon`, `maxLevel`, `costPerLevel`, `statKey`, `bonusPerLevel`, `exclusive_with?` (opcional).

| id | categoria | maxLevel | costPerLevel | statKey | bonusPerLevel | exclusive_with |
|---|---|---|---|---|---|---|
| hemomancy_power | offense | 10 | 20 | damage | 0.05 | - |
| vampirismo_profundo | offense | 5 | 35 | lifesteal | 0.04 | execucoes_em_area |
| execucoes_em_area | offense | 5 | 35 | damage | 0.03 | vampirismo_profundo |
| martyr_vitality | defense | 10 | 20 | maxHp | 15 | - |
| escudo_ossos_aprimorado | defense | 5 | 40 | sacrificeDiscount | 0.05 | aura_de_medo |
| aura_de_medo | defense | 5 | 40 | maxHp | 25 | escudo_ossos_aprimorado |
| abyssal_haste | utility | 5 | 30 | cooldown | 0.03 | - |
| sobrecarga_runica | utility | 5 | 35 | cooldown | 0.06 | tempestade_continua |
| tempestade_continua | utility | 5 | 35 | moveSpeed | 16 | sobrecarga_runica |

## Custo e compra

- Moeda: `bloodCrystals` (gameStore, persistida; `addBloodCrystals` aplica `relicMods.bloodCrystalMultiplier` só a valores positivos). Não existe moeda separada de "pontos de talento".
- Custo do próximo nível: `costPerLevel * (nível atual + 1)` (calculado em `TalentsModal`; o store recebe o valor em `upgradeTalent(talentId, cost)` e não o recalcula).
- `upgradeTalent` retorna `false` se `bloodCrystals < cost` ou se algum id de `exclusive_with` tem nível > 0. Caso contrário debita, incrementa o nível e grava (`saveBloodCrystals`, `saveTalentLevels`).
- O limite `maxLevel` é verificado só na UI (`TalentsModal`: botão desabilitado e `handleUpgradeNode` retorna); o store não checa.
- Exclusão: comprar um lado trava o outro enquanto o primeiro tiver nível > 0. Não há respec/reset no código lido.
- Fontes de cristais (chamadas a `addBloodCrystals`): elites mortos (4 a 7, `CombatEffectsSystem`), baús (15 a 30, `CollisionHandlers`), saque/scavenging (`ScavengingSystem`), recompensa de contrato (`ContractSystem`), quests de campanha (`rewards.bloodCrystals`), marcos do codex (`claimCodexMilestone`) e `GameplayHUD` (gastos de -15/-50 e +100; contexto não conferido).
- Conquistas em `AchievementSystem.ts` têm campo `reward.talentPoints`, mas nenhum código lido o consome (só aparece em texto de notificação).

## Estado salvo

- `talentLevels: Record<string, number>` no gameStore; chave `bloodmage_1995_talents` em localStorage.
- `loadTalentLevels`/`saveTalentLevels` (`src/utils/localStorage.ts`) validam com `TalentLevelsSchema` (Zod `.strict()`): os 9 ids com inteiro 0..100 (`.catch(0)`), mais `vampiric_thirst` e `sacrifice_mastery` opcionais (ids que não existem em talents.json). Falha de parse restaura `defaultTalents` (tudo 0) e regrava.
- **Atenção:** chave extra no JSON salvo invalida o `strict()`, e o load volta aos padrões. Um talento novo em talents.json exige acrescentar o id em `defaultTalents` e no schema.

## Aplicação no Player

- No construtor de `Player.ts`: lê `talentLevels` do store e, para cada nó com nível > 0, soma `bonusPerLevel * nível` na base de `statKey`:

| statKey | Base | Vai para |
|---|---|---|
| maxHp | 100 | `stats.hp`/`maxHp` |
| moveSpeed | 160 | `stats.moveSpeed` (soma absoluta) |
| damage | 1.0 | `stats.damageMultiplier` |
| lifesteal | 0 | `stats.vampirism` |
| cooldown | 0 | `stats.cooldownReduction` |
| sacrificeDiscount | 0 | `stats.sacrificeDiscount` |

- Só vale a partir de um novo `Player` (nova run); comprar não altera um Player vivo.
- `getEffectiveCooldownReduction` (teto 0.75) e `getEffectiveDamageMultiplier` somam relíquias e prestígio por cima.
- Nível máximo teórico: damage = 1 + 0.5 (hemomancy) + 0.15 (execuções); redução de cooldown = 0.15 (abyssal) + 0.30 (sobrecarga).

## Upgrades de run (upgrades.json)

Separados dos talentos: 13 opções de level-up em `src/data/upgrades.json` (categorias: 6 spell, 5 stat, 2 passive; campo `effect` como `projectileAdd`, `damageMultiplierPercent`, `vampirismPercent`), aplicadas em `GameScene` sobre `player.stats` e válidas só na run.

## Onde fica no código

- `src/data/talents.json`, `src/data/upgrades.json`
- `src/store/gameStore.ts` (`talentLevels`, `upgradeTalent`, `bloodCrystals`, `addBloodCrystals`, `isTalentsOpen`)
- `src/components/TalentsModal.tsx` (UI, custo, bloqueio por exclusão; tecla T)
- `src/game/objects/Player.ts` (construtor)
- `src/utils/localStorage.ts` (`TalentLevelsSchema`, `loadTalentLevels`, `saveTalentLevels`)

## Inconsistências observadas

- `sacrificeDiscount` é gravado em `stats` mas nenhum código o consome: `escudo_ossos_aprimorado` não tem efeito observável.
- Descrições divergem dos valores: `tempestade_continua` diz "10% por nível" (valor: +16 de velocidade); `abyssal_haste` e `martyr_vitality` citam velocidade/regeneração que o `statKey` único não aplica (`hpRegen` existe no tipo, mas nenhum nó o usa).
- `upgradeTalent` não valida `maxLevel` nem recalcula custo.

Relacionados: [spells-and-skills](spells-and-skills.md), [progression-and-prestige](progression-and-prestige.md); [state-management](../architecture/state-management.md), [risky-files](../engineering/risky-files.md) (schemas de `localStorage.ts`).
