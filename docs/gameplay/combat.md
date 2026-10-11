# Combate

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Como o dano é causado e recebido hoje: FSM de ataque dos inimigos, dano do jogador, crítico, knockback, esquiva, status, telegrafia e feedback. Leitura estática do código (nada foi executado). Inimigos e IA: ver `enemies-and-bestiary`.

## FSM de ataque do inimigo (Windup, Strike, Recovery)
Campo `Enemy.attackPhase`: `none | windup | strike | recovery`. Iniciada por `startWindup(time, durationMs, attackType, targetPos)`, avançada em `updateEnemy`.

| Fase | Duração | O que acontece |
|---|---|---|
| windup | por behavior (tabela abaixo) | velocidade x0.15 por frame, mira trava em `attackTargetPos`, tint 0xef4444, escala "coil", toca `playTelegraph` |
| strike | 110 ms | `playSwing`. Ranged: para e emite `{attack:true, attackType:'ranged'}`. Melee: lunge a `speed*2.4`; se distância ao jogador `<= attackRange + 22` emite `{attack:true, damage}`, senão `{dodged:true}` (GameScene mostra "MISS!") |
| recovery | 220 ms | escala normal, tint base; ao fim `attackPhase='none'` e `lastAttackTime=time` |

| Behavior | Windup | Cooldown desde `lastAttackTime` | Condição de disparo |
|---|---|---|---|
| swarmer | 180 ms melee | 900 ms | `dist <= attackRange` |
| chaser | 300 ms melee | 1100 ms | `dist <= attackRange` |
| charger | 420 ms melee | 900 ms | `dist <= attackRange` (carga começa a `dist < 240`) |
| ranged / boss | 400 ms ranged | 2100 ms (1400 ms em `frenzy`) | `dist <= attackRange` e sem parede no caminho |

- O primeiro windup (se `onboarding.firstDashDone` é falso e o inimigo é `skeleton_warrior` ou está no andar 1) mostra a dica "ESQUIVE!".
- Frozen zera a velocidade-base, mas não interrompe uma FSM já iniciada.

## Resolução do golpe (`GameScene.update`)
Com `updateEnemy(...).attack`:
- ranged, ou `behavior` ranged/boss: projétil pooled (`enemyProjectilePool`), velocidade 220, dano `enemy.config.damage` (base do JSON, sem escala de andar/afixo) e `statusEffectOnHit` do monstro.
- melee: `playerHitByEnemy(result.damage, statusEffectOnHit)` + `spawnMeleeSlashEffect`. `result.damage = Enemy.damage` (escalado por andar/afixo).

## Dano do jogador ao inimigo
| Fonte | Dano | Origem |
|---|---|---|
| Blood Bolt (projétil) | `baseDamage 15 * multiplicador`; velocidade 650; custo 1 HP; cooldown 150 ms | `spells.json`, `PlayerSkillSystem.firePlayerBloodBolt` |
| Adaga (melee) | `DAGGER_BASE_DAMAGE 10 * multiplicador`; `MELEE_COOLDOWN_MS 500`; `MELEE_RANGE 50`; exige arma equipada | `CollisionHandlers.handleMeleeHitEnemy`, `Player.castDaggerStrike` |
| Skills (nova, syphon, scythe...) | em `PlayerSkillSystem` (ver doc de magias) | fora deste doc |

- Multiplicador = `getEffectiveDamageMultiplier()` = `(stats.damageMultiplier + relic.damageMultiplier) * prestige.damageMult`.
- **Crítico (projétil e adaga):** `Math.random() < 0.15` => dano x1.75. Skills passam `isCrit=false`.
- Em cada acerto: `triggerGroupAlert` (raio 220 chama `alertToCombat`), `applyRelicOnHitEffects`, texto flutuante (crítico amarelo com "!"), vampirismo (`finalDamage * getEffectiveVampirism()` cura o jogador).
- Crítico: `addCriticalImpactGlow`, partículas `critical_hit`, `postFX.triggerShockwave(200, 0.25)`.
- `Enemy.takeDamage(amount, srcX, srcY, isCrit, isExecution)`: afixo `reflective` x0.65; `cursed` (afixo ou status) x1.25; marca `isAngered`; chama `alertToCombat`; atualiza `currentTarget` no store; retorna `hp <= 0`.

## Knockback e flinch (inimigo)
`takeDamage` desloca 3 px para longe da fonte e soma impulso a `moveVx/moveVy` (px/s por `behavior`):

| swarmer | chaser | ranged | charger | boss | crítico |
|---|---|---|---|---|---|
| 180 | 100 | 110 | 30 | 15 | x1.5 |

Hit flash: tint branco 33 ms, vermelho 90 ms, depois tint base (`frenzy` volta a 0xff3333).

## Esquiva e invulnerabilidade do jogador
| Item | Valor | Origem |
|---|---|---|
| Dash | 150 ms a 800 px/s; i-frames 200 ms; cooldown 3000 ms x `(1 - CDR)` (CDR efetivo máx 0.75) | `Player.triggerDash`, `DASH_*` |
| Direção do dash | movimento; parado, mira | `triggerDash` |
| I-frames pós-dano | 800 ms | `Player.takeDamage` |
| I-frames ao despertar de nocaute | 1500 ms | `updatePlayer` |

- `playerHitByEnemy` ignora o golpe se `isInvulnerable`, inconsciente ou morto, e dentro da sala 0 (Safe Town).
- Melee que erra (`dodged`): texto "MISS!" e vibração `dodge_success`.

