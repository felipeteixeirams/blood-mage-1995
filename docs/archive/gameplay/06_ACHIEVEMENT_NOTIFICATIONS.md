---
agent_context: frontend, game-designer, state-management
target_module: src/components/hud/AchievementToast.tsx, src/store/gameStore.ts, src/data/achievements.json
priority: medium
status: unified (React DOM Overlay + Zustand)
last_updated: 2026-08-27
tags: [gameplay, achievements, notifications, ui, hud, react, zustand, layering]
---

# 🏆 Achievement Notifications & Stats System (Unificado)

> **Nota de Arquitetura (27/08/2026):** O sistema legado de conquistas (`AchievementSystem.ts`) e notificações no canvas (`AchievementNotification.ts`) foi **100% unificado** com a `gameStore.ts`, o arquivo canônico `src/data/achievements.json` e a camada React DOM (`src/components/hud/AchievementToast.tsx`), eliminando duplicação de regras e respeitando a **Guardrail 7 (Strict UI Layering: React DOM vs Phaser Canvas)**.

---

## 📋 Visão Geral

Quando um jogador atinge os requisitos de um achievement (ex: "Slayer 10" ao matar 10 inimigos, ou "First Blood" no primeiro abate), uma notificação visual estilizada em tema gótico surge no topo da tela através de um overlay React:

- **Nome do Achievement** — ex: "SLAYER 10"
- **Descrição** — ex: "Mate 10 inimigos em um único andar"
- **Ícone** — emoji / glifo temático (⚔️, 🩸, 💀, etc)
- **Rewards** — Cristais de Sangue + Talent Points (adicionados automaticamente ao saldo global)
- **Rarity Badge** — Cor e borda indicando raridade (`common`, `rare`, `epic`, `legendary`)
- **Auto-dismiss com saída animada** — 4.5 segundos de exibição com fade/slide.

---

## 🏗️ Arquitetura Unificada (Zustand + React DOM)

### Componentes

```typescript
// 1. Definições Canônicas (src/data/achievements.json)
//    - Catálogo central com 10 achievements canônicos (requisitos, ícones, raridade e recompensas).

// 2. Estado Global & Evaluator (src/store/gameStore.ts)
//    - Gerencia `runStats` e mapa `achievements`.
//    - `incrementRunStat(key, amount)` e `setRunStat(key, value)` avaliam gatilhos em tempo real.
//    - Ao desbloquear, seta `lastUnlockedAchievement` e credita `bloodCrystals` e `talentPoints`.

// 3. UI Overlay (src/components/hud/AchievementToast.tsx)
//    - Subscrito a `lastUnlockedAchievement` da store.
//    - Renderiza Toast gótico 9-slice / border com animação CSS suave.
//    - Auto-dismiss em 4.5s limpando o toast.
```

### Fluxo de Execução

```
Evento de Gameplay (Phaser / React)
        ↓
gameStore.incrementRunStat('kills_total', 1)  [ou setRunStat / onEnemyKilled]
        ↓
gameStore verifica se o threshold do achievement foi atingido
        ↓
Se novo unlock:
  - Marca achievements[id].unlocked = true
  - Persiste via utils/localStorage.ts com validação Zod
  - Incrementa bloodCrystals e talentPoints
  - Atribui lastUnlockedAchievement = { id, title, description, icon, rarity, rewards }
        ↓
AchievementToast.tsx reage à mudança de lastUnlockedAchievement
        ↓
Renderiza Toast animado no topo da tela com Rarity Badge e Recompensas
        ↓
Auto-dismiss limpa o Toast após 4.5 segundos
```

---

## 💻 Implementação

### Componente React Toast

**Arquivo:** `src/components/hud/AchievementToast.tsx`

```tsx
export function AchievementToast() {
  const lastUnlockedAchievement = useGameStore((s) => s.lastUnlockedAchievement);
  const clearLastUnlockedAchievement = useGameStore((s) => s.clearLastUnlockedAchievement);
  // Animação com temporizador de 4.5s
  ...
}
```

### Métodos no Motor Phaser (Chamadas Sincronizadas)

No motor Phaser (`GameScene.ts`, `CollisionHandlers.ts`, `Player.ts`, `CombatEffectsSystem.ts`, `DungeonFlowController.ts`), o código simplesmente notifica as métricas para a store:

