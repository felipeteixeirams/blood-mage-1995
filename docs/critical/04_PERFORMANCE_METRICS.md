---
agent_context: all devs
target_module: root
priority: medium
status: active
last_updated: 2026-08-09
tags: [critical, performance, metrics]
---
# 📊 Métricas de Performance Esperadas

Aqui estão registradas as métricas ideais de performance de CPU, renderização de tela e consumo de memória recomendadas para manter o Bloodmage 1995 leve e jogável em dispositivos móveis e desktops de baixo custo.

## 🎯 Metas de Telemetria
- **Taxa de Quadros (Frame Rate)**: 60 FPS estáveis na maioria dos frames. Quedas temporárias abaixo de 55 FPS só são permitidas durante explosões intensas de sangue ou mais de 35 projéteis de magias ativos na tela.
- **Uso de Memória Heap JS**: Menor que 100 MB após 10 minutos contínuos de jogabilidade, garantindo ausência de vazamentos de memória e prevenindo travamentos em navegadores de smartphones.
- **Draw Calls de Renderização (GPU)**: Limitar a menos de 45 draw calls por cena do Phaser através do uso de spritesheets agrupados e atlas de texturas.
