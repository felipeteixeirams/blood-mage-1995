---
agent_context: backend, frontend, game-designer, release-engineer
target_module: /src (root)
priority: high
criticality: medium
status: in-progress
phase: 5/5
start_date: 2026-08-11
eta: 2026-09-15
responsible: Claude (Anthropic), Felipe Teixeira & Jules (Google AI)
progress: "90% (Todos os requisitos Must Have implementados e testados; pendente apenas i18n — Cloud Save extraído para backlog/29_CLOUD_SAVE_FASE5.md por impedimento)"
last_updated: 2026-09-07
tags: [specs, phase-5, production-polish, pwa, twa, steam, gamepad, haptics, performance, graphics]
---

# 🚀 Fase 5: Polimento de Produção, Empacotamento Nativo (Play Store & Steam) e Imersão AAA

> **Status:** 90% Implementado (Must Have 100% Entregue) | **Prioridade:** P1 (Crítica para Lançamento Comercial)

---

## 📋 Visão Geral

**Objetivo:** Elevar o Blood Mage 1995 de um protótipo avançado/PWA para um padrão de qualidade **comercial AAA indie** pronto para lançamento em lojas oficiais (Google Play Store via TWA, Steam via Web Wrapper/Electron), garantindo fluidez a 60 FPS, suporte robusto a controles físicos (Gamepad API), feedback tátil (Haptics), polimento gráfico de partículas/gore, achievements e zero regressões.

---

## 📝 Requisitos Funcionais

### ✅ Must Have (100% Implementado & Entregue)

- [x] **Performance Optimization & 60+ FPS**:
  - `ObjectPool.ts`: Reutilização zero-GC de projéteis e partículas.
  - `ViewportCuller.ts`: Culling espacial de entidades fora da câmera.
  - `PerformanceMonitor.ts`: Monitoramento de FPS e métricas em tempo real.
- [x] **Gamepad & Controles Físicos**:
  - `InputManager.ts`: Suporte cross-platform a controles Xbox/PlayStation/Genéricos via Gamepad API.
  - Sincronização em `PlayerSkillSystem.ts` e `App.tsx`.
- [x] **Feedback Tátil (Haptics)**:
  - `src/utils/haptics.ts`: Vibração tátil (`navigator.vibrate`) para impactos de dano, morte e críticos.
- [x] **Empacotamento PWA & TWA**:
  - Web Manifest completo (`public/manifest.webmanifest`), suporte offline com Service Worker via Vite PWA em `src/App.tsx` e `src/main.tsx`.
  - Scripts de automação de build (`scripts/build-pwa.sh`, `scripts/build-twa.sh`, `scripts/build-steam.sh`).
- [x] **Polimento Gráfico & Partículas**:
  - `AdvancedParticles.ts`: Partículas avançadas para acertos, mortes espectrais, poeira óssea e acertos críticos.
  - `ScreenShake.ts` e `ScreenEffects.ts`: Shakes contextuais, aberração cromática e vinhetas de dano.
- [x] **Conquistas (Achievements)**:
  - `AchievementSystem.ts`: 10 conquistas com persistência LocalStorage, rewards de cristais/pontos de talento e toasts em React (`AchievementToast.tsx`).

---

### 🔍 Nice to Have (Pendente)

- [ ] **Suporte a múltiplos idiomas (i18n)**: Internacionalização da interface para Inglês, Português e Espanhol. **Destravado** — nenhuma dependência externa, pode ser iniciado a qualquer momento.

> ⛔ **Cloud Save extraído desta spec em 2026-09-07** (impedimento): item
> movido para [`backlog/29_CLOUD_SAVE_FASE5.md`](../backlog/29_CLOUD_SAVE_FASE5.md)
> — `docs/README.md` e `docs/product/ACCOUNT_AND_DATA.md` são explícitos:
> nenhuma integração de conta/nuvem sem confirmação prévia de Felipe. Essa
> confirmação nunca aconteceu, então não há próximo passo executável aqui
> agora. Esta spec (05) fica com escopo restrito a i18n até nova decisão.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/systems/InputManager.ts`: Abstração unificada para Joystick Virtual, Teclado e Gamepad API.
- `src/game/systems/ObjectPool.ts`: Pool genérico de objetos para zero GC pressure.
- `src/game/systems/ViewportCuller.ts`: Culling espacial de renderização.
- `src/game/systems/AchievementSystem.ts`: Engine de conquistas e rastreamento de métricas.
- `src/game/systems/AdvancedParticles.ts`: Emissor de partículas visuais de combate.
- `src/utils/haptics.ts`: Utilitário de vibração e feedback tátil.
- `src/App.tsx` & `src/main.tsx`: Registro de Service Worker PWA e listeners de Gamepad.

---

## 📊 Documentação de Referência
- `docs/specs/delivered/05_FASE5_POLIMENTO_PRODUCAO_COMPLETO.md` — Relatório detalhado de entrega dos requisitos Must-Have da Fase 5.
