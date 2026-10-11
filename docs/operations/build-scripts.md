# Scripts de Build, Deploy e Verificação

**Mestre:** [operations](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `.husky/pre-commit`, `lib/db`, `./scripts/build-pwa.sh`, `api/log.ts`

Nota de verificação: leitura do código e busca de referências; nenhum script foi executado; pendências em "Não verificado".

Scripts de `scripts/` que buildam, empacotam, verificam e mantêm a documentação. Scripts de arte e áudio estão em [asset-scripts.md](asset-scripts.md). Fluxo de build e Vercel: [build-and-deploy.md](build-and-deploy.md); comandos do dia a dia: [local-development.md](local-development.md).

## Verificação (acionados por `package.json` e hook)

| Script | O que faz | Entradas / saídas | Quem chama | Em uso? (evidência) | Efeitos / segredos |
|---|---|---|---|---|---|
| `verify-assets.cjs` | Confere cabeçalho (magic bytes) de `.png .jpg .jpeg .gif .woff2 .ogg .webp` e `.mp3` em `src/assets`, `public/assets`, `public/fonts`; cruza `assetManifest.json` (obrigatório ausente ou grid de spritesheet inválido = falha; planejado = aviso) | Lê arquivos de asset e o manifesto; só imprime. Exit 1 em falha | `package.json` `verify` (`node scripts/verify-assets.cjs && typecheck && build`); pre-commit via `pnpm run verify` | Sim: `package.json`, `.husky/pre-commit` | Nenhum (somente leitura) |
| `check-docs.mjs` | Valida `docs/` (detalhes de regras não reconferidos nesta rodada): arquivo fora de categoria, mestre ausente, não linkado, link quebrado, cabeçalho `Status`/`Verificado em`/`Mestre`, kebab-case, specs (critérios, estágio, aprovação), ADRs vs. registro. Avisa verificação com mais de 30 dias | Lê `docs/**`; só imprime. Exit 1 se houver erro; avisos não falham | `package.json` `docs:check`; pre-commit | Sim: `package.json`, `.husky/pre-commit` | Nenhum |
| `find_dead_code.cjs` | Análise estática (API do `typescript`): arquivos órfãos a partir de `src/main.tsx`, `src/App.tsx`, `src/index.css`, testes e arquivos de raiz; scaffolding shadcn; exports sem consumidor | Lê `src/`; só imprime relatório colorido | Nenhum (sem script no `package.json`, sem referência em hook ou doc) | Manual; sem referência encontrada fora do próprio arquivo | Nenhum |

## Build e empacotamento (manuais)

| Script | O que faz | Entradas / saídas | Quem chama | Em uso? (evidência) | Efeitos / segredos |
|---|---|---|---|---|---|
| `build-pwa.sh` | `tsc -p tsconfig.json --noEmit`, `npm run build`, confere `dist/sw.js` (só avisa) e `dist/manifest.webmanifest` (exit 1 se faltar) | Saída em `dist/` (gerada pelo Vite) | Manual (`./scripts/build-pwa.sh`) | Referenciado só em docs e no próprio script; a Vercel usa `vercel.json` | Usa `npm` mesmo com pnpm como gerenciador |
| `build-steam.sh [win\|linux\|mac\|all]` | Instala `electron` e `electron-builder` se ausentes (`npm install --save-dev`), roda `npm run build`, cria `electron-builder.yml` padrão se não existir, roda `electron-builder` | Saída em `dist/electron/` | Manual | Não verificado: `electron-builder.yml` e `main.js` não existem no repositório (o `files` do YAML padrão lista `main.js`) | Altera `package.json` e lockfile ao instalar; cria `electron-builder.yml` |
| `build-twa.sh` | Exige `bubblewrap` no PATH, roda `npm run build`, cria `twa-manifest.json` padrão se ausente (campo `sha256Fingerprints` com placeholder), roda `bubblewrap build` | Cria `twa-manifest.json`; APK/AAB do Bubblewrap | Manual | Não verificado: `twa-manifest.json` não existe no repositório | Pode gerar chave `bloodmage-key.jks` (o script manda guardá-la); nenhum segredo no script |
| `post-merge.sh` | `pnpm install --frozen-lockfile` e `pnpm --filter db push` | Instala dependências; aplica schema do pacote `lib/db` | `.replit` `[postMerge]` (timeout 20000 ms) | Só no Replit; não roda na Vercel nem no hook do Husky | `db push` altera banco; `lib/db` usa `drizzle.config.ts` (variável de banco não conferida aqui; ver [environment-variables.md](environment-variables.md)) |

## Docs: scripts auxiliares em Python

| Script | O que faz | Chamado por | Em uso? | Efeitos |
|---|---|---|---|---|
| `add_frontmatter.py` | Injeta frontmatter (`agent_context`, `priority`, `last_updated`...) em arquivos de uma tabela fixa `META`, com caminhos do padrão antigo (`architecture/00_OVERVIEW.md`, `context/*`, `critical/*`) | Ninguém | Provavelmente não: esses caminhos não existem na estrutura atual de `docs/` | Escreveria em `docs/`; não executar sem revisar |
| `check_doc_links.py` | Procura links wiki `[[./x]]` quebrados em `.md` a partir do diretório atual | Ninguém | Provavelmente não: `check-docs.mjs` cobre links `](...)` | Somente leitura |
| `docs-audit.py` | Auditoria de `docs/` (links, specs) com `DOCS_DIR`, `SPECS_DIR`, `ARCHIVE_DIR` | Ninguém | Provavelmente não: `docs/archive` não existe | Não verificado |

## Outros diretórios

| Caminho | Conteúdo | Observação |
|---|---|---|
| `scripts/package.json`, `scripts/tsconfig.json`, `scripts/src/hello.ts` | Pacote `@workspace/scripts` com script `hello` (`tsx ./src/hello.ts`) e `typecheck` | Template do monorepo; sem uso pelo jogo |
| `api/log.ts` | Função serverless `/api/log` (Vercel) | Detalhes em [build-and-deploy.md](build-and-deploy.md) |
| `artifacts/api-server/build.mjs` | Build esbuild (bundle ESM em `dist/index.mjs`, plugin pino) do servidor; script `build` do pacote, `dev`/`start` também | Lido só o início; não executado |
| `artifacts/bloodmage`, `artifacts/mockup-sandbox` | Pacotes Vite com `dev`, `build`, `typecheck` próprios; `typecheck:game` da raiz usa `artifacts/bloodmage/tsconfig.json` | Estrutura duplicada: ver [local-development.md](local-development.md) |

## Suspeitos

- `post-merge.sh` roda `pnpm --filter db push`: o filtro `db` resolve para `@workspace/db` (conferido com `pnpm ls --filter db`); o `push` em si não foi executado.
- `build-steam.sh` e `build-twa.sh` criam configuração com identificadores fixos (`com.felipeteixeira.bloodmage1995`, URL `bloodmage-1995.vercel.app`) sem checar se são os reais.

## Onde fica no código

`scripts/*.sh`, `scripts/*.cjs`, `scripts/check-docs.mjs`, `scripts/*.py`, `.husky/pre-commit` (`pnpm run docs:check`, `pnpm run verify`), `.replit`, `package.json` (`scripts`).

Relacionados: [asset-scripts.md](asset-scripts.md), [build-and-deploy.md](build-and-deploy.md), [local-development.md](local-development.md), [../testing/verification-scripts.md](../testing/verification-scripts.md)

## Não verificado

- Execução de qualquer script; regras exatas do `check-docs.mjs`; `docs-audit.py` e `add_frontmatter.py` (só cabeçalhos lidos); fim do `build.mjs` do api-server.
