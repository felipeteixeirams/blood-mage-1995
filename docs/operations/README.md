# Operações — Documento Mestre

**Contexto:** como rodar, buildar e implantar o projeto como ele é hoje: comandos, variáveis de ambiente, Vercel, PWA, e os scripts de TWA e Steam. Fontes: `package.json`, `vite.config.ts`, `vercel.json`, `scripts/*.sh`, `.env.example`, `.replit`, `api/log.ts`.
**Leia quando:** for rodar o projeto local, configurar ambiente, mexer em build/deploy ou investigar um problema de publicação.

| Satélite | Conteúdo | Status |
|---|---|---|
| [local-development.md](local-development.md) | Instalar, rodar, testar, hooks de commit, estrutura duplicada em `artifacts/bloodmage` | verificado |
| [environment-variables.md](environment-variables.md) | Variáveis lidas pelo código e as que só constam em `.env.example` | verificado |
| [build-and-deploy.md](build-and-deploy.md) | Build, Vercel (`vercel.json`, `api/log.ts`), PWA, scripts de TWA e Steam, Replit | não verificado |

`DEPLOYMENT.md` na raiz é a fonte antiga e não foi alterada; este conjunto a substitui como referência. Itens dele sem evidência no repositório (URL de produção, preço, e-mail de suporte, "Ready for Production") não foram carregados.
