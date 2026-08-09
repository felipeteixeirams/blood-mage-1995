# 📚 Bloodmage 1995 — Graph Documentation

> **Para Agentes de IA:** Esta é a entrada principal. Use este índice para navegar pelo contexto específico que sua tarefa requer. Não leia documentação além do necessário para economizar tokens.

---

## 🗺️ Estrutura de Documentação

```
docs/
├── README.md (este arquivo)
├── CONTEXT/ (contextos por role/agente)
│   ├── FRONTEND_DEVELOPER.md
│   ├── BACKEND_DEVELOPER.md
│   ├── GAME_DESIGNER.md
│   ├── QA_ENGINEER.md
│   └── PRODUCT_MANAGER.md
├── ARCHITECTURE/ (decisões técnicas)
│   ├── 00_OVERVIEW.md
│   ├── 01_TECH_STACK.md
│   ├── 02_CODE_ORGANIZATION.md
│   ├── 03_PHASER_PATTERNS.md
│   └── 04_STATE_MANAGEMENT.md
├── DESIGN/ (especificações de design)
│   ├── 00_DESIGN_PHILOSOPHY.md
│   ├── 01_VISUAL_IDENTITY.md
│   ├── 02_UI_PATTERNS.md
│   └── 03_ACCESSIBILITY.md
├── GAMEPLAY/ (mecânicas e features)
│   ├── 00_CORE_MECHANICS.md
│   ├── 01_INCONSCIOUSNESS_SYSTEM.md
│   ├── 02_COMBAT_FEEL.md
│   ├── 03_SKILL_SYSTEM.md
│   ├── 04_LOOT_SYSTEM.md
│   └── 05_RECORDS_SYSTEM.md
├── FEATURES/ (features em desenvolvimento)
│   ├── 00_DUNGEON_SIEGE_EVOLUTION.md
│   ├── 01_INCONSCIOUSNESS_PHASE1.md
│   ├── 02_DEATH_SCREEN_PHASE2.md
│   ├── 03_STATUS_CONDITIONS_PHASE3.md
│   └── 04_CONTINUOUS_WORLD_PHASE4.md
├── CRITICAL/ (anti-regressão e performance)
│   ├── 00_ANTI_REGRESSION_GUIDE.md
│   ├── 01_CRITICAL_FILES.md
│   ├── 02_PERFORMANCE_OPTIMIZATION.md
│   ├── 03_TESTING_GATES.md
│   └── 04_PERFORMANCE_METRICS.md
├── INTEGRATION/ (third-party + tools)
│   ├── 00_LOVABLE_INTEGRATION.md
│   ├── 01_VERCEL_DEPLOYMENT.md
│   ├── 02_MCP_SERVERS.md
│   └── 03_AI_AGENT_SETUP.md
├── REFERENCE/ (dados e referência rápida)
│   ├── 00_QUICK_REFERENCE.md
│   ├── 01_FILE_STRUCTURE.md
│   ├── 02_KEY_TYPES.md
│   ├── 03_API_ENDPOINTS.md
│   └── 04_COMMON_TASKS.md
└── DISCOVERY/ (histórico de descobertas)
    ├── DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md
    └── SPECS_EVOLUCAO.md
```

---

## 🎯 Como Usar Esta Documentação

### Para Agentes de IA (Automático)

**Passo 1:** Identifique seu contexto (role/tarefa)
- **Frontend Dev?** → Leia [[CONTEXT/FRONTEND_DEVELOPER.md]]
- **Backend Dev?** → Leia [[CONTEXT/BACKEND_DEVELOPER.md]]
- **Game Designer?** → Leia [[CONTEXT/GAME_DESIGNER.md]]
- **QA?** → Leia [[CONTEXT/QA_ENGINEER.md]]
- **Product?** → Leia [[CONTEXT/PRODUCT_MANAGER.md]]

**Passo 2:** Acesse documentação específica de sua tarefa
- Arquitetura? → [[ARCHITECTURE/00_OVERVIEW.md]]
- Mecânica de jogo? → [[GAMEPLAY/00_CORE_MECHANICS.md]]
- Feature nova? → [[FEATURES/00_DUNGEON_SIEGE_EVOLUTION.md]]
- Performance? → [[CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]]

**Passo 3:** Use referências cruzadas (wiki-links)
- Clique em `[[documento]]` para mais contexto
- Não leia documentação além do referenciado

### Para Humanos (Felipe & Developers)

1. **Começar novo:** Leia contexto de seu role
2. **Feature nova:** Acesse pasta FEATURES
3. **Código legado:** Acesse CRITICAL (anti-regressão)
4. **Dúvida rápida:** Acesse REFERENCE

---

