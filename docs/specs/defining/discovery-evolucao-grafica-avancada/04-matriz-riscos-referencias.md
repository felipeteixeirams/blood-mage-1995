# Evolução gráfica avançada: matriz, riscos e referências (parte 4)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): a matriz e os riscos são propostas; o que já está feito do Eixo A consta na [parte 2](02-eixo-a-graficos.md).

Parte 4 de 5. Índice das partes: [README](README.md).

## Escopo
Matriz de priorização proposta (sem aprovação; decisão 1 da parte 1):

| Eixo | Impacto visual | Esforço | Assets externos | Fase sugerida |
|---|---|---|---|---|
| A. Filtros postFX | Alto | Médio | Não | Agora (parte já feita) |
| A. Iluminação e normal maps | Muito alto | Médio-alto | Não | Agora (parte já feita) |
| B. Pipeline de assets | habilita arte externa | Baixo | n/a | Quando houver arte aprovada |
| C. Áudio e trilha híbrida | Médio | Alto | Sim (música) | Decisão de produção |

Recomendação do original: fazer o Eixo A antes de qualquer decisão de arte externa, para validar o teto da qualidade procedural e evitar investimento prematuro.

## Fora de escopo
Planejar fases e datas de produção.

## Arquivos e contratos
Nenhum arquivo é alterado por esta parte; ela só registra riscos e referências.

Riscos e mitigações propostas:

| Risco | Impacto | Mitigação |
|---|---|---|
| Light2D custa FPS em mobile | Alto | `maxLights` baixo, raios curtos, toggle de performance, medir com `PerformanceMonitor` |
| Filtros WebGL não existem em Canvas | Médio | Fallback decidido no ADR 0005; detectar WebGL (já feito por `isWebGL`) |
| Normal maps procedurais ficam "falsos" | Médio | Derivada do sprite e ajuste manual (Laigter) |
| PWA offline com áudio grande | Médio | Streaming e cache por tipo; `globPatterns` hoje não inclui `mp3`, `webp` nem `json` |

## Referências
- [lighting-and-effects](../../../gameplay/lighting-and-effects.md), [audio](../../../gameplay/audio.md), [performance](../../../engineering/performance.md), [performance-metrics](../../../engineering/performance-metrics.md), [asset-scripts](../../../operations/asset-scripts.md)
- [ADR 0005](../../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0006](../../../decisions/0006-audio-e-conquistas.md), [ADR 0013](../../../decisions/0013-metas-de-performance.md)
- [Assets externos e sprites](../discovery-assets-externos-e-sprites.md), [UI e assets externos](../discovery-ui-e-assets-externos/README.md)
- O original citava `_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md`, `01_TECH_STACK.md`, `02_PERFORMANCE_OPTIMIZATION.md`, `04_PERFORMANCE_METRICS.md` e `00_DUNGEON_SIEGE_EVOLUTION.md`; nenhum existe mais no repositório (verificado em 2026-10-11), então não são linkados.
