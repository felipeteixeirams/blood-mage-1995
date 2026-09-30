---
severity: CRITICAL
audience: All Developers & AI Agents
update_frequency: Immediately if changed
agent_context: all devs
target_module: root
priority: high
status: active
last_updated: 2026-09-06
tags: [critical, protected-files]
---

# 🔴 Critical Files — Anti-Regressão Guide

> **LEIA ANTES DE QUALQUER MUDANÇA TÉCNICA.** Este documento lista arquivos cuja modificação incorreta causará regressões graves de funcionalidade, performance ou integridade de estado.

---

## 📌 Regra de Ouro

**Se você não tem 100% de certeza sobre o que está mudando, converse com Felipe antes de fazer commit.**

---

## 🔴 NÍVEL 1: NEVER TOUCH (Risco de Morte)

### src/game/objects/Player.ts

**Por que é crítico:**
- Motor de movimento (aceleração gradual estilo Dungeon Siege 1)
- Sistema de invulnerabilidade (frames)
- Cálculos de delta time
- State global do jogador

**O que NÃO alterar:**
```typescript
// ❌ NÃO MUDE ESTAS LINHAS
private readonly ACCELERATION = 1400;  // Motor de aceleração
private readonly DECELERATION = 1000;  // Desaceleração
// Velocidade base NÃO é uma constante fixa — é calculada dinamicamente em
// getEffectiveMoveSpeed() a partir de `baseMoveSpeed = 160` + bônus de
// talentos/relíquias (stat 'moveSpeed'). Buffs de velocidade entram por
// aí, nunca alterando ACCELERATION/DECELERATION diretamente.

// ❌ NÃO MUDE
updateMovementAndPhysics(dt: number) {
  // Equações precisas de physics e interpolação via _moveToward
}

// ❌ NÃO MUDE o modelo de dano em si (redução do Bone Shield, penalidade
// de infecção, e o contrato de retorno: `true` = morte DEFINITIVA).
// takeDamage() implementa hoje um sistema de 3 quedas/inconsciência —
// não é um simples hp<=0:
takeDamage(amount: number): boolean {
  // ...reduções (Bone Shield, infecção) aplicadas a `amount` antes daqui...
  this.stats.hp = Math.max(0, this.stats.hp - amount);
  if (this.stats.hp <= 0) {
    if (this.stats.knockoutCount < 2) {
      // 1ª/2ª queda: fica inconsciente, NÃO é morte definitiva
      this.stats.isUnconscious = true;
      this.stats.knockoutCount += 1;
      return false;
    }
    // 3ª queda: morte definitiva
    this.stats.isDefinitivelyDead = true;
    return true;
  }
  return false; // sobreviveu ao golpe
}
```

**O que É SEGURO alterar** (mas note que o sistema de nocaute abaixo **já
está implementado** — não é mais roadmap futuro, é comportamento vigente
que precisa ser respeitado, não recriado):
```typescript
// State já existente — ver takeDamage() acima
isUnconscious: boolean;
knockoutCount: number;
isDefinitivelyDead: boolean;

// ✅ SEGURO: Adicionar novos métodos que consultam esse state
// (sem mudar a lógica de takeDamage() em si)
```

**Risk Level:** 🔴 **MORTE** (quebra jogo completamente)

---

### src/game/objects/Enemy.ts

**Por que é crítico:**
- FSM (Finite State Machine) complexa com 6+ estados
- Consome o resultado do raycasting de visão de linha (ver nota abaixo — o raycast em si NÃO vive aqui)
- Audio awareness + hearing range
- AABB pruning para otimização de CPU
- Comportamento de 20+ inimigos simultâneos

