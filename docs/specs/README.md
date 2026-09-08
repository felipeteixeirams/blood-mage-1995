---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: docs/specs
priority: high
criticality: high
status: active
last_updated: 2026-09-08
tags: [specs, index, workflow, in-progress, delivered, backlog, scope-definition, discovery, rejected]
---

# 📋 Specifications Index — Bloodmage 1995

> **Organização do Ciclo de Vida de Specs & Discoveries:**
> - **`in-progress/`**: Especificações cujo desenvolvimento foi iniciado, mas que ainda possuem fases/itens pendentes.
> - **`delivered/`**: Especificações onde **100%** das fases foram completamente desenvolvidas, testadas e integradas.
> - **`backlog/`**: Especificações formais **prontas para implementação imediata** (0% de código, mas escopo/técnica 100% definidos — ver Blueprint).
> - **`scope-definition/`**: Propostas reais que **ainda não** batem a barra técnica mínima de `backlog/` — falta decisão de produto, critério de aceite, ou o escopo é grande demais para uma spec só. Nenhum agente deve implementar a partir daqui.
> - **`discovery/`**: Pesquisas exploratórias, avaliações arquiteturais, spikes técnicos e descobertas de produto/arte — sem compromisso de entrega.
> - **`rejected/`**: Propostas arquivadas/rejeitadas para proteger os guardrails arquiteturais contra regressões.
>
> Padrão de cabeçalho (`priority` + `criticality` + demais campos), o Blueprint
> obrigatório de estrutura de spec, e a regra de "o que não é uma spec não
> mora aqui": ver Seção 6 de
> [`docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`](../architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md).

---

## 🗂️ Board de Fluxo (Kanban)

> **A visão mais rápida do estado real do projeto.** 4 raias, do jeito mais
> simples possível — atualiza só quando uma spec muda de fase de verdade
> (não é um processo automático, é uma linha que move de coluna manualmente
> quando o estado muda). As outras tabelas deste índice (Fila de
> Prioridade, Backlog, Delivered...) continuam sendo a fonte de detalhe;
> este board é só o resumo visual de "onde cada coisa está agora".
>
> **Regra de quando mover uma linha:**
> - `Backlog → Em Desenvolvimento`: quando alguém (Claude/Jules/Felipe) começa a codificar de fato.
> - `Em Desenvolvimento → Em Qualidade`: quando o código está pronto (`pnpm verify` limpo) mas ainda falta alguém *jogar* pra confirmar que funciona/está calibrado — isso pode acontecer com a spec ainda em `in-progress/` (ex: só falta QA) ou já em `delivered/` (código entregue, QA ainda não confirmada — o "pendente QA/verificação ao vivo" que já anotamos nas specs de qualquer forma).
> - `Em Qualidade → Concluído`: quando alguém confirma em jogo que está tudo certo (aí sim é "delivered" de verdade, sem ressalva).

| 📋 Backlog | 🔨 Em Desenvolvimento | 🔍 Em Qualidade | ✅ Concluído *(7 dias)* |
|---|---|---|---|
| [06](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md) · 🔒[08](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) · [09](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) · 🔒[09-PL](./backlog/09_PIXEL_LAB_PROMPT_GUIDE.md) · [11](./backlog/11_ATMOSFERA_E_TENSAO.md) · [12](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md) · [15](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md) · 🔒[29](./backlog/29_CLOUD_SAVE_FASE5.md) · [30](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md) · [31](./backlog/31_NORMAL_MAP_TILE_DOOR.md) | [05 — Fase 5](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md) *(só falta i18n)* | [03 — Fase 3](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md) *(código pronto, falta QA+tuning)*<br>[09 — HUD Tier A](./delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md) *(código pronto, falta QA manual)*<br>[25 — Chunk Streaming](./delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md) *(código pronto, falta cruzar fronteira de chunk em jogo)* | 17 · 28 · 18 · 10 *(ver tabela "🟢 Delivered" abaixo)* |

> 🔒 = bloqueada por insumo externo (ver seção "🚧 Bloqueados" abaixo) — ainda aparece na coluna Backlog porque o escopo já está pronto, só não tem próximo passo executável agora.

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
> foi aposentado em 2026-09-07 (ver
> `docs/architecture/09_JULES_QUEUE_HISTORY_2026_09.md`).
>
> **Só entram aqui specs `status: backlog` sem impedimento externo ativo**
> (ver "🚧 Bloqueados" abaixo para bloqueio externo, e "🟠 Escopo em
> Definição" para o que não bate a barra mínima de profundidade técnica —
> critério formal em Seção 6 de
> `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`).

