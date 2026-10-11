# Testes — Documento Mestre

**Contexto:** Como o projeto é testado e verificado hoje: Vitest (unitário), Playwright (e2e e golden), scripts do `package.json` e o hook de pre-commit.
**Leia quando:** For rodar, escrever ou depurar testes, ou precisar saber o que o commit valida e o que não valida.

## Em uma frase

O pre-commit roda `docs:check` e `verify` (assets + typecheck + build); nem os testes unitários nem os e2e rodam automaticamente.

## Satélites

| Documento | Conteúdo | Status |
|---|---|---|
| [verification-scripts](verification-scripts.md) | Scripts reais do `package.json`, `verify-assets`, hook de pre-commit | verificado |
| [unit-tests](unit-tests.md) | Configuração do Vitest, `tests/setup.ts`, inventário e cobertura | verificado |
| [e2e-tests](e2e-tests.md) | Playwright: configuração, specs, golden screenshots, problemas encontrados | verificado (leitura e listagem; execução não validada) |

Veja também a categoria de guardrails: [engineering](../engineering/README.md).

## Pendências de decisão

| Pendência | Situação | Fonte |
|---|---|---|
| Spec e2e da Safe House usa `__PHASER_GAME__` inexistente | Decidida (B + D) na [ADR 0009](../decisions/0009-testes-pre-commit-e-e2e.md), ainda não aplicada ao spec | `docs/decisions/0009-testes-pre-commit-e-e2e.md` |
| `vitest related` no pre-commit | Decidida na mesma ADR; `.husky/pre-commit` ainda não o chama | idem |
| CI (GitHub Actions) | Fora do escopo aprovado; só se o fluxo deixar de ser de um só desenvolvedor | idem |
