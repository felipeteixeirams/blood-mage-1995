---
agent_context: game-designer, game-engine
target_module: src/game/systems/DungeonGenerator.ts, src/game/systems/WorldManager.ts
priority: high
status: active
implementation_status: not_started
last_updated: 2026-09-06
tags:
  - specs
  - world-building
  - level-design
  - continuous-world
---

# Spec 18 — Topologia de Mundo Contínuo e Variedade Orgânica (Padrão Dungeon Siege)

> **Status:** Ativo
> **Data:** 6 de setembro de 2026
> **Domínio:** Geração Procedural, World Building, Level Design.
> **Objetivo Final:** Transformar a geração de masmorras baseada em "arenas quadradas" em um mundo contínuo, orgânico e imprevisível, com transições fluídas entre interiores, exteriores e diferentes biomas, atrelando a ecologia de monstros a esses ambientes.

---

## 1. O Problema Atual (A Síndrome do "Caixote")

Atualmente, o `DungeonGenerator.ts` constrói o mapa delimitando uma parede externa gigante (1920x1440) e jogando salas menores (ou árvores, no caso da floresta) de forma espalhada e desconectada no meio. 
O resultado é que o jogo **não passa a sensação de jornada nem de exploração**, mas sim de uma arena de sobrevivência. O jogador sempre nasce em um quadrado grande, os monstros correm até ele, ele mata todos, acha um portal e vai para o próximo "quadrado".

## 2. A Visão Alvo (Referência: Dungeon Siege)

O _Goal_ de longo prazo é criar uma jornada contínua e imersiva. O jogador não deve perceber "fases", mas sim um mundo conectado.

Características dessa visão:
- **Imprevisibilidade Topológica:** O formato do próximo ambiente nunca é garantido. Um caminho na floresta pode se afunilar para uma passagem nas montanhas, revelar uma cabana abandonada, um porão que leva a uma cripta, ou a margem de um lago raso.
- **Micro-Ambientes Híbridos:** Mistura fluida de exteriores e interiores. Exemplo: entrar em uma caverna não deve exigir uma tela de loading; o terreno da floresta deve transicionar gradualmente para as paredes de pedra.
- **Ecologia de Monstros por Bioma/Habitat:** A fauna inimiga deve pertencer ao local. Lobos patrulham bosques; ursos protegem entradas de cavernas; morcegos caem de tetos escuros; mortos-vivos rondam cemitérios e criptas. A variedade e o desafio escalam de forma coerente com o ambiente e a progressão.
- **Obstáculos e Navegação Orgânica:** Rios rasos (que lentificam o movimento), desníveis e passagens estreitas não são apenas bloqueadores visuais, mas elementos que afetam o combate e a tensão (ex: ser emboscado na água).

## 3. Plano de Ação Incremental (O que podemos fazer *AGORA*)

Chegar no nível de complexidade do *Dungeon Siege* exige um motor de mundo _seamless_ (sem telas de loading) e um sistema robusto de *chunks*. Como nossa base procedural atual ainda é primitiva (BSP/Cellular Automata basais), precisamos construir a ponte estrutural para isso.

Nesta Spec (Fase Atual), abandonaremos o "Quadrado Gigante" e implementaremos a base do **"Linearidade Orgânica"**.

### A. Substituição do Algoritmo de Geração
- **Remover as Parede Perimetrais Gigantes:** O mapa não será mais contido por um retângulo perfeito.
- **Gerador Baseado em Caminhos (Path-Driven Generation):**
  - O algoritmo não deve espalhar salas aleatoriamente. Ele deve desenhar uma "espinha dorsal" (o caminho principal de A até B).
  - Salas, clareiras e pontos de interesse (cabanas, lagoas) devem "nascer" acopladas a essa espinha dorsal.
  - O espaço vazio fora desse caminho estruturado será preenchido maciçamente por obstáculos intransponíveis (árvores densas, rochas maciças, abismos), criando os "paredões naturais" do mundo.

### B. Transições de Micro-Ambientes (Pontos de Interesse)
- Inserir "Setpieces" procedurais que quebram a monotonia do gerador:
  - **Na Floresta:** Em vez de apenas árvores espalhadas, o gerador pode alocar um pedaço do mapa para um "Lago Raso" (terreno azul translúcido, reduz a velocidade do player em 15%) ou uma "Ruína Isolada" (quatro paredes com uma porta e um baú dentro).

### C. Sistema de Ecologia de Monstros (V1)
- O `DungeonFlowController` e `WorldManager` devem ser ajustados para associar spawns não apenas ao "andar" (floor), mas ao **habitat gerado**.
  - Ex: Se o gerador alocou um "Lago", existe uma chance de spawnar um tipo específico de inimigo aquático ou anjo de lodo ali.
  - Em clareiras, lobos. Nas cavernas estreitas, morcegos/aranhas.

