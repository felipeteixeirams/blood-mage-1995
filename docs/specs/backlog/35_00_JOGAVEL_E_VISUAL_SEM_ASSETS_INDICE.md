---
agent_context: all
target_module: src/game/systems, src/game/objects, src/utils/textureGenerator.ts, src/game/assets, tests/e2e, .claude/skills
priority: high
criticality: high
status: backlog
last_updated: 2026-10-07
tags: [specs, indice-mestre, visual, light2d, postfx, e2e, ears, regressao, phaser4]
---

# Spec 35 — Índice Mestre: Jogável e Visualmente Excelente Sem Assets Novos

## 1. Contexto

Pergunta do Felipe (2026-10-07): *"O que podemos fazer para tornar nosso jogo
jogável e visualmente excelente sem precisar integrar assets ainda, usando só o
Phaser 4?"*

A resposta curta da auditoria é: **o projeto já tem o arsenal visual — ele só
não está ligado em produção.** As specs 23.01 (PostFX), 23.02 (normal maps),
23.03 (Light2D), 10 (fase 3.1) e 17 (calibração) estão em `delivered/` como
100% concluídas, mas a execução real mostra que a iluminação dinâmica e o
pós-processamento GPU **nunca rodam em WebGL de verdade**. Os testes unitários
passam porque os mocks injetam uma propriedade que o Phaser 4.2.1 não possui.

Esta spec registra os achados (com evidência) e quebra o trabalho em satélites
executáveis, cada um com requisitos em **EARS**.

### 1.1 Como os achados foram obtidos

| Tipo de evidência | O que foi feito |
|---|---|
| **Execução real** | Sonda Playwright temporária (fora do repo) contra `pnpm run dev`, Chromium `/opt/pw-browsers/chromium-1194` com WebGL via SwiftShader, modos Arcade e Campanha, leitura de `window.gameScene` após 4–5 s de jogo + screenshots |
| **Leitura do engine** | `node_modules/phaser` **4.2.1** instalado via `pnpm install --frozen-lockfile`: `WebGLRenderer.js`, `components/Lighting.js`, `lights/LightsManager.js`, `core/Config.js`, `loader/filetypes/SpriteSheetFile.js` |
| **Leitura estática** | `src/game/systems/*`, `src/game/objects/*`, `src/utils/textureGenerator.ts`, `src/game/assets/*`, `tests/e2e/*`, specs `delivered/` |

> ⚠️ FPS medido na sonda (≈21) **não é representativo**: SwiftShader é GPU em
> software. Nenhuma afirmação de performance desta spec se baseia nele.

## 2. Objetivo

Religar e corrigir os sistemas visuais procedurais já entregues, proteger a
jogabilidade com um gate E2E real e só então calibrar a direção de arte —
tudo sem nenhum asset externo novo.

## 3. Achados Registrados

