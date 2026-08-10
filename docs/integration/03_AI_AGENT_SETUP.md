---
role: DevOps / Project Manager
complexity: Medium
audience: Anyone setting up AI agents
agent_context: all agents
target_module: n/a
priority: medium
status: active
last_updated: 2026-08-09
tags: [integration, agents]
---

# 🤖 AI Agent Setup Guide — Graph Documentation

> **Para Felipe:** Como configurar e usar a Graph Documentation com cada agente de IA para otimizar tokens e qualidade.

---

## 🎯 Filosofia

**Problema:** Agentes de IA lendo todo o código-fonte = tokens desperdiçados, contexto poluído, respostas piores.

**Solução:** Graph Documentation com contextos personalizados por role.

**Benefício:** 60-70% redução de tokens + qualidade melhor.

---

## 🚀 Setup por Agente de IA

### 1️⃣ Claude (Bloodmage Assistant)

**Seu nome:** Claude / Bloodmage AI Assistant

**Arquivo de contexto:** [[../context/FRONTEND_DEVELOPER.md]] (ou GAME_DESIGNER/QA role)

**Meta-Prompt (Cole em cada sessão):**

```markdown
# Bloodmage 1995 — Context Setup

**Role:** [Escolha: Frontend Developer / Game Designer / QA Engineer]
**Context File:** [[../context/YOUR_ROLE.md]]
**Critical Files:** [[../critical/01_CRITICAL_FILES.md]]

Instruções:
1. Você trabalha no projeto Bloodmage 1995
2. Leia APENAS o contexto de seu role (NÃO read todo código)
3. Para qualquer mudança: Consulte [[../critical/01_CRITICAL_FILES.md]]
4. Se mencionar código: Valide contra [[../critical/03_TESTING_GATES.md]]
5. Use wiki-links `[[arquivo]]` para navegar documentação

Não leia:
- Código-fonte inteiro (use docs ao invés)
- Arquivos fora do escopo seu
- DISCOVERY/ (a menos que pedido)

Task: [DESCREVA O QUE PRECISA FAZER]
```

**Exemplo de uso:**

```markdown
# Bloodmage 1995 — Context Setup

**Role:** Frontend Developer
**Context File:** [[../context/FRONTEND_DEVELOPER.md]]
**Critical Files:** [[../critical/01_CRITICAL_FILES.md]]

Instruções:
[Cole meta-prompt acima]

Task: Implementar novo modal de Configurações Rápidas

Detalhes:
- Button "⚙️" no canto superior do HUD
- Modal deve ficar 300ms
- Opções: Volume SFX, Volume BGM, Opacidade controles
- Salvar em gameStore (persistence)
```

---

### 2️⃣ Google Jules (Game Designer/AI)

**Role:** Game Designer & Gameplay Implementer

**Arquivo de contexto:** [[../context/GAME_DESIGNER.md]]

**Meta-Prompt:**

```markdown
# Google Jules — Bloodmage 1995 Setup

Você é especialista em game design/gameplay do Bloodmage 1995.

Context: [[../context/GAME_DESIGNER.md]]

ANTES de qualquer implementação:
1. Leia [[../features/XX_FEATURE_NAME.md]] (spec completa)
2. Consulte [[../critical/01_CRITICAL_FILES.md]] (o que NÃO tocar)
3. Valide após: [[../critical/03_TESTING_GATES.md]]

Trabalho típico:
- Implementar Fase X (Inconsciência, Morte, Status, NPCs)
- Modificar Enemy.ts / Player.ts com segurança
- Balancear dificuldade e feel
- Fazer PR com referência à spec

NUNCA:
- Altere Physics/Collision (sem Felipe)
- Altere ACCELERATION/DECELERATION em Player.ts
- Altere FSM core transitions sem aviso

Converse com Felipe se tiver dúvida.

Task: [DESCREVA]
```

**Exemplo:**

```markdown
# Google Jules — Bloodmage 1995 Setup

[Cole meta-prompt acima]

Task: Implementar Fase 1 - Sistema de Inconsciência

Detalhes:
- Spec: [[../features/01_INCONSCIOUSNESS_PHASE1.md]]
- Preciso adicionar isUnconscious state
- Inimigos devem detectar e parar de atacar
- Player regenera 1 HP/seg até 5%

Dúvidas:
- Quanto deve regenerar? Checo em [[../features/01_INCONSCIOUSNESS_PHASE1.md]]
- Como validar? Checo em [[../critical/03_TESTING_GATES.md]]
```

---

### 3️⃣ Google AI Studio (Documentation/Analysis)

**Role:** Documentation & Analysis

**Arquivo de contexto:** [[../README.md]] (índice)

**Meta-Prompt:**

