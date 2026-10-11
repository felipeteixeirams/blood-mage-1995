# Magias e Skills

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Leitura estática do código e dos dados (nada foi executado). Magias vêm de `src/data/spells.json` (9 registros, tipo `SpellConfig` em `src/types/game.ts`).

## Magias (spells.json)

Todas têm `level: 1`. Custo real: ver "Custo" abaixo.

| id | tipo | manaCost | hpCost | bloodCost | cooldownMs | baseDamage | hotkey (campo) |
|---|---|---|---|---|---|---|---|
| blood_bolt | projectile | 1 | 0 | 1 | 150 | 15 | LMB / Auto |
| hellfire_nova | nova | 15 | 0 | 12 | 3500 | 65 | Skill 1 (Q) |
| syphon_soul | drain | 25 | 0 | 20 | 6000 | 50 | Skill 2 (E) |
| bone_shield | shield | 30 | 0 | 24 | 10000 | 18 | Skill 3 (Espaço) |
| crimson_scythe | projectile | 5 | 6 | 11 | 1800 | 115 | Skill 4 (R) |
| blood_ritual_circle | nova | 0 | 14 | 14 | 8000 | 30 | Skill 5 (Shift) |
| hemomancy_beam | beam | 20 | 10 | 30 | 12000 | 160 | Skill 6 (F) |
| blood_tendrils | nova | 18 | 5 | 23 | 7000 | 75 | Skill 7 |
| corpse_burst | nova | 22 | 8 | 30 | 9000 | 140 | Skill 8 |

Outros campos: `projectileSpeed` (650 no blood_bolt, 0 nas demais), `gibPower`, `icon`, `color`, `description`, `name` (pt-BR).

## Custo e cooldown (Player.ts)

- O custo cobrado é em **HP**, usando `bloodCost`: `round((bloodCost || manaCost [+ hpCost nas 4 últimas magias]) * (rune_famine ? 2 : 1) * (1 - relicMods.spellCostDiscount))`. Se `hp < custo`, o cast falha.
- `manaCost` e `hpCost` só entram como fallback quando `bloodCost` é 0/ausente (todas as magias atuais têm `bloodCost`). `Player.castNova` etc. **não descontam mana**.
- Cooldown aplicado: `cooldownMs * (1 - getEffectiveCooldownReduction())`. A redução soma talentos + bônus de relíquia + prestígio, com teto de 0.75.
- Cooldowns ficam em `Player.skillCooldowns[spellId]` (decrementados por delta no update); `getCooldownRemaining(spellId)` expõe o valor.
- Dano: cada `execute*Effect` lê `baseDamage` do JSON e multiplica por `Player.getEffectiveDamageMultiplier()` (`stats.damageMultiplier` + relíquias, vezes prestígio; talentos entram em `stats.damageMultiplier`; ver talents.md).

## Como o cast acontece

1. Teclado em `GameScene` chama `GameScene.triggerSkill(skillKey)`, que delega a `PlayerSkillSystem.triggerSkill`. Teclas: Q/1 nova, E/2 syphon (E vira interação se houver NPC/scavenge perto), Espaço/3 bone_shield, R/4 crimson_scythe, C/5 blood_ritual_circle, F/6 hemomancy_beam. Shift dispara dash (`player.triggerDash`), não o ritual.
2. Botões do HUD (`SkillsOverlay`) chamam `onSkillClick(skillKey)`; há também mira por arrastar (`handleDragAimStart/Move/End`) e gamepad (`handleGamepadInput`).
3. `triggerSkill` ignora se `scene.isPaused`; consulta `isCampaignSpellUnlocked` (se bloqueada: texto flutuante "FEITIÇO NÃO DESCOBERTO"); chama `player.castX()` (valida custo/cooldown); em sucesso roda `executeXEffect()`, `scene.emitSound(...)` (alerta inimigos) e `ContractSystem.onSpellCasted(spellId)`.
4. `SKILL_KEY_TO_SPELL_ID` mapeia skillKey para spellId (`nova` -> hellfire_nova, `syphon` -> syphon_soul, demais iguais ao id).
5. `blood_bolt` é o ataque automático: `Player.castBloodBolt(time)` cobra o custo (HP) e `PlayerSkillSystem.firePlayerBloodBolt` cria `1 + stats.projectileBonus` projéteis em leque (0.18 rad) com `baseDamage * getEffectiveDamageMultiplier()`.

## Desbloqueio

| Modo | Regra |
|---|---|
| Arcade | `isCampaignSpellUnlocked` sempre `true` (gameStore) |
| Campanha | só magias em `campaignState.unlockedSpellIds` (persistido em `localStorage.ts`, schema `unlockedSpellIds`, máx. 50) |

Fontes de desbloqueio na campanha:
- Por nível (`CAMPAIGN_SPELL_UNLOCK_LEVEL`, `checkLevelSpellUnlocks(level)`): hellfire_nova 3, bone_shield 5, crimson_scythe 7, syphon_soul 9, hemomancy_beam 11, blood_ritual_circle 13.
- Por quest (`rewards.spellUnlockId` em `src/data/campaignQuests.json`, aplicado por `unlockCampaignSpell`): blood_bolt, corpse_burst, bone_shield, crimson_scythe.
- Diálogo: escolha com `actionPayload` também chama `unlockCampaignSpell`.
- `blood_tendrils`: nenhum gatilho de campanha encontrado (nem nível nem quest).
- `stats.unlockedSpells` (Player) lista 7 ids e `unlockedSpells` no gameStore inicial também; não é o que bloqueia o cast.

## Slots e presets

- `skillPreset` (gameStore, `setSkillPreset`): padrão `['hellfire_nova','syphon_soul','bone_shield','crimson_scythe']`. Não é persistido em localStorage.
- `SkillPresetEditor` (`src/components/hud/`): `MAX_SLOTS = 4`; lista todas as magias exceto `blood_bolt`; tocar alterna (remove se presente, adiciona se há vaga).
- `SkillsOverlay` desenha os slots de `skillPreset` (preenche até 4 vazios) em arco; tamanho padrão `large` para o índice 0, `medium` para os demais; `settings.hudLayout[spellId]` (x, y, size) sobrepõe no modo de edição de HUD (`isEditingHUD`). Botão habilitado só se desbloqueada, sem cooldown, `mana >= manaCost` e `hp > hpCost`.

## Onde fica no código

- `src/data/spells.json`, `src/types/game.ts` (`SpellConfig`)
- `src/game/systems/PlayerSkillSystem.ts` (`triggerSkill`, `execute*Effect`, `firePlayerBloodBolt`)
- `src/game/objects/Player.ts` (`cast*`, `skillCooldowns`, `getEffectiveCooldownReduction`)
- `src/store/gameStore.ts` (`skillPreset`, `unlockCampaignSpell`, `isCampaignSpellUnlocked`, `checkLevelSpellUnlocks`)
- `src/components/hud/SkillsOverlay.tsx`, `SkillPresetEditor.tsx`
- `src/game/scenes/GameScene.ts` (teclas)

## Inconsistências observadas

- `SkillsOverlay.checkCanCast` exige mana, mas `Player.cast*` não gasta mana.
- `GameScene.triggerSkill` tem tipo restrito a 6 skills; blood_tendrils e corpse_burst só disparam pelo HUD/`PlayerSkillSystem`, sem tecla.
- O campo `hotkey` de blood_ritual_circle diz Shift, mas Shift é dash (ritual = C/5).

Relacionados: [combat](combat.md), [talents](talents.md); [hud](../ui/hud.md) (slots e atalhos), [risky-files](../engineering/risky-files.md).
