# 0015 — Estrutura do repositório e dependências sem uso

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**
**Specs afetadas:** [feature-assets-pipeline-geracao-de-prompt](../specs/defining/feature-assets-pipeline-geracao-de-prompt.md), [feature-assets-pipeline-ingestao-de-sprite](../specs/defining/feature-assets-pipeline-ingestao-de-sprite.md)

## Contexto
O jogo real vive na raiz (`src/`, `package.json`, `vite.config.ts`); a estrutura de workspace pnpm (`pnpm-workspace.yaml`: `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`) veio de um scaffolding e quase não se conecta a ele:

- `artifacts/bloodmage/` tem `package.json`, `vite.config.ts` e `public/`, sem `src/` próprio; seu `tsconfig.json` inclui `../../src/**/*` (`pnpm run typecheck:game`). O nome do pacote (`@workspace/bloodmage`) é **o mesmo** do `package.json` da raiz.
- `artifacts/api-server` (Express), `artifacts/mockup-sandbox`, `lib/db` (Drizzle), `lib/api-client-react`, `lib/api-spec`, `lib/api-zod`: `src/` não importa nenhum (`grep -rn "@workspace/" src` vazio). `artifacts/bloodmage` declara dependência em `@workspace/api-client-react`; `api-server` em `@workspace/db` e `@workspace/api-zod`.
- `scripts/post-merge.sh` roda `pnpm --filter db push` (exige `DATABASE_URL`).
- Dependências do `package.json` raiz sem nenhum import em `src/`: `wouter`, `@tanstack/react-query`, `react-icons`, `date-fns`, `omggif`, `pngjs`.
- A raiz tem scripts pontuais (`fix_*.cjs`, `patch_*.cjs`, `update_*.cjs`, `add_trap_collisions.cjs`) e relatórios `.md` datados (`MUDANCAS_SESSAO_2026_08_10_11.md`, `STATUS_PROGRESSO_2026_08_11.md`).

Existir no repositório não é decisão: remover ou manter é escolha de escopo e custo, e `lib/db`/`api-server` dependem da decisão sobre conta e nuvem (0011).

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter tudo | Nada quebra; preserva opção de backend | Ruído para agentes; dois pacotes homônimos; `post-merge` exige banco |
| B. Remover `artifacts/*` e `lib/*` que `src/` não usa; manter só raiz | Estrutura enxuta, sem nome duplicado | Perde o scaffolding de backend se 0011 escolher conta |
| C. Remover só as dependências sem import e os scripts/relatórios soltos da raiz; manter workspaces | Ganho seguro e pequeno | Mantém a ambiguidade de `artifacts/bloodmage` |
| D. C + renomear/consolidar `artifacts/bloodmage` | Resolve nome duplicado | Mexe em `typecheck:game` e Replit |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Workspaces declarados | `pnpm-workspace.yaml` | 2026-10-10 |
| Dois `package.json` com `name` `@workspace/bloodmage` | `package.json:2`; `artifacts/bloodmage/package.json:2` | 2026-10-10 |
| `src/` não importa `@workspace/*` | `grep -rn "@workspace/" src` | 2026-10-10 |
| Seis dependências sem import em `src/` | `grep -rln "from 'pkg'" src` = 0 para cada uma | 2026-10-10 |
| `artifacts/bloodmage/tsconfig.json` inclui `../../src/**/*` | arquivo citado | 2026-10-10 |
| Raiz tem scripts soltos e 2 relatórios datados | `ls` da raiz | 2026-10-10 |

## Suposições (não verificadas)
- Que nenhum deploy (Replit/Vercel) usa `artifacts/*` ou `lib/*` (o `vercel.json` aponta para `pnpm run build` da raiz; o deploy do Replit não foi analisado).
- Que as dependências sem import em `src/` não são usadas por `scripts/` ou configs (busca feita só em `src/`).

## Recomendação
**Opção C agora, B depois do ADR 0011.** Remover o que comprovadamente não é importado é seguro; apagar o backend só faz sentido após você decidir se haverá conta/nuvem.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se B/D: ajustar `pnpm-workspace.yaml`, `package.json` (scripts `typecheck:game`), `scripts/post-merge.sh`, `.replit` e `docs/engineering/stack.md`; regenerar `pnpm-lock.yaml`.
- Se C: remover dependências do `package.json` e lockfile; pre-commit (`verify`) valida o build.
