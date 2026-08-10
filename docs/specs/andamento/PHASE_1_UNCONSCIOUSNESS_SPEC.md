---
agent_context: backend, frontend
target_module: artifacts/bloodmage/src/game
priority: high
status: active
last_updated: 2026-08-10
tags: [specs, phase-1, unconsciousness]
---
# Fase 1: Prototipagem da Inconsciência (Phaser 3 Core) - Contrato e Implementação

## 1. Escopo Específico
Implementar a mecânica de desmaio (Inconsciência) em vez da morte instantânea quando o HP do jogador chega a 0. O jogador poderá desmaiar até 2 vezes. No terceiro desmaio, ele morrerá definitivamente. Durante o desmaio, os inimigos perdem o aggro e se afastam, e o jogador se regenera lentamente até voltar com 5% da vida.

## 2. Contratos e Estado
**Zustand Store (`src/store/gameStore.ts`)**
Adicionar os seguintes estados e ações:
```typescript
interface GameState {
  // ... estados existentes ...
  knockouts: number; // Quantas vezes o jogador já desmaiou (0, 1, 2)
  incrementKnockouts: () => void;
  resetKnockouts: () => void;
}
```

**Player Class (`src/game/objects/Player.ts`)**
Adicionar os estados locais:
```typescript
class Player extends Phaser.Physics.Arcade.Sprite {
  // ... 
  public isUnconscious: boolean = false;
  private regenAccumulator: number = 0; // Para calcular regen passivo
}
```

## 3. Comportamento do Jogador (Player.ts)
- **Dano (TakeDamage)**: 
  - Quando HP <= 0, verificar `gameStore.getState().knockouts`.
  - Se for < 2, em vez de disparar `onGameOver`, incremente o contador de knockouts no `gameStore`, defina `isUnconscious = true`, `hp = 0` (visualmente 0 ou 1, mas não morto), zere a velocidade física `setVelocity(0,0)`, mude a tintura/animação para indicar desmaio (ex: sprite deitado ou alfa baixo e tintura vermelha/escura) e aplique invulnerabilidade temporal.
  - Se for >= 2, proceda com o `onGameOver` padrão (Morte definitiva).
- **Update Loop**:
  - Se `isUnconscious == true`: 
    - Bloqueie a leitura de controles (não pode andar, não pode atirar).
    - Aplique uma regeneração passiva de HP (ex: `maxHp * 0.05` ao longo de 5 segundos).
    - Quando o HP atingir ou ultrapassar 5% da vida máxima, `isUnconscious = false`, remova a cor/tintura de desmaio, aplique alguns segundos extras de invulnerabilidade (`invulnerableTimer`) e permita voltar a jogar.
  
## 4. Comportamento da IA dos Inimigos (Enemy.ts)
- No `updateEnemyAI()` ou `update()`:
  - Verificar se `player.isUnconscious` é verdadeiro.
  - Se for verdadeiro e o inimigo estiver focado nele (estados `combat`, `frenzy`, `investigating`):
    - Mudar o estado da IA para `patrol_away_from_player`.
    - `patrol_away_from_player`: Definir um `patrolTarget` usando uma direção oposta ao jogador. Calcular vetor de afastamento simples (ex: `targetX = inimigo.x + (inimigo.x - player.x)`, ajustado por distância) e caminhar para lá, sem precisar calcular pathfinding complexo. Após chegar, pode transicionar para `idle` ou `patrol`.
  - Inimigos não devem causar dano ao jogador se ele estiver no estado `isUnconscious`. Isso pode ser tratado no callback de overlap em `GameScene.ts` ou checando a flag antes do dano.

## 5. Cuidados Técnicos (Anti-Regressão)
- **Zero Instanciação**: No afastamento, usar propriedades nativas e vetores já existentes.
- **Colisões**: Não alterar máscaras de colisão física; bloquear a lógica de "take damage" via flag.
- **Save/Load**: O `gameStore` já é persistido. O campo `knockouts` precisará ser resetado ao começar um novo jogo.

## 6. Passos de Implementação
1. Atualizar `store/gameStore.ts` com `knockouts`.
2. Alterar o método que reseta o jogo (`handleStartGame` em `App.tsx` ou similar) para zerar os `knockouts`.
3. Injetar `isUnconscious` no `Player.ts`.
4. Modificar a lógica de receber dano em `Player.ts`.
5. Modificar a lógica de Update em `Player.ts` para a regeneração.
6. Modificar `Enemy.ts` para checar `isUnconscious` no início de suas decisões e criar comportamento simples de dispersão.
7. Modificar sobreposições na `GameScene.ts` para ignorar `player.isUnconscious`.
