---
agent_context: all
target_module: root
priority: media
status: active
last_updated: 2026-09-06
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
