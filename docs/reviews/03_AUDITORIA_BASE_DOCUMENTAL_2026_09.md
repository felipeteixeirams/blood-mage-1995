---
agent_context: [all]
target_module: docs/
priority: alta
status: active
last_updated: 2026-09-06
tags: [auditoria, documentacao, saude-documental, links-quebrados, adr]
---

# Auditoria da Base Documental — 2026-09-06

> **Escopo:** passada completa em `docs/` (~120 arquivos: `architecture/`,
> `critical/`, `specs/` inteiro, `product/`, `experiments/`, `reviews/`,
> `archive/`, `README.md`, `AGENTS.md`), cruzando cada afirmação factual
> contra o código real em `src/` (Grep/Read), `package.json` e o histórico
> git. Nenhum arquivo de código foi tocado — auditoria 100% read-only.
>
> **Por que isso importa:** vários dos achados abaixo são do tipo "se um
> agente (IA ou humano) seguir este documento literalmente, ele vai
> reimplementar algo que já existe, mexer no arquivo errado, ou assumir uma
> API que não existe mais". Achados 🔴 são exatamente esse risco.

## Sumário executivo — os 6 achados de maior risco

1. **`docs/README.md`** (ponto de entrada obrigatório para qualquer agente,
   por mandato do próprio `docs/AGENTS.md`) afirma que o jogo está em
   *"Fase 1 (Descoberta)"* e manda "nunca assumir Supabase/Google Auth como
   arquitetura passada" — o projeto já tem 24+ specs entregues (campanha de
   4 capítulos, prestígio, relíquias, conquistas, PWA) e o próprio
   `docs/product/ROADMAP.md` já marca a Fase 1 como **Concluída**, com foco
   atual na Fase 2. Um agente novo que confie nisso subestima gravemente a
   maturidade do projeto.
2. **`docs/specs/backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`** propõe
   implementar do zero (0% código, por definição da própria pasta
   `backlog/`) um sistema de Prestígio que **já existe ~90% pronto** em
   `docs/specs/delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md` e no código real
   (`gameStore.ts`: `canPrestige`, `performPrestige`,
   `allocateBloodSeal`, `getPrestigeModifiers`). Maior risco de retrabalho
   de toda a auditoria.
3. **`docs/critical/01_CRITICAL_FILES.md`** — o documento que existe
   especificamente para evitar regressão em código sensível — tem 4 erros
   factuais concretos: cita `baseMaxSpeed = 200` (não existe mais em
   `Player.ts`), atribui `hasLineOfSight()` a `Enemy.ts` (na verdade vive em
   `DungeonGenerator.ts`, exposto via `GameScene.hasLineOfSight()`), mostra
   `DungeonGenerator.generate(seed)` como método estático (é de instância,
   assinatura `generate(mapW, mapH, biome)`), e lista as cenas do
   `PhaserGame.tsx` incluindo `TitleScene`/`RecordsScene` que na verdade
   rodam em instâncias `Phaser.Game` **separadas** (contradizendo o próprio
   `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`, que descreve isso
   corretamente).
