---
agent_context: qa, game-engine
target_module: tests/e2e/smoke-playable.spec.ts, playwright.smoke.config.ts, package.json
priority: high
criticality: medium
status: backlog
last_updated: 2026-10-07
tags: [specs, e2e, playwright, smoke, campanha, arcade, regressao, ears]
---

# Spec 35.02 — Gate E2E de Jogabilidade (Arcade + Campanha em Build de Produção)

> Satélite de [35.00 — Índice Mestre](./35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md). Achado coberto: **A8**.

## 1. Contexto

- O crash de produção corrigido em `3a52786` ("Campanha não jogável", item 20
  de `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`) só existia no caminho
  **Campanha**, e só foi reproduzido com Playwright contra build de produção.
- Hoje nenhum teste automatizado percorre esse caminho:
  - `tests/e2e/gameplay.spec.ts` (29 linhas) clica em JOGAR e verifica só que
    `#phaser-container canvas` existe — **passaria com o crash**, porque o
    canvas existe mesmo quando o renderer quebra no `render()`.
  - `tests/e2e/safe-house-animations.spec.ts` usa `/?biome=safe_house`,
    atalho DEV-only (`DungeonFlowController.ts:322`) que pula o fluxo real.
  - `tests/e2e/spec10-validation.spec.ts` entra só em `arcade`.
- Não existe `.github/workflows/`: nenhum E2E roda automaticamente.
- `playwright.config.ts` sobe `npm run dev` (porta 3000) — não o build de produção.
- A sonda de 2026-10-07 provou que o padrão abaixo funciona hoje em headless:
  `page.mouse.click(200,200)` → `window.useGameStore.getState().setGameMode(m)`
  → `setGameState('playing')` → aguardar `window.gameScene.player`. Ambos os
  globais são expostos também no build de produção (`App.tsx:41`,
  `GameScene.ts:240`).
- Skill a consultar: **`phaser-4-playtest-harness`** (já descreve este smoke test).

## 2. Objetivo

Um comando único que constrói o jogo em modo produção, entra em Arcade **e**
Campanha e falha se o jogador não estiver visível, se o renderer travar ou se
houver erro fatal no console.

## 3. Escopo

### 3.1 Dentro do Escopo
- `tests/e2e/smoke-playable.spec.ts` com 2 testes (arcade, campaign) + 1 teste
  de retrato mobile (390×844) na Campanha.
- `playwright.smoke.config.ts` apontando para `pnpm run build && pnpm run serve`
  (vite preview), porta própria (4173) para não colidir com o dev server.
- Script `"e2e:smoke"` em `package.json`.
- Detector de "renderer vivo": dois screenshots com 1 s de intervalo devem
  diferir (o loop de render avança) — pega o caso `3a52786`, em que o canvas
  existia mas o frame congelava.

### 3.2 Fora do Escopo
- Criar workflow de CI (ver §6 — decisão do Felipe).
- Golden screenshots / comparação de pixels (instáveis entre GPUs).
- Métricas de FPS (SwiftShader não é representativo).
- Alterar `playwright.config.ts` existente ou os specs E2E atuais.

## 4. Requisitos (EARS)

