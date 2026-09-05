---
agent_context: all agents
target_module: root
priority: high
status: active
last_updated: 2026-09-03
tags: [project-config, claude-code, architecture, conventions]
---

# 🎮 Bloodmage 1995 — Guia de Configuração Claude Code

Este arquivo orienta agentes Claude Code sobre como trabalhar com o projeto Bloodmage 1995 — um ARPG retro 2D inspirado em Diablo 1995 e Dungeon Siege, desenvolvido com Phaser 4.2.1 + React 19.

## 🎯 Visão Geral do Projeto

**Tipo:** Roguelike ARPG solo em tempo real (Single-Player Action RPG)
**Engine:** Phaser 4.2.1 (WebGL) + React 19 (HUD)
**Estado:** MVP com 4 capítulos de campanha, sistema de habilidades, loot procedural, iluminação dinâmica 2D
**Plataformas:** Web (PWA), Steam (via Electron)

### Pilha Tecnológica
- **Motor:** Phaser 4.2.1 (Arcade Physics + Light2D)
- **Frontend HUD:** React 19 + TypeScript
- **Estado:** Zustand 5 + Zod (validação)
- **UI:** Tailwind CSS v4 + Radix UI + Shadcn UI
- **Áudio:** Web Audio API (síntese procedural + samples)
- **Build:** PNPM (monorepo)

---

## 📂 Estrutura de Código

```
src/
├── components/          # React HUD (Modais, Menus, Overlays)
├── data/               # Configurações JSON (monstros, mágias, talentos, etc)
├── game/
│   ├── objects/        # Entidades físicas (Player, Enemy, Projectile, etc)
│   ├── scenes/         # Cenas Phaser (GameScene, MenuScene, etc)
│   └── systems/        # Lógica desacoplada (Lighting, Combat, AI, etc)
├── hooks/              # React Hooks customizados
├── store/              # Zustand store (gameStore.ts)
├── types/              # TypeScript tipos de domínio
└── utils/              # Utilitários (soundEngine, logger, localStorage)

docs/
├── architecture/       # Padrões técnicos (LEIA PRIMEIRO)
├── critical/          # Anti-regressão e files críticos (LEIA ANTES DE MEXER)
└── specs/             # Especificações de features
```

---

## 🚨 ANTES DE FAZER QUALQUER MUDANÇA

### 1. Leia Estes Arquivos (Ordem Crítica)
1. **`docs/architecture/00_OVERVIEW.md`** — Visão arquitetural geral
2. **`docs/architecture/01_TECH_STACK.md`** — Stack tecnológico
3. **`docs/architecture/02_CODE_ORGANIZATION.md`** — Organização de código
4. **`docs/architecture/03_PHASER_PATTERNS.md`** — Padrões do Phaser (⚠️ CRÍTICO para performance)
5. **`docs/architecture/04_STATE_MANAGEMENT.md`** — Zustand + React ↔ Phaser bridge
6. **`docs/critical/01_CRITICAL_FILES.md`** — Arquivos que NÃO se deve tocar (MUST READ)
7. **`docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md`** — Bugs conhecidos e workarounds
8. **`.claude/skills/` (Phaser 4.2.1 Skills Especializadas)**:
   - `phaser-4-development/SKILL.md`: WebGL2, baking pattern e shaders
   - `phaser-4-animation-tweens/SKILL.md`: Animações, tweens encadeados e FSM de ataque
   - `phaser-4-physics-combat/SKILL.md`: Arcade Physics, hitboxes e poda espacial
   - `phaser-4-fx-filters/SKILL.md`: Beam Renderer, `enableFilters()`, auras e vinhetas
   - `phaser-4-playtest-harness/SKILL.md`: Verificação de runtime e testes de fumaça E2E

### 2. Regras de Ouro