```markdown
# Google AI Studio — Bloodmage Documentation

Você mantém documentação do projeto atualizada.

Role: Technical Writer / Documentation Specialist

Responsabilidades:
1. Manter estrutura de [[../README.md]]
2. Atualizar specs após feature completa
3. Validar referências cruzadas (wiki-links)
4. Adicionar novos contextos para agentes

Workflow:
- Feature nova? Crie [[../features/XX_NAME.md]]
- Feature pronta? Archive em [[../DISCOVERY/]]
- Contexto novo? Crie [[../context/ROLE.md]]
- Dúvida? Consulte [[../README.md]] (matrix)

Nunca:
- Mude padrão de nomenclatura
- Quebre wiki-links
- Remova documentação legada (archive ao invés)

Task: [DESCREVA]
```

---

### 4️⃣ GitHub Copilot Chat

**Role:** Code Assistant / Pair Programmer

**System Prompt (Configure em seu IDE):**

```markdown
You are a code assistant for Bloodmage 1995 (Phaser 3 + React).

Context files (read when relevant):
- Architecture: docs/ARCHITECTURE/04_STATE_MANAGEMENT.md
- Patterns: docs/DESIGN/02_UI_PATTERNS.md
- Critical: docs/CRITICAL/01_CRITICAL_FILES.md

When suggesting code:
1. Check if it modifies CRITICAL files
2. Validate against testing gates (docs/CRITICAL/03_TESTING_GATES.md)
3. Mention: "See [[../critical/01_CRITICAL_FILES.md]] for safety."

Never:
- Suggest changes to Player.ts physics
- Suggest changes to Enemy.ts FSM
- Suggest changes to GameScene.ts colliders
- Ignore TypeScript strict mode

Types & patterns:
- Use Zod for validation (see gameStore.ts)
- Use React.memo for perf (see GameplayHUD.tsx)
- Use wiki-links [[file.md]] in comments
```

---

### 5️⃣ IA Open-Source Auto-Hospedada (Ollama, LM Studio, etc)

**Setup:** Use modelo local + context mínimo

**System Prompt:**

```markdown
Project: Bloodmage 1995 (Phaser 3 RPG)
Stack: TypeScript, React, Zustand, TailwindCSS

Role: [Frontend/Backend/QA]
Context: Read docs/context/[YOUR_ROLE].md ONLY

Token Budget: 2000 words max
Task: [DESCRIBE]

Reference docs:
- Critical files: docs/CRITICAL/01_CRITICAL_FILES.md
- Your role: docs/CONTEXT/[ROLE].md

Do NOT read:
- Full source code
- Unrelated documentation
- DISCOVERY (unless asked)

Format response with [[wiki-link references]]
```

---

## 📊 Token Savings Comparison

### ❌ Sem Graph Documentation

```
Tarefa: "Implementar Records modal"

Agente precisa ler:
- GameplayHUD.tsx (655 linhas)
- gameStore.ts (300 linhas)
- GameScene.ts (1454 linhas)
- Vários componentes React
- README geral

Total: ~3000 linhas de código
Tokens estimados: 12,000-15,000 tokens
Tempo: 5-10 minutos de análise
```

### ✅ Com Graph Documentation

```
Tarefa: "Implementar Records modal"

Agente lê:
- CONTEXT/FRONTEND_DEVELOPER.md (400 linhas)
- GAMEPLAY/05_RECORDS_SYSTEM.md (200 linhas)
- DESIGN/02_UI_PATTERNS.md (300 linhas)
- Template de componente (100 linhas)

Total: ~1000 linhas de documentação
Tokens estimados: 3,000-4,000 tokens
Tempo: 1-2 minutos
Economia: 70% de tokens!
```

---

## 🔄 Workflow Padrão (Com Graph Docs)

```
1. Agente recebe task
   ↓
2. Copia meta-prompt relevante
   ↓
3. Lê CONTEXT/ROLE.md (2-3 min)
   ↓
4. Lê FEATURE/XX_SPEC.md (3-5 min)
   ↓
5. Consulta wiki-links conforme necessário
   ↓
6. Implementa (com referências)
   ↓
7. Valida contra CRITICAL/* docs
   ↓
8. Commit com [[wiki-link references]]
```

---

## 📝 Templates de Prompts (Copy-Paste)

### Prompt para Nova Feature

```markdown
# Bloodmage 1995 — New Feature Implementation

**Context:** [[../context/FRONTEND_DEVELOPER.md]]
**Feature Spec:** [[../features/XX_NEW_FEATURE.md]]
**Critical Files:** [[../critical/01_CRITICAL_FILES.md]]

Task: [TÍTULO]

Description: [DESCRIÇÃO]

Checklist:
- [ ] Li a spec completa
- [ ] Consultei arquivos críticos
- [ ] Vou validar contra testing gates
- [ ] Vou commitar com referências cruzadas
```