**O que NÃO alterar:**
```typescript
// ❌ NÃO MUDE A FSM
updateEnemy(time: number, delta: number, player: Player) {
  switch (this.state) {
    case 'idle': // ...
    case 'patrol': // ...
    case 'investigating': // ...
    case 'combat': // ...
    case 'frenzy': // ...
    case 'flee': // ...
  }
}

// ❌ NÃO MUDE COMO O RESULTADO DE VISÃO É CONSUMIDO. Atenção: Enemy.ts NÃO
// faz o raycast em si — ele recebe o booleano já calculado:
public canSeePlayer(playerX: number, playerY: number, hasWallBetween: boolean): boolean {
  // ...
}
// O raycast real (60x/segundo, performance crítica — qualquer mudança
// aqui = CPU spike) vive em DungeonGenerator.ts:
//   public hasLineOfSight(x1, y1, x2, y2): boolean
// exposto via wrapper fino em GameScene.ts:
//   public hasLineOfSight(...) { return this.dungeonGenerator.hasLineOfSight(...); }
// NÃO MUDE nenhum dos dois.

// ❌ NÃO MUDE O MOVIMENTO
moveToward(x: number, y: number, delta: number) {
  // Sincronizado com Player.ts acceleration model
}
```

**O que É SEGURO alterar:**
```typescript
// ✅ SEGURO: Verificar novo state
if (player.isUnconscious) {
  this.clearTargetAndAggro();
  this.transitionToState('patrol_away_from_player');
  return;
}

// ✅ SEGURO: Adicionar behaviors
if (this.detectedPlayerUnconscious) {
  this.playScavengerBehavior();
}

// ✅ SEGURO: Modificar distâncias (tuning)
const HEARING_RANGE = 300; // Ajustar é OK
```

**Risk Level:** 🔴 **MORTE** (IA quebra, inimigos não funcionam)

---

### src/game/scenes/GameScene.ts

**Por que é crítico:**
- Loop principal de atualização (60x/segundo)
- Sistema de colisão Arcade Physics (Phaser)
- Gerador procedural de calabouço (DungeonGenerator)
- Renderização de iluminação/fog procedural
- Sincronização Player ↔ Enemies ↔ HUD

**O que NÃO alterar:**
```typescript
// ❌ NÃO REMOVA ESTES COLLIDERS
physics.add.collider(player, wallLayer);        // Player vs paredes
physics.add.collider(enemies, wallLayer);       // Inimigos vs paredes
physics.add.overlap(projectiles, enemies);      // Projéteis vs inimigos

// ❌ NÃO MUDE A CHAMADA AO DUNGEON GENERATOR (é de instância, não estática)
const rooms = this.dungeonGenerator.generate(mapW, mapH, biome);
// Mudança aqui = procedural generation quebrada (ver também
// DungeonGenerator.ts na lista de arquivos críticos abaixo)

// ❌ NÃO MUDE O LOOP DE UPDATE
update(time: number, delta: number) {
  // Delta timing é crítico
  // Qualquer mudança na ordem = physics instável
}
```

**O que É SEGURO alterar:**
```typescript
// ✅ SEGURO: Adicionar handlers para novo state
if (player.isUnconscious) {
  this.handlePlayerUnconscious();
}

// ✅ SEGURO: Adicionar VFX/sound
this.playScreenShake(intensity);

// ✅ SEGURO: Adaptar colisão para novo behavior
if (!player.isUnconscious) {
  physics.enable(player);
} else {
  player.setVelocity(0, 0);
}
```

**Risk Level:** 🔴 **MORTE** (física quebra, jogo unplayable)

---

### src/game/systems/DungeonGenerator.ts

**Por que é crítico (adicionado nesta auditoria, 2026-09-06 — faltava
nesta lista apesar de ser tão sensível quanto `GameScene.ts`):**
- Geração procedural completa de masmorras, floresta e Safe House (BSP + autômato celular)
- `hasLineOfSight()` real — o raycast de 60x/segundo que `GameScene.ts` e `Enemy.ts` consomem (ver seção Enemy.ts acima)
- `isTraversable`/falésias via `HeightmapGenerator`
- Autotiling de piso/parede (bitmask de vizinhos) — mudar a lógica de seleção de textura sem entender o bitmask quebra a variedade visual de todos os biomas de uma vez

