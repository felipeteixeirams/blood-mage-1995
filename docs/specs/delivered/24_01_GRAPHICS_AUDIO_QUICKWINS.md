# Spec 24.01: Quick Wins Visuais & Auditivos (Fear, Light Cascade, Tinnitus)

## Objetivo
Implementar melhorias de curto prazo de alto impacto na imersão visual e auditiva do *Blood Mage 1995*, incluindo pavor por distorção de tela, transição climática de luz por profundidade de andar e zumbido de ameaça para HP crítico.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Distorção de Medo (Fear Distortion):**
  - Pulso instantâneo de distorção de onda e vinheta escura ao encarar Bosses ou rugidos de Elites (`PostFXSystem.triggerFearDistortion()`).
  - Toggle de Acessibilidade: `fearDistortionEnabled` no Store e menu de Ajustes.
- **Cascata de Luz (Light Cascade):**
  - Transição de cor ambiente e gradação de pós-processamento de acordo com o andar (`floorDepth`): azul frio (Floors 1-2), púrpura necromântico (Floors 3-5) e vermelho infernal (Floors 6+).
- **Tinnitus de Ameaça (Threat Tinnitus):**
  - Feedback auditivo composto por tom senoidal agudo (~3.5kHz) + filtro passa-baixas (low-pass) no BGM quando HP < 30% ou próximo a rugidos de elite (`soundEngine.ts`).
  - Toggle de Acessibilidade: `tinnitusEnabled` no Store e menu de Ajustes.

## Referência no Código
- `src/game/systems/PostFXSystem.ts` — Efeito de Fear Distortion.
- `src/game/systems/WorldManager.ts` — Gradação de cor por `floorDepth`.
- `src/utils/soundEngine.ts` — Sintetizador de tinnitus e filtro low-pass.
- `src/game/scenes/SettingsScene.ts` — Toggles no menu de acessibilidade.

## Validação e Garantia de Qualidade
- Testado e validado nos modos WebGL e Canvas.
- Acessibilidade garantida com opções de desativação para fotossensibilidade e sensibilidade auditiva.