✅ **SEMPRE:**
- Verificar `docs/critical/01_CRITICAL_FILES.md` antes de mexer em `Player.ts`, `Enemy.ts`, ou `GameScene.ts`
- Executar `pnpm verify` após cada mudança maior (sem acumular alterações)
- Rodar suite de testes: `pnpm test` (devem passar 100%)
- Seguir padrão de extração de métodos do `GameScene` (ver `03_PHASER_PATTERNS.md`)
- Documentar mudanças no changelog da spec correspondente

❌ **NUNCA:**
- Modificar cálculos de física em `Player.ts` sem entender deeply (ver Critical Files)
- Tocar na FSM de inimigos (`Enemy.ts` estados) sem validação profunda
- Adicionar UI diretamente ao canvas Phaser (sempre usar React + Zustand bridge)
- Usar `CustomEvent` ou `window.dispatchEvent` para gameplay (só Zustand)
- Fazer alterações acumuladas sem rodar testes entre elas

---

## 🔗 Arquitetura de Estado: Zustand ↔ Phaser

O projeto usa **100% Zustand** para comunicação entre React e Phaser desde 25/08/2026.

### Padrão: Comando + Reset (React → Phaser, baixa frequência)
```typescript
// Em React (ex: GameplayHUD.tsx)
useGameStore.setState({ activeSkillTrigger: 'fireball' });

// Em PhaserGame.tsx useEffect
useEffect(() => {
  if (store.activeSkillTrigger) {
    gameScene?.castSkill(store.activeSkillTrigger);
    store.setActiveSkillTrigger(null); // reset
  }
}, [store.activeSkillTrigger]);
```

### Padrão: Valor + Versão (qualquer direção, alta frequência)
```typescript
// Em Phaser (GameScene.ts)
useGameStore.getState().setPlayerStats({hp: 45, mp: 80});

// Em React (HUD)
const {hp, mp} = useGameStore(s => ({hp: s.stats.hp, mp: s.stats.mp}));
```

**Nunca misture padrões.** Ver `docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md` para histórico completo.

---

## 📊 Sistema de Estados: Zustand Schema

### Campos Críticos (SINCRONIZAR VIA ZUSTAND)
- `stats`: HP, MP, Level, XP (game loop → React em tempo real)
- `inventory`: Equipamentos, loot
- `talentTree`: Estado de habilidades desbloqueadas
- `runStats`: Kills, dano, conquistas (para avaliação de achievements)
- `achievementUnlocks`: Sistema de prêmios automático

Ver `src/store/gameStore.ts` para tipo Zod completo.

---

## ⚡ Padrões de Performance

### 1. **Object Pooling**
Projéteis, efeitos, danos flutuantes são reciclados via `Phaser.GameObjects.Group`.
**Nunca** crie novos objetos no loop de update sem pooling.

### 2. **Spatial Pruning (AI)**
Inimigos filtram por distância quadrática antes de raycasting.
```typescript
// ❌ RUIM: Raycasting em 20 inimigos = lag
enemies.forEach(e => e.hasLineOfSight(player));

// ✅ BOM: Filtrar por distância quadrática primeiro
enemies
  .filter(e => e.distanceSquaredTo(player) < 90000) // ~300px
  .forEach(e => e.hasLineOfSight(player));
```

### 3. **Culling de Câmera**
Objetos fora da viewport são desativados automaticamente.

### 4. **60 FPS Target**
- Phaser/Arcade Physics roda a 60 FPS fixo
- WebGL rendering otimizado
- Fallback automático para Canvas mode se WebGL falhar
- Light2D pipeline com fallback para `darknessOverlay` em Canvas ou `postProcessingEnabled=false`

---

## 🎓 Padrões Phaser Comuns

### Extract/Delegate do GameScene
`GameScene.ts` foi quebrado em sistemas desacoplados. Ao adicionar nova lógica:

1. **Ampliar visibilidade** de campos necessários: `private` → `public` com comentário `// public: usado por NomeDaClasse`
2. **Mover o corpo** para nova classe com `constructor(private scene: GameScene)`
3. **Substituir por wrapper fino** que delega, preservando nome/assinatura exatos
4. **Instanciar em `create()`** respeitando ordem de dependências
5. **Rodar `pnpm verify`** a cada extração (não acumular)

