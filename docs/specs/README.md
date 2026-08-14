---
role: Product Manager / Project Lead
complexity: Low
audience: Project Management + All Developers
agent_context: product
target_module: docs/specs
priority: high
status: active
last_updated: 2026-08-10
tags: [specs, index, status]
---

# 📋 Specs Index — Bloodmage 1995

> **Status de Features:** Organize todas as especificações por estágio de desenvolvimento.

---

## 🗺️ Estrutura de Specs

```
docs/specs//
├── README.md (este arquivo)
├── propostas// — Ideias, não iniciado ainda
├── andamento// — Em desenvolvimento ativo
└── finalizadas// — Concluído e testado
```

---

## 📊 Status Overview

### 🟢 FINALIZADAS (Pronto em Produção)

| Feature | Status | Responsável | Completado |
|---------|--------|-------------|-----------|
| **Records Display** | ✅ Completo | Claude + Felipe | 2026-08-09 |
| **Game Design Philosophy** | ✅ Completo | Felipe | 2026-08-09 |
| **Core Combat Feel** | ✅ Completo | Jules | 2026-08-08 |
| **Inconsciência — Fase 1** | ✅ Completo | Jules | 2026-08-10 |
| **Tela de Morte & Cadáver — Fase 2** | ✅ Completo | Jules | 2026-08-10 |
| **Condições de Status — Fase 3** | ✅ Completo | Jules | 2026-08-10 |
| **Mundo Contínuo — Fase 4** | ✅ Completo | Felipe + Jules | 2026-08-11 |
| **Polimento de Produção — Fase 5** | ✅ **100% COMPLETO** | Claude + Felipe | 2026-08-11 |

**Documentação:** [[./finalizadas/]]

---

### 🟡 ANDAMENTO (Desenvolvimento Ativo)

| Feature | Fase | Responsável | ETA | Progresso |
|---------|------|-------------|-----|-----------|
| **Mapeamento de Sprites & Checklist** | Living Spec | Felipe + Jules | Contínuo | 🟡 18.7% (UI Pronta) |
| **Guia de Prompts do Pixel Lab** | Referência | Felipe + Jules | Contínuo | 🟢 100% |
| **Mundo Contínuo (Fase 4)** | 4/4 | Jules | 2026-09-30 | 🟡 80% |
| **Polimento de Produção & PWA/Steam (Fase 5)** | 5/5 | Jules + Felipe | 2026-10-30 | 🟡 0% (Proposta) |

**Documentação:** [[./andamento/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md]] | [[./andamento/09_PIXEL_LAB_PROMPT_GUIDE.md]]

---

### 🔵 PROPOSTAS (Backlog)

| Feature | Prioridade | Conceito | Documento de Especificação | Responsável |
|---------|-----------|----------|----------------------------|-------------|
| **Evolução de UI com Assets Externos** | Alta | Transição para pixel art de alta resolução com fallback de gerador de texturas procedural | [[./propostas/02_DISCOVERY_UI_ASSETS_EXTERNOS.md]] | Jules |
| **Evolução Gráfica Avançada** | Média | postFX WebGL + iluminação Light2D/normal maps + pipeline de assets | [[./propostas/01_EVOLUCAO_GRAFICA_AVANCADA.md]] | - |
| **Multijogador Cooperativo** | Média | Cooperação, ressurreição mútua e interações rúnicas P2P via WebRTC | [[./propostas/03_MULTIJOVADOR_COOPERATIVO_E_INTERATIVIDADE.md]] | Jules |
| **Mobile App & Monetização** | Alta | Empacotamento Capacitor, UX móvel aprimorada e monetização ética não-intrusiva | [[./propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md]] | Jules |
| **Skinning & Camadas Canvas** | Média | Customização em tempo real de skins, armas e armaduras usando composições no gerador procedural | [[./propostas/05_SISTEMA_DE_SKINNING_E_CAMADAS_DINAMICAS.md]] | Jules |
| **Prestige (Blood Seal)** | Média | Reset opcional de nível para bônus passivos permanentes e escalonamento simples de dificuldades | [[./propostas/06_SISTEMA_DE_PRESTIGIO_BLOOD_SEAL.md]] | Jules |
| **Eventos Globais & Sazonais** | Média | Eventos rotativos imersivos (Eclipse, Cerco, Rifts) e comemorações de calendário góticas | [[./propostas/07_EVENTOS_MUNDIAIS_E_SAZONAIS.md]] | Jules |
| **Guia de Evolução Comercial** | Alta | Roteiro de transição para padrão comercial (Diablo II / Dungeon Siege) em mobile e desktop | [[./propostas/08_GUIA_EVOLUCAO_COMERCIAL.md]] | Jules + Felipe |

