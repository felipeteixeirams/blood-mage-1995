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
| [e2e-tests](e2e-tests.md) | Playwright: configuração, specs, golden screenshots, problemas encontrados | não verificado |

Veja também a categoria de guardrails: [critical](../engineering/README.md).
