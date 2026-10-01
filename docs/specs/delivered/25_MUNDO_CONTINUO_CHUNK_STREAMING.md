---
agent_context: backend, game-engine, game designer
target_module: src/game/systems/ChunkStreamer.ts, src/game/systems/DungeonGenerator.ts, src/game/systems/DungeonFlowController.ts, src/game/scenes/GameScene.ts
priority: high
criticality: critical
status: delivered
progress: 100% — Fases A, B, B.2, C e D entregues
last_updated: 2026-09-08
tags: [design, world-structure, continuous-world, dungeon-siege, chunk-streaming]
---

> ✅ **Concluído em 2026-09-08:** 100% entregue. Fases A, B, B.2 e D mescladas no PR #92. Fase C (transições sem corte entre biomas na fronteira de chunks com interpolação contínua de luz, névoa, matriz de cor e áudio ambiente) concluída e testada.

# 🌍 Mundo Contínuo Estilo Dungeon Siege — Chunk Streaming

> Reestruturação da conexão entre fases/biomas inspirada no motor do Dungeon Siege 1 (2002): mundo único e contínuo sem telas de carregamento nem cortes abruptos entre áreas.

---

## 1. Pesquisa: como o Dungeon Siege 1 fazia isso

Fontes: [Dungeon Siege Wiki](https://dungeonsiege.fandom.com/wiki/Dungeon_Siege), [Wikipedia](https://en.wikipedia.org/wiki/Dungeon_Siege), [metzomagic.com review](https://www.metzomagic.com/showArticle.php?index=441).

- **Mundo único e contínuo, sem tela de carregamento.** O jogo não tem
  "níveis" no sentido tradicional — é uma única área contínua que o
  jogador atravessa do início ao fim.
- **Sem transições abruptas entre áreas.** A fazenda inicial se funde
  gradualmente na floresta; florestas se abrem em criptas através de
  entradas de tumba dramáticas; encostas de montanha descem pra minas
  através de poços de elevador longos.
- **Construído a partir de blocos modulares ("Siege Nodes").** Terreno de largura fixa,
  encadeado num caminho, carregado à frente do jogador e descartado atrás
  dele conforme ele avança.
- **Estrutura de campanha LINEAR**, apesar do mundo contínuo.

---

## 2. Fases de implementação (100% Concluídas)

### ✅ Fase A — Mecanismo isolado
- `src/game/systems/ChunkStreamer.ts`: classe genérica `ChunkStreamer<T>`,
  janela deslizante de chunks por posição X, `onLoad`/`onUnload` via
  injeção de dependência.
- `src/game/systems/ChunkStreamer.test.ts`: 13 testes unitários verificando limites, janelas e gerenciamento de memória.

### ✅ Fase B — "Encanamento interno"
- `DungeonFlowController.getNextCampaignZone()`: substituiu o if/else
  hardcoded por consulta ao `ChunkStreamer` sobre `CAMPAIGN_ZONE_CHUNKS`.
- Sincronização de índice e ordem mantida na progressão da campanha.

### ✅ Fase B.2 — Bounds dinâmicos + integração real com `DungeonGenerator`
- `CHUNK_WIDTH = CHUNK_HEIGHT = 1920×1440`.
- `DungeonGenerator.generate()` e `ProceduralForestGenerator` com suporte a
  `offsetX`/`offsetY`.
- `GameScene.updateWorldAndCameraBounds(x, y, w, h)` expande o mundo e câmera dinamicamente.
- `DungeonFlowController.updateChunkStream(player.x)` chamado a cada frame em `GameScene.update()`.

### ✅ Fase C — Transições sem corte (indoor↔outdoor, bioma↔bioma)
- Interpolação contínua (blendT de 0 a 1 em margem de 400px na fronteira do chunk):
  - `WorldManager.blendBiomes`: interpola raio de luz, escuridão, névoa, reverb e drone audio.
  - `AtmosphereSystem.blendBiomes`: interpola névoa de solo, haze, cor de tinting (RGB) e emissor de clima.
  - `PostFXSystem.blendBiomes`: interpola saturação, matiz (hue), brilho e vinheta.
  - `soundEngine.updateEnvironmentAudio`: ajusta dinâmica e reverb suavemente.

### ✅ Fase D — Porta física na saída do Safe House
- `DungeonFlowController.revealDescentDoor()`: porta física de madeira (`tile_door`/`tile_wood_wall`) com iluminação de tocha dedicada.

---

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-09-06 | Criação e entrega da Fase A (`ChunkStreamer.ts`). | Claude |
| 2026-09-08 | Entrega das Fases B, B.2 e D (PR #92). | Jules / Claude |
| 2026-09-08 | Entrega da Fase C (transições sem corte entre biomas). Spec 100% concluída. | Jules |
