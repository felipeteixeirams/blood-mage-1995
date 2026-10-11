# Inimigos e Bestiário

**Mestre:** [gameplay](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `src/data/monsters.json`, `src/data/waves.json`, `src/game/objects/Enemy.ts`, `src/game/scenes/GameScene.ts`

Classe `Enemy`, IA, bestiário (`src/data/monsters.json`), chefe, afixos de elite e ondas (`src/data/waves.json`). Leitura estática; contagens feitas por script sobre os JSONs. Ataque, dano e gibs: ver `combat`.

## Bestiário (12 registros)
Contagem por `behavior`: chaser 5, charger 3, swarmer 2, ranged 1, boss 1. Por `temperament`: aggressive 5, tactical 3, relentless 3, timid 1. **Os JSONs não têm campos `tier` nem `type`.** Existem 11 monstros comuns + 1 chefe.

| id | hp | dano | vel | alcance | behavior | temperament | xp | score | dodge |
|---|---|---|---|---|---|---|---|---|---|
| scout_beast | 40 | 8 | 80 | 30 | charger | aggressive | 12 | 60 | 0.08 |
| skeleton_warrior | 85 | 12 | 68 | 28 | chaser | timid | 15 | 100 | 0.15 |
| cultist_acolyte | 75 | 18 | 50 | 160 | ranged | tactical | 20 | 150 | 0.35 |
| hell_hound | 90 | 16 | 95 | 32 | charger | aggressive | 25 | 200 | 0.10 |
| flesh_golem | 330 | 35 | 42 | 40 | chaser | relentless | 60 | 500 | 0 |
| blood_specter | 150 | 22 | 75 | 30 | swarmer | tactical | 35 | 300 | 0.45 |
| zombie_shambler | 110 | 14 | 48 | 30 | chaser | relentless | 22 | 140 | 0 |
| vampire_stalker | 165 | 22 | 90 | 34 | chaser | tactical | 40 | 350 | 0.30 |
| werewolf_lycan | 140 | 22 | 85 | 36 | charger | aggressive | 35 | 350 | 0.15 |
| bat_swarm | 38 | 9 | 105 | 22 | swarmer | aggressive | 12 | 80 | 0.45 |
| gore_abomination | 200 | 28 | 45 | 45 | chaser | relentless | 75 | 650 | 0 |
| necro_lord_boss | 1800 | 45 | 52 | 190 | boss | aggressive | 300 | 2500 | 0.20 |

Outros campos do JSON: `spriteKey`, `goreEffect` (`blood_splatter_red`, `bone_dust`, `spectral_burst`), `gaitType`, `bodyType`, `fragility`, `visionDistance` (220 a 320), `visionConeDegrees` (90 a 180), `hearingSensitivity` (0.6 a 1.8), `courage`, `color`, `scale`, `executionFragments`/`executionImpulse`/`executionBloodScale` (usados em gibs).

`statusEffectOnHit` (aplicado ao jogador pelo golpe/projétil): scout_beast, skeleton_warrior bleeding 15%; hell_hound bleeding 30%; werewolf_lycan bleeding 35%; flesh_golem infection 20%; zombie_shambler infection 30%; blood_specter poison 25%; gore_abomination poison 30%. Sem status: cultist_acolyte, vampire_stalker, bat_swarm, necro_lord_boss.

Habilidades por id em `Enemy`/`CombatEffectsSystem`: `vampire_stalker` rouba 40% do dano causado em melee; `werewolf_lycan` uiva ao cair abaixo de 50% de HP (escala x1.25 e entra em frenzy); `zombie_shambler` solta 2 `bat_swarm` ao morrer; `gore_abomination` explode ao morrer.

## Escala por andar e afixo (construtor de `Enemy`)
- HP final = `round(hp * (1 + 0.06*(andar-1)) * afixoHp)`; dano = `round(dano * (1 + 0.04*(andar-1)) * afixoDano)`.
- Velocidade individual = `speed * (0.85 a 1.15 aleatório) * afixoVel`. Escala do sprite x1.15 se elite.
- Se o modificador `fury_pit` está ativo, ou o afixo é `frenzied`, nasce em `frenzy`; senão 60% `patrol`, 40% `idle`.

## Afixos de elite (`EliteAffix`)
| Afixo | HP | Dano | Vel | Efeito (em `Enemy`) |
|---|---|---|---|---|
| frenzied | | x1.25 | x1.35 | nasce em `frenzy` |
| vampiric | x1.4 | | | rouba 40% do dano causado em melee |
| cursed | x1.3 | | | recebe x1.25 de dano |
| spectral | | | x1.2 | alfa 0.8; dodge +0.35 (máx 0.7), recarga de esquiva 1200 ms (padrão 2000); ignora checagem de terreno |
| teleporter | x1.25 | | x1.15 | teleporta ao flanco a cada 4200 ms (em combate, `dist > 110`) e 45% de chance ao ser atingido (recarga 2800 ms) |
| reflective | x1.35 | | | dano recebido x0.65, mostra "REFLETIDO!", `spawnReflectedSpark` |

Cada afixo tem tint, halo (círculo r 18) e glow próprios (glow só em WebGL). Elite morto dá 4 a 7 cristais. Alvo no HUD mostra o nome com o afixo e marca `isBoss` para elite e chefe.

**Spawn de elite** (`DungeonFlowController.checkAndSpawnPendingEnemies`): só no andar >= 2, com chance `min(0.25, 0.08 + (andar-1)*0.03)`, afixo sorteado entre os seis. Chefe e guarda-costas nascem sem afixo. Limite de inimigos ativos: 18 (andar <= 3), 24 (andar 4), 30 (andar >= 5); o resto espera em `pendingEnemySpawns`.

## Estados da IA (`AIState`)
| Estado | Comportamento |
|---|---|
| idle | parado, olha ao redor |
| patrol | vai entre `patrolP1` e `patrolP2` a 45% da velocidade, espera 2 a 4 s nos pontos |
| patrol_away_from_player | andar 200 a 300 px para longe quando o jogador cai; depois `idle` |
| investigating | vai ao ponto do ruído a 65% da velocidade; após 3500 ms volta a `patrol` |
| combat | comportamento de `behavior` (abaixo) |
| frenzy | igual a combat com velocidade x1.35 e tint carmesim pulsante |
| flee | foge do jogador a x1.25; após 5 s uiva e emite som raio 660 ("CHAMOU REFORÇOS!") |

Transições (`updateEnemy`, `canSeePlayer`, `onHearNoise`, `alertToCombat`):
- Idle/patrol/investigating => `combat` se `canSeePlayer`: distância `visionDistance` (x1.5 se `highly_aggressive`; máx 120 se `territorial`), cone `visionConeDegrees`, sem parede. `totally_passive` nunca vê; `defensive` só após ser ferido.
- Ruído: `emitSound` com raio * `hearingSensitivity` (x0.4 com parede) => `investigating` (`totally_passive` foge). Tiro do jogador emite 360, golpe de adaga 180.
- Ser ferido chama `alertToCombat`; o acerto também alerta inimigos num raio de 220.
- `timid` em combate com `hp/maxHp < courage` => `flee` (só `skeleton_warrior`, courage 0.35, usa este ramo no bestiário atual).
- `aggressive` em combate/investigating com `hp/maxHp < 0.5` => `frenzy`.
- Jogador inconsciente/morto: `patrol_away_from_player`.
- Otimização: fora de combate, `GameScene` só calcula linha de visão se o jogador está dentro de `visionDistance` (padrão 320).

## Movimento por behavior (em combat/frenzy)
| behavior | Movimento | Aceleração (px/s²) |
|---|---|---|
| swarmer | voo em onda senoidal em direção ao jogador | 2400 |
| chaser | persegue com zigue-zague leve; x1.15 a menos de 150 px | 1200 |
| charger | a menos de 240 px trava o vetor e acelera x1.7; antes disso `physics.moveTo` | 600 |
| ranged / boss | mantém entre 80% e 100% do `attackRange`: avança, recua (x0.95) ou desliza de lado (x0.35) | 900 (ranged), 480 (boss) |

Outros: separação entre inimigos (raio 34 px), x0.70 de velocidade em tiles de água, bloqueio de parede por `DungeonGenerator.isTraversable` a 16 px (exceto etéreos, voadores, spectral), flutuação para `gaitType 'ethereal'`, esquiva lateral de projétil (`dodgeChance`, recarga 2000 ms, passo 220 ms a x1.8 da velocidade, só com projétil entre 30 e 180 px). Com HP < 40%: partículas de sangue a cada 800 ms e andar manco.

## Chefe
`necro_lord_boss` (`behavior boss`, 1800 HP, alcance 190, ranged 400 ms de windup, projétil 220). Nasce na sala `type === 'boss'` de cada andar: `currentWave.bossMonsterId` se `isBossWave`, senão `necro_lord_boss` como padrão. Vem com 2 `cultist_acolyte` de guarda-costas (round(2*1.4) = 3 com `blood_tide`). Entra em `frenzy` abaixo de 50% de HP (`aggressive`). A morte do chefe dispara `postFX.triggerShockwave(600, 0.75)`. Dica de onboarding "Senhor das Chagas" ao aparecer.

## Ondas (`waves.json`)
7 registros. Índice usado: `waveConfigs[min(andar-1, 6)]`; só `monsterPool` e (no chefe) `isBossWave`/`bossMonsterId` são lidos.

| Onda | totalMonsters | spawnIntervalMs | Pool | Chefe |
|---|---|---|---|---|
| 1 | 16 | 1700 | skeleton_warrior, cultist_acolyte, bat_swarm | não |
| 2 | 24 | 1450 | skeleton_warrior, cultist_acolyte, zombie_shambler, bat_swarm | não |
| 3 | 32 | 1250 | skeleton_warrior, hell_hound, zombie_shambler, cultist_acolyte | não |
| 4 | 40 | 1050 | hell_hound, zombie_shambler, vampire_stalker, blood_specter | não |
| 5 | 48 | 900 | werewolf_lycan, blood_specter, vampire_stalker, flesh_golem | não |
| 6 | 54 | 800 | flesh_golem, gore_abomination, werewolf_lycan, blood_specter | não |
| 7 | 60 | 750 | gore_abomination, blood_specter, werewolf_lycan, vampire_stalker | sim, `necro_lord_boss` |

- `totalMonsters` e `spawnIntervalMs` não são lidos em nenhum arquivo de `src` além do tipo `WaveConfig`.
- Sala comum: `2 + (0 ou 1) + min(2, andar-1)` inimigos, x1.4 com `blood_tide`, sorteados do `monsterPool`; a sala `spawn` não recebe inimigos. A sala `boss` (marcada no `DungeonGenerator`) recebe o chefe em qualquer andar, não só na onda 7.
- Bioma `gloomy_woods`: 4 inimigos fixos (`scout_beast`; por zona do mapa: lago `gore_abomination`, ruínas `skeleton_warrior`, caverna `bat_swarm`), sem chefe nem elite.
- `spawnInitialSiege` (andar 1): 3 `scout_beast` e 1 `skeleton_warrior` fixos em torno da sala de spawn.
- Fallback: id desconhecido em `new Enemy` usa `skeleton_warrior`.

## Onde fica no código
- `src/game/objects/Enemy.ts`: construtor, `updateEnemy`, `canSeePlayer`, `onHearNoise`, `alertToCombat`, `tryDodgeProjectile`, `teleportNearPlayer`, `accelerateToward`/`getAccelRate`.
- `src/data/monsters.json`, `src/data/waves.json`; tipos `MonsterConfig`, `AIState`, `EliteAffix`, `WaveConfig` em `src/types/game.ts`.
- `src/game/systems/DungeonFlowController.ts`: `buildDungeonMap`, `checkAndSpawnPendingEnemies`, `getActiveEnemyCap`.
- `src/game/systems/CombatEffectsSystem.ts`: `handleEnemyDeath` (habilidades de morte, recompensa de elite).
- `src/game/scenes/GameScene.ts`: loop `enemiesGroup`, `emitSound`, `hasLineOfSight`.

Relacionados: [combat](combat.md), [status-and-feedback](status-and-feedback.md); [phaser-patterns](../architecture/phaser-patterns.md) (IA e pooling), [risky-files](../engineering/risky-files.md).