| # | Spec | Pasta | Prioridade | Criticidade | Progresso |
|---|---|---|---|---|---|
| 1 | [`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md) | in-progress | 🔴 high | 🟡 medium | 90% — resta só i18n (Cloud Save extraído, ver bloqueados) |
| 2 | [`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md) | backlog | 🟡 medium | 🟡 medium | backlog |
| 3 | [`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md) | backlog | 🟡 medium | 🟡 medium | partial |
| 4 | [`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md) | backlog | 🟡 medium | 🟡 medium | backlog |
| 5 | [`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md) | backlog | 🟡 medium | 🟢 low | Jules-ready — pronto pra execução sem esclarecimento |
| 6 | [`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md) | backlog | 🟡 medium | 🟢 low | Falta só o modal React de UI (~90% já entregue em `delivered/18`); default de gatilho (NPC Ancião) já definido |
| 7 | [`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) | backlog | 🟢 low | 🟢 low | Reduzido ao residual Tier B.6 (menu contextual de mouse) — Tier A entregue em `delivered/09` |
| 8 | [`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./backlog/31_NORMAL_MAP_TILE_DOOR.md) | backlog | 🟢 low | 🟢 low | Jules-ready — pronto pra execução sem esclarecimento |

> *Nota:* `in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md` saiu desta fila em
> 2026-09-08 — PR #93 entregou os 2 itens de código que faltavam (cura via
> Clérigo + ícones customizados). Só resta QA manual e tuning de valores,
> ambos dependentes do Felipe jogar; nada executável por agente. Continua
> em `in-progress/` (não é "delivered" até a validação humana acontecer).
>
> *Nota:* `25_MUNDO_CONTINUO_CHUNK_STREAMING` saiu desta fila em 2026-09-08
> — PR #97 (Jules) entregou a Fase C (transições sem corte entre biomas),
> última fase pendente. Spec movida para `delivered/25` (ver tabela
> "🟢 Delivered" abaixo).

### 🟠 Escopo em Definição (proposta real, mas não pronta para implementação)

> Introduzido em 2026-09-08 (padronização de specs, Seção 6 de
> `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`). Diferente
> de "🚧 Bloqueados": aqui o bloqueio não é externo (arte/confirmação de
> produto pendente) — é que a spec em si ainda não bate a barra técnica
> mínima (falta decisão de produto que muda código, falta critério de
> aceite, ou o escopo é grande demais para uma spec só). Nenhum agente deve
> implementar a partir destes arquivos como estão.

| Spec | Pasta | O que falta para virar `backlog/` |
|---|---|---|
| [`scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md) | scope-definition | Escopo de 5 sistemas em 1 arquivo só; precisa virar Índice Mestre + satélites (1 por evento), com schema Zod de `worldEvents.json` e critério de aceite por satélite |
| [`scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md) | scope-definition | Residual (variedade interna de `gloomy_woods`) é uma pergunta em aberto, não uma spec — falta decisão do Felipe + Blueprint técnico próprio |

### 🚧 Bloqueados (aguardando decisão/insumo externo — fora da fila acima)

> Triagem de 2026-09-07 (atualizada em 2026-09-08 — spec 25 entregue por
> completo, ver "🟢 Delivered" abaixo). Diferente de "🟠 Escopo em Definição":
> estas specs **já batem** a barra técnica mínima (`status: backlog`
> continua válido) — o que falta é um insumo externo não-técnico
> (orçamento de arte, confirmação de produto). Nada aqui tem próximo passo
> executável por um agente IA agora.

