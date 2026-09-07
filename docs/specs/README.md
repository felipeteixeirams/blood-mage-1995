---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: docs/specs
priority: high
status: active
last_updated: 2026-09-01
tags: [specs, index, workflow, in-progress, delivered, backlog, discovery, rejected]
---

# 📋 Specifications Index — Bloodmage 1995

> **Organização do Ciclo de Vida de Specs & Discoveries:**
> - **`in-progress/`**: Especificações cujo desenvolvimento foi iniciado, mas que ainda possuem fases/itens pendentes.
> - **`delivered/`**: Especificações onde **100%** das fases foram completamente desenvolvidas, testadas e integradas.
> - **`backlog/`**: Especificações formais e propostas de features aguardando início de desenvolvimento (0% de código).
> - **`discovery/`**: Pesquisas exploratórias, avaliações arquiteturais, spikes técnicos e descobertas de produto/arte.
> - **`rejected/`**: Propostas arquivadas/rejeitadas para proteger os guardrails arquiteturais contra regressões.

---

## 🗂️ Estrutura de Diretórios

```
docs/specs/
├── README.md (este índice)
├── in-progress/  # 🟡 Desenvolvimento iniciado e com fases pendentes
├── delivered/    # 🟢 100% concluídas, testadas e integradas em produção
├── backlog/      # 🔵 Propostas de features formais (0% desenvolvimento iniciado)
├── discovery/    # 💡 Pesquisas exploratórias, avaliações técnicas e spikes
└── rejected/     # ⛔ Propostas arquivadas/rejeitadas para evitar regressões
```

---

## 🟡 In-Progress (Desenvolvimento Iniciado — Fases Pendentes)

