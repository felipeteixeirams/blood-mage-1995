# Aura de inimigo (evolução gráfica, quick wins)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): os demais itens do quick win já existem (distorção de medo em `PostFXSystem.triggerFearDistortion`, tinnitus em `soundEngine.ts`, cascata de luz em `LightingSystem.enable`, gibs em `DismembermentSystem.ts`). Falta a aura colorida por tipo de inimigo: `Enemy.ts` só tem o halo de elite (`eliteHaloGraphics`, cor por afixo), sem aura por tipo.

## Contexto
Aura colorida direta sobre sprites planares procedurais tende a gerar sobreposição e poluição visual; a proposta é usar halos aditivos (`Light2D`) por tipo de inimigo depois que houver atlas com normais (Eixo B; ver [feature-graficos-avancados-eixo-a](feature-graficos-avancados-eixo-a.md)). Satélite: [lighting-and-effects](../../gameplay/lighting-and-effects.md).

## Objetivo
Cada tipo de inimigo tem um halo luminoso de cor própria, legível sem poluir a cena.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação e escuridão no gameplay | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não há aura por tipo; só `eliteHaloGraphics` com cor por afixo | `src/game/objects/Enemy.ts:53,449-454` | 2026-10-11 |
| `LightingSystem` expõe luz do jogador e `addTorchLights` (luzes estáticas); não há API de luz por inimigo | `src/game/systems/LightingSystem.ts:146-185` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Implementar a aura e quando | A) junto do Eixo B (atlas com normais); B) agora; C) descartar | A: evita a sobreposição descrita no problema |
| 2 | Cores por tipo | A) violeta (mágicos), vermelho (sangue), laranja (infernais); B) outra tabela | A: é a proposta original; falta o mapa tipo -> categoria |
| 3 | Mecanismo | A) `Light2D` por inimigo; B) halo aditivo em Graphics | A: coerente com a proposta; exige limite de luzes |

## Escopo
- Halo por tipo de inimigo conforme as decisões 2 e 3, desligado quando `postProcessingEnabled` é `false` ou o renderer não é WebGL.
- Teste unitário do mapa tipo -> cor.

## Fora de escopo
- Normal maps de sprites (Eixo B), novas animações, mudança no halo de elite.

## Arquivos e contratos
- Alterar (se aprovado): `src/game/objects/Enemy.ts`, `src/game/systems/LightingSystem.ts` (API de luz por inimigo), arquivo de teste novo.
- Atualizar: `docs/gameplay/lighting-and-effects.md` e `Verificado em`.
- Não tocar: halo de elite, `gameStore.ts`.
- Valores (raio, intensidade, limite de luzes) e mapa tipo -> categoria: ver Questões em aberto.

## Critérios de aceite
- **QW-1** Quando um inimigo é criado, o `Enemy` deve exibir um halo na cor da categoria do seu tipo. (provisório)
- **QW-2** Quando o inimigo morre ou é destruído, o `Enemy` deve remover a luz e o halo. (provisório)
- **QW-3** Se `postProcessingEnabled` é `false` ou o renderer não é WebGL, então o `Enemy` não deve criar o halo. (provisório)
- **QW-4** Se o número de luzes ativas atinge o limite definido, então o `LightingSystem` não deve criar novas luzes de inimigo. (provisório)

## Plano de verificação
| Critério | Como verificar |
|---|---|
| QW-1, QW-2 | teste unitário com cena simulada (arquivo novo) |
| QW-3 | teste unitário com flag falsa e renderer Canvas |
| QW-4 | teste do `LightingSystem` com limite (valor em aberto) |
| Legibilidade, FPS | não validado: precisa de playtest humano |

## Questões em aberto
- Aprovação para implementar e quando (decisão 1).
- Mapa tipo -> categoria -> cor, raio, intensidade e limite de luzes: a definir.
- Depende do Eixo B (atlas com normais), ainda em discovery.

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 3.
- Definir raio, intensidade e limite de luzes.
- Eixo B decidido ou entregue; ADR 0005 Aprovado.
- Spec de escopo pequeno (só a aura); o nome do arquivo ainda cita "áudio", mas o conteúdo restante já existe (renomear só com o responsável).

## Referências
- [lighting-and-effects](../../gameplay/lighting-and-effects.md), [feature-graficos-avancados-eixo-a](feature-graficos-avancados-eixo-a.md)
