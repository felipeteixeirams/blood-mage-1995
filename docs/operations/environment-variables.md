# Variáveis de Ambiente

**Mestre:** [operations](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `api/`, `lib/`, `lib/db`, `scripts/`

Verificação: `grep` de `process.env.*` e `import.meta.env.*` em `src/`, `api/`, `lib/`, `scripts/`, `artifacts/api-server/src` e configs. Valores reais nunca entram na documentação.

| Variável | Onde é lida | Efeito | Obrigatória |
|---|---|---|---|
| `VITE_SENTRY_DSN` | `src/main.tsx` | inicializa Sentry (`tracesSampleRate` 0.1, replay em erro 1.0, `environment` = modo do Vite); sem ela, Sentry fica desligado. Embutida no bundle em build | não |
| `PORT` | `vite.config.ts`, `artifacts/api-server/src/index.ts` | porta do dev server (padrão 3000); o api-server exige a variável | api-server: sim |
| `DISABLE_HMR` | `vite.config.ts` | `true` desliga HMR e watch | não |
| `DATABASE_URL` | `lib/db/src/index.ts`, `lib/db/drizzle.config.ts` | conexão PostgreSQL; sem ela esses módulos lançam erro | só para `lib/db` e `drizzle-kit push` |
| `BASE_PATH` | `artifacts/bloodmage/vite.config.ts` | base do app em `artifacts/bloodmage` (padrão `/`) | não |
| `PIXELLAB_API_KEY` | `scripts/pixellab_client.cjs` | geração de sprites (ferramenta de desenvolvimento) | só nesse script |
| `SPRITECOOK_API_KEY` | `scripts/fetch-spritecook-sprite.cjs` | geração de sprites (ferramenta de desenvolvimento) | só nesse script |

## Só em `.env.example`, sem leitura no código

`GEMINI_API_KEY` e `APP_URL` constam em `.env.example` (comentários citam AI Studio), mas nenhum arquivo de `src/`, `api/`, `lib/` ou `scripts/` os lê.

## Regras observadas

- `.gitignore` ignora `.env*`, exceto `.env.example`.
- `.replit` define `VITE_SENTRY_DSN` em `[userenv.shared]` (valor no arquivo; não replicado aqui).
- `api/log.ts` não lê variáveis de ambiente.

## Não verificado

- Variáveis configuradas no painel da Vercel (fora do repositório).
- Uso de variáveis dentro de `artifacts/api-server` além de `PORT` e `DATABASE_URL` (via `lib/db`) e de `lib/integrations`.
