---
role: Product Manager / Project Lead
complexity: Low
audience: Project Management + All Developers
---

# 📋 Specs Index — Bloodmage 1995

> **Status de Features:** Organize todas as especificações por estágio de desenvolvimento.

---

## 🗺️ Estrutura de Specs

```
docs/SPECS/
├── README.md (este arquivo)
├── PROPOSTAS/ — Ideias, não iniciado ainda
├── ANDAMENTO/ — Em desenvolvimento ativo
└── FINALIZADAS/ — Concluído e testado
```

---

## 📊 Status Overview

### 🟢 FINALIZADAS (Pronto em Produção)

| Feature | Status | Responsável | Completado |
|---------|--------|-------------|-----------|
| **Records Display** | ✅ Completo | Claude + Felipe | 2026-08-09 |
| **Game Design Philosophy** | ✅ Completo | Felipe | 2026-08-09 |
| **Core Combat Feel** | ✅ Completo | Jules | 2026-08-08 |

**Documentação:** [[./FINALIZADAS/]]

---

### 🟡 ANDAMENTO (Desenvolvimento Ativo)

| Feature | Fase | Responsável | ETA | Progresso |
|---------|------|-------------|-----|-----------|
| **Inconsciência (Fase 1)** | Discovery | Jules | 2026-08-20 | 📝 Spec pronta |
| **Menu de Morte (Fase 2)** | Discovery | Jules | 2026-09-10 | 📝 Spec pronta |
| **Status Effects (Fase 3)** | Discovery | Jules | 2026-10-01 | 📝 Spec pronta |
| **Mundo Contínuo (Fase 4)** | Discovery | Jules | 2026-11-01 | 📝 Spec pronta |

**Documentação:** [[./ANDAMENTO/]]

---

### 🔵 PROPOSTAS (Backlog)

| Feature | Prioridade | Conceito | Responsável |
|---------|-----------|----------|-------------|
| **PvP Multiplayer** | Baixa | Adicionar modo competitivo | - |
| **Mobile App** | Média | Build nativa iOS/Android | - |
| **Skinning System** | Média | Personalizações de personagem | - |
| **Prestige Mode** | Baixa | New Game+ com progressão | - |
| **World Events** | Média | Eventos dinâmicos globais | - |

**Documentação:** [[./PROPOSTAS/]]

---

## 🎯 Legenda de Status

### Estágios de Feature

```
1️⃣ PROPOSTA
   ├─ Conceito escrito
   ├─ Discussão de viabilidade
   └─ Pronto para Discovery

2️⃣ DISCOVERY
   ├─ Especificação detalhada (GDD)
   ├─ Design document completo
   └─ Pronto para implementação

3️⃣ ANDAMENTO
   ├─ Desenvolvimento ativo
   ├─ PRs em revisão
   ├─ Testes em paralelo
   └─ Pronto para validação QA

4️⃣ QA
   ├─ Testing gates validados
   ├─ Bugs reportados + fixados
   ├─ Performance validada
   └─ Pronto para merge

5️⃣ FINALIZADAS
   ├─ Merged em main
   ├─ Deployed em produção
   ├─ Monitorado por bugs
   └─ Documentação atualizada
```

---

## 📈 Pipeline de Features

```
PROPOSTAS
    ↓
(Discussion com Felipe)
    ↓
DISCOVERY (Spec detalhado)
    ↓
ANDAMENTO (Desenvolvimento)
    ↓
QA (Testes)
    ↓
FINALIZADAS (Deploy)
    ↓
MONITORED (Produção)
```

---

## 🔄 Workflow de Mudança de Status

### Proposta → Discovery

**Checklist:**
- [ ] Discussão realizada com Felipe?
- [ ] Viabilidade técnica confirmada?
- [ ] Design agreement conseguido?
- [ ] Prioridade definida (P0-P3)?

**Ação:** Mova arquivo de PROPOSTAS/ para ANDAMENTO/  
**Crie:** Spec detalhado em [[../FEATURES/XX_NOME.md]]

### Discovery → Andamento

**Checklist:**
- [ ] Spec completa em [[../FEATURES/XX_NOME.md]]?
- [ ] Contexto criado para agentes (ex: GAME_DESIGNER.md)?
- [ ] Testing gates documentados?
- [ ] Agente de IA designado?

**Ação:** Crie PR com branch `feature/XX-nome`  
**Link:** Referência spec em commit

### Andamento → QA

**Checklist:**
- [ ] Code review aprovado?
- [ ] TypeScript: zero erros?
- [ ] Sem regressões documentadas?
- [ ] Testing gates passando?

**Ação:** Mova arquivo para FINALIZADAS/  
**Crie:** Relatório de QA

### QA → Finalizadas

**Checklist:**
- [ ] Todos os testes passaram?
- [ ] Performance validada?
- [ ] Documentação atualizada?
- [ ] Bug nenhum encontrado?

**Ação:** Merge para main  
**Deploy:** Produção

---

## 📂 Organização de Arquivos Spec

### Dentro de FINALIZADAS/

```markdown
# Records Display System

---
status: FINALIZADA
phase: V1
completed_date: 2026-08-09
responsible: Claude + Felipe
link_to_pr: #18
---

## ✅ O que foi entregue
- Modal de records funcional
- Top 8 com design harmonizado
- Integração localStorage
- Botão troféu no HUD

## 📊 Métricas
- Performance: 60 FPS ✅
- Memory: <5MB ✅
- Tests: Todos passaram ✅

## 📝 Documentação
- Spec: [[../../GAMEPLAY/05_RECORDS_SYSTEM.md]]
- Design: [[../../DESIGN/02_UI_PATTERNS.md]]
- Context: [[../../CONTEXT/FRONTEND_DEVELOPER.md]]
```