Sistemas já extraídos: `PlayerSkillSystem`, `CollisionHandlers`, `DungeonFlowController`, `ScavengingSystem`, `CombatEffectsSystem`.

---

## 🎨 Sistema de Iluminação Dinâmica 2D

### Light2D Pipeline (Spec 23.03 - COMPLETO)
- `LightingSystem.ts`: Gerencia `ambientColor` por bioma, ponto de luz do jogador
- `LightingPolish.ts`: Glow/bloom em feitiços, itens raros, portais, bosses
- Fallback automático: Canvas mode ou `postProcessingEnabled=false` → `darknessOverlay`

**Não altere** valores de cor/intensidade sem testar em múltiplos biomas (Catacumbas = frio espectral, Santuário = rubro).

---

## 📖 Documentação de Specs

Cada spec segue estrutura padrão:
```yaml
---
agent_context: [backend|frontend|all]
target_module: [src/... ou root]
priority: [high|medium|low]
status: [active|completed|on-hold]
last_updated: YYYY-MM-DD
tags: [categoria, subcategoria]
---
```

### Localização de Specs
- **Ativas/In Progress:** `docs/specs/in-progress/`
- **Entregues:** `docs/specs/delivered/`
- **Backlog:** `docs/specs/backlog/`
- **Discovery (pesquisa):** `docs/specs/discovery/`
- **Rejeitadas:** `docs/specs/rejected/`

Ao completar uma feature:
1. Mover spec de `in-progress/` para `delivered/`
2. Adicionar changelog entry com data e o que foi entregue
3. Referenciar commits relacionados

---

## 🧪 Testes e Validação

### Rodar Suite Completa
```bash
pnpm verify        # Lint + type check + test
pnpm test         # Vitest suite
pnpm test:ui      # Dashboard interativo
```

### Padrão de Testes
- Cada mudança em `.ts` responsável por lógica crítica deve ter regressão test
- Usar `describe`/`it` com nomes descritivos (português ou inglês)
- Exemplo: `VirtualJoystickSystem.test.ts` tem testes para bug de joystick floating/fixed

---

## 🐛 Bugs Conhecidos e Workarounds

Ver `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` para lista completa de:
- Joystick behavior em mobile (fixed vs floating)
- Dialogue tree hardcoding (usar helpers como `getMaelenDialogueTreeId()`)
- Performance spikes em wave 5+ (culling, pooling mitigation)
- Dark mode + Light2D interactions

Sempre consulte antes de abrir novo issue.

---

## 📝 Commits e Workflow Git

### Convenção de Commits
```
feat: <descrição curta da feature>
fix: <descrição do bug corrigido>
docs: <atualização de documentação>
refactor: <reorganização sem alterar behavior>
perf: <otimização>
test: <adição/correção de testes>
```

### Branch Designada
Desenvolver na branch: `claude/frentes-atuacao-projeto-qypbg3`

### Procedure
1. Fetch da branch: `git fetch origin claude/frentes-atuacao-projeto-qypbg3`
2. Checkout: `git checkout claude/frentes-atuacao-projeto-qypbg3`
3. Trabalhar, commit com mensagens claras
4. Push: `git push -u origin claude/frentes-atuacao-projeto-qypbg3`
5. **NÃO abrir PR** a menos que explicitamente solicitado

---

## 🔑 Conceitos-Chave a Compreender

### 1. **Bloodmage (Personagem Principal)**
- Classe: Mago de sangue (Hemomancer)
- Mecânica: Casting de feitiços com custo de vida (não mana clássica)
- Staff: Cajado com pulso carmesim dinâmico no topo (light effect)
- Movimento: Aceleração gradual tipo Dungeon Siege (não movimento instantâneo)

### 2. **Árvore de Talentos Hemomancia**
- Sistema de progressão baseado em Skilltree (tipo Diablo)
- Talentos desbloqueados = cristais de sangue credenciados via achievements
- Estado persistido em Zustand + localStorage