```typescript
// Morte de inimigo
useGameStore.getState().incrementRunStat('kills_total', 1);
useGameStore.getState().incrementRunStat('slayer_floor_kills', 1);

// Dano recebido
useGameStore.getState().setRunStat('damage_taken_this_floor', currentDamage);

// Avanço de andar / profundidade
useGameStore.getState().incrementRunStat('depth_cleared', 1);
useGameStore.getState().setRunStat('damage_taken_this_floor', 0);
useGameStore.getState().setRunStat('slayer_floor_kills', 0);

// Desmembramentos de gore
useGameStore.getState().incrementRunStat('dismemberments_total', 1);

// Desmaio / Knockout
useGameStore.getState().incrementRunStat('knockouts_total', 1);
```

---

## 🎯 Achievements Canônicos

| Achievement | Requisito / Stat | Icon | Rarity | Recompensas |
|-------------|------------------|------|--------|-------------|
| **first_blood** | 1 kill total (`kills_total >= 1`) | 🩸 | rare | 25 cristais, 1 talento |
| **slayer_10** | 10 kills no andar (`slayer_floor_kills >= 10`) | ⚔️ | rare | 50 cristais, 2 talentos |
| **slayer_50** | 50 kills no andar (`slayer_floor_kills >= 50`) | 💀 | epic | 100 cristais, 5 talentos |
| **wealth_1000** | 1000 cristais acumulados | 💎 | rare | 100 cristais, 3 talentos |
| **no_damage** | Andar sem dano (`depth_cleared >= 1` & `damage_taken_this_floor == 0`) | 🛡️ | legendary | 150 cristais, 5 talentos |
| **five_knockouts** | 5 knockouts (`knockouts_total >= 5`) | ⚰️ | common | 30 cristais, 1 talento |
| **depth_10** | Andar 10 alcançado (`depth_cleared >= 10`) | 🔻 | epic | 75 cristais, 3 talentos |
| **depth_25** | Andar 25 alcançado (`depth_cleared >= 25`) | 🌑 | legendary | 200 cristais, 10 talentos |
| **all_spells** | 5 feitiços desbloqueados | 📜 | epic | 120 cristais, 5 talentos |
| **speedrun** | Andar 5 em < 5 min | ⏱️ | legendary | 250 cristais, 10 talentos |

---

## 🎨 Styling e Feedback de UI (React DOM)

### Cores por Rarity no Toast

```typescript
const RARITY_COLORS = {
  common:    'border-zinc-600 bg-zinc-950/90 text-zinc-300',
  rare:      'border-blue-700 bg-slate-950/90 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  epic:      'border-purple-700 bg-purple-950/90 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.35)]',
  legendary: 'border-amber-500 bg-amber-950/90 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.45)]',
};
```

---

## ⏱️ Ciclo de Exibição do Toast

```
T=0ms:       Componente monta com animação CSS slide-down/fade-in
T=0-4500ms:  Toast permanece visível com badge de raridade e recompensas (+Cristais / +Talentos)
T=4500ms:    clearLastUnlockedAchievement() reseta o estado e fecha o Toast
```

---

## 📊 Performance e Guardrails

- **UI Layering:** 100% de conformidade com a Guardrail 7 do `AGENTS.md` (Canvas exclusivo para o mundo do jogo; UI em React DOM).
- **Overhead no Phaser:** 0% (elimina criação de `Phaser.GameObjects.Container`/`Graphics`/`Text` para UI).
- **Resiliência:** Validação via Zod schemas em `src/utils/localStorage.ts` para persistência das conquistas desbloqueadas.

---

## ✅ Checklist de Validação

- [x] Conquistas avaliadas centralizadamente pela `gameStore.ts`
- [x] Toast renderizado em React DOM via `AchievementToast.tsx`
- [x] Cores e badges dinâmicos por raridade
- [x] Recompensas creditadas automaticamente no store
- [x] Persistência em `localStorage` com validação Zod
- [x] Zero chamadas legadas de UI no motor Phaser

---

## 📦 Arquivos Envolvidos na Arquitetura Unificada

```
src/
├── data/
│   └── achievements.json           (definições canônicas)
├── store/
│   └── gameStore.ts                (avaliação de regras, runStats, lastUnlockedAchievement)
├── components/hud/
│   └── AchievementToast.tsx        (overlay React DOM para notificação)
└── utils/
    └── localStorage.ts             (persistência segura com Zod)
```
