---
role: Game Designer / Google Jules
complexity: High
tokens_est: 4000
depends_on: [[../features/00_DUNGEON_SIEGE_EVOLUTION.md]]
related_to: [[../gameplay/00_CORE_MECHANICS.md]], [[../design/00_DESIGN_PHILOSOPHY.md]]
meta_prompt: |
  Você é Google Jules, especialista em game design do Bloodmage 1995.
  Leia especificações do Discovery antes de implementar mecânicas.
  SEMPRE consulte [[../critical/01_CRITICAL_FILES.md]] - NÃO altere Enemy.ts, Player.ts sem aviso.
  Após mudanças: valide contra [[../critical/03_TESTING_GATES.md]]
agent_context: game designer
target_module: n/a
priority: high
status: active
last_updated: 2026-08-09
tags: [context, game-design]
---

# 🎮 Game Designer Context — Bloodmage 1995

> **Para Google Jules:** Roadmap e mecânicas do jogo. Sua responsabilidade é implementar features de gameplay mantendo qualidade e integridade de mechanics.

---

## 🎯 Responsabilidades

- ✅ Implementar mecânicas de jogo (Fase 1-4)
- ✅ Balancear dificuldade e tensão
- ✅ Definir comportamento de inimigos (IA)
- ✅ Sistema de loot e economia
- ✅ Pacing e progression
- ✅ Experiência do jogador (feel)
- ⚠️ **NÃO alterar:** Phaser physics, colisão (sem aviso)

---

## 📋 Roadmap: Fases de Implementação

### Fase 1: Sistema de Inconsciência ✅ *Em Progresso*

**Status:** Discovery doc completo, aguardando implementação coordenada

**O que implementar:**
```typescript
Player.ts:
├── isUnconscious: boolean
├── knockoutCount: number (0-2 por sessão)
├── hpRegenDuringUnconscious(): void
└── transitionToUnconscious(): void

Enemy.ts:
├── Detectar player.isUnconscious
├── clearAggro() quando player desmaiar
├── moveAwayFromBody() (afastamento radial)
└── resumeNormalBehavior()
```

**Spec Completa:** [[../features/01_INCONSCIOUSNESS_PHASE1.md]]

**Anti-Regressão:** [[../critical/01_CRITICAL_FILES.md]]

### Fase 2: Tela de Morte & Drops 🔲 *TODO*

**O que implementar:**
- Menu "Você está morto" (estilo grimdark anos 90)
- Système de drops de inventário ("corpo")
- Despawn progressivo de loot
- Persistência de morte em localStorage

**Spec:** [[../features/02_DEATH_SCREEN_PHASE2.md]]

### Fase 3: Status de Sobrevivência 🔲 *TODO*

**O que implementar:**
- Sangramento (drain HP ao andar)
- Envenenamento (drain HP contínuo)
- Infecção (reduz HP máx, bloqueia regen)
- Consumíveis de cura (bandagens, antídotos)

**Spec:** [[../features/03_STATUS_CONDITIONS_PHASE3.md]]

### Fase 4: Mundo Contínuo & NPCs 🔲 *TODO*

**O que implementar:**
- Vilas como safe zones (físicas no mapa)
- NPCs interativos (Clérigo, Mercador, Ferreiro)
- Mini-chefes como bloqueadores de progresso
- Narrativa ambiental (documentos, pergaminhos)

**Spec:** [[../features/04_CONTINUOUS_WORLD_PHASE4.md]]

---

## 📊 Matriz de Mecânicas Atuais

| Sistema | Status | Lead | Próximo |
|---------|--------|------|---------|
| **Movement** | ✅ Completo | Phaser | Integrar roll/esquiva |
| **Combat** | ✅ Completo | Phaser | Refinar feel |
| **Skills** | ✅ Completo | Felipe | Balancear cooldowns |
| **Loot** | ✅ Parcial | Felipe | Adicionar drop rates |
| **AI Inimigos** | ✅ Parcial | Jules | Adicionar behaviors |
| **Inconsciência** | 📝 Discovery | Jules | **Implementar** |
| **Morte/Drops** | 📝 Discovery | Jules | Implementar |
| **Status Effects** | 📝 Discovery | Jules | Implementar |
| **Vilas/NPCs** | 📝 Discovery | Jules | Implementar |

---

## ⚠️ Arquivos Críticos (NÃO ALTERAR SEM AVISO)

### 🔴 ALTAMENTE CRÍTICOS (Risk: Regressão total)

```typescript
artifacts/bloodmage/src/game/objects/Player.ts
├── ⚠️ Motor de aceleração (ACCELERATION, DECELERATION)
├── ⚠️ Cálculos de delta time
├── ⚠️ invulnerableTimer / isInvulnerable logic
└── ✅ SEGURO: Adicionar isUnconscious state

artifacts/bloodmage/src/game/objects/Enemy.ts
├── ⚠️ FSM transitions (idle→patrol→combat→frenzy)
├── ⚠️ hasLineOfSight() raycasting
├── ⚠️ Audio awareness + hearing
└── ✅ SEGURO: Interceptar update para verificar player.isUnconscious

artifacts/bloodmage/src/game/scenes/GameScene.ts
├── ⚠️ Arcade Physics colliders (physics.add.collider)
├── ⚠️ DungeonGenerator.ts (gerador procedural)
└── ✅ SEGURO: Adicionar handlers para novo state
```

**Leia:** [[../critical/01_CRITICAL_FILES.md]]

---

## 🎮 Core Mechanics Atual

### Movement (Dungeon Siege 1 style)

