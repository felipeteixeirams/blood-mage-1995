# 0014 — Arquivos críticos: classificação e força da regra

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
O `CLAUDE.md` manda ler `docs/critical/README.md` antes de mexer em `Player.ts`, `Enemy.ts`, `GameScene.ts`, `DungeonGenerator.ts`, `gameStore.ts` e `localStorage.ts`. A lista de níveis em `docs/engineering/risky-files.md` (Nível 1: Player, Enemy, GameScene, DungeonGenerator; Nível 2: gameStore, localStorage, PhaserGame.tsx; Nível 3: GameplayHUD.tsx) é uma classificação de cautela escrita por agentes, não uma regra ratificada. Versões antigas do `CLAUDE.md` diziam "NUNCA" modificar a física do `Player` ou a FSM de `Enemy`; o atual só pede leitura prévia.

O código mostra o que torna esses arquivos sensíveis: tamanhos (`Player.ts` 1368 linhas, `Enemy.ts` 1326, `GameScene.ts` 2021, `DungeonGenerator.ts` 818, `gameStore.ts` 1272, `localStorage.ts` 902) e cobertura: existem `Player.test.ts`, `Enemy.test.ts`, `DungeonGenerator.test.ts`, `gameStore.test.ts` e `localStorage.test.ts`; **não existe teste de `GameScene.ts`**, que também não entra na cobertura configurada (`vitest.config.ts:26`).

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter como está: lista de leitura obrigatória prévia, sem proibição | Flexível; já é o texto do `CLAUDE.md` | Sem barreira objetiva; níveis são opinião |
| B. Tornar a lista regra: mudança nesses arquivos exige teste de regressão e sua aprovação | Protege o que mais quebra | Mais atrito; você vira gargalo |
| C. Regra só para Nível 1 | Equilíbrio | Fronteira entre níveis continua arbitrária |
| D. Reduzir a lista aos arquivos sem teste (hoje `GameScene.ts`) e cobrir os demais por teste | Critério objetivo (cobertura) | Exige escrever testes antes |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Tamanhos dos 6 arquivos | `wc -l` | 2026-10-10 |
| Testes existem para 5 dos 6 arquivos; `GameScene.ts` sem teste | `ls src/**` | 2026-10-10 |
| Cobertura configurada cobre só 7 arquivos (inclui `localStorage.ts` e `gameStore.ts`) | `vitest.config.ts:26` | 2026-10-10 |
| Níveis de `risky-files.md` são "classificação de cautela, não regra" | `docs/engineering/risky-files.md` (cabeçalho) | 2026-10-10 |

## Suposições (não verificadas)
- Que os testes existentes cobrem os contratos descritos em `risky-files.md` (não foram executados nem auditados).
- Que o histórico de regressões justifica cada nível (não consultado).

## Recomendação
**Opção A.** É o texto atual do `CLAUDE.md`, projeto de um só desenvolvedor; revisar para D só quando houver testes para `GameScene.ts`.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se A: nenhuma mudança.
- Se B/C/D: atualizar `CLAUDE.md` e `docs/critical/`; D exige spec de testes de `GameScene`.
