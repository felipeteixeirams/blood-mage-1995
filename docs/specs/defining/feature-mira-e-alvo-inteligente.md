# Mira por toque e pontuação de alvo

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): alvo automático com histerese por alcance (1,2x) e cone frontal em `Player.findBestTarget` (`src/game/objects/Player.ts` ~l.776-786) e retículo em `renderTargetLockReticle`. Faltam hitbox de alvo +30% por toque e pontuação por HP e ameaça.
**Origem:** dividida da spec feature-evolucao-de-ui-e-terreno (2026-10-11)

## Contexto
`findBestTarget` não usa pesos de HP ou ameaça. A parte de proporção de entidades da decisão 4 está na [spec de câmera](feature-camera-e-escala-de-entidades.md). Controles: [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md). Independente das demais specs irmãs.

## Objetivo
Se aprovada, a mira por toque tem hitbox maior e o alvo automático prioriza por distância, HP e ameaça.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Controles mobile e orientação | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `findBestTarget` retorna o alvo travado se dentro de 1,2x do alcance | `Player.ts` ~l.776-786 | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 4 | Hitbox de alvo +30% (a parte de proporção está na [spec de câmera](feature-camera-e-escala-de-entidades.md)) | A) aplicar +30%; B) manter hitbox atual | B até playtest |
| 5 | Pontuação de alvo (distância, HP, ameaça) | A) fórmula proposta; B) histerese atual | Propor pesos com o responsável |

## Escopo
Depende das decisões 4 e 5.
- Hitbox de alvo +30% para toque.
- Pontuação `w1/distância + w2 x (1 - HP/HPmax) + w3 x ameaça` (chefe 3,0, elite 2,0, minion 1,0).

## Fora de escopo
Proporção de entidades e câmera (spec irmã); retículo visual; joystick e orientação (ADR 0004).

## Arquivos e contratos
- Alterar: `src/game/objects/Player.ts` (`findBestTarget`) e seu teste `src/game/objects/Player.test.ts`.
- Não tocar: `src/data/monsters.json`; arquivos de alto risco só conforme `docs/engineering/risky-files.md`.
- Contratos e valores: os da seção Escopo; pesos `w1`, `w2`, `w3` em Questões em aberto.
- Atualizar no mesmo commit: [input-and-controls](../../ui/input-and-controls.md) e `Verificado em`.

## Critérios de aceite
Todos provisórios; dependem das decisões 4 e 5.
- **MA-1** Quando o jogador usa toque, o Player deve aplicar hitbox de alvo +30% (provisório).
- **MA-2** Quando há vários alvos, o Player deve escolher o de maior pontuação `w1/distância + w2 x (1 - HP/HPmax) + w3 x ameaça` (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| MA-1, MA-2 | teste unitário de `Player.findBestTarget` em `Player.test.ts`; sensação de mira: não validado, precisa de playtest humano |

## Questões em aberto
- Pesos `w1`, `w2`, `w3` da pontuação de alvo.
- Como a pontuação convive com a histerese atual (1,2x) e o cone frontal; empate ou alvo sem HP (não definidos na original).

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisões 4 e 5 respondidas; ADR 0004 aprovado.
- Questões em aberto resolvidas (pesos); critérios sem a marca (provisório).

## Referências
[input-and-controls](../../ui/input-and-controls.md) · [hud](../../ui/hud.md) · [0004](../../decisions/0004-controles-mobile-e-orientacao.md)