### Dentro de ANDAMENTO/

```markdown
# Inconsciência (Fase 1)

---
status: ANDAMENTO
phase: 1/4
start_date: 2026-08-09
eta: 2026-08-20
responsible: Jules
---

## 📋 O que será feito
- Estado de desmaio ao invés de morte
- Inimigos perdem aggro
- Regeneração passiva
- Limite de 2 desmaios por sessão

## 🎯 Success Criteria
- [ ] Player desmaiar ao HP <= 0
- [ ] Inimigos se afastam
- [ ] HP regenera até 5%
- [ ] Contador funciona
- [ ] localStorage persiste

## 📚 Documentação
- Spec: [[../../FEATURES/01_INCONSCIOUSNESS_PHASE1.md]]
- Context: [[../../CONTEXT/GAME_DESIGNER.md]]
- Critical: [[../../CRITICAL/01_CRITICAL_FILES.md]]

## 🚦 Testing Gates
- TypeScript strict ✅
- Teste 3x desmaios
- FPS 60+
- Zero regressões
```

### Dentro de PROPOSTAS/

```markdown
# PvP Multiplayer System

---
status: PROPOSTA
priority: BAIXA
phase: Conceito
---

## 💡 Conceito
Adicionar modo competitivo onde 2-4 jogadores lutam entre si.

## 🎮 Jogabilidade
- Arena pequena (não o calabouço)
- Sem inimigos
- Drop de loot normal
- Fim do jogo: último vivo ganha

## ⚠️ Desafios Técnicos
- Sincronização de rede
- Latência de inputs
- Anti-cheat

## 📊 Viabilidade
- Técnica: ⚠️ Alta (requer backend)
- Design: ✅ Média
- Prioridade: 🔵 Baixa

## 👤 Próximos Passos
- Discussão com Felipe
- Design refinement
- Estimar esforço
```

---

## 🎯 Como Usar Este Index

### Para Agentes de IA

```markdown
Você trabalha no Bloodmage 1995.

Status de features: docs/SPECS/README.md

Sua feature está em:
- PROPOSTAS/ → Ainda em discussão
- ANDAMENTO/ → Implemente agora!
- FINALIZADAS/ → Já entregue, manutenção

Link para sua spec: [[../FEATURES/XX.md]]
```

### Para Felipe (Product Manager)

```
1. Nova ideia?
   → Crie arquivo em PROPOSTAS/
   → Convide agentes para discussão

2. Feature aprovada?
   → Mova para ANDAMENTO/
   → Crie spec em FEATURES/

3. Feature pronta?
   → Mova para FINALIZADAS/
   → Archive histórico se necessário
```

### Para Jules / Agentes de Desenvolvimento

```
1. Receba task de Felipe
   → Abra docs/SPECS/ANDAMENTO/
   → Encontre sua feature
   → Leia spec em [[../FEATURES/XX.md]]

2. Implementar
   → Segue contexto de seu role ([[../CONTEXT/]])
   → Valida contra [[../CRITICAL/]]

3. Pronto?
   → Notifica Felipe
   → Felipe move para FINALIZADAS/
```

---

## 📊 Dashboard de Status

### Gráfico de Progresso

```
FINALIZADAS    ████░░░░░░  40% (2/5)
ANDAMENTO      ████████░░  80% (4/5)
PROPOSTAS      ░░░░░░░░░░   0% (0/5)

Total: 11 features
Completado: 2
Em progresso: 4
Backlog: 5
```

### Timeline

```
Ago 2026 |█████████████|  Records (✅)
         |█████████     |  Inconsciência (80%)
         |████░░░░░░░   |  Menu Morte (40%)
         |░░░░░░░░░░░   |  Status Effects (0%)
Set 2026 |░░░░░░░░░░░   |  Mundo Contínuo (0%)
```

---

## 🔔 Notificações de Status

### Quando Atualizar

**SEMPRE atualize status quando:**

1. ✅ Feature completada (PR merged)
   - Move de ANDAMENTO/ → FINALIZADAS/
   - Update date em frontmatter
   - Link para PR #numero

2. 🟡 Feature iniciar desenvolvimento
   - Move de PROPOSTAS/ → ANDAMENTO/
   - Set start_date
   - Assign responsible

3. 🔴 Feature bloqueada
   - Adicione status: BLOQUEADA
   - Explique bloqueador
   - ETA revisada

4. 📝 Spec atualizada
   - Update version em frontmatter
   - Commit message referencia spec
   - Notifique agentes

---

## 📚 Documentação Relacionada

- [[../README.md]] - Índice principal
- [[../FEATURES/]] - Especificações detalhadas
- [[../CONTEXT/]] - Contextos por role
- [[../CRITICAL/]] - Proteção anti-regressão

---

## 🚀 Próximos Passos

- [ ] Preencher FINALIZADAS/ com features pronto
- [ ] Preencher ANDAMENTO/ com features em dev
- [ ] Organizar PROPOSTAS/ com ideias aprovadas
- [ ] Setup automático de update de status
- [ ] Integrar com GitHub Issues/Projects
- [ ] Criar automação para mover specs

---

**Mantido por:** Felipe (Product Manager)  
**Última atualização:** 2026-08-09  
**Versão:** 1.0

[[../README.md]] | [[./FINALIZADAS/]] | [[./ANDAMENTO/]] | [[./PROPOSTAS/]]