| # | Achado | Evidência | Severidade | Satélite |
|---|---|---|---|---|
| A1 | `renderer.isWebGL` **não existe** no `WebGLRenderer` do Phaser 4.2.1 → 6 checagens em 5 arquivos retornam `false` em WebGL real: `LightingSystem.ts:79` (e `:122`), `PostFXSystem.ts:56`, `AtmosphericTreeShader.ts:236`, `Enemy.ts:160`, `SafeHouseAnimationController.ts:189` | Execução: `renderer.type=2` (WEBGL), `renderer.isWebGL=undefined`, `postFX.isWebGL=false`, `lightingSystem.enabled=false`, `cameras.main.filters.external` com **0** filtros | 🔴 Crítica | 35.01 |
| A2 | `LightingSystem.applyLightPipeline()` chama `setPipeline('Light2D')` — API do Phaser 3, **inexistente** no 4.2.1 (`grep setPipeline node_modules/phaser/src` = 0). No-op silencioso em ~30 call sites | Execução: `typeof obj.setPipeline === 'undefined'` em 100% dos objetos; só **18 de ~7.750** objetos com `lighting=true` (os inimigos, via `Enemy.ts:120`) | 🔴 Crítica | 35.01 |
| A3 | Os testes unitários mascaram A1/A2: 5 arquivos (`LightingSystem`, `PostFXSystem`, `AtmosphericTreeShader`, `Enemy`, `ProceduralForestGenerator`) mockam `isWebGL: true` (36 ocorrências) | Leitura estática | 🔴 Crítica (processo) | 35.01 |
| A4 | As skills do projeto **ensinam** a checagem errada: `phaser-4-fx-filters/SKILL.md` (3 snippets, §3–§4) e `phaser-4-development/SKILL.md` (1 snippet). Aviso de correção adicionado no topo de ambas em 2026-10-07; a troca dos snippets fica para a 35.01 | Leitura estática | 🟠 Alta (propaga o bug) | 35.01 |
| A5 | `lightingSystem.addLightSource()` é chamado pela lareira da Safe House (`SafeHouseAnimationController.ts:147-149`) mas **não existe** em `LightingSystem` → luz da lareira nunca é criada | `grep addLightSource src` = só o call site | 🟠 Alta | 35.01 |
| A6 | Player sem normal map nos **dois** caminhos: PNG `spr_bloodmage` carregado com `scene.load.spritesheet` sem `normalMap` (`assetManifest.ts:104-107`) e fallback procedural via `addSpriteSheet` sem `dataSource` (`textureGenerator.ts:35-46`). Contradiz `delivered/23_02` ("aplicado a `spr_bloodmage`") | Execução: `player.texture.dataSource` vazio, `player.lighting=false` | 🟠 Alta | 35.03 |
| A7 | Campo `normalMapPath` existe no tipo `BaseAssetConfig` (`assetManifest.ts:24`) mas `queueAssetLoading` nunca o lê | Leitura estática | 🟡 Média | 35.03 |
| A8 | Não há gate E2E que entre na **Campanha**: `gameplay.spec.ts` só verifica que existe um `<canvas>` (passaria com o crash de `3a52786`); `safe-house-animations.spec.ts` usa `?biome=` (DEV-only). Não existe `.github/workflows/` — nenhum E2E roda automaticamente | Leitura estática | 🔴 Crítica (jogabilidade) | 35.02 |
| A9 | Contaminação entre biomas: na Campanha (Safe House) aparecem linhas verdes em zigue-zague sobre o piso de madeira; há **1.350** sprites `forest_grass` na cena. No Arcade aparecem piso `tile_wood_floor_*` (Safe House) e `forest_grass` misturados à masmorra | Execução: `forest_grass` em x∈[192, 2528] sob o piso da Safe House x∈[0, 1896]. Código: `DungeonFlowController.loadChunkBiome` calcula `offsetX` e não o repassa; `DungeonGenerator.generate` ignora `_offsetX/_offsetY`; `updateChunkStream` roda em qualquer `gameMode` (`GameScene.ts:1644`) | 🟠 Alta (visual + risco de `unloadChunkBiome` destruir piso alheio) | 35.04 |
| A10 | ~7.750 objetos na display list no Arcade (4.547 na Campanha), quase todos tiles individuais | Execução | 🟡 Risco de performance — **não validado em hardware real** | 35.05 |
| A11 | `maxLights` padrão = **10** por câmera (`Config.js:481`); `PhaserGame.tsx` não define `render.maxLights`; há ~60 sprites `light_torch` em cena | Leitura do engine + execução | 🟡 Média (vira relevante ao religar A1/A2) | 35.01 / 35.05 |
| A12 | `PostFXSystem.createFilters()` registraria **3** filtros externos de câmera (vignette, colorMatrix, displacement) — acima do teto de 2 da skill `phaser-4-fx-filters` §5. Hoje inerte por A1; passa a custar ao religar | `PostFXSystem.ts:62-80` | 🟡 Média | 35.05 (K2) |
| A13 | Quatro specs em `delivered/` afirmam comportamento que o runtime não tem: 23.01 (PostFX ativo em WebGL), 23.02 (normal map no `spr_bloodmage`), 23.03 (Light2D ativo), 25 fase B.2 (offset por chunk). Mesmo padrão "teste verde ≠ feature viva" já registrado em `08_JULES_SESSION_PROMPT.md` | A1, A6, A9 | 🟠 Alta (confiança na documentação) | changelog das specs afetadas (feito nesta data) |
| A14 | Nenhum gate de teste roda automaticamente: `.husky/pre-commit` só roda `verify` (assets + typecheck + build, **sem testes**); `lint-staged`/`vitest related` configurado e nunca chamado; não há CI. `pnpm test` hoje: 574/574 em ~32 s | Leitura + execução | 🟠 Alta (processo) | 35.06 |
| A15 | Só 23.x, 25, parte da 10 e a 13 foram verificadas em runtime nesta auditoria; ~25 specs em `delivered/` nunca tiveram verificação de execução registrada. `LightingPolish` (glows de feitiço/portal/boss) depende de `lights.active` e também está inerte | Leitura + execução | 🟡 Média (risco de divergências ocultas) | 35.07 (discovery) |
| A16 | Documentação de gates contradiz a realidade: ~~`CLAUDE.md` diz que `pnpm verify` roda testes~~ (**corrigido em 2026-10-07** na separação `CLAUDE.md`/`docs/AGENTS.md`; o `AGENTS.md` da raiz também); `03_TESTING_GATES.md` gate 4 ("sem chunks > 500 kB") é violado pelo build atual (`phaser-*.js` 1.387 kB) | Leitura + `pnpm run build` | 🟡 Média | 35.06 |

