---
agent_context: game-designer, game-engine, qa
target_module: src/game/systems/LightingSystem.ts, src/game/systems/PostFXSystem.ts, src/game/systems/LightingPolish.ts, src/game/systems/AtmosphereSystem.ts, src/game/systems/DungeonGenerator.ts, src/game/PhaserGame.tsx
priority: high
criticality: medium
status: scope-definition
last_updated: 2026-10-07
tags: [specs, calibracao, direcao-de-arte, performance, mobile, light2d, postfx, ears]
---

# Spec 35.05 — Calibração Visual Pós-Religação e Orçamento de Render

> Satélite de [35.00 — Índice Mestre](../backlog/35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE.md).
> Achados cobertos: **A10, A11** + riscos que só aparecem depois de 35.01/35.03/35.04.
> **Por que está em `scope-definition/`:** as metas numéricas (aparelho-alvo,
> FPS mínimo, leitura por bioma) são decisões do Felipe que mudam o código.

## 1. Contexto

- `delivered/17` calibrou cor, raio, alpha e timing de Light2D, PostFX, névoa,
  sombras, reflexos e partículas — **com Light2D e PostFX desligados em runtime**
  (achado A1). Os números de `BIOME_LIGHTING` (`LightingSystem.ts:19-60`) e das
  matrizes de `PostFXSystem.ts:~40-50` nunca foram vistos juntos na tela.
- Ao religar (35.01), mudam ao mesmo tempo: ambiente por bioma passa a escurecer
  ~todo o mundo (objetos com `lighting=true` recebem `ambientColor`), o
  `darknessOverlay` some, entram vignette/colorMatrix/displacement de câmera e
  o shader atmosférico de árvores roda pela primeira vez.
- Riscos já identificados por leitura/execução:

| # | Risco | Evidência |
|---|---|---|
| K1 | ~7.750 objetos na display list no Arcade (4.547 na Campanha), quase todos tiles individuais (ex.: 1.330 `tile_ground_edge_n`, 1.350 `forest_grass`) | Sonda 2026-10-07. Parte deve cair com 35.04 |
| K2 | `PostFXSystem.createFilters()` registra **3** filtros externos de câmera (vignette, colorMatrix, displacement) — a skill `phaser-4-fx-filters` §5 fixa teto de **2** | `PostFXSystem.ts:62-80` |
| K3 | `Enemy.applyEliteGlow` cria `enableFilters()` + glow **por sprite de elite** (framebuffer por objeto) | `Enemy.ts:157-172` |
| K4 | `maxLights` 16 (default de 35.01) × ~60 tochas por andar: o engine faz culling por câmera, mas o custo por pixel cresce com o raio | `LightsManager.js:200`, `LightingSystem.addTorchLights` |
| K5 | `light_torch` (elipse laranja) continua sendo desenhado além da luz real → "luz dupla" | screenshot do Arcade |
| K6 | Nenhum número de FPS confiável existe: a sonda usa SwiftShader (≈21 FPS em software) | — |

## 2. Objetivo

Com tudo religado, calibrar a leitura visual por bioma e fixar um orçamento de
render mensurável, validado em hardware real.

## 3. Escopo

### 3.1 Dentro do Escopo (proposto)
- Matriz de screenshots: 5 biomas × {Light2D on, off} × {desktop 1280×720, mobile paisagem 844×390}.
- Recalibrar `BIOME_LIGHTING.ambientColor/playerLightRadius/torchRadius` e as matrizes de `PostFXSystem` por bioma.
- Resolver K2 (escolher 2 filtros externos fixos; o 3º só sob evento).
- Resolver K5 (glow de sprite de tocha vira halo sutil ou some quando há luz real).
- Medir K1/K3/K4 com `PerformanceMonitor.ts` em aparelho real e, se preciso, reduzir objetos de piso (ex.: bake de piso estático por chunk em `RenderTexture` — ver skill `phaser4-ref-render-textures`).

### 3.2 Fora do Escopo
- Arte nova, sprites, paletas fora de `01_VISUAL_IDENTITY.md`.
- Novos efeitos ("efeito sem função é ruído" — `CLAUDE.md` 🎮 Qualidade de Jogo).

## 4. Requisitos (EARS) — rascunho, metas marcadas `⏳` aguardam decisão

| ID | Requisito | Verificação |
|---|---|---|
| R35.05-01 | **ENQUANTO** em qualquer bioma com Light2D ativo, o jogador, inimigos, projéteis hostis e telegraphs de ataque **DEVEM** ter contraste de luminância ≥ ⏳ `X:1` contra o piso ao redor (raio 64 px). | script de screenshot + cálculo de luminância |
| R35.05-02 | O `PostFXSystem` **DEVE** manter no máximo 2 filtros externos ativos na câmera principal fora de eventos temporários. | teste unitário + E2E `filters.external.list` |
| R35.05-03 | **QUANDO** um evento temporário (crítico, execução, status de medo/veneno) adicionar um 3º filtro, o sistema **DEVE** removê-lo ao fim do efeito (token de sequência já existente, spec 17 Frente B). | teste unitário |
| R35.05-04 | **ENQUANTO** em wave ≥ 5 no aparelho-alvo ⏳, o jogo **DEVE** manter FPS médio ≥ ⏳ e p95 de frame ≤ ⏳ ms. | `PerformanceMonitor` em aparelho real |
| R35.05-05 | **SE** o FPS médio de 3 s cair abaixo do limite ⏳, **ENTÃO** o sistema **DEVE** reduzir primeiro o raio das tochas e depois desligar `displacement`, antes de desligar Light2D. | teste unitário com FPS simulado |
| R35.05-06 | **ENQUANTO** uma luz real de tocha estiver ativa, o sprite `light_torch` correspondente **DEVE** ter alpha ≤ ⏳ (evita luz dupla, K5). | teste unitário |
| R35.05-07 | **ONDE** `settings.postProcessingEnabled === false`, o visual **DEVE** ser idêntico ao de antes da 35.01 (fallback Canvas/overlay). | E2E screenshot |

## 5. Decisões de Produto Necessárias (bloqueiam a promoção para `backlog/`)

1. **Aparelho-alvo mobile** e metas de FPS/p95 (R35.05-04/05).
2. **Leitura por bioma:** confirmar a intenção atual — Catacumbas = frio espectral, Santuário = rubro (`CLAUDE.md`) — e definir para `safe_house` e `gloomy_woods`.
3. **Luz do jogador:** centro do sprite ou topo do cajado ("pulso carmesim", `CLAUDE.md` §Conceitos-Chave).
4. **Limiar de contraste** (R35.05-01) — ou aceitar validação só por playtest.

## 6. Critério para sair de `scope-definition/`

35.01, 35.03 e 35.04 entregues + decisões 1–4 respondidas + matriz de
screenshots "antes" capturada. Até lá, nenhum agente implementa a partir daqui.

## 7. Referências

- [[35_00_JOGAVEL_E_VISUAL_SEM_ASSETS_INDICE]], [[delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES]]
- `docs/critical/02_PERFORMANCE_OPTIMIZATION.md`, skill `phaser-4-fx-filters` §5, skill `phaser4-ref-render-textures`

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação (achados A10, A11 + riscos K1–K6) | Claude |
