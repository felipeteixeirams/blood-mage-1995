---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: docs/specs
priority: high
criticality: high
status: active
last_updated: 2026-09-07
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

| # | Spec | Pasta | Prioridade | Criticidade | Progresso |
|---|---|---|---|---|---|
| 1 | [`in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`](./in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md) | in-progress | 🔴 high | ⚠️ critical | Fases A/B entregues — **próximo passo: B.2** (bounds dinâmicos + integração real com `DungeonGenerator`) |
| 2 | [`in-progress/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./in-progress/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md) | in-progress | 🔴 high | ⚠️ critical | not_started — sobreposição de escopo com #1, ver nota abaixo antes de iniciar |
| 3 | [`in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md) | in-progress | 🔴 high | ⚠️ high | not_started — frentes P0–P2 mapeadas, aguardando implementação |
| 4 | [`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md) | in-progress | 🔴 high | ⚠️ high | 75% — faltam QA manual, ícones sprite e cura via Clérigo |
| 5 | [`backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md`](./backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md) | backlog | 🔴 high | ⚠️ high | parcialmente_implementado |
| 6 | [`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md) | in-progress | 🔴 high | 🟡 medium | 90% — falta só i18n e Cloud Save (Nice-to-Have) |
| 7 | [`in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) | in-progress | 🔴 high | 🟡 medium | 18.7% dos assets físicos integrados |
| 8 | [`backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`](./backlog/08_GUIA_EVOLUCAO_COMERCIAL.md) | backlog | 🔴 high | 🟢 low | Checklist de requisitos comerciais (Steam/Play Store/itch.io) |
| 9 | [`backlog/16_FILA_AUTOMACAO_JULES.md`](./backlog/16_FILA_AUTOMACAO_JULES.md) | backlog | 🔴 high | 🟢 low | Fila operacional consumida pela sessão recorrente do Jules |
| 10 | [`in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md`](./in-progress/09_PIXEL_LAB_PROMPT_GUIDE.md) | in-progress | 🔴 high | 🟢 low | Guia de referência vivo, usado continuamente na produção de sprites |
| 11 | [`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) | backlog | 🟡 medium | 🟡 medium | Tier A completo — Tiers B/C pendentes |
| 12 | [`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md) | backlog | 🟡 medium | 🟡 medium | draft |
| 13 | [`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md) | backlog | 🟡 medium | 🟡 medium | backlog |
| 14 | [`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md) | backlog | 🟡 medium | 🟡 medium | partial |
| 15 | [`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`](./backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md) | backlog | 🟡 medium | 🟡 medium | parcialmente implementado — bloqueado por orçamento de arte |
| 16 | [`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md) | backlog | 🟡 medium | 🟡 medium | backlog |
| 17 | [`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md) | backlog | 🟡 medium | 🟢 low | Falta só o modal React de UI (~90% já entregue em `delivered/18`) |

> *Nota (#1 vs #2):* `25_MUNDO_CONTINUO_CHUNK_STREAMING` e
> `18_ARPG_CONTINUOUS_WORLD_TOPOLOGY` cobrem o mesmo domínio (mundo
> contínuo estilo Dungeon Siege). #1 já tem fases A/B entregues — comece
> por ele. Antes de iniciar #2, confirme com Felipe se o escopo dele já
> não foi coberto pelas Fases B.2/C/D de #1, para não duplicar trabalho.

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

## 🟢 Delivered (Últimos 7 dias — janela "quente")

> Histórico completo (tudo entregue há mais de 7 dias, nunca apagado):
> [`delivered/_HISTORY_ARCHIVE.md`](./delivered/_HISTORY_ARCHIVE.md).
> Ao passar dos 7 dias, mova a linha daqui para o topo do arquivo.

| Spec | Escopo Concluído | Entregue em | Verificação / Testes |
|---|---|---|---|
| **[`delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md`](./delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md)** | **Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos:** UI consistente entre modais secundários, navegação completa via gamepad e retratos temáticos | 2026-09-06 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md`](./delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md)** | **Sistema de Prestígio 'Blood Seal':** Sacrifício voluntário de nível por Selos de Sangue permanentes e New Game+ | 2026-09-06 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md`](./delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** | **Polimento Visual Procedural:** 8 inimigos com silhuetas curvas e normal maps, sombras elípticas radiais, partículas com degradê, tochas alinhadas e tijolos com musgo orgânico | 2026-09-05 | Vitest + E2E (`spec10-validation.spec.ts`) |
| **[`delivered/04_FASE4_MUNDO_CONTINUO.md`](./delivered/04_FASE4_MUNDO_CONTINUO.md)** | **Fase 4: Mundo Contínuo:** Safe Town (Room 0), iluminação adaptativa, NPCs interativos, áudio e clima por bioma | 2026-08-31 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md`](./delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md)** | **ÍNDICE MESTRE — Eixo A: Gráficos Avançados:** Iluminação GPU real (Light2D), pós-processamento WebGL (PostFXSystem) e normal maps procedurais | 2026-08-31 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](./delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | **ÍNDICE MESTRE — Evolução Gráfica & Auditiva:** Quick wins (Medo, Cascata de Luz, Tinnitus), animações 8-direcionais, ragdoll/gibs e shaders de status/sombra/reflexo | 2026-08-31 | Vitest + E2E (`pnpm verify`) |

---

## 🔵 Backlog (Propostas de Features Formais — 0% Desenvolvimento Iniciado)

> Ordem de execução sugerida (por prioridade/criticidade): ver "🎯 Fila de Prioridade" no topo deste documento.

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade |
|---|---|---|---|
| **[`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | Gap real do sistema de Prestígio já ~90% entregue (`delivered/18`): falta só o modal React de UI | medium | low |
| **[`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Lua de Sangue, Eclipse, Solstício Negro) | medium | medium |
| **[`backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`](./backlog/08_GUIA_EVOLUCAO_COMERCIAL.md)** | Checklist comercial e requisitos para Steam, Play Store e itch.io | high | low |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Referências estéticas e proposta de HUD estilo ARPG clássico (Tier A completo, Tiers B/C pendentes) | medium | medium |
| **[`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md)** | Atmosfera, Tensão e Indicadores de Ameaça (Indicadores fora de tela, áudio espacial e iluminação) | medium | medium |
| **[`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md)** | Progressão, Micro-Quests e Evolução de Habilidades (Contratos, Modificadores e Talentos) *(Parcialmente Implementado)* | medium | medium |
| **[`backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md`](./backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md)** | Framework de Evolução de UI e Assets Externos Góticos (Híbrido 9-slice React & Web Audio) | high | high |
| **[`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`](./backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md)** | Discovery Eixo B — Pipeline de Integração de Assets Externos e Spritesheets por Tiers | medium | medium |
| **[`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** | Toggle de Intensidade de Conteúdo — mitigação de classificação indicativa (gore visual configurável) | medium | medium |
| **[`backlog/16_FILA_AUTOMACAO_JULES.md`](./backlog/16_FILA_AUTOMACAO_JULES.md)** | ⚠️ Fila operacional (não uma proposta de feature) — itens que a sessão recorrente do Jules consome em ordem de prioridade | high | low |

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
