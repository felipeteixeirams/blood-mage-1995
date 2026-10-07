# 🤖 AGENTS.md — Ponteiro

> **O conteúdo deste arquivo foi movido em 2026-10-07.** O ponto de entrada da base de
> conhecimento (contexto do projeto, mapa do código, **guardrails**, onde achar cada
> documento) agora é **[`docs/AGENTS.md`](docs/AGENTS.md)**. Este arquivo existe porque
> ferramentas externas (Jules, AI Studio, Codex) ainda procuram `AGENTS.md` na raiz.
>
> - **Claude Code:** leia também [`CLAUDE.md`](CLAUDE.md) (fluxo de trabalho, spec-driven, Git).
> - **Eficiência de contexto:** consulte `docs/AGENTS.md` e `docs/README.md` antes de abrir código; em arquivos > ~400 linhas, edição cirúrgica — nunca reescreva o arquivo inteiro.

## 🛡️ Guardrails — índice (texto completo e numeração estável em [`docs/AGENTS.md` §4](docs/AGENTS.md#4-guardrails-inegociáveis))

| # | Regra em uma linha |
|---|---|
| 1 | **Assets híbridos:** tentar o arquivo físico primeiro; falhou → fallback procedural sob a mesma chave; `required` no `assetManifest.json` só vira `true` com o arquivo commitado |
| 2 | **Combate:** sem dano passivo de contato; todo ataque físico passa por FSM `Windup → Strike → Recovery`; poda espacial antes de raycast |
| 3 | **Estado:** `localStorage` só via `src/utils/localStorage.ts` (Zod); Phaser↔React só via Zustand |
| 4 | **Código:** TypeScript strict com 0 erros; sem `any`; objeto nomeado para funções com > 3 parâmetros |
| 5 | **Troubleshooting:** bug não trivial vira entrada em `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` |
| 6 / 6b | **Binários:** nunca editar PNG/JPG/WebP/GIF/WOFF2/MP3/OGG com ferramenta de texto · spritesheet do jogador vem do PixelLab (`build_bloodmage_spritesheet.cjs`), não do script procedural |
| 7 | **UI só em React:** nada de menu, HUD, texto ou botão dentro de cena Phaser |

## 🧪 Testes (resumo — detalhes em `CLAUDE.md` §Testes e Comandos)

```bash
pnpm test              # suíte unitária (Vitest)
pnpm run verify        # assets + typecheck + build  — NÃO roda os testes
pnpm e2e               # Playwright
```

O hook `pre-commit` executa `npm run verify`. Rode `pnpm test` você mesmo antes de commitar.

## 🐙 Git remoto — ⚠️ pendente de decisão do Felipe

O procedimento abaixo **conflita** com o fluxo definido em `CLAUDE.md` (branch designada, sem push
em `main`) e grava um token pessoal na URL do remote (`.git/config`). Foi mantido **sem alteração**
porque ferramentas externas podem depender dele. **Claude Code não deve segui-lo.**

### Procedimento original (preservado sem alteração)

When requested by the user to commit and push changes to the remote GitHub repository (`https://github.com/felipeteixeirams/blood-mage-1995.git`), use the personal access token stored in the environment variable `GITHUB_TOKEN_PERSONAL`.

### Git Remote Authentication & Push Workflow:
1. Configure git user identity if not already set:
   ```bash
   git config --global user.name "Felipe Teixeira"
   git config --global user.email "felipeteixeirams@gmail.com"
   ```
2. Set the remote URL with the PAT token authentication:
   ```bash
   git remote set-url origin https://x-access-token:${GITHUB_TOKEN_PERSONAL}@github.com/felipeteixeirams/blood-mage-1995.git
   ```
3. Stage, commit, and push changes:
   ```bash
   git add .
   git commit -m "Your descriptive commit message here"
   git push origin main
   ```
