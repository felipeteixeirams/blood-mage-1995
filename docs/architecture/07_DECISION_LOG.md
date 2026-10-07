---
agent_context: all
target_module: root
priority: media
status: active
last_updated: 2026-10-07
tags: [architecture, adr, decision-log, governanca]
---

# 🗂️ Registro de Decisões de Arquitetura (ADR-lite)

> **Gap identificado na auditoria de 2026-09-06** (ver
> `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`): o projeto não
> tinha nenhum lugar central listando POR QUE decisões arquiteturais
> grandes foram tomadas — elas ficavam espalhadas em `CLAUDE.md`, specs
> individuais, ou só na cabeça de quem decidiu. Este arquivo não substitui
> os documentos técnicos existentes (`docs/architecture/*`,
> `docs/critical/*`) — é um ÍNDICE de decisões, cada entrada curta
> (Contexto / Decisão / Consequências), linkando pro documento técnico
> completo quando existir um.

## Como adicionar uma entrada

Só decisões que (a) tiveram mais de uma opção real considerada e (b)
afetam como código futuro deve ser escrito merecem entrada aqui — não é
changelog de features. Formato: data, título curto, Contexto (o problema),
Decisão (o que foi escolhido e por quê), Consequências (o que isso implica
pra quem mexer no código depois).

---

### 2026-10-07 — Base Documental Separada em Contexto (`docs/AGENTS.md`) e Fluxo de Trabalho (`CLAUDE.md`)

**Contexto:** três arquivos disputavam o papel de "ponto de entrada": `AGENTS.md` na raiz (guardrails + regras de modo + procedimento Git), `docs/AGENTS.md` (navegação) e `CLAUDE.md` (492 linhas misturando contexto do projeto — stack, domínio, padrões de estado — com fluxo de trabalho — honestidade técnica, checklist, Git). Consequências medidas: a convenção de estado Zustand ("Comando + Reset"/"Valor + Versão") e os conceitos de domínio existiam **só** no `CLAUDE.md`, invisíveis a Jules/AI Studio/Codex; `CLAUDE.md` e `AGENTS.md` afirmavam que `pnpm verify` roda testes (não roda) e citavam `pnpm test:ui`/`test:e2e` (inexistentes); `?debug=true` era citado e não existe no código.

**Decisão:** (1) `docs/AGENTS.md` é o **ponto de entrada do contexto do projeto**, agnóstico de ferramenta: visão, domínio, mapa do código, **guardrails 1–7 com numeração estável e texto movido sem alteração**, padrões de estado/performance, convenções de docs, tabela "onde está cada coisa". (2) `CLAUDE.md` passa a tratar **só de como trabalhar com Claude Code**: ordem de leitura, skills, fluxo spec-driven, honestidade técnica, perguntas pré-implementação, checklist, comandos, Git, escalonamento. (3) `AGENTS.md` da raiz vira **ponteiro fino** com índice dos guardrails, porque ferramentas externas ainda leem esse caminho. Regra: cada fato mora em um lugar; os demais linkam.

**Consequências:** guardrails continuam citáveis como "Guardrail #7"/"Regra 6b" (specs, skills e comentários de código não mudam). Mudança de regra do projeto → `docs/AGENTS.md`; mudança de fluxo de trabalho → `CLAUDE.md`. **Pendente de decisão do Felipe:** a seção "Git remoto" do `AGENTS.md` da raiz (push para `main` com token pessoal gravado na URL do remote) conflita com o fluxo de `CLAUDE.md` e foi preservada sem alteração por poder ser usada por ferramentas externas; Claude Code não a segue. Também pendente: `.claude/skills/` (16 skills), `.agents/skills/` (5) e `skills/` (5 + `spritecook-integration`) mantêm cópias separadas das mesmas skills; hoje as comuns estão idênticas (sincronizadas em 2026-10-07 ao propagar o aviso sobre `renderer.isWebGL`), mas nada impede nova divergência.

---

### 2026-09-28 — Conceitos de Design Portados de Protótipo Externo (Godot) Nunca Copiam Código

**Contexto:** Felipe trabalhou por engano em `felipeteixeirams/bloodmage1995`
(repo separado, nome quase idêntico ao correto) achando que era este
projeto — um protótipo em Godot 4.3/GDScript com sistemas de Boss
multi-fase, Equipment Sets, Skill Tree por atributos e Prestige com
escalada infinita. Pediu para trazer o que agregasse.