## 📋 Matriz de Contexto: Qual Documento Você Precisa?

| Tarefa | Role | Documentos Essenciais | Opcionais |
|--------|------|----------------------|-----------|
| **Implementar tela Records** | Frontend | [[CONTEXT/FRONTEND_DEVELOPER.md]], [[GAMEPLAY/05_RECORDS_SYSTEM.md]], [[DESIGN/02_UI_PATTERNS.md]] | [[ARCHITECTURE/04_STATE_MANAGEMENT.md]] |
| **Implementar Fase 1 (Inconsciência)** | Backend | [[CONTEXT/BACKEND_DEVELOPER.md]], [[GAMEPLAY/01_INCONSCIOUSNESS_SYSTEM.md]], [[CRITICAL/01_CRITICAL_FILES.md]] | [[GAMEPLAY/00_CORE_MECHANICS.md]] |
| **Balancear Fase 3 (Status)** | Game Designer | [[CONTEXT/GAME_DESIGNER.md]], [[FEATURES/03_STATUS_CONDITIONS_PHASE3.md]], [[GAMEPLAY/03_SKILL_SYSTEM.md]] | [[DISCOVERY/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md]] |
| **QA da Inconsciência** | QA | [[CONTEXT/QA_ENGINEER.md]], [[CRITICAL/03_TESTING_GATES.md]], [[GAMEPLAY/01_INCONSCIOUSNESS_SYSTEM.md]] | [[CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]] |
| **Setup agente de IA** | DevOps | [[INTEGRATION/02_MCP_SERVERS.md]], [[INTEGRATION/03_AI_AGENT_SETUP.md]] | Tudo relacionado a MCP |

---

## 🔗 Backlinks e Relações (Graph View)

```
README (você está aqui)
├── → CONTEXT/* (contexts específicos por role)
├── → ARCHITECTURE/* (fundamentals técnicos)
├── → GAMEPLAY/* (mecânicas do jogo)
├── → FEATURES/* (roadmap de desenvolvimento)
├── → CRITICAL/* (anti-regressão)
├── → DESIGN/* (visual/UX)
├── → INTEGRATION/* (ferramentas externas)
├── → REFERENCE/* (consulta rápida)
└── → DISCOVERY/* (histórico e specs)
```

---

## ⚡ Meta-Prompts para Agentes de IA

### Prompt para Google Jules

```markdown
# Instruções para Google Jules

1. Você trabalha em features de gameplay/design visual do Bloodmage 1995
2. Antes de implementar: Leia [[CONTEXT/GAME_DESIGNER.md]]
3. Para qualquer mudança: Consulte [[CRITICAL/01_CRITICAL_FILES.md]]
4. Se tiver dúvida sobre mecânica: Consulte [[GAMEPLAY/00_CORE_MECHANICS.md]]
5. Após implementar: Valide contra [[CRITICAL/03_TESTING_GATES.md]]

NÃO leia código-fonte sem necessidade. Use documentação.
```

### Prompt para Google AI Studio

```markdown
# Instruções para Google AI Studio

1. Você trabalha em documentação e análise de features
2. Use contexto: [[CONTEXT/PRODUCT_MANAGER.md]]
3. Para design: Consulte [[DESIGN/00_DESIGN_PHILOSOPHY.md]]
4. Para gameplay: Consulte [[GAMEPLAY/00_CORE_MECHANICS.md]]
5. Referências cruzadas: Siga wiki-links `[[arquivo.md]]`

Objetivo: Manter documentação atualizada e coerente.
```

### Prompt para GitHub Copilot Chat

```markdown
# Instruções para GitHub Copilot Chat

1. Context: Você é um assistente de codificação para Bloodmage 1995
2. Ao sugerir código: Valide contra [[CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]]
3. Para tipos TypeScript: Consulte [[REFERENCE/02_KEY_TYPES.md]]
4. Para padrões: Consulte [[ARCHITECTURE/03_PHASER_PATTERNS.md]]
5. Após sugestão: Mencione [[CRITICAL/01_CRITICAL_FILES.md]] se relevante

Nunca sugira mudanças em CRITICAL FILES sem aviso.
```

### Prompt para IA Open-Source Auto-Hospedada (ex: Ollama + LM Studio)

```markdown
# Instruções para IA Local Auto-Hospedada

Contexto mínimo (economizar tokens):
- Seu papel: [[CONTEXT/ROLE_AQUI.md]]
- Arquitetura básica: [[ARCHITECTURE/00_OVERVIEW.md]]
- Arquivos críticos: [[CRITICAL/01_CRITICAL_FILES.md]]

NÃO leia:
- Código-fonte completo (use referências)
- Documentação fora de seu escopo
- Discovery/histórico (a menos que pedido)

Fluxo: Questão → Contexto mínimo → Referência → Resposta
```

