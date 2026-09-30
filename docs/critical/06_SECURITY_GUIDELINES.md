---
agent_context: all
target_module: root
priority: media
status: active
last_updated: 2026-09-06
tags: [critical, seguranca, csp, localstorage, secrets]
---

# 🔒 Guia de Segurança — Diretrizes Vivas

> **Gap identificado na auditoria de 2026-09-06** (ver
> `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`): o conteúdo de
> segurança do projeto vivia disperso num retrato ESTÁTICO de auditoria
> (`docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md`, seção 5, datado
> de 11/08/2026) e em menções soltas em `01_CRITICAL_FILES.md`. Este
> documento é a versão viva — atualize-o quando a superfície de segurança
> mudar, em vez de deixar essa informação só num relatório histórico.

Bloodmage 1995 é um jogo client-side (PWA estático, sem backend próprio) —
a superfície de ataque real é bem menor que uma aplicação com API/DB, mas
não é zero.

## 1. Content-Security-Policy e headers HTTP (`vercel.json`)

Confira o arquivo real antes de mudar qualquer coisa aqui — resumo do que
está ativo hoje:
- `Content-Security-Policy`: `default-src 'self'`; scripts `'self'` (+
  `unsafe-inline`/`unsafe-eval` — necessário pro bundle Vite atual, não
  remova sem testar o build de produção inteiro); fontes só de
  `fonts.googleapis.com`/`fonts.gstatic.com`; `connect-src` restrito a
  `sentry.io` (telemetria de erro); `object-src 'none'`; `frame-ancestors
  'none'` (o jogo não pode ser embutido em iframe de terceiros).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` negando geolocalização/câmera/microfone (o jogo não
  usa nenhum desses).

**Regra:** qualquer novo domínio externo (CDN, API, analytics) precisa
entrar explicitamente no CSP em `vercel.json` — nunca afrouxe pra
`unsafe-*` genérico sem necessidade real, e nunca adicione um `connect-src`
novo sem confirmar que o domínio é confiável.

## 2. `localStorage` — validação e sanitização

Todo dado persistido (save game, achievements, settings, high scores)
passa por `src/utils/localStorage.ts`. Padrão obrigatório, já em uso:
- Schema Zod com `.strict()` (rejeita chaves extras — proteção contra
  prototype pollution) e `safeParse` (nunca deixa um `JSON.parse` cru
  quebrar o app ou aceitar shape inesperado).
- Fallback pra valor default seguro quando a validação falha ou o dado
  não existe.

Isso é o guardrail #1 do próprio `docs/critical/01_CRITICAL_FILES.md`
(`gameStore.ts`/`localStorage.ts`, Nível 2) — qualquer novo campo
persistido segue o mesmo padrão, sem exceção.

## 3. Segredos e credenciais

O jogo é 100% client-side/estático — **não há chave de API, token, ou
segredo de servidor no bundle do jogo em si**. Ferramentas de automação
(Jules, scripts de build/deploy) usam credenciais fora do repositório
(variáveis de ambiente da sessão, nunca commitadas). Se algum dia o jogo
ganhar uma integração real de conta/nuvem (ver
`docs/product/ACCOUNT_AND_DATA.md` — hoje é só possibilidade futura
condicional da Fase 5), qualquer chamada de API correspondente precisa de
um backend/proxy — nunca embutir uma chave secreta direto no bundle
cliente.

## 4. Dependências e superfície de terceiros

`package.json`/`pnpm-lock.yaml` são a fonte de verdade de dependências.
Ao adicionar uma dependência nova, confira se ela introduz `eval`/
`Function()` dinâmico (conflita com o CSP atual) ou faz requisições de
rede próprias (precisaria de novo `connect-src`).

## Referências

- `vercel.json` — headers reais em produção.
- `src/utils/localStorage.ts` — padrão de validação.
- `docs/critical/01_CRITICAL_FILES.md` — arquivos que concentram esse
  padrão (`gameStore.ts`, `localStorage.ts`).
- `docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md` seção 5 —
  retrato histórico (11/08/2026) que motivou parte destas diretrizes.
