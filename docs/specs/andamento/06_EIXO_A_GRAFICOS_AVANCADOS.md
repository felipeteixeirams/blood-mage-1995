---
agent_context: game-engine, frontend
target_module: artifacts/bloodmage/src/game
priority: high
status: ANDAMENTO
start_date: 2026-08-11
responsible: opencode (Felipe)
progress: 70% (PostFXSystem, normal maps, LightingSystem, toggle de settings e testes implementados)
agent_context: game-engine, frontend
tags: [specs, phase-3, postfx, iluminacao, normal-maps, webgl]
last_updated: 2026-08-11
---

# 🎨 Eixo A — Gráficos Avançados (postFX, Iluminação Light2D e Normal Maps)

> **Status:** Em Andamento | **Origem:** [[../propostas/01_EVOLUCAO_GRAFICA_AVANCADA.md]]

## Contexto

O jogo é 100% procedural e usa **Phaser 4.2.1 + WebGL**, mas nenhum shader/filtro/iluminação real é usado. Auditoria confirmou:

- **`ScreenEffects` está "morto"**: `render()` nunca é chamado (`grep` no `GameScene` só acha `update()` e setters). Os efeitos de vinheta/tint/distorção são setados mas nunca desenhados no canvas — o jogador nunca os vê.
- **`WorldManager.updateLighting` + `darknessOverlay`** em `GameScene.ts:1309` simulam iluminação com círculos concêntricos em `Graphics` (falsa iluminação em Canvas, custo por frame em CPU).
- A API do Phaser 4.2.1 está disponível: `camera.filters.internal/external.add*()` (Vignette, Glow, ColorMatrix, Displacement, Pixelate, ParallelFilters) e `LightsPlugin` (registrado nos DefaultPlugins → `this.lights`), com shaders `PointLight`/`ApplyLighting` e `BatchHandlerPointLight` no renderer WebGL.

**Escopo aprovado (Eixo A):** substituir a falsa iluminação por iluminação real + postFX GPU, mantendo fallback funcional e zero assets externos.

## Decisões de Design

1. **PostFXSystem** (novo, `src/game/systems/PostFXSystem.ts`): centraliza os filtros de câmera do Phaser 4. API espelhada ao `ScreenEffects` atual (`setVignette`, `setChromaticAberration`, `setTint`, `effectDeath`, `effectCriticalDamage`, `effectInfection`, `effectTension`, `reset`, `update`) para troca drop-in no `GameScene`.
   - `internal` = filtros sobre o frame completo; `external` = filtros sobre o pós (fonte: docs do Phaser 4).
   - Guarda de renderização: apenas aplicar `camera.filters` se o renderer for WebGL. Fallback: manter `ScreenEffects` (Canvas) para `Phaser.CANVAS`.
   - `ColorMatrix` por bioma (gradação) em `setBiome()`.
   - `Displacement` (wave distortion) para status de infecção/medo — hoje simulado e invisível.
2. **Normal maps procedurais**: função pura `generateNormalMap(canvas, strength)` em `src/utils/textureGenerator.ts` que calcula a derivada da luminância (Sobel-ish) e gera canvas RGB de normal map por textura. Aplicar a `spr_bloodmage`, 2 inimigos e `tile_ground` via `setNormalMap()`/`setTexture` com normal map.
3. **Iluminação Light2D**: novo `src/game/systems/LightingSystem.ts` (ou integrado ao `WorldManager`):
   - `this.lights.enable()` com `ambientColor` por bioma (frio para Catacumbas, rubro para Santuário).
   - Luz do player com raio variando por HP (reaproveitar lógica `WorldManager.updateLighting`).
   - Tochas/braseiros existentes ganham luz real via `addLight`.
   - `setLighting(true)` em player, inimigos e tiles.
   - **Fallback**: `darknessOverlay` de Graphics continua existindo quando renderer não for WebGL (anti-regressão visual).
4. **Toggle de performance**: nova flag `postProcessingEnabled` (default `true`) em `GameSettings` + persistência Zod. Quando `false`, desliga filtros e luzes (modo compat).

## Critérios de Aceite

- [ ] `PostFXSystem` aplica vignette/colormatrix/displacement via GPU com fallback Canvas funcional
- [ ] `ScreenEffects.render()` continua sendo chamado como fallback (bug da chamada ausente corrigido no fluxo de fallback)
- [ ] Normal maps gerados proceduralmente para player + 2 inimigos + tile de chão
- [ ] Luzes dinâmicas substituem os overlays do `WorldManager` sem regressão visual em WebGL
- [ ] Toggle `postProcessingEnabled` nas settings desliga filtros e luzes
- [ ] 60 FPS mantidos em desktop (gate `critical/04_PERFORMANCE_METRICS.md`)
- [ ] Testes unitários para `generateNormalMap` e lógica pura do `PostFXSystem`
- [ ] E2E golden continua verde (menu principal) e gameplay continua startável

## Arquivos Envolvidos

- `src/game/systems/PostFXSystem.ts` (novo)
- `src/game/systems/LightingSystem.ts` (novo)
- `src/game/systems/WorldManager.ts` (expor config de iluminação por bioma para o LightingSystem)
- `src/game/scenes/GameScene.ts` (usar PostFXSystem + LightingSystem; manter fallback ScreenEffects)
- `src/utils/textureGenerator.ts` (gerar normal maps procedurais)
- `src/types/game.ts` (`GameSettings.postProcessingEnabled`)
- `src/utils/localStorage.ts` (schema Zod com nova flag)
- `src/store/gameStore.ts` (getter/setter padrão via `updateSettings`)

## Riscos e Mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Filtros WebGL quebram em Canvas | Médio | Fallback `ScreenEffects`; feature-detect de WebGL |
| Iluminação Light2D custa FPS em mobile | Alto | `maxLights` baixo, raios curtos, toggle `postProcessingEnabled`, validar com `PerformanceMonitor` |
| Mudança visual quebra goldens E2E | Médio | Golden do menu principal não usa `GameScene`; gameplay test valida start apenas |
| Normal maps procedurais ficam "falsos" | Médio | Strength configurável; apenas player + 2 inimigos + tile no MVP |

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação — spec de implementação do Eixo A | opencode (Felipe) |
| 2026-08-11 | Implementação: PostFXSystem (vignette/colormatrix/displacement GPU), normal maps procedurais (generateNormalMap), LightingSystem Light2D (ambientColor por bioma, luz do player por HP, tochas), toggle `postProcessingEnabled` nas settings, integração no GameScene com fallback ScreenEffects | opencode (Felipe) |
| 2026-08-11 | Testes: generateNormalMap (5) + PostFXSystem (8); coverage global 87.89% lines; typecheck raiz+game, 84 vitest, 7 e2e e build verdes | opencode (Felipe) |
