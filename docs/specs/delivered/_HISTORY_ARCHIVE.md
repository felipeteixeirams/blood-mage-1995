---
agent_context: all agents
target_module: docs/specs
priority: low
criticality: low
status: archive
last_updated: 2026-09-07
tags: [specs, index, archive, delivered, history]
---

# 🗄️ Histórico Completo de Specs Entregues

> `docs/specs/README.md` mantém, na seção "🟢 Delivered", apenas o que foi
> entregue **nos últimos 7 dias** (janela "quente"). Este arquivo é o
> histórico completo e cronológico — nunca é apagado, só deixa de aparecer
> no índice principal conforme a entrega envelhece além de 7 dias.
>
> Quando um item sair da janela de 7 dias do índice principal, mova a
> linha dele para o topo da tabela abaixo (ordem reversa-cronológica).

---

## 🟢 Delivered (Histórico Completo — 100% Concluídas e Integradas)

| Spec | Escopo Concluído | Verificação / Testes |
|---|---|---|
| **[`delivered/27_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md`](../delivered/27_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md)** | **Joystick Virtual Nativo Phaser (Padrão Mobile Legends / Diablo Immortal):** Canvas nativo 60 FPS, drag-to-follow, floating stick, multi-touch isolado por `pointer.id`, curva de resposta, deadzone, escala S/M/L e modo canhoto | Vitest + E2E (`pnpm verify`) |
| **[`delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`](../delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md)** | **Evolução Gráfica, Terreno 2.5D & UI Adaptativa:** Base 1080p, Boss Zoom Out, Heightmap em Octaves, Cliff Faces verticais, colisão de desnível $\Delta Z$, Safe Area Insets e personalização de Joystick/Modo Canhoto | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_VISUAL_POLISH_FRONTS.md`](../delivered/11_VISUAL_POLISH_FRONTS.md)** | **ÍNDICE MESTRE — Visual Polish & VFX Fronts:** Gestão descentralizada das 8 frentes de polimento gráfico, procedural e sonoro do jogo | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_01_VISUAL_DUNGEON_GENERATION.md`](../delivered/11_01_VISUAL_DUNGEON_GENERATION.md)** | **Geração Orgânica de Dungeon:** Divisão espacial por BSP iterativo e autômato celular para corredores e criptas orgânicas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_02_VISUAL_ATMOSFERA_NEBLINA.md`](../delivered/11_02_VISUAL_ATMOSFERA_NEBLINA.md)** | **Atmosfera e Névoa Volumétrica:** Camadas de névoa rasteira (`groundFog`) e alta (`upperHaze`) reativas ao bioma | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_03_VISUAL_DECALS_SANGUE.md`](../delivered/11_03_VISUAL_DECALS_SANGUE.md)** | **Decals de Sangue e Reações de Mundo:** Gerenciador FIFO de marcas no solo, pegadas de sangue fresco e rugosidade | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_04_VISUAL_GORE_HIT_STOP.md`](../delivered/11_04_VISUAL_GORE_HIT_STOP.md)** | **Gore, Hit-Stop e Character FX:** Pausas de impacto (Hit Stop 40-80ms), Squash & Stretch, Hit Flash e ragdoll gibs | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_05_VISUAL_ILUMINACAO_BLOOM.md`](../delivered/11_05_VISUAL_ILUMINACAO_BLOOM.md)** | **Iluminação 2D e Bloom FX:** Light2D Pipeline, PointLights pontuais e filtros procedural Glow FX | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_06_VISUAL_AUDIO_PITCH_DRONES.md`](../delivered/11_06_VISUAL_AUDIO_PITCH_DRONES.md)** | **Pitch Shifting e Drones de Áudio:** Micro-variação de tom (±6%) e sintetizador sub-grave reativo ao perigo | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_07_VISUAL_PALETTE_SWAP.md`](../delivered/11_07_VISUAL_PALETTE_SWAP.md)** | **Palette Swap Procedural e Cosméticos:** Tint dinâmico por raridade do equipamento e faíscas lendárias | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_08_VISUAL_NPCS_INTERATIVIDADE.md`](../delivered/11_08_VISUAL_NPCS_INTERATIVIDADE.md)** | **NPCs e Interatividade de Mundo:** Modais de diálogo, barks flutuantes, acompanhamento de quests e Altar Glow | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_EXPANSION_FRONTS.md`](../delivered/12_EXPANSION_FRONTS.md)** | **ÍNDICE MESTRE — Expansion & Replayability Fronts:** Gestão das 5 frentes de expansão de conteúdo, metajogo, IA e áudio FM | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_01_EXPANSION_TRAPS_INTERACTIONS.md`](../delivered/12_01_EXPANSION_TRAPS_INTERACTIONS.md)** | **Interações de Ambiente e Armadilhas:** Armadilhas mecânicas com ciclo temporal e barris explosivos voláteis em área | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_02_EXPANSION_AI_ELITE_MOBS.md`](../delivered/12_02_EXPANSION_AI_ELITE_MOBS.md)** | **Inteligência Artificial e Modificadores de Elite:** Inimigos Elites com afixos (Vampírico, Rápido), telegrafia AoE e esquiva | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_03_EXPANSION_META_PROGRESSION.md`](../delivered/12_03_EXPANSION_META_PROGRESSION.md)** | **Meta-Progressão e Economia:** Árvore de talentos permanente financiada por Cristais de Sangue | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_04_EXPANSION_UX_POLISH.md`](../delivered/12_04_EXPANSION_UX_POLISH.md)** | **Interface/UX e Polimento Sombrio:** Tooltips comparativos de equipamento, minimapa adaptativo e barras de status | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_05_EXPANSION_AUDIO_SOUNDTRACK.md`](../delivered/12_05_EXPANSION_AUDIO_SOUNDTRACK.md)** | **Trilha Sonora Procedural 16-Bit:** Motor de síntese de áudio FM via Web Audio API sem consumo extra de VRAM | Vitest + E2E (`pnpm verify`) |
| **[`delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`](../delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)** | **Safe House & Campanha ARPG:** Santuário Seguro, Diálogos de Maelen, Desbloqueio progressivo de magias e Grimório de Runas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/14_IMMERSION_AND_GAME_FEEL.md`](../delivered/14_IMMERSION_AND_GAME_FEEL.md)** | **Imersão & Game Feel:** Feedback Háptico (`navigator.vibrate`), Retículo Rúnico de Mira no Solo, Câmera Look-Ahead Lerp, Screen Shake direcional e Caixas 9-Slice | Vitest + E2E (`pnpm verify`) |
| **[`delivered/15_PWA_AND_OFFLINE_READY.md`](../delivered/15_PWA_AND_OFFLINE_READY.md)** | **PWA & Offline Engine:** Service Worker Workbox, Cache offline completo, Hook `usePWA`, Indicador visual de rede e Banner de Instalação 1-Touch | Vitest + E2E (`pnpm verify`) |
| **[`delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md`](../delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md)** | **Onboarding In Media Res (<10s TTF):** Cerco Inicial instantâneo, Banner reativo de esquiva, Aceleração de XP para Nível 2 em <30s e Persistência segura Zod | Vitest + E2E (`pnpm verify`) |
| **[`delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md`](../delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md)** | **Sistema de Relíquias e Artefatos Passivos:** 8 relíquias passivas equipáveis com multiplicadores dinâmicos de estatísticas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/20_ADVANCED_PARTICLES_SYSTEM.md`](../delivered/20_ADVANCED_PARTICLES_SYSTEM.md)** | **Sistema de Partículas Avançadas:** 5 tipos de emissores visuais (sangue, poeira, magia, almas) no motor Phaser | Vitest + E2E (`pnpm verify`) |
| **[`delivered/21_ACHIEVEMENTS_SYSTEM.md`](../delivered/21_ACHIEVEMENTS_SYSTEM.md)** | **Sistema de Conquistas:** Rastreamento em tempo real de conquistas góticas, persistência Zod, toasts animadas e modal React | Vitest + E2E (`pnpm verify`) |
| **[`delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md`](../delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** | **Polimento Visual Procedural:** 8 inimigos com silhuetas curvas e normal maps, sombras elípticas radiais, partículas com degradê, tochas alinhadas e tijolos com musgo orgânico | Vitest + E2E (`spec10-validation.spec.ts`) |
| **[`delivered/22_DASH_EVASION_MECHANIC.md`](../delivered/22_DASH_EVASION_MECHANIC.md)** | **Mecânica de Dash/Esquiva:** Janelas de invulnerabilidade (200ms I-Frames), cooldown de 3s, velocidade 800px/s e rastros visuais | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md`](../delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md)** | **ÍNDICE MESTRE — Eixo A: Gráficos Avançados:** Iluminação GPU real (Light2D), pós-processamento WebGL (PostFXSystem) e normal maps procedurais, substituindo o antigo overlay de escuridão via Canvas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_01_POSTFX_GPU_SHADERS.md`](../delivered/23_01_POSTFX_GPU_SHADERS.md)** | **Pós-Processamento GPU (PostFXSystem):** Vinheta dinâmica, aberração cromática, gradação de cor por bioma e distorções de onda/shockwave, com fallback Canvas via `ScreenEffects` | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_02_PROCEDURAL_NORMAL_MAPS.md`](../delivered/23_02_PROCEDURAL_NORMAL_MAPS.md)** | **Normal Maps Procedurais:** Geração Sobel-ish de normal maps RGB em runtime (`generateNormalMap`), aplicada ao jogador, monstros de elite, paredes e baús | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING.md`](../delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING.md)** | **Iluminação Dinâmica 2D (Light2D):** `LightingSystem`/`LightingPolish` — cor ambiente por bioma, luz do jogador modulada por HP, flicker orgânico de tochas e glow em itens/elites | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](../delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | **ÍNDICE MESTRE — Evolução Gráfica & Auditiva:** Quick wins (Medo, Cascata de Luz, Tinnitus), animações 8-direcionais, ragdoll/gibs e shaders de status/sombra/reflexo, com toggles de acessibilidade | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_01_GRAPHICS_AUDIO_QUICKWINS.md`](../delivered/24_01_GRAPHICS_AUDIO_QUICKWINS.md)** | **Quick Wins Visuais & Auditivos:** Distorção de Medo, Cascata de Luz por `floorDepth` e Tinnitus de Ameaça em HP crítico — todos com toggle de acessibilidade | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_02_PROCEDURAL_ANIMATIONS_RAGDOLL_GIBS.md`](../delivered/24_02_PROCEDURAL_ANIMATIONS_RAGDOLL_GIBS.md)** | **Animações 8-Direcionais & Ragdoll Gibs:** Deformação procedural por vetor angular, hit flash/flinch/knockback por massa e desmembramento gore em mortes críticas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_03_STATUS_EFFECTS_SHADOWS_REFLECTIONS.md`](../delivered/24_03_STATUS_EFFECTS_SHADOWS_REFLECTIONS.md)** | **Shaders de Status, Sombras 2.5D e Reflexos:** `ShadowSystem` (sombras elípticas orientadas à luz), `StatusEffectSystem` (queimado/congelado/etc.) e reflexos em líquidos | Vitest + E2E (`pnpm verify`) |
| **[`delivered/01_FASE1_INCONSCIENCIA.md`](../delivered/01_FASE1_INCONSCIENCIA.md)** | **Sistema de Inconsciência:** Transição para estado de quase-morte, perda temporária de controle e mecânica de recuperação | Vitest + Unit Tests |
| **[`delivered/26_RECORDS_DISPLAY.md`](../delivered/26_RECORDS_DISPLAY.md)** | **Exibição de Recordes:** Modal e cena de recordes históricos, tempos de sobrevivência e abates | Vitest + Unit Tests |
| **[`delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md`](../delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md)** | **Tela de Morte & Gore:** Modal de Game Over gótico, estatísticas da run, estilhaçamento corporal e marcas de sangue | Vitest + Unit Tests |
| **[`delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md`](../delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md)** | **Polimento de Produção Completo:** Limpeza de ciclo de vida de cenas, otimização de garbage collector e pooling | Vitest + Unit Tests |
