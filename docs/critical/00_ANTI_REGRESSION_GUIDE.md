---
agent_context: all devs
target_module: root
priority: high
status: active
last_updated: 2026-09-06
tags: [critical, anti-regression]
---
# 🔴 Guia Anti-Regressão

Este documento apresenta diretrizes essenciais para desenvolvedores (humanos ou agentes de IA) para evitar a introdução de regressões ou a quebra de mecânicas de core-gameplay já estabilizadas.

## 📌 Regras de Ouro
1. **Nunca modifique equações de física do Player**:
   - As constantes de movimentação (`ACCELERATION = 1400`, `DECELERATION = 1000`) e o método `updateMovementAndPhysics` (`_moveToward`) no `Player.ts` conferem a aceleração gradual característica estilo Dungeon Siege 1. A velocidade base não é uma constante fixa — é calculada em `getEffectiveMoveSpeed()` a partir de `baseMoveSpeed = 160` + bônus de talentos/relíquias. Modificar essas equações mudará a sensação mecânica do jogo ou quebrará colisões com paredes.
2. **Preserve a estrutura de retorno de takeDamage**:
   - `takeDamage(amount: number): boolean` deve sempre retornar `true` só na morte DEFINITIVA. O jogo tem um sistema de 3 quedas: as duas primeiras vezes que o HP chega a 0, o jogador entra em `isUnconscious` (retorna `false`); só na 3ª (`knockoutCount` esgotado) `isDefinitivelyDead` vira `true` e o método retorna `true`. Qualquer quebra nesse contrato causará imortalidade infinita ou travamentos na transição de tela.
3. **Não altere colisores críticos em GameScene**:
   - Os colliders do Phaser para paredes, inimigos e projéteis não devem ser removidos. Se precisar suspender colisões, use condicionais (ex: verificar `player.stats.isUnconscious`).