**O que NÃO alterar:**
```typescript
// ❌ NÃO MUDE a assinatura pública nem a lógica interna sem entender
// TODOS os call sites (GameScene.ts, DungeonFlowController.ts)
public generate(mapW: number, mapH: number, biome: BiomeType): RoomData[]
public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean
```

**O que É SEGURO alterar:**
```typescript
// ✅ SEGURO: adicionar novas variantes de textura/prop via os factories
// já existentes (DungeonDetailFactory, SafeHouseDetailFactory), sem
// tocar na lógica de bitmask/geração em si
```

**Risk Level:** 🔴 **MORTE** (geração procedural quebra em todos os biomas)

---

## 🟠 NÍVEL 2: HANDLE WITH CARE (Alto Risco)

### src/store/gameStore.ts

**Por que é crítico:**
- Estado global (Zustand)
- localStorage persistence + Zod validation
- Afeta todos os componentes React
- Sincronização com Phaser scene

**O que Fazer com Cuidado:**
```typescript
// ⚠️ CUIDADO: Adicionar novo state
newFeature: {...},
setNewFeature: (value) => set({ newFeature: value }),

// ⚠️ CUIDADO: Validação com Zod
const saveNewFeature = (data) => {
  // Use Zod strict parsing!
  const validated = NewFeatureSchema.safeParse(data);
  if (!validated.success) {
    console.error('Invalid data:', validated.error);
    return;
  }
  localStorage.setItem('bloodmage.newFeature', JSON.stringify(validated.data));
}

// ⚠️ CUIDADO: Backward compatibility
// Se alterar schema: Sempre tenha valor default para dados antigos
const loadNewFeature = () => {
  try {
    const raw = localStorage.getItem('bloodmage.newFeature');
    return raw ? JSON.parse(raw) : DEFAULT_NEW_FEATURE;
  } catch {
    return DEFAULT_NEW_FEATURE;
  }
}
```

**Checklist de Mudanças Seguras:**
- [ ] Você usou Zod para validação?
- [ ] Você tem DEFAULT VALUES para dados faltantes?
- [ ] Você testou carregar savegame antigo?
- [ ] Você testou localStorage sendo inacessível?

**Risk Level:** 🟠 **ALTO** (afeta todo jogo)

---

### src/utils/localStorage.ts

**Por que é crítico (adicionado nesta auditoria, 2026-09-06):**
- Concentra TODA validação Zod + persistência (achievements, settings, save game)
- Histórico de incidentes de corrupção de dados já documentado em `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`

**Checklist de Mudanças Seguras:** mesmo checklist de `gameStore.ts` acima
(Zod, defaults, savegame antigo, localStorage inacessível) — este arquivo
é onde essas regras são de fato implementadas.

**Risk Level:** 🟠 **ALTO** (corrupção de dados salvos do jogador)

---

### src/game/PhaserGame.tsx

**Por que é crítico:**
- Inicialização do Phaser Game
- Configuração de scenes
- Modo fullscreen / pixel ratio
- Comunicação entre Phaser ↔ React

**O que Fazer com Cuidado:**
```typescript
// ⚠️ CUIDADO: Registrar nova Scene nesta instância principal
scene: [BootScene, GameScene]
// Só isso — Ordem importa! `TitleScene`, `SettingsScene` e `RecordsScene`
// NÃO fazem parte desta instância: cada uma roda em sua PRÓPRIA instância
// separada de Phaser.Game, criada dentro do componente React equivalente
// (`MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`) — ver
// docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md item 3.

// ⚠️ CUIDADO: Physics configuration
physics: {
  default: 'arcade',
  arcade: {
    gravity: { y: 0 },
    debug: false  // Nunca deixe true em prod
  }
}

// ⚠️ CUIDADO: Scale configuration
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: BASE_W,
  height: BASE_H,
}
```

