# 0007 — CSP do vercel.json: unsafe-inline, unsafe-eval e Google Fonts

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**

## Contexto
`vercel.json` define para `/(.*)`: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src 'self' https://fonts.gstatic.com`, `connect-src 'self' https://*.sentry.io https://*.ingest.us.sentry.io`. `src/` e `index.html` não referenciam Google Fonts (fontes locais em `public/fonts/`), e `index.html` só tem o script de módulo `/src/main.tsx` (sem script inline). Nenhum comentário explica por que `unsafe-eval`/`unsafe-inline` entraram. Segurança é decisão do responsável.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Manter como está | Nada quebra | Enfraquece a proteção contra XSS; origens sem uso |
| B. Remover só as origens do Google Fonts | Sem risco funcional aparente | Ganho pequeno |
| C. B + remover `unsafe-eval` após testar build de produção | Reduz superfície relevante | Pode quebrar alguma biblioteca (não testado) |
| D. C + remover `unsafe-inline` (nonce/hash) | Máxima proteção | Vite/PWA/estilos inline do React exigem trabalho; maior risco |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Valor do CSP | `vercel.json` | 2026-10-10 |
| Sem referência a `googleapis`/`gstatic` em `src/` e `index.html` | `grep -rn` | 2026-10-10 |
| `index.html` sem script inline | `index.html:28` (único `<script>`) | 2026-10-10 |
| Fontes locais existem | `ls public/fonts` (cinzel.woff2, pressstart2p.*) | 2026-10-10 |

## Suposições (não verificadas)
- Que o build de produção funciona sem `unsafe-eval` e sem `unsafe-inline` (nunca testado; exige deploy de preview e console limpo).
- Que nenhum CSS importa fontes externas por outro meio (busca só em `src/` e `index.html`).

## Recomendação
**Opção C**, validando em preview da Vercel antes de produção: remove o que não é usado e o item mais perigoso, sem o custo de nonces.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Edição de `vercel.json`; atualizar `docs/critical/security.md`. Reteste de PWA, Sentry e Phaser em preview.
