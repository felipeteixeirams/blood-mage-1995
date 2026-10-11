# Arquivos Críticos

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Arquivos cuja alteração incorreta tem maior chance de causar regressão. Cada item abaixo foi conferido contra o código em 2026-10-10 (leitura estática; nenhum teste foi executado). Os níveis são uma classificação de cautela, não uma regra de negócio: o responsável do projeto decide o que pode ou não ser alterado.

## Nível 1: maior risco

### `src/game/objects/Player.ts` (1368 linhas)

| Fato (código hoje) | Local |
|---|---|
| `ACCELERATION = 1400` e `DECELERATION = 1000` são constantes privadas | linhas 61-62 |
| Velocidade base não é constante: `baseMoveSpeed = 160` somado a bônus de talentos (`statKey === 'moveSpeed'`), lida em `getEffectiveMoveSpeed()` | linhas 97-108, 275 |
| Movimento por aceleração: `moveToward(atual, alvo, maxDelta)` (método privado) aplicado a `currentVx/currentVy` no bloco "Movement Physics" | linhas 410-422, 1274 |
| `takeDamage(amount): boolean` retorna `false` se invulnerável, inconsciente ou morto; aplica Bone Shield (x0.7) e infecção (x1.2); com HP em 0: na 1ª e 2ª vez (`knockoutCount < 2`) entra em `isUnconscious` e retorna `false`; na 3ª marca `isDefinitivelyDead` e retorna `true` | linhas 1179-1230 |
| Ao sobreviver ao golpe: `isInvulnerable = true` com `invulnerableTimer = 800` (ms) | linha 1239 |
| Segundo caminho de nocaute/morte, para dano de status: `applyStatusDamage()` com a mesma lógica de `knockoutCount` | linhas 1151-1177 |

Consumidores do contrato de `takeDamage` e dos flags `isUnconscious`/`isDefinitivelyDead`: `Enemy.ts`, `GameScene.ts`, `gameStore.ts`.

### `src/game/objects/Enemy.ts` (1326 linhas)

| Fato (código hoje) | Local |
|---|---|
| Estados de IA (`AIState`, em `src/types/game.ts`): `idle`, `patrol`, `patrol_away_from_player`, `investigating`, `combat`, `flee`, `frenzy` (7 estados) | `src/types/game.ts:129` |
| Máquina de estados em `updateEnemy(time, delta, playerX, playerY, hasWallBetweenPlayer, activeEnemies)` com `switch` por `aiState` | linhas 402, 624-770 |
| `canSeePlayer(playerX, playerY, hasWallBetween)` recebe o resultado do raycast já calculado; não faz raycast. Retorna `false` se o jogador está inconsciente/morto, se o inimigo é `totally_passive`, ou `defensive` sem estar irritado | linhas 230-250 |
| Distância de visão: `config.visionDistance` (padrão 320), x1.5 para `highly_aggressive`, no máximo 120 para `territorial` | linhas 244-250 |
| Audição: raio efetivo = `loudness * hearingSensitivity * multiplicador`, reduzido a 40% com parede entre | linha 273 |
| Movimento por aceleração com taxa por comportamento (`swarmer` 2400, `chaser` 1200, `charger` 600, `boss` 480, `ranged` 900) e `_moveToward` | linhas 940-986 |

O raycast real está em `DungeonGenerator.hasLineOfSight()` (abaixo); `GameScene.hasLineOfSight()` é um wrapper de uma linha.

### `src/game/scenes/GameScene.ts` (2021 linhas)

| Fato (código hoje) | Local |
|---|---|
| `update(time, delta)` é o loop principal | linha 1050 |
| Colliders: jogador x paredes, inimigos x paredes, inimigos x inimigos, jogador/inimigos x barris, jogador x baús, entre outros; overlaps de projéteis, armadilhas e coletáveis | linhas 571-730 |
| `dungeonGenerator` é instância (`new DungeonGenerator(this, wallsGroup, chestsGroup)`) | linha 293 |
| Poda de visão por distância antes do raycast (ver [performance-optimization](performance.md)) | linhas 1595-1620 |
| Lógica extraída para sistemas existentes em `src/game/systems/`: `PlayerSkillSystem`, `CollisionHandlers`, `DungeonFlowController`, `ScavengingSystem`, `CombatEffectsSystem` | `src/game/systems/` |

### `src/game/systems/DungeonGenerator.ts` (818 linhas)

| Fato (código hoje) | Local |
|---|---|
| `generate(mapW, mapH, biome = 'fosso_chagas', _offsetX, _offsetY): RoomData[]`; para `gloomy_woods` delega a `ProceduralForestGenerator` | linhas 76-86 |
| Layout por partição BSP (`bspSplit`) com autômato celular | linhas 121-126 |
| `hasLineOfSight(x1, y1, x2, y2): boolean`: poda AABB sobre as paredes e `Phaser.Geom.Intersects.LineToRectangle` com `cachedLine`/`cachedRect` reutilizados | linhas 55-56, 788-815 |
| `isTraversable()` delega a `HeightmapGenerator` (semente 1995) | linhas 57, 68-73 |
| Usa `DungeonDetailFactory` e `SafeHouseDetailFactory` | linhas 6-7 |
| Chamado por `GameScene.ts` (wrapper) e `DungeonFlowController.ts` (linhas 151 e 360) | |

## Nível 2: risco alto

### `src/store/gameStore.ts` (1272 linhas) e `src/utils/localStorage.ts` (902 linhas)

- `gameStore.ts` é o store Zustand (`create` de `zustand`) e importa os `load*`/`save*` de `localStorage.ts`. Ele não importa Zod; a validação mora em `localStorage.ts`.
- `localStorage.ts` define schemas Zod e usa `safeParse` nas leituras. Os schemas de talentos, configurações e recordes usam `.strict()` (comentário no código: evita chaves extras). Nem todo schema do arquivo foi conferido individualmente.
- Alterar o formato de um campo persistido exige tratar dados antigos no `load*` correspondente (valor padrão quando a validação falha).

### `src/game/PhaserGame.tsx` (254 linhas)

| Fato (código hoje) | Local |
|---|---|
| Cria `new Phaser.Game(config)` com `scene: [BootScene, GameScene]` | linhas 72-75 |
| Escala `Phaser.Scale.RESIZE` com `autoCenter: CENTER_BOTH` | linhas 61-64 |
| Física `arcade`, gravidade `{ x: 0, y: 0 }`, `debug: false` | linhas 65-71 |
| `input.activePointers: 3`, `audio.noAudio: true` | linhas 55-60 |
| `TitleScene`, `SettingsScene` e `RecordsScene` não entram nessa instância: cada uma roda em instância própria de `Phaser.Game`, criada em `MainMenu.tsx` (linha 44), `SettingsModal.tsx` (25) e `HighScoresModal.tsx` (20) | |

## Nível 3: monitorar

### `src/components/GameplayHUD.tsx` (877 linhas)

- Componente raiz do HUD React; usa `useCallback` (ex.: `handlePauseToggle`, linha 87). Não usa `React.memo` neste arquivo.
- `RecordsDisplay` é sempre montado e recebe `isOpen` como prop (linhas 868-871); a decisão de renderizar é interna ao componente.

## Não verificado

- Que os colliders listados são os únicos necessários ao jogo (só foi conferida a existência).
- Impacto real de alterar a ordem das chamadas em `GameScene.update` (sem medição ou teste).
