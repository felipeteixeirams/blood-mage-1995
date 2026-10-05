---
agent_context: Product Managers, Game Designers, Engenheiros e Agentes IA
target_module: docs/specs
priority: high
criticality: high
status: active
last_updated: 2026-09-28
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

## 📖 Definições de Status Estendidos

Quando uma spec está em `backlog/` ou `in-progress/`, pode ter **status adicional** que clarifica seu estado além da pasta:

| Status | Símbolo | Significado | Ação Quando Encontrar |
|--------|---------|------------|----------------------|
| **Skeleton Ready** | 📐 | Escopo 100% técnico definido; partes da arquitetura/dados já codificadas; falta implementação visual/refinamento sem dependências externas | Executável agora — é um refinamento, não redesign |
| **Partially Superseded** | 🔄 | Intenção original resolvida por outro spec entregue; residual ainda viável se escopo > 20% do original | Avaliar com Felipe: fechar como "resolvido" ou criar novo spec pra residual |
| **Awaiting Definition** | ⏳ | Escopo técnico 100% definido; bloqueado por decision de conceito/produto que muda o código (lib choice, feature priority, scope) | Nada executável até decisão; aparece em "🎯 Fila de Definição", não em Prioridade |
| *(sem status adicional)* | — | Backlog padrão ou in-progress com fases bem definidas | Pronto pra execução direto |

---

## 🚨 NOVIDADE: Readiness Gates & Dependency Graph

Implementado em **2026-10-05**: Sistema de gates de prontidão e mapa de dependências para melhor rastreamento de bloqueadores e readiness das specs.

### Documentos Relacionados:
- **[📋 READINESS_GATES.md](./READINESS_GATES.md)**: Checklist dos 4 gates obrigatórios (Product Decision, Technical Prototype, Scope Locked, Dependencies Resolved)
- **[📊 DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md)**: Grafo visual de dependências, bloqueadores e status de specs
- **[🔗 DEPENDENCY_MAP.yaml](./DEPENDENCY_MAP.yaml)**: Fonte de verdade central para bloqueadores e relacionamentos entre specs

**Resumo Rápido (2026-10-05):**
- 5 specs bloqueadas (aguardando decisões/insumos externos)
- 12 specs prontas para implementação
- 1 spec em QA (código pronto, aguardando playtest do Felipe)

---

## 🗂️ Board de Fluxo (Kanban)

> **A visão mais rápida do estado real do projeto.** 4 raias — atualiza só
> quando uma spec muda de fase de verdade (não é processo automático).
>
> **Regra de quando mover uma linha:**
> - `Backlog → Em Desenvolvimento`: quando alguém (Claude/Jules/Felipe) começa a codificar de fato.
> - `Em Desenvolvimento → Em Qualidade`: código pronto (`pnpm verify` limpo) mas falta alguém *jogar* pra confirmar.
> - `Em Qualidade → Concluído`: alguém confirma em jogo que está tudo certo.

