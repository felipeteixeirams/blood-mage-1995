# Testes E2E e Golden (Playwright)

**Mestre:** [testing](README.md)
**Status:** não verificado
**Verificado em:** —

Descrição dos testes em `tests/e2e/` e da configuração do Playwright. Conferido por leitura estática de `playwright.config.ts`, dos 5 arquivos `*.spec.ts` e de `src/`. Nenhum teste e2e foi executado (sem `node_modules` e sem navegador no worktree); por isso o status é "não verificado" quanto ao funcionamento real.

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
| `window.useGameStore` | `src/App.tsx` (linha 41) |
| `window.gameScene` | `src/game/scenes/GameScene.ts` (linha 229) |
| Parâmetro de URL `biome` | `src/game/systems/DungeonFlowController.ts` (linha 326) |

## Problemas encontrados (leitura estática)

| Problema | Evidência |
|---|---|
| `safe-house-animations.spec.ts` usa `window.__PHASER_GAME__` em 20 pontos, mas nenhum arquivo do projeto (fora do próprio spec) o define | busca por `__PHASER_GAME__` em `.ts/.tsx/.html/.js`; esses testes provavelmente não conseguem passar, não confirmado por execução |
| Os baselines de `golden.spec.ts-snapshots/` são `main-menu-chromium-linux.png`, `main-menu-chromium-win32.png`, `settings-modal-chromium-win32.png` e `high-scores-modal-chromium-win32.png`: em Linux só o menu principal tem referência | Playwright nomeia o baseline por plataforma |
| Os e2e dependem do dev server (`npm run dev`, porta 3000); o `vite.config.ts` usa `strictPort: true` | `playwright.config.ts`, `vite.config.ts` |
| Nenhum hook nem CI executa os e2e (ver [testing-gates](testing-gates.md)) | `.husky/pre-commit`, ausência de `.github` |

## Não verificado

- Se qualquer teste e2e passa hoje.
- Em que ambiente o responsável gerou os baselines `win32` (inferido só pelo nome do arquivo).
