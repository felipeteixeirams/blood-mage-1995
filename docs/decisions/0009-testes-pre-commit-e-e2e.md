# 0009 — Testes automáticos: pre-commit, CI e spec e2e quebrado

**Mestre:** [decisions](README.md)
**Status:** Aprovada
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:** Felipe Teixeira, 2026-10-11, conforme conversa de 2026-10-11 ("pode seguir pelo recomendado")

## Contexto
`.husky/pre-commit` roda `pnpm run docs:check` e `pnpm run verify`; `verify` = `verify-assets.cjs` + `typecheck` + `build` e **não** roda testes unitários (54 arquivos `*.test.ts(x)` em `src/`) nem e2e. O `package.json` tem `lint-staged` (`vitest related`) que nenhum hook chama. Não existe `.github/` nem outro CI.

`tests/e2e/safe-house-animations.spec.ts` usa `window.__PHASER_GAME__` em 20 pontos, mas nada em `src/` o define. Os ganchos que existem são `window.useGameStore` (`App.tsx:41`, sem guarda de ambiente de desenvolvimento) e `window.gameScene` (`GameScene.ts:229`); `gameScene.game` dá acesso à instância Phaser. A skill `phaser-4-playtest-harness` recomenda o mesmo `__PHASER_GAME__`.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter (pre-commit sem testes, sem CI) | Commit rápido | Regressões só aparecem ao rodar manualmente |
| B. Pre-commit com `vitest related` (via lint-staged) | Testes só do que mudou | Aumenta o tempo do commit |
| C. CI (ex.: GitHub Actions) com `test`, `typecheck`, `build` | Rede de segurança independente | Novo serviço/config; o fluxo atual é direto na `main` |
| D. Spec e2e: trocar `__PHASER_GAME__` por `window.gameScene.game` | Conserta sem expor global novo | Editar 20 usos e a skill |
| E. Spec e2e: expor `window.__PHASER_GAME__` no jogo | Spec e skill funcionam como estão | Mais um global em produção |
| F. Remover o spec | Sem teste quebrado | Perde a cobertura pretendida da Safe House |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Conteúdo do pre-commit | `.husky/pre-commit` | 2026-10-10 |
| `verify` sem testes | `package.json` (`scripts.verify`) | 2026-10-10 |
| Sem `.github/` | `ls -a` | 2026-10-10 |
| 20 usos de `__PHASER_GAME__`; nenhuma definição | `grep -c` no spec; busca em `src/` | 2026-10-10 |
| Ganchos `window.useGameStore`/`window.gameScene` existem | `App.tsx:41`; `GameScene.ts:229` | 2026-10-10 |

## Suposições (não verificadas)
- Que os testes unitários e e2e passam hoje (nada foi executado; sem `node_modules` no worktree).
- Que o tempo de `vitest related` no commit é aceitável.

## Recomendação
**B + D.** Testes dos arquivos alterados no commit e correção do spec com o gancho que já existe; CI (C) só se o fluxo deixar de ser de um só desenvolvedor.

## Decisão
Opções B + D: rodar `vitest related` (via lint-staged) no pre-commit e corrigir o spec e2e trocando `__PHASER_GAME__` por `window.gameScene.game`. CI (C) só se o fluxo deixar de ser de um só desenvolvedor.

## Consequências
- Editar `.husky/pre-commit`; editar o spec e `.claude/skills/phaser-4-playtest-harness/SKILL.md` (única cópia das skills); atualizar `docs/testing/`.
