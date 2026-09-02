---
agent_context: lead-architect, project-manager
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-31
tags: [specs, master-index, graphics, postfx, light2d, normal-maps, webgl]
---

# 🎨 Spec 23: ÍNDICE MESTRE — Eixo A: Gráficos Avançados (postFX, Light2D e Normal Maps)

## Objetivo Geral
Estruturar e gerenciar a evolução gráfica avançada do *Blood Mage 1995*, implementando iluminação GPU real via Phaser Light2D pipeline, pós-processamento de câmera WebGL (PostFXSystem) com fallback gracioso para Canvas, normal maps procedurais e toggles de acessibilidade/desempenho. O foco foi substituir a antiga iluminação de CPU (Graphics darkness overlay) por iluminação GPU real sem necessitar de assets externos pesados.

---

## 📚 Mapeamento das Frentes Gráficas (Satélites)

Todas as frentes de gráficos avançados foram dissecadas e validadas na base de código:

| ID | Especificação Satélite | Frente Gráfica | Status |
|---|---|---|---|
| **23.01** | [`23_01_POSTFX_GPU_SHADERS.md`](./23_01_POSTFX_GPU_SHADERS.md) | Pós-Processamento GPU e Shaders de Câmera | 🟢 COMPLETO |
| **23.02** | [`23_02_PROCEDURAL_NORMAL_MAPS.md`](./23_02_PROCEDURAL_NORMAL_MAPS.md) | Normal Maps Procedurais em Runtime | 🟢 COMPLETO |
| **23.03** | [`23_03_LIGHT2D_DYNAMIC_LIGHTING.md`](./23_03_LIGHT2D_DYNAMIC_LIGHTING.md) | Iluminação Dinâmica 2D (Light2D Pipeline) | 🟢 COMPLETO |

---

## 📈 Resumo das Entregas & Auditoria no Código

- **Frente 1 (PostFX System):** Entregue em `src/game/systems/PostFXSystem.ts` (Vignette, Chromatic Aberration, ColorMatrix por bioma, Displacement wave e Shockwave radial com fallback Canvas em `ScreenEffects.ts`).
- **Frente 2 (Normal Maps Procedurais):** Entregue em `src/utils/textureGenerator.ts` (`generateNormalMap` usando algoritmo Sobel-ish de derivada de luminância e `addTextureWithNormalMap`).
- **Frente 3 (Iluminação Light2D):** Entregue em `src/game/systems/LightingSystem.ts` e `LightingPolish.ts` (ambientColor por bioma, luz do player reativa a HP, tochas/braseiros com micro-flicker e auras de portal/ spells/itens).
- **Configuração de Performance:** `postProcessingEnabled` integrado em `src/types/game.ts`, `src/utils/localStorage.ts` (Zod schema) e `src/store/gameStore.ts`.

---

## Validação & Qualidade
- Compilação estrita em TypeScript (`pnpm run typecheck`).
- Suíte de testes automatizados (`PostFXSystem.test.ts`, `generateNormalMap` em `textureGenerator.test.ts`).
- 60 FPS garantido em testes de performance WebGL.
