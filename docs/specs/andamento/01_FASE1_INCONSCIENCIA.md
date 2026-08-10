---
status: ANDAMENTO
phase: 1/4
priority: P0
start_date: 2026-08-09
eta: 2026-08-25
responsible: Jules (Google AI)
progress: 25% (Discovery pronto)
agent_context: backend, frontend
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-10
tags: [specs, phase-1, unconsciousness]
---

# 🟡 Fase 1: Sistema de Inconsciência

> **Status:** Em desenvolvimento | **Prioridade:** P0 (Crítica) | **Tokens:** 4000

---

## 📋 Visão Geral

**Objetivo:** Substituir sistema de morte abrupta (game over) por sistema de desmaio (knockouts) com limite de 2 tentativas.

**Impacto:** Muda fundamentalmente a experiência de morte (menos frustração, mais tática).

---

## 📝 Requisitos Funcionais

### Must Have (MVP)

- [ ] Player HP <= 0 → transição para estado `isUnconscious` (não game over)
- [ ] Sprite do player muda (desmaiado/caído)
- [ ] Inimigos param de atacar (aggro loss)
- [ ] Inimigos se afastam radialmente do corpo do player
- [ ] HP regenera lentamente (~1 HP/seg) durante desmaio
- [ ] Player se levanta ao atingir 5% do HP máximo
- [ ] Contador de desmaios: 1 → 2 → 3 (morte definitiva)
- [ ] 3º desmaio → "Você está morto" screen aparece
- [ ] Estado persiste em localStorage
- [ ] HUD atualiza com status "Inconsciente"

### Nice to Have

- [ ] Animação de caída/levantamento suave
- [ ] VFX de desmaio (stars, shaking camera)
- [ ] SFX de desmaio + reviver
- [ ] Tooltip explicando mecânica ao primeiro desmaio

### Fora do Escopo (Fase 2+)

- Menu de morte com opções (esse é Fase 2)
- Drop de items (Fase 2)
- Persistência de corpo no mapa (Fase 2)

---

## 🎮 Fluxo de Gameplay

```
[Jogador com HP > 0]
        ↓
[Sofre ataque, HP cai]
        ↓
[HP atinge 0]
        ↓
[TRANSIÇÃO] Desmaio visual
        ↓
[INCONSCIENTE] 
├─ Inimigos param de atacar
├─ Inimigos se afastam
├─ Player imune a dano
└─ HP regenera lentamente
        ↓
[HP atinge 5%]
        ↓
[REVIVER] Player se levanta
├─ Extremamente vulnerável
├─ Knockoutcount += 1
└─ Pode fugir ou lutar
        ↓
Se knockoutCount == 3:
└─ [MORTE DEFINITIVA] Game Over screen
```

---

## 🛠️ Implementação Técnica

### Arquivos a Modificar

```
artifacts/bloodmage/src/game/objects/Player.ts
├── ✅ SEGURO: Adicionar
│   ├─ isUnconscious: boolean
│   ├─ knockoutCount: number
│   ├─ transitionToUnconscious(): void
│   ├─ regenerateHealthWhileUnconscious(): void
│   └─ wakeUp(): void
└─ ❌ NUNCA: Alterar motor de aceleração

artifacts/bloodmage/src/game/objects/Enemy.ts
├── ✅ SEGURO: Adicionar
│   ├─ Verificar player.isUnconscious no update
│   ├─ clearTargetAndAggro() se player desmaiado
│   ├─ moveAwayFromBody() (afastamento radial)
│   └─ resumeNormalBehavior()
└─ ❌ NUNCA: Alterar FSM transitions

artifacts/bloodmage/src/game/scenes/GameScene.ts
├── ✅ SEGURO: Adicionar
│   ├─ Handler para desmaio
│   ├─ Pausa de input durante desmaio
│   └─ Levantamento de inimigos
└─ ❌ NUNCA: Remover colliders

artifacts/bloodmage/src/store/gameStore.ts
├── ✅ SEGURO: Adicionar
│   ├─ knockoutCount: number
│   └─ Reset ao visitar vila segura (Fase 4)
└─ ✅ Zod validation para persistência
```

### Code Skeleton (Player.ts)

```typescript
export class Player extends Phaser.Physics.Arcade.Sprite {
  // ... existing code ...

  // NEW: Inconscious state
  isUnconscious: boolean = false;
  knockoutCount: number = 0;
  
  transitionToUnconscious(): void {
    this.isUnconscious = true;
    this.setVelocity(0, 0);  // Parar movimento
    this.playKnockedOutAnimation();
  }

  regenerateHealthWhileUnconscious(delta: number): void {
    if (!this.isUnconscious) return;
    const regenRate = 1; // 1 HP/seg
    this.stats.hp = Math.min(
      this.stats.maxHp * 0.05,
      this.stats.hp + (regenRate * delta / 1000)
    );
    
    if (this.stats.hp >= this.stats.maxHp * 0.05) {
      this.wakeUp();
    }
  }

  wakeUp(): void {
    this.isUnconscious = false;
    this.knockoutCount++;
    this.playWakeUpAnimation();
    
    if (this.knockoutCount >= 3) {
      this.triggerDefiniteDeath();
    }
  }

  takeDamage(amount: number): boolean {
    if (this.isUnconscious) return false; // Imune enquanto desmaiado
    
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    
    if (this.stats.hp <= 0) {
      this.transitionToUnconscious();
      return true;
    }
    return false;
  }
}
```

