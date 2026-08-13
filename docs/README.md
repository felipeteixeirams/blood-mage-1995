---
agent_context: all agents
target_module: docs
priority: high
status: active
last_updated: 2026-08-10
tags: [docs, index, navigation]
---
# 📚 Bloodmage 1995 — Graph Documentation

> **Para Agentes de IA:** Esta é a entrada principal. Use este índice para navegar pelo contexto específico que sua tarefa requer. Não leia documentação além do necessário para economizar tokens.

---

## 🗺️ Estrutura de Documentação

```
docs/
├── AGENTS.md (bootstrap para agentes de IA)
├── README.md (índice master - este arquivo)
├── context/ (contextos por role/agente)
│   ├── FRONTEND_DEVELOPER.md
│   ├── BACKEND_DEVELOPER.md
│   ├── GAME_DESIGNER.md
│   ├── QA_ENGINEER.md
│   └── PRODUCT_MANAGER.md
├── architecture/ (decisões técnicas)
│   ├── 00_OVERVIEW.md
│   ├── 01_TECH_STACK.md
│   ├── 02_CODE_ORGANIZATION.md
│   ├── 03_PHASER_PATTERNS.md
│   └── 04_STATE_MANAGEMENT.md
├── design/ (especificações de design)
│   ├── 00_DESIGN_PHILOSOPHY.md
│   ├── 01_VISUAL_IDENTITY.md
│   ├── 02_UI_PATTERNS.md
│   └── 03_ACCESSIBILITY.md
├── gameplay/ (mecânicas e features)
│   ├── 00_CORE_MECHANICS.md
│   ├── 01_INCONSCIOUSNESS_SYSTEM.md
│   ├── 02_COMBAT_FEEL.md
│   ├── 03_SKILL_SYSTEM.md
│   ├── 04_LOOT_SYSTEM.md
│   └── 05_RECORDS_SYSTEM.md
├── features/ (features em desenvolvimento)
│   ├── 00_DUNGEON_SIEGE_EVOLUTION.md
│   ├── 01_INCONSCIOUSNESS_PHASE1.md
│   ├── 02_DEATH_SCREEN_PHASE2.md
│   ├── 03_STATUS_CONDITIONS_PHASE3.md
│   └── 04_CONTINUOUS_WORLD_PHASE4.md
├── critical/ (anti-regressão e performance)
│   ├── 00_ANTI_REGRESSION_GUIDE.md
│   ├── 01_CRITICAL_FILES.md
│   ├── 02_PERFORMANCE_OPTIMIZATION.md
│   ├── 03_TESTING_GATES.md
│   ├── 04_PERFORMANCE_METRICS.md
│   └── 05_TROUBLESHOOTING_KNOWN_ISSUES.md
├── integration/ (third-party + tools)
│   ├── 00_LOVABLE_INTEGRATION.md
│   ├── 01_VERCEL_DEPLOYMENT.md
│   ├── 02_MCP_SERVERS.md
│   └── 03_AI_AGENT_SETUP.md
├── deployment/ (empacotamento e deploy)
│   ├── DEPLOYMENT.md (guia rápido de deploy)
│   └── FASE5_EMPACOTAMENTO_COMPLETO.md (guia completo de empacotamento)
├── reference/ (dados e referência rápida)
│   ├── 00_QUICK_REFERENCE.md
│   ├── 01_FILE_STRUCTURE.md
│   ├── 02_KEY_TYPES.md
│   ├── 03_API_ENDPOINTS.md
│   ├── 04_COMMON_TASKS.md
│   └── docs-documental-base-guia.md (guia base de documentação)
├── specs/ (specs por estágio de desenvolvimento)
│   ├── README.md (índice de status)
│   ├── propostas/ (ideias em backlog)
│   │   ├── 01_EVOLUCAO_GRAFICA_AVANCADA.md
   │   │   ├── 02_DISCOVERY_UI_ASSETS_EXTERNOS.md
   │   │   ├── 03_MULTIJOVADOR_COOPERATIVO_E_INTERATIVIDADE.md
   │   │   ├── 04_MOBILE_APP_E_MONETIZACAO_INDIE.md
   │   │   ├── 05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md
   │   │   ├── 06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md
   │   │   └── 07_EVENTOS_MUNDIAIS_E_SAZONAIS.md
│   ├── andamento/ (em desenvolvimento ativo)
│   │   ├── 01_FASE1_INCONSCIENCIA.md
│   │   ├── 08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md
│   │   ├── PHASE_1_UNCONSCIOUSNESS_SPEC.md
│   │   ├── SPECS_EVOLUCAO.md
│   │   └── SPEC_DUNGEON_SIEGE_EVOLUTION.md
│   └── finalizadas/ (concluído e testado)
│       └── 01_RECORDS_DISPLAY.md
├── reviews/ (auditorias e validações)
│   ├── AUDIT_REPORT_AI_DRIVEN_2026.md
│   ├── AUDIT_REPORT_QUALIDADE_2026.md
│   ├── VALIDATION_DUNGEON_SIEGE_2026_08_10.md
│   ├── MUDANCAS_SESSAO_2026_08_10_11.md
│   └── STATUS_PROGRESSO_2026_08_11.md
├── decisions/ (decisões de arquitetura - ADRs)
├── templates/ (modelos padronizados, incl. frontmatter)
├── wip/ (documentos em andamento)
└── legacy/ (histórico descontinuado)
    ├── DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md
    └── Bloodmage1995_Discovery_Evolucao.docx
```