| Spec | Pasta | Impedimento | O que destrava |
|---|---|---|---|
| [`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) | backlog *(era in-progress)* | Fase 0 (arquitetura) concluída; todo o resto exige sprites físicos que não existem | Orçamento/direção de arte aprovado |
| [`backlog/09_PIXEL_LAB_PROMPT_GUIDE.md`](./backlog/09_PIXEL_LAB_PROMPT_GUIDE.md) | backlog *(era in-progress)* | Guia só tem uso ativo quando há produção de sprites em andamento | Mesmo gate de #08 |
| [`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md) | backlog *(novo, extraído de #05)* | Mandato do projeto: nenhuma integração de conta/nuvem sem confirmação prévia de Felipe | Felipe confirmar explicitamente + validação de demanda (Beta) |

---

## 🗂️ Estrutura de Diretórios

```
docs/specs/
├── README.md (este índice)
├── in-progress/       # 🟡 Desenvolvimento iniciado e com fases pendentes
├── delivered/         # 🟢 100% concluídas, testadas e integradas em produção
├── backlog/           # 🔵 Prontas pra implementação imediata (0% código, escopo 100% definido)
├── scope-definition/  # 🟠 Proposta real, mas ainda não pronta pra implementação
├── discovery/         # 💡 Pesquisas exploratórias, avaliações técnicas e spikes
└── rejected/          # ⛔ Propostas arquivadas/rejeitadas para evitar regressões
```

> Documentos que não são specs (guias estratégicos de produto, histórico de
> governança, duplicatas) não moram aqui — ver a seção "🚫 O que NÃO é uma
> spec" em `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`. Em 2026-09-08, 3
> documentos foram realocados por esse motivo:
> `backlog/08_GUIA_EVOLUCAO_COMERCIAL.md` → [`docs/product/COMMERCIAL_READINESS_GUIDE.md`](../product/COMMERCIAL_READINESS_GUIDE.md) (guia estratégico, não spec técnica);
> `backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md` → `discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md` (já se autodeclarava "Discovery Completo");
> `backlog/13_UI_ASSETS_EXTERNOS_FRAMEWORK.md` deletado por ser cópia integral de `discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md`;
> `backlog/_ARCHIVED_16_FILA_AUTOMACAO_JULES.md` → [`docs/architecture/09_JULES_QUEUE_HISTORY_2026_09.md`](../architecture/09_JULES_QUEUE_HISTORY_2026_09.md) (histórico de governança, não spec de feature).

---

## 🟡 In-Progress (Desenvolvimento Iniciado — Fases Pendentes, Sem Impedimento)

> Triagem de 2026-09-07: 4 specs saíram desta pasta por terem impedimento
> ativo — ver "🚧 Bloqueados" acima para onde foram e por quê:
> `08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST`, `09_PIXEL_LAB_PROMPT_GUIDE`
> seguem lá. Em `05_FASE5`, o item Cloud Save (bloqueado) foi extraído para
> `backlog/29_CLOUD_SAVE_FASE5.md`; a spec ficou com escopo restrito a
> i18n. `18_ARPG_CONTINUOUS_WORLD_TOPOLOGY` foi para `scope-definition/`
> (residual não é mais uma spec executável, ver seção acima).
> **Atualização 2026-09-08:** `25_MUNDO_CONTINUO_CHUNK_STREAMING` saiu
> desta pasta — PR #97 (Jules) entregou a Fase C, última pendência; spec
> 100% completa, movida para `delivered/25`.

| Spec / Documento | Fases / Escopo Concluído | Fases / Itens Pendentes (destravados) |
|---|---|---|
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | • PWA Offline-First (Spec 15)<br>• Scripts de build Electron (`scripts/build-steam.sh`) | • Localização multilíngue (i18n) |
| **[`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md)** | • Gameplay loop completo (Sangramento/Veneno/Infecção aplicados por monstro, dreno de HP, cura via consumível comprável no Alquimista)<br>• Cura via NPC Clérigo (PR #93)<br>• Ícones customizados SVG (PR #93) | • *(nenhum item de código — só QA manual e tuning de valores, dependentes do Felipe jogar)* |

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
| **[`delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`](./delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md)** | **Mundo Contínuo Estilo Dungeon Siege — Chunk Streaming:** Fases A, B, B.2, C e D entregues (streaming de chunks, bounds dinâmicos, transições sem corte de iluminação/névoa/áudio/FX e porta de saída física) | 2026-09-08 (Fase C via PR #97, Jules) | Vitest + E2E (`pnpm verify`) — pendente verificação ao vivo |
| **[`delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md`](./delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md)** | **HUD Tier A (Diablo II / Dungeon Siege 1):** Marcador "!" sobre NPCs, minimap mínimo, acabamento entalhado de HP/MP e cinturão de curativos | 2026-08-25 (separado do backlog em 2026-09-08) | Vitest + `tsc`/`vite build`; pendente QA manual |
| **[`delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md`](./delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md)** | **Polimento Gráfico por Calibração dos Sistemas Existentes:** Calibração completa das 9 Frentes (Glow, PostFX, Lighting, Atmosphere, Shadows, Reflections, Particles, Tree Shader & Terrain), tokens de sequência de FX e profundidades relativas | 2026-09-07 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md`](./delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md)** | **Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos:** UI consistente entre modais secundários, navegação completa via gamepad e retratos temáticos | 2026-09-06 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md`](./delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md)** | **Sistema de Prestígio 'Blood Seal':** Sacrifício voluntário de nível por Selos de Sangue permanentes e New Game+ | 2026-09-06 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md`](./delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** | **Polimento Visual Procedural:** 8 inimigos com silhuetas curvas e normal maps, sombras elípticas radiais, partículas com degradê, tochas alinhadas e tijolos com musgo orgânico | 2026-09-05 | Vitest + E2E (`spec10-validation.spec.ts`) |
| **[`delivered/04_FASE4_MUNDO_CONTINUO.md`](./delivered/04_FASE4_MUNDO_CONTINUO.md)** | **Fase 4: Mundo Contínuo:** Safe Town (Room 0), iluminação adaptativa, NPCs interativos, áudio e clima por bioma | 2026-08-31 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md`](./delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md)** | **ÍNDICE MESTRE — Eixo A: Gráficos Avançados:** Iluminação GPU real (Light2D), pós-processamento WebGL (PostFXSystem) e normal maps procedurais | 2026-08-31 | Vitest + E2E (`pnpm verify`) |
| **[`delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`](./delivered/24_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md)** | **ÍNDICE MESTRE — Evolução Gráfica & Auditiva:** Quick wins (Medo, Cascata de Luz, Tinnitus), animações 8-direcionais, ragdoll/gibs e shaders de status/sombra/reflexo | 2026-08-31 | Vitest + E2E (`pnpm verify`) |

---

## 🔵 Backlog (Prontas para Implementação Imediata — 0% Código, Escopo 100% Definido)

> Ordem de execução sugerida (por prioridade/criticidade): ver "🎯 Fila de Prioridade" no topo deste documento.
> Coluna **Bloqueado?** aponta o que está na seção "🚧 Bloqueados" da fila — não comece esses sem resolver o impedimento primeiro.
> Toda spec aqui segue o Blueprint completo (Seção 6 de `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`); o que não segue foi movido para `scope-definition/`, `discovery/`, ou para fora de `docs/specs/` (ver nota em "🗂️ Estrutura de Diretórios").

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | Bloqueado? |
|---|---|---|---|---|
| **[`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md)** | Gap real do sistema de Prestígio já ~90% entregue (`delivered/18`): falta só o modal React de UI (gatilho default: NPC Ancião) | medium | low | Não |
| **[`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | *(era in-progress)* Living Tracking Spec de integração de sprites físicos — Fase 0 concluída | high | medium | **Sim** — orçamento de arte |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Residual Tier B.6: menu contextual de mouse ao passar sobre alvo (desktop) — Tier A entregue em `delivered/09` | low | low | Não |
| **[`backlog/09_PIXEL_LAB_PROMPT_GUIDE.md`](./backlog/09_PIXEL_LAB_PROMPT_GUIDE.md)** | *(era in-progress)* Guia de prompts PixelLab, usado durante produção de sprites | high | low | **Sim** — mesmo gate acima |
| **[`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md)** | Atmosfera, Tensão e Indicadores de Ameaça (Indicadores fora de tela, áudio espacial e iluminação) | medium | medium | Não |
| **[`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md)** | Progressão, Micro-Quests e Evolução de Habilidades (Contratos, Modificadores e Talentos) *(Parcialmente Implementado)* | medium | medium | Não |
| **[`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** | Toggle de Intensidade de Conteúdo — mitigação de classificação indicativa (gore visual configurável) | medium | medium | Não |
| **[`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md)** | Determinismo por seed no espalhamento de vegetação/props (Poisson Disk) — Jules-ready | medium | low | Não |
| **[`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./backlog/31_NORMAL_MAP_TILE_DOOR.md)** | Normal map ausente na textura `tile_door` — Jules-ready | low | low | Não |
| **[`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md)** | *(novo, extraído de `in-progress/05`)* Cloud Save automatizado (Firebase/Firestore) | medium | high | **Sim** — confirmação de Felipe pendente |

---

## 🟠 Escopo em Definição (Proposta Real, Ainda Não Pronta Para Implementação)

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | O que falta |
|---|---|---|---|---|
| **[`scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Eclipse de Sangue, Cerco ao Vilarejo, Rifts de Infecção, Solstícios) | medium | medium | Virar Índice Mestre + satélites, 1 por evento escolhido |
| **[`scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | *(superada em parte, 2026-09-08)* Variedade orgânica interna de `gloomy_woods` — conectividade entre biomas já resolvida pela abordagem escolhida em #25 | low | medium | Decisão do Felipe + Blueprint técnico próprio |

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
| **[`discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md`](./discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md)** | *(movido de `backlog/14` em 2026-09-08)* Arquitetura de `AssetLoader` com fallback procedural para integração de assets físicos externos | Média |

---

## ⛔ Rejected / Obsolete (Rejeitadas para Prevenir Regressões)

| Documento | Motivo da Rejeição / Arquivamento | Diretriz Substituta |
|---|---|---|
| **[`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`](./rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md)** | Proposta de compor armas/armaduras desenhando camadas procedurais no HTML5 Canvas sobre `'spr_bloodmage'`. Viola a **Regra 6b do AGENTS.md** e corromperia a arte física final de 8 direções do PixelLab. | Customizações cosméticas devem ser feitas exclusivamente via Palette Swaps em tempo de build/shader ou spritesheets modulares do PixelLab. |