```typescript
// Aceleração gradual, não instantâneo
velocity += acceleration * deltaTime
velocity = Math.min(velocity, maxSpeed)
```

**NÃO mude:** Equações de física

**SEGURO:** Adicionar animações/VFX

### Combat Feel (Blood Splatters, Screen Shake)

```typescript
// Hit feedback
├── Blood splatters (procedural)
├── Screen shake (Phaser camera)
└── SFX + screenshake sync
```

**Spec:** [[../gameplay/02_COMBAT_FEEL.md]]

### Skill System (Mana-based)

```typescript
Spell {
  cooldown: number
  manaCost: number
  castTime: number
  effect: void
}
```

**Balancear:** cooldowns, mana costs, durations  
**Consulte:** [[../gameplay/03_SKILL_SYSTEM.md]]

---

## 🎯 Anti-Regressão: Checklist Obrigatório

**ANTES de qualquer mudança em Enemy.ts ou Player.ts:**

- [ ] Li [[../critical/01_CRITICAL_FILES.md]]?
- [ ] Minha mudança toca em movimento/aceleração?
- [ ] Minha mudança toca em FSM transitions?
- [ ] Testei colisão (projéteis, inimigos vs paredes)?
- [ ] Rodei `pnpm run typecheck` (zero erros TS)?
- [ ] Fiz teste de estresse 3x desmaios consecutivos?

Se SIM em qualquer checkbox: converse com Felipe antes.

**Teste de Estresse Obrigatório:** [[../critical/03_TESTING_GATES.md]]

---

## 💬 Comunicação com Felipe

**Antes de implementar Fase 1-4:**

```markdown
Olá Felipe,

Vou implementar [Fase X: Nome].

Mudanças planejadas:
- Player.ts: adicionar isUnconscious, knockoutCount
- Enemy.ts: interceptar updateEnemy, verificar player state
- GameScene.ts: adicionar handler para desmaio

Arquivos que NÃO vou tocar:
- Motor de aceleração
- FSM core logic
- Phaser physics colliders

Preciso de aprovação? [Sim/Não]

Validarei contra: [[../critical/03_TESTING_GATES.md]]
```

---

## 🧪 Testing Gates (Validação Obrigatória)

**Antes de fazer push:**

```bash
# 1. Typecheck
pnpm run typecheck
# Resultado esperado: zero erros

# 2. Teste manual
# - Iniciar partida
# - Forçar 3 desmaios
# - Validar comportamento inimigos
# - Verificar estado HUD

# 3. Performance
# - Abrir DevTools (F12)
# - Verificar frame rate (60 FPS)
# - Verificar memory leaks
```

**Spec Completa:** [[../critical/03_TESTING_GATES.md]]

---

## 📊 Metricas de Game Feel

### O que Medir

```typescript
// AI Responsiveness
└─ Distance between player action → visual feedback: <100ms

// Combat Feedback
└─ Hit detection → blood splatter: <50ms
└─ Enemy death → loot drop: <200ms

// Skill Casting
└─ Button press → spell start: <150ms
└─ Spell visual → damage applied: <200ms

// Performance
└─ Framerate: 60 FPS (desktop), 30+ (mobile)
└─ Memory: <150MB (mobile)
```

---

## 🎨 Design Philosophy

**Core Pillars:** [[../design/00_DESIGN_PHILOSOPHY.md]]

```
1. "Nostalgic Dread" (Diablo 1, Dungeon Siege 1, Dead Frontier 2)
   → Atmospherics: Dark, foreboding, discovery-driven

2. "Tactical Tension" (Risk/Reward decisions)
   → Player feels vulnerable, but capable
   → Resources are limited (mana, potions, lives)

3. "Organic Progression" (No level gates)
   → Continuous world, mini-bosses as gates
   → Death is consequential, not frustrating

4. "80s-90s Pixel Aesthetic"
   → Retro pixel art (16-bit era)
   → Nostálgico mas moderno (React UI overlay)
```

---

## 🔗 Documentação Crítica

**Ler ANTES de implementar:**
1. [[../features/00_DUNGEON_SIEGE_EVOLUTION.md]] - Overview completo
2. [[../critical/01_CRITICAL_FILES.md]] - Arquivos legados
3. [[../gameplay/00_CORE_MECHANICS.md]] - Mecânicas base
4. [[../critical/00_ANTI_REGRESSION_GUIDE.md]] - Como não quebrar tudo

**Leia APÓS implementar:**
1. [[../critical/03_TESTING_GATES.md]] - Validação
2. [[../critical/02_PERFORMANCE_OPTIMIZATION.md]] - Otimização

---

## 🚀 Workflow Típico (Jules)

```
1. Felipe envia task: "Implementar Fase X"
   ↓
2. Leia CONTEXTO (este arquivo)
   ↓
3. Leia spec da feature (ex: [[../features/01_INCONSCIOUSNESS_PHASE1.md]])
   ↓
4. Consulte [[../critical/01_CRITICAL_FILES.md]] (o que NÃO tocar)
   ↓
5. Implemente em seu próprio branch
   ↓
6. Valide contra [[../critical/03_TESTING_GATES.md]]
   ↓
7. Faça PR com referência à spec
   ↓
8. Felipe + Claude revisar
   ↓
9. Merge para main
```

---

**Última atualização:** 2026-08-09  
**Mantido por:** Felipe + Jules  
**Versão:** 1.0

[[../README.md]] | [[FRONTEND_DEVELOPER.md]] | [[BACKEND_DEVELOPER.md]] | [[QA_ENGINEER.md]]
