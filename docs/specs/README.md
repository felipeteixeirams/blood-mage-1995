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

## 📖 Definições de Status Estendidos

Quando uma spec está em `backlog/` ou `in-progress/`, pode ter **status adicional** que clarifica seu estado além da pasta. Abaixo, os statuses encontrados e suas definições formais:

| Status | Símbolo | Significado | Exemplos | Ação Quando Encontrar |
|--------|---------|------------|----------|----------------------|
| **Skeleton Ready** | 📐 | Escopo 100% técnico definido; partes da arquitetura/dados já codificadas; falta implementação visual/refinamento sem dependências externas | Spec 12 (Contratos têm modelos em `src/data/`, falta Modal React) | Executável agora — é um refinamento, não redesign |
| **Partially Superseded** | 🔄 | Intenção original resolvida por outro spec entregue; residual ainda viável se escopo > 20% do original | Spec 18 (conectividade via Spec 25, falta variedade interna de gloomy_woods) | Avaliar com Felipe: fechar como "resolvido" ou criar novo spec pra residual |
| **Awaiting Definition** | ⏳ | Escopo técnico 100% definido; bloqueado por decision de conceito/produto que muda o código (lib choice, feature priority, scope) | Spec 05 (i18n — qual lib? quais strings?) | Nada executável até decisão; aparece em "🎯 Fila de Definição", não em Prioridade |
| *(No additional status)* | — | Backlog padrão ou in-progress com fases bem definidas | Specs 11, 30, 31 | Pronto pra execução direto |

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
| **[06](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md) Prestige UI**<br>🔒 **[08](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) Sprite Mapping**<br>**[09](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) HUD Tier B**<br>🔒 **[32](./backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md) PixelLab Guide**<br>**[11](./backlog/11_ATMOSFERA_E_TENSAO.md) Atmosfera**<br>**[12](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md) Progressão**<br>**[15](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md) Gore Toggle**<br>🔒 **[29](./backlog/29_CLOUD_SAVE_FASE5.md) Cloud Save**<br>**[31](./backlog/31_NORMAL_MAP_TILE_DOOR.md) Normal Map** | **[30](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md) Poisson Determinism**<br>*(Jules, 2026-09-08)* | **[03](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md) Survival Status**<br>*(Code ✅, QA pending)*<br><br>**[09-A](./delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md) HUD Tier A**<br>*(Code ✅, QA manual pending)*<br><br>**[25](./delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING.md) Chunk Streaming**<br>*(Code ✅, live verification pending)* | **[17](./delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES.md)** — Graphic Polish<br>**[28](./delivered/28_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md)** — Modal UI + Gamepad<br>**[18](./delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md)** — Prestige System<br>**[10](./delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md)** — Procedural Visuals |

