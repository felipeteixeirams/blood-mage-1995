# Avaliação arquitetural: Phaser 4.2.1 e renderização procedural avançada (parte 4: Matriz de priorização, riscos e referências)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** não verificado

Parte 4 de 4. Índice das partes: [README.md](README.md).

## Matriz de Priorização

| Eixo | Impacto visual | Esforço | Assets externos | Fase sugerida |
|------|----------------|---------|-----------------|---------------|
| **A. Filtros postFX** | Alto | Médio | Não | Fase 3 (agora) |
| **A. Iluminação + normal maps** | Muito Alto | Médio-Alto | Não (normal maps procedurais) | Fase 3 (agora) |
| **B. Pipeline de assets** | — (habilita Fase 3+ arte) | Baixo | — | Quando arte externa for aprovada |
| **C. Áudio/trilha híbrida** | Médio | Alto | Sim (música) | Fase 3+, decisão de produção |

> **Recomendação:** implementar o **Eixo A** antes de qualquer decisão de arte externa. O Eixo A valida o teto de qualidade procedural e informa se/pra quando a produção de sprites é necessária — evita investimento prematuro.

---

## Riscos e Mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Iluminação Light2D custa FPS em mobile | Alto | `maxLights` baixo, raios curtos, toggle de performance, validar com `PerformanceMonitor` |
| Filtros WebGL quebram em Canvas | Médio | Manter `ScreenEffects` como fallback; feature-detect de WebGL |
| Normal maps procedurais ficam "falsos" | Médio | Gerar por derivada do sprite + ajuste manual via Laigter |
| PWA offline + áudio grande | Médio | Streaming, cache estratégia por tipo de arquivo |

---

## Referências

- `_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md` — spec-alvo (contextos 4 e 7, matriz Fase 3)
- `01_TECH_STACK.md` — stack atual (Phaser 4.2.1, Vite 7)
- `02_PERFORMANCE_OPTIMIZATION.md` — gates de performance
- `04_PERFORMANCE_METRICS.md` — métricas a validar
- `00_DUNGEON_SIEGE_EVOLUTION.md` — roadmap geral de features
