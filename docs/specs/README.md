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
| 1 | [`in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md) | in-progress | 🔴 high | ⚠️ high | not_started — frentes P0–P2 mapeadas, aguardando implementação. Sem impedimento. |
| 2 | [`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md) | in-progress | 🔴 high | ⚠️ high | 75% — próximo passo destravado: cura via NPC Clérigo |
| 3 | [`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md) | in-progress | 🔴 high | 🟡 medium | 90% — resta só i18n (Cloud Save extraído, ver bloqueados) |
| 4 | [`backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`](./backlog/08_GUIA_EVOLUCAO_COMERCIAL.md) | backlog | 🔴 high | 🟢 low | Checklist de requisitos comerciais (Steam/Play Store/itch.io) |
| 5 | [`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) | backlog | 🟡 medium | 🟡 medium | Tier A completo — Tiers B/C pendentes |
| 6 | [`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md) | backlog | 🟡 medium | 🟡 medium | draft |
| 7 | [`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md) | backlog | 🟡 medium | 🟡 medium | backlog |
| 8 | [`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md) | backlog | 🟡 medium | 🟡 medium | partial |
| 9 | [`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md) | backlog | 🟡 medium | 🟡 medium | backlog |
| 10 | [`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md) | backlog | 🟡 medium | 🟢 low | Jules-ready — pronto pra execução sem esclarecimento |
| 11 | [`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md) | backlog | 🟡 medium | 🟢 low | Falta só o modal React de UI (~90% já entregue em `delivered/18`) |
| 12 | [`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./backlog/31_NORMAL_MAP_TILE_DOOR.md) | backlog | 🟢 low | 🟢 low | Jules-ready — pronto pra execução sem esclarecimento |

### 🚧 Bloqueados (aguardando decisão/insumo externo — fora da fila acima)

> Triagem de 2026-09-07: nada aqui tem próximo passo executável por um agente
> IA agora. Cada um lista o que falta para destravar.

| Spec | Pasta | Impedimento | O que destrava |
|---|---|---|---|
| [`backlog/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`](./backlog/25_MUNDO_CONTINUO_CHUNK_STREAMING.md) | backlog *(era in-progress)* | Fases A/B entregues; Fase B.2 tem decisão explicitamente adiada por Felipe | Felipe decidir o rumo da Fase B.2 (1 chunk largo por bioma vs. N chunks menores) |
| [`backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md) | backlog *(era in-progress)* | Sobrepõe/conflita com a abordagem de #25 (chunk streaming vs. `PathDrivenGenerator`), nunca reconciliadas | Mesma decisão de Felipe acima, que também resolve qual abordagem seguir |
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

> Triagem de 2026-09-07: 4 specs saíram desta pasta por terem impedimento
> ativo (nenhum próximo passo executável agora) — ver "🚧 Bloqueados" na
> Fila de Prioridade acima para onde foram e por quê:
> `08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST`, `09_PIXEL_LAB_PROMPT_GUIDE`,
> `18_ARPG_CONTINUOUS_WORLD_TOPOLOGY`, `25_MUNDO_CONTINUO_CHUNK_STREAMING`
> (todas movidas para `backlog/`, mesmo conteúdo/progresso preservado). Em
> `05_FASE5`, o item Cloud Save (bloqueado) foi extraído para
> `backlog/29_CLOUD_SAVE_FASE5.md`; a spec ficou com escopo restrito a i18n.

| Spec / Documento | Fases / Escopo Concluído | Fases / Itens Pendentes (destravados) |
|---|---|---|
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | • PWA Offline-First (Spec 15)<br>• Scripts de build Electron (`scripts/build-steam.sh`) | • Localização multilíngue (i18n) |
| **[`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md)** | • Gameplay loop completo (Sangramento/Veneno/Infecção aplicados por monstro, dreno de HP, cura via consumível comprável no Alquimista) | • Cura via NPC Clérigo (sprite existe, sem interação)<br>• *(QA manual, ícones sprite e tuning de dreno seguem pendentes, mas dependem de Felipe/arte — não bloqueiam este item)* |
| **[`in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./in-progress/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md)** | • Spec detalhada de correção, calibração e integração visual dos sistemas atuais | • Implementação das frentes P0–P2 e validação visual/performance |

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
> Coluna **Bloqueado?** aponta o que está na seção "🚧 Bloqueados" da fila — não comece esses sem resolver o impedimento primeiro.

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | Bloqueado? |
|---|---|---|---|---|
| **[`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | Gap real do sistema de Prestígio já ~90% entregue (`delivered/18`): falta só o modal React de UI | medium | low | Não |
| **[`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Lua de Sangue, Eclipse, Solstício Negro) | medium | medium | Não |
| **[`backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`](./backlog/08_GUIA_EVOLUCAO_COMERCIAL.md)** | Checklist comercial e requisitos para Steam, Play Store e itch.io | high | low | Não |
| **[`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | *(era in-progress)* Living Tracking Spec de integração de sprites físicos — Fase 0 concluída | high | medium | **Sim** — orçamento de arte |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Referências estéticas e proposta de HUD estilo ARPG clássico (Tier A completo, Tiers B/C pendentes) | medium | medium | Não |
| **[`backlog/09_PIXEL_LAB_PROMPT_GUIDE.md`](./backlog/09_PIXEL_LAB_PROMPT_GUIDE.md)** | *(era in-progress)* Guia de prompts PixelLab, usado durante produção de sprites | high | low | **Sim** — mesmo gate acima |
| **[`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md)** | Atmosfera, Tensão e Indicadores de Ameaça (Indicadores fora de tela, áudio espacial e iluminação) | medium | medium | Não |
| **[`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md)** | Progressão, Micro-Quests e Evolução de Habilidades (Contratos, Modificadores e Talentos) *(Parcialmente Implementado)* | medium | medium | Não |
| **[`backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md`](./backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md)** | Framework de Evolução de UI e Assets Externos Góticos (Híbrido 9-slice React & Web Audio) | high | high | **Sim** — mesmo gate acima (áudio/telemetria já entregues à parte) |
| **[`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`](./backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md)** | Discovery Eixo B — Pipeline de Integração de Assets Externos e Spritesheets por Tiers | medium | medium | **Sim** — orçamento de arte |
| **[`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** | Toggle de Intensidade de Conteúdo — mitigação de classificação indicativa (gore visual configurável) | medium | medium | Não |
| **[`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md)** | Determinismo por seed no espalhamento de vegetação/props (Poisson Disk) — Jules-ready | medium | low | Não |
| **[`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./backlog/31_NORMAL_MAP_TILE_DOOR.md)** | Normal map ausente na textura `tile_door` — Jules-ready | low | low | Não |
| **[`backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./backlog/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | *(era in-progress)* Topologia de mundo contínuo via `PathDrivenGenerator` (padrão Dungeon Siege) | high | critical | **Sim** — conflito de escopo com #25 |
| **[`backlog/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`](./backlog/25_MUNDO_CONTINUO_CHUNK_STREAMING.md)** | *(era in-progress)* Mundo contínuo via Chunk Streaming — Fases A/B entregues | high | critical | **Sim** — decisão de Felipe pendente (Fase B.2) |
| **[`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md)** | *(novo, extraído de `in-progress/05`)* Cloud Save automatizado (Firebase/Firestore) | medium | high | **Sim** — confirmação de Felipe pendente |

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