## 4. Roteiro Técnico para Implementação (Delegação para Jules)

Este roteiro contém o passo a passo exato do que precisa ser refatorado para transformar a geração do jogo. **O código atual de geração de BSP/Celular Automata (DungeonGenerator.ts) e ProceduralForestGenerator deve ser deprecado/substituído por esta nova abordagem.**

### Tarefa 1: Novo Algoritmo de Trilha Contínua (`PathDrivenGenerator`)
O gerador antigo desenhava um perímetro gigante e sorteava cômodos dentro. O novo gerador deve construir "caminhos e nós".
- **Objetivo:** O jogador deve sentir que está seguindo uma jornada semi-linear.
- **Passos da Implementação:**
  1. Criar `PathDrivenGenerator.ts` (ou refatorar intensamente o `ProceduralForestGenerator` atual).
  2. Implementar um algoritmo de **Random Walk (Drunkard's Walk modificado)** ou **Nós de Voronoi** que traça uma espinha dorsal contínua (ex: do Sul indo para o Norte).
  3. Preencher **todo** o negativo do mapa com obstáculos sólidos (árvores aglomeradas invísiveis/colisores maciços ou paredes de pedra). O jogador não pode sair da trilha esculpida.
  4. Adicionar variação na espessura da trilha: às vezes é um corredor estreito de 2 tiles (gargalo), às vezes se abre numa clareira de 15x15 tiles (arena de combate natural).

### Tarefa 2: Módulos de Setpieces e Micro-Ambientes (Pontos de Interesse)
Em certas partes alargadas da trilha (as clareiras descritas acima), o gerador deve injetar "Setpieces" (pequenas estruturas pré-definidas ou temáticas).
- **Passos da Implementação:**
  1. Criar suporte para carregar blocos temáticos no gerador (ex: função `injectSetpiece(x, y, type)`).
  2. **Setpiece 1 (A Cabana Isolada):** Desenhar 4 paredes de tijolo/madeira com 1 porta e 1 baú de suprimentos no meio da floresta. O jogador pode optar por entrar nela.
  3. **Setpiece 2 (O Lago Raso):** Um bolsão de água.
     - Implementar lógica no `Player` e `Enemy` para checar fricção do terreno. Se estiver pisando em `tile_water`, a velocidade de movimentação cai em 30%.
  4. **Setpiece 3 (Entrada do Covil):** Uma transição súbita onde as árvores viram paredes de pedra. A iluminação cai (simulando a entrada de uma caverna) sem que o jogador troque de cena.

### Tarefa 3: Sistema de Ecologia de Monstros (Spawns por Habitat)
Hoje, o `DungeonFlowController` faz o loop: `for (monstro em Wave) -> spawn(X aleatório)`. Precisamos de inteligência de habitat.
- **Passos da Implementação:**
  1. No `DungeonFlowController.ts`, modificar a lógica de spawn para receber informações de "zonas" do gerador.
  2. A função de geração de mapa deve retornar metadados das zonas (ex: `zonas: [{ x, y, raio, tipo: 'forest_trail' }, { x, y, raio, tipo: 'lake' }, { x, y, raio, tipo: 'ruins' }]`).
  3. Criar uma tabela de mapeamento Habitat -> Monstro:
     - `forest_trail` -> `scout_beast`, lobos (futuros).
     - `lake` -> Monstros tentaculares, slimes ou sapos (ou apenas abominações da água).
     - `ruins` -> `skeleton_warrior`, `cultist_acolyte`.
  4. A rotina de spawn deve varrer as zonas e instanciar os monstros corretos nas coordenadas correspondentes a seus habitats.

### Tarefa 4: Ocultação da Visão (Line of Sight Dinâmico)
Um fator crucial do Dungeon Siege é que você não vê o que está atrás da casa até entrar ou virar a esquina.
- **Objetivo:** O gerador de terreno deve registrar colisores que também bloqueiam o FOV (Field of View).
- **Passos da Implementação:**
  1. Garantir que as árvores espessas / paredes dos setpieces (cabana, ruínas) se registrem no `wallsGroup` ou no motor de Raycast existente.
  2. Inimigos dentro de estruturas (como a Cabana) ou do outro lado do labirinto florestal não devem "aggro" (alertar) no jogador se não houver linha de visão.

> **Instrução Especial para o Jules:** Inicie criando o `PathDrivenGenerator` rodando paralelo ao antigo e conecte no `DungeonFlowController` apenas quando ele estiver instanciando uma trilha coerente de 1x1. Faça pequenos commits validados visualmente no navegador.