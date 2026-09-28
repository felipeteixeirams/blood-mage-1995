---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: docs/specs
priority: high
criticality: high
status: active
last_updated: 2026-09-21
tags: [specs, index, workflow, in-progress, delivered, backlog, discovery, rejected]
---

# 📋 Specifications Index — Bloodmage 1995

> **Organização do Ciclo de Vida de Specs & Discoveries:**
> - **`in-progress/`**: Especificações cujo desenvolvimento foi iniciado, mas que ainda possuem fases/itens pendentes.
> - **`delivered/`**: Especificações onde **100%** das fases foram completamente desenvolvidas, testadas e integradas.
> - **`backlog/`**: Especificações formais e propostas de features aguardando início de desenvolvimento (0% de código).
> - **`discovery/`**: Pesquisas exploratórias, avaliações arquiteturais, spikes técnicos e descobertas de produto/arte.
> - **`rejected/`**: Propostas arquivadas/rejeitadas para proteger os guardrails arquiteturais contra regressões.
>
> Padrão de cabeçalho (`priority` + `criticality` + demais campos) e regras de
> profundidade técnica mínima por spec: ver Seção 6 de
> [`docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`](../architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md).

---

## 🎯 Fila de Prioridade — "Pega a Próxima"

> Tabela única (`in-progress/` + `backlog/`), ordenada por **prioridade** (produto) e,
> dentro do mesmo nível, por **criticidade** (risco técnico/regressão — ver definição
> na Seção 6 do doc de metodologia linkado acima). Pedir **"pega a próxima"** resolve
> para a **linha 1**. Item concluído sai desta fila e vira uma linha em "🟢 Delivered" abaixo.
>
> **Esta é também a fila que o Jules consome** (prompt de sessão em
> `docs/architecture/08_JULES_SESSION_PROMPT.md`) — não existe mais uma
> fila separada só pra ele; o antigo `backlog/16_FILA_AUTOMACAO_JULES.md`
> foi aposentado em 2026-09-07 (ver `backlog/_ARCHIVED_16_FILA_AUTOMACAO_JULES.md`).
>
> **Só entram aqui specs sem impedimento ativo** (triagem em 2026-09-07 — ver
> "🚧 Bloqueados" logo abaixo para o que foi removido e por quê).