### 3. **Campanha de 4 Capítulos**
- Cap 1: Santuário (intro + tutorial)
- Cap 2: Catacumbas (exploração, lore)
- Cap 3: Cripta Ancestral
- Cap 4: Câmara de Ritual
- Cada capítulo = dialogue tree + quests + loot progression

### 4. **Safe House (Hub)**
- Espaço seguro entre runs
- NPCs com dialogue trees (Maelen = guia principal)
- Acesso a Talent Tree, Inventory, Settings
- Usa sistema de dialogue IDs parametrizados (ex: `getMaelenDialogueTreeId()`)

---

## 🎮 Entidades Principais

| Entidade | Arquivo | Papel |
|----------|---------|-------|
| Player | `src/game/objects/Player.ts` | Personagem do jogador, physics, HP |
| Enemy | `src/game/objects/Enemy.ts` | IA com FSM 6-estado |
| Projectile | `src/game/objects/Projectile.ts` | Feitiços, pooled |
| Trap | `src/game/objects/Trap.ts` | Armadilhas procedurais |
| Scavengeable | `src/game/objects/Scavengeable.ts` | Objetos interativos (barris, etc) |
| Collectible | `src/game/objects/Collectible.ts` | Loot, XP orbs, pooled |

---

## 🔍 Debugging & Observability

### Logger Global
```typescript
import { logger } from '@/utils/logger';
logger.info('GameScene', 'Player spawned at', {x, y});
logger.warn('LootSystem', 'Rare drop', {itemId});
logger.error('CombatSystem', 'Critical error', {error});
```

### DevTools
- React DevTools browser extension
- Zustand DevTools middleware (se habilitado)
- Phaser Debug mode: `?debug=true` na URL

### Performance Profiling
- Chrome DevTools → Performance tab
- Target 60 FPS steadily
- Watch para GC stutters (object pooling falha)

---

## 🤖 Como Este Arquivo Guia Claude Code

Este `CLAUDE.md` orienta agentes Claude para:

1. **Contexto Imediato:** Entender que este é um ARPG Phaser + React, não um jogo casual simples
2. **Segurança:** Identificar arquivos críticos antes de tocar (Player.ts, Enemy.ts, GameScene.ts)
3. **Performance:** Aplicar padrões de pooling, spatial pruning, culling automaticamente
4. **Arquitetura:** Respeitar fluxo 100% Zustand para comunicação Phaser ↔ React
5. **Documentação:** Correlacionar trabalho com specs do projeto, manter changelog
6. **Testing:** Validar com `pnpm verify` antes de finalizar
7. **Workflow:** Desenvolver na branch designada, nunca em main sem autorização

---

## 📞 Contato & Escalations

**Proprietário do Projeto:** Felipe Teixeira (`felipeconceicao@grpereira.com.br`)

Se encontrar:
- ❌ Conflito de arquitetura
- ❌ Performance regression
- ❌ Breaking change em archivos críticos
- ❌ Dúvida sobre integridade de estado

**Converse com Felipe antes de fazer commit.**

---

## 📚 Referência Rápida de Documentos

| Doc | Propósito |
|-----|-----------|
| `docs/architecture/00_OVERVIEW.md` | Big picture da arquitetura |
| `docs/architecture/03_PHASER_PATTERNS.md` | Padrões obrigatórios (pooling, spatial pruning, extract/delegate) |
| `docs/critical/01_CRITICAL_FILES.md` | Arquivos que podem quebrar o jogo |
| `docs/critical/02_PERFORMANCE_OPTIMIZATION.md` | Otimizações validadas |
| `docs/critical/03_TESTING_GATES.md` | Requisitos de testes antes de merge |
| `docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md` | Bugs e workarounds |
| `docs/specs/in-progress/` | Features em desenvolvimento |
| `docs/specs/delivered/` | Features completadas com changelog |

---

**Última atualização:** 2026-09-03  
**Versão:** 1.0 (Inicial)  
**Status:** Ativo e em uso por agentes Claude Code

