---
status: PROPOSTA / PENDENTE
phase: 5/5
priority: P1 (Alta para Lançamento)
start_date: 2026-08-11
eta: 2026-10-30
responsible: Jules (Google AI) & Felipe Teixeira
progress: 0%
agent_context: backend, frontend, game designer, release engineer
target_module: artifacts/bloodmage/src
last_updated: 2026-08-11
tags: [specs, phase-5, production-polish, pwa, twa, steam, gamepad, haptics, performance]
---

# 🚀 Fase 5: Polimento de Produção, Empacotamento Nativo (Play Store & Steam) e Imersão AAA

> **Status:** Proposta Detalhada | **Prioridade:** P1 (Crítica para Lançamento Comercial)

---

## 📋 Visão Geral

**Objetivo:** Elevar o Blood Mage 1995 de um protótipo avançado/PWA para um padrão de qualidade **comercial AAA indie** pronto para lançamento em lojas oficiais (Google Play Store via TWA, Steam via Web Wrapper/NW.js), garantindo fluidez a 60 FPS, suporte robusto a controles físicos (Gamepad), feedback tátil (Haptics), polimento gráfico de partículas/gore e zero regressões.

---

## 📝 Requisitos Funcionais

### Must Have (Lançamento Comercial)

- [ ] **Otimização de Performance & 60+ FPS em Mobile/Desktop**:
  - Object pooling avançado para projéteis, efeitos de sangue e partículas.
  - Culling rigoroso de entidades fora da viewport do Phaser.
  - Otimização de atlas de texturas para reduzir consumo de memória RAM/VRAM.
- [ ] **Suporte Completo a Gamepad / Controle Físico**:
  - Mapeamento automático de controles Xbox / PlayStation / Genéricos via Gamepad API do HTML5.
  - Navegação completa por controle nos menus e inventários (foco visual dinâmico).
- [ ] **Feedback Tátil (Haptic Feedback)**:
  - Integração com `navigator.vibrate` para impactos críticos, dano recebido e morte em dispositivos suportados.
- [ ] **Empacotamento PWA & TWA (Trusted Web Activity) para Google Play**:
  - Configuração rigorosa de manifest PWA com ícones maskable, splash screen e orientação travada.
  - Scripts e documentação para empacotamento TWA (Bubblewrap / Android Studio).
- [ ] **Polimento de Ambientação e Imersão Gráfica (Gore & Particles)**:
  - Partículas avançadas de sangue em impactos críticos e desmembramento visual simulado.
  - Ajuste fino de pós-processamento de luz (`darknessOverlay` e screen shake refinado).
- [ ] **Sistema de Conquistas (Achievements) e High Scores Persistentes**:
  - Registro local e nuvem de recordes com medalhas e desbloqueáveis na interface de High Scores.

### Nice to Have
- [ ] Suporte a múltiplos idiomas (Inglês, Português, Espanhol).
- [ ] Cloud Save automatizado (Firebase/Firestore) para salvamento multiplataforma.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/systems/InputManager.ts`: Abstração unificada para Joystick Virtual, Teclado e Gamepad API.
- `src/game/scenes/GameScene.ts`: Otimizações de render culling e object pooling.
- `src/utils/haptics.ts`: Utilitário de vibração e feedback sensorial.
- `src/utils/localStorage.ts`: Robustecimento dos schemas de save de recordes e configurações.
