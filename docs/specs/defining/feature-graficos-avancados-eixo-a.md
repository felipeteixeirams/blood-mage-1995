# Eixo A — Gráficos Avançados (postFX, Iluminação Light2D e Normal Maps)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática + `grep`; testes não executados). Existe: `PostFXSystem.ts` (vignette, ColorMatrix por bioma, Displacement, guarda WebGL, `PostFXSystem.test.ts`); `LightingSystem.ts` (Light2D, `ambientColor` por bioma em `BIOME_LIGHTING`, luz do jogador por HP, tochas, no-op fora de WebGL ou com `postProcessingEnabled` false) e `LightingPolish.ts`; `generateNormalMap` em `textureGenerator.ts` (testado em `textureGenerator.test.ts`) aplicado via `addTextureWithNormalMap` a `tile_ground` (e variações), paredes, portas, baú e 9 inimigos (`spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_gore_abomination`); flag `postProcessingEnabled` em `types/game.ts`, `localStorage.ts` (Zod) e lida em `GameScene.ts` (~l.299/308). Falta ou diverge: `spr_bloodmage` é registrado por `addSpriteSheet`, sem normal map; `ScreenEffects.render()` não é chamado em lugar nenhum (`grep -rn "screenEffects" src`: só `update`, `effectDeath`, `triggerFearDistortion`), logo o fallback Canvas dos efeitos não é desenhado; o `darknessOverlay` é desenhado uma vez em `create()` e `clear()` a cada frame em `GameScene.updateThreatIndicator` (~l.1852), sem redesenho (fallback de escuridão em Canvas ausente); não há controle de UI para `postProcessingEnabled` (a chave i18n `settings.postProcessing` existe em `ptBR.ts`/`enUS.ts`, mas nada a usa); `WorldManager` não expõe config de iluminação (a config está em `LightingSystem`); 60 FPS, E2E golden e regressão visual não verificados.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Substituir iluminação falsa por Light2D real mantendo fallback para Canvas (`darknessOverlay`/`ScreenEffects`).
2. Flag `postProcessingEnabled` (padrão `true`) nas settings.
3. Normal maps apenas para player, 2 inimigos e tile de chão (escopo do MVP).
4. Texto original dizia "Escopo aprovado"; reescrito como proposto.

---

## Contexto

O jogo usa **Phaser 4.2.1**, com texturas procedurais. Pontos relevantes para esta proposta:

- `ScreenEffects.render()` nunca é chamado (ver "Estado vs código"): os efeitos Canvas dele não são desenhados.
- A API do Phaser 4.2.1 está disponível: `camera.filters.internal/external.add*()` (Vignette, Glow, ColorMatrix, Displacement, Pixelate, ParallelFilters) e `LightsPlugin` (registrado nos DefaultPlugins → `this.lights`), com shaders `PointLight`/`ApplyLighting` e `BatchHandlerPointLight` no renderer WebGL.

**Escopo proposto (Eixo A):** substituir a iluminação por overlay por iluminação real + postFX GPU, mantendo fallback funcional e zero assets externos.

## Design proposto

1. **PostFXSystem** (`src/game/systems/PostFXSystem.ts`): centraliza os filtros de câmera do Phaser 4. API espelhada ao `ScreenEffects` atual (`setVignette`, `setChromaticAberration`, `setTint`, `effectDeath`, `effectCriticalDamage`, `effectInfection`, `effectTension`, `reset`, `update`) para troca drop-in no `GameScene`.
   - `internal` = filtros sobre o frame completo; `external` = filtros sobre o pós (fonte: docs do Phaser 4).
   - Guarda de renderização: apenas aplicar `camera.filters` se o renderer for WebGL. Fallback: manter `ScreenEffects` (Canvas) para `Phaser.CANVAS`.
   - `ColorMatrix` por bioma (gradação) em `setBiome()`.
   - `Displacement` (wave distortion) para status de infecção/medo — hoje simulado e invisível.
2. **Normal maps procedurais**: função pura `generateNormalMap(canvas, strength)` em `src/utils/textureGenerator.ts` que calcula a derivada da luminância (Sobel-ish) e gera canvas RGB de normal map por textura. Aplicar a `spr_bloodmage`, 2 inimigos e `tile_ground` via `setNormalMap()`/`setTexture` com normal map.
3. **Iluminação Light2D**: `src/game/systems/LightingSystem.ts` (ou integrado ao `WorldManager`):
   - `this.lights.enable()` com `ambientColor` por bioma (frio para Catacumbas, rubro para Santuário).
   - Luz do player com raio variando por HP (reaproveitar lógica `WorldManager.updateLighting`).
   - Tochas/braseiros existentes ganham luz real via `addLight`.
   - `setLighting(true)` em player, inimigos e tiles.
   - **Fallback**: `darknessOverlay` de Graphics continua existindo quando renderer não for WebGL (anti-regressão visual).
4. **Toggle de performance**: nova flag `postProcessingEnabled` (default `true`) em `GameSettings` + persistência Zod. Quando `false`, desliga filtros e luzes (modo compat).

## Critérios de aceite (provisórios, sem IDs EARS)

- `PostFXSystem` aplica vignette/colormatrix/displacement via GPU com fallback Canvas funcional
- `ScreenEffects.render()` continua sendo chamado como fallback (bug da chamada ausente corrigido no fluxo de fallback)
- Normal maps gerados proceduralmente para player + 2 inimigos + tile de chão
- Luzes dinâmicas substituem os overlays do `WorldManager` sem regressão visual em WebGL
- Toggle `postProcessingEnabled` nas settings desliga filtros e luzes
- 60 FPS mantidos em desktop (ver `docs/engineering/performance.md`)
- Testes unitários para `generateNormalMap` e lógica pura do `PostFXSystem`
- E2E golden continua verde (menu principal) e gameplay continua startável

## Arquivos Envolvidos

- `src/game/systems/PostFXSystem.ts`
- `src/game/systems/LightingSystem.ts`
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
