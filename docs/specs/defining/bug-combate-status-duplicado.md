# Status de sobrevivência duplicado e inconsistências de combate (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bugs confirmados em `src/game/objects/Player.ts` (`updatePlayer`, `updateStatusConditions`), `src/game/scenes/GameScene.ts` (disparo de projétil inimigo) e `src/game/objects/Enemy.ts` (`getTelegraphInfo`). Item "morte por status sem triggerGameOver" NÃO confirmado (ver Contexto). Não validado em execução.

## Contexto
**A. Status em duplicidade (confirmado).** Com bleeding, poison ou infection ativos, dois mecanismos causam dano ao mesmo tempo:
- `Player.updateStatusConditions` (chamado em `updatePlayer`): percentual do `maxHp` por segundo (sangramento 2%/s só andando, veneno 1,5%/s) via `applyStatusDamage`, sem i-frames; infecção limita o HP a 80% do máximo. O comentário do método diz que o status não deve dar i-frames.
- `Player.updatePlayer` (~linhas 476-525): tick fixo via `takeDamage` (sangramento 3 HP/1500 ms, veneno 4 HP/2000 ms, infecção 2 HP/3000 ms). `takeDamage` aplica x1,2 com infecção e concede 800 ms de i-frames, contradizendo o comentário acima e podendo anular um golpe real que caia nesses 800 ms.
- Efeito: dano de status maior que o desenhado e janela de invulnerabilidade involuntária.

**B. Projétil ignora escala (confirmado).** `GameScene` (~linha 1623) dispara `proj.fire(..., enemy.config.damage, ...)`. O melee usa `result.damage = Enemy.damage`, que inclui `floorDmgMult` e `affixDmgMult` (`Enemy` ~linha 111). Inimigos ranged e o chefe não escalam por andar nem por afixo.

**C. Telégrafo do chefe (parcialmente confirmado).** `Enemy.getTelegraphInfo` testa `config.id === 'blood_lord_boss'` (~linha 1246), id inexistente em `monsters.json`; o chefe real é `necro_lord_boss`. O ramo `boss_slam` (raio 80, 360 graus) é código morto. O chefe não fica sem telégrafo: cai no círculo genérico de ataques ranged (raio 36 no alvo).

**D. Morte por dano de status (NÃO confirmado como bug).** `Player.applyStatusDamage` não chama `triggerGameOver`, mas `GameScene.update` (~linha 1552) detecta `player.stats.isDefinitivelyDead` e chama `triggerGameOver()`. O resultado é correto, com atraso de um frame. O tick fixo via `takeDamage` ignora o retorno pelo mesmo motivo e também é coberto. Sem correção proposta para este item.

## Objetivo (proposta)
Um único modelo de dano de status, projéteis inimigos com o mesmo dano escalado do melee e telégrafo do chefe coerente com o id real.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Qual mecanismo de status fica | A) percentual por segundo; B) tick fixo; C) fundir em novos valores | A: já sem i-frames, escala com o HP máximo; remover os ticks fixos |
| 2 | Valores de dano de status | A) manter os percentuais atuais; B) rebalancear | A: menor mudança; balance só após playtest |
| 3 | Texto flutuante dos ticks ("-3 SANGRAMENTO") e vibração `bleeding_tick` | A) manter, em intervalo próprio sem dano; B) remover | A: preserva o feedback; ver questão 1 |
| 4 | Escala do projétil | A) usar `enemy.damage`; B) manter `config.damage` | A: iguala ao melee (afixos e andares) |
| 5 | Telégrafo do chefe | A) trocar o id para `necro_lord_boss` (ativa `boss_slam`); B) remover o ramo morto e manter o círculo | B se o ataque do chefe é projétil (é `ranged`, 400 ms); A muda o visual do chefe |

## Escopo
- Remover o dano duplicado de status conforme a decisão 1.
- Projétil inimigo usa o dano escalado.
- Resolver o ramo `blood_lord_boss` conforme a decisão 5.

## Fora de escopo
- Valores de balance dos status e dos inimigos (decisão 2).
- Curas (Z, X, V) e `ScavengingSystem`.
- Fluxo de nocaute e game over.

## Arquivos e contratos
- Alterar: `src/game/objects/Player.ts` (`updatePlayer`, `updateStatusConditions`), `src/game/scenes/GameScene.ts` (disparo de projétil), `src/game/objects/Enemy.ts` (`getTelegraphInfo`); testes em `src/game/objects/Player.test.ts` e `src/game/objects/Enemy.test.ts`.
- Atualizar no mesmo commit: `docs/gameplay/combat.md` (Status de sobrevivência, Telegrafia, projétil) e `docs/gameplay/enemies-and-bestiary.md` se os valores mudarem.
- Não tocar: `src/data/monsters.json`.

## Critérios de aceite (provisórios)
- **SS-1** Enquanto o jogador está com veneno, o Player deve reduzir o HP somente pelo mecanismo escolhido (decisão 1), sem soma de dois mecanismos.
- **SS-2** Enquanto o jogador está sangrando e parado, o Player não deve reduzir o HP por sangramento (se a decisão 1 = A).
- **SS-3** Quando o dano de status é aplicado, o Player não deve conceder i-frames de 800 ms.
- **SS-4** Quando um golpe real atinge o jogador logo após um tick de status, o Player deve aplicar o golpe.
- **SS-5** Quando um inimigo ranged ou o chefe dispara, o projétil deve causar `enemy.damage` (com escala de andar e afixo).
- **SS-6** Quando o chefe `necro_lord_boss` entra em Windup, o `getTelegraphInfo` deve retornar o formato definido na decisão 5.
- **SS-7** Se o HP do jogador chega a 0 por dano de status, então o jogo deve seguir o fluxo de nocaute/game over atual (comportamento a preservar).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| SS-1 a SS-4 | Teste unitário em `Player.test.ts`: ativar status, avançar `delta` por 6 s e comparar HP perdido ao valor esperado; checar `isInvulnerable` |
| SS-5 | Teste unitário: inimigo com andar e afixo, checar `proj.damage` (extrair o cálculo se preciso) |
| SS-6 | Teste unitário em `Enemy.test.ts` com `necro_lord_boss` |
| SS-7 | Teste unitário: HP baixo + veneno até `isDefinitivelyDead` (3o nocaute) |
| Sensação de dano de status | Não validado: precisa de playtest humano |

## Questões em aberto
1. Manter o feedback visual/tátil dos ticks fixos mesmo sem o dano fixo? Recomendação: sim, a cada 1 s, sem dano extra.
2. O balance atual (soma dos dois mecanismos) é o que o responsável considera correto? Recomendação: tratar o percentual como base e testar jogando.

## Referências
- [Combate](../../gameplay/combat.md) (Status de sobrevivência, Telegrafia)
- [Inimigos e bestiário](../../gameplay/enemies-and-bestiary.md)
