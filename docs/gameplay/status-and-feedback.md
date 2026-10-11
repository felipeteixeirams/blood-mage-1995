# Status e feedback

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Status de sobrevivência do jogador e de inimigos, feedback de impacto, gibs e sangue. Verificado por leitura estática; valores são o que o código faz hoje, não balance ratificado. Não validado: precisa de playtest humano. Dano e FSM: ver `combat`.

## Status de sobrevivência do jogador
Em `Player.updatePlayer` dois mecanismos rodam juntos a cada frame:

| Condição | Percentual (`updateStatusConditions`) | Tick fixo (`updatePlayer`, via `takeDamage`) | Outro efeito |
|---|---|---|---|
| bleeding | 2% do `maxHp`/s só andando | 3 HP / 1500 ms | velocidade x0.8; gotas no chão |
| poison | 1.5% do `maxHp`/s | 4 HP / 2000 ms | regen de mana 2/s (normal 4/s) |
| infection | teto de HP em 80% do `maxHp` | 2 HP / 3000 ms | dano recebido x1.2; sem regen em nocaute |

Curas: Z (atadura), X (antídoto), V (antibiótico) => `GameScene.useCurativeItem` => `ScavengingSystem`. Os ticks fixos passam por `takeDamage` e concedem 800 ms de i-frames.
`statusEffectOnHit` em `src/data/monsters.json` está em 8 monstros (sangramento, infecção, veneno). `CollisionHandlers.playerHitByEnemy` rola a chance e chama `setStatusCondition`, só se a condição não estiver ativa e o jogador não estiver inconsciente nem morto. `applyStatusDamage` (ticks percentuais) é separado de `takeDamage`, sem frames de invulnerabilidade, e reaproveita o fluxo de desmaio e morte. A cura usa `useCurative` no `gameStore` (atalhos Z/X/V em `components/hud/PlayerStatus.tsx`); o Clérigo em `GameplayHUD.tsx` limpa as 3 condições por 15 Cristais.


## Status em inimigos (`StatusEffectSystem`)
Tipos: burning, frozen, cursed, poison, bleeding. `applyStatus(target, type, durationMs=3000, dps=10)`; reaplicar mantém o maior `remainingMs` e `dps`. Tick a cada 400 ms (burning) ou 800 ms; dano `max(1, round(dps*intervalo/1000))` via `takeDamage`. frozen: tint 0x67e8f9, animação a 0.25x. cursed: tint 0xa855f7 e dano recebido x1.25. Aplicadores: `PlayerSkillSystem` (burning 3500 ms, cursed 4000/3500 ms, bleeding 4000 ms).

## Feedback de impacto (`CombatFeel.handleHitImpact`)
| Gatilho | Shake (intensidade / ms) | Hit-stop |
|---|---|---|
| padrão | 0.002 / 60 | não |
| dano > 15 | 0.004 / 100 | não |
| crítico | 0.006 / 130 | 40 ms |
| skill especial | 0.01 / 200 | 80 ms |
| HP do inimigo <= 20% | conforme linha acima | 40 ms |

Hit-stop pausa `physics.world` e ignora novo pedido enquanto ativo. Shake respeita `settings.screenShakeEnabled`. Vibrações em `triggerVibration` (`damage_taken` 50 ms, `critical_hit`, `execution`, `bleeding_tick`...).

## Gibs e sangue
Em `CombatEffectsSystem.handleEnemyDeath`: score, combo (janela 2500 ms, texto a partir de 3), XP (`xpDrop`, x1.5 com `fury_pit`), afixo elite dá 4 a 7 cristais, rolagem de loot.
- **Execução:** morte por `crimson_scythe`/`hellfire_nova`/`blood_ritual_circle`/`hemomancy_beam` com o inimigo em HP <= 15% antes do golpe => `spawnProceduralGore` (fatias do sprite, hit-stop 140 ms).
- **Gib score** (`DismembermentSystem.calculateDismemberment`): `fragility*0.35 + (spellGib/2)*0.30 + min(overkillRatio*1.5, 1)*0.35 + levelBonus`, com `levelBonus = clamp((nivel-1)*0.04, -0.2, 0.3)`; crítico +0.20, execução +0.60; x0.40 se `bodyType` boss, x0.70 se `dense_abomination`. `>= 0.72` ou execução: `total_destruction`; `>= 0.35`: `partial_dismemberment`; senão `normal_collapse`. Na morte, `damageAmount = maxHp*0.9` e `isCrit = wasLowHp`.
- `Enemy.takeDamage` chama `spawnGibs()` se morreu por execução, crítico ou overkill (`hp <= -50% maxHp` ou dano `>= 150% maxHp`).
- `settings.contentIntensity === 'reduced'` converte gibs em `normal_collapse` e reduz sangue. `BloodSplatterSystem` mantém até 140 decals e muda a cor por tipo (osso, espectro, abominação).
- `gore_abomination` explode ao morrer (raio 110, dano fixo 28 ao jogador). `zombie_shambler` libera 2 `bat_swarm`.

## Onde fica no código
- `src/game/objects/Player.ts`: `updateStatusConditions`, `applyStatusDamage`, `takeDamage`.
- `src/game/objects/Enemy.ts`: `takeDamage`, `spawnGibs`.
- `src/game/systems/`: `StatusEffectSystem`, `CombatEffectsSystem`, `CombatFeel`, `DismembermentSystem`, `BloodSplatterSystem`.
- `src/components/hud/PlayerStatus.tsx`, `GameplayHUD.tsx`, `src/store/gameStore.ts` (`useCurative`).

Relacionados: combat, enemies-and-bestiary, spells, progression-and-prestige; arquivos de risco em [risky-files](../engineering/risky-files.md) e padrões em [phaser-patterns](../architecture/phaser-patterns.md).
