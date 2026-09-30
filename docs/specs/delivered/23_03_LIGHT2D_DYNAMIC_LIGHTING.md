# Spec 23.03: Iluminação Dinâmica 2D (Light2D Pipeline)

## Objetivo
Substituir as falsas luzes de canvas por iluminação dinâmica de WebGL via `Light2D` do Phaser 4.2.1, integrando a cor ambiente de biomas, ponto de luz dinâmico do jogador e fontes de iluminação de props/magias.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Sistema de Iluminação (`src/game/systems/LightingSystem.ts`):**
  - Gerenciamento de `ambientColor` por bioma (frio espectral para catacumbas, rubro para santuário).
  - Ponto de luz dinâmico do jogador (`playerLight`) com raio e intensidade modulados pelo nível de HP atual.
  - Micro-flicker orgânico para tochas (`light_torch`) e braseiros (`light_brazier`).
- **Polimento de Iluminação (`src/game/systems/LightingPolish.ts`):**
  - Efeito de glow/bloom pontual para feitiços, itens raros, portais, monstros elites/bosses e eventos de combate.
  - Pulso carmesim na ponta do cajado do Bloodmage.
  - Transição de luz com ajuste de penumbra baseado na profundidade do andar (`floorDepth`).

## Referência no Código
- `src/game/systems/LightingSystem.ts` — Gerenciador principal de luzes ambiente e tochas.
- `src/game/systems/LightingPolish.ts` — Efeitos especiais de iluminação em entidades e eventos.
- `src/game/scenes/GameScene.ts` — Invocação e sincronização com a posição das entidades.

## Validação e Garantia de Qualidade
- 60 FPS garantido no desktop e mobile.
- Fallback automático para `darknessOverlay` no modo Canvas ou quando `postProcessingEnabled` = `false`.
