---
role: QA Engineer
complexity: Medium
tokens_est: 2500
depends_on: [[../CRITICAL/03_TESTING_GATES.md]]
related_to: [[../CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]]
---

# 🧪 QA Engineer Context — Bloodmage 1995

> **Para QA:** Checklists de validação, testing gates e métricas de qualidade.

---

## 🎯 Responsabilidades

- ✅ Validar features contra specs
- ✅ Teste de regressão (anti-regression)
- ✅ Performance testing (60 FPS)
- ✅ Teste de edge cases
- ✅ Mobile/responsiveness testing
- ✅ Gamepad/input testing
- ✅ Relatórios de bugs

---

## 🚦 Testing Gates (Obrigatório Antes de Merge)

**Gate 1: TypeScript Strict**
```bash
pnpm run typecheck
# ✅ Resultado esperado: zero erros
```

**Gate 2: Teste Manual (Gameplay)**
- [ ] Iniciar partida
- [ ] Mover e atacar inimigos
- [ ] Castear skills (verificar cooldowns)
- [ ] Abrir modals (Inventário, Settings, Records)
- [ ] Pausar jogo
- [ ] Verificar HUD updates

**Gate 3: Teste de Regressão (Fase 1)**
```
Testes Fase 1 (Inconsciência):
1. [ ] HP <= 0 → player desmaiar (não morrer)
2. [ ] Inimigos param de atacar (aggro loss)
3. [ ] Inimigos se afastam do corpo
4. [ ] HP regenera lentamente (5%)
5. [ ] Player se levanta ao atingir 5% HP
6. [ ] Contador de desmaios: 1 → 2 → 3 (morte)
7. [ ] 3º desmaio → "Você está morto" screen
8. [ ] Fechar/reabrir game → status persiste
```

**Gate 4: Performance**
```
Desktop (Chrome/Firefox):
✅ 60 FPS durante gameplay
✅ <100ms latência de input
✅ <150MB RAM

Mobile (Safari/Chrome):
✅ 30+ FPS durante gameplay
✅ <200ms latência de input
✅ <100MB RAM
```

**Gate 5: Collision Testing**
```
✅ Projéteis não atravessam paredes
✅ Inimigos não atravessam paredes
✅ Player pode se mover normalmente
✅ Pickups colidem corretamente
```

---

## 📋 Checklist Por Feature

### Feature: Records Display

```markdown
Spec: [[../GAMEPLAY/05_RECORDS_SYSTEM.md]]

Funcionalidade:
- [ ] Modal abre ao clicar botão troféu
- [ ] Tabela mostra top 8 recordes
- [ ] Top 3 com destaque visual (cores/glow)
- [ ] Dados carregados de localStorage
- [ ] Botão FECHAR funciona
- [ ] Modal se fecha ao pressionar ESC

Responsividade:
- [ ] Desktop (1920x1080): layout correto
- [ ] Tablet (768x1024): responsivo
- [ ] Mobile (375x667): scroll se necessário

Performance:
- [ ] Modal abre <500ms
- [ ] Zero lag ao renderizar tabela
- [ ] Memory: <5MB adicionais
```

### Feature: Inconsciência (Fase 1)

```markdown
Spec: [[../FEATURES/01_INCONSCIOUSNESS_PHASE1.md]]

Mecânica Básica:
- [ ] Player perde HP normal
- [ ] HP <= 0 → transição para Inconsciente
- [ ] Sprite do player muda (desmaiado)
- [ ] Não há game over imediato

Comportamento de Inimigos:
- [ ] Inimigos param de atacar
- [ ] Inimigos se afastam radialmente
- [ ] Inimigos retornam à patrulha normal
- [ ] Sem "bugging" de IA (travamento)

Regeneração:
- [ ] HP regenera lentamente (~1 HP/seg)
- [ ] Player se levanta ao atingir 5%
- [ ] Transição suave (animação)

Knockout Counter:
- [ ] 1º desmaio: levanta normalmente
- [ ] 2º desmaio: levanta normalmente
- [ ] 3º desmaio: "Você está morto" screen
- [ ] Persistência: salva em localStorage

HUD Updates:
- [ ] HP bar atualiza em tempo real
- [ ] Status text mostra "Inconsciente"
- [ ] Sem crashes ou visual glitches
```

---

## 🐛 Relatório de Bug Template

```markdown
## Bug: [Descrição curta]

**Severidade:** [Crítica/Alto/Médio/Baixo]

**Reprodução:**
1. Iniciar jogo
2. [Passo 2]
3. [Passo 3]

**Comportamento Observado:**
[O que aconteceu]

**Comportamento Esperado:**
[O que deveria acontecer]

**Ambiente:**
- Browser: Chrome 130
- Sistema: Windows 11
- Resolução: 1920x1080
- FPS: 60

**Screenshots:**
[Se aplicável]

**Relacionado a:**
[[../GAMEPLAY/XX_FEATURE.md]]
```

---

## 📊 Métricas de Qualidade

### Code Quality
```
✅ TypeScript: strict mode (zero erros)
✅ Linting: ESLint (se configurado)
✅ Test Coverage: Target 60%+
```

### Performance
```
✅ Framerate: 60 FPS (desktop), 30+ (mobile)
✅ Input Latency: <150ms
✅ Memory: <150MB (desktop), <100MB (mobile)
✅ Load Time: <3s
```

### User Experience
```
✅ Touch responsiveness: <100ms
✅ Button hitboxes: >48px
✅ Contrast ratio: AA (4.5:1 minimum)
✅ No crashes in 10min gameplay
```

---

## 🔄 Regression Testing Matrix

| Feature | Crítico | Test | Frequency |
|---------|---------|------|-----------|
| Movement | ✅ Sim | Manual | Toda PR |
| Combat | ✅ Sim | Manual | Toda PR |
| Skills | ✅ Sim | Manual | Toda PR |
| Inconsciência | ✅ Sim | Estresse | Toda PR |
| UI/Modals | ⚠️ Médio | Manual | Toda PR |
| Performance | ✅ Sim | DevTools | Weekly |
| Mobile | ✅ Sim | Device | Weekly |

---

## 💾 Environments

### Local Development
```
yarn dev
# Localhost: http://localhost:5173
# DevTools: Aberto
# Performance Monitoring: Ativo
```

### Staging (Vercel)
```
https://blood-mage-1995.vercel.app/staging
# Para teste pré-merge
```

### Production
```
https://bloodmage-1995.vercel.app/
# Versão final
```

---

## 📚 Documentação Crítica Para QA

1. [[../CRITICAL/03_TESTING_GATES.md]] - Gates obrigatórios
2. [[../CRITICAL/02_PERFORMANCE_OPTIMIZATION.md]] - Perf targets
3. [[../GAMEPLAY/01_INCONSCIOUSNESS_SYSTEM.md]] - Specs de Fase 1
4. [[../FEATURES/01_INCONSCIOUSNESS_PHASE1.md]] - Roadmap

---

**Última atualização:** 2026-08-09  
**Versão:** 1.0

[[../README.md]] | [[FRONTEND_DEVELOPER.md]] | [[GAME_DESIGNER.md]]