---

## 🎯 Como Usar Esta Documentação

### Para Agentes de IA (Automático)

**Passo 1:** Identifique seu contexto (role/tarefa)
- **Frontend Dev?** → Leia [[context/FRONTEND_DEVELOPER.md]]
- **Backend Dev?** → Leia [[context/BACKEND_DEVELOPER.md]]
- **Game Designer?** → Leia [[context/GAME_DESIGNER.md]]
- **QA?** → Leia [[context/QA_ENGINEER.md]]
- **Product?** → Leia [[context/PRODUCT_MANAGER.md]]

**Passo 2:** Acesse documentação específica de sua tarefa
- Arquitetura? → [[architecture/00_OVERVIEW.md]]
- Mecânica de jogo? → [[gameplay/00_CORE_MECHANICS.md]]
- Feature nova? → [[features/00_DUNGEON_SIEGE_EVOLUTION.md]]
- Performance? → [[critical/02_PERFORMANCE_OPTIMIZATION.md]]

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
| **Implementar tela Records** | Frontend | [[context/FRONTEND_DEVELOPER.md]], [[gameplay/05_RECORDS_SYSTEM.md]], [[design/02_UI_PATTERNS.md]] | [[architecture/04_STATE_MANAGEMENT.md]] |
| **Implementar Fase 1 (Inconsciência)** | Backend | [[context/BACKEND_DEVELOPER.md]], [[gameplay/01_INCONSCIOUSNESS_SYSTEM.md]], [[critical/01_CRITICAL_FILES.md]] | [[gameplay/00_CORE_MECHANICS.md]] |
| **Balancear Fase 3 (Status)** | Game Designer | [[context/GAME_DESIGNER.md]], [[features/03_STATUS_CONDITIONS_PHASE3.md]], [[gameplay/03_SKILL_SYSTEM.md]] | [[legacy/DISCOVERY_DUNGEON_SIEGE_EVOLUTION.md]] |
| **QA da Inconsciência** | QA | [[context/QA_ENGINEER.md]], [[critical/03_TESTING_GATES.md]], [[gameplay/01_INCONSCIOUSNESS_SYSTEM.md]] | [[critical/02_PERFORMANCE_OPTIMIZATION.md]] |
| **Setup agente de IA** | DevOps | [[integration/02_MCP_SERVERS.md]], [[integration/03_AI_AGENT_SETUP.md]] | Tudo relacionado a MCP |

---

## 🔗 Backlinks e Relações (Graph View)

```
README (você está aqui)
├── → context/* (contexts específicos por role)
├── → architecture/* (fundamentals técnicos)
├── → gameplay/* (mecânicas do jogo)
├── → features/* (roadmap de desenvolvimento)
├── → critical/* (anti-regressão)
├── → design/* (visual/UX)
├── → integration/* (ferramentas externas)
├── → reference/* (consulta rápida)
├── → specs/* (specs por estágio)
├── → reviews/* (auditorias/validações)
└── → legacy/* (histórico descontinuado)
```

---

## ⚡ Meta-Prompts para Agentes de IA

### Prompt para Google Jules

```markdown
# Instruções para Google Jules

1. Você trabalha em features de gameplay/design visual do Bloodmage 1995
2. Antes de implementar: Leia [[context/GAME_DESIGNER.md]]
3. Para qualquer mudança: Consulte [[critical/01_CRITICAL_FILES.md]]
4. Se tiver dúvida sobre mecânica: Consulte [[gameplay/00_CORE_MECHANICS.md]]
5. Após implementar: Valide contra [[critical/03_TESTING_GATES.md]]

NÃO leia código-fonte sem necessidade. Use documentação.
```

### Prompt para Google AI Studio

```markdown
# Instruções para Google AI Studio

1. Você trabalha em documentação e análise de features
2. Use contexto: [[context/PRODUCT_MANAGER.md]]
3. Para design: Consulte [[design/00_DESIGN_PHILOSOPHY.md]]
4. Para gameplay: Consulte [[gameplay/00_CORE_MECHANICS.md]]
5. Referências cruzadas: Siga wiki-links `[[arquivo.md]]`

Objetivo: Manter documentação atualizada e coerente.
```

### Prompt para GitHub Copilot Chat

