# Spec 24.03: Shaders de Status, Sombras 2.5D e Reflexos em Líquidos

## Objetivo
Implementar projeções de sombra dinâmicas orientadas a fontes de luz, efeitos visuais de status elementais e reflexos espelhados em superfícies líquidas.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Sombras Direcionais 2.5D (`src/game/systems/ShadowSystem.ts`):**
  - Projeção de sombras elípticas orientadas por vetor oposto à fonte de luz mais próxima (jogador, tochas e orbes).
  - Compressão de altura (`elevation`), rotação no plano isométrico e opacidade adaptativa.
- **Efeitos Visuais de Status Elementais (`src/game/systems/StatusEffectSystem.ts`):**
  - Queimado (Burn): Faíscas dinâmicas (`particle_ember_spark`), pulsação térmica de matiz de cor e DoT periódico.
  - Congelado (Freeze): Matiz ciano gélido (`0x67e8f9`), partículas de gelo e congelamento de animação.
  - Amaldiçoado / Corrupção (Curse): Halo de fogo negro e amplificação de dano recebido (+25%).
- **Reflexos Procedurais em Poças Líquidas (`src/game/systems/ReflectionSystem.ts`):**
  - Inversão vertical do sprite espelhado (`setFlipY(true)`), ondulação senoidal com ripples (`spr_reflection_ripple`) e atenuação de opacidade ao passar por zonas de sangue/água.

## Referência no Código
- `src/game/systems/ShadowSystem.ts` — Sistema de sombras 2.5D.
- `src/game/systems/StatusEffectSystem.ts` — Sistema de efeitos de status elementais.
- `src/game/systems/ReflectionSystem.ts` — Sistema de reflexos em pisos líquidos.

## Validação e Garantia de Qualidade
- Testes unitários 100% verdes (`ShadowSystem.test.ts`, `StatusEffectSystem.test.ts`, `ReflectionSystem.test.ts`).
- Zero overhead de GPU/CPU em telas sem superfícies reflexivas ou luzes dinâmicas.
