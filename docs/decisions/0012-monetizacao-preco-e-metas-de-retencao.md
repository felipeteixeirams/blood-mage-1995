# 0012 — Monetização, preço e metas de retenção

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
Documentos antigos traziam preço (US$ 4,99), compras no app (IAP), metas de retenção (D1/D7/D30), duração de sessão, taxa de crash e um "filtro de 5 perguntas" (KPI, simplicidade, ergonomia, performance, ROI) para aprovar features. Nenhum foi ratificado. No estado atual:

- Não há dependência nem código de pagamento, anúncios ou loja (`package.json`; busca em `src/`). O valor US$ 4,99 não aparece mais em `docs/` nem no código (busca de 2026-10-10).
- A spec `docs/specs/defining/discovery-distribuicao-app-mobile-e-monetizacao.md` (não aprovada) lista ideias: anúncios premiados voluntários, passe de sobrevivência, loja de cosméticos e cristais premium, com faixa "$2 a $5", sem bônus numérico (zero pay-to-win).
- Medição disponível: Sentry (só com `VITE_SENTRY_DSN`) e logger/telemetria para `/api/log`, que apenas imprime logs; não há análise de retenção, sessões por usuário ou funil.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Sem monetização e sem metas de retenção por ora | Sem custo nem risco legal | Sem receita; sem critério objetivo de sucesso |
| B. Jogo pago (preço único) | Simples; sem anúncios | Exige loja/pagamento (0010) e preço decidido por você |
| C. Cosméticos/passe sem pay-to-win | Alinhado à spec em estudo | Exige conta e backend (0011) |
| D. Definir metas de retenção e adotar o filtro de features | Critério de priorização | Sem telemetria de retenção as metas não são mensuráveis |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Sem dependências de pagamento/anúncio | `package.json` | 2026-10-10 |
| `/api/log` só imprime logs, não persiste | `api/log.ts` | 2026-10-10 |
| Metas e filtro vêm de documento antigo, não ratificadas | `docs/product/product-principles.md` | 2026-10-10 |

## Suposições (não verificadas)
- Os benchmarks de retenção citados antes (fonte externa não verificada).
- Que o preço US$ 4,99 foi decisão de alguém (origem desconhecida).

## Recomendação
**Opção A por ora.** Preço, IAP e metas são decisões de negócio suas; sem canal de distribuição (0010) e sem medição, qualquer número seria suposição.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se B/C: depende de 0010 e 0011; spec de monetização.
- Se D: exige telemetria nova (escolha de ferramenta e privacidade).
