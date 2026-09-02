---
agent_context: frontend
target_module: src/game/scenes/GameScene.ts
priority: medium
status: complete
last_updated: 2026-09-02
tags: [architecture, phaser, refactor, tracker]
---
# 🧩 Refactor do GameScene.ts — Histórico e Estado Atual

`GameScene.ts` cresceu organicamente até ~117KB / ~2900 linhas — um único
arquivo concentrando spawn de inimigos, geração de masmorra, colisões,
habilidades do jogador, scavenging, feedback de combate/morte e o loop
`update()`. Este documento registra a extração em blocos, para quem chegar
depois entender o que já foi movido, para onde, e por quê.

Padrão seguido em toda extração: ver item 4 ("Extração/Delegação de
GameScene") em `03_PHASER_PATTERNS.md`.

## Estado atual: refactor concluído

Após a extração dos subsistemas, `GameScene.ts` caiu inicialmente de **~2900 → 1486 linhas**. Com a adição de novas mecânicas de gameplay e efeitos áudio/visuais pós-refactor, o arquivo atualmente conta com **1946 linhas** (~85KB). Todos os blocos de responsabilidade única mapeados originalmente permanecem devidamente extraídos.

| Sistema extraído | Arquivo | Responsabilidade |
|---|---|---|
| `PlayerSkillSystem` | `systems/PlayerSkillSystem.ts` | Execução das 6 habilidades do jogador (nova, syphon, bone shield, crimson scythe, ritual circle, hemomancy beam), drag-to-aim, input de skills via gamepad, blood bolt. |
| `CollisionHandlers` | `systems/CollisionHandlers.ts` | Callbacks de `physics.add.overlap` — projétil×parede/inimigo, baú, dano ao jogador, coleta de orbs/loot. |
| `DungeonFlowController` | `systems/DungeonFlowController.ts` | Geração de masmorra/piso, fila de spawn de inimigos, portal de descida, avanço de andar. |
| `ScavengingSystem` | `systems/ScavengingSystem.ts` | Scavenging de corpses/skeletons/player_corpse e uso rápido de curativos (ataduras/antídotos/antibióticos). |
| `CombatEffectsSystem` | `systems/CombatEffectsSystem.ts` | Texto flutuante, slash de melee, combo kill, gore procedural, `handleEnemyDeath` (dismemberment/loot/XP), level-up e game over. |

## `update()` — extração parcial, por escolha deliberada

O loop `update(time, delta)` (~550 linhas) **não** foi movido para um
`systems/` separado. Ele fica fortemente acoplado ao ciclo de física/input/
câmera a cada frame, e externalizá-lo por completo exigiria expor uma
quantidade grande de campos internos como `public` só para um único
consumidor — risco real de regressão sem ganho de organização proporcional.

Em vez disso, dois blocos de renderização auto-contidos foram extraídos como
métodos **privados dentro da própria `GameScene`**:
- `updateDragAimPreview()` — desenho do preview de drag-to-aim (arco/beam/
  círculo, por spell ativo).
- `updateThreatIndicator(time)` — chevrons de ameaça fora da tela + áudio
  espacial/tinnitus.

Isso já reduziu ~160 das ~550 linhas de `update()` sem tocar em acoplamento
entre arquivos. O restante (input de movimento/skills, atualização de
player/inimigos, dodge de projétil, y-sorting, telemetria) permanece inline
por operar diretamente sobre o estado por-frame da cena.

## Se for extrair algo novo no futuro

Antes de criar um novo `systems/*.ts`:
1. Meça o bloco (`wc -l`, ou leia e conte responsabilidades).
2. Liste os campos/métodos que ele lê e escreve — esses precisam virar
   `public` com o comentário `// público: usado por <Classe>`.
3. Confira se o método tem nome referenciado por `physics.add.overlap`,
   `.on(...)` ou `.bind(this)` em algum listener — se sim, o wrapper
   delegador em `GameScene` é obrigatório (não dá para só apagar o método
   original).
4. Rode `pnpm verify` antes e depois da extração.
