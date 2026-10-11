# Testes E2E e Golden (Playwright)

**Mestre:** [testing](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11
**Método:** estático
**Fonte:** `.husky/pre-commit`, `src/`, `./tests/e2e`, `src/App.tsx`

Nota de verificação: por leitura estática e por listagem; execução dos testes não validada.

Descrição dos testes em `tests/e2e/` e da configuração do Playwright. Conferido por leitura de `playwright.config.ts`, dos 5 arquivos `*.spec.ts`, de `package.json`, de `src/` e da [ADR 0009](../decisions/0009-testes-pre-commit-e-e2e.md).

## Como rodar

| Comando | Efeito | Validado |
|---|---|---|
| `pnpm run e2e` | `playwright test` (não existe `test:e2e`) | não validado (nenhum teste executado) |
| `pnpm run e2e:update` | `playwright test --update-snapshots` | não validado |
| `npx playwright test --list` | lista 20 testes em 5 arquivos, projeto `chromium` | validado em 2026-10-11, após `pnpm install --frozen-lockfile` |

## Configuração (`playwright.config.ts`)

| Item | Valor |
|---|---|
| Pasta | `./tests/e2e` |
| Execução | `workers: 1`, `fullyParallel: false`, `retries: 0`, timeout de 90 s por teste |
| Projeto | `chromium` (Desktop Chrome), viewport 1280x720 |
| Servidor | `webServer` roda `npm run dev` e espera `http://localhost:3000`; `reuseExistingServer: true` |
| Artefatos | trace `retain-on-failure`, screenshot `only-on-failure`, sem vídeo |
| Reporter | `list` |

## Arquivos

| Arquivo | Testes | O que cobre |
|---|---|---|
| `main-menu.spec.ts` | 3 | Sequência de splash ("DOS.V 6.66"), menu principal visível com um `canvas`, botão "Alternar Áudio" |
| `gameplay.spec.ts` | 1 | Congela o relógio, clica em JOGAR no canvas da `TitleScene` e espera `#phaser-container canvas` |
| `golden.spec.ts` | 3 | Screenshots de referência: menu principal, modal de configurações e modal de recordes (`maxDiffPixelRatio: 0.02`); usa `page.clock` para congelar animações |
| `spec10-validation.spec.ts` | 2 | Entra no jogo via `window.useGameStore` e `window.gameScene`, captura imagens dos 8 inimigos e do ambiente em `tests/e2e/screenshots/` |
| `safe-house-animations.spec.ts` | 11 | Canvas sem tela preta, boot da `GameScene`, bioma Safe House (`/?biome=safe_house`), Maelen, lareira, portal, baú, props, limpeza no shutdown, FPS e ausência de erros de console |

## Ganchos de teste que existem no código

| Gancho | Definido em |
|---|---|
| `window.useGameStore` | `src/App.tsx` (linha 41, sem guarda de ambiente) |
| `window.gameScene` | `src/game/scenes/GameScene.ts` (linha 227; zerado no shutdown) |
| Parâmetro de URL `biome` | `src/game/systems/DungeonFlowController.ts` (linha 325, lido de `window.location.search`) |

## Problemas encontrados

| Problema | Evidência |
|---|---|
| `safe-house-animations.spec.ts` (11 testes) usa `window.__PHASER_GAME__` em 20 pontos, mas nada em `src/` nem em `index.html` o define; os ganchos existentes são `window.useGameStore` e `window.gameScene` (`gameScene.game` dá a instância Phaser) | `grep` por `__PHASER_GAME__`: 20 ocorrências só no spec. Falha provável, não confirmada por execução. A [ADR 0009](../decisions/0009-testes-pre-commit-e-e2e.md) (aprovada) decide trocar por `window.gameScene.game`; a troca ainda não foi feita no spec |
| Baselines de `golden.spec.ts-snapshots/`: `main-menu-chromium-linux.png`, `main-menu-chromium-win32.png`, `settings-modal-chromium-win32.png`, `high-scores-modal-chromium-win32.png`; em Linux só o menu principal tem referência | Playwright nomeia o baseline por plataforma |
| O e2e depende do dev server na porta 3000; `vite.config.ts` usa `strictPort: true` (porta 3000 ou `PORT`) e o `webServer` chama `npm run dev` | `playwright.config.ts`, `vite.config.ts`, `package.json` (`dev`) |
| Nenhum hook nem CI executa os e2e: `.husky/pre-commit` roda só `docs:check` e `verify`; não existe `.github/` | `.husky/pre-commit`, `ls` |

## Não validado

- Se qualquer teste e2e passa hoje (nenhum foi executado; sem servidor e sem `playwright install`).
- Que os baselines `win32` vêm do ambiente do responsável (inferido só pelo nome do arquivo).
- Que `spec10-validation.spec.ts` e `gameplay.spec.ts` funcionam; só foi lida a estrutura.