| # | Spec | Pasta | Prioridade | Criticidade | Progresso |
|---|---|---|---|---|---|
| 1 | [`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) | backlog | 🟡 medium | 🟡 medium | Tier A completo — Tiers B/C pendentes |
| 2 | [`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md) | backlog | 🟡 medium | 🟡 medium | draft |
| 3 | [`backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md) | backlog | 🟢 low | 🟡 medium | Superada em parte — só resta a pergunta menor de variedade interna em `gloomy_woods` |

> *Nota:* `in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md` saiu desta fila em
> 2026-09-08 — PR #93 entregou os 2 itens de código que faltavam (cura via
> Clérigo + ícones customizados). Só resta QA manual e tuning de valores,
> ambos dependentes do Felipe jogar; nada executável por agente. Continua
> em `in-progress/` (não é "delivered" até a validação humana acontecer).

### 🚧 Bloqueados (aguardando decisão/insumo externo — fora da fila acima)

> Triagem de 2026-09-07 (atualizada em 2026-09-08 — spec 25 destravada,
> ver Fila de Prioridade acima): nada aqui tem próximo passo executável
> por um agente IA agora. Cada um lista o que falta para destravar.

| Spec | Pasta | Impedimento | O que destrava |
|---|---|---|---|
| [`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) | backlog *(era in-progress)* | Fase 0 (arquitetura) concluída; todo o resto exige sprites físicos que não existem | Orçamento/direção de arte aprovado (mesmo gate de #14) |
| [`backlog/09_PIXEL_LAB_PROMPT_GUIDE.md`](./backlog/09_PIXEL_LAB_PROMPT_GUIDE.md) | backlog *(era in-progress)* | Guia só tem uso ativo quando há produção de sprites em andamento | Mesmo gate de #08/#14 |
| [`backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md`](./backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md) | backlog | Núcleo (sprites/UI externos) depende do mesmo gate de #08/#14; áudio/telemetria já entregues não são afetados | Mesmo gate de #08/#14 |
| [`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`](./backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md) | backlog | Já documentava o próprio bloqueio (`dependencies`) | Orçamento de arte aprovado, direção artística definida |
| [`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md) | backlog *(novo, extraído de #05)* | Mandato do projeto: nenhuma integração de conta/nuvem sem confirmação prévia de Felipe | Felipe confirmar explicitamente + validação de demanda (Beta) |

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

## 🟡 In-Progress (Desenvolvimento Iniciado — Fases Pendentes, Sem Impedimento)

| Spec / Documento | Fases / Escopo Concluído | Fases / Itens Pendentes (destravados) |
|---|---|---|
| **[`in-progress/08_GUIA_EVOLUCAO_COMERCIAL.md`](./in-progress/08_GUIA_EVOLUCAO_COMERCIAL.md)** | • Checklist de requisitos comerciais e arquiteturais para lançamento (Steam/Play Store/itch.io) | • Implementações visuais e de infraestrutura |
| **[`in-progress/11_ATMOSFERA_E_TENSAO.md`](./in-progress/11_ATMOSFERA_E_TENSAO.md)** | • Threat Tinnitus, Fear Distortion e Toggles de Acessibilidade<br>• Chevrons direcionais offscreen de ameaça ativas | • *(Restante dos itens de atmosfera e áudio espacial)* |
| **[`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md)** | • Gameplay loop completo (Sangramento/Veneno/Infecção aplicados por monstro, dreno de HP, cura via consumível comprável no Alquimista)<br>• Cura via NPC Clérigo (PR #93)<br>• Ícones customizados SVG (PR #93) | • *(nenhum item de código — só QA manual e tuning de valores, dependentes do Felipe jogar)* |
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | • Must-Haves de produção, empacotamento PWA/Steam, i18n e haptics | • Cloud Save (extraído para backlog/29) |
| **[`in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md`](./in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md)** | • PostFXSystem, LightingSystem Light2D e normal maps procedurais | • Entregue e supersedido por delivered/23 |
| **[`in-progress/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./in-progress/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | • Modal de Prestígio PrestigeModal.tsx e sacrifício | • Entregue e supersedido por delivered/18 |
| **[`in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | • Mapeamento de sprites e checklist de substituição | • Bloqueado por orçamento de arte (ver backlog) |
| **[`in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md`](./in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md)** | • Guia de prompts para geração PixelLab | • Bloqueado por orçamento de arte (ver backlog) |
| **[`in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](./in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | • Quick wins de áudio/gráficos e animações procedurais | • Entregue e supersedido por delivered/24 |
| **[`in-progress/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`](./in-progress/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md)** | • Resolução adaptativa UI e terreno 2.5D heightmap | • Entregue e supersedido por delivered/16 |
| **[`in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md)** | • Calibração de 9 frentes de polimento gráfico | • Entregue e supersedido por delivered/17 |
| **[`in-progress/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./in-progress/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | • Conectividade entre biomas e topologia de mundo | • Superada em parte por delivered/25 |
| **[`in-progress/SPECS_EVOLUCAO.md`](./in-progress/SPECS_EVOLUCAO.md)** | • Índice de specs de evolução e roadmap histórico | • Histórico mantido para referência de contexto |
| **[`in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md`](./in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md)** | • Arquivo histórico de specs de evolução pós-refactor | • Arquivado |

---

## 🟢 Delivered (Últimos 7 dias — janela "quente")

> Histórico completo (tudo entregue há mais de 7 dias, nunca apagado):
> [`delivered/_HISTORY_ARCHIVE.md`](./delivered/_HISTORY_ARCHIVE.md).
> Ao passar dos 7 dias, mova a linha daqui para o topo do arquivo.
>
> *(Nota: Para lista exaustiva de specs de todas as pastas, consulte [`delivered/_HISTORY_ARCHIVE.md`](./delivered/_HISTORY_ARCHIVE.md))*

| Spec | Escopo Concluído | Entregue em | Verificação / Testes |
|---|---|---|---|
| **[`delivered/32_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./delivered/32_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** | **Toggle de Intensidade de Conteúdo (Classificação Indicativa):** Seletor de intensidade em Configurações (Gore Completo/Reduzido), persistência Zod e adaptação nos sistemas de desmembramento e poças de sangue | 2026-09-21 | Vitest (`DismembermentSystem.test.ts`, `BloodSplatterSystem.test.ts`, `localStorage.test.ts`) |
| **[`delivered/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./delivered/12_PROGRESSAO_E_QUESTS_CONTRATOS.md)** | **Progressão, Micro-Quests (Contratos) e Evolução de Habilidades:** Contratos dinâmicos, modificadores de desafio, ramificação mutuamente exclusiva de talentos e evolução de habilidades níveis 5/10 | 2026-09-19 | Vitest (`gameStore.test.ts`) |
| **[`delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md`](./delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md)** | **Modal UI de Prestígio (Blood Seal):** Componente React `PrestigeModal.tsx`, alocação de selos, seleção de dificuldade, confirmação de sacrifício rúnico e navegação gamepad | 2026-09-09 | Vitest (`PrestigeModal.test.tsx`) |
| **[`delivered/31_NORMAL_MAP_TILE_DOOR.md`](./delivered/31_NORMAL_MAP_TILE_DOOR.md)** | **Normal Map Ausente na Textura `tile_door`:** Gerar e registrar normal map para `tile_door` via `addTextureWithNormalMap` permitindo iluminação Light2D nas portas | 2026-09-08 | Vitest (`textureGenerator.test.ts`) |
| **[`delivered/30_DETERMINISMO_SEED_POISSON_DISK.md`](./delivered/30_DETERMINISMO_SEED_POISSON_DISK.md)** | **Determinismo por Seed no Espalhamento Poisson Disk:** Amostragem de vegetação e props 100% determinística por seed da instância de `HeightmapGenerator` | 2026-09-08 | Vitest (`HeightmapGenerator.test.ts`) |
| **[`delivered/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./delivered/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | **Fase 5: Polimento de Produção, Empacotamento Nativo & i18n:** Performance zero-GC, Gamepad API, Haptics, PWA/TWA/Steam builds, Advanced Particles, Achievements e internacionalização (PT-BR / EN-US) | 2026-09-08 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`](./delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md)** | **Mundo Contínuo Estilo Dungeon Siege — Chunk Streaming:** Fases A, B, B.2, C e D entregues (streaming de chunks, bounds dinâmicos, transições sem corte de iluminação/névoa/áudio/FX e porta de saída física) | 2026-09-08 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md)** | **Polimento Gráfico por Calibração dos Sistemas Existentes:** Calibração completa das 9 Frentes (Glow, PostFX, Lighting, Atmosphere, Shadows, Reflections, Particles, Tree Shader & Terrain), tokens de sequência de FX e profundidades relativas | 2026-09-07 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md`](./delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md)** | **Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos:** UI consistente entre modais secundários, navegação completa via gamepad e retratos temáticos | 2026-09-06 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md`](./delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** | **Polimento Visual Procedural:** 8 inimigos com silhuetas curvas e normal maps, sombras elípticas radiais, partículas com degradê, tochas alinhadas e tijolos com musgo orgânico | 2026-09-05 | Vitest + E2E (`spec10-validation.spec.ts`) |
| **[`delivered/04_FASE4_MUNDO_CONTINUO.md`](./delivered/04_FASE4_MUNDO_CONTINUO.md)** | **Fase 4: Mundo Contínuo:** Safe Town (Room 0), iluminação adaptativa, NPCs interativos, áudio e clima por bioma | 2026-08-31 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md`](./delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md)** | **ÍNDICE MESTRE — Eixo A: Gráficos Avançados:** Iluminação GPU real (Light2D), pós-processamento WebGL (PostFXSystem) e normal maps procedurais | 2026-08-31 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](./delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | **ÍNDICE MESTRE — Evolução Gráfica & Auditiva:** Quick wins (Medo, Cascata de Luz, Tinnitus), animações 8-direcionais, ragdoll/gibs e shaders de status/sombra/reflexo | 2026-08-31 | Vitest + E2E (`pnpm verify`) |

---

### 📦 Arquivos Históricos em Delivered (Referenciados)

| Spec | Escopo / Título | Status | Verificação |
|---|---|---|---|
| **[`delivered/01_FASE1_INCONSCIENCIA.md`](./delivered/01_FASE1_INCONSCIENCIA.md)** | **🟢 Fase 1: Sistema de Inconsciência** | Entregue | Vitest + E2E |
| **[`delivered/01_RECORDS_DISPLAY.md`](./delivered/01_RECORDS_DISPLAY.md)** | **✅ Records Display System** | Entregue | Vitest + E2E |
| **[`delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md`](./delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md)** | **🔴 Fase 2: Tela de Morte, Resgate de Cadáver (Corpse Retrieval) e Gore** | Entregue | Vitest + E2E |
| **[`delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md`](./delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md)** | **🤢 Fase 3: Condições de Sobrevivência, Status Nocivos e Medicinas** | Entregue | Vitest + E2E |
| **[`delivered/03_FASE3_STATUS_SOBREVIVENCIA.md`](./delivered/03_FASE3_STATUS_SOBREVIVENCIA.md)** | **🟡 Fase 3: Status de Sobrevivência** | Entregue | Vitest + E2E |
| **[`delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md`](./delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md)** | **🚀 Fase 5: Polimento de Produção — 100% COMPLETO** | Entregue | Vitest + E2E |
| **[`delivered/11_01_VISUAL_DUNGEON_GENERATION.md`](./delivered/11_01_VISUAL_DUNGEON_GENERATION.md)** | **Spec 11.01: Geração Orgânica de Dungeon (BSP + Cellular Automata)** | Entregue | Vitest + E2E |
| **[`delivered/11_02_VISUAL_ATMOSFERA_NEBLINA.md`](./delivered/11_02_VISUAL_ATMOSFERA_NEBLINA.md)** | **Spec 11.02: Atmosfera e Névoa Volumétrica (Atmospherics & Weather)** | Entregue | Vitest + E2E |
| **[`delivered/11_03_VISUAL_DECALS_SANGUE.md`](./delivered/11_03_VISUAL_DECALS_SANGUE.md)** | **Spec 11.03: Decals de Sangue e Reações do Mundo (World Reactions)** | Entregue | Vitest + E2E |
| **[`delivered/11_04_VISUAL_GORE_HIT_STOP.md`](./delivered/11_04_VISUAL_GORE_HIT_STOP.md)** | **Spec 11.04: Gore, Hit-Stop e Character FX (Character FX & Combat Feel)** | Entregue | Vitest + E2E |
| **[`delivered/11_05_VISUAL_ILUMINACAO_BLOOM.md`](./delivered/11_05_VISUAL_ILUMINACAO_BLOOM.md)** | **Spec 11.05: Iluminação 2D e Bloom FX (Lighting & Spell VFX)** | Entregue | Vitest + E2E |
| **[`delivered/11_06_VISUAL_AUDIO_PITCH_DRONES.md`](./delivered/11_06_VISUAL_AUDIO_PITCH_DRONES.md)** | **Spec 11.06: Pitch Shifting e Drones de Áudio (Audio Engineering)** | Entregue | Vitest + E2E |
| **[`delivered/11_07_VISUAL_PALETTE_SWAP.md`](./delivered/11_07_VISUAL_PALETTE_SWAP.md)** | **Spec 11.07: Palette Swap Procedural e Cosméticos de Itens (Items Wearables)** | Entregue | Vitest + E2E |
| **[`delivered/11_08_VISUAL_NPCS_INTERATIVIDADE.md`](./delivered/11_08_VISUAL_NPCS_INTERATIVIDADE.md)** | **Spec 11.08: NPCs e Interatividade de Mundo (Quests & World Interactivity)** | Entregue | Vitest + E2E |
| **[`delivered/11_VISUAL_POLISH_FRONTS.md`](./delivered/11_VISUAL_POLISH_FRONTS.md)** | **Spec 11: Visual Polish & VFX Fronts (Índice Mestre)** | Entregue | Vitest + E2E |
| **[`delivered/12_01_EXPANSION_TRAPS_INTERACTIONS.md`](./delivered/12_01_EXPANSION_TRAPS_INTERACTIONS.md)** | **🕸️ Spec 12.01: Interações de Ambiente e Armadilhas (Dungeon Depth)** | Entregue | Vitest + E2E |
| **[`delivered/12_02_EXPANSION_AI_ELITE_MOBS.md`](./delivered/12_02_EXPANSION_AI_ELITE_MOBS.md)** | **⚔️ Spec 12.02: Inteligência Artificial e Modificadores de Elite (Combat Challenge)** | Entregue | Vitest + E2E |
| **[`delivered/12_03_EXPANSION_META_PROGRESSION.md`](./delivered/12_03_EXPANSION_META_PROGRESSION.md)** | **🩸 Spec 12.03: Meta-Progressão e Economia (Replayability)** | Entregue | Vitest + E2E |
| **[`delivered/12_04_EXPANSION_UX_POLISH.md`](./delivered/12_04_EXPANSION_UX_POLISH.md)** | **👁️ Spec 12.04: Interface/UX e Polimento Sombrio (Game Feel)** | Entregue | Vitest + E2E |
| **[`delivered/12_05_EXPANSION_AUDIO_SOUNDTRACK.md`](./delivered/12_05_EXPANSION_AUDIO_SOUNDTRACK.md)** | **🎵 Spec 12.05: Trilha Sonora Procedural 16-Bit (Web Audio FM Engine)** | Entregue | Vitest + E2E |
| **[`delivered/12_EXPANSION_FRONTS.md`](./delivered/12_EXPANSION_FRONTS.md)** | **🗺️ Spec 12: ÍNDICE MESTRE — Expansion & Replayability Fronts** | Entregue | Vitest + E2E |
| **[`delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`](./delivered/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)** | **Spec 13: Transição para ARPG Clássico & Safe House (Campanha Zero-to-Hero)** | Entregue | Vitest + E2E |
| **[`delivered/14_IMMERSION_AND_GAME_FEEL.md`](./delivered/14_IMMERSION_AND_GAME_FEEL.md)** | **Spec 14: Imersão, UI Premium e Game Feel** | Entregue | Vitest + E2E |
| **[`delivered/15_PWA_AND_OFFLINE_READY.md`](./delivered/15_PWA_AND_OFFLINE_READY.md)** | **📜 Spec 15: PWA e Offline-First (Standalone Experience)** | Entregue | Vitest + E2E |
| **[`delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`](./delivered/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md)** | **📜 Spec 16: Evolução Gráfica, Resolução Adaptativa UI & Terreno Procedural 2.5D/3D** | Entregue | Vitest + E2E |
| **[`delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md`](./delivered/17_IN_MEDIA_RES_ONBOARDING_AND_COMBAT_FLOW.md)** | **📜 Spec 17: Onboarding "In Media Res" & Fluxo de Combate Imediato (<10s Time-to-Fun)** | Entregue | Vitest + E2E |
| **[`delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md`](./delivered/19_RELICS_AND_ARTIFACTS_SYSTEM.md)** | **💍 Spec 19: Sistema de Relíquias e Artefatos Passivos (Relics & Artifacts System)** | Entregue | Vitest + E2E |
| **[`delivered/20_ADVANCED_PARTICLES_SYSTEM.md`](./delivered/20_ADVANCED_PARTICLES_SYSTEM.md)** | **🎆 Spec 20: Sistema de Partículas Avançadas (Advanced Particles System)** | Entregue | Vitest + E2E |
| **[`delivered/21_ACHIEVEMENTS_SYSTEM.md`](./delivered/21_ACHIEVEMENTS_SYSTEM.md)** | **🏆 Spec 21: Sistema de Conquistas (Achievements System)** | Entregue | Vitest + E2E |
| **[`delivered/22_DASH_EVASION_MECHANIC.md`](./delivered/22_DASH_EVASION_MECHANIC.md)** | **💨 Spec 22: Mecânica de Dash/Esquiva (Dash & Evasion Mechanic)** | Entregue | Vitest + E2E |
| **[`delivered/23_01_POSTFX_GPU_SHADERS.md`](./delivered/23_01_POSTFX_GPU_SHADERS.md)** | **Spec 23.01: Pós-Processamento GPU e Shaders de Câmera (PostFXSystem)** | Entregue | Vitest + E2E |
| **[`delivered/23_02_PROCEDURAL_NORMAL_MAPS.md`](./delivered/23_02_PROCEDURAL_NORMAL_MAPS.md)** | **Spec 23.02: Normal Maps Procedurais em Runtime** | Entregue | Vitest + E2E |
| **[`delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING.md`](./delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING.md)** | **Spec 23.03: Iluminação Dinâmica 2D (Light2D Pipeline)** | Entregue | Vitest + E2E |
| **[`delivered/24_01_GRAPHICS_AUDIO_QUICKWINS.md`](./delivered/24_01_GRAPHICS_AUDIO_QUICKWINS.md)** | **Spec 24.01: Quick Wins Visuais & Auditivos (Fear, Light Cascade, Tinnitus)** | Entregue | Vitest + E2E |
| **[`delivered/24_02_PROCEDURAL_ANIMATIONS_RAGDOLL_GIBS.md`](./delivered/24_02_PROCEDURAL_ANIMATIONS_RAGDOLL_GIBS.md)** | **Spec 24.02: Animações 8-Direcionais, Feedbacks de Dano e Ragdoll Gibs** | Entregue | Vitest + E2E |
| **[`delivered/24_03_STATUS_EFFECTS_SHADOWS_REFLECTIONS.md`](./delivered/24_03_STATUS_EFFECTS_SHADOWS_REFLECTIONS.md)** | **Spec 24.03: Shaders de Status, Sombras 2.5D e Reflexos em Líquidos** | Entregue | Vitest + E2E |
| **[`delivered/26_RECORDS_DISPLAY.md`](./delivered/26_RECORDS_DISPLAY.md)** | **✅ Records Display System** | Entregue | Vitest + E2E |
| **[`delivered/27_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md`](./delivered/27_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md)** | **🕹️ Spec 11: Touchpad & Joystick Virtual Nativo no Phaser (Padrão Mobile Legends / Diablo Immortal)** | Entregue | Vitest + E2E |

---

## 🔵 Backlog (Propostas de Features Formais — 0% Desenvolvimento Iniciado)

> Ordem de execução sugerida (por prioridade/criticidade): ver "🎯 Fila de Prioridade" no topo deste documento.
> Coluna **Bloqueado?** aponta o que está na seção "🚧 Bloqueados" da fila — não comece esses sem resolver o impedimento primeiro.

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | Bloqueado? |
|---|---|---|---|---|
| **[`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | Sistema de Prestígio Blood Seal (Proposta inicial) | medium | medium | Não |
| **[`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Lua de Sangue, Eclipse, Solstício Negro) | medium | medium | Não |
| **[`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | *(era in-progress)* Living Tracking Spec de integração de sprites físicos — Fase 0 concluída | high | medium | **Sim** — orçamento de arte |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Referências estéticas e proposta de HUD estilo ARPG clássico (Tier A completo, Tiers B/C pendentes) | medium | medium | Não |
| **[`backlog/09_PIXEL_LAB_PROMPT_GUIDE.md`](./backlog/09_PIXEL_LAB_PROMPT_GUIDE.md)** | *(era in-progress)* Guia de prompts PixelLab, usado durante produção de sprites | high | low | **Sim** — mesmo gate acima |
| **[`in-progress/11_ATMOSFERA_E_TENSAO.md`](./in-progress/11_ATMOSFERA_E_TENSAO.md)** | Atmosfera, Tensão e Indicadores de Ameaça (Indicadores fora de tela, áudio espacial e iluminação) | medium | medium | Não |
| **[`backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md`](./backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md)** | Framework de Evolução de UI e Assets Externos Góticos (Híbrido 9-slice React & Web Audio) | high | high | **Sim** — mesmo gate acima (áudio/telemetria já entregues à parte) |
| **[`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`](./backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md)** | Discovery Eixo B — Pipeline de Integração de Assets Externos e Spritesheets por Tiers | medium | medium | **Sim** — orçamento de arte |
| **[`backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | *(superada em parte, 2026-09-08)* `PathDrivenGenerator` pra `gloomy_woods` — escopo de conectividade entre biomas já resolvido pela abordagem escolhida em #25; resta só decidir se vale mais variedade interna na floresta | low | medium | Não |
| **[`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md)** | *(novo, extraído de `in-progress/05`)* Cloud Save automatizado (Firebase/Firestore) | medium | high | **Sim** — confirmação de Felipe pendente |
| **[`backlog/_ARCHIVED_16_FILA_AUTOMACAO_JULES.md`](./backlog/_ARCHIVED_16_FILA_AUTOMACAO_JULES.md)** | Arquivo histórico da antiga fila de automação do agente Jules | low | low | Sim (Aposentado) |

---

## 💡 Discovery (Pesquisas Exploratórias, Spikes & Avaliações Técnicas)

| Documento de Discovery | Domínio / Hipótese de Pesquisa | Status / Foco |
|---|---|---|
| **[`discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md`](./discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md)** | Avaliação do Phaser 4.2.1 (PostFX GPU, Light2D e Procedural) para superar/dispensar assets externos | Alta |
| **[`discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md`](./discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md)** | Viabilidade de evoluir UI/sonoplastia com assets externos góticos (Pixel Art estilo Diablo I/II/Dungeon Siege 1) | Média |
| **[`discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md`](./discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md)** | Discovery Eixo B — Pipeline de Integração de Assets Externos e Spritesheets por Tiers | Média |
| **[`discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md`](./discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md)** | Co-op Multiplayer P2P leve via WebRTC (Pesquisa exploratória pós-campanha) | Baixa |
| **[`discovery/04_DISCOVERY_AI_ART_PIPELINE.md`](./discovery/04_DISCOVERY_AI_ART_PIPELINE.md)** | Pipeline de Arte Semi-Automatizado via IA (HuggingFace / ChatGPT) | Média |
| **[`discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`](./discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md)** | Empacotamento para lojas oficiais (Capacitor/TWA) e monetização indie ética (Base: PWA) | Média |
| **[`discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md`](./discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md)** | Progressão de campanha em atos, diálogos ramificados e lore profunda | Média |

---

## ⛔ Rejected / Obsolete (Rejeitadas para Prevenir Regressões)

| Documento | Motivo da Rejeição / Arquivamento | Diretriz Substituta |
|---|---|---|
| **[`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`](./rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md)** | Proposta de compor armas/armaduras desenhando camadas procedurais no HTML5 Canvas sobre `'spr_bloodmage'`. Viola a **Regra 6b do AGENTS.md** e corromperia a arte física final de 8 direções do PixelLab. | Customizações cosméticas devem ser feitas exclusivamente via Palette Swaps em tempo de build/shader ou spritesheets modulares do PixelLab. |