### 3.1 O que os achados NÃO dizem

- Não dizem que a arte procedural é ruim: silhuetas, partículas, sombras e
  gibs (specs 10, 20, 24.02) **estão** renderizando (screenshots).
- Não dizem que o jogo está quebrado: Arcade e Campanha carregam, o player é
  visível e responde (execução). Erros de console: apenas 404s de spritesheets
  de inimigos marcados `required: false` (fallback esperado).

## 4. Matriz de Redundância (verificada em 2026-10-07)

| Tema | Spec existente | Relação com a 35 |
|---|---|---|
| Filtros GPU / Light2D / normal maps | `discovery/01` Eixo A; `delivered/23_01`, `23_02`, `23_03`, `23_EIXO_A` | **Correção**, não duplicata: as entregues declaram 100% mas estão inertes em runtime (A1–A6). A 35.01/35.03 cumpre os critérios de aceite que `discovery/01` §A.3 listou e nunca foram verificados em execução |
| Calibração de efeitos | `delivered/17` | A 17 calibrou valores **com o pipeline desligado** — calibração precisa ser refeita depois da religação (35.05) |
| Silhuetas procedurais de inimigos | `delivered/10` | Sem sobreposição — já resolvido; a 35 não redesenha inimigos |
| Animação procedural / gibs | `delivered/24_02` | Sem sobreposição |
| Sprites físicos / pipeline de assets | `backlog/08`, `backlog/32`, `discovery/07` | Fora do escopo por definição ("sem assets") |
| Chunk streaming | `delivered/25` | **Correção**: a fase B.2 da 25 declara suporte a `offsetX/offsetY`, mas o parâmetro é descartado (A9). 35.04 liga o offset; não altera o design de mundo contínuo |
| Playtest harness | skill `phaser-4-playtest-harness` | 35.02 aplica a skill (que já descreve o smoke test) ao caminho Campanha |

## 5. Satélites e Ordem de Execução

