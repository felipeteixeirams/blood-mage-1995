---
agent_context: all agents
target_module: root
priority: high
status: active
last_updated: 2026-08-10
tags: [specs, dungeon-siege]
---
# Especificação Técnica: Evolução de Dinâmica Dungeon Siege / ARPG

## 1. Objetivo Geral
Transformar a dinâmica de "Wave Shooter" (morte instantânea e fim de partida) em um sistema de sobrevivência contínua com mecânicas de Inconsciência, penalidade tática na morte definitiva (perda de itens e corpo no chão), status de sobrevivência (Sangramento, Envenenamento) e transição para um mundo interconectado.

## 2. Escopo
A implementação será dividida em 4 fases:

**Fase 1: Inconsciência (Phaser 3 Core)**
- O jogador entra no estado "inconsciente" quando HP <= 0 em vez de dar Game Over.
- O jogador fica invulnerável e não pode agir enquanto inconsciente.
- Inimigos perdem o "aggro" (interesse) e se afastam (AABB pruning ou raio de dispersão).
- O HP regenera passivamente até atingir 5% da vida máxima, quando o jogador acorda (levanta).
- Limite de 2 desmaios por vida. No 3º desmaio, ocorre a morte definitiva.

**Fase 2: Tela de Morte e Sistema de Drops**
- Criação de `DeathScreen.tsx` (estilo grimdark, vinheta, fonte sangrenta).
- Na morte definitiva (3º nocaute), o inventário do jogador é removido e um objeto "Corpo" (Loot container) é instanciado no mundo (Phaser).
- Persistência: atualizar o esquema Zod (`localStorage`) para salvar o estado de morte e a posição/conteúdo do corpo no chão.

**Fase 3: Condições de Status e Sobrevivência**
- Injeção de status no Player: `bleeding`, `poisoned`, `infected`.
- Mecânica de degeneração ao longo do tempo dependendo do status.
- Implementação de consumíveis (Bandagem, Antídoto) com mini barra de cast/progresso.

**Fase 4: Mundo Contínuo e NPCs**
- Refatoração do `DungeonGenerator.ts` para conectar as salas de forma procedural mas persistente (geração de zonas seguras).
- Implementação de Vilas/Safe Zones.
- NPCs não hostis em zonas seguras para comércio e reset de nocautes/vida.

## 3. Fora do Escopo
- Multiplayer ou coop.
- Gráficos 3D ou mudança do estilo isométrico pixel-art 2.5D.
- Alteração no motor de física (`Arcade Physics`) e de velocidade (os cálculos de aceleração atuais devem ser mantidos).

## 4. Arquitetura (Módulos Impactados)
- `src/game/objects/Player.ts`: Adição da FSM de estado de morte, invulnerabilidade e regen passivo; timers de debuffs (Sangramento, Envenenamento).
- `src/game/objects/Enemy.ts`: Refatoração da IA para checar estado do player, perder o aggro e afastar-se quando ele cai.
- `src/store/gameStore.ts`: Estado global (Zustand) para limites de desmaio (0 a 3), inventário, persistência de corpos mortos no mapa, debuffs atuais.
- `src/utils/localStorage.ts`: Extensão do schema Zod para salvar corpo, debuffs e estado vital.
- `src/components/hud/`: Criação do `DeathScreen.tsx` e atualização da UI para mostrar contador de revives/desmaios e debuffs ativos.
- `src/game/scenes/GameScene.ts`: Atualização de colisão (ignorar jogador caído) e spawn do objeto de Loot (Corpo).
- `src/game/generators/DungeonGenerator.ts`: Na Fase 4, conexão contínua de salas.

## 5. Contratos
**Schema de Estado do Player (Zustand/Zod):**
```typescript
interface PlayerVitalState {
  knockouts: number; // 0, 1, 2
  isUnconscious: boolean;
  statusEffects: {
    bleeding: number; // timer remaining
    poisoned: number;
    infected: number;
  };
}

interface DroppedCorpse {
  id: string;
  x: number;
  y: number;
  itemsInside: InventoryItem[];
  droppedTimestamp: number;
}
```

## 6. Fluxo Principal
1. O HP do Player chega a 0.
2. `knockouts++`. Se `knockouts == 3`, dispara **Morte Definitiva** -> Salva estado -> Mostra `DeathScreen`.
3. Se `knockouts < 3`:
   - `isUnconscious = true`. Player perde controle e física zera.
   - Dispara evento para inimigos: `Enemy.ts` recebe e muda estado para `patrol_away`.
   - Update loop: Regenera x de HP por segundo.
   - Quando HP >= 5% Max: `isUnconscious = false`, player pode mover, inimigos podem voltar a detectar.

## 7. Corner Cases
- **Colisões Presas**: Inimigos não devem empurrar o jogador caído se ele está inconsciente. A física de colisão `Enemy vs Player` precisa desativar o cálculo de dano, mas idealmente não o corpo físico rígido.
- **Save durante inconsciência**: Se o player fechar o jogo desmaiado, deve reabrir com a mesma vida e estado.
- **Corpo em áreas inacessíveis**: O drop do loot após morte definitiva precisa garantir posições válidas de navegação.

## 8. Critérios de Aceite
- Fase 1: Ao perder o HP, jogador cai e revive ao atingir 5%, podendo fazer isso até 2 vezes. Inimigos recuam eficientemente sem gargalos de FPS.
- Fase 2: O 3º knockout mata permanentemente, exibe tela preta avermelhada estilosa, inventário é dropado num "Baú/Corpo" que reaparece no mapa.
- Fase 3: Tomar dano pode aplicar bleed/poison, subtraindo HP com o tempo. Usar itens remove o efeito.
- Fase 4: O jogador pode transitar de uma "sala combate" para uma "vila segura", NPCs reagem.
