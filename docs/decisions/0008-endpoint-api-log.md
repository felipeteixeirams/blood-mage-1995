# 0008 — Endpoint /api/log: CORS aberto, sem autenticação nem limite

**Mestre:** [decisions](README.md)
**Status:** Aprovada
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:** Felipe Teixeira, 2026-10-11, conforme conversa de 2026-10-11 ("pode seguir pelo recomendado")

## Contexto
`api/log.ts` (função serverless) aceita POST de qualquer origem (`Access-Control-Allow-Origin: *`), sem autenticação, sem limite de taxa, sem limite de tamanho do corpo nem de entradas por requisição, e imprime cada entrada em `console.*` (`[VERCEL_RUNTIME]`). O cliente (`src/utils/logger.ts`) tem `remoteEnabled = true` por padrão e envia `ERROR`, `WARN` e namespaces `TELEMETRY*`/`EVENT:*` por `fetch` e `sendBeacon` para `/api/log` (mesma origem). O CSP do app só permite `connect-src 'self'` para essa rota, então o CORS `*` não é necessário para o próprio jogo.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter | Nada a fazer | Qualquer um pode encher os logs da Vercel (custo/ruído) |
| B. Remover os cabeçalhos CORS (só mesma origem) | Trivial; sem efeito no jogo | Não impede chamadas fora de navegador |
| C. B + limites (tamanho do corpo, nº de entradas, truncar campos) | Reduz abuso básico | Rate limit real exige serviço externo (ex.: KV) |
| D. Desligar o envio remoto por padrão (opt-in) | Privacidade; zero custo | Perde telemetria de erros (Sentry cobre parte) |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| CORS `*`, só POST/OPTIONS | `api/log.ts` (`handler`) | 2026-10-10 |
| Sem autenticação, rate limit ou limite de corpo no handler | leitura de `api/log.ts` | 2026-10-10 |
| `remoteEnabled` começa `true`; endpoint `/api/log` | `logger.ts:24-25` | 2026-10-10 |
| `connect-src 'self'` | `vercel.json` | 2026-10-10 |

## Suposições (não verificadas)
- Que a plataforma Vercel impõe limite próprio de tamanho de corpo (conhecimento geral, não consultado na documentação oficial).
- O conteúdo real dos logs enviados (dados do jogador) não foi auditado.

## Recomendação
**Opção C.** Corrige o excesso de abertura sem perder telemetria; rate limit real fica fora até haver abuso observado.

## Decisão
Opção C: remover os cabeçalhos CORS de `api/log.ts` e limitar tamanho do corpo, número de entradas e truncar campos; rate limit real fica fora até haver abuso observado.

## Consequências
- Editar `api/log.ts`; teste do handler; atualizar `docs/engineering/security.md`.