**Decisão:** Analisar cada sistema do protótipo contra o estado REAL do
projeto principal (grep/leitura direta de código, não suposição) antes de
decidir o que portar. Dois sistemas eram gap real confirmado (Boss
multi-fase — só existe 1 boss sem fases; Equipment Sets — zero menção no
código): viraram specs formais (33, 34) reimplementando o CONCEITO em
Phaser 4/TypeScript, reaproveitando infraestrutura já existente
(`speedMultiplier`, `EnemyTelegraphSystem`, `RelicEffect`) — nenhuma linha
de GDScript foi copiada. Os demais sistemas do protótipo (Spell System,
Skill Tree, Prestige loot scaling) eram redundantes ou inferiores ao que
já existe entregue (specs 12, 18, 19, `spells.json`) — não portados.

**Consequências:** Ao encontrar um repositório/protótipo externo com
conceitos de jogo sobrepostos, o padrão é: (1) confirmar gap real por
leitura de código, nunca por suposição de que "não deve existir"; (2)
nunca copiar código de outra engine/linguagem — reimplementar o conceito
nos padrões e guardrails deste projeto (Extract/Delegate, campos aditivos
em vez de tocar FSM crítica); (3) documentar a origem na spec resultante
para rastreabilidade.

---

### 2026-09-08 — Workflow Paralelo: Fila de Definição (Conceito) ↔ Fila de Desenvolvimento (Execução)

**Contexto:** Specs que precisam de definição de conceito/gameplay (i18n lib choice, qual evento implementar primeiro, variedade de biomas) ficavam bloqueando toda a Fila de Prioridade enquanto Felipe decidia. Ao mesmo tempo, specs prontas (sem dependências conceituais) ficavam ociosas esperando a definição terminar.

**Decisão:** Criar duas filas PARALELAS (ambas em `docs/specs/README.md`):
1. **Fila de Definição:** specs em `scope-definition/` que precisam decisão de CONCEITO que muda o código (ex: "qual lib i18n" → import e config diferentes). Felipe/Product clarifica lá.
2. **Fila de Desenvolvimento:** specs em `backlog/` prontas para execução imediata, sem dependência conceitual. Claude/Jules codifica, sem esperar.

Diferença crítica: **"Bloqueados"** (arte/demanda comercial não aprovada) continuam sendo insumo não-técnico e não entram em nenhuma fila ativa até o insumo chegar.

**Consequências:**
- Specs nunca trancam desenvolvimento — enquanto Felipe define spec A, Claude/Jules executa spec B.
- Hierarquia de prioridades por tipo: 🔴 Bugs críticos > 🟡 Média-Alta gameplay > 🟡 Média polish > 🟢 Comercial.
- Quando definição de conceito termina (ex: i18n lib escolhida), spec entra no topo da próxima Fila de Desenvolvimento.
- Documentação em `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` seção "Workflow Paralelo: Fila de Definição ↔ Fila de Desenvolvimento".

---

### 2026-09-06 — Ruído do `HeightmapGenerator` precisa de interpolação, não hash cru

**Contexto:** `pseudoNoise()` aplicava um hash caótico (estilo
`random(vec2)` de shader) diretamente por célula de grid. Isso nunca deu
problema nas masmorras (salas majoritariamente planas), mas ao ligar
elevação real na floresta (`ProceduralForestGenerator`), `getCliffEdges()`
disparava em quase toda célula — o piso virava um mosaico de paredes de
falésia cobrindo a grama.

**Decisão:** `pseudoNoise()` agora faz *value noise* com interpolação
bilinear suave sobre uma malha esparsa (`hashLattice` + `smoothstep`),
em vez de aplicar o hash cru por célula de grid.

**Consequências:** qualquer biome/sistema futuro que use
`HeightmapGenerator.getHeightAt()` numa área grande e não-uniforme já
recebe terreno espacialmente correlacionado — não precisa reinventar
suavização. Nenhum teste dependia dos valores crus do ruído (só faixa
[0,4] e determinismo), então a mudança foi segura.

---

### 2026-09-06 — Piso de tiles retangulares depende de opacidade total, não de silhueta em losango

