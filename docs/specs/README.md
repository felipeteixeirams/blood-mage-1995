---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: docs/specs
priority: high
status: active
last_updated: 2026-08-30
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
| **[`in-progress/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`](./in-progress/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md)** | • **Fase 1:** UI Responsiva 1080p, Escala & Boss Zoom Out<br>• **Fase 2:** Terreno 2.5D, Heightmap & Paredões de Falésia | • **Fase 3:** Ergonomia Touch Mobile (Safe Area Insets, Escala Joystick e Modo Canhoto) |
| **[`in-progress/04_FASE4_MUNDO_CONTINUO.md`](./in-progress/04_FASE4_MUNDO_CONTINUO.md)** | • Safe Town (Room 0) com NPCs<br>• Iluminação adaptativa & reverberação por bioma<br>• `WorldManager.ts` e corpos persistentes | • Backlog de Discovery (Quests de NPCs locais, Clima e Viagem Rápida) |
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | • PWA Offline-First (Spec 15)<br>• Scripts de build Electron (`scripts/build-steam.sh`) | • Localização multilíngue (i18n) e publicação nas lojas |
| **[`in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md`](./in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md)** | • Quick wins de partículas e paletas de equipamento | • Pipeline de pós-processamento e iluminação de segunda geração |
| **[`in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | • Arquitetura híbrida (Loader assíncrono + Fallback procedural unificado)<br>• UI 9-slice React<br>• 18.7% dos assets físicos integrados | • Geração e integração física dos sprites de monstros (Tier 1 a 3), projéteis e tilesets |
| **[`in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md`](./in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md)** | • Prompt templates e parâmetros para geração PixelLab | • Utilizado continuamente durante a produção de novos sprites |
| **[`in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](./in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | • Quick wins auditados e integrados | • Acompanhamento contínuo dos marcos do roadmap |
| **[`in-progress/11_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md`](./in-progress/11_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md)** | • Joystick virtual desacoplado e responsivo | • Calibrações ergonômicas mobile (Safe Area e escala) |
| **[`in-progress/SPECS_EVOLUCAO.md`](./in-progress/SPECS_EVOLUCAO.md)** | • Consolidação e rastreamento das fases 1 a 5 | • Atualização incremental conforme avanços de versão |

---

## 🟢 Delivered (100% Concluídas e Integradas)

| Spec | Escopo Concluído | Verificação / Testes |
|---|---|---|
| **[`delivered/11_VISUAL_POLISH_FRONTS.md`](./delivered/11_VISUAL_POLISH_FRONTS.md)** | **8 Frentes de Polimento Visual:** BSP Dungeon, Névoa, Pegadas de sangue, Hit-Stop (40-80ms), Iluminação 2D/Glow, Pitch shift/Drone, Equip Palette Swap e Pulso de Altar | Vitest + E2E (`pnpm verify`) |
| **[`delivered/12_EXPANSION_FRONTS.md`](./delivered/12_EXPANSION_FRONTS.md)** | **5 Frentes de Expansão:** Armadilhas/Barris explosivos, Inimigos Elites com afixos (Vampírico, Rápido, etc.), Árvore de Talentos, HUD/Minimapa dinâmico e Trilha FM Procedural | Vitest + E2E (`pnpm verify`) |
| **[`delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`](./delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)** | **Safe House & Campanha ARPG:** Santuário Seguro, Diálogos de Maelen, Desbloqueio progressivo de magias e Grimório de Runas | Vitest + E2E (`pnpm verify`) |
| **[`delivered/14_IMMERSION_AND_GAME_FEEL.md`](./delivered/14_IMMERSION_AND_GAME_FEEL.md)** | **Imersão & Game Feel:** Feedback Háptico (`navigator.vibrate`), Retículo Rúnico de Mira no Solo, Câmera Look-Ahead Lerp, Screen Shake direcional e Caixas 9-Slice | Vitest + E2E (`pnpm verify`) |
| **[`delivered/15_PWA_AND_OFFLINE_READY.md`](./delivered/15_PWA_AND_OFFLINE_READY.md)** | **PWA & Offline Engine:** Service Worker Workbox, Cache offline completo, Hook `usePWA`, Indicador visual de rede e Banner de Instalação 1-Touch | Vitest + E2E (`pnpm verify`) |
| **[`delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md`](./delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md)** | **Onboarding In Media Res (<10s TTF):** Cerco Inicial instantâneo, Banner reativo de esquiva, Aceleração de XP para Nível 2 em <30s e Persistência segura Zod | Vitest + E2E (`pnpm verify`) |
| **[`delivered/01_FASE1_INCONSCIENCIA.md`](./delivered/01_FASE1_INCONSCIENCIA.md)** | **Sistema de Inconsciência:** Transição para estado de quase-morte, perda temporária de controle e mecânica de recuperação | Vitest + Unit Tests |
| **[`delivered/01_RECORDS_DISPLAY.md`](./delivered/01_RECORDS_DISPLAY.md)** | **Exibição de Recordes:** Modal e cena de recordes históricos, tempos de sobrevivência e abates | Vitest + Unit Tests |
| **[`delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md`](./delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md)** | **Tela de Morte & Gore:** Modal de Game Over gótico, estatísticas da run, estilhaçamento corporal e marcas de sangue | Vitest + Unit Tests |
| **[`delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md`](./delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md)** | **Condições de Sobrevivência:** Mecânicas de debuff ambiental, sangramento e resistência a dano | Vitest + Unit Tests |
| **[`delivered/03_FASE3_STATUS_SOBREVIVENCIA.md`](./delivered/03_FASE3_STATUS_SOBREVIVENCIA.md)** | **Status de Sobrevivência:** HUD de efeitos ativos, contadores de tempo e ícones de status | Vitest + Unit Tests |
| **[`delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md`](./delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md)** | **Polimento de Produção Completo:** Limpeza de ciclo de vida de cenas, otimização de garbage collector e pooling | Vitest + Unit Tests |

---

## 🔵 Backlog (Propostas de Features Formais — 0% Desenvolvimento Iniciado)

| Spec / Proposta | Domínio / Resumo | Prioridade |
|---|---|---|
| **[`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | Selos de Sangue e New Game Plus / Prestígio de Endgame | Média |
| **[`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Lua de Sangue, Eclipse, Solstício Negro) | Baixa |
| **[`backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`](./backlog/08_GUIA_EVOLUCAO_COMERCIAL.md)** | Checklist comercial e requisitos para Steam, Play Store e itch.io | Média |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Referências estéticas e proposta de HUD estilo ARPG clássico | Média |
| **[`backlog/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md`](./backlog/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** | Polimento de luz procedural e ambientação de masmorras | Média |

---

## 💡 Discovery (Pesquisas Exploratórias, Spikes & Avaliações Técnicas)

| Documento de Discovery | Domínio / Hipótese de Pesquisa | Status / Foco |
|---|---|---|
| **[`discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md`](./discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md)** | Avaliação do Phaser 4.2.1 (PostFX GPU, Light2D e Procedural) para superar/dispensar assets externos | Alta |
| **[`discovery/02_DISCOVERY_UI_ASSETS_EXTERNOS.md`](./discovery/02_DISCOVERY_UI_ASSETS_EXTERNOS.md)** | Pipeline de exploração para novos temas e skins de interface | Média |
| **[`discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md`](./discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md)** | Eixo A — UI Fatiada 9-slice e molduras de inventário expandidas | Média |
| **[`discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md`](./discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md)** | Eixo B — Sprites de personagens e monstros não implementados | Alta |
| **[`discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md`](./discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md)** | Co-op Multiplayer P2P leve via WebRTC (Pesquisa exploratória pós-campanha) | Baixa |
| **[`discovery/04_DISCOVERY_AI_ART_PIPELINE.md`](./discovery/04_DISCOVERY_AI_ART_PIPELINE.md)** | Pipeline automatizado de conversão e animação por IA (PixelLab e modelos) | Média |
| **[`discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`](./discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md)** | Empacotamento para lojas oficiais (Capacitor/TWA) e monetização indie ética (Base: PWA) | Média |
| **[`discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md`](./discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md)** | Progressão de campanha em atos, diálogos ramificados e lore profunda | Média |

---

## ⛔ Rejected / Obsolete (Rejeitadas para Prevenir Regressões)

| Documento | Motivo da Rejeição / Arquivamento | Diretriz Substituta |
|---|---|---|
| **[`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`](./rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md)** | Proposta de compor armas/armaduras desenhando camadas procedurais no HTML5 Canvas sobre `'spr_bloodmage'`. Viola a **Regra 6b do AGENTS.md** e corromperia a arte física final de 8 direções do PixelLab. | Customizações cosméticas devem ser feitas exclusivamente via Palette Swaps em tempo de build/shader ou spritesheets modulares do PixelLab. |