### Prompt para Bug Fix

```markdown
# Bloodmage 1995 — Bug Fix

**Bug:** [DESCRIÇÃO]
**Severity:** [Critical/High/Medium/Low]
**Affected System:** [[../gameplay/XX_SYSTEM.md]]

Context: [[../context/QA_ENGINEER.md]]

Steps to reproduce:
1. [...]
2. [...]
3. [...]

Expected: [...]
Actual: [...]

Before fixing:
- Checar se toca em [[../critical/01_CRITICAL_FILES.md]]
- Validar contra [[../critical/03_TESTING_GATES.md]]
```

### Prompt para Code Review

```markdown
# Bloodmage 1995 — Code Review

**PR:** #XX
**Feature:** [[../features/XX_FEATURE.md]]

Review checklist:
- [ ] Matches spec in [[../features/XX_FEATURE.md]]
- [ ] Doesn't modify [[../critical/01_CRITICAL_FILES.md]]
- [ ] Passes [[../critical/03_TESTING_GATES.md]]
- [ ] TypeScript strict (zero errors)
- [ ] Performance OK (60 FPS)
- [ ] Commit message references [[docs]]
```

---

## 🎓 Boas Práticas

### ✅ Fazer

```markdown
Consultei [[../gameplay/05_RECORDS_SYSTEM.md]] para entender a spec.
Validei contra [[../critical/01_CRITICAL_FILES.md]] - seguro!
Testei conforme [[../critical/03_TESTING_GATES.md]].
```

### ❌ Não Fazer

```markdown
"Leia todo o código-fonte para entender o contexto"
"Não há documentação, preciso explorar o código"
"Alterei Player.ts porque achei que era correto"
```

---

## 📊 Matriz de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|-----------|
| **Tokens por task** | <5000 | Usar prompt editor (Copilot, Claude API) |
| **Tempo de setup** | <3 min | Cronometrar leitura de contexto |
| **Acertos de primeira** | >80% | % de PRs que passam review sem mudanças |
| **Regressões** | 0 | Bugs causados por mudanças em critical files |
| **Docs atualizadas** | 100% | Sync entre docs e código (verificar a cada merge) |

---

## 🚀 Roadmap de Documentação

**Fase 1 (Atual):** ✅ Completo
- [x] README + Matrix de contextos
- [x] CONTEXT/ (Frontend, Game Designer, QA)
- [x] CRITICAL/01 (Critical Files)

**Fase 2 (Próximo):**
- [ ] CONTEXT/ restantes (Backend, Product Manager)
- [ ] CRITICAL/00 (Anti-Regression Guide)
- [ ] CRITICAL/03 (Testing Gates)
- [ ] ARCHITECTURE/ (Tech stack, patterns)

**Fase 3:**
- [ ] GAMEPLAY/ (Specs de mecânicas)
- [ ] DESIGN/ (Visual standards)
- [ ] REFERENCE/ (Quick lookup)

**Fase 4:**
- [ ] Testar com cada agente de IA
- [ ] Medir economia de tokens real
- [ ] Ajustar meta-prompts baseado em feedback

---

## 💡 Dicas Avançadas

### Usar com MCP Servers

Se usando MCP (Google Jules, etc), configure assim:

```json
{
  "mcp_servers": {
    "local": {
      "command": "python",
      "args": ["mcp_server.py"],
      "env": {
        "DOCS_PATH": "/path/to/docs",
        "CONTEXT_ROLE": "game_designer",
        "CRITICAL_ONLY": "true"
      }
    }
  }
}
```

### Automatizar Leitura de Contexto

Crie script Python:

```python
import os
from pathlib import Path

role = "frontend_developer"
context_file = Path(f"docs/CONTEXT/{role.upper()}.md")

print(f"📚 Loading context for: {role}")
print(f"File: {context_file}")
print(f"Size: {context_file.stat().st_size} bytes")

with open(context_file) as f:
    print("\n" + f.read())
```

---

## 📞 Suporte

**Dúvida sobre documentação?**  
→ Consulte [[../README.md]]

**Dúvida sobre seu role?**  
→ Consulte [[../context/YOUR_ROLE.md]]

**Encontrou bug na documentação?**  
→ Crie issue com título: `docs: [descrição]`

---

**Última atualização:** 2026-08-09  
**Mantido por:** Claude + Felipe  
**Versão:** 1.0

[[../README.md]] | [[../context/FRONTEND_DEVELOPER.md]] | [[../critical/01_CRITICAL_FILES.md]]
