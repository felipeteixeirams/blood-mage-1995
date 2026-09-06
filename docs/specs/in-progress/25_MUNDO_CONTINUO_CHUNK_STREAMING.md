---
agent_context: backend, game-engine, game designer
target_module: src/game/systems/ChunkStreamer.ts, src/game/systems/DungeonGenerator.ts, src/game/systems/DungeonFlowController.ts, src/game/scenes/GameScene.ts
priority: alta
status: Fases A e B (encanamento interno) entregues — Fases B.2/C/D em discovery
last_updated: 2026-09-06
tags: [design, world-structure, continuous-world, dungeon-siege, chunk-streaming, discovery]
---

# 🌍 Mundo Contínuo Estilo Dungeon Siege — Chunk Streaming

> Felipe pediu pra reestruturar como as fases/biomas se conectam: hoje "são
> basicamente um quadrado" — cada bioma é uma área retangular fixa gerada
> inteira de uma vez, trocada abruptamente pela próxima ao avançar. Pediu
> pesquisa sobre como o Dungeon Siege 1 (2002) resolvia isso (mundo sem
> tela de carregamento) e uma proposta de adaptação pro nosso stack
> (Phaser 4 isométrico 2D).

---

## 1. Pesquisa: como o Dungeon Siege 1 fazia isso

