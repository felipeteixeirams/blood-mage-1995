---
agent_context: frontend
target_module: src
priority: high
status: active
last_updated: 2026-08-09
tags: [critical, performance]
---
# ⚡ Otimização de Performance e Taxa de Quadros (60 FPS)

Para garantir que o Bloodmage 1995 execute a estáveis 60 FPS no navegador, mesmo com 50+ entidades simultâneas, implementamos as seguintes otimizações de nível de motor.

## ⚙️ Técnicas de Otimização
1. **Pruning Espacial AABB**:
   - Antes de realizar o complexo e caro cálculo trigonométrico de campo de visão (`LineToRectangle` ou `hasLineOfSight`) de um monstro para o jogador, calculamos a distância absoluta rápida em caixas bounding box. Se a distância em X ou Y for maior que 300 pixels, o monstro ignora o cálculo visual, salvando ciclos de CPU.
2. **Reuso de Formas Geométricas**:
   - Evitamos a instanciação excessiva de novos objetos `Phaser.Geom.Line` ou `Phaser.Geom.Rectangle` no loop de update do Phaser. Em vez disso, instanciamos objetos estáticos/fictícios compartilhados de classe e apenas redefinimos suas coordenadas via `.setTo(...)`.
3. **Evitar Math.sqrt**:
   - Comparações de distância usam distância quadrática (`dx * dx + dy * dy`) contra limiares pré-computados ao quadrado, eliminando o uso caro de raiz quadrada no loop de update.
