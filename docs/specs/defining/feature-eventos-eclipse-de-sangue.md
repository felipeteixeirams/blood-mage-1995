# Evento Eclipse de Sangue

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. Reaproveitáveis: `frenzy` como `AIState` em `src/types/game.ts` e `src/game/objects/Enemy.ts` (estado de IA, não modificador passivo); raio de luz por bioma (`lightRadius`) em `src/game/systems/WorldManager.ts`; `LightingSystem.ts`, `AtmosphereSystem.ts`, `LootSystem` e `soundEngine`.
**Origem:** dividida da spec feature-eventos-mundiais-e-sazonais (2026-10-11)

## Contexto
Primeiro evento global, ancorado no lore gótico. Reusa luz, `frenzy` e loot, por isso é o candidato a começar. Depende da [infraestrutura de eventos](feature-eventos-infraestrutura-mundial.md) (estado `activeWorldEvent`, agenda, ciclo de vida). Os demais eventos: Cerco (spec removida), Rifts (spec removida), sazonais (spec removida).

## Objetivo
Se aprovado, enquanto o Eclipse de Sangue estiver ativo o jogo reduz a luz, enfurece inimigos e aumenta o loot.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand | **Proposta** |
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação, escuridão e vinheta | **Proposta** (Eclipse altera o raio de luz) |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Proposta** |
| Spec | [Infraestrutura de eventos](feature-eventos-infraestrutura-mundial.md) | Defining (pré-requisito) |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `frenzy` existe como estado de IA, não como modificador passivo | `src/types/game.ts` (`AIState`), `src/game/objects/Enemy.ts` | 2026-10-11 |
| Raio de luz por bioma existe (`lightRadius`) | `src/game/systems/WorldManager.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Existência e regras dos três eventos globais (Eclipse, Cerco, Rifts) | todos / subconjunto / nenhum | Começar só pelo Eclipse (reusa luz, `frenzy` e loot) |
| 2 | Efeitos de gameplay (luz -30%, ataque +15%, drop de Cristais e Épico/Lendário +50%) | aprovar / ajustar | Aprovar após playtest; são valores da proposta original |
| 3 | Duração (2 h) e cadência do Eclipse | a definir | Responsável define o calendário |

## Escopo
- Luz reduzida: o `LightingSystem` aplica o fator do evento ao raio do jogador.
- Inimigos nascem em `frenzy`; bônus de ataque conforme decisão 2.
- Bônus de drop no `LootSystem`.
- Partículas de brasa e sussurros no `soundEngine`, respeitando a infraestrutura de eventos.
- Entrada no `worldEvents.json` com id e parâmetros do Eclipse.

## Fora de escopo
- Infraestrutura de agenda e estado (spec de infraestrutura).
- Cerco e Rifts; eventos sazonais.

## Arquivos e contratos
- Alterar: `src/game/systems/LightingSystem.ts`, `src/game/objects/Enemy.ts` (spawn em `frenzy`), `LootSystem`, `soundEngine`, `src/data/worldEvents.json`. Ler `docs/engineering/risky-files.md` antes de tocar `Enemy.ts`.
- Valores numéricos finais e como `frenzy` entra no spawn: a definir (decisões 2 e 3). Testar luz em mais de um bioma.

## Critérios de aceite
- **ECL-1** Enquanto o Eclipse de Sangue estiver ativo, o LightingSystem deve reduzir o raio de iluminação do jogador em 30% (provisório).
- **ECL-2** Enquanto o Eclipse de Sangue estiver ativo, o Enemy deve surgir em estado `frenzy` (provisório).
- **ECL-3** Enquanto o Eclipse de Sangue estiver ativo, o LootSystem deve aumentar em 50% o drop de Cristais de Sangue e a chance de Épico e Lendário (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| ECL-1, ECL-2, ECL-3 | Teste unitário dos multiplicadores; padrão de `LootSystem.test.ts` e `LightingSystem.test.ts` |
| Atmosfera e game feel | Não validado: precisa de playtest humano (mais de um bioma) |

## Questões em aberto
1. Decisões 1 a 3 sem resposta; valores vêm da proposta original e não têm aprovação.
2. O ataque +15% (decisão 2) ficou sem critério: a proposta não diz se vale para inimigos ou para o jogador; a confirmar.
3. Agenda e formato do `worldEvents.json`: ver infraestrutura.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001, 0005 e 0012 aprovados; infraestrutura promovida.
- Decisões 1 a 3 e questões 1 a 3 resolvidas.
- Remover "(provisório)" e preencher *Arquivos e contratos*.

## Referências
- [enemies-and-bestiary.md](../../gameplay/enemies-and-bestiary.md), [lighting-and-effects.md](../../gameplay/lighting-and-effects.md)
