# Dano por contato passivo de inimigos (bug)

**Mestre:** [backlog](README.md)
**Estágio:** backlog
**Aprovação do responsável:** aprovada por Felipe Teixeira em 2026-10-11, conforme conversa de 2026-10-11 (decisões conforme a coluna Recomendação)
**Classe:** A
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/game/scenes/GameScene.ts` (`physics.add.overlap(player, enemiesGroup)`) e `src/game/systems/CollisionHandlers.ts` (`handleEnemyTouchPlayer`). Não validado em execução.

## Contexto
- Regra do projeto (`CLAUDE.md`): dano por contato passivo de inimigo é proibido; todo ataque corpo a corpo passa pela FSM `Windup -> Strike -> Recovery`.
- `GameScene` (~linha 703) registra `this.physics.add.overlap(this.player, this.enemiesGroup, this.handleEnemyTouchPlayer, ...)`.
- `CollisionHandlers.handleEnemyTouchPlayer` aplica `playerHitByEnemy((enemy.damage ?? enemy.config.damage) * 0.4, enemy.config.statusEffectOnHit)` a todo inimigo ativo sobreposto, sem passar pela FSM e sem telégrafo.
- `playerHitByEnemy` respeita os 800 ms de i-frames de `Player.takeDamage`, mas ainda causa dano, status (sangramento, veneno, infecção), tremor de câmera e flash sem aviso.
- O ataque legítimo (melee) vem de `Enemy.updateEnemy` -> `result.attack` -> `playerHitByEnemy(result.damage, ...)` em `GameScene.update`.

## Objetivo (proposta)
Encostar em um inimigo não causa dano nem aplica status; o jogador só é ferido por ataque telegrafado (FSM) ou projétil.

## Decisões aprovadas
Aprovadas em 2026-10-11; a coluna Recomendação é a decisão.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | O que fazer com o overlap | A) remover o overlap e o handler; B) manter só separação física (sem dano); C) manter com dano 0 e empurrão | A: a colisão sólida (collider) já impede atravessar; menos código |
| 2 | Empurrar o jogador ao encostar | A) não; B) leve empurrão sem dano | A: evita novo comportamento não pedido |
| 3 | Compensar a perda de dano (balance) | A) nenhuma; B) revisar dano/frequência dos ataques | A agora; B só após playtest |

## Escopo
- Eliminar o dano e a aplicação de status por contato passivo.
- Remover a chamada de `handleEnemyTouchPlayer` e, se não tiver outro uso, o método.

## Fora de escopo
- Mudar a FSM de ataque, o dano dos ataques ou o balance dos inimigos.
- Dano de armadilhas e projéteis.

## Arquivos e contratos
- Alterar: `src/game/scenes/GameScene.ts` (registro do overlap e método `handleEnemyTouchPlayer`), `src/game/systems/CollisionHandlers.ts` (`handleEnemyTouchPlayer`) e testes em `src/game/systems/` e/ou `src/game/objects/Enemy.test.ts`.
- Atualizar no mesmo commit: `docs/gameplay/combat.md` (parágrafo "Toque passivo") e `Verificado em`.
- Não tocar: `Enemy.updateEnemy` (FSM).

## Critérios de aceite (provisórios)
- **DC-1** Enquanto um inimigo está sobreposto ao jogador fora de Windup e Strike, o jogo não deve reduzir o HP do jogador.
- **DC-2** Enquanto um inimigo está sobreposto ao jogador, o jogo não deve aplicar `statusEffectOnHit` a ele.
- **DC-3** Quando o inimigo conclui um Strike melee com o jogador no alcance, o CollisionHandlers deve aplicar o dano de `result.damage` uma única vez.
- **DC-4** Se o jogador permanece encostado a um inimigo em Recovery, então o jogo não deve causar dano.
- **DC-5** O código de produção não deve conter chamada a `handleEnemyTouchPlayer` (ou equivalente de dano por overlap).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| DC-1, DC-2, DC-4 | Teste unitário do CollisionHandlers (mock de cena): chamar o caminho de overlap e checar HP e status inalterados; ou verificar que o overlap não é registrado |
| DC-3 | Teste existente/novo de `playerHitByEnemy` via resultado do ataque |
| DC-5 | `grep handleEnemyTouchPlayer src` sem resultados; `pnpm run typecheck` |
| Sensação de combate | Não validado: precisa de playtest humano |

## Questões em aberto
Nenhuma. A pergunta sobre inimigos "colados" fora do cooldown fica coberta pela decisão 3 (sem compensação de balance agora; revisar só após playtest).

## Referências
- [Combate](../../gameplay/combat.md) (Toque passivo)
- Skill `phaser-4-physics-combat`