---

## 🎓 Convenções de Documentação

### Wiki-Links (Obsidian-Compatible)

```markdown
# Usar isto:
Consulte [[GAMEPLAY/01_INCONSCIOUSNESS_SYSTEM.md]] para detalhes.

# NÃO usar isto:
Consulte /docs/GAMEPLAY/01_INCONSCIOUSNESS_SYSTEM.md...
```

### Estrutura de Cabeçalhos

```markdown
# 1️⃣ Nível 1: Título Principal (arquivo)
## 🎯 Nível 2: Seções Principais
### 📝 Nível 3: Subsecções
#### ⚙️ Nível 4: Detalhes Técnicos
```

### Meta-Informações no Topo

```markdown
---
role: Frontend Developer
complexity: Medium
tokens_est: 2000
depends_on: [[ARCHITECTURE/04_STATE_MANAGEMENT.md]]
related: [[DESIGN/02_UI_PATTERNS.md]]
---
```

---

## 📊 Status de Documentação

| Área | Status | Última Atualização | Responsável |
|------|--------|-------------------|-------------|
| CONTEXT | ✅ Draft | 2026-08-09 | Felipe + Claude |
| ARCHITECTURE | ✅ Draft | 2026-08-09 | Claude |
| DESIGN | 🔲 TODO | - | Jules |
| GAMEPLAY | ✅ Partial | 2026-08-09 | Felipe |
| FEATURES | ✅ Partial | 2026-08-09 | Felipe |
| CRITICAL | ✅ Complete | 2026-08-09 | Claude |
| INTEGRATION | ✅ Draft | 2026-08-09 | Claude |
| REFERENCE | 🔲 TODO | - | Claude |
| DISCOVERY | ✅ Complete | 2026-08-09 | Felipe |

---

## 🔄 Fluxo de Atualização de Docs

1. **Feature nova:** Crie arquivo em FEATURES/
2. **Merge para main:** Atualize wiki-links em README
3. **QA validar:** Use [[CRITICAL/03_TESTING_GATES.md]]
4. **Docs completas:** Archive no DISCOVERY/
5. **Agentes acessam:** Consultem contexto relevante

---

## 💡 Exemplos de Uso

### Cenário 1: Claude recebe task "Implementar botão Records"

```
# Contexto necessário (tokens mínimos):
1. [[CONTEXT/FRONTEND_DEVELOPER.md]] (role)
2. [[GAMEPLAY/05_RECORDS_SYSTEM.md]] (spec)
3. [[DESIGN/02_UI_PATTERNS.md]] (padrões UI)
4. [[REFERENCE/02_KEY_TYPES.md]] (types)

# NÃO leia: código-fonte completo, DISCOVERY
```

### Cenário 2: Jules recebe task "Implementar Fase 1 (Inconsciência)"

```
# Contexto necessário:
1. [[FEATURES/01_INCONSCIOUSNESS_PHASE1.md]] (spec)
2. [[GAMEPLAY/01_INCONSCIOUSNESS_SYSTEM.md]] (mecânica)
3. [[CRITICAL/01_CRITICAL_FILES.md]] (arquivos não tocar)
4. [[CRITICAL/03_TESTING_GATES.md]] (validação)

# NÃO leia: design visual, specs de outras fases
```

### Cenário 3: QA valida feature de Records

```
# Contexto necessário:
1. [[CONTEXT/QA_ENGINEER.md]] (checklist)
2. [[GAMEPLAY/05_RECORDS_SYSTEM.md]] (specs)
3. [[CRITICAL/03_TESTING_GATES.md]] (gates)
4. [[CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]] (perf)

# NÃO leia: código backend, design gráfico
```

---

## 🚀 Próximos Passos

- [ ] Criar CONTEXT/* (personalizados por role)
- [ ] Criar ARCHITECTURE/* (detailed)
- [ ] Criar DESIGN/* (visual standards)
- [ ] Criar REFERENCE/* (quick lookup)
- [ ] Testar com cada agente de IA
- [ ] Medir economia de tokens
- [ ] Atualizar meta-prompts baseado em feedback

---

**Mantido por:** Felipe + Agentes de IA  
**Última revisão:** 2026-08-09  
**Versão:** 1.0 (Graph Documentation)

[[CONTEXT/FRONTEND_DEVELOPER.md]] | [[CONTEXT/BACKEND_DEVELOPER.md]] | [[CONTEXT/GAME_DESIGNER.md]] | [[CONTEXT/QA_ENGINEER.md]] | [[CONTEXT/PRODUCT_MANAGER.md]]
