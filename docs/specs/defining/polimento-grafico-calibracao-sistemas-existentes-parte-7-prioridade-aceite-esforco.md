# Spec 17 — Polimento Gráfico por Calibração dos Sistemas Existentes (parte 7: Prioridade, critérios globais e esforço)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática; `node_modules` ausente, nada executado): parcial. As correções de integração das Frentes A e B existem: `LightingPolish.applyBloomFilter` chama `enableFilters()` só uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e desligamento por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa), guarda `activeFloorDepth` e reaplica a matriz do bioma, e `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection` que não apagam tint mais novo. Existem os sistemas e testes citados (`LightingSystem`, `LightingPolish`, `PostFXSystem`, `AtmosphereSystem`, `ShadowSystem` com `footY = y + altura*0.38`, `ReflectionSystem` com `setFrame` sincronizado, `AdvancedParticles` com `lowPerformanceParticles`, `AtmosphericTreeShader`, `TerrainDetailFactory`). Não verificado: se `filters.external` é a coleção correta no Phaser 4.2.1 instalado; se o Glow aparece em WebGL real; se o Glow é removido ao reciclar sem destruir (hoje só em `destroy`/`cleanup`); toda a calibração visual das Frentes C a H e a validação antes/depois (precisa de playtest e screenshots humanos); orçamento de performance medido.

Parte 7 de 7. Índice das partes: [parte 1](polimento-grafico-calibracao-sistemas-existentes-parte-1-visao-e-escopo.md).

---

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

## 10. Critérios Globais de Aceite

- [ ] Nenhum sistema novo foi criado para resolver um problema de calibração.
- [ ] Nenhum asset externo novo foi necessário.
- [ ] Os filtros existentes são efetivamente aplicados no renderer suportado.
- [ ] Os filtros são removidos corretamente e não se acumulam em objetos reciclados.
- [ ] A gradação de bioma continua correta após efeitos temporários.
- [ ] Luzes, sombras, reflexos, atmosfera e partículas formam uma composição visual coerente.
- [ ] Jogador, inimigos, ataques, itens e telégrafos permanecem legíveis.
- [ ] O visual não fica excessivamente lavado, escuro, saturado ou poluído.
- [ ] A troca de cena, bioma, onda e run não deixa objetos ou efeitos órfãos.
- [ ] O desempenho permanece dentro do orçamento existente.
- [ ] `pnpm run verify` passa após a implementação.
- [ ] A validação visual confirma melhoria em relação ao baseline, sem regressão de gameplay.

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