| ID | Requisito | Verificação |
|---|---|---|
| R35.02-01 | O comando `pnpm e2e:smoke` **DEVE** executar contra o bundle gerado por `pnpm run build`, nunca contra o dev server. | Config usa `webServer.command: 'pnpm run build && pnpm run serve --port 4173 --strictPort'` |
| R35.02-02 | **QUANDO** o modo `arcade` for iniciado, o teste **DEVE** aguardar até 30 s por `window.gameScene.player` e então afirmar `player.visible === true`, `player.alpha > 0` e `player.texture.key === 'spr_bloodmage'`. | `smoke-playable.spec.ts › arcade` |
| R35.02-03 | **QUANDO** o modo `campaign` for iniciado, o teste **DEVE** afirmar as mesmas condições de R35.02-02 **e** `window.useGameStore.getState().campaignState.currentZone` definido (tipo `ZoneType`, `src/types/campaign.ts:146`). | `smoke-playable.spec.ts › campaign` |
| R35.02-04 | **ENQUANTO** a cena estiver em jogo, o teste **DEVE** afirmar que o renderer está vivo: dois `canvas.screenshot()` separados por 1.000 ms **DEVEM** ter bytes diferentes. | helper `assertRendererAlive(page)` |
| R35.02-05 | **SE** ocorrer `pageerror` ou `console.error` contendo `WebGL`, `Shader`, `Cannot read properties of null` ou `resolution`, **ENTÃO** o teste **DEVE** falhar listando a mensagem. | listener registrado antes de `page.goto` |
| R35.02-06 | **SE** o único erro de console for `404` de asset com `required: false` no `assetManifest.json`, **ENTÃO** o teste **NÃO DEVE** falhar (fallback procedural esperado). | filtro por URL contra o manifest |
| R35.02-07 | **ONDE** o viewport for retrato 390×844 (`devices['iPhone 13']`), o teste da Campanha **DEVE** afirmar `page.getByText('ROTACIONE O DISPOSITIVO')` visível — texto de `RotateDeviceOverlay.tsx`, que não tem `data-testid` (regressão do item 19). | `smoke-playable.spec.ts › campaign portrait` |
| R35.02-08 | O teste **DEVE** usar o Chromium pré-instalado quando `PLAYWRIGHT_CHROMIUM_PATH` estiver definido (`launchOptions.executablePath`), sem `playwright install`. | Config lê a env var |

## 5. Requisitos Técnicos e Arquivos-Alvo

```ts
// playwright.smoke.config.ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: /smoke-playable\.spec\.ts/,
  workers: 1, retries: 0, timeout: 120_000,
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: { command: 'pnpm run build && pnpm run serve --port 4173 --strictPort',
               url: 'http://localhost:4173', reuseExistingServer: false, timeout: 240_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- `startMode(page, mode)`: `goto('/')` → `mouse.click(200,200)` →
  `waitForFunction(() => !!window.useGameStore)` →
  `evaluate(m => { const s = window.useGameStore.getState(); s.setGameMode(m); s.setGameState('playing'); })`
  → `waitForFunction(() => window.gameScene?.player?.scene)`.
- Os flags SwiftShader são necessários: sem eles o headless pode cair em
  Canvas e o teste deixaria de exercitar WebGL (que é onde A1/A2 vivem).
- `package.json`: `"e2e:smoke": "playwright test --config playwright.smoke.config.ts"`.

| Arquivo | Ação |
|---|---|
| `tests/e2e/smoke-playable.spec.ts` | criar |
| `playwright.smoke.config.ts` | criar |
| `package.json` | adicionar script `e2e:smoke` |
| `docs/critical/03_TESTING_GATES.md` | registrar `pnpm e2e:smoke` como gate antes de merge que toque renderer/cenas |

## 6. Decisões de Produto Necessárias

| Decisão | Default seguro se não houver resposta |
|---|---|
| Rodar o gate em CI (GitHub Actions) ou só local? | **Só local** (`pnpm e2e:smoke`) + registro em `03_TESTING_GATES.md`. Criar CI é mudança de infraestrutura e exige aprovação do Felipe. |

## 7. Testes e Critério de Aceite

1. `pnpm e2e:smoke` passa nos 3 testes no estado atual de `main`.
2. **Prova de que o gate pega regressão real:** reverter localmente o fix de
   `3a52786` (comentar a chamada `markOwnFloorChunkAsBuilt` em
   `DungeonFlowController.buildDungeonMap`) → o teste `campaign` **DEVE** falhar
   por R35.02-04 ou R35.02-05. Restaurar o fix. Registrar a saída no changelog.
3. `pnpm test` e `pnpm run typecheck` continuam passando.

## 8. Guardrails

- Nenhum arquivo de `src/` é alterado por esta spec.
- Não usar `?biome=` nem atalhos DEV-only — o objetivo é o fluxo real.
- Não adicionar `page.waitForTimeout` longo como substituto de `waitForFunction`.

## 9. Referências

- [[35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE]]
- `.claude/skills/phaser-4-playtest-harness/SKILL.md`
- `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` itens 19 e 20

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação (achado A8) | Claude |
