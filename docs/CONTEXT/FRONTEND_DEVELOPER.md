---
role: Frontend Developer / Claude AI
complexity: Medium-High
tokens_est: 3000
depends_on: [[../ARCHITECTURE/04_STATE_MANAGEMENT.md]]
related_to: [[../DESIGN/02_UI_PATTERNS.md]], [[../GAMEPLAY/05_RECORDS_SYSTEM.md]]
meta_prompt: |
  Você é Claude, assistente de IA especializado em frontend do Bloodmage 1995.
  Use esta documentação para entender contexto. NÃO leia código-fonte completo.
  Após qualquer implementação: valide contra [[../CRITICAL/03_TESTING_GATES.md]]
---

# 🎨 Frontend Developer Context — Bloodmage 1995

> **Para Claude + Frontend Devs:** Contexto mínimo para trabalhar em UI/UX e integração Lovable.

---

## 🎯 Responsabilidades

- ✅ Componentes React (TailwindCSS + Lucide)
- ✅ Integração Phaser → React (game canvas)
- ✅ HUD e overlays do jogo
- ✅ Modals (Records, Inventário, Pause)
- ✅ Sistema de temas (paletes de cores)
- ✅ Responsividade (mobile-first)
- ✅ Performance visual (zero frame drops)

---

## 📁 Arquivos Críticos (NÃO ALTERAR SEM AVISO)

```typescript
// ⚠️ CRITICAL FILES (Phaser/Game State)
artifacts/bloodmage/src/game/PhaserGame.tsx          // Game engine init
artifacts/bloodmage/src/game/scenes/GameScene.ts    // Main game loop
artifacts/bloodmage/src/components/GameplayHUD.tsx  // Master HUD controller

// ✅ SAFE TO MODIFY
artifacts/bloodmage/src/components/hud/*.tsx        // UI components
artifacts/bloodmage/src/components/*.tsx             // Modals & screens
artifacts/bloodmage/src/index.css                   // Styling
```

Consulte [[../CRITICAL/01_CRITICAL_FILES.md]] para detalhes completos.

---

## 🏗️ Arquitetura Frontend

### Stack

```
React 18 + TypeScript
├── State Management: Zustand ([[../ARCHITECTURE/04_STATE_MANAGEMENT.md]])
├── Styling: TailwindCSS
├── Icons: Lucide React
├── Game Engine: Phaser 3
└── Build: Vite
```

### Fluxo de Dados

```
User Input (Mouse/Touch/Gamepad)
    ↓
GameplayHUD (React) ← reads/writes
    ↓
Zustand Store (useGameStore)
    ↓
Phaser GameScene (Physics, Collision)
    ↓
Enemy AI, Combat, Visuals
    ↓
Re-render HUD (React reconciliation)
```

Detalhes: [[../ARCHITECTURE/04_STATE_MANAGEMENT.md]]

---

## 🎮 Componentes Principais

### HUD (Head-Up Display)

**Arquivo:** `artifacts/bloodmage/src/components/GameplayHUD.tsx`

Elementos principais:
- **Player Status** - HP, Mana, XP bar
- **Skills Overlay** - Ability buttons (bottom-right)
- **Joystick Visual** - Move + Aim joysticks
- **Inventory Modal** - Equipment/items
- **Pause Modal** - Resume/Settings
- **Records Display** - High scores modal ✨ *novo*

**Key Props:**
```typescript
interface GameplayHUDProps {
  getCooldownRemaining: (spellId: string) => number;
}
```

**Related:** [[../GAMEPLAY/05_RECORDS_SYSTEM.md]], [[../DESIGN/02_UI_PATTERNS.md]]

### Records Display Modal

**Arquivo:** `artifacts/bloodmage/src/components/hud/RecordsDisplay.tsx`

Renderiza tabela de top 8 recordes:
- Carrega dados de `localStorage` (key: `bloodmage.records`)
- Design harmonizado (ouro/dark theme)
- Top 3 com glow + cores especiais
- Botão FECHAR

**Hook de controle:**
```typescript
const { isRecordsOpen, setRecordsOpen } = useGameStore();
```

**Spec:** [[../GAMEPLAY/05_RECORDS_SYSTEM.md]]

### Lovable-Generated Components

