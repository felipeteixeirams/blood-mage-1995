---
agent_context: level-designer, gameplay-engineer
target_module: docs/specs/delivered
priority: medium
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, traps, environment, hazards, interaction]
---

# 🕸️ Spec 12.01: Interações de Ambiente e Armadilhas (Dungeon Depth)

## Objetivo
Aprofundar o perigo do ambiente e a imprevisibilidade de navegação nas masmorras procedurais através da introdução de armadilhas mecânicas com ciclos temporais e elementos destrutíveis voláteis com física de dano em área (AoE).

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Espinhos de Chão (Spike Traps):**
  - Sistema de estados de ciclo temporal de 3 fases: *Oculto (Hidden)* -> *Alerta/Preparando (Warn)* -> *Ativo/Dano (Active)*.
  - Inflige dano físico contínuo com cooldown interno para entidades (jogador e inimigos) que sobrepõem os espinhos durante a fase ativa.
- **Barris Explosivos (Explosive Barrels):**
  - Entidades destrutíveis que reagem a projéteis disparados pelo jogador ou magias.
  - Ao sofrer colisão com projétil, acionam explosão instantânea com raio de dano em área (AoE), repulsão física (knockback) e tremores de câmera (*camera shake*).
- **Geração Procedural & Texturas:**
  - Inserção de armadilhas procedurais no gerador de masmorra em salas de combate (40% de chance para espinhos e 30% para clusters de barris).
  - Geração procedural 2D de texturas canvas fallback para `spr_spike_hidden`, `spr_spike_warn`, `spr_spike_active` e `spr_barrel`.

---

## Referência no Código
- `src/game/objects/Traps.ts` — Classes `SpikeTrap` e `ExplosiveBarrel` estendendo `Phaser.Physics.Arcade.Sprite`.
- `src/game/systems/DungeonGenerator.ts` — Algoritmo de posicionamento procedural em salas de combate.
- `src/game/systems/CollisionHandlers.ts` — Lógica de colisão de projéteis com barris e sobreposição com espinhos.
- `src/game/scenes/GameScene.ts` — Gerenciamento dos grupos físicos `spikeTrapsGroup` e `barrelsGroup`, repasse de dano e tremores de câmera.
- `src/utils/textureGenerator.ts` — Procedural canvas generator para os sprites de armadilhas e barris.

---

## Validação
- Execução de suíte de testes unitários passando sem regressões (`pnpm test`).
- Verificação de compilação rigorosa do TypeScript (`pnpm run typecheck`).
- Geração procedural validada sem estouros de memória ou exceções de sprites nulos.

---

## Notas
- Espinhos de chão aplicam dano tanto ao jogador quanto aos inimigos, permitindo uso estratégico do cenário em combate.
- Armadilhas e barris são spawnados no centro e bordas das salas, mantendo os corredores de transição desobstruídos.
