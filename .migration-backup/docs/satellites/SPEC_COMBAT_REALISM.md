---
node_type: Satellite
parent_node: /docs/SPEC.md
domain: Combat Mechanics & Realism Architecture
token_weight: Medium (~700 tokens)
---

# ⚔️ Spec: Combat Realism & Attack Telegraphing Engine

## 1. Objetivo Geral
Eliminar o dano instantâneo por aproximação/colisão de corpo ("touch damage") em inimigos corporais. Implementar uma Máquina de Estados Finita de Ataque (Attack State Machine) com telegrafia realista (Windup -> Strike -> Recovery), cálculo dinâmico de esquiva (**MISS!**), acertos críticos (**CRIT!**), feedback de combate com dano flutuante e sonorização de telegrafia.

---

## 2. Escopo & Fora do Escopo
- **Entra**:
  - FSM de ataque nos inimigos (`windup`, `strike`, `recovery`, `none`).
  - Animação procedural de preparação (recuo de corpo, tinting vermelho de aviso, deformação de corpo `setScale` e som `playTelegraph`).
  - Investida rápida de golpe (`strike`) com verificação de alcance dinâmico (`distanceToPlayer <= attackRange + margin`).
  - Notificação visual de esquiva (`MISS!`) se o jogador sair do raio de acerto durante a janela de vento.
  - Sistema de dano flutuante em tempo real para o jogador e inimigos (Branco = Normal, Amarelo = Crítico, Verde = Cura, Roxo = Siphon, Vermelho = Dano recebido).
  - Multiplicadores de acerto crítico (15% de chance base para 1.75x de dano).
  - Partículas visuais de brasas em suspensão no ambiente (`dungeon embers`).
  - Sequência de Combos com multiplicador flutuante (`3x COMBO!`, `5x COMBO!`).

- **Não Entra**:
  - Dano por projétil ou auras que continuam atingindo em área (estas são mecânicas intencionais de zona/ambiente).

---

## 3. Arquitetura & Módulos Impactados
- `src/game/objects/Enemy.ts`:
  - Propriedades de FSM (`attackPhase`, `attackPhaseEndTime`, `attackTargetPos`, `attackType`).
  - Atualização do loop de IA para desacelerar durante a telegrafia e disparar lunge no strike.
- `src/game/scenes/GameScene.ts`:
  - Método `spawnFloatingText(...)` e `spawnMeleeSlashEffect(...)`.
  - Método `registerKillCombo(...)`.
  - Integração de cálculo de dano crítico e vampirismo com números em tela.
- `src/utils/soundEngine.ts`:
  - Métodos sintetizados Web Audio: `playTelegraph()` e `playSwing()`.

---

## 4. Contratos & Tipos (TypeScript)

```typescript
export type AttackPhase = 'none' | 'windup' | 'strike' | 'recovery';

export interface EnemyUpdateResult {
  attack: boolean;
  damage: number;
  attackType?: 'melee' | 'ranged';
  dodged?: boolean;
}
```

---

## 5. Critérios de Aceite & Testes
1. NENHUM inimigo causa dano ao jogador apenas encostando nele sem telegrafar o golpe primeiro.
2. Todo golpe telegrafado exibe brilho de aviso e reproduz efeito sonoro de preparação.
3. Movimentar-se para fora do raio do golpe durante a preparação faz o ataque falhar e exibir a mensagem `MISS!`.
4. Os testes do TypeScript / Linter passam sem nenhum erro (`npm run lint` / `tsc --noEmit`).
