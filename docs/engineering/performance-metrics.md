# Métricas de Performance

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `src/game/systems/PerformanceMonitor.test.ts`, `src/game/systems/PerformanceMonitor.ts`, `tests/e2e/safe-house-animations.spec.ts`

O projeto não tem medições de performance registradas. As metas numéricas que existiam neste documento (FPS mínimo, heap abaixo de 150 MB, menos de 45 draw calls) não tinham medição nem teste que as sustentasse e foram removidas. Definir metas é decisão do responsável.

## O que o código mede hoje

| Mecanismo | Onde | O que faz |
|---|---|---|
| `PerformanceMonitor` | `src/game/systems/PerformanceMonitor.ts` | Calcula FPS por frame, mantém histórico de 300 amostras (`maxHistory`), expõe `avgFps`/`minFps`/`maxFps` e, quando o navegador oferece `performance.memory` (Chromium), memória JS usada em MB. Exibe um painel fixo no canto da tela. Não conta draw calls |
| Ativação | `GameScene.create` (linhas 470-484) e `update` (linha 1099) | Só liga se a URL tiver o parâmetro `perf` (por exemplo `?perf=1`) |
| Teste e2e de FPS | `tests/e2e/safe-house-animations.spec.ts`, teste "FPS stability" | Espera `game.loop.actualFps` entre 50 e 70 após 3 s na Safe House. Depende de `window.__PHASER_GAME__`, que nenhum arquivo do projeto define (ver a seção de e2e em [testing](../testing/README.md)); não serve como evidência de FPS |
| Teste unitário | `src/game/systems/PerformanceMonitor.test.ts` | Cobre o monitor, não o desempenho do jogo |

## Não verificado

- Qualquer valor de FPS, heap ou draw calls do jogo em execução (nenhuma execução foi feita).