**Documentação:** [[./propostas/]]

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

**Ação:** Mova arquivo de propostas// para andamento//  
**Crie:** Spec detalhado em [[../features/XX_NOME.md]]

### Discovery → Andamento

**Checklist:**
- [ ] Spec completa em [[../features/XX_NOME.md]]?
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

**Ação:** Mova arquivo para finalizadas//  
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

### Dentro de finalizadas//

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
- Spec: [[../../gameplay/05_RECORDS_SYSTEM.md]]
- Design: [[../../design/02_UI_PATTERNS.md]]
- Context: [[../../context/FRONTEND_DEVELOPER.md]]
```

### Dentro de andamento//

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
- Spec: [[../../features/01_INCONSCIOUSNESS_PHASE1.md]]
- Context: [[../../context/GAME_DESIGNER.md]]
- Critical: [[../../critical/01_CRITICAL_FILES.md]]

## 🚦 Testing Gates
- TypeScript strict ✅
- Teste 3x desmaios
- FPS 60+
- Zero regressões
```

### Dentro de propostas//

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

Status de features: docs/specs//README.md

Sua feature está em:
- propostas// → Ainda em discussão
- andamento// → Implemente agora!
- finalizadas// → Já entregue, manutenção

Link para sua spec: [[../features/XX.md]]
```

### Para Felipe (Product Manager)

```
1. Nova ideia?
   → Crie arquivo em propostas//
   → Convide agentes para discussão

2. Feature aprovada?
   → Mova para andamento//
   → Crie spec em features//

3. Feature pronta?
   → Mova para finalizadas//
   → Archive histórico se necessário
```

### Para Jules / Agentes de Desenvolvimento

```
1. Receba task de Felipe
   → Abra docs/specs/andamento/
   → Encontre sua feature
   → Leia spec em [[../features/XX.md]]

2. Implementar
   → Segue contexto de seu role ([[../context/]])
   → Valida contra [[../critical/]]

3. Pronto?
   → Notifica Felipe
   → Felipe move para finalizadas//
```

---

## 📊 Dashboard de Status

### Gráfico de Progresso

```
FINALIZADAS    ██████████  100% (6/6)
ANDAMENTO      ████████░░   80% (1/1)
PROPOSTAS      ██████░░░░   60% (7/7)

Total: 14 features
Completado: 6
Em progresso: 1
Backlog: 7 (Especificadas em Detalhe)
```

### Timeline

```
Ago 2026 |█████████████|  Records (✅)
         |█████████████|  Inconsciência (✅ 100%)
         |█████████████|  Menu Morte (✅ 100%)
         |█████████████|  Status Effects (✅ 100%)
Set 2026 |████████░░░░░|  Mundo Contínuo (🟡 80%)
```

---

## 🔔 Notificações de Status

### Quando Atualizar

**SEMPRE atualize status quando:**

1. ✅ Feature completada (PR merged)
   - Move de andamento// → finalizadas//
   - Update date em frontmatter
   - Link para PR #numero

2. 🟡 Feature iniciar desenvolvimento
   - Move de propostas// → andamento//
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
- [[../features/]] - Especificações detalhadas
- [[../context/]] - Contextos por role
- [[../critical/]] - Proteção anti-regressão

---

## 🚀 Próximos Passos

- [ ] Preencher finalizadas// com features pronto
- [ ] Preencher andamento// com features em dev
- [ ] Organizar propostas// com ideias aprovadas
- [ ] Setup automático de update de status
- [ ] Integrar com GitHub Issues/Projects
- [ ] Criar automação para mover specs

---

**Mantido por:** Felipe (Product Manager)  
**Última atualização:** 2026-08-10  
**Versão:** 1.1

[[../README.md]] | [[./finalizadas/]] | [[./andamento/]] | [[./propostas/]]
