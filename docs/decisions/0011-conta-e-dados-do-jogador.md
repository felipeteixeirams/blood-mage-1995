# 0011 — Conta e dados: save local ou conta com nuvem

**Mestre:** [decisions](README.md)
**Status:** Aprovada
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:** Felipe Teixeira, 2026-10-11, conforme conversa de 2026-10-11 ("sim aprovo, só cuidado para as alterações não afetarem a disposição que a aplicação funciona em produção")

## Contexto
Hoje o progresso fica só no `localStorage` do navegador (prefixo `bloodmage_1995_`), acessado por `src/utils/localStorage.ts` (schemas Zod) e por `SaveMigration.ts` e `usePWA.ts`. Não há login, conta nem identificador de jogador na nuvem; o `package.json` não tem dependência de auth, Supabase, Firebase ou pagamento e `src/` não usa esses termos. Existem `lib/db` (Drizzle/PostgreSQL) e `artifacts/api-server` (Express) no workspace, que `src/` não importa. O recorde (alto escore) também é local. Documentos antigos citavam login (Google) e cloud save (Supabase) como fase futura; a spec `docs/specs/defining/feature-persistencia-cloud-save.md` não está aprovada.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter só local, sem conta | Sem custo, sem LGPD/privacidade de conta | Progresso se perde ao limpar o navegador ou trocar de aparelho |
| B. Exportar/importar save em arquivo (sem conta) | Portabilidade sem servidor | Fluxo manual |
| C. Conta + cloud save (Google/Supabase) | Sincroniza entre aparelhos | Serviço novo, custo, privacidade, segurança, ranking trapaceável |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Persistência só em `localStorage` | `src/utils/localStorage.ts`; `grep` de `supabase\|firebase\|auth` em `src/` e `package.json` sem uso | 2026-10-10 |
| `src/` não importa `lib/*` nem `@workspace/*` | `grep -rn "@workspace/" src` sem resultado | 2026-10-10 |

## Suposições (não verificadas)
- Que usuários precisam de sincronização entre aparelhos (sem dados de uso).
- Custos e limites de Supabase (não consultados).

## Recomendação
**Opção A** (com B como melhoria barata se houver demanda): conta e nuvem são decisão de custo, privacidade e segurança, e nada no código as exige hoje. O `CLAUDE.md` já diz que só entram com sua confirmação.

## Decisão
Opção A: save só local (`localStorage`); sem conta, login nem nuvem por ora (B só se houver demanda, com nova confirmação). Restrição: nenhuma mudança no que roda em produção.

## Consequências
- Se A/B: nenhuma infraestrutura; B exige spec de exportação.
- Se C: spec de cloud save, política de privacidade, ADR de monetização (0012) e de estrutura do repositório (0015, porque `lib/db` e `api-server` seriam reaproveitados ou descartados).
