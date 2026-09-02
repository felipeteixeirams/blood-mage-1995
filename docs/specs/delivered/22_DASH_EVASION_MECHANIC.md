---
agent_context: mechanics-designer, physics-engineer
target_module: docs/specs/delivered
priority: high
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, dash, evasion, movement, invulnerability, onboarding]
---

# 💨 Spec 22: Mecânica de Dash/Esquiva (Dash & Evasion Mechanic)

## Objetivo
Documentar os parâmetros exatos de execução física, janelas de invulnerabilidade (I-Frames), rastros visuais e integrações com onboarding do sistema de esquiva/dash do caçador de sangue.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Parâmetros Físicos & Mecânicos Reais (`Player.ts`):**
  - **Duração do Dash (`DASH_DURATION`):** `150 ms`.
  - **Tempo de Invulnerabilidade (`DASH_INVULNERABILITY`):** `200 ms` (concede I-Frames cobrindo toda a duração do dash + 50ms de margem de recuperação).
  - **Cooldown Base (`DASH_COOLDOWN`):** `3000 ms` (3.0 segundos), reduzido dinamicamente pela Redução de Cooldown (CDR) do jogador.
  - **Velocidade do Dash (`dashSpeed`):** `800 px/s` (projetando o jogador a aproximadamente ~120 pixels de distância).
- **Vetor de Direção Inteligente:**
  - Se o jogador estiver em movimento, o dash é direcionado no vetor de movimento (`moveVector`). Caso esteja parado, é disparado na direção de mira (`aimVector`).
- **Feedback Audiovisual:**
  - Emissão de rastros de partículas rubro-espectrais (`emitDashTrail`) em `AdvancedParticles.ts`.
  - Disparo de efeito sonoro de esquiva via `soundEngine.playDash()`.
- **Gatilho de Onboarding (Spec 16):**
  - A primeira execução bem-sucedida do dash aciona o evento `firstDashDone` no onboarding, limpando a dica dinâmica de esquiva da HUD.

---

## Referência no Código
- `src/game/objects/Player.ts` — Propriedades `DASH_DURATION`, `DASH_INVULNERABILITY`, `DASH_COOLDOWN`, métodos `triggerDash()` e `getDashCooldownRemaining()`.
- `src/game/systems/AdvancedParticles.ts` — Método `emitDashTrail()` para criação da esteira espectral.
- `src/utils/soundEngine.ts` — Função `playDash()` sintetizando o som de deslocamento rápido.
- `src/store/gameStore.ts` — Integração de onboarding com o evento `firstDashDone`.

---

## Validação
- Testes unitários do movimento do jogador aprovados (`pnpm test`).
- Verificação sem erros de compilação no TypeScript (`pnpm run typecheck`).
- Distância e janelas de invulnerabilidade testadas em tempo de jogo.

---

## Notas
- O tempo de invulnerabilidade de 200ms é ligeiramente maior que a duração do deslocamento (150ms) para evitar que o jogador receba dano punitivo imediatamente ao terminar a animação.