### Code Skeleton (Enemy.ts)

```typescript
updateEnemyAI(player: Player, delta: number): void {
  // NEW: Check if player is unconscious
  if (player.isUnconscious) {
    if (this.state === 'combat' || this.state === 'frenzy') {
      this.clearTargetAndAggro();
      this.moveAwayFromBody(player.x, player.y, delta);
    }
    return;
  }

  // ... existing AI logic ...
}

moveAwayFromBody(playerX: number, playerY: number, delta: number): void {
  const dx = this.x - playerX;
  const dy = this.y - playerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const moveX = (dx / dist) * this.speed * delta / 1000;
    const moveY = (dy / dist) * this.speed * delta / 1000;
    
    this.setVelocity(moveX, moveY);
  }
}
```

---

## 🧪 Testing Gates

### Gate 1: TypeScript Strict
```bash
pnpm run typecheck
# ✅ Esperado: zero erros
```

### Gate 2: Teste Manual de Desmaio

**Cenário 1: Primeiro desmaio**
```
1. [ ] Iniciar partida
2. [ ] Sofrer dano até HP <= 0
3. [ ] Player entra em estado desmaio (sprite muda)
4. [ ] Inimigos param de atacar ✅
5. [ ] Inimigos se afastam ✅
6. [ ] HP regenera lentamente ✅
7. [ ] Após ~5 segundos, player se levanta ✅
8. [ ] knockoutCount = 1 ✅
9. [ ] HUD mostra status correto ✅
```

**Cenário 2: Segundo desmaio**
```
1. [ ] Player sofre novo dano letal
2. [ ] Repete Cenário 1
3. [ ] knockoutCount = 2 ✅
```

**Cenário 3: Morte (3º desmaio)**
```
1. [ ] Player sofre novo dano letal
2. [ ] Desmaio acontece normalmente
3. [ ] Ao atingir 5% HP, antes de levantar...
4. [ ] knockoutCount == 3
5. [ ] "Você está morto" screen aparece ✅
6. [ ] Game over sem opções (Fase 2 vai ter opções)
```

### Gate 3: Anti-Regressão

- [ ] Teste movimento normal (não desmaiado) - ainda funciona?
- [ ] Teste ataque de inimigo normal - ainda funciona?
- [ ] Teste colisão com paredes - player não atravessa?
- [ ] FPS permanece 60?

### Gate 4: Performance

- [ ] Adicionou 20+ inimigos, todos afastando simultaneamente?
- [ ] FPS cai abaixo de 60? Se sim, otimizar!
- [ ] Memory leak ao desmaiar múltiplas vezes?

---

## 📊 Critérios de Aceite (Definition of Done)

- [x] Spec detalhada ([[../../features/01_INCONSCIOUSNESS_PHASE1.md]])
- [ ] Code review aprovado
- [ ] Todos os testing gates passaram
- [ ] PR mergeado em main
- [ ] Deploy em staging validado
- [ ] Documentação atualizada
- [ ] Spec movida para finalizadas//

---

## 🔗 Documentação Relacionada

- **Spec Detalhada:** [[../../features/01_INCONSCIOUSNESS_PHASE1.md]]
- **Context (Jules):** [[../../context/GAME_DESIGNER.md]]
- **Critical Files:** [[../../critical/01_CRITICAL_FILES.md]]
- **Testing Gates:** [[../../critical/03_TESTING_GATES.md]]
- **Discovery completo:** [[../../legacy/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md]]

---

## 📈 Progresso

```
Discovery ████████████████████ 100% ✅
Design    ████████████████░░░░  80% (Feedback do Jules)
Develop   ████░░░░░░░░░░░░░░░░  20% (Skeleton pronto)
Test      ░░░░░░░░░░░░░░░░░░░░   0% (Aguardando código)
Deploy    ░░░░░░░░░░░░░░░░░░░░   0% (Aguardando teste)
```

---

## 📅 Timeline

```
2026-08-09 | Discovery completa ✅
2026-08-15 | Implementação 50%
2026-08-20 | QA + Fix bugs
2026-08-25 | Deploy
```

---

## 🎯 Próximos Passos

1. Jules inicia implementação (código skeleton pronto)
2. Felipe valida contra critical//01_CRITICAL_FILES.md
3. Teste manual de 3 desmaios consecutivos
4. PR para main com referência a spec
5. Deploy em staging
6. Move para finalizadas//

---

**Responsible:** Jules (Google Jules AI)  
**Lead:** Felipe  
**Status:** Pronto para implementação  

[[../../README.md]] | [[../README.md]] | [[../../features/01_INCONSCIOUSNESS_PHASE1.md]]
