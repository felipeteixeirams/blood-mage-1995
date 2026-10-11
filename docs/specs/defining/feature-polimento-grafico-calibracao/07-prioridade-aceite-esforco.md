# Polimento gráfico por calibração dos sistemas existentes (parte 7: prioridade e esforço)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Existem as correções de integração das Frentes A e B e os sistemas com testes: `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection`; `AdvancedParticles.emitDirectional` restaura a rotação (teste existe). Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, calibração visual das Frentes C a H, testes de zona líquida do `ReflectionSystem` (só 2 testes), validação antes/depois e orçamento de performance medido.

Parte 7 de 8. Índice: [README](README.md).

## Anexo: prioridade e esforço

## 9. Matriz de Prioridade

| Frente | Impacto | Risco | Prioridade |
|---|---:|---:|---:|
| Glow e filtros reais | Muito alto | Médio | P0 |
| Pós-processamento e composição de estados | Muito alto | Médio | P0 |
| Iluminação e contraste | Alto | Médio | P0 |
| Atmosfera e visibilidade | Alto | Baixo | P1 |
| Sombras | Alto | Baixo | P1 |
| Reflexos | Médio | Baixo | P1 |
| Partículas e timing | Médio-Alto | Médio | P1 |
| Shader e terreno procedural | Médio | Médio | P2 |
| Lifecycle e ordem de renderização | Muito alto | Baixo | P0 |

---

## 10. Critérios globais de aceite

Movidos para a [parte 8](08-criterios-e-pendencias.md) (IDs `PG-`).

---

## 11. Estimativa de Esforço

| Etapa | Estimativa |
|---|---:|
| Baseline e diagnóstico | 0,5–1 dia |
| Correção de filtros e lifecycle | 1–2 dias |
| Calibração de iluminação e pós-processamento | 1–2 dias |
| Calibração de atmosfera, sombras e reflexos | 1–2 dias |
| Calibração de partículas e shader existente | 1–2 dias |
| Testes, preview e comparação visual | 1 dia |
| **Total estimado** | **5,5–10 dias** |

O esforço pode diminuir se os problemas de filtro forem apenas de inicialização. A estimativa não inclui produção de arte, migração de engine ou novas features.
