# Operações — Documento Mestre

**Contexto:** como rodar, buildar e implantar o projeto como ele é hoje: comandos, variáveis de ambiente, Vercel, PWA, e os scripts de TWA e Steam. Fontes: `package.json`, `vite.config.ts`, `vercel.json`, `scripts/*.sh`, `.env.example`, `.replit`, `api/log.ts`.
**Leia quando:** for rodar o projeto local, configurar ambiente, mexer em build/deploy ou investigar um problema de publicação.

| Satélite | Conteúdo | Status |
|---|---|---|
| [local-development.md](local-development.md) | Instalar, rodar, testar, hooks de commit, estrutura duplicada em `artifacts/bloodmage` | verificado |
| [environment-variables.md](environment-variables.md) | Variáveis lidas pelo código e as que só constam em `.env.example` | verificado |
| [build-and-deploy.md](build-and-deploy.md) | Build, Vercel (`vercel.json`, `api/log.ts`), PWA, scripts de TWA e Steam, Replit | verificado (estático) |
| [build-scripts.md](build-scripts.md) | Scripts de verificação, build, empacotamento e docs, com chamador, uso e efeitos | verificado (estático) |
| [asset-scripts.md](asset-scripts.md) | Scripts de arte, sprites e áudio (PixelLab, SpriteCook, spritesheet, baú, ícones, GIFs, WAVs) | verificado (estático) |
| [pixel-lab-config.md](pixel-lab-config.md) | Configuração global do Pixel Lab (modelo, tamanho, estilo) usada em todos os prompts | não verificado |
| [pixel-lab-player-prompts.md](pixel-lab-player-prompts.md) | Prompts do Bloodmage (jogador) | não verificado |
| [pixel-lab-bestiary-prompts.md](pixel-lab-bestiary-prompts.md) | Prompts do bestiário (inimigos) | não verificado |
| [pixel-lab-npc-and-prop-prompts.md](pixel-lab-npc-and-prop-prompts.md) | Prompts dos NPCs do refúgio e dos props | não verificado |
| [pixel-lab-tile-prompts.md](pixel-lab-tile-prompts.md) | Prompts de tiles de ambiente e tabela de opções | não verificado |
| [pwa.md](pwa.md) | VitePWA, manifest, registro duplicado do service worker, ícones ausentes, banner/hook não montados e cache offline | verificado |
| [telemetry-and-logging.md](telemetry-and-logging.md) | Logger, telemetria, handlers globais, Sentry e a rota `/api/log` | verificado |

`DEPLOYMENT.md` na raiz é só um ponteiro para este índice.

## Pendências de decisão

| Documento | O que falta decidir | Recomendação |
|---|---|---|
| [build-and-deploy.md](build-and-deploy.md) | Manter ou aposentar `build-steam.sh`/`build-twa.sh` (faltam `electron-builder.yml`, `main.js`, `twa-manifest.json`; IDs fixos nos scripts) | Decidir junto com o canal de distribuição (ADR 0010); até lá, tratar como rascunho |
| [build-scripts.md](build-scripts.md) | Manter ou remover `add_frontmatter.py`, `check_doc_links.py`, `docs-audit.py` (sem chamador, caminhos antigos) | Remover os que `check-docs.mjs` já cobre, após confirmação do responsável |
