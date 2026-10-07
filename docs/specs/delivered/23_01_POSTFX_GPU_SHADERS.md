# Spec 23.01: Pós-Processamento GPU e Shaders de Câmera (PostFXSystem)

## Objetivo
Centralizar e gerenciar os efeitos de pós-processamento de câmera GPU no Phaser WebGL pipeline via `PostFXSystem`, oferecendo suporte a vinheta dinâmica, aberração cromática, gradação de cores por bioma (ColorMatrix), distorções de onda (Displacement) e ondas de choque radiais (Shockwave), mantendo fallback funcional para renderizador Canvas via `ScreenEffects`.

## Status
🟢 COMPLETO

## O que foi Entregue
- **PostFXSystem GPU (`src/game/systems/PostFXSystem.ts`):**
  - Implementação de filtros WebGL internos e externos sobre a câmera principal do Phaser.
  - `setVignette(intensity)`: Vinheta escura reativa em bordas.
  - `setChromaticAberration(amount)`: Separação de canais RGB durante dano/tensão.
  - `setBiome(biome)`: Gradação de cores GPU via `ColorMatrix` adaptada a cada bioma.
  - `triggerShockwave(x, y)` & `setDisplacement()`: Distorções de onda no espaço de tela para explosões, medos e status.
- **Fallback Gracioso para Canvas:**
  - Manutenção do `ScreenEffects.ts` utilizando primitivas `Graphics` quando o renderer for `Phaser.CANVAS` ou quando `postProcessingEnabled` for desativado.
- **Toggle de Configuração:**
  - Persistência Zod de `postProcessingEnabled` em `GameSettings`, permitindo desativar pós-processamento em hardware de baixo desempenho.

## Referência no Código
- `src/game/systems/PostFXSystem.ts` — Gerenciador de filtros GPU.
- `src/game/systems/PostFXSystem.test.ts` — Suíte de testes do sistema PostFX.
- `src/game/systems/ScreenEffects.ts` — Engine de fallback Canvas.
- `src/game/scenes/GameScene.ts` — Integração no loop principal de jogo.

## Validação e Garantia de Qualidade
- 100% dos testes unitários verdes em `PostFXSystem.test.ts`.
- Validação de renderização sem erros no modo WebGL e Canvas.

## ⚠️ Correção pós-entrega (2026-10-07)

Execução real (sonda Playwright, WebGL) mostrou `postFX.isWebGL === false` e 0 filtros em `cameras.main.filters.external`: `PostFXSystem.ts:56` testa `renderer.isWebGL`, propriedade que não existe no `WebGLRenderer` do Phaser 4.2.1. Os testes passavam porque o mock injeta `isWebGL: true`. Correção especificada em [`backlog/35_01`](../backlog/35_01_DETECCAO_WEBGL_E_LIGHT2D_PHASER4.md); achado A1 em [`backlog/35_00`](../backlog/35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).
