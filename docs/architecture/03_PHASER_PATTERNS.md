---
agent_context: frontend
target_module: src/game
priority: high
status: active
last_updated: 2026-08-09
tags: [architecture, phaser, patterns]
---
# 👾 Padrões de Desenvolvimento no Phaser

Bloodmage 1995 utiliza padrões consagrados no ecossistema do Phaser para garantir taxas de quadro estáveis de 60 FPS e prevenir vazamentos de memória (GC stutters).

## 🛠️ Padrões Adotados
1. **Reutilização de Objetos (Pooling)**:
   - Projéteis, efeitos de sangue, e danos flutuantes são reciclados usando `Phaser.GameObjects.Group` para evitar instanciar novas entidades frequentemente no loop de update.
2. **Pruning Espacial de IA**:
   - Inimigos realizam uma filtragem rápida por distância (distância quadrática) ou AABB antes de executar cálculos caros de raycasting de campo de visão ou som.
3. **Padrão State para FSM de Inimigos**:
   - Cada inimigo gerencia seu comportamento através de estados bem definidos (`idle`, `patrol`, `investigating`, `combat`, `frenzy`, `flee`), isolando as ações no ciclo de física.
