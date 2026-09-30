# Spec 24.02: Animações 8-Direcionais, Feedbacks de Dano e Ragdoll Gibs

## Objetivo
Elevar o gamefeel do combate com deformações procedurais de ângulo, respostas físicas de dano e desmembramentos gore nas mortes por crítico/execução.

## Status
🟢 COMPLETO

## O que foi Entregue
- **Animações 8-Direcionais Procedurais:**
  - Deformação de skew e escala em runtime (`setScale(baseX * cos, baseY * sin)`) para vetores angulares de 8 direções em `Enemy.ts`.
- **Feedbacks de Impacto:**
  - Hit Flash branco (33ms) + transição de tint vermelho em acerto.
  - Flinch de 2-4px em direção oposta ao golpe.
  - Knockback posicional calculado com base na massa da entidade.
- **Variantes Procedurais de Inimigos:**
  - Halos de afixo elite, marcha manca com rastro de sangue em HP < 40%, e pulso de frenesi carmesim em velocidade 1.4x.
- **Morte Ragdoll & Gibs (`DismembermentSystem.ts`):**
  - Fatiamento do sprite em 4 quadrantes lançados em 2.5D com rotação e velocidade angular.
  - Fixação de manchas de sangue (`blood_pool_stain`) no chão com limpeza FIFO.

## Referência no Código
- `src/game/objects/Enemy.ts` — Lógica de 8 direções, flinch, hit flash e knockback.
- `src/game/systems/DismembermentSystem.ts` — Sistema de ragdoll, gibs e sangue no chão.

## Validação e Garantia de Qualidade
- Suíte de testes automatizada para físicas e desmembramento.
- Desempenho de 60 FPS preservado durante combates intensos com múltiplos gibs.