4. **`docs/architecture/SEAMLESS_OPEN_WORLD_FEASIBILITY.md`** é escrito
   inteiramente em termos de **Phaser 3** ("O Phaser 3 possui culling
   nativo...") — o motor real do projeto é Phaser 4.2.1 desde sempre nesta
   base de código. Risco real de assumir API errada.
5. **8 specs inteiras (Spec 23 "Gráficos Avançados" e Spec 24 "Evolução
   Gráfica/Áudio", com seus satélites)** existem em `delivered/`,
   confirmadas como genuinamente implementadas no código, mas **não estão
   no índice `docs/specs/README.md`** — e pior, o README ainda lista as
   versões **antigas e já concluídas** desses specs em `in-progress/` como
   se faltasse trabalho (`in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md` e
   `in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`, ambos
   autodeclarados 100% concluídos no próprio corpo do arquivo).
6. **Duas cópias obsoletas/órfãs** de specs já entregues continuam em
   `in-progress/`: `in-progress/11_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md` e
   `in-progress/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md` — a versão
   `in-progress/16` inclusive **contradiz** a versão `delivered/16`
   dizendo que a Fase 3 (ergonomia touch) ainda não foi feita, quando o
   código confirma que já foi.

---

## 1. `docs/README.md` — mandato de entrada desatualizado

🔴 **ALTA**

- Bloco de mandato (linha ~7): *"O jogo está na Fase 1 (Descoberta)... onde
  velocidade e experimentação de Game Feel superam integrações em nuvem"*
  — contradiz `docs/product/ROADMAP.md` (Fase 1 marcada `(Concluída)`,
  todos os 10 itens `[x]`, foco atual explicitamente Fase 2) e as 24 specs
  já `delivered/`.
- *"NUNCA ASSUMA arquiteturas passadas (como Supabase/Google Auth)"* — não
  é bem uma contradição de fato (confirmado: nenhuma dependência de
  Supabase/Firebase/auth em `package.json`, nenhum uso em `src/`), mas a
  redação sugere que essas integrações existiram e foram removidas, quando
  `docs/product/ACCOUNT_AND_DATA.md` deixa claro que são apenas uma
  possibilidade **futura condicional** (Fase 5, "se aplicável"). Redação
  ambígua que confunde "nunca existiu" com "existiu e foi removido".
- Índice de arquitetura do próprio README **não lista** 4 documentos ativos
  que já existem em `docs/architecture/` (`05_GAMESCENE_REFACTOR.md`,
  `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md`,
  `06_PHASER_REACT_BRIDGE_MIGRATION.md`, `SEAMLESS_OPEN_WORLD_FEASIBILITY.md`)
  nem os 4 documentos de `docs/critical/` além do `05` (`00`, `01`, `02`,
  `03`) — o "índice mestre" está bem incompleto no tópico mais crítico.

**Correção sugerida:** reescrever o mandato pra refletir "Fase 2 em
andamento, Fase 1 concluída, 24+ specs entregues — ver
`docs/specs/README.md`"; trocar "arquiteturas passadas" por "integrações
futuras condicionais (Fase 5) — ver `docs/product/ACCOUNT_AND_DATA.md`";
completar o índice de arquitetura/critical.

---

## 2. `docs/critical/` — erros factuais em código sensível

🔴 **ALTA** — `docs/critical/01_CRITICAL_FILES.md`:
- `baseMaxSpeed = 200` não existe mais em `Player.ts` — hoje é
  `baseMoveSpeed = 160` + `getEffectiveMoveSpeed()` somando talentos/relíquias
  (`ACCELERATION = 1400`/`DECELERATION = 1000` continuam corretos).
- `hasLineOfSight()` atribuído a `Enemy.ts` — na realidade `Enemy.ts` só
  tem `canSeePlayer(x, y, hasWallBetween)` (recebe booleano já calculado);
  o raycast real é `DungeonGenerator.hasLineOfSight()` (linha 609),
  exposto via wrapper fino em `GameScene.hasLineOfSight()`.
- `DungeonGenerator.generate(seed)` mostrado como estático — é de
  instância: `generate(mapW: number, mapH: number, biome: BiomeType)`.
- Exemplo de `scene: [BootScene, GameScene, TitleScene, RecordsScene]` em
  `PhaserGame.tsx` — o real é só `[BootScene, GameScene]`; as outras 3
  cenas rodam em instâncias `Phaser.Game` **separadas**, criadas por
  `MainMenu.tsx`/`SettingsModal.tsx`/`HighScoresModal.tsx` — e isso
  contradiz diretamente `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`
  item 3, que descreve a arquitetura multi-instância corretamente.

🟡 **MÉDIA** — `takeDamage()` mostrado com pseudocódigo simplificado que
não reflete o sistema real de 3-quedas/inconsciência já implementado
(`Player.ts:1174-1236`, `knockoutCount`/`isDefinitivelyDead`). O contrato de
retorno continua válido, mas o exemplo está desatualizado, e
`isUnconscious`/`knockoutCount` aparecem na seção "seguro alterar" como se
fosse roadmap futuro quando já está implementado.

🔴 **ALTA** — lista de "arquivos críticos" incompleta: `DungeonGenerator.ts`
(639 linhas, geração procedural + `hasLineOfSight` de 60x/s + `isTraversable`)
não está listado apesar de ser tão sensível quanto `GameScene.ts`.
🟡 **MÉDIA** — `src/utils/localStorage.ts` (886 linhas, toda a
validação Zod + persistência) também merece entrada própria dado o
histórico de incidentes de corrupção de dados já documentado em
`05_TROUBLESHOOTING_KNOWN_ISSUES.md` item 16.

🟡 **MÉDIA** — `docs/critical/00_ANTI_REGRESSION_GUIDE.md` e demais
arquivos de `critical/` (exceto `05`) têm `last_updated: 2026-08-09` —
quase um mês antes da migração Zustand (25/08), do refactor de
`GameScene.ts` (rastreado até 02/09) e do sistema de nocaute, sem nenhuma
nota de que estão desatualizados.

🟡 **MÉDIA** — `docs/critical/04_PERFORMANCE_METRICS.md`: metas (60 FPS,
&lt;150MB heap, &lt;45 draw calls) não são validadas automaticamente em
nenhum teste/script encontrado — parecem placeholder herdado de um
relatório não linkado.

**Links quebrados nesta pasta:**
- `01_CRITICAL_FILES.md` → `[[../context/GAME_DESIGNER.md]]` (real:
  `docs/archive/context/GAME_DESIGNER.md`)
- `05_TROUBLESHOOTING_KNOWN_ISSUES.md` → `[[docs/integration/00_LOVABLE_INTEGRATION.md]]`
  (real: `docs/archive/integration/00_LOVABLE_INTEGRATION.md`)

**Correção sugerida:** reescrever os exemplos de código citados acima
com as assinaturas/localizações reais; adicionar `DungeonGenerator.ts` como
Nível 1 e `localStorage.ts` como Nível 2 na lista de arquivos críticos;
corrigir os 2 links; atualizar `last_updated`.

---

## 3. `docs/architecture/` — versão de engine errada e organização

🔴 **ALTA** — `SEAMLESS_OPEN_WORLD_FEASIBILITY.md` é escrito inteiramente
em termos de **Phaser 3** ("Arquiteto... Phaser 3 + React", "O Phaser 3
precisaria instanciar...", "O Phaser 3 possui culling nativo..."),
contradizendo `01_TECH_STACK.md`/`package.json` (`phaser: ^4.2.1`) e até
as próprias tags do frontmatter do arquivo (`tags: [..., phaser3, ...]`).

🟡 **MÉDIA** — o roadmap deste mesmo arquivo propõe criar
`src/game/systems/ChunkManager.ts` (Fase 4.1) — o código real já tem
`ChunkStreamer.ts` + `WorldManager.ts` cumprindo esse papel, com nome
diferente. Falta uma nota de "status de implementação" cruzando o roadmap
com o que já existe, para não induzir a criação de um sistema duplicado.

🔴 **ALTA** — `docs/architecture/02_CODE_ORGANIZATION.md` linha 28: chama
`lib/` de "módulos compartilhados reutilizáveis entre frontend e backend"
— na prática é infraestrutura de scaffolding do monorepo nunca importada
por nenhum arquivo em `src/game` ou `src/components` (confirmado por
grep). Um dev procurando lógica de jogo compartilhada ali não encontra
nada.

🟡 **MÉDIA** — mesmo arquivo, linha 18: lista `TitleScene`/`SettingsScene`/
`RecordsScene` como parte do mesmo fluxo de cenas do jogo principal — mesma
questão de instâncias `Phaser.Game` separadas do item 2.

🟡 **MÉDIA** — numeração duplicada **intencional? não** — `05_GAMESCENE_REFACTOR.md`
e `05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` compartilham o número "05" na
mesma pasta tratando de assuntos sem relação nenhuma (um é tracker de
refactor, outro é metodologia de engenharia com IA) — parece erro de
numeração, não duplicação de conteúdo. Nenhum dos dois é referenciado em
`docs/README.md`/`docs/AGENTS.md`.

🔴 **ALTA** — link quebrado em `06_PHASER_REACT_BRIDGE_MIGRATION.md:233`
→ `[[../archive/specs/propostas/08_GUIA_EVOLUCAO_COMERCIAL.md]]` (pasta não
existe; real: `docs/specs/backlog/08_GUIA_EVOLUCAO_COMERCIAL.md`, citado
logo na introdução do documento como motivação, não é decorativo).

🔵 **BAIXA** — `05_GAMESCENE_REFACTOR.md` cita "1946 linhas" onde o real
hoje é 1955 (esperado, arquivo evolui continuamente). `06_PHASER_REACT_BRIDGE_MIGRATION.md`
cita números de linha de um snapshot pré-migração (25/08) que hoje
apontam pra código diferente — vale nota explícita de que são histórico.

**Documentos sem erro factual, confirmados corretos:** `00_OVERVIEW.md`,
`01_TECH_STACK.md` (todas as versões conferem com `package.json`),
`03_PHASER_PATTERNS.md` (padrão extract/delegate confirmado ponta a
ponta), `04_STATE_MANAGEMENT.md` (afirmação "100% Zustand desde 25/08,
zero CustomEvent de gameplay" **confirmada verdadeira** por grep
completo).

---

## 4. `docs/specs/` — o maior volume de achados

### 4.1 Índice (`docs/specs/README.md`) incompleto

🔴 **ALTA** — 8 arquivos de `delivered/` (Spec 23 "Gráficos Avançados" +
satélites `23_01/02/03`, Spec 24 "Evolução Gráfica/Áudio" + satélites
`24_01/02/03`) confirmados como genuinamente implementados no código, mas
ausentes do índice.

🔴 **ALTA** — `backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md` (o
duplicado perigoso do item 2 do sumário executivo) também está ausente do
índice — soma-se ao risco.

🟡 **MÉDIA** — `in-progress/SPECS_EVOLUCAO.md` órfão do índice (ver 4.4).

### 4.2 Specs "delivered" com problema de precisão

🔴 **ALTA** — `delivered/02_FASE2_TELA_DE_MORTE_E_GORE.md` cita 3 arquivos
que não existem sob esses nomes: `Corpse.ts` (real: `Scavengeable.ts`),
`GameOverScene.ts` (real: `GameOverModal.tsx`, é React, não mais uma
Phaser Scene), `GoreSystem.ts` (real: `DismembermentSystem.ts`). A
feature funciona; só os nomes documentados estão errados.

🔴 **ALTA** — `delivered/03_FASE3_STATUS_SOBREVIVENCIA.md` está na pasta
errada: front matter diz `status: ANDAMENTO`, `progress: 75%`, e o corpo
lista pendências reais (QA manual nunca feito, ícones-placeholder, cura via
NPC Clérigo não implementada). Existe uma **segunda spec concorrente**
cobrindo o mesmo tema, `delivered/03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md`,
dizendo 100%/CONCLUIDO — nunca reconciliadas.

🟡 **MÉDIA** — `delivered/18_PRESTIGE_SYSTEM_BLOOD_SEAL.md` — este (o
correto, ao contrário do duplicado em backlog/06) é honesto: autodeclara
"🟡 PARCIAL (Modal de Interface React em Backlog)". Confirmado: não existe
modal React de Prestígio. Não é "mentira", só precisa de um item de
backlog dedicado pra não se perder.

### 4.3 Specs "in-progress" na verdade concluídos (retrabalho fantasma)

🔴 **ALTA** — `in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md`: front matter
`status: CONCLUIDO`, `progress: 100%`, todos os critérios `[x]` — mas o
README ainda o lista como faltando "pipeline de pós-processamento e
iluminação de segunda geração", que já existe (`delivered/23` + satélites,
confirmados no código: `PostFXSystem.ts`, `LightingSystem.ts`, etc).

🔴 **ALTA** — `in-progress/10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`:
essencialmente 100% concluído (só resta uma decisão de design adiada —
"Aura de Inimigo", explicitamente adiada até integração de sprites
externos, não pendente por falta de trabalho). Duplicado por
`delivered/24` + satélites (confirmados: `ShadowSystem.ts`,
`StatusEffectSystem.ts`, `ReflectionSystem.ts`).

🔴 **ALTA** — `in-progress/11_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md` e
`in-progress/16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`: cópias obsoletas de
arquivos já `delivered/` sob o mesmo nome. A versão `in-progress/16`
contradiz `delivered/16` dizendo que a Fase 3 (ergonomia touch) ainda não
foi feita — o código confirma que já foi
(`src/index.css:69-75`, `GameplayHUD.tsx:712/725`, `src/types/game.ts:262`).

✅ **Sem contradição** — `in-progress/04_FASE4_MUNDO_CONTINUO.md` vs
`in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`: verificados
especificamente (dado o trabalho desta mesma sessão em ChunkStreamer/Fase
A/B) e estão **consistentes** entre si e com o código real
(`DungeonFlowController.getNextCampaignZone()` confirmado usando
`ChunkStreamer`/`CAMPAIGN_ZONE_CHUNKS` exatamente como `25` descreve). Este
é o único par nesta categoria genuinamente em dia — não precisa de ação.

### 4.4 Lixo documental confirmado (duplicatas literais)

🔴 **ALTA** — `docs/specs/in-progress/SPECS_EVOLUCAO.md` e
`in-progress/_ARCHIVED_SPECS_EVOLUCAO_2026_09_REFACTOR.md` são
**idênticos** em conteúdo (diferem só em 5 linhas de front matter/banner) —
o arquivamento esqueceu de apagar o original, então hoje coexistem uma
versão dizendo "ativo, prioridade alta" e outra "arquivado, não usar".

🔴 **ALTA** — `discovery/02_DISCOVERY_UI_ASSETS_EXTERNOS.md` e
`discovery/02_EIXO_A_DISCOVERY_UI_ASSETS_EXTERNOS.md` são **byte-a-byte
idênticos** (confirmado via diff).

🟡 **MÉDIA** — `backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md` é quase
idêntico a `discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md` (7 linhas de
diferença em ~440) — o discovery original foi deixado para trás quando
promovido a backlog.

### 4.5 Links internos quebrados (formato wikilink `[[...]]`)

🟡 **MÉDIA**, ~15 ocorrências, quase todas por uma reorganização antiga de
pastas (`docs/specs/propostas/`→`discovery/`/`backlog/`,
`docs/specs/andamento/`→`in-progress/`, e `docs/gameplay/`, `docs/design/`,
`docs/context/`, `docs/integration/`, `docs/deployment/`, `docs/features/`,
`docs/legacy/` movidos para dentro de `docs/archive/`). Arquivos afetados:
`delivered/01_FASE1_INCONSCIENCIA.md`, `delivered/01_RECORDS_DISPLAY.md`,
`delivered/03_FASE3_STATUS_SOBREVIVENCIA.md`,
`in-progress/06_EIXO_A_GRAFICOS_AVANCADOS.md`,
`in-progress/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`,
`backlog/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md`,
`backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md`,
`discovery/01_EVOLUCAO_GRAFICA_AVANCADA.md`,
`discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`,
`discovery/03_MULTIJOGADOR_COOPERATIVO_E_INTERATIVIDADE.md`,
`rejected/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md`,
`backlog/14_SPRITES_ASSETS_EXTERNOS_TIERS.md`,
`discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md`.

Também fora de `specs/`: `architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md`,
`critical/01_CRITICAL_FILES.md`, `critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`
(listados nas seções 2-3 acima).

### 4.6 Numeração colidente (não-intencional)

`delivered/`: `01` (Inconsciência vs Records Display), `03` (as duas specs
de sobrevivência concorrentes), `11` (joystick vs Visual Polish Fronts).
`discovery/`: `02` (3 arquivos, incluindo as duplicatas do item 4.4), `04`
(AI Art Pipeline vs Mobile/Monetização). A satelitização intencional
(`11.01-11.08`, `12.01-12.05`, `23.01-23.03`, `24.01-24.03`) está correta e
não deve ser confundida com estes casos.

---

## 5. `docs/product/`, `docs/reviews/`, `docs/archive/`

🟡 **MÉDIA** — `docs/product/ROADMAP.md`: item "Chefes Multiestágio" (Fase
2, pendente) não tem nenhuma spec/backlog rastreável. Fase 4 (Mundo
Contínuo/chunk streaming) já é trabalho ativo mas não aparece mencionada
no roadmap de produto — falta cruzar as duas fontes.

🟢 `docs/product/RELEASE_STRATEGY.md` e `docs/product/ACCOUNT_AND_DATA.md`
— consistentes, sem achados.

🟢 `docs/reviews/`: as duas auditorias anteriores já têm nota de resolução
histórica confirmando que os achados estruturais foram endereçados (PRs
#61-#66). Único item sem confirmação: recomendação 6.1.2 de
`AUDIT_REPORT_QUALIDADE_CODIGO_2026.md` (expandir `coverage.include` para
`CodexSystem.ts`/`RelicSystem.ts`/`ViewportCuller.ts`) — vale conferir
`vitest.config.ts` e fechar ou mover para a fila de automação.

🟢 `docs/archive/`: estrutura coerente, nada vazando como documentação
ativa. 🔵 **BAIXA**: `docs/archive/reference/docs-documental-base-guia.md`
tem `status: active` no frontmatter apesar de arquivado (deveria ser
`obsolete`), e cita um arquivo inexistente `docs/docs-master.md`.

---

## 6. Gaps de cobertura documental

🟡 **MÉDIA** — **Nenhuma prática de Architecture Decision Records (ADR)**
existe no projeto (busca confirmada: zero ocorrências reais). Decisões
grandes (ex: "100% Zustand desde 25/08", a não-adoção de Supabase) estão
espalhadas em `CLAUDE.md`, `docs/product/ACCOUNT_AND_DATA.md` e
`docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md` sem formato ou
índice consistente.

🟡 **MÉDIA** — **Acessibilidade**: só existe `docs/archive/design/03_ACCESSIBILITY.md`
(arquivado, sem substituto ativo) — gap real, sem nota de "despriorizado
intencionalmente".

🟡 **MÉDIA** — **Segurança**: sem guia vivo dedicado; conteúdo disperso em
um retrato estático de auditoria (`AUDIT_REPORT_QUALIDADE_CODIGO_2026.md`
seção 5) e menções soltas em `critical/01_CRITICAL_FILES.md`.

**Sugestão:** criar (i) `docs/architecture/07_DECISION_LOG.md` — ADR-lite
central; (ii) `docs/product/ACCESSIBILITY.md` ativo, mesmo que mínimo; (iii)
`docs/critical/06_SECURITY_GUIDELINES.md` vivo (CSP, Zod strict, gestão de
segredos).

---

## Tabela de remediação proposta (para decisão)

> **Atualização (2026-09-06):** itens A–D, F, G, J e K foram aplicados
> nesta mesma sessão (mecânicos/baixo-risco, aprovados pelo Felipe). H e I
> ficaram de fora deliberadamente — são decisões de conteúdo que precisam
> de validação humana antes de apagar/consolidar texto histórico. E
> (mandato do `docs/README.md`) também ficou de fora — decisão de
> conteúdo/tom, não mecânica.

| # | Ação | Risco de executar | Reversível? | Status |
|---|---|---|---|---|
| A | Apagar duplicatas byte-idênticas confirmadas (`SPECS_EVOLUCAO.md`, `discovery/02_DISCOVERY_UI_ASSETS_EXTERNOS.md`, `discovery/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md`) | Muito baixo | Sim (git) | ✅ Aplicado |
| B | Apagar cópias obsoletas em `in-progress/` já supersedidas por `delivered/` (`11_NATIVE_PHASER_TOUCHPAD_JOYSTICK.md`, `16_GRAPHICAL_UI_TERRAIN_EVOLUTION.md`, `06_EIXO_A_GRAFICOS_AVANCADOS.md`, `10_EVOLUCAO_GRAFICA_AUDIO_QUICKWINS_E_ROADMAP.md`) | Baixo | Sim (git) | ✅ Aplicado (nota sobre "Aura de Inimigo" migrada pro `backlog/14` antes de apagar) |
| C | Corrigir os ~20 links quebrados (formato wikilink → markdown padrão, apontando pro caminho real) | Muito baixo | Sim | ✅ Aplicado (validado programaticamente: zero links ativos quebrados restantes; só sobra o histórico dentro de `docs/archive/`, intencionalmente congelado) |
| D | Completar `docs/specs/README.md` (adicionar Spec 23/24 + satélites, remover entradas mortas) | Baixo | Sim | ✅ Aplicado (também completado o índice de `docs/architecture/`/`docs/critical/` no `docs/README.md` raiz) |
| E | Reescrever mandato de `docs/README.md` (Fase 1→2, Supabase/Auth) | Baixo | Sim | ⏳ Pendente — decisão de conteúdo/tom, aguardando validação |
| F | Corrigir os 4 erros factuais de `docs/critical/01_CRITICAL_FILES.md` + adicionar `DungeonGenerator.ts`/`localStorage.ts` à lista | Baixo, mas exige cuidado de precisão | Sim | ✅ Aplicado (também corrigido `00_ANTI_REGRESSION_GUIDE.md` e `02_CODE_ORGANIZATION.md`, que tinham os mesmos erros) |
| G | Corrigir versão de engine em `SEAMLESS_OPEN_WORLD_FEASIBILITY.md` (Phaser 3→4) | Baixo | Sim | ✅ Aplicado (+ nota de status de implementação do `ChunkManager`/`ChunkStreamer`) |
| H | **Decisão de conteúdo:** apagar/reduzir `backlog/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md` (duplicata perigosa) | Requer confirmação — é decisão de conteúdo, não só mecânica | Sim, mas perde texto histórico se não arquivado com cuidado | ⏳ Pendente |
| I | **Decisão de conteúdo:** consolidar as 2 specs de sobrevivência concorrentes (`03_FASE3_CONDICOES_DE_SOBREVIVENCIA.md` vs `03_FASE3_STATUS_SOBREVIVENCIA.md`) — checar código pra saber qual está certa | Requer verificação de código antes de decidir qual versão vira a fonte da verdade | Sim | ⏳ Pendente |
| J | Renumerar colisões acidentais (`delivered/01`, `03`, `11`; `discovery/02`, `04`) | Baixo, mas gera muitos links pra atualizar | Sim | ✅ Aplicado (`delivered/01_RECORDS_DISPLAY→26`, `delivered/11_NATIVE_PHASER_TOUCHPAD_JOYSTICK→27`, `discovery/04_DISCOVERY_AI_ART_PIPELINE→06`; a colisão em `delivered/03` fica pendente — é a mesma decisão de conteúdo do item I) |
| K | Criar os 3 documentos de gap (ADR-lite, acessibilidade, segurança) | Nenhum (puro adicional) | N/A | ✅ Aplicado (`docs/architecture/07_DECISION_LOG.md`, `docs/product/ACCESSIBILITY.md`, `docs/critical/06_SECURITY_GUIDELINES.md`) |