**Status:** ✅ Integrados com sucesso

Components from Lovable:
- `BloodmageTitle.tsx` (Menu title scene)
- `BloodmageRecords.tsx` (Phaser RecordsScene)
- Troféu pixel-art

Integração: [[../INTEGRATION/00_LOVABLE_INTEGRATION.md]]

---

## 🎨 Design System

### Paletas de Cor

```json
{
  "primary": {
    "gold": "#e0b34a",
    "dark_gold": "#7a5312",
    "light_gold": "#ffe9a8"
  },
  "ui": {
    "bg_dark": "#181211",
    "border": "#5b403c",
    "accent": "#ab8983"
  },
  "status": {
    "hp": "#ff3333",
    "mana": "#5a189a",
    "xp": "#4169e1"
  }
}
```

**Arquivo de dados:** `artifacts/bloodmage/src/data/palettes.json`

### UI Patterns

**Padrões reutilizáveis:** [[../DESIGN/02_UI_PATTERNS.md]]
- Modal backdrop (blur + overlay)
- Button states (hover, active, disabled)
- Input fields (estilo retro)
- Badges/tags (raridade de items)
- Progress bars (HP, XP, cooldown)

---

## 🪝 Hooks Customizados

### useGameStore()

```typescript
// Exemplo de usage
const {
  playerStats,
  setPlayerStats,
  isInventoryOpen,
  setInventoryOpen,
  isRecordsOpen,
  setRecordsOpen,
  settings,
  updateSettings
} = useGameStore();
```

**Arquivo:** `artifacts/bloodmage/src/store/gameStore.ts`

**Seções principais:**
- playerStats (HP, XP, level, equipment)
- UI state (modal opens, settings)
- Combat state (active skill, cooldowns)
- Persistence (localStorage + Zod validation)

**Details:** [[../ARCHITECTURE/04_STATE_MANAGEMENT.md]]

### useFloatingJoystick()

```typescript
const joystick = useFloatingJoystick({
  type: 'relative',
  callback: (x, y) => { /* handle input */ }
});
```

Gerencia joystick virtual (move + aim) com touch/gamepad.

---

## 📱 Responsividade

### Breakpoints (TailwindCSS)

```
sm: 640px   → Pequenos phones
md: 768px   → Tablets
lg: 1024px  → Desktops
```

### HUD Layout

```
Desktop:
┌─────────────────────────────────┐
│ Status (tl)   Trophy (tr)       │
├─────────────────────────────────┤
│                                 │
│   GAME CANVAS (Phaser)          │
│                                 │
├─────────────────────────────────┤
│ Joystick (bl)  Skills (br)      │
└─────────────────────────────────┘

Mobile:
┌────────────────┐
│ Status (small) │
├────────────────┤
│  Game Canvas   │
│    (Phaser)    │
├────────────────┤
│  Joysticks     │
│  Stacked       │
└────────────────┘
```

---

## 🎯 Tarefas Comuns

### Tarefa 1: Adicionar novo Modal

**Checklist:**
1. Criar componente `src/components/YourModal.tsx`
2. Adicionar state em `gameStore.ts` (`isYourModalOpen`, `setYourModalOpen`)
3. Integrar em `GameplayHUD.tsx` (render condicional)
4. Estilizar com TailwindCSS (seguir [[../DESIGN/02_UI_PATTERNS.md]])
5. Validar contra [[../CRITICAL/03_TESTING_GATES.md]]

**Template:**
```typescript
// YourModal.tsx
interface YourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YourModal: React.FC<YourModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md 
                    flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-[#181211] border-4 border-[#5b403c] p-6 
                      max-w-2xl w-full max-h-96 overflow-y-auto 
                      shadow-[8px_8px_0px_#000000] space-y-4">
        {/* Conteúdo aqui */}
        <button onClick={onClose}>FECHAR</button>
      </div>
    </div>
  );
};
```

### Tarefa 2: Integrar Componente do Lovable

**Passos:**
1. Copie arquivo `.tsx` do Lovable
2. Adapte imports (remova imports específicos do Lovable)
3. Integre ao gameStore se precisar de state
4. Valide tipos TypeScript
5. Teste responsividade

**Exemplo:** Records integration [[../INTEGRATION/00_LOVABLE_INTEGRATION.md]]

