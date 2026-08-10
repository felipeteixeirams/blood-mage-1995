# 🔴 Guia Anti-Regressão

Este documento apresenta diretrizes essenciais para desenvolvedores (humanos ou agentes de IA) para evitar a introdução de regressões ou a quebra de mecânicas de core-gameplay já estabilizadas.

## 📌 Regras de Ouro
1. **Nunca modifique equações de física do Player**:
   - As constantes de movimentação (`ACCELERATION`, `DECELERATION`, `FRICTION`, `MAX_SPEED`) e o método `calculateMovement` no `Player.ts` conferem a aceleração gradual característica estilo Dungeon Siege 1. Modificar essas equações mudará a sensação mecânica do jogo ou quebrará colisões com paredes.
2. **Preserve a estrutura de retorno de takeDamage**:
   - `takeDamage(amount: number): boolean` deve sempre retornar se a vida do jogador chegou a 0 e ele está definitivamente morto. Qualquer quebra nesta assinatura causará imortalidade infinita ou travamentos na transição de tela.
3. **Não altere colisores críticos em GameScene**:
   - Os colliders do Phaser para paredes, inimigos e projéteis não devem ser removidos. Se precisar suspender colisões, use condicionais (ex: verificar `player.stats.isUnconscious`).
