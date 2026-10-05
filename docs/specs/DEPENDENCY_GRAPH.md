# 📊 Spec Dependency Graph — Bloodmage 1995

**Última atualização:** 2026-10-05 04:42:15

---

## 📈 Sumário de Status

- 🔒 **Bloqueados:** 5 specs
- ✅ **Prontos:** 12 specs
- 🔍 **Em QA/Validação:** 1 specs

---

## 🔒 Bloqueados (Não Iniciar)

| Spec | Nome | Bloqueado Por | Status |
|------|------|---------------|--------|
| 07 | Eventos Mundiais e Sazonais | Decisão externa | waiting_design |
| 08 | Mapeamento Completo de Sprites & Checklist | Spec 14 | waiting_external |
| 13 | UI Assets Externos Framework | Spec 14 | waiting_spec |
| 14 | Sprites & Assets Externos Tiers | Decisão externa | waiting_decision |
| 29 | Cloud Save — Fase 5 | Decisão externa | deprioritized |

### Detalhes de Bloqueadores Externos

**[08] Mapeamento Completo de Sprites & Checklist**
- Bloqueado por: Felipe (decisão de orçamento de arte)
- Razão: Sprites físicos (arte pixel) ainda não produzidos

**[14] Sprites & Assets Externos Tiers**
- Bloqueado por: Felipe (decisão estratégica)
- Razão: Orçamento de arte e direção artística ainda pendente de decisão do Felipe

---

## ✅ Prontos para Implementar

| Spec | Nome | Status | Readiness |
|------|------|--------|-----------|
| 01 | DISCOVERY — Avaliação Arquitetural Phaser 4.2.1 | discovery | ❓ Não definido |
| 02 | Discovery — Pipeline de Integração de Assets Externos | discovery | ❓ Não definido |
| 04 | DISCOVERY — Mobile App & Monetização Indie | discovery | ❓ Não definido |
| 05 | REJEITADA — Sistema de Skinning e Camadas Dinâmicas | rejected | ❓ Não definido |
| 06 | Eixo A — Gráficos Avançados | in-progress | ✅ Todos |
| 09 | Guia Direto para Pixel Lab (Bloodmage 1995) | in-progress | ❓ Não definido |
| 10 | Evolução Gráfica & Auditiva (Quick Wins & Roadmap) | in-progress | ❓ Não definido |
| 11 | Touchpad & Joystick Virtual Nativo Phaser | in-progress | ✅ Todos |
| 16 | Evolução Gráfica — Resolução Adaptativa & UI | in-progress | ❓ Não definido |
| 17 | Polimento Gráfico — Calibração dos Sistemas | in-progress | ❓ Não definido |
| 18 | Topologia de Mundo Contínuo e Variedade | in-progress | ❓ Não definido |
| 25 | Padronização de Modais Secundários & Gamepad | in-progress | ❓ Não definido |

---

## 🔍 Em QA/Validação (Código Pronto, Bloqueado em Playtest)

**[03] Fase 3 — Status de Sobrevivência**
- Progresso: 95%
- Bloqueado em: Felipe (QA manual e tuning)
- Nota: Código 100% pronto, aguardando playtest

---

## 🌳 Árvore de Dependências

```
🔨 [03] Fase 3 — Status de Sobrevivência
🔨 [06] Eixo A — Gráficos Avançados
🔨 [11] Touchpad & Joystick Virtual Nativo Phaser
🔨 [09] Guia Direto para Pixel Lab (Bloodmage 1995)
🔨 [10] Evolução Gráfica & Auditiva (Quick Wins & Roadmap)
🔨 [16] Evolução Gráfica — Resolução Adaptativa & UI
🔨 [17] Polimento Gráfico — Calibração dos Sistemas
🔨 [18] Topologia de Mundo Contínuo e Variedade
🔨 [25] Padronização de Modais Secundários & Gamepad
❓ [01] DISCOVERY — Avaliação Arquitetural Phaser 4.2.1
❓ [02] Discovery — Pipeline de Integração de Assets Externos
❓ [04] DISCOVERY — Mobile App & Monetização Indie
❓ [05] REJEITADA — Sistema de Skinning e Camadas Dinâmicas
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
