---
agent_context: vfx-engineer, graphics-programmer
target_module: docs/specs/delivered
priority: medium
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, particles, vfx, advanced-particles, performance, gore]
---

# 🎆 Spec 20: Sistema de Partículas Avançadas (Advanced Particles System)

## Objetivo
Gerenciar a emissão de efeitos visuais de alta fidelidade para sangue, gore, atmosfera e feitiços no motor Phaser 4 (`ParticleEmitter`), oferecendo suporte a emissores ambientais contínuos e escalonamento dinâmico de desempenho para dispositivos móveis.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Tipos de Partículas de Combate Realistas:**
  1. `blood_splatter`: Spray de sangue vermelho com gravidade real e espalhamento.
  2. `bone_dust`: Partículas de poeira óssea bege/cinza (`0xdcd3c1`).
  3. `acid_splash`: Respingo ácido verde-limão corrosivo (`0x84cc16`).
  4. `spectral_burst`: Explosão mística roxa (`0xa855f7`).
  5. `critical_hit`: Faíscas douradas/brancas de acerto crítico (`0xfacc15`).
- **Emissores Ambientais e de Trilha:**
  - `atmospheric_fog`: Névoa rasteira translúcida em baixa profundidade (`setDepth(-1)`).
  - `torch_embers`: Brasas de tochas ascendentes com variação de cor (`0xff9900`, `0xffd700`, `0xff5500`).
  - `spell_trail` & `emitDashTrail`: Rastros sombrios e faíscas rubro-espectrais que acompanham projéteis e o dash do jogador.
- **Modo de Desempenho / Baixa Performance:**
  - Leitura dinâmica da flag `lowPerformanceParticles` das configurações.
  - Redução automatizada da contagem de partículas emitidas (redução de ~55%) em dispositivos de menor capacidade para preservar 60 FPS.

---

## Referência no Código
- `src/game/systems/AdvancedParticles.ts` — Classe central de gerenciamento de emissores em Phaser 4.
- `src/game/systems/AdvancedParticles.test.ts` — Testes unitários do ciclo de vida dos emissores.
- `src/game/objects/Player.ts` — Invocação de `emitDashTrail` e rastros durante esquivas.
- `src/game/objects/Enemy.ts` — Invocação de `emitMonsterGore` ao sofrer acertos ou morrer.
- `src/game/scenes/GameScene.ts` — Inicialização de partículas ambientais via `startAmbient(worldWidth, worldHeight)`.

---

## Validação
- Testes unitários dedicados em `AdvancedParticles.test.ts` aprovados sem falhas.
- Verificação do TypeScript concluída com 0 erros (`pnpm run typecheck`).
- Testado em taxas de quadros de 60 FPS sem gargalos de CPU/GPU.

---

## Notas
- O sistema usa a API moderna de emissores diretos do Phaser 4 (`scene.add.particles`), evitando classes obsoletas do Phaser 3.