| 📋 Backlog | 🔨 Em Desenvolvimento | 🔍 Em Qualidade | ✅ Concluído *(7 dias)* |
|---|---|---|---|
| 🔒 **[08](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** Sprite Mapping<br>🔒 **[29](./backlog/29_CLOUD_SAVE_FASE5.md)** Cloud Save<br>🔒 **[32](./backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md)** PixelLab Guide | — | — | **[09](./delivered/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** HUD Tier B.6<br>**[11](./delivered/11_ATMOSFERA_E_TENSAO.md)** Atmosfera<br>**[32](./delivered/32_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** — Toggle Gore<br>**[33](./delivered/33_BOSS_MULTIFASE_TELEGRAPH_SYSTEM.md)** Boss Multi-Fase<br>**[34](./delivered/34_EQUIPMENT_SET_BONUS_SYSTEM.md)** Equipment Sets |

> 🔒 = bloqueada por insumo externo (ver seção "🚧 Bloqueados" abaixo).
>
> **Nota (2026-09-28):** Reconciliação com `main` (PR #121, mesclado sem
> passar pela nossa branch de trabalho) — specs 05 (i18n), 06 (Prestige
> Modal), 12 (Progressão), 18 (Modal UI), 25, 30, 31 já estavam entregues em
> `main` mas nossa branch ainda as tratava como pendentes. Ver notas em cada
> seção abaixo.
>
> **Nota (2026-09-28, tarde):** Specs 09, 11, 33 e 34 implementadas em
> paralelo por 4 agentes (worktrees isolados), integradas sequencialmente
> com `pnpm verify`/`pnpm test -- --run` entre cada merge (571/571 testes
> passando ao final). Detalhes de cada entrega nas seções correspondentes
> abaixo.

---

## 🎯 Fila de Prioridade — "Pega a Próxima"

> Tabela única (`in-progress/` + `backlog/`), ordenada por **prioridade** (produto) e,
> dentro do mesmo nível, por **criticidade** (risco técnico/regressão — ver definição
> na Seção 6 do doc de metodologia linkado acima). Pedir **"pega a próxima"** resolve
> para a **linha 1** com Status = ✅ Executável Agora.
>
> **Esta é também a fila que o Jules consome** (prompt de sessão em
> `docs/architecture/08_JULES_SESSION_PROMPT.md`).
>
> **Só entram aqui specs sem impedimento externo ativo** (ver "🚧 Bloqueados"
> abaixo, e "🟠 Escopo em Definição" para o que não bate a barra mínima de
> profundidade técnica).

| # | Spec | Pasta | P | C | Status / Bloqueador | Resumo de Execução |
|---|---|---|---|---|---|---|
| — | *(vazia)* | — | — | — | — | Todas as specs desbloqueadas foram entregues em 2026-09-28 (ver Kanban acima e "🟢 Delivered" abaixo). Próxima leva depende de "🎯 Fila de Definição" (decisão de produto) ou de novas specs em `scope-definition/`/`discovery/`. |

**Legenda:** P = Prioridade | C = Criticidade | Specs em "⏳ Awaiting Definition" não aparecem aqui (ver "🎯 Fila de Definição" abaixo)

> *Nota (2026-09-28):* Specs 33 e 34 adicionadas após análise do protótipo
> `felipeteixeirams/bloodmage1995` (Godot) — ver
> `docs/architecture/07_DECISION_LOG.md` para o racional completo de o que
> foi portado (Boss multi-fase, Equipment Sets) vs. descartado (Spell
> System, Skill Tree por atributos, Prestige loot scaling — redundantes ou
> inferiores ao que já existe entregue).
>
> *Nota (2026-09-28, tarde):* Specs 09, 11, 33 e 34 implementadas e
> integradas — movidas para "🟢 Delivered" (ver detalhes ali). Fila
> esvaziada.

> *Nota (2026-09-28):* Fila drasticamente reduzida após reconciliação com
> `main` — specs 05, 06, 12, 18, 25, 30, 31 que apareciam aqui (ou em
> "Fila de Definição") já estavam **entregues** em `main` (PR #121 e
> anteriores) mas nossa branch de trabalho nunca tinha recebido esse merge.
> Ver "🟢 Delivered" e `delivered/_HISTORY_ARCHIVE.md` para os detalhes de
> cada entrega.

### 🎯 Fila de Definição (Conceito & Regras de Gameplay — Workflow Paralelo)

> Diferente de "🚧 Bloqueados": aqui o bloqueio NÃO é externo (arte/confirmação
> comercial) — é que a spec precisa de **definição de conceito/regras de
> gameplay** antes de entrar em desenvolvimento. Nenhum agente IA implementa
> a partir destes como estão.

| Spec | Pasta | O que Felipe precisa clarificar | Próximo passo |
|---|---|---|---|
| **[`scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | scope-definition | Qual evento implementar PRIMEIRO? (Lua de Sangue / Eclipse / Solstício Negro / Cerco ao Vilarejo?) + Escopo: 1 evento por satélite ou agregar? | Quando decidido → divide em Índice Mestre + satélites, move 1º evento para `backlog/` |
| **[`scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | scope-definition | 🔄 **Partially Superseded**: conectividade entre biomas já resolvida por `delivered/25` (Chunk Streaming). Resta: variedade orgânica interna de `gloomy_woods` é desejo ou escopo? | Quando clarificado → vira Blueprint técnico próprio ou fecha como "completo via #25" |

> ✅ *Removida em 2026-09-28:* spec 05 (i18n) — a decisão de biblioteca já
> foi tomada e implementada (`src/i18n/` com `enUS.ts`/`ptBR.ts`), entregue
> via `main` em 2026-09-08. Não há mais nada aguardando definição aqui.

### 🚧 Bloqueados por Insumo Externo (Arte / Comercial — Não-Conceitual)

> **Diferente de "🎯 Fila de Definição":** estas specs **já têm escopo
> técnico 100% definido** — o bloqueio é por insumo externo FORA do escopo
> técnico/conceitual (orçamento de arte, confirmação de produto de negócio).

#### 🎨 **Grupo 1: Produção de Sprites (PixelLab / Arte Terceirizada)**

**Status Bloqueador:** Aguardando aprovação de orçamento + direção de arte

| Spec | Pasta | Contexto | Escopo |
|---|---|---|---|
| [`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) | backlog | Fase 0 (arquitetura) concluída; Fases 1+ exigem sprites físicos dos personagens que ainda não existem | Rastreamento de integração de assets PixelLab + checklist de cobertura de 8-direções/animações |
| [`backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md`](./backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md) | backlog | Guia operacional de prompts para geração de sprites; máximo valor quando produção PixelLab estiver ativa | Framework de prompts, estilos, paletas e casos de refinamento |

**Desbloqueador:** Orçamento de arte aprovado + cronograma de produção PixelLab iniciado. Ambas sobem juntas para Fila de Prioridade quando isso acontecer.

#### 💳 **Grupo 2: Confirmação Comercial (Cloud Save / Integração de Conta)**

| Spec | Pasta | Contexto | Escopo |
|---|---|---|---|
| [`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md) | backlog | Extraído de `in-progress/05` (já entregue); mandato do projeto: nenhuma integração de conta/nuvem sem aprovação prévia do Felipe | Firebase/Firestore automatizado + sincronização cross-device |

**Desbloqueador:** Felipe confirmar explicitamente demanda comercial (Beta ou release?) + avaliação de segurança/LGPD.

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

---

## 🟡 In-Progress (Desenvolvimento Iniciado — Fases Pendentes, Sem Impedimento)

| Spec / Documento | Fases / Escopo Concluído | Fases / Itens Pendentes |
|---|---|---|
| *(vazio)* | — | — |

> *Nota (2026-09-28, tarde):* `11_ATMOSFERA_E_TENSAO.md` movida para
> `delivered/` — o residual (indicador de ameaça fora de tela + áudio
> espacial direcional) foi implementado, revisado e testado.

> *Nota (2026-09-28):* `05_FASE5`, `06_SISTEMA_DE_PRESTIGIO`, `08_GUIA_EVOLUCAO_COMERCIAL`
> e vários documentos "fantasma" (`SPECS_EVOLUCAO.md`, `06_EIXO_A...`,
> `10_EVOLUCAO_GRAFICA...`, versões antigas de `16`/`17`/`18`) foram
> removidos de `in-progress/` na reconciliação com `main` — todos
> representavam trabalho já entregue (ver `delivered/`) ou cópias obsoletas
> de documentos já resolvidos em versões mais recentes desta própria
> auditoria. `03_FASE3_STATUS_SOBREVIVENCIA.md` também saiu — `main` já
> validou e entregou como `delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md`.
> Um PR posterior de auditoria de docs (Jules, PR #122) reintroduziu esses
> mesmos fantasmas em `main` por ter partido de um snapshot anterior a esta
> reconciliação — removidos de novo aqui em 2026-09-28 (2ª reconciliação),
> mesma justificativa de conteúdo já documentada.

> *Nota:* O arquivo histórico consolidado de acompanhamento (`SPECS_EVOLUCAO.md`) foi arquivado para [`in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md`](./in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md) durante a refatoração hierárquica por satélites.

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
| **[`delivered/33_BOSS_MULTIFASE_TELEGRAPH_SYSTEM.md`](./delivered/33_BOSS_MULTIFASE_TELEGRAPH_SYSTEM.md)** | **Boss Multi-Fase com Telégrafo Evolutivo:** corrige bug real (`blood_lord_boss`→`necro_lord_boss`, telegraph `boss_slam` nunca disparava); `BossPhaseController.ts` (extract/delegate, aditivo, não toca FSM); 3 fases por threshold de HP em `necro_lord_boss`; novo telegraph `'wave'` na fase final | 2026-09-28 | Vitest (`BossPhaseController.test.ts`, 8 testes); typecheck 0 erros; build OK. **Não validado:** verificação visual em jogo real (Playwright indisponível no ambiente) |
| **[`delivered/34_EQUIPMENT_SET_BONUS_SYSTEM.md`](./delivered/34_EQUIPMENT_SET_BONUS_SYSTEM.md)** | **Sistema de Bônus de Conjunto:** `setId` em itens/relíquias, `equipmentSets.json` (Conjunto Sangue + Conjunto Abissal), `calculateSetBonuses()` puro, integração em `getRelicModifiers()`, indicação no `InventoryModal.tsx` | 2026-09-28 | Vitest (`EquipmentSetSystem.test.ts`, 9 testes); corrigiu regressão real em `RelicSystem.test.ts` (valores desatualizados pelo novo bônus); typecheck 0 erros; build OK |
| **[`delivered/11_ATMOSFERA_E_TENSAO.md`](./delivered/11_ATMOSFERA_E_TENSAO.md)** | **Atmosfera e Tensão (residual):** extraiu `ThreatIndicatorSystem.ts` (lógica pura do indicador de ameaça fora de tela + áudio espacial, já implementados por Jules em commit anterior, mas com teste duplicado/dessincronizado da produção — corrigido) | 2026-09-28 | Vitest (`ThreatIndicator.test.ts`, expandido com 3 casos novos); typecheck 0 erros; build OK. **Não validado:** game feel do áudio/visual em jogo real |
| **[`delivered/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./delivered/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | **HUD Tier B.6 residual:** menu contextual de alvo no hover do mouse ("ATACAR"/"CONVERSAR", desktop only), `HoverContextTarget.ts` (funções puras) | 2026-09-28 | Vitest (`HoverContextTarget.test.ts`, 9 testes); typecheck 0 erros; build OK. **Não validado:** game feel/legibilidade em jogo real |

> *Nota (2026-09-28):* Diversas entregas que estavam nesta janela em `main`
> (specs 03, 04, 09, 12, 17, 18, 25, 28, 30, 31 — datadas de 2026-09-06 a
> 2026-09-19) já passaram dos 7 dias a partir de hoje e foram movidas pro
> topo de `_HISTORY_ARCHIVE.md`.

---

## 🔵 Backlog (Prontas para Implementação Imediata — 0% Código, Escopo 100% Definido)

> Ordem de execução sugerida (por prioridade/criticidade): ver "🎯 Fila de Prioridade" no topo deste documento.
> Coluna **Bloqueado?** aponta o que está na seção "🚧 Bloqueados" da fila — não comece esses sem resolver o impedimento primeiro.

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | Bloqueado? |
|---|---|---|---|---|
| **[`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | *(era in-progress)* Living Tracking Spec de integração de sprites físicos — Fase 0 concluída | high | medium | **Sim** — orçamento de arte (grupo com #32) |
| **[`backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md`](./backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md)** | *(renumerado de 09-PL em 2026-09-13)* Guia de prompts PixelLab, usado durante produção de sprites | high | low | **Sim** — orçamento de arte (grupo com #08) |
| **[`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md)** | *(novo, extraído de `05` já entregue)* Cloud Save automatizado (Firebase/Firestore) | medium | high | **Sim** — confirmação de Felipe pendente |

> *Nota (2026-09-28):* Spec 06 (Sistema de Prestígio) não aparece mais aqui
> — já foi entregue por completo (backend + Modal UI, ver `delivered/18`),
> confirmado por leitura do código (`src/components/PrestigeModal.tsx`
> existe). `main` ainda a listava como "proposta inicial" por não ter
> recebido esta reconciliação.
>
> *Nota (2026-09-28, tarde):* Specs 09, 33 e 34 saíram do Backlog — foram
> implementadas e entregues (ver "🟢 Delivered" acima).

---

## 🟠 Escopo em Definição (Proposta Real, Ainda Não Pronta Para Implementação)

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | Status / Próximo Passo |
|---|---|---|---|---|
| **[`scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Lua de Sangue, Eclipse, Solstício Negro, Cerco ao Vilarejo) | medium | medium | Aguardando decisão: qual evento implementar PRIMEIRO? Vira Índice Mestre + satélites, 1 evento por spec |
| **[`scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | 🔄 **Partially Superseded**: Conectividade entre biomas resolvida por `delivered/25` (Chunk Streaming). Residual: variedade orgânica interna de `gloomy_woods` — é escopo ou refinamento desejado? | low | medium | Decisão do Felipe: fechar como "completo via #25" ou abrir novo Blueprint técnico pra variedade |

---

## 💡 Discovery (Pesquisas Exploratórias, Spikes & Avaliações Técnicas)

> **Escalação & Governance:** Discovery items NÃO são "eternas" — cada um tem ciclo claro:
> 1. **Research (Ativo)**: alguém investigando agora? SIM = ativo | NÃO = pausado (⏸️)
> 2. **Synthesis**: redação de findings em novo spec (`scope-definition/` OU `backlog/`)
> 3. **Archive**: sem aplicação imediata ou suplantado por outra decisão → `rejected/` ou deletar
>
> Quando um discovery conclui, criar entrada na tabela com "Escalado para: spec X" + link.

| Discovery | Hipótese de Pesquisa | Status | Escalação |
|-----------|-----|--------|-----------|
| **[`discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md`](./discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md)** | Phaser 4.2.1 PostFX GPU, Light2D, Procedural — supera assets externos? | ✅ Concluído | → [`delivered/23`](./delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md) (spec tech implementada) |
| **[`discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md`](./discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md)** | UI/Som com assets externos góticos (Diablo/Dungeon Siege style) | 🟡 Em Pesquisa | Pendente síntese |
| **[`discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md`](./discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md)** | Co-op P2P leve via WebRTC (pós-campanha) | ⏸️ Pausado (fora de scope atual) | Reativar quando campanha encerrar |
| **[`discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`](./discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md)** | Capacitor/TWA + monetização indie ética | 🟡 Em Pesquisa | Pendente síntese |
| **[`discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md`](./discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md)** | Progressão em atos, diálogos ramificados, lore | 🟡 Em Pesquisa | Parte → [`scope-definition/07`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md) (eventos) |
| **[`discovery/06_DISCOVERY_AI_ART_PIPELINE.md`](./discovery/06_DISCOVERY_AI_ART_PIPELINE.md)** | IA conversion + animação (PixelLab, modelos) | 🟡 Em Pesquisa | Pendente síntese |
| **[`discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md`](./discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md)** | `AssetLoader` + fallback procedural pra assets externos | ✅ Concluído | Usado por Specs 08, 32 (Sprite Production) |

---

## ⛔ Rejected / Obsolete (Rejeitadas para Prevenir Regressões)

| Documento | Motivo da Rejeição / Arquivamento | Diretriz Substituta |
|---|---|---|
| **[`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`](./rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md)** | Proposta de compor armas/armaduras desenhando camadas procedurais no HTML5 Canvas sobre `'spr_bloodmage'`. Viola a **Regra 6b do AGENTS.md** e corromperia a arte física final de 8 direções do PixelLab. | Customizações cosméticas devem ser feitas exclusivamente via Palette Swaps em tempo de build/shader ou spritesheets modulares do PixelLab. |
