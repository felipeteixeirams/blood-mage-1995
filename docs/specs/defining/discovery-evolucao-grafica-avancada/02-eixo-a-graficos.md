# Evolução gráfica avançada: Eixo A, gráficos procedurais (parte 2)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática). Existe: Vignette, ColorMatrix (gradação por bioma) e Displacement em `src/game/systems/PostFXSystem.ts` (substituiu o `ScreenEffects.applyVignette`/`applyDistortion` em uso); Glow por objeto em `LightingPolish.ts` e `Enemy.ts`; `LightingSystem` com `scene.lights.enable()`, luz do jogador, tochas e cor ambiente por andar; `generateNormalMap` com normal maps de 11 inimigos, tiles e props; flags `postProcessingEnabled` e `lowPerformanceParticles`; `PerformanceMonitor` (`?perf`). Falta: Pixelate, bloom por evento, `setLighting(true)` no jogador, tilemap e partículas (só `Enemy.ts` chama), self-shadow, `maxLights`, normal map do jogador, controle de UI para `postProcessingEnabled`, fallback funcional sem WebGL (`ScreenEffects.render` não é chamado), medição de 60 FPS.

Parte 2 de 5. Índice das partes: [README](README.md).

## Escopo
Se aprovado, só o que falta do Eixo A (substituir iluminação falsa por Light2D e filtros GPU, com zero arte externa):
1. **Pixelate** nos limites de cena (decisão 5, parte 1).
2. **Bloom por evento** (crítico, execução) reaproveitando o Glow de `LightingPolish`, ativo só durante o evento (decisão 6).
3. **Light2D em mais objetos:** `setLighting(true)` no jogador, nos tiles e nas partículas, mantendo `ambientColor` por bioma; luzes de tocha com `z` (altura) explícito; raio da luz do jogador variando com o HP (reaproveitar a lógica de `WorldManager.updateLighting`).
4. **Normal map procedural** para o jogador, por derivada da spritesheet física ou ajuste manual (ferramenta Laigter).
5. **Self-shadow** por objeto ou por configuração `render.selfShadow` (decisão 7).
6. **Limite de luzes** `maxLights` na configuração do jogo e raios curtos; medir com `PerformanceMonitor`.
7. **Toggle de qualidade** nas Configurações (liga e desliga `postProcessingEnabled`).
8. **Fallback sem WebGL:** decisão do ADR 0005 (religar ou remover `ScreenEffects`).

Lista original de filtros para referência: Vignette, Glow/Blur, ColorMatrix, Pixelate/Blocky, Bloom (ParallelFilters), Displacement. Filtros são WebGL-only.

Esforço estimado no original (não verificado): filtros 2 a 3 dias; Light2D e normal maps 3 a 5 dias, com risco de performance em mobile; normal maps no `textureGenerator` 1 a 2 dias.

## Arquivos e contratos
- Alterar: `src/game/systems/PostFXSystem.ts`, `src/game/systems/LightingSystem.ts`, `src/game/systems/LightingPolish.ts`, `src/game/objects/Player.ts`, `src/utils/textureGenerator.ts`, a configuração do jogo em `src/game/PhaserGame.tsx` (e as outras instâncias de `Phaser.Game` se `maxLights` for global) e o controle em `src/game/scenes/SettingsScene.ts`.
- Atualizar no mesmo commit: `docs/gameplay/lighting-and-effects.md`, `docs/engineering/performance.md` e `Verificado em`.
- Não tocar sem ler antes `docs/engineering/risky-files.md`: `GameScene.ts`, `Player.ts`, `Enemy.ts`. Extrair lógica nova para `src/game/systems/`.
- Contrato: com `postProcessingEnabled` falso ou sem WebGL, nenhum filtro nem luz é criado e o jogo continua jogável; sem criar objetos no `update` (pooling); limpar luzes, tweens e filtros em `shutdown`/`destroy`.
- Valores concretos (`maxLights`, raios, intensidades): em aberto, parte 5.

Critérios, verificação e pendências: [parte 5](05-criterios-e-pendencias.md).
