# 0013 — Metas de performance (FPS, memória, draw calls)

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
O `CLAUDE.md` fala em "alvo de 60 FPS, inclusive em mobile/touch". Não existe medição registrada nem outras metas: documentos antigos citavam FPS mínimo, heap abaixo de 150 MB e menos de 45 draw calls, sem teste que os sustentasse. O que o código mede: `PerformanceMonitor` (`src/game/systems/PerformanceMonitor.ts`) calcula FPS, mantém 300 amostras e mostra memória JS só quando o navegador expõe `performance.memory`; não conta draw calls. Só liga com `?perf` na URL (`GameScene.ts:480-482`). O teste e2e de FPS está no spec quebrado de `safe-house-animations` (ver 0009). Há configurações de degradação (`lowPerformanceParticles`, `postProcessingEnabled`, `types/game.ts:273-275`).
O `DEPLOYMENT.md` (hoje só um ponteiro, removido em 2026-10-11) listava ainda metas de Web Vitals e bundle: TTI abaixo de 3 s, LCP abaixo de 2,5 s, CLS abaixo de 0,1, 60+ FPS e bundle abaixo de 2,5 MB. Nenhuma foi medida nem ratificada; ficam registradas aqui só como contexto da decisão.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter só "60 FPS" qualitativo, sem metas numéricas | Sem custo | Não há critério de regressão |
| B. Definir meta numérica (ex.: FPS p5 e aparelho de referência) e medir manualmente com `?perf` | Barato; critério explícito | Medição manual, sem automação |
| C. B + teste automatizado de FPS em e2e | Detecta regressão | Depende de ambiente estável (headless varia) e do conserto do spec (0009) |
| D. Incluir draw calls e heap | Cobertura completa | Exige instrumentação nova |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `PerformanceMonitor` mede FPS e heap (Chromium), não draw calls | `PerformanceMonitor.ts:13-14`, `:25`, `:103-104` | 2026-10-10 |
| Ativação por `?perf` | `GameScene.ts:480-482` | 2026-10-10 |
| Nenhum valor medido de FPS/heap existe no repositório | busca em `docs/` e `src/` | 2026-10-10 |

## Suposições (não verificadas)
- O desempenho real em aparelhos móveis (nunca medido nesta sessão).
- Que o jogo atinge 60 FPS em qualquer aparelho de referência.

## Recomendação
**Opção B.** Uma meta explícita medida à mão com `?perf` dá critério sem infraestrutura; a escolha do número e do aparelho de referência é sua.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se B: registrar a meta em `docs/engineering/performance-metrics.md` e as medições com data.
- Se C: depende do conserto do e2e (0009).