```markdown
# Instruções para GitHub Copilot Chat

1. Context: Você é um assistente de codificação para Bloodmage 1995
2. Ao sugerir código: Valide contra [[critical/02_PERFORMANCE_OPTIMIZATION.md]]
3. Para tipos TypeScript: Consulte [[reference/02_KEY_TYPES.md]]
4. Para padrões: Consulte [[architecture/03_PHASER_PATTERNS.md]]
5. Após sugestão: Mencione [[critical/01_CRITICAL_FILES.md]] se relevante

Nunca sugira mudanças em CRITICAL FILES sem aviso.
```

### Prompt para IA Open-Source Auto-Hospedada (ex: Ollama + LM Studio)

```markdown
# Instruções para IA Local Auto-Hospedada

Contexto mínimo (economizar tokens):
- Seu papel: [[context/ROLE_AQUI.md]]
- Arquitetura básica: [[architecture/00_OVERVIEW.md]]
- Arquivos críticos: [[critical/01_CRITICAL_FILES.md]]

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
Consulte [[gameplay/01_INCONSCIOUSNESS_SYSTEM.md]] para detalhes.

# NÃO usar isto:
Consulte /docs/gameplay/01_INCONSCIOUSNESS_SYSTEM.md...
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
depends_on: [[architecture/04_STATE_MANAGEMENT.md]]
related: [[design/02_UI_PATTERNS.md]]
---
```

---

## 📊 Status de Documentação

| Área | Status | Última Atualização | Responsável |
|------|--------|-------------------|-------------|
| context/ | ✅ Draft | 2026-08-09 | Felipe + Claude |
| architecture/ | ✅ Draft | 2026-08-09 | Claude |
| design/ | 🔲 TODO | - | Jules |
| gameplay/ | ✅ Partial | 2026-08-09 | Felipe |
| features/ | ✅ Partial | 2026-08-09 | Felipe |
| critical/ | ✅ Complete | 2026-08-09 | Claude |
| integration/ | ✅ Draft | 2026-08-09 | Claude |
| deployment/ | ✅ Complete | 2026-08-11 | Felipe |
| reference/ | 🔲 TODO | - | Claude |
| reviews/ | ✅ Complete | 2026-08-11 | Felipe |
| specs/ | ✅ Partial | 2026-08-10 | Felipe |
| legacy/ | ✅ Complete | 2026-08-09 | Felipe |

---

## 🔄 Fluxo de Atualização de Docs

1. **Feature nova:** Crie arquivo em features/
2. **Merge para main:** Atualize wiki-links em README
3. **QA validar:** Use [[critical/03_TESTING_GATES.md]]
4. **Docs completas:** Archive no legacy/
5. **Agentes acessam:** Consultem contexto relevante

---

## 💡 Exemplos de Uso

### Cenário 1: Claude recebe task "Implementar botão Records"

```
# Contexto necessário (tokens mínimos):
1. [[context/FRONTEND_DEVELOPER.md]] (role)
2. [[gameplay/05_RECORDS_SYSTEM.md]] (spec)
3. [[design/02_UI_PATTERNS.md]] (padrões UI)
4. [[reference/02_KEY_TYPES.md]] (types)

# NÃO leia: código-fonte completo, DISCOVERY/legacy
```

### Cenário 2: Jules recebe task "Implementar Fase 1 (Inconsciência)"

```
# Contexto necessário:
1. [[features/01_INCONSCIOUSNESS_PHASE1.md]] (spec)
2. [[gameplay/01_INCONSCIOUSNESS_SYSTEM.md]] (mecânica)
3. [[critical/01_CRITICAL_FILES.md]] (arquivos não tocar)
4. [[critical/03_TESTING_GATES.md]] (validação)

# NÃO leia: design visual, specs de outras fases
```

### Cenário 3: QA valida feature de Records

```
# Contexto necessário:
1. [[context/QA_ENGINEER.md]] (checklist)
2. [[gameplay/05_RECORDS_SYSTEM.md]] (specs)
3. [[critical/03_TESTING_GATES.md]] (gates)
4. [[critical/02_PERFORMANCE_OPTIMIZATION.md]] (perf)

# NÃO leia: código backend, design gráfico
```

---

## 🚀 Próximos Passos

- [ ] Criar context/* (personalizados por role)
- [ ] Criar architecture/* (detailed)
- [ ] Criar design/* (visual standards)
- [ ] Criar reference/* (quick lookup)
- [ ] Testar com cada agente de IA
- [ ] Medir economia de tokens
- [ ] Atualizar meta-prompts baseado em feedback

---

**Mantido por:** Felipe + Agentes de IA  
**Última revisão:** 2026-08-09  
**Versão:** 1.0 (Graph Documentation)

[[context/FRONTEND_DEVELOPER.md]] | [[context/BACKEND_DEVELOPER.md]] | [[context/GAME_DESIGNER.md]] | [[context/QA_ENGINEER.md]] | [[context/PRODUCT_MANAGER.md]]