### Tarefa 3: Otimizar Performance Visual

**Checklist:**
1. Use `React.memo()` para componentes puros
2. Evite re-renders desnecessários (useMemo, useCallback)
3. Lazy-load modals (não render se não visível)
4. Otimize imagens (webp, SVG inline)
5. Use GPU acceleration (CSS transforms, backdrop-filter)

**Details:** [[../CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]]

---

## 🚀 Workflow Frontend

```
1. Recebe tarefa (ex: "Implementar novo modal")
   ↓
2. Leia CONTEXTO RELEVANTE (este arquivo)
   ↓
3. Consulte [[../DESIGN/02_UI_PATTERNS.md]] (padrões)
   ↓
4. Leia arquivo de spec (ex: [[../GAMEPLAY/05_RECORDS_SYSTEM.md]])
   ↓
5. Implemente componente React
   ↓
6. Integre ao gameStore + GameplayHUD
   ↓
7. Valide contra [[../CRITICAL/03_TESTING_GATES.md]]
   ↓
8. Commit com mensagem clara
```

---

## 💾 State Management Patterns

### Padrão: Modal Toggle

```typescript
// gameStore.ts
isYourModalOpen: false,
setYourModalOpen: (isOpen) => set({ isYourModalOpen: isOpen }),

// Component
const { isYourModalOpen, setYourModalOpen } = useGameStore();

<button onClick={() => setYourModalOpen(true)}>Abrir</button>
<YourModal isOpen={isYourModalOpen} onClose={() => setYourModalOpen(false)} />
```

### Padrão: Persistent User Preferences

```typescript
// gameStore.ts (with localStorage)
settings: loadSettings(), // Zod validation
updateSettings: (newSettings) => {
  saveSettings(newSettings);
  set({ settings: newSettings });
}

// Component
<input 
  value={settings.virtualControlsOpacity}
  onChange={(e) => updateSettings({ 
    virtualControlsOpacity: parseFloat(e.target.value)
  })}
/>
```

Details: [[../ARCHITECTURE/04_STATE_MANAGEMENT.md]]

---

## 🔄 Git Workflow

### Before Commit

```bash
# Typecheck
pnpm run typecheck

# Build
pnpm run build

# Test (if exists)
pnpm run test
```

### Commit Message

```
feat: implementar novo modal de Records

- Criar RecordsDisplay.tsx com tabela top 8
- Integrar em gameStore com isRecordsOpen
- Adicionar botão troféu no HUD
- Validar contra testing gates

Relacionado: [[../GAMEPLAY/05_RECORDS_SYSTEM.md]]
```

---

## 📚 Documentação Relacionada

**Essencial:**
- [[../ARCHITECTURE/04_STATE_MANAGEMENT.md]] - Zustand patterns
- [[../DESIGN/02_UI_PATTERNS.md]] - UI standards
- [[../GAMEPLAY/05_RECORDS_SYSTEM.md]] - Records feature spec

**Útil:**
- [[../CRITICAL/03_TESTING_GATES.md]] - QA checklist
- [[../CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]] - Performance tips
- [[../INTEGRATION/00_LOVABLE_INTEGRATION.md]] - Lovable workflow

---

## ❓ Perguntas Frequentes

**P: Preciso ler todo o código de Phaser?**  
R: NÃO. Leia [[../CRITICAL/01_CRITICAL_FILES.md]] para entender o que NÃO tocar. Phaser é separado de React.

**P: Como adiciono state novo?**  
R: Abra `gameStore.ts`, siga padrão existente, valide com Zod. [[../ARCHITECTURE/04_STATE_MANAGEMENT.md]]

**P: Posso mudar cores/paletas?**  
R: Apenas com aprovação de Felipe (game designer). Consulte [[../DESIGN/02_UI_PATTERNS.md]]

**P: Performance está ruim, o que fazer?**  
R: Leia [[../CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]] e use DevTools do navegador.

---

**Última atualização:** 2026-08-09  
**Mantido por:** Claude + Felipe  
**Versão:** 1.0

[[../README.md]] | [[BACKEND_DEVELOPER.md]] | [[GAME_DESIGNER.md]] | [[QA_ENGINEER.md]]