| Spec / Documento | Fases / Escopo Concluído | Fases / Itens Pendentes |
|---|---|---|
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | • PWA Offline-First (Spec 15)<br>• Scripts de build Electron (`scripts/build-steam.sh`) | • Localização multilíngue (i18n) e publicação nas lojas |
| **[`in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | • Arquitetura híbrida (Loader assíncrono + Fallback procedural unificado)<br>• UI 9-slice React<br>• 18.7% dos assets físicos integrados | • Geração e integração física dos sprites de monstros (Tier 1 a 3), projéteis e tilesets |
| **[`in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md`](./in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md)** | • Prompt templates e parâmetros para geração PixelLab | • Utilizado continuamente durante a produção de novos sprites |
| **[`in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`](./in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md)** | • Pesquisa Dungeon Siege 1 (Siege Nodes)<br>• Fase A: `ChunkStreamer.ts` isolado e testado (13 testes)<br>• Fase B: decisão de próximo bioma via ChunkStreamer, gatilho intacto (3 testes + validação e2e ao vivo) | • Fase B.2: bounds dinâmicos + integração real com `DungeonGenerator`<br>• Fase C: transições sem corte<br>• Fase D: porta em vez de portal (Safe House) |
| **[`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md)** | • Gameplay loop completo (Sangramento/Veneno/Infecção aplicados por monstro, dreno de HP, cura via consumível comprável no Alquimista) | • Validação manual de QA (4 itens)<br>• Ícones placeholder (emoji) → sprite pixel-art<br>• Tuning de percentuais de dreno<br>• Cura via NPC Clérigo (sprite existe, sem interação) |
| **[`in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md)** | • Spec detalhada de correção, calibração e integração visual dos sistemas atuais | • Implementação das frentes P0–P2 e validação visual/performance |
| **[`in-progress/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./in-progress/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | • Conceituação de topologia contínua (estilo Dungeon Siege) | • Algoritmo `PathDrivenGenerator`, setpieces e ecologia de monstros por bioma |

> *Nota (2026-09-06):* `in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md` e
> `in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md` foram
> removidos — ambos se autodeclaravam 100% concluídos e duplicavam,
> palavra por palavra, o que já existia (e estava correto) em
> `delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md` e
> `delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md` — este
> índice chegou a listá-los como se ainda faltasse trabalho que já estava
> pronto há semanas. Ver auditoria em
> [`docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`](../reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md).

> *Nota:* O arquivo histórico consolidado de acompanhamento (`SPECS_EVOLUCAO.md`) foi arquivado para [`in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md`](./in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md) durante a refatoração hierárquica por satélites.

---

## 🟢 Delivered (100% Concluídas e Integradas)

| Spec | Escopo Concluído | Verificação / Testes |
|---|---|---|
| **[`delivered/04_FASE4_MUNDO_CONTINUO.md`](./delivered/04_FASE4_MUNDO_CONTINUO.md)** | **Fase 4: Mundo Contínuo:** Safe Town (Room 0), iluminação adaptativa, NPCs interativos, áudio e clima por bioma | Vitest + E2E (`pnpm verify`) |
| **[`delivered/27_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md`](./delivered/27_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md)** | **Joystick Virtual Nativo Phaser (Padrão Mobile Legends / Diablo Immortal):** Canvas nativo 60 FPS, drag-to-follow, floating stick, multi-touch isolado por `pointer.id`, curva de resposta, deadzone, escala S/M/L e modo canhoto | Vitest + E2E (`pnpm verify`) |
| **[`delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md`](./delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md)** | **Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos:** UI consistente entre modais secundários, navegação completa via gamepad e retratos temáticos | Vitest + E2E (`pnpm verify`) |
| **[`delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`](./delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md)** | **Evolução Gráfica, Terreno 2.5D & UI Adaptativa:** Base 1080p, Boss Zoom Out, Heightmap em Octaves, Cliff Faces verticais, colisão de desnível $\Delta Z$, Safe Area Insets e personalização de Joystick/Modo Canhoto | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_VISUAL_POLISH_FRONTS.md`](./delivered/11_VISUAL_POLISH_FRONTS.md)** | **ÍNDICE MESTRE — Visual Polish & VFX Fronts:** Gestão descentralizada das 8 frentes de polimento gráfico, procedural e sonoro do jogo | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_01_VISUAL_DUNGEON_GENERATION.md`](./delivered/11_01_VISUAL_DUNGEON_GENERATION.md)** | **Geração Orgânica de Dungeon:** Divisão espacial por BSP iterativo e autômato celular para corredores e criptas orgânicas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_02_VISUAL_ATMOSFERA_NEBLINA.md`](./delivered/11_02_VISUAL_ATMOSFERA_NEBLINA.md)** | **Atmosfera e Névoa Volumétrica:** Camadas de névoa rasteira (`groundFog`) e alta (`upperHaze`) reativas ao bioma | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_03_VISUAL_DECALS_SANGUE.md`](./delivered/11_03_VISUAL_DECALS_SANGUE.md)** | **Decals de Sangue e Reações de Mundo:** Gerenciador FIFO de marcas no solo, pegadas de sangue fresco e rugosidade | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_04_VISUAL_GORE_HIT_STOP.md`](./delivered/11_04_VISUAL_GORE_HIT_STOP.md)** | **Gore, Hit-Stop e Character FX:** Pausas de impacto (Hit Stop 40-80ms), Squash & Stretch, Hit Flash e ragdoll gibs | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_05_VISUAL_ILUMINACAO_BLOOM.md`](./delivered/11_05_VISUAL_ILUMINACAO_BLOOM.md)** | **Iluminação 2D e Bloom FX:** Light2D Pipeline, PointLights pontuais e filtros procedural Glow FX | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_06_VISUAL_AUDIO_PITCH_DRONES.md`](./delivered/11_06_VISUAL_AUDIO_PITCH_DRONES.md)** | **Pitch Shifting e Drones de Áudio:** Micro-variação de tom (±6%) e sintetizador sub-grave reativo ao perigo | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_07_VISUAL_PALETTE_SWAP.md`](./delivered/11_07_VISUAL_PALETTE_SWAP.md)** | **Palette Swap Procedural e Cosméticos:** Tint dinâmico por raridade do equipamento e faíscas lendárias | Vitest + E2E (`pnpm verify`) |
| **[`delivered/11_08_VISUAL_NPCS_INTERATIVIDADE.md`](./delivered/11_08_VISUAL_NPCS_INTERATIVIDADE.md)** | **NPCs e Interatividade de Mundo:** Modais de diálogo, barks flutuantes, acompanhamento de quests e Altar Glow | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_EXPANSION_FRONTS.md`](./delivered/12_EXPANSION_FRONTS.md)** | **ÍNDICE MESTRE — Expansion & Replayability Fronts:** Gestão das 5 frentes de expansão de conteúdo, metajogo, IA e áudio FM | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_01_EXPANSION_TRAPS_INTERACTIONS.md`](./delivered/12_01_EXPANSION_TRAPS_INTERACTIONS.md)** | **Interações de Ambiente e Armadilhas:** Armadilhas mecânicas com ciclo temporal e barris explosivos voláteis em área | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_02_EXPANSION_AI_ELITE_MOBS.md`](./delivered/12_02_EXPANSION_AI_ELITE_MOBS.md)** | **Inteligência Artificial e Modificadores de Elite:** Inimigos Elites com afixos (Vampírico, Rápido), telegrafia AoE e esquiva | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_03_EXPANSION_META_PROGRESSION.md`](./delivered/12_03_EXPANSION_META_PROGRESSION.md)** | **Meta-Progressão e Economia:** Árvore de talentos permanente financiada por Cristais de Sangue | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_04_EXPANSION_UX_POLISH.md`](./delivered/12_04_EXPANSION_UX_POLISH.md)** | **Interface/UX e Polimento Sombrio:** Tooltips comparativos de equipamento, minimapa adaptativo e barras de status | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_05_EXPANSION_AUDIO_SOUNDTRACK.md`](./delivered/12_05_EXPANSION_AUDIO_SOUNDTRACK.md)** | **Trilha Sonora Procedural 16-Bit:** Motor de síntese de áudio FM via Web Audio API sem consumo extra de VRAM | Vitest + E2E (`pnpm verify`) |
| **[`delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`](./delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)** | **Safe House & Campanha ARPG:** Santuário Seguro, Diálogos de Maelen, Desbloqueio progressivo de magias e Grimório de Runas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/14_IMMERSION_AND_GAME_FEEL.md`](./delivered/14_IMMERSION_AND_GAME_FEEL.md)** | **Imersão & Game Feel:** Feedback Háptico (`navigator.vibrate`), Retículo Rúnico de Mira no Solo, Câmera Look-Ahead Lerp, Screen Shake direcional e Caixas 9-Slice | Vitest + E2E (`pnpm verify`) |
| **[`delivered/15_PWA_AND_OFFLINE_READY.md`](./delivered/15_PWA_AND_OFFLINE_READY.md)** | **PWA & Offline Engine:** Service Worker Workbox, Cache offline completo, Hook `usePWA`, Indicador visual de rede e Banner de Instalação 1-Touch | Vitest + E2E (`pnpm verify`) |
| **[`delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md`](./delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md)** | **Onboarding In Media Res (<10s TTF):** Cerco Inicial instantâneo, Banner reativo de esquiva, Aceleração de XP para Nível 2 em <30s e Persistência segura Zod | Vitest + E2E (`pnpm verify`) |
| **[`delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md`](./delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md)** | **Sistema de Prestígio 'Blood Seal':** Sacrifício voluntário de nível por Selos de Sangue permanentes e New Game+ | Vitest + E2E (`pnpm verify`) |
| **[`delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md`](./delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md)** | **Sistema de Relíquias e Artefatos Passivos:** 8 relíquias passivas equipáveis com multiplicadores dinâmicos de estatísticas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/20_ADVANCED_PARTICLES_SYSTEM.md`](./delivered/20_ADVANCED_PARTICLES_SYSTEM.md)** | **Sistema de Partículas Avançadas:** 5 tipos de emissores visuais (sangue, poeira, magia, almas) no motor Phaser | Vitest + E2E (`pnpm verify`) |
| **[`delivered/21_ACHIEVEMENTS_SYSTEM.md`](./delivered/21_ACHIEVEMENTS_SYSTEM.md)** | **Sistema de Conquistas:** Rastreamento em tempo real de conquistas góticas, persistência Zod, toasts animadas e modal React | Vitest + E2E (`pnpm verify`) |
| **[`delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md`](./delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** | **Polimento Visual Procedural:** 8 inimigos com silhuetas curvas e normal maps, sombras elípticas radiais, partículas com degradê, tochas alinhadas e tijolos com musgo orgânico | Vitest + E2E (`spec10-validation.spec.ts`) |
| **[`delivered/22_DASH_EVASION_MECHANIC.md`](./delivered/22_DASH_EVASION_MECHANIC.md)** | **Mecânica de Dash/Esquiva:** Janelas de invulnerabilidade (200ms I-Frames), cooldown de 3s, velocidade 800px/s e rastros visuais | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md`](./delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md)** | **ÍNDICE MESTRE — Eixo A: Gráficos Avançados:** Iluminação GPU real (Light2D), pós-processamento WebGL (PostFXSystem) e normal maps procedurais, substituindo o antigo overlay de escuridão via Canvas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_01_POSTFX_GPU_SHADERS.md`](./delivered/23_01_POSTFX_GPU_SHADERS.md)** | **Pós-Processamento GPU (PostFXSystem):** Vinheta dinâmica, aberração cromática, gradação de cor por bioma e distorções de onda/shockwave, com fallback Canvas via `ScreenEffects` | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_02_PROCEDURAL_NORMAL_MAPS.md`](./delivered/23_02_PROCEDURAL_NORMAL_MAPS.md)** | **Normal Maps Procedurais:** Geração Sobel-ish de normal maps RGB em runtime (`generateNormalMap`), aplicada ao jogador, monstros de elite, paredes e baús | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING.md`](./delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING.md)** | **Iluminação Dinâmica 2D (Light2D):** `LightingSystem`/`LightingPolish` — cor ambiente por bioma, luz do jogador modulada por HP, flicker orgânico de tochas e glow em itens/elites | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](./delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | **ÍNDICE MESTRE — Evolução Gráfica & Auditiva:** Quick wins (Medo, Cascata de Luz, Tinnitus), animações 8-direcionais, ragdoll/gibs e shaders de status/sombra/reflexo, com toggles de acessibilidade | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_01_GRAPHICS_AUDIO_QUICKWINS.md`](./delivered/24_01_GRAPHICS_AUDIO_QUICKWINS.md)** | **Quick Wins Visuais & Auditivos:** Distorção de Medo, Cascata de Luz por `floorDepth` e Tinnitus de Ameaça em HP crítico — todos com toggle de acessibilidade | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_02_PROCEDURAL_ANIMATIONS_RAGDOLL_GIBS.md`](./delivered/24_02_PROCEDURAL_ANIMATIONS_RAGDOLL_GIBS.md)** | **Animações 8-Direcionais & Ragdoll Gibs:** Deformação procedural por vetor angular, hit flash/flinch/knockback por massa e desmembramento gore em mortes críticas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_03_STATUS_EFFECTS_SHADOWS_REFLECTIONS.md`](./delivered/24_03_STATUS_EFFECTS_SHADOWS_REFLECTIONS.md)** | **Shaders de Status, Sombras 2.5D e Reflexos:** `ShadowSystem` (sombras elípticas orientadas à luz), `StatusEffectSystem` (queimado/congelado/etc.) e reflexos em líquidos | Vitest + E2E (`pnpm verify`) |
| **[`delivered/01_FASE1_INCONSCIENCIA.md`](./delivered/01_FASE1_INCONSCIENCIA.md)** | **Sistema de Inconsciência:** Transição para estado de quase-morte, perda temporária de controle e mecânica de recuperação | Vitest + Unit Tests |
| **[`delivered/26_RECORDS_DISPLAY.md`](./delivered/26_RECORDS_DISPLAY.md)** | **Exibição de Recordes:** Modal e cena de recordes históricos, tempos de sobrevivência e abates | Vitest + Unit Tests |
| **[`delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md`](./delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md)** | **Tela de Morte & Gore:** Modal de Game Over gótico, estatísticas da run, estilhaçamento corporal e marcas de sangue | Vitest + Unit Tests |
| **[`delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md`](./delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md)** | **Polimento de Produção Completo:** Limpeza de ciclo de vida de cenas, otimização de garbage collector e pooling | Vitest + Unit Tests |

---

## 🔵 Backlog (Propostas de Features Formais — 0% Desenvolvimento Iniciado)

| Spec / Proposta | Domínio / Resumo | Prioridade |
|---|---|---|
| **[`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | Gap real do sistema de Prestígio já ~90% entregue (`delivered/18`): falta só o modal React de UI | Média |
| **[`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Lua de Sangue, Eclipse, Solstício Negro) | Baixa |
| **[`backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`](./backlog/08_GUIA_EVOLUCAO_COMERCIAL.md)** | Checklist comercial e requisitos para Steam, Play Store e itch.io | Média |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Referências estéticas e proposta de HUD estilo ARPG clássico | Média |
| **[`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md)** | Atmosfera, Tensão e Indicadores de Ameaça (Indicadores fora de tela, áudio espacial e iluminação) | Média |
| **[`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md)** | Progressão, Micro-Quests e Evolução de Habilidades (Contratos, Modificadores e Talentos) *(Parcialmente Implementado)* | Média |
| **[`backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md`](./backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md)** | Framework de Evolução de UI e Assets Externos Góticos (Híbrido 9-slice React & Web Audio) | Alta |
| **[`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`](./backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md)** | Discovery Eixo B — Pipeline de Integração de Assets Externos e Spritesheets por Tiers | Média |
| **[`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** | Toggle de Intensidade de Conteúdo — mitigação de classificação indicativa (gore visual configurável) | Média |
| **[`backlog/16_FILA_AUTOMACAO_JULES.md`](./backlog/16_FILA_AUTOMACAO_JULES.md)** | ⚠️ Fila operacional (não uma proposta de feature) — itens que a sessão recorrente do Jules consome em ordem de prioridade | Alta |

---

## 💡 Discovery (Pesquisas Exploratórias, Spikes & Avaliações Técnicas)

| Documento de Discovery | Domínio / Hipótese de Pesquisa | Status / Foco |
|---|---|---|
| **[`discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md`](./discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md)** | Avaliação do Phaser 4.2.1 (PostFX GPU, Light2D e Procedural) para superar/dispensar assets externos | Alta |
| **[`discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md`](./discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md)** | Viabilidade de evoluir UI/sonoplastia com assets externos góticos (Pixel Art estilo Diablo I/II/Dungeon Siege 1) | Média |
| **[`discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md`](./discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md)** | Co-op Multiplayer P2P leve via WebRTC (Pesquisa exploratória pós-campanha) | Baixa |
| **[`discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`](./discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md)** | Empacotamento para lojas oficiais (Capacitor/TWA) e monetização indie ética (Base: PWA) | Média |
| **[`discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md`](./discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md)** | Progressão de campanha em atos, diálogos ramificados e lore profunda | Média |
| **[`discovery/06_DISCOVERY_AI_ART_PIPELINE.md`](./discovery/06_DISCOVERY_AI_ART_PIPELINE.md)** | Pipeline automatizado de conversão e animação por IA (PixelLab e modelos) | Média |

---

## ⛔ Rejected / Obsolete (Rejeitadas para Prevenir Regressões)

| Documento | Motivo da Rejeição / Arquivamento | Diretriz Substituta |
|---|---|---|
| **[`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`](./rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md)** | Proposta de compor armas/armaduras desenhando camadas procedurais no HTML5 Canvas sobre `'spr_bloodmage'`. Viola a **Regra 6b do AGENTS.md** e corromperia a arte física final de 8 direções do PixelLab. | Customizações cosméticas devem ser feitas exclusivamente via Palette Swaps em tempo de build/shader ou spritesheets modulares do PixelLab. |
