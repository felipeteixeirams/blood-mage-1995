# 🚀 Deploy Automático no Vercel

O Bloodmage 1995 é configurado para deploy automático contínuo (CI/CD) no Vercel ligado ao repositório git.

## ⚙️ Configurações do Pipeline
- **Comando de Instalação**: `pnpm install`
- **Comando de Build**: `pnpm run build` (ou `pnpm run verify` que executa testes adicionais e typecheck)
- **Diretório de Saída (Output)**: `dist`
- **Cabeçalhos de Segurança (CSP)**: Definidos em `vercel.json`, aplicando regras restritas de CSP para evitar injeção de scripts não autorizados e liberando conexões de telemetria apenas para servidores oficiais da Sentry (`https://*.sentry.io` e `https://*.ingest.us.sentry.io`).