Fontes: [Dungeon Siege Wiki](https://dungeonsiege.fandom.com/wiki/Dungeon_Siege), [Wikipedia](https://en.wikipedia.org/wiki/Dungeon_Siege), [metzomagic.com review](https://www.metzomagic.com/showArticle.php?index=441).

- **Mundo único e contínuo, sem tela de carregamento.** O jogo não tem
  "níveis" no sentido tradicional — é uma única área contínua que o
  jogador atravessa do início ao fim.
- **Sem transições abruptas entre áreas.** A fazenda inicial se funde
  gradualmente na floresta; florestas se abrem em criptas através de
  entradas de tumba dramáticas; encostas de montanha descem pra minas
  através de poços de elevador longos. Cada passo é ininterrupto — ao
  descer uma escada pra escuridão, a superfície simplesmente desaparece
  conforme o jogador se move, tratada como qualquer outro cenário "alto"
  que fica fora do caminho da câmera.
- **Construído a partir de blocos modulares ("Siege Nodes"), não de um
  mundo todo desenhado à mão de uma vez.** Terreno de largura fixa,
  encadeado num caminho, carregado à frente do jogador e descartado atrás
  dele conforme ele avança — é isso que permite mundo grande sem carregar
  tudo de uma vez nem ter tela de loading.
- **Estrutura de campanha LINEAR**, apesar do mundo contínuo. Existem
  poucos desvios secretos (escadas escondidas, passagens laterais), mas
  são diversões menores — não é um mundo aberto.

---

## 2. Diagnóstico: onde estamos hoje

`DungeonGenerator.generate(mapW, mapH, biome)` gera **uma área retangular
fixa (1920×1440px) inteira de uma vez**, por chamada. Ao avançar de fase
(`DungeonFlowController.advanceToNextFloor()`, `ProceduralForestGenerator.ts`
para `gloomy_woods`):

1. Todos os grupos são limpos (`wallsGroup.clear()`, `chestsGroup.clear()`, etc.)
2. `buildDungeonMap()` é chamado de novo, gerando um retângulo novo do zero
3. `WorldManager.setBiome()` troca luz/áudio/clima ambiente

**Isso já não tem tela de carregamento** — é tudo na mesma `GameScene`,
sem `scene.restart()`. Mas não é "contínuo" no sentido do Dungeon Siege:
não existe caminho físico entre os biomas, é uma troca abrupta de 100%
do conteúdo. Daí a queixa de "são basicamente um quadrado" — cada fase é,
literalmente, um retângulo isolado.

A cadeia de biomas hoje (fixa, linear, sem ramificação) —
`DungeonFlowController.ts` ~L500-513:

```
safe_house → gloomy_woods → fosso_chagas → catacumbas_martires → santuario_sangue
```

---

## 3. Proposta de adaptação pro nosso stack

Não dá (nem faz sentido) portar o motor 3D real-time do Dungeon Siege pra
cima do Phaser 2D isométrico. A adaptação pega o **princípio** (blocos
modulares carregados/descartados numa janela ao redor do jogador) e aplica
no nosso mundo de tiles 2D:

- **"Siege Node" → `ChunkSpec`**: um segmento de largura fixa ao longo de
  um eixo (X), com um bioma associado. Em vez de 1 retângulo gigante por
  bioma, o mundo vira uma sequência ORDENADA de chunks — o mesmo bioma
  pode, inclusive, ocupar vários chunks seguidos.
- **World streamer → `ChunkStreamer`** (`src/game/systems/ChunkStreamer.ts`,
  **Fase A, já entregue nesta rodada**): dado a posição X do jogador,
  mantém carregada só uma JANELA de chunks ao redor dele (atual + N à
  frente + N atrás), chamando callbacks de geração/destruição fornecidos
  por quem usa a classe. Puro e agnóstico de Phaser — testável sem
  canvas/WebGL, sem nenhuma ligação com o jogo real ainda (deliberado:
  provar o mecanismo isolado antes de arriscar o fluxo de produção).
- **Transição indoor↔outdoor sem corte** (o "a paisagem lá atrás só some
  conforme você anda", do DS1): mapeia bem no que `WorldManager.setBiome()`
  já faz parcialmente (interpolação de `lightRadius`) — a diferença é que
  hoje isso dispara numa troca abrupta de conteúdo; com chunks, dá pra
  fazer o próximo chunk aparecer enquanto o atual ainda está visível, sem
  clear-and-rebuild síncrono.
- **Estrutura linear mantida** — igual ao Dungeon Siege, não estamos
  propondo mundo aberto/ramificado, só a MESMA cadeia de biomas de hoje,
  encadeada fisicamente em vez de trocada por completo.

---

## 4. Fases de implementação

### ✅ Fase A — Mecanismo isolado (ENTREGUE nesta rodada)
- `src/game/systems/ChunkStreamer.ts`: classe genérica `ChunkStreamer<T>`,
  janela deslizante de chunks por posição X, `onLoad`/`onUnload` via
  injeção de dependência — zero acoplamento com Phaser/GameScene/biomas
  reais.
- `src/game/systems/ChunkStreamer.test.ts`: 13 testes — construção,
  mapeamento de posição→chunk (incl. bordas), janela de load/unload,
  idempotência, oscilação na fronteira entre chunks, `dispose()`, e uma
  simulação completa da cadeia real de biomas da campanha (prova que o
  mecanismo genérico mapeia limpo pra sequência `safe_house → gloomy_woods
  → fosso_chagas → catacumbas_martires → santuario_sangue`).
- **Critério de aceite desta fase:** mecanismo provado e testado, **sem
  nenhuma mudança de comportamento no jogo real** (nenhum arquivo do fluxo
  de produção foi tocado).

### ✅ Fase B — "Encanamento interno" (ENTREGUE nesta rodada, escopo reduzido deliberadamente)
Antes de integrar de verdade, investiguei `GameScene.ts` (arquivo 🔴
crítico) e confirmei: `physics.world.setBounds`/`cameras.main.setBounds`
são setados **uma vez**, fixos, em `create()`; toda troca de bioma reusa
o MESMO retângulo 1920×1440. Trocar isso de verdade (bounds dinâmicos +
gatilho por posição em vez de colisão com portal) é mudança de
comportamento de jogo, não só encanamento — decidido com Felipe **adiar
isso pra Fase B.2/C** e entregar agora só a parte 100% sem risco:

- `DungeonFlowController.getNextCampaignZone()`: substitui o if/else
  hardcoded de 5 ramos (que decidia o próximo bioma) por uma consulta ao
  `ChunkStreamer` sobre `CAMPAIGN_ZONE_CHUNKS` (a mesma cadeia, agora como
  dado ordenado em vez de comparações de string). `onLoad`/`onUnload` são
  no-ops nesta fase — carga/descarga de conteúdo continua exatamente como
  antes (inline em `advanceToNextFloor()`); o streamer só decide a ordem
  e mantém `getCurrentChunkIndex()` sincronizado com a progressão real,
  preparando o terreno pras fases seguintes.
- **Gatilho continua sendo colidir com o portal** — zero mudança de
  comportamento pro jogador.
- Validado em 2 camadas: `DungeonFlowController.test.ts` (3 testes,
  prova que a nova lógica reproduz bit-a-bit a sequência do if/else
  antigo, incluindo saturar em `santuario_sangue`) **e** rodando o jogo
  de verdade via Playwright (chamando `advanceToNextFloor()` 5x através
  de `window.gameScene.dungeonFlow` e confirmando a sequência real:
  `safe_house → gloomy_woods → fosso_chagas → catacumbas_martires →
  santuario_sangue → santuario_sangue`).

### 🔍 Fase B.2 — Bounds dinâmicos + integração real com `DungeonGenerator` (discovery, decisão pendente)
- Decisão em aberto: cada bioma vira 1 chunk largo (como hoje, só
  encadeado fisicamente) ou N chunks menores dentro do mesmo bioma?
- Como mapear `ChunkStreamer.onLoad` pra `DungeonGenerator.generate()` —
  hoje essa função assume que É o mundo inteiro (paredes de perímetro,
  câmera, `rooms[0]` como spawn); precisa gerar só a fatia do chunk.
- Câmera/física do Phaser usam `world.setBounds()` fixo — precisa virar
  dinâmico (o mundo cresce conforme chunks são adicionados à frente).
- **Esta é a fase que muda o gatilho** de "colidir com portal" pra
  "posição cruzar fronteira" — decisão explícita de Felipe foi adiar
  isso, então só avançar aqui com validação prévia.

### 🔍 Fase C — Transições sem corte (indoor↔outdoor, bioma↔bioma)
- Portar a lógica de luz/névoa/áudio do `WorldManager` pra reagir à
  **proximidade da fronteira do próximo chunk**, não a uma troca instantânea.
- Overlap visual na fronteira: os últimos tiles de um chunk e os primeiros
  do próximo compartilham paleta/textura de transição (equivalente ao
  "floresta se funde na cripta" do DS1).

### 🔍 Fase D — Porta em vez de portal na saída do Safe House
- Troca só de encenação (sprite de porta em vez de `spr_portal`
  giratório) na saída específica do `safe_house` — **não muda o
  mecanismo de transição em si**, só a "casca" visual. Adiado (junto com
  o redesenho do Safe House em vila/acampamento e NPCs vendedores) até
  as Fases B/C estarem resolvidas — não faz sentido trocar a casca visual
  de um mecanismo que ainda vai mudar por baixo.

---

## 5. O que NÃO está no escopo (decidido explicitamente com Felipe)

- Sistema de economia/compra e venda com NPCs — fica para depois desta
  reestruturação.
- Redesenho visual do Safe House em vila/acampamento (Diablo Immortal-style)
  — depende da Fase D, adiado.
- Mundo aberto ou ramificado — a estrutura linear da campanha é mantida.

---

## Referências

- Pesquisa web: [Dungeon Siege Wiki](https://dungeonsiege.fandom.com/wiki/Dungeon_Siege),
  [Wikipedia](https://en.wikipedia.org/wiki/Dungeon_Siege),
  [metzomagic.com](https://www.metzomagic.com/showArticle.php?index=441)
- `docs/specs/in-progress/04_FASE4_MUNDO_CONTINUO.md` — spec relacionada
  mas de escopo DIFERENTE (Safe Town/NPCs/iluminação adaptativa/clima,
  já 95% entregue); esta spec (25) é sobre a estrutura FÍSICA de como os
  biomas se conectam, não sobre o conteúdo de cada um.

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-09-06 | Criação: pesquisa sobre Dungeon Siege 1, diagnóstico da estrutura atual ("cada bioma é um quadrado"), proposta de adaptação via chunk streaming, plano em 4 fases. Fase A entregue: `ChunkStreamer.ts` isolado e testado (13 testes), zero mudança no jogo real. | Claude |
