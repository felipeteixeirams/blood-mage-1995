# ✅ Readiness Gates — Checklist de Specs Prontas

Cada spec em **backlog** ou **in-progress** deve passar por 4 gates antes de ser implementada:

## 🚪 Os 4 Gates Obrigatórios

### 1️⃣ **Product Decision** (Decisão de Produto)
- [ ] O Felipe/designer aprovou o conceito?
- [ ] Há conflito com outras features?
- [ ] O escopo foi aprovado (não é "achei que era assim")?

**Status:** ✅ = Decisão registrada | ❌ = Falta aprovação | ⏳ = Aguardando Felipe

---

### 2️⃣ **Technical Prototype** (Prototipagem Técnica)
- [ ] A abordagem técnica foi validada em spike?
- [ ] Há risco de "descobrir na implementação" que não funciona?
- [ ] Dependências de third-party estão claras?

**Status:** ✅ = Testado | ❌ = Precisa spike | ⏳ = Iniciando

---

### 3️⃣ **Scope Locked** (Escopo Congelado)
- [ ] Requisitos estão em seção "Dentro do Escopo"?
- [ ] Critérios de aceite estão bem definidos (não é "fica bonito")?
- [ ] Out-of-scope está explícito (o que NÃO faz)?

**Status:** ✅ = 100% definido | ❌ = Vago/ambíguo | ⏳ = Em refinamento

---

### 4️⃣ **Dependencies Resolved** (Dependências Resolvidas)
- [ ] Todas as specs blocantes foram entregues?
- [ ] Recursos externos (arte, áudio) estão disponíveis ou have fallback?
- [ ] Não há ciclos de dependência (A bloqueia B, B bloqueia A)?

**Status:** ✅ = Nenhuma blocante | ⏳ = Aguardando spec X | ❌ = Bloqueada

---

## 📋 Status Atual de Specs

### 🔒 Bloqueadas (Não começar até gates passarem)

| Spec | Nome | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Bloqueado por | Ação |
|------|------|--------|--------|--------|--------|---------------|------|
| **07** | Eventos Mundiais e Sazonais | ⏳ | ⏳ | ⏳ | ⏳ | Definição de escopo | Agendar refinamento |
| **08** | Mapeamento Sprites | ✅ | ✅ | ✅ | ❌ | Spec 14 (sprites) | Aguardar art |
| **13** | UI Assets Externos Framework | ✅ | ⏳ | ⏳ | ❌ | Spec 14 | Aguardar decisão |
| **14** | Sprites Assets Externos | ✅ | ⏳ | ⏳ | ❌ | Decisão Felipe | Escalate |
| **29** | Cloud Save Fase 5 | ✅ | ✅ | ⏳ | ✅ | Escopo grande (MVP) | Redefinir scope |

### ✅ Prontos para Implementar (Todos os 4 gates: ✅)

| Spec | Nome | Status | Next Action |
|------|------|--------|-------------|
| **03** | Fase 3 — Status Sobrevivência | in-progress | QA com Felipe |
| **06** | Eixo A — Gráficos Avançados | in-progress | Continue |
| **11** | Touchpad & Joystick Nativo | in-progress | Code review |

### ⏳ Outros (Prontos, sem gates definidos)

| Spec | Nome | Status | Ação |
|------|------|--------|------|
| **09** | Guia Direto Pixel Lab | in-progress | Documentação |
| **10** | Evolução Gráfica & Áudio | in-progress | Continue |
| **16** | UI Resolução Adaptativa | in-progress | Continue |
| **17** | Polimento Gráfico Calibração | in-progress | Continue |
| **18** | Topologia Mundo Contínuo | in-progress | Continue |
| **25** | Modais Secundários & Gamepad | in-progress | Continue |

### 🔍 Em QA (Código pronto, bloqueado em validação)

| Spec | Nome | Progress | Bloqueado em | Ação |
|------|------|----------|--------------|------|
| **03** | Fase 3 — Status Sobrevivência | 95% | Felipe QA | Agendar playtest |

---

## 🔄 Como Usar Este Documento

**Agente IA quer começar uma nova spec:**
1. Leia o frontmatter dela
2. Procure aqui se tem 4 ✅ ao lado
3. Se sim → comece
4. Se não → identifique qual gate falta e escalate pro Felipe

**Felipe quer liberar uma spec:**
1. Abra a issue da spec (ou arquivo)
2. Preencha os 4 gates
3. Faça commit com mensagem: `docs(specs): unlock [XX] — all gates passed`
4. Agent IA vê isso e começa

---

## 📌 Convenção de Commit

Ao atualizar gates, use:

```bash
git commit -m "docs(specs): readiness update — [XX] gate #2 passed (technical prototype)"
```

Assim o histórico de gates fica rastreável no git.

---

**Última revisão:** 2026-10-05
