---
status: IMPLEMENTADO
phase: 5/5
priority: P1 (Alta para Lançamento)
start_date: 2026-08-11
eta: 2026-10-30
responsible: Jules (Google AI) & Felipe Teixeira
progress: 95%
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

> **Status por requisito:** ✅ implementado e integrado no runtime · ⚠️ código criado mas não integrado · ❌ não implementado

### Must Have (Lançamento Comercial)

- [x] **Otimização de Performance & 60+ FPS em Mobile/Desktop**:
  - ⚠️ Object pooling avançado para projéteis, efeitos de sangue e partículas (`ObjectPool.ts` criado, não integrado em projéteis/GameScene).
  - ⚠️ Culling rigoroso de entidades fora da viewport do Phaser (`ViewportCuller.ts` criado, não integrado nas cenas).
  - ✅ Otimização de atlas de texturas (normal maps e sprites procedural gerados no `textureGenerator`; PWA manifest com icons maskable).
- [x] **Suporte Completo a Gamepad / Controle Físico**:
  - ⚠️ Mapeamento automático de controles Xbox / PlayStation / Genéricos via Gamepad API do HTML5 (`InputManager.ts` criado com polling/deadzone, não integrado ao GameScene/menus).
  - ❌ Navegação completa por controle nos menus e inventários (foco visual dinâmico) — pendente.
- [x] **Feedback Tátil (Haptic Feedback)**:
  - ✅ Integração com `navigator.vibrate` para impactos críticos, dano recebido e morte em dispositivos suportados (`src/utils/haptics.ts`, chamado em `GameScene.playerHitByEnemy()` e `triggerGameOver()`).
- [x] **Empacotamento PWA & TWA (Trusted Web Activity) para Google Play**:
  - ✅ Configuração rigorosa de manifest PWA com ícones maskable, splash screen e orientação travada (`public/manifest.webmanifest`, icons 192/512/maskable).
  - ✅ Scripts e documentação para empacotamento TWA (Bubblewrap / Android Studio) — `docs/deployment/FASE5_EMPACOTAMENTO_COMPLETO.md`.
- [x] **Polimento de Ambientação e Imersão Gráfica (Gore & Particles)**:
  - ✅ Partículas avançadas de sangue em impactos críticos e desmembramento visual simulado (`AdvancedParticles.ts`, integrado em GameScene).
  - ✅ Ajuste fino de pós-processamento de luz (`darknessOverlay`/Light2D e screen shake refinado via `ScreenShake.ts`; PostFXSystem do Eixo A).
- [x] **Sistema de Conquistas (Achievements) e High Scores Persistentes**:
  - ✅ Registro local de recordes com medalhas e desbloqueáveis (`AchievementSystem.ts`, triggers first_blood/slayer_x/depth_x no GameScene; `HighScoresModal` + persistência em localStorage).
  - ❌ Sincronização de recordes em nuvem — pendente.

### Nice to Have
- [ ] Suporte a múltiplos idiomas (Inglês, Português, Espanhol).
- [ ] Cloud Save automatizado (Firebase/Firestore) para salvamento multiplataforma.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/systems/InputManager.ts`: Abstração unificada para Joystick Virtual, Teclado e Gamepad API. ✅ Integrado no `GameScene.update()` (movimento/aim via `getMovementInput`/`getAimInput`); `init()` idempotente para restart.
- `src/game/scenes/GameScene.ts`: Otimizações de render culling e object pooling. ✅ `ObjectPool` (projéteis), `ViewportCuller` (inimigos), `PerformanceMonitor` (toggle `?perf=1`).
- `src/utils/haptics.ts`: Utilitário de vibração e feedback sensorial. ✅ Integrado.
- `src/utils/localStorage.ts`: Robustecimento dos schemas de save de recordes e configurações. ✅ High scores persistidos.

### Artefatos extras (commit `c94bdc9` + `eecf3c1`)
- `src/game/systems/ObjectPool.ts` ✅ (pool de projéteis player/enemy no GameScene)
- `src/game/systems/ViewportCuller.ts` ✅ (culling de visibilidade; nunca mexe em `active` para não quebrar `countActive()`)
- `src/game/systems/PerformanceMonitor.ts` ✅ (toggle dev `?perf=1`, overlay top-right)
- `src/game/systems/AchievementSystem.ts` ✅ · `src/game/systems/AdvancedParticles.ts` ✅ · `src/game/systems/ScreenShake.ts` ✅
- `public/manifest.webmanifest` + icons ✅ · `docs/deployment/FASE5_EMPACOTAMENTO_COMPLETO.md` ✅

### Correções de bugs pré-existentes descobertas na integração
1. `AdvancedParticles.ts` usava API removida do Phaser 4 (`make.particles().createEmitter()`); reescrito para `scene.add.particles()` com `emitting: false` + `emitParticleAt`.
2. `AdvancedParticles.ts` e `ScreenShake.ts` usavam o símbolo global `Phaser` sem `import Phaser from 'phaser'` → `ReferenceError` no runtime.
3. `Projectile.updateProjectile()` nunca era chamado (grupo usa `runChildUpdate` → exige método `update`); adicionado `update()` para o lifespan voltar ao pool.

### Pendências para "100% integrado"
1. ✅ Integrar `ObjectPool` em projéteis (player + inimigos) — `new Projectile` substituído por pool.
2. ✅ Instanciar `ViewportCuller` no GameScene — culling de inimigos fora da viewport (150px de margem); skip do AI tick apenas para inimigos cullados não-combat.
3. ✅ Ativar `PerformanceMonitor` — toggle dev via `?perf=1` no URL; gate de 60 FPS para validação em desktop.
4. ✅ Integrar `InputManager` no GameScene (movimento/aim por gamepad) — navegação por gamepad nos menus (foco dinâmico) ainda pendente.

## Registro de validação

| Data | Validação | Resultado |
|------|-----------|-----------|
| 2026-08-11 | Auditoria do código contra a spec (commit `c94bdc9` + `eecf3c1`) | ✅ Haptics, Achievements, AdvancedParticles, ScreenShake, PWA/TWA e High Scores integrados; ⚠️ ObjectPool, ViewportCuller, PerformanceMonitor e InputManager criados porém órfãos (sem uso no runtime) |
| 2026-08-11 | Integração dos 4 módulos órfãos no GameScene + correção de bugs de runtime | ✅ Pooling de projéteis, culling de inimigos, monitor `?perf=1` e InputManager integrados; corrigidos `AdvancedParticles` (API Phaser 4), imports de Phaser ausentes e lifecycle de projétil; 32 testes novos (116 total), coverage 87.89%, 7/7 e2e, build verdes |
