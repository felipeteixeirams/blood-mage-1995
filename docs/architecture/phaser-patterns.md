# Padrões de Código no Phaser

**Mestre:** [architecture](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Padrões que o código de `src/game/` usa hoje. Verificação por leitura estática; nenhum teste ou build foi executado. Lista de sistemas: [game-systems.md](game-systems.md). Arquivos de risco e bugs conhecidos: [../critical/README.md](../critical/README.md).

## Reaproveitamento de objetos

| Mecanismo | Onde | Fato |
|---|---|---|
| `ObjectPool<Projectile>` | `GameScene` (`playerProjectilePool`, `enemyProjectilePool`), `systems/ObjectPool.ts` | Projéteis são reciclados em vez de destruídos (`Projectile.ts` documenta o suporte a pooling) |
| Grupos de física | `GameScene.create()` | `enemiesGroup`, `playerProjectilesGroup`, `enemyProjectilesGroup`, `collectiblesGroup`, `lootGroup` (`physics.add.group`); `depthGroup` e `bloodStainsGroup` (`add.group`) |
| Decals de sangue | `BloodSplatterSystem` | Ao atingir a capacidade máxima, recicla o decal mais antigo (FIFO) |

Não foi verificado se textos flutuantes ou outros efeitos usam pool.

## IA de inimigos

- `AIState` (`src/types/game.ts`): `idle`, `patrol`, `patrol_away_from_player`, `investigating`, `combat`, `flee`, `frenzy` (7 estados). `Enemy.aiState` guarda o estado atual.
- Ataque em fases: `Enemy.attackPhase` é `none | windup | strike | recovery`; `startWindup()` inicia o telégrafo (desenhado por `EnemyTelegraphSystem`).
- Poda antes de raycast, no loop de `GameScene.update()`: inimigos passivos fora da viewport (`ViewportCuller`) pulam o tick de IA; para estados que não são de combate o `hasLineOfSight` só roda se o jogador está dentro de `config.visionDistance` (padrão 320 px); em combate a checagem vale até 800 px. A distância usada é `Phaser.Math.Distance.Between` (com raiz), não distância quadrada. Para ruídos (`GameScene` ~linha 984), o raycast só ocorre se o inimigo está dentro do alcance de audição.
- `ViewportCuller` (margem 150) esconde só a visibilidade, nunca `active`, para não quebrar `countActive()` usado na detecção de fim de piso.

## Extração/delegação de `GameScene`

Como os cinco sistemas extraídos (`PlayerSkillSystem`, `CollisionHandlers`, `DungeonFlowController`, `ScavengingSystem`, `CombatEffectsSystem`) estão ligados hoje:

- Cada um é uma classe com `constructor(private scene: GameScene)`, instanciada em `GameScene.create()`.
- Campos e métodos da cena que eles precisam ler ficam `public`, com o comentário `// público: usado por <Classe>` (50 ocorrências de comentário `// públic...` em `GameScene.ts`).
- Os métodos antigos de `GameScene` permanecem como wrappers finos de mesmo nome (por exemplo `hasLineOfSight()` delega a `dungeonGenerator`), porque callbacks de física e listeners os referenciam pelo nome.

## Renderização procedural

- Texturas pesadas são geradas uma vez com `textures.addDynamicTexture(...)` (`SafeHouseDetailFactory`, `TerrainDetailFactory`, `ProceduralForestGenerator`, com checagem `typeof ... === 'function'`).
- Shader atmosférico das árvores: `src/game/shaders/AtmosphericTreeShader.ts` (usa `ShaderQuadConfig` e `setupUniforms`), consumido por `ProceduralForestGenerator`.
- `BootScene` chama `generateGameTextures(this, { force: false })`: texturas procedurais servem de fallback para assets que não carregaram.

## Skills especializadas

`.claude/skills/` contém seis skills de Phaser 4: `phaser-4-animation-tweens`, `phaser-4-development`, `phaser-4-fx-filters`, `phaser-4-physics-combat`, `phaser-4-playtest-harness`, `phaser-4-procedural-generation`. O conteúdo delas não foi auditado aqui.