## Dano recebido pelo jogador
`CollisionHandlers.playerHitByEnemy(damage, statusEffectOnHit?, hitType='physical')`:
1. Cancela scavenging em curso.
2. Rola condições antes do dano: sangramento 18% (só `physical`), veneno 12% (garantido em `ranged`/`toxic`), infecção 10% (garantida em `heavy`). Todos os chamadores atuais usam `physical`.
3. Rola `statusEffectOnHit` do monstro (`chance`) e liga a condição se ainda inativa.
4. `Player.takeDamage(damage)`: Bone Shield x0.7, infecção x1.2; não há redução por armadura.
5. Feedback: `cameras.main.shake(150, 0.015)` e flash vermelho (respeitam `screenShakeEnabled`/`flashesEnabled`), `screenShake` por faixa (>20, >50, >100), aberração cromática se >50, partículas por `hitType`, háptico.

**Toque passivo:** `GameScene` registra `physics.add.overlap(player, enemiesGroup)` => `handleEnemyTouchPlayer` => `playerHitByEnemy(enemy.damage * 0.4, statusEffectOnHit)`. Existe dano por contato no código, embora a regra do projeto o proíba.

## Knockouts e morte
`stats.knockoutCount`: HP 0 => inconsciente no 1o e 2o; no 3o, `isDefinitivelyDead`. Inconsciente: velocidade 0, regen 2% do HP máx efetivo por s (bloqueada por infecção), acorda com `hp >= 5%` do máx. `playerHitByEnemy` chama `triggerGameOver` quando `takeDamage` retorna true. Inimigos em combate viram `patrol_away_from_player` enquanto o jogador está inconsciente/morto.

## Status de sobrevivência do jogador
Em `Player.updatePlayer` dois mecanismos rodam juntos a cada frame:

| Condição | Percentual (`updateStatusConditions`) | Tick fixo (`updatePlayer`, via `takeDamage`) | Outro efeito |
|---|---|---|---|
| bleeding | 2% do `maxHp`/s só andando | 3 HP / 1500 ms | velocidade x0.8; gotas no chão |
| poison | 1.5% do `maxHp`/s | 4 HP / 2000 ms | regen de mana 2/s (normal 4/s) |
| infection | teto de HP em 80% do `maxHp` | 2 HP / 3000 ms | dano recebido x1.2; sem regen em nocaute |

Curas: Z (atadura), X (antídoto), V (antibiótico) => `GameScene.useCurativeItem` => `ScavengingSystem`. Os ticks fixos passam por `takeDamage` e concedem 800 ms de i-frames.

## Status em inimigos (`StatusEffectSystem`)
Tipos: burning, frozen, cursed, poison, bleeding. `applyStatus(target, type, durationMs=3000, dps=10)`; reaplicar mantém o maior `remainingMs` e `dps`. Tick a cada 400 ms (burning) ou 800 ms; dano `max(1, round(dps*intervalo/1000))` via `takeDamage`. frozen: tint 0x67e8f9, animação a 0.25x. cursed: tint 0xa855f7 e dano recebido x1.25. Aplicadores: `PlayerSkillSystem` (burning 3500 ms, cursed 4000/3500 ms, bleeding 4000 ms).

## Telegrafia (`EnemyTelegraphSystem`)
Desenha no chão (depth 740) só inimigos em tela (+120 px); desligada se `settings.postProcessingEnabled === false`. `Enemy.getTelegraphInfo(time)` só retorna dados em windup/strike; `progress` = fração do windup.

| Shape | Quando | Forma |
|---|---|---|
| `boss_slam` | `config.id === 'blood_lord_boss'` | raio 80, 360 graus. O id não existe em `monsters.json` (ramo morto) |
| `line` | `behavior === 'charger'` ou `isCharging` | largura 32, alcance até o alvo + 30 (mín 80) |
| `circle` | ataque ranged | raio 36 no ponto-alvo |
| `cone` | `flesh_golem`, `gore_abomination` | `attackRange + 26`, abertura 0.65 PI |
| `cone` | demais melee | `attackRange + 16`, abertura 0.45 PI |

Cor padrão 0xef4444; 0x8b5cf6 (`cultist_acolyte`, `specter_wraith`); 0xdc2626 (golem, abomination); afixos: cursed 0xa855f7, frenzied 0xf97316, teleporter 0x9333ea, reflective 0x0284c7. Preenchimento cresce com `progress` (alfa 0.10 a 0.32); no strike alfa 0.5 e contorno branco.

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
- `src/game/objects/Enemy.ts`: `updateEnemy`, `startWindup`, `takeDamage`, `getTelegraphInfo`, `spawnGibs`.
- `src/game/objects/Player.ts`: `takeDamage`, `triggerDash`, `updateStatusConditions`, `castDaggerStrike`, `castBloodBolt`.
- `src/game/objects/Projectile.ts`: `fire`, `releaseToPool`, `updateProjectile` (vida 2500 ms; some em parede via `isTraversable`).
- `src/game/systems/CollisionHandlers.ts`: `handleProjectileHitEnemy`, `handleMeleeHitEnemy`, `playerHitByEnemy`, `handleEnemyTouchPlayer`.
- `src/game/systems/`: `CombatEffectsSystem`, `CombatFeel`, `EnemyTelegraphSystem`, `StatusEffectSystem`, `DismembermentSystem`, `BloodSplatterSystem`.
- `src/game/scenes/GameScene.ts`: `update` (resolução do ataque), overlap de toque.