| Ordem | Satélite | Pasta | P | C | Depende de |
|---|---|---|---|---|---|
| 1 | [35.02 — Gate E2E de Jogabilidade (Arcade + Campanha)](./35_02_GATE_E2E_JOGABILIDADE_ARCADE_CAMPANHA.md) | backlog | high | medium | — |
| 2 | [35.01 — Detecção WebGL e Iluminação Phaser 4 Real](./35_01_DETECCAO_WEBGL_E_LIGHT2D_PHASER4.md) | backlog | high | high | 35.02 (gate de regressão) |
| 3 | [35.03 — Normal Map e Iluminação do Jogador](./35_03_NORMAL_MAP_E_LUZ_DO_JOGADOR.md) | backlog | high | high | 35.01 |
| 4 | [35.04 — Contaminação de Biomas no Chunk Streaming](./35_04_CONTAMINACAO_BIOMAS_CHUNK_STREAMING.md) | backlog | high | high | 35.02 |
| 5 | [35.05 — Calibração Visual Pós-Religação e Orçamento de Render](../scope-definition/35_05_CALIBRACAO_VISUAL_POS_RELIGACAO.md) | scope-definition | high | medium | 35.01, 35.03, 35.04 |
| paralelo | [35.06 — Gates Automatizados e Gate de Entrega](../scope-definition/35_06_GATES_AUTOMATIZADOS_E_ENTREGA.md) | scope-definition | high | medium | decisões do Felipe; R35.06-02 depende de 35.02 |
| paralelo | [35.07 — Auditoria de Runtime das Specs Entregues](../discovery/35_07_AUDITORIA_RUNTIME_SPECS_ENTREGUES.md) | discovery | medium | low | prioridade 1 só depois de 35.01 |

**Por que 35.02 vem antes de 35.01:** religar Light2D + PostFX muda o
render de **toda** cena. Sem um gate que entre em Arcade e Campanha, uma
regressão (tela preta, crash de renderer como em `3a52786`) passa por
`pnpm test` verde — exatamente o padrão que A3 documenta.

### 5.1 Pendências que não viram spec (registradas aqui para não se perderem)

Pela Seção 6 de `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` ("o que NÃO é uma spec"), estes itens não ganham satélite próprio:

| Pendência | Por que não é spec | Ação | Dono |
|---|---|---|---|
| `docs/specs/25_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md` solto na raiz, quase idêntico a `delivered/28_*` (ambos `status: completed`; o `diff` acusa diferenças) | Documento duplicado | Mesclar o que houver de novo em `delivered/28` e apagar o da raiz | Aguarda OK do Felipe |
| Streaming de mundo contínuo **no Arcade** como feature | Não há pedido; o default de 35.04 é desligar | Se desejado, abrir spec própria com sequência de chunks do Arcade | Felipe decide |
| Sonda Playwright da auditoria (`probe*.spec.ts`) | Ficou no scratchpad da sessão, fora do repo | Será reescrita como `smoke-playable.spec.ts` (35.02) | 35.02 |

### 5.2 Decisões do Felipe em aberto (consolidado)

| # | Decisão | Spec | Default se não houver resposta |
|---|---|---|---|
| D1 | Rodar E2E em CI ou só local | 35.02, 35.06 | Só local |
| D2 | Hook com suíte completa ou só testes afetados | 35.06 | Só afetados (`vitest related`) |
| D3 | Gate 4 de chunks: exceção para o Phaser? | 35.06 | Exceção documentada |
| D4 | Streaming de chunks no Arcade | 35.04 | Desligado |
| D5 | `maxLights` | 35.01 | 16 |
| D6 | Aparelho-alvo mobile e metas de FPS/p95 | 35.05 | — (bloqueia 35.05) |
| D7 | Leitura por bioma (`safe_house`, `gloomy_woods`) | 35.05 | — (bloqueia 35.05) |
| D8 | Luz do jogador: centro ou topo do cajado | 35.03, 35.05 | Centro |
| D9 | Apagar o `25_*` duplicado da raiz | 5.1 | Não apagar |
| D10 | ✅ **Decidido 2026-10-10:** seção "Git remoto" do `AGENTS.md` da raiz é contorno do Google AI Studio; mantida só para ele, ignorada pelos demais | ADR 2026-10-07 | — |
| D11 | ✅ **Decidido 2026-10-10:** skills unificadas em `.claude/skills/` | ADR 2026-10-07 | — |

