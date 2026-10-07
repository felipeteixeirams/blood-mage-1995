---
agent_context: qa, all
target_module: .husky/pre-commit, package.json, .github/workflows (proposto), docs/critical/03_TESTING_GATES.md, docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md, CLAUDE.md
priority: high
criticality: medium
status: scope-definition
last_updated: 2026-10-07
tags: [specs, qa, ci, husky, testing-gates, processo, ears]
---

# Spec 35.06 — Gates Automatizados (Hook, CI) e Gate de Entrega com Evidência de Runtime

> Satélite de [35.00 — Índice Mestre](../backlog/35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).
> Achados cobertos: **A14, A15, A16**.
> **Por que está em `scope-definition/`:** criar CI e aumentar o tempo do
> hook de commit são decisões do Felipe (infraestrutura e fluxo de trabalho).

## 1. Contexto

Medido em 2026-10-07 nesta branch:

| Item | Estado real |
|---|---|
| `.husky/pre-commit` | roda só `npm run verify` |
| `verify` (`package.json`) | `verify-assets.cjs && typecheck && build` — **sem testes** |
| `lint-staged` (`package.json`: `"*.{ts,tsx}": "vitest related"`) | configurado, **nunca chamado** pelo hook |
| `.github/workflows/` | **não existe** |
| `pnpm test` | 57 arquivos, **574/574** passando, ~32 s (container de nuvem) |
| E2E (`tests/e2e/*.spec.ts`, 5 arquivos) | só rodam manualmente com `pnpm e2e` |
| `CLAUDE.md` §Testes | afirma "`pnpm verify` # Lint + type check + test" — **incorreto** |
| `03_TESTING_GATES.md` gate 4 | "Vite não deve reclamar de chunks > 500 kB" — **violado hoje**: `phaser-*.js` 1.387 kB, `vendor-*.js` 438 kB (o build emite o aviso) |
| `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` §5 | lista assets/typecheck/test/build — **nenhum gate de execução real** |

Consequência já observada: specs 23.01, 23.02, 23.03 e 25 (fase B.2) chegaram a
`delivered/` com testes verdes e comportamento ausente em runtime (achados A1,
A6, A9, A13 do índice). O "Gate de Entrega" foi registrado em
`docs/specs/READINESS_GATES.md` em 2026-10-07, mas ainda não está na
metodologia nem no checklist do `CLAUDE.md`.

## 2. Objetivo

Fazer os gates documentados serem os gates executados: testes unitários
automáticos, E2E de jogabilidade em ponto definido do fluxo e evidência de
runtime obrigatória para mudanças de render, sem documentação contraditória.

## 3. Escopo

### 3.1 Dentro do Escopo (proposto)
- Hook de commit rodando testes (completo ou `vitest related` via lint-staged).
- Workflow de CI (se aprovado) com typecheck, testes, build e `pnpm e2e:smoke` (35.02).
- Gate de Entrega incorporado em `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` §5, `03_TESTING_GATES.md` e no checklist do `CLAUDE.md`.
- Corrigir a descrição de `pnpm verify` no `CLAUDE.md`.
- Resolver a contradição do gate 4 (chunks > 500 kB): ajustar o gate à realidade do Phaser ou configurar `build.chunkSizeWarningLimit` com justificativa.

### 3.2 Fora do Escopo
- Escrever o teste `smoke-playable.spec.ts` (→ 35.02).
- Deploy automático (Vercel já faz o deploy).
- Mudar a suíte de testes existente.

## 4. Requisitos (EARS) — rascunho; `⏳` = aguarda decisão

| ID | Requisito | Verificação |
|---|---|---|
| R35.06-01 | **QUANDO** um commit tocar arquivos `*.ts`/`*.tsx`, o hook `pre-commit` **DEVE** rodar os testes afetados (`lint-staged` → `vitest related --run`) além de `verify`. | commit de teste com um teste quebrado é bloqueado |
| R35.06-02 | **ONDE** o CI for aprovado ⏳, **QUANDO** houver push ou PR para `main`, o workflow **DEVE** rodar `pnpm run typecheck`, `pnpm test -- --run`, `pnpm run build` e `pnpm e2e:smoke`, e **DEVE** falhar se qualquer um falhar. | execução do workflow |
| R35.06-03 | **SE** o CI não for aprovado, **ENTÃO** `03_TESTING_GATES.md` **DEVE** listar `pnpm e2e:smoke` como passo manual obrigatório antes de merge de mudanças em `src/game/scenes`, `src/game/systems` ou `src/utils/textureGenerator.ts`. | revisão do doc |
| R35.06-04 | **QUANDO** uma spec que altera render, cenas ou geração de mundo for movida para `delivered/`, o changelog dela **DEVE** conter evidência de execução real (sonda/E2E em WebGL, screenshot ou leitura de `window.gameScene`). | checklist em `05_SPEC…` §5 e `CLAUDE.md` |
| R35.06-05 | O `CLAUDE.md` **DEVE** descrever `pnpm verify` exatamente como `package.json` o define. | revisão do doc |
| R35.06-06 | `03_TESTING_GATES.md` **NÃO DEVE** conter gate que o build atual viola sem exceção documentada (gate 4). | `pnpm run build` sem aviso **ou** exceção registrada |
| R35.06-07 | **SE** um teste mockar o renderer do Phaser, **ENTÃO** o mock **DEVE** usar apenas propriedades existentes em `node_modules/phaser/src` (ex.: `type`, não `isWebGL`). | revisão + regra em `03_TESTING_GATES.md` |

## 5. Decisões de Produto Necessárias (bloqueiam a promoção para `backlog/`)

| Decisão | Proposta default |
|---|---|
| Criar CI no GitHub Actions? | Sim, só leitura (sem deploy, sem secrets). Custo: minutos de Actions; o E2E com build leva alguns minutos. |
| Hook roda suíte completa (~32 s) ou só testes afetados? | **Só afetados** (`vitest related`), completa no CI. |
| Gate 4 de chunks | **Exceção documentada** para `phaser-*.js` (o engine sozinho já passa de 500 kB) via `chunkSizeWarningLimit`, mantendo o aviso para os demais chunks. |

## 6. Critério para sair de `scope-definition/`

As 3 decisões de §5 respondidas. A partir daí, R35.06-01/03/04/05/06/07 são
executáveis em menos de um dia; R35.06-02 depende de 35.02 entregue.

## 7. Referências

- [[35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE]], [[35_02_GATE_E2E_JOGABILIDADE_ARCADE_CAMPANHA]]
- `docs/critical/03_TESTING_GATES.md`, `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` §5, `docs/specs/READINESS_GATES.md` (Gate de Entrega)

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação: hook sem testes, CI inexistente, `CLAUDE.md` descreve `verify` errado, gate 4 violado, Gate de Entrega só em `READINESS_GATES.md` | Claude |
