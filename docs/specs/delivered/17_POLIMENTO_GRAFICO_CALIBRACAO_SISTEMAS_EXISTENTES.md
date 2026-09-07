---
agent_context: game-engine, graphics-architect, frontend, qa
target_module: src/game/systems, src/game/scenes, src/game/shaders, src/utils
priority: high
status: delivered
implementation_status: completed
last_updated: 2026-09-07
tags:
  - specs
  - graphics
  - visual-polish
  - calibration
  - phaser4
  - lighting
  - postfx
  - atmosphere
  - shadows
  - reflections
  - particles
  - performance
---

# Spec 17 — Polimento Gráfico por Calibração dos Sistemas Existentes

> **Status:** 100% Concluído, testado e integrado.
> **Data:** 7 de setembro de 2026
> **Domínio:** Renderização Phaser 4, iluminação, pós-processamento, atmosfera, sombras, reflexos, partículas e validação visual.
> **Princípio:** melhorar o que já existe antes de adicionar qualquer coisa.

---

## 1. Resumo Executivo

O *Bloodmage 1995* possui uma camada gráfica procedural ampla: Light2D, Glow, pós-processamento de câmera, cascata de cor por profundidade, névoa por bioma, clima, sombras direcionais, reflexos líquidos, partículas de combate, shaders atmosféricos e texturas assadas.

Esta spec calibrou e integrou com precisão os sistemas existentes:
1. correção de inicialização e limpeza de filtros (`enableFilters`, `camera.filters.external`);
2. calibração de intensidade, raio, alpha, blending, timing e profundidade em todos os subsistemas gráficos;
3. composição consistente entre luz, cor, névoa, sombra, reflexo e partículas;
4. sequenciamento de efeitos temporários via tokens para evitar sobreposição residual;
5. preservação da taxa de quadros e orçamento de performance.

---

## 2. Escopo Entregue

- ✅ **Frente A (Glow/Bloom)**: `LightingPolish` - verificação de `enableFilters()`, idempotência em reciclagem de ObjectPool, suporte a re-calibração em sprites ativos e limite de 16 alvos.
- ✅ **Frente B (Pós-processamento PostFX)**: `PostFXSystem` - tokens de sequência (`effectSequenceCounter`) para impedir que timers defasados sobrescrevam novos efeitos temporários, e preservação estrita de `activeFloorDepth` na gradação de bioma (`applyBiomeMatrix`).
- ✅ **Frente C (Iluminação Dinâmica Light2D)**: `LightingSystem` - calibração por bioma, diminuição suave do raio de luz do jogador com HP crítico, oscilação orgânica de tochas/braseiros e desacoplamento limpo no shutdown/transição de andar.
- ✅ **Frente D (Atmosfera e Névoa)**: `AtmosphereSystem` - tetos operacionais de opacidade (0.16 solo, 0.06 superior), guardrail de visibilidade durante combate pesado (0.7x) e emissor de clima desacoplado para baixa performance.
- ✅ **Frente E (Sombras 2.5D)**: `ShadowSystem` - ancoragem precisa nos pés por escala/altura, projeção oposta à luz mais próxima e fallback elíptico para sombra de contato.
- ✅ **Frente F (Reflexos Líquidos)**: `ReflectionSystem` - tint e opacidade diferenciados para sangue (0x7f1d1d / 0.32) e água (0x1e293b / 0.26), sincronização de textura/frame de sprites e ondulação senoidal discreta.
- ✅ **Frente G (Partículas Avançadas)**: `AdvancedParticles` - 9 emissores calibrados por intensidade/tipo, suporte a low performance mode e limpeza idempotente no shutdown.
- ✅ **Frente H (Shader e Terreno Procedural)**: `AtmosphericTreeShader` e `TerrainDetailFactory` - balanço de vento orgânico, AO e névoa direcional integrados, e bakes de flora procedural estáticos.
- ✅ **Frente I (Integração e Ordem de Renderização)**: Profundidades relativas padronizadas (piso 0-5, poças 6, sombras 8, tochas 10, reflexos 12, entidades 20-50, fog 750, upper haze 1995, HUD 2000+) e suíte completa de testes unitários passando 100%.

---

## 3. Comandos de Verificação

```bash
pnpm run typecheck
pnpm test -- --run
pnpm run build
pnpm run verify
```