## 6. Convenção EARS usada nos satélites

EARS (*Easy Approach to Requirements Syntax*, Mavin et al., Rolls-Royce,
RE'09). Cada requisito tem **um** gatilho/estado, **um** sistema e **uma**
resposta verificável. Palavras-chave em português, com o termo original:

| Padrão | Template | Uso |
|---|---|---|
| Ubíquo | O `<sistema>` **DEVE** `<resposta>`. | Sempre verdadeiro |
| Por evento (*When*) | **QUANDO** `<gatilho>`, o `<sistema>` **DEVE** `<resposta>`. | Reação a um evento |
| Por estado (*While*) | **ENQUANTO** `<estado>`, o `<sistema>` **DEVE** `<resposta>`. | Vale durante um estado |
| Comportamento indesejado (*If/Then*) | **SE** `<condição indesejada>`, **ENTÃO** o `<sistema>` **DEVE** `<resposta>`. | Falhas, fallbacks |
| Opcional (*Where*) | **ONDE** `<feature/config presente>`, o `<sistema>` **DEVE** `<resposta>`. | Depende de configuração |
| Complexo | **ENQUANTO** … **QUANDO** … o `<sistema>` **DEVE** … | Combinação |

Regras de escrita: IDs estáveis `R35.xx-nn`; cada requisito aponta o teste
que o verifica (coluna "Verificação"); nada de "deve ficar bonito" —
requisitos estéticos só entram quando houver métrica ou decisão do Felipe.

## 7. Testes e Critério de Aceite (do Índice)

A spec 35 é concluída quando os satélites 35.01–35.03 estão em `delivered/`
com seus testes passando, 35.04 entregue, 35.05 e 35.06 promovidas a `backlog/`
(decisões D1–D9 tomadas) ou fechadas com justificativa. A discovery 35.07 não
bloqueia o encerramento — ela alimenta specs novas.

## 8. Guardrails

- Nenhum asset binário novo (`public/assets/**`) — escopo é 100% procedural/código.
- `Player.ts`, `Enemy.ts`, `GameScene.ts` são arquivos críticos
  (`docs/critical/01_CRITICAL_FILES.md`); cada satélite que os toca declara isso.
- Fallback Canvas (`darknessOverlay` / `ScreenEffects`) continua obrigatório.

## 9. Referências

- [[delivered/23_EIXO_A_GRAFICOS_AVANCADOS]], [[delivered/23_01_POSTFX_GPU_SHADERS]], [[delivered/23_02_PROCEDURAL_NORMAL_MAPS]], [[delivered/23_03_LIGHT2D_DYNAMIC_LIGHTING]]
- [[delivered/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO]], [[delivered/17_POLIMENTO_GRAFICO_CALIBRACAO_SISTEMAS_EXISTENTES]], [[delivered/25_MUNDO_CONTINUO_CHUNK_STREAMING]]
- [[discovery/01_EVOLUCAO_GRAFICA_AVANCADA]]
- `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` itens 15, 20

## Registro de Mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-10-07 | Criação: auditoria com execução real (sonda Playwright) + leitura do Phaser 4.2.1; 11 achados, matriz de redundância, 5 satélites em EARS. 35.04 promovida a `backlog/` no mesmo dia após sonda de bounds confirmar a causa-raiz | Claude |
| 2026-10-07 | Documentado o que não foi feito: achados A14–A16, satélites 35.06 (gates/CI) e 35.07 (auditoria de runtime), pendências fora de spec e decisões D1–D9 consolidadas | Claude |
