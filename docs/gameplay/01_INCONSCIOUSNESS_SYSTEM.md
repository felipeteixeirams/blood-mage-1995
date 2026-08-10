---
agent_context: backend, game designer
target_module: artifacts/bloodmage/src/game
priority: high
status: complete
last_updated: 2026-08-10
tags: [gameplay, unconsciousness]
---
# 🩸 Sistema de Inconsciência do Jogador

Inspirado na evolução de jogabilidade do Dungeon Siege, a morte no Bloodmage 1995 não é imediata. O jogador possui uma rede de segurança representada por estados de inconsciência antes da morte definitiva.

## ⚙️ Regras do Sistema
- **1º e 2º Desmaios (Knockouts)**: Quando o HP do jogador atinge 0, em vez de morrer, ele cai inconsciente (`isUnconscious = true`). Inimigos perdem o aggro (interesse) e se afastam. O jogador regenera passivamente 2% de vida por segundo. Uma vez recuperada uma quantidade segura de vida, ele levanta e continua a batalha.
- **3º Desmaio (Morte Definitiva)**: Caso o HP atinja 0 pela terceira vez na mesma run, o jogador falece definitivamente (`isDefinitivelyDead = true`). É exibida a tela de Fim de Jogo (Game Over), e o jogador dropa um cadáver com seus pertences na masmorra.
