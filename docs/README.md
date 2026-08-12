---
agent_context: all agents
target_module: docs
priority: high
status: active
last_updated: 2026-08-11
tags: [docs, index, navigation]
---
# 📚 Bloodmage 1995 — Graph Documentation

> **Para Agentes de IA:** Esta é a entrada principal. Use este índice para navegar pelo contexto específico que sua tarefa requer. Não leia documentação além do necessário para economizar tokens.

---

## 🗺️ Estrutura de Documentação

```
docs/
├── AGENTS.md (bootstrap para agentes de IA)
├── README.md (este arquivo - índice master)
├── domain/ (regras de negócio unificadas e diretrizes de gameplay)
│   └── domain_rules.md (regras core, combate fsm, identidade retro moderna e mobile first)
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
│   └── 04_PERFORMANCE_METRICS.md
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
- **Regras Core do Jogo?** → Leia [[domain/domain_rules.md]]
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

---

**Mantido por:** Felipe + Agentes de IA  
**Última revisão:** 2026-08-11
**Versão:** 1.1 (Graph Documentation with Domain Core Rules)

[[domain/domain_rules.md]] | [[context/FRONTEND_DEVELOPER.md]] | [[context/BACKEND_DEVELOPER.md]] | [[context/GAME_DESIGNER.md]] | [[context/QA_ENGINEER.md]]