**Contexto:** ao dar relevo à floresta, uma tentativa de fix aplicou um
recorte isométrico em losango na textura `forest_grass` (copiando o padrão
de `tile_ground` das masmorras). Isso quebrou o piso — apareceram lacunas
entre tiles.

**Decisão:** o piso de tiles retangulares (`forest_grass`, `tile_ground`
sem bitmask) depende do truque clássico de "tiling por sobreposição":
cada retângulo 64x32 OPACO desenhado em ordem de varredura cobre as bordas
do anterior. Um recorte em losango deixa os cantos transparentes e quebra
essa sobreposição. Elevação real (`zElevation`) não desloca o Y do sprite
do piso — só afeta paredes de falésia e altura de props.

**Consequências:** qualquer novo bioma com piso relevo-variável deve
manter o sprite do piso no grid PLANO (`isoY`), nunca deslocado por
elevação — só objetos verticais discretos (paredes, árvores, props) devem
seguir a altura.

---

### 2026-08-25 — Ponte Phaser↔React é 100% Zustand, zero `CustomEvent`

**Contexto:** o projeto usava uma mistura de `window.dispatchEvent`/
`CustomEvent` e Zustand pra sincronizar estado entre o motor Phaser e a UI
React, gerando bugs de ordem de execução difíceis de rastrear.

**Decisão:** migração completa para Zustand como único canal — dois
padrões (Comando+Reset pra baixa frequência, Valor+Versão pra alta
frequência), documentados em detalhe em
`docs/architecture/04_STATE_MANAGEMENT.md` e
`docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md`.

**Consequências:** nenhum código novo deve introduzir
`CustomEvent`/`dispatchEvent` para gameplay — é um guardrail verificado
(confirmado por auditoria: zero ocorrências ativas fora de eventos nativos
do browser).

---

### 2026-09-06 — Autotiling de piso via bitmask, não retextura única por bioma

**Contexto:** as 3 masmorras usavam um único bitmap de piso/parede
re-tingido por bioma — repetitivo e "amador" visualmente.

**Decisão:** bitmask de vizinhos (4-bit, técnica clássica de Wang tiles —
ver `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md` e a referência
redblobgames.com/articles/autotile citada no PR), com variantes orgânicas
por ruído determinístico. Ver `DungeonGenerator.calculateBitmask()` /
`getGroundTextureKey()`.

**Consequências:** a mesma técnica foi estendida pro piso da Safe House
(variantes de madeira) sem bitmask de vizinhos (não há transição piso/
parede dinâmica lá) — só variantes por ruído de posição. A frente de
autotiling de PAREDES (peças de canto/junção) reaproveitando
`calculateBitmask()` foi entregue em 2026-09-07 (mesclada em duas rodadas,
PR #86 e #88, refinamento visual de destaque em `029067f`).

---

### 2026-08-11 — Mundo contínuo estilo Dungeon Siege 1 via streaming de chunks, não portais teleporte puros

**Contexto:** o jogo usa portais/gatilhos de colisão pra trocar de bioma;
avaliou-se migrar pra um mundo fisicamente contínuo (sem tela de
carregamento), inspirado na arquitetura de "Siege Nodes" do Dungeon Siege
1.

**Decisão:** abordagem faseada e de baixo risco — Fase A (`ChunkStreamer.ts`,
classe agnóstica de Phaser, testada isoladamente) → Fase B
(`DungeonFlowController` decide o próximo bioma via `ChunkStreamer`,
MANTENDO o gatilho de portal/colisão intacto) → Fase B.2 em diante
(bounds dinâmicos reais, ainda não implementado — ver
`docs/specs/in-progress/25_MUNDO_CONTINUO_CHUNK_STREAMING.md`).

**Consequências:** `docs/architecture/SEAMLESS_OPEN_WORLD_FEASIBILITY.md`
propõe uma classe `ChunkManager.ts` que NÃO deve ser criada do zero — o
papel já é cumprido por `ChunkStreamer.ts` + `WorldManager.ts` sob outro
nome.

---

<!--
TEMPLATE para nova entrada — copie e preencha, mais recente no topo:

### AAAA-MM-DD — Título curto da decisão

**Contexto:** qual problema motivou a decisão, que alternativas existiam.

**Decisão:** o que foi escolhido e por quê. Linke o documento técnico
completo se existir um.

**Consequências:** o que isso implica pra quem for mexer em código
relacionado depois — o que NÃO fazer, o que reaproveitar.
-->
