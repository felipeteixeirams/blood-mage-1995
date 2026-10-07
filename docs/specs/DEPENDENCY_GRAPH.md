# 📊 Spec Dependency Graph — Bloodmage 1995

**Última atualização:** 2026-10-07 03:30:55

---

## 📈 Sumário de Status

- 🔒 **Bloqueados:** 9 specs
- ✅ **Prontos:** 2 specs
- 🔍 **Em QA/Validação:** 0 specs
- 🗂️ **Outras (não executáveis/organização):** 1 specs

---

## 🔒 Bloqueados (Não Iniciar)

| Spec | Nome | Bloqueado Por | Status |
|------|------|---------------|--------|
| 07 | Eventos Mundiais e Sazonais | Externo | waiting_decision |
| 08 | Mapeamento Completo de Sprites & Checklist | Externo | waiting_external |
| 18 | Topologia de Mundo Contínuo e Variedade Orgânica | Externo | waiting_decision |
| 29 | Cloud Save — Fase 5 | Externo | waiting_decision |
| 32 | Guia de Produção de Sprites PixelLab | Externo | waiting_external |
| 35.01 | Detecção WebGL e Iluminação Phaser 4 Real | Spec 35.02 | waiting_spec |
| 35.03 | Normal Map e Iluminação do Jogador | Spec 35.01 | waiting_spec |
| 35.04 | Contaminação de Biomas no Chunk Streaming | Spec 35.02 | waiting_spec |
| 35.05 | Calibração Visual Pós-Religação e Orçamento de Render | Spec 35.01, Spec 35.03, Spec 35.04, Externo | waiting_decision, waiting_spec |

### Detalhes de Bloqueadores Externos

**[07] Eventos Mundiais e Sazonais**
- Bloqueado por: Felipe (decisão de produto)
- Razão: Qual evento implementar primeiro e escopo por satélite

**[08] Mapeamento Completo de Sprites & Checklist**
- Bloqueado por: Felipe (orçamento + direção de arte)
- Razão: Sprites físicos dos personagens ainda não produzidos (orçamento de arte)

**[18] Topologia de Mundo Contínuo e Variedade Orgânica**
- Bloqueado por: Felipe (decisão de produto)
- Razão: Partially superseded por delivered/25; variedade interna de gloomy_woods é desejo ou escopo?

**[29] Cloud Save — Fase 5**
- Bloqueado por: Felipe (confirmação comercial)
- Razão: Nenhuma integração de conta/nuvem sem aprovação explícita (demanda comercial + LGPD)

**[32] Guia de Produção de Sprites PixelLab**
- Bloqueado por: Felipe (orçamento + direção de arte)
- Razão: Só tem valor com produção PixelLab ativa

**[35.05] Calibração Visual Pós-Religação e Orçamento de Render**
- Bloqueado por: Felipe (direção de arte + metas de performance)
- Razão: Decisões do Felipe: aparelho-alvo e metas de FPS, leitura por bioma, posição da luz do jogador

---

## ✅ Prontos para Implementar

| Spec | Nome | Status | Readiness |
|------|------|--------|-----------|
| 35.00 | Índice Mestre — Jogável e Visual sem Assets | backlog | ❓ Não definido |
| 35.02 | Gate E2E de Jogabilidade (Arcade + Campanha) | backlog | ❓ Não definido |

---

## 🗂️ Outras (não executáveis por agente)

- **[25-raiz] Arquivo solto docs/specs/25_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md** (housekeeping) — Quase-duplicata de delivered/28 (ambas status: completed). Mesclar diferenças e apagar — aguarda OK do Felipe

---

## 🌳 Árvore de Dependências

```
📝 [07] Eventos Mundiais e Sazonais
  └─ ⛔ BLOQUEADO: Qual evento implementar primeiro e escopo por satélite
📋 [08] Mapeamento Completo de Sprites & Checklist
  └─ ⏳ BLOQUEADO: Sprites físicos dos personagens ainda não produzidos (orçamento de arte)
📝 [18] Topologia de Mundo Contínuo e Variedade Orgânica
  └─ ⛔ BLOQUEADO: Partially superseded por delivered/25; variedade interna de gloomy_woods é desejo ou escopo?
❓ [25-raiz] Arquivo solto docs/specs/25_UI_MODAIS_SECUNDARIOS_E_GAMEPAD_NAVIGATION.md
📋 [29] Cloud Save — Fase 5
  └─ ⛔ BLOQUEADO: Nenhuma integração de conta/nuvem sem aprovação explícita (demanda comercial + LGPD)
📋 [32] Guia de Produção de Sprites PixelLab
  └─ ⏳ BLOQUEADO: Só tem valor com produção PixelLab ativa
📋 [35.00] Índice Mestre — Jogável e Visual sem Assets
📋 [35.01] Detecção WebGL e Iluminação Phaser 4 Real
  └─ 📋 [35.02] Gate E2E de Jogabilidade (Arcade + Campanha)
📋 [35.02] Gate E2E de Jogabilidade (Arcade + Campanha)
📋 [35.03] Normal Map e Iluminação do Jogador
  └─ 📋 [35.01] Detecção WebGL e Iluminação Phaser 4 Real
    └─ 📋 [35.02] Gate E2E de Jogabilidade (Arcade + Campanha)
📋 [35.04] Contaminação de Biomas no Chunk Streaming
  └─ 📋 [35.02] Gate E2E de Jogabilidade (Arcade + Campanha)
📝 [35.05] Calibração Visual Pós-Religação e Orçamento de Render
  └─ 📋 [35.01] Detecção WebGL e Iluminação Phaser 4 Real
    └─ 📋 [35.02] Gate E2E de Jogabilidade (Arcade + Campanha)
  └─ 📋 [35.03] Normal Map e Iluminação do Jogador
  └─ 📋 [35.04] Contaminação de Biomas no Chunk Streaming
  └─ ⛔ BLOQUEADO: Decisões do Felipe: aparelho-alvo e metas de FPS, leitura por bioma, posição da luz do jogador
```

---

## 🔑 Legenda

| Ícone | Significado |
|-------|-------------|
| 📋 | Spec em Backlog |
| 🔨 | Spec em Desenvolvimento |
| 📝 | Spec em Definição de Escopo |
| 🔒 | Spec Bloqueada |
| ⛔ | Bloqueado por Decisão Externa |
| ⏳ | Aguardando Recurso Externo |
| ✅ | Pronto/Completo |
