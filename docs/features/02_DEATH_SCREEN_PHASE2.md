---
agent_context: backend, frontend
target_module: artifacts/bloodmage/src/game
priority: high
status: complete
completion_date: 2026-08-10
last_updated: 2026-08-10
source_of_truth: docs/specs/finalizadas/02_FASE2_TELA_DE_MORTE_E_GORE.md
tags: [features, phase-2, death-screen]
---
# 🪦 Fase 2: Tela de Morte e Coleta de Cadáver (Corpse Retrieval)

Ao morrer de forma definitiva na masmorra, o jogador deixa para trás seus bens mais preciosos em um túmulo físico.

## ⚙️ Regras de Coleta
- **Criação do Cadáver**: Ao sofrer a morte definitiva, um objeto interativo `Corpse` é instanciado na posição exata `(x, y)` do jogador, guardando seu inventário atual.
- **Marcação no Mapa**: Uma lápide ou ícone fúnebre é exibido no minimapa e na bússola do jogador na run subsequente.
- **Resgate**: O jogador, ao retornar ao local do cadáver, pode interagir para recuperar 100% dos itens perdidos anteriormente. Caso o jogador morra novamente antes de coletar o cadáver antigo, este é destruído de forma definitiva.