> 🔒 = bloqueada por insumo externo (ver seção "🚧 Bloqueados" abaixo) — ainda aparece na coluna Backlog porque o escopo já está pronto, só não tem próximo passo executável agora.
>
> **Formato Padronizado (2026-09-13):**
> - Todas as colunas: **[#](link) Nome** (número + link + nome legível)
> - Notas contextuais em itálico (status de QA, quem está fazendo, etc.)
> - Bloqueadas: 🔒 prefix; Concluído: links pra todos (antes era só números)
> - Melhora 50%+ de legibilidade: sabe-se exatamente o que cada spec faz ao ver o Kanban

---

## 🎯 Fila de Prioridade — "Pega a Próxima"

> Tabela única (`in-progress/` + `backlog/`), ordenada por **prioridade** (produto) e,
> dentro do mesmo nível, por **criticidade** (risco técnico/regressão — ver definição
> na Seção 6 do doc de metodologia linkado acima). Pedir **"pega a próxima"** resolve
> para a **linha 1** que tiver Status = ✅ "Executável Agora". Item concluído sai desta fila e vira uma linha em "🟢 Delivered" abaixo.
>
> **Nota importante:** Coluna "Status/Bloqueador" separa "prioridade intrínseca" (P/C) de "executabilidade atual":
> - ✅ **Executável Agora** = nenhum bloqueador; pega a próxima e trabalha
> - ⏳ **Aguardando Definition** = concept decision de Felipe needed; nada pra fazer agora (spec em "Fila de Definição")
> - 👤 **Atribuído** = alguém já pegou e está fazendo
> - 🚧 **Bloqueado** = spec bem definida, mas bloqueado por arte/comercial (ver "🚧 Bloqueados" abaixo)
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

| # | Spec | Pasta | P | C | Status / Bloqueador | Resumo de Execução |
|---|---|---|---|---|---|---|
| 1 | [`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md) | backlog | 🟡 | 🟢 | 👤 **Atribuído**: Jules (desde 2026-09-08) | Determinismo por seed no Poisson Disk — `Math.random()` → hashLattice PRNG. In-flight. |
| 2 | [`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md) | backlog | 🟡 | 🟡 | ✅ **Executável Agora** | Atmosfera, Tensão, Indicadores de Ameaça (áudio espacial, iluminação dinâmica, sinais visuais fora de tela). Sem dependências. |
| 3 | [`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md) | backlog | 🟡 | 🟡 | ✅ **Executável Agora** (📐 Skeleton Ready) | Progressão, Contratos, Evolução de Habilidades. Modelos de dados prontos (`src/data/`); falta UI React Modal. ~40h estimado. |
| 4 | [`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md) | backlog | 🟡 | 🟡 | ✅ **Executável Agora** | Toggle de Intensidade de Conteúdo (gore visual configurável). Sem dependências externas. |
| 5 | [`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`](./backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md) | backlog | 🟡 | 🟢 | ✅ **Executável Agora** | Prestige System (Blood Seal). ~90% entregue em `delivered/18`; falta só Modal React (gatilho: NPC Ancião). ~8h estimado. |
| 6 | [`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md) | backlog | 🟢 | 🟢 | ✅ **Executável Agora** | HUD Tier B.6 residual — menu contextual de mouse (desktop). Tier A entregue em `delivered/09`. ~4h estimado. |
| 7 | [`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./backlog/31_NORMAL_MAP_TILE_DOOR.md) | backlog | 🟢 | 🟢 | ✅ **Executável Agora** (Jules-ready) | Normal map ausente na textura `tile_door`. Simples, sem dependências. ~1-2h estimado. |

**Legenda:** P = Prioridade | C = Criticidade | Specs em "⏳ Awaiting Definition" não aparecem aqui (ver "🎯 Fila de Definição" abaixo)

#### 🔗 Tiebreaker para Specs com Prioridade/Criticidade Idênticas

Quando duas ou mais specs têm (P, C) iguais, aplicar critério de desempate **nesta ordem:**

| Critério | Rationale | Exemplo |
|----------|-----------|---------|
| **1. Dependência** | Specs que desbloqueiam outras specs sobem | Se Spec 11 depende de Spec X estar pronto, e X não está — Spec 11 pode descer |
| **2. Escopo (Quick Wins)** | Specs menores (~4-8h) antes de maiores (~40-60h) | Specs 31, 09 (🟢 low ambos) vêm antes de 12 (~40h) se P/C fossem iguais |
| **3. Risco Arquitetural** | Specs que validam padrões críticos > refinamentos | Atmosfera (11) antes de UI residual (09) porque validação de som/luz afeta toda a jogabilidade |
| **4. Data de Entrada** | FIFO — evita starvation de specs antigas | Se nada acima desempata, a spec mais antiga na fila sobe |

**Aplicado agora (2026-09-13):**
- **Specs 11, 12, 15** (todas 🟡 medium, 🟡 medium): Ordem 11 > 12 > 15
  - 11 (Atmosfera) = validação crítica de audio/visual (risco arquitetural #3) → linha 2
  - 12 (Progressão) = maior escopo (~40h) mas sem dependência bloqueante → linha 3
  - 15 (Gore Toggle) = quick win (~12h) e menor impacto → linha 4

> **Como Ler a Coluna Status/Bloqueador:**
> - ✅ **Executável Agora**: sem bloqueadores; próxima pessoa que pega trabalha direto
> - 👤 **Atribuído**: já tem alguém fazendo; skip pra linha abaixo
> - ⏳ **Awaiting Definition**: decisão conceitual de Felipe pendente; spec em "Fila de Definição", não aqui
> - 🚧 **Bloqueado**: escopo pronto, mas bloqueado por arte/comercial; skip até desbloqueador chegar
>
> *Nota (2026-09-13):* Tabela reorganizada com coluna "Status/Bloqueador" pra separar "prioridade intrínseca" de "posso fazer agora?". 
> - Spec 05 removida (⏳ Awaiting Definition → ver "Fila de Definição")
> - Specs 08, 29, 32 bloqueadas por arte/comercial → não entram aqui (ver "🚧 Bloqueados")
>
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

### 🎯 Fila de Definição (Conceito & Regras de Gameplay — Workflow Paralelo)

> Introduzido em 2026-09-08 (alinhamento de prioridades, workflow paralelo). Diferente de "🚧 Bloqueados": aqui o bloqueio NÃO é externo (arte/confirmação comercial) — é que a spec precisa de **definição de conceito/regras de gameplay** antes de entrar em desenvolvimento.
>
> **Workflow paralelo:** Enquanto Felix/Product clarifica conceito aqui → move para `backlog/` → Claude/Jules executa em paralelo. Nenhum agente IA implementa a partir destes como estão. Quando a definição termina, a spec automáticamente sobe na Fila de Prioridade de Desenvolvimento.

| Spec | Pasta | O que Felipe precisa clarificar | Próximo passo |
|---|---|---|---|
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** — i18n | in-progress | Qual biblioteca i18n? (`react-i18next`, `next-i18next`, ou outra?) + Quais strings na Fase 1 (campanha vs HUD vs NPCs)? | Quando definido → extrai `backlog/05_I18N_LOCALIZACAO.md` como spec satélite separada; spec 05 core volta pro topo de Fila de Prioridade |
| **[`scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | scope-definition | Qual evento implementar PRIMEIRO? (Eclipse de Sangue / Cerco ao Vilarejo / Rifts / Solstício?) + Escopo: 1 evento por satélite ou agregar? | Quando decidido → divide em Índice Mestre + satélites, move 1º evento para `backlog/` |
| **[`scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | scope-definition | Variedade interna de `gloomy_woods` é desejo ou escopo? (Spec 25 já resolveu conectividade, só falta diversidade de biomas?) | Quando clarificado → vira Blueprint técnico próprio ou fecha como "🔄 Partially Superseded (por #25)" |

### 🚧 Bloqueados por Insumo Externo (Arte / Comercial — Não-Conceitual)

> Triagem de 2026-09-07 (atualizada em 2026-09-08 — spec 25 entregue por completo; 2026-09-13 — agrupamento por bloqueador). **Diferente de "🎯 Fila de Definição":** estas specs **já têm escopo técnico 100% definido** — o bloqueio é por insumo externo FORA do escopo técnico/conceitual (orçamento de arte, confirmação de produto de negócio). Nada aqui tem próximo passo executável por agente IA até o insumo chegar.

#### 🎨 **Grupo 1: Produção de Sprites (PixelLab / Arte Terceirizada)**

**Status Bloqueador:** Aguardando aprovação de orçamento + direção de arte

| Spec | Pasta | Contexto | Escopo |
|---|---|---|---|
| [`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md) | backlog | Fase 0 (arquitetura) concluída; Fases 1+ exigem sprites físicos dos personagens que ainda não existem | Rastreamento de integração de assets PixelLab + checklist de cobertura de 8-direções/animações |
| [`backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md`](./backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md) | backlog | Guia operacional de prompts para geração de sprites; máximo valor quando produção PixelLab estiver ativa | Framework de prompts, estilos, paletas e casos de refinamento |

**Desbloqueador:** Orçamento de arte aprovado + cronograma de produção PixelLab iniciado

**Ação ao Desbloquear:** Ambas specs sobem juntas para Fila de Prioridade (coordenar execução: 08 depende de assets que 32 ajuda a gerar).

---

#### 💳 **Grupo 2: Confirmação Comercial (Cloud Save / Integração de Conta)**

| Spec | Pasta | Contexto | Escopo |
|---|---|---|---|
| [`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md) | backlog | Extraído de `in-progress/05` em 2026-09-13; mandato do projeto: nenhuma integração de conta/nuvem sem aprovação prévia do Felix | Firebase/Firestore automatizado + sincronização cross-device |

**Desbloqueador:** Felipe confirmar explicitamente demanda comercial (Beta ou release?) + avaliação de segurança/LGPD

**Ação ao Desbloquear:** Move para Fila de Prioridade com estimativa técnica re-validada.

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

> Triagem de 2026-09-07 (atualizada 2026-09-08): Specs com bloqueio ativo foram movidas:
> - `08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST`, `09_PIXEL_LAB_PROMPT_GUIDE` → "🚧 Bloqueados" (aguardando arte)
> - `05_FASE5`: item Cloud Save extraído para `backlog/29_CLOUD_SAVE_FASE5.md` ("🚧 Bloqueados"); spec 05 agora tem escopo restrito a i18n → movida para "🎯 Fila de Definição" (Felipe clarifica qual lib i18n)
> - `18_ARPG_CONTINUOUS_WORLD_TOPOLOGY` → `scope-definition/` (residual não é mais executável como está)
>
> **Atualização 2026-09-08:** `25_MUNDO_CONTINUO_CHUNK_STREAMING` entregue (PR #97 Jules, Fase C) → moved to `delivered/25`.

| Spec / Documento | Fases / Escopo Concluído | Fases / Itens Pendentes |
|---|---|---|
| **[`in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md`](./in-progress/05_FASE5_POLIMENTO_PRODUCAO_PWA_STEAM.md)** | • PWA Offline-First (Spec 15)<br>• Scripts de build Electron (`scripts/build-steam.sh`) | • **🎯 Fila de Definição:** Localização multilíngue (i18n) — Felipe define lib + escopo |
| **[`in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md`](./in-progress/03_FASE3_STATUS_SOBREVIVENCIA.md)** | • Gameplay loop completo (Sangramento/Veneno/Infecção aplicados por monstro, dreno de HP, cura via consumível comprável no Alquimista)<br>• Cura via NPC Clérigo (PR #93)<br>• Ícones customizados SVG (PR #93) | • *(nenhum item de código — só QA manual, pronto p/ Felipe jogar)* |

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
| **[`backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`](./backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md)** | *(era in-progress)* Living Tracking Spec de integração de sprites físicos — Fase 0 concluída | high | medium | **Sim** — orçamento de arte (grupo com #32) |
| **[`backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md`](./backlog/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)** | Residual Tier B.6: menu contextual de mouse ao passar sobre alvo (desktop) — Tier A entregue em `delivered/09` | low | low | Não |
| **[`backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md`](./backlog/32_PIXEL_LAB_SPRITE_PRODUCTION_GUIDE.md)** | *(renumerado de 09-PL em 2026-09-13)* Guia de prompts PixelLab, usado durante produção de sprites | high | low | **Sim** — orçamento de arte (grupo com #08) |
| **[`backlog/11_ATMOSFERA_E_TENSAO.md`](./backlog/11_ATMOSFERA_E_TENSAO.md)** | Atmosfera, Tensão e Indicadores de Ameaça (Indicadores fora de tela, áudio espacial e iluminação) | medium | medium | Não |
| **[`backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md`](./backlog/12_PROGRESSAO_E_QUESTS_CONTRATOS.md)** | Progressão, Micro-Quests e Evolução de Habilidades (Contratos, Modificadores e Talentos) | medium | medium | Não |
| **[`backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`](./backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md)** | Toggle de Intensidade de Conteúdo — mitigação de classificação indicativa (gore visual configurável) | medium | medium | Não |
| **[`backlog/30_DETERMINISMO_SEED_POISSON_DISK.md`](./backlog/30_DETERMINISMO_SEED_POISSON_DISK.md)** | Determinismo por seed no espalhamento de vegetação/props (Poisson Disk) — Jules-ready | medium | low | Não |
| **[`backlog/31_NORMAL_MAP_TILE_DOOR.md`](./backlog/31_NORMAL_MAP_TILE_DOOR.md)** | Normal map ausente na textura `tile_door` — Jules-ready | low | low | Não |
| **[`backlog/29_CLOUD_SAVE_FASE5.md`](./backlog/29_CLOUD_SAVE_FASE5.md)** | *(novo, extraído de `in-progress/05`)* Cloud Save automatizado (Firebase/Firestore) | medium | high | **Sim** — confirmação de Felipe pendente |

---

## 🟠 Escopo em Definição (Proposta Real, Ainda Não Pronta Para Implementação)

| Spec / Proposta | Domínio / Resumo | Prioridade | Criticidade | Status / Próximo Passo |
|---|---|---|---|---|
| **[`scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md)** | Eventos dinâmicos sazonais (Eclipse de Sangue, Cerco ao Vilarejo, Rifts de Infecção, Solstícios) | medium | medium | Aguardando decisão: qual evento implementar PRIMEIRO? Vira Índice Mestre + satélites, 1 evento por spec |
| **[`scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md`](./scope-definition/18_ARPG_CONTINUOUS_WORLD_TOPOLOGY.md)** | 🔄 **Partially Superseded (2026-09-08)**: Conectividade entre biomas resolvida por `delivered/25` (Chunk Streaming). Residual: variedade orgânica interna de `gloomy_woods` — é escopo ou refinamento desejado? | low | medium | Decisão do Felipe: fechar como "completo via #25" ou abrir novo Blueprint técnico pra variedade |

---

## 💡 Discovery (Pesquisas Exploratórias, Spikes & Avaliações Técnicas)

> **Escalação & Governance** (novo, 2026-09-13): Discovery items NÃO são "eternas" — cada um tem ciclo claro:
> 1. **Research (Ativo)**: alguém investigando agora? SIM = ativo | NÃO = pausado (mark com ⏸️)
> 2. **Synthesis**: redação de findings em novo spec (`scope-definition/` OU `backlog/`)
> 3. **Archive**: sem aplicação imediata ou suplantado por outra decisão → `rejected/` ou deletar
>
> Quando discovery conclui, criar linha em tabela abaixo com "Escalado para: spec X" + link.
> Original arquivo: mover para `discovery/_ARCHIVE_NN.md` ou deletar.

| Discovery | Hipótese de Pesquisa | Status | Escalação | Próximo Passo |
|-----------|-----|--------|-----------|---|
| **[`discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md`](./discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md)** | Phaser 4.2.1 PostFX GPU, Light2D, Procedural — supera assets externos? | ✅ Concluído (2026-08-31) | → [`delivered/23`](./delivered/23_EIXO_A_GRAFICOS_AVANCADOS.md) (spec tech implementada) | Arquivo pode mover pra `_ARCHIVE_01` |
| **[`discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md`](./discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md)** | UI/Som com assets externos góticos (Diablo/Dungeon Siege style) | 🟡 Em Pesquisa | Pendente síntese | Define roadmap quando concluir |
| **[`discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md`](./discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md)** | Co-op P2P leve via WebRTC (pós-campanha) | ⏸️ Pausado (fora de scope atual) | Sem escalação | Reativar quando campanha encerrar |
| **[`discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`](./discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md)** | Capacitor/TWA + monetização indie ética | 🟡 Em Pesquisa | Pendente síntese | Define roadmap comercial quando concluir |
| **[`discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md`](./discovery/05_DISCOVERY_CAMPAIGN_PROGRESSION_LORE.md)** | Progressão em atos, diálogos ramificados, lore | 🟡 Em Pesquisa | Parte → [`scope-definition/07`](./scope-definition/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md) (eventos) | Finalizar pesquisa; output = scope-definition spec |
| **[`discovery/06_DISCOVERY_AI_ART_PIPELINE.md`](./discovery/06_DISCOVERY_AI_ART_PIPELINE.md)** | IA conversion + animação (PixelLab, modelos) | 🟡 Em Pesquisa | Pendente síntese | Quando viável, move pra backlog |
| **[`discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md`](./discovery/07_EIXO_B_PIPELINE_ASSETS_EXTERNOS.md)** | `AssetLoader` + fallback procedural pra assets externos | ✅ Concluído (2026-09-08, movido de backlog/14) | → (em backlog, não tem spec-tech separada; suporta 08+32) | Usado por Specs 08, 32 (Sprite Production) |

---

## ⛔ Rejected / Obsolete (Rejeitadas para Prevenir Regressões)

| Documento | Motivo da Rejeição / Arquivamento | Diretriz Substituta |
|---|---|---|
| **[`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`](./rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md)** | Proposta de compor armas/armaduras desenhando camadas procedurais no HTML5 Canvas sobre `'spr_bloodmage'`. Viola a **Regra 6b do AGENTS.md** e corromperia a arte física final de 8 direções do PixelLab. | Customizações cosméticas devem ser feitas exclusivamente via Palette Swaps em tempo de build/shader ou spritesheets modulares do PixelLab. |