**Risk Level:** 🟠 **ALTO** (jogo não inicia)

---

## 🟡 NÍVEL 3: MONITOR (Médio Risco)

### src/components/GameplayHUD.tsx

**Por que é crítico:**
- Componente raiz do HUD
- Milhares de re-renders (performance sensível)
- Conecta React ↔ Phaser

**Boas Práticas:**
```typescript
// ✅ Memoize componentes puros
const PlayerStatus = React.memo(({ stats }) => {...});

// ✅ Use useCallback para event handlers
const handleSkillClick = useCallback((skillId) => {
  onSkillClick(skillId);
}, [onSkillClick]);

// ✅ Lazy-load modals (não render se não visível)
{isRecordsOpen && <RecordsDisplay />}

// ❌ NÃO faça
{false && <RecordsDisplay />}  // Still renders! Use conditional above
```

**Risk Level:** 🟡 **MÉDIO** (performance degradation)

---

## 📋 Checklist de Segurança

**Antes de fazer QUALQUER mudança:**

```
- [ ] Identifiquei o arquivo correto?
- [ ] Coloquei em uma das 3 categorias acima?
- [ ] É NÍVEL 1? Converse com Felipe.
- [ ] É NÍVEL 2? Leia o checklist.
- [ ] É NÍVEL 3? Siga boas práticas.
- [ ] Rodei `pnpm run typecheck`?
- [ ] Rodei testes manuais básicos?
- [ ] Comitei com mensagem clara?
```

---

## 🧪 Como Validar Mudanças Seguras

### Teste 1: TypeScript

```bash
pnpm run typecheck
# ✅ Esperado: zero erros
# ❌ Se há erros: não commite!
```

### Teste 2: Verificação Manual

```
Gameplay Test:
1. Iniciar jogo
2. Mover, atacar, castear skills
3. Abrir modals, pausar
4. Fechar/reabrir → verificar persistence

Anti-Regression Test:
1. Testar feature antiga (ex: movimento)
2. Verificar ainda funciona normalmente
3. Sem performance degradation
```

### Teste 3: Performance Profiling

```
DevTools (F12):
1. Abra aba Performance
2. Start recording (10 segundos)
3. Stop e analise
4. Verificar: FPS 60, no janky frames
```

---

## 🔔 Arquivos que Frequentemente Causam Regressões

| Arquivo | Problema Comum | Solução |
|---------|---|---|
| Player.ts | Alterar ACCELERATION | Nunca altere. Use isUnconscious flag. |
| Enemy.ts | Mudar FSM ordem | Nunca altere. Adicione novo state. |
| GameScene.ts | Remover collider | Nunca remova. Adicione condicional. |
| gameStore.ts | Schema mismatch localStorage | Sempre use Zod + defaults. |

---

## 📞 Quando Converse com Felipe

1. **Preciso alterar Player.ts ou Enemy.ts?** → Converse primeiro
2. **Vou remover código existente?** → Converse primeiro
3. **Vou alterar physics/collision?** → Converse primeiro
4. **Tenho dúvida se é seguro?** → Converse primeiro

**Template de mensagem:**

```markdown
Olá Felipe,

Preciso fazer mudança em [ARQUIVO].

Mudança planejada: [DESCRIÇÃO]

Arquivos que vou tocar:
- [Arquivo 1]
- [Arquivo 2]

Arquivos que NÃO vou tocar:
- [Arquivo 3]
- [Arquivo 4]

Testei contra [[01_CRITICAL_FILES.md]] e acho que é seguro?

Posso prosseguir?
```

---

**Última atualização:** 2026-08-09  
**Mantido por:** Claude + Felipe  
**Versão:** 1.0

[[../README.md]] | [[../archive/context/GAME_DESIGNER.md]] | [[00_ANTI_REGRESSION_GUIDE.md]]
