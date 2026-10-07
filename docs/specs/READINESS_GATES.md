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

## 📋 Status Atual de Specs (reconstruído em 2026-10-07)

> A versão de 2026-10-05 desta tabela estava errada (montada a partir de outra
> branch: listava 03, 06, 09, 10, 11, 16, 17, 25 como abertas — todas já estão
> em `delivered/`). Fonte de verdade: [`DEPENDENCY_MAP.yaml`](./DEPENDENCY_MAP.yaml).

| Spec | Nome | G1 Produto | G2 Protótipo | G3 Escopo | G4 Dependências | Bloqueio / Próxima ação |
|------|------|:-:|:-:|:-:|:-:|---|
| **35.02** | Gate E2E de Jogabilidade | ✅ | ✅ (sonda Playwright rodou em 2026-10-07) | ✅ | ✅ | **Executável agora** |
| **35.01** | Detecção WebGL + Light2D Phaser 4 | ✅ | ✅ (API verificada no Phaser 4.2.1 instalado) | ✅ | ⏳ 35.02 | Após 35.02 |
| **35.04** | Contaminação de biomas (chunks) | ✅ (default: streaming só na Campanha) | ✅ (bounds medidos) | ✅ | ⏳ 35.02 | Após 35.02 |
| **35.03** | Normal map do jogador | ✅ | ⏳ (tempo de boot não medido) | ✅ | ⏳ 35.01 | Após 35.01 |
| **35.05** | Calibração pós-religação | ⏳ Felipe | ❌ | ⏳ | ⏳ 35.01/03/04 | `scope-definition/` |
| **35.06** | Gates automatizados (hook/CI) | ⏳ Felipe (D1–D3) | ✅ (`pnpm test` 574/574 em ~32 s) | ✅ | ✅ | `scope-definition/` |
| **07** | Eventos Mundiais e Sazonais | ⏳ Felipe | ⏳ | ⏳ | ✅ | `scope-definition/` |
| **18** | Topologia de Mundo Contínuo | ⏳ Felipe | — | ⏳ | ✅ | `scope-definition/` |
| **08** | Mapeamento de Sprites | ✅ | ✅ | ✅ | ❌ arte externa | Aguarda orçamento de arte |
| **32** | Guia PixelLab | ✅ | ✅ | ✅ | ❌ arte externa | Aguarda orçamento de arte |
| **29** | Cloud Save Fase 5 | ⏳ Felipe (demanda + LGPD) | ✅ | ✅ | ✅ | Aguarda decisão comercial |

## 🏁 Lição da Spec 35 — Gate de Entrega (Definition of Done)

Os 4 gates acima decidem se uma spec **pode começar**. A auditoria da Spec 35
mostrou que falta um portão na **saída**: 23.01, 23.02, 23.03 e 25 (fase B.2)
foram para `delivered/` com testes unitários verdes, mas o comportamento não
existe em runtime (mocks com propriedades que o engine não tem).

**Regra:** uma spec que muda render, cenas ou geração de mundo só vai para
`delivered/` com **evidência de execução real** registrada no changelog
(sonda/E2E Playwright em WebGL, screenshot ou leitura de estado de
`window.gameScene`) — não só `pnpm test`.

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

**Última revisão:** 2026-10-07
