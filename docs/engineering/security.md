# Segurança

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Superfície de segurança do projeto como está hoje. Conferido contra `vercel.json`, `src/utils/localStorage.ts`, `src/utils/logger.ts`, `api/log.ts` e `src/main.tsx` (leitura estática).

## 1. Cabeçalhos HTTP (`vercel.json`)

Aplicados a `/(.*)`:

| Cabeçalho | Valor |
|---|---|
| `Content-Security-Policy` | ver tabela abaixo |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |

Diretivas do CSP:

| Diretiva | Valor |
|---|---|
| `default-src` | `'self'` |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` |
| `font-src` | `'self' https://fonts.gstatic.com` |
| `img-src` | `'self' data: blob:` |
| `connect-src` | `'self' https://*.sentry.io https://*.ingest.us.sentry.io` |
| `media-src` | `'self' data: blob:` |
| `object-src` | `'none'` |
| `frame-ancestors` | `'none'` |

Observações:
- `'unsafe-inline'` e `'unsafe-eval'` em `script-src` enfraquecem a proteção contra XSS. O código não documenta a causa; não foi testado se o build de produção funciona sem eles.
- `src/` e `index.html` não referenciam Google Fonts (busca por `googleapis`/`gstatic` sem resultados); as origens de fontes do CSP podem estar sem uso.
- Qualquer domínio externo novo (CDN, API, analytics) precisa entrar no CSP para funcionar.

## 2. Telemetria e logs

| Fluxo | Código | Destino |
|---|---|---|
| Sentry | `src/main.tsx` (linhas 84-93): `Sentry.init` só roda se `VITE_SENTRY_DSN` estiver definida; `tracesSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0` | `*.sentry.io` (liberado no `connect-src`) |
| Logger remoto | `src/utils/logger.ts`: `remoteEnabled` começa `true`; envia logs `ERROR`, `WARN` e namespaces `TELEMETRY*`/`EVENT:*` por `fetch` (POST) e `sendBeacon` para `/api/log` | `api/log.ts` (função serverless que imprime os logs com `console.*`; não persiste em banco) |

O projeto, portanto, tem uma rota de backend própria (`/api/log`); não é apenas estático. O handler responde `Access-Control-Allow-Origin: *`, aceita POST de qualquer origem e não tem autenticação nem limite de taxa visíveis no código. O que os logs enviados contêm (dados do jogador, por exemplo) não foi auditado.

## 3. Persistência local

- Dados persistidos passam por `src/utils/localStorage.ts`: schemas Zod com `safeParse` na leitura e valor padrão quando a validação falha. Os schemas de talentos, configurações e recordes usam `.strict()` (comentário no código: evita chaves extras). Não foi conferido se todos os schemas do arquivo usam `.strict()`.
- Novos campos persistidos devem seguir o mesmo padrão (ver [risky-files](risky-files.md)).

## 4. Segredos

- `.gitignore` ignora `.env*` (exceto `.env.example`).
- A única variável de ambiente do cliente encontrada em `src/` é `VITE_SENTRY_DSN`. O valor aparece em claro em `.replit` (`[userenv.shared]`); um DSN do Sentry é identificador de ingestão do cliente, não segredo de servidor. Não foi feita varredura de segredos no repositório nem no histórico git.

## 5. Outros pontos

- `src/components/ui/chart.tsx` usa `dangerouslySetInnerHTML` (linha 78) para gerar um bloco `<style>` com variáveis CSS a partir da prop `config` do gráfico; os chamadores do componente não foram investigados.
- `src/game/systems/PerformanceMonitor.ts` usa `innerHTML` com valores numéricos do próprio monitor (linha 110).

## Não verificado

- Que o build de produção funciona sem `unsafe-eval`/`unsafe-inline`.
- Conteúdo dos logs enviados a `/api/log`.
- Varredura de segredos e de vulnerabilidades em dependências (`pnpm audit` não foi executado).
