# Plano de Implementação — Conclusão da Fase 4: Mundo Contínuo e Topologia Orgânica (Blood Mage 1995)

Plano detalhado para a implementação da Fase 4 (Mundo Contínuo, Path-Driven Generation, Setpieces Procedurais e Ecologia de Habitats), substituindo o modelo de arenas encaixotadas por uma jornada contínua inspirada em *Dungeon Siege*.

## User Review & Critical Decisions

> [!IMPORTANT]
> Com base na escolha do usuário, este plano foca inteiramente no avanço da **Fase 4: Mundo Contínuo e Chunk Streaming / Path-Driven Generation**, mantendo os padrões de arquitetura escalável, reuso de código e isolamento UI vs Phaser.

- **Foco Confirmado**: Conclusão da Fase 4 (Mundo Contínuo e Topologia Orgânica).
- **Abordagem de Execução**: Desenvolvimento incremental de geradores baseados em trilha (`PathDrivenGenerator`), micro-ambientes/Setpieces, ecologia de monstros por habitat e culling espacial aprimorado.

---

## 1. Overview & Core Concept

- **What It Does**: Evolui a geração procedural de masmorras e florestas de arenas estáticas para um mundo contínuo e semi-linear, com caminhos orgânicos, lagos rasos, ruínas isoladas, transições de bioma sem telas de loading e spawns de inimigos direcionados por habitat ecológico.
- **Target Audience / Persona**: Jogadores em busca de profundidade de exploração, imersão gótica e progressão fluida (mobile-first a 60 FPS).
- **Key Value**: Eliminação da "Síndrome do Caixote" (arenas isoladas), aumentando o game feel, a tensão e a sensação de jornada imersiva.

---

## 2. User Experience & Visual Design

- **Key Visual & Environmental Changes**:
  - **Espinha Dorsal Orgânica**: Caminhos principais de A até B com largura variável (gargalos e clareiras).
  - **Setpieces Temáticos**: Injeção de cabanas abandonadas, lagos rasos (com redução de velocidade de movimento) e ruínas no meio do bioma.
  - **Line of Sight e Oclusão**: Obstáculos densos (árvores aglomeradas, paredes de pedra) bloqueando visão e aggro de inimigos até que haja linha de visão limpa.
- **Mobile Ergonomics & Performance**:
  - Culling espacial rigoroso (`ViewportCuller.ts`) para renderizar apenas os chunks ativos ao redor do jogador, garantindo VRAM estável e 60 FPS em dispositivos móveis.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Path-Driven Generator vs BSP Estático**
  - *Chosen Approach*: Implementar gerador baseado em Random Walk/Caminhos com preenchimento de obstáculos sólidos no espaço negativo.
  - *Why*: Cria a sensação real de trilha e exploração em vez de salas quadradas desconectadas.
- **Decision 2: Ecologia de Spawns por Zona de Habitat**
  - *Chosen Approach*: Metadados de zonas retornados pelo gerador para o `DungeonFlowController` associar monstros específicos (ex: lobos na floresta, mortos-vivos nas ruínas, criaturas aquáticas nos lagos).
  - *Why*: Aumenta a coerência do mundo e a profundidade tática do combate.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────┐
│                   DungeonFlowController                │
│       (Coordena Progressão, Zonas e Spawns)            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              PathDrivenGenerator / WorldManager        │
│       (Gera Caminhos, Espinha Dorsal, Setpieces)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               ChunkStreamer & ViewportCuller           │
│     (Streaming Dinâmico de Chunks & Culling AABB)      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Phaser 3/4 Game Engine              │
│       (Renderização, Física AABB, FSM de Combate)      │
└────────────────────────────────────────────────────────┘
```

- **Data Model & State**: `WorldManager` gerencia os metadados dos chunks ativos e zonas ecológicas.
- **Interactive Component & State Mapping**: Transições de bioma ocorrem organicamente por coordenadas espaciais, sem recarregar a cena Phaser.
