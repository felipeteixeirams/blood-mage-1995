# 🩸 Fase 1: Mecânica de Inconsciência

Detalhamento técnico da implementação do estado de inconsciência / nocaute temporário.

## ⚙️ Detalhes de Implementação
- **Detecção**: No script `Player.ts`, o método `takeDamage` monitora se o HP cai abaixo de 0.
- **Tratamento**:
  - Se `knockoutCount < 2`: Ativa `isUnconscious = true`, incrementa o contador, zera a velocidade física e muda a sprite para animação de repouso no chão.
  - O loop de física do Phaser desabilita colisões nocivas temporárias.
  - A FSM do `Enemy.ts` detecta o estado inconsciente do player e limpa a referência de alvo, transitando para comportamentos de patrulha errática ou afastamento.
- **Recuperação**: O jogador regenera 2% de vida por segundo. Ao passar de 15% de HP, ele recobra a consciência.
