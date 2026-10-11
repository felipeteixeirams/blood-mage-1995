# Evento Rifts de Infecção

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. `infection` existe como `statusEffectOnHit` em `src/types/game.ts` (além de `bleeding` e `poison`). Não há aura de dreno de MP, Rift nem ondas de evento.
**Origem:** dividida da spec feature-eventos-mundiais-e-sazonais (2026-10-11)

## Contexto
Evento global com rifts que emanam aura de Infecção e dreno de MP, que o jogador sela. Depende da [infraestrutura de eventos](feature-infraestrutura-de-eventos-mundiais.md). Outros: [Eclipse](feature-evento-eclipse-de-sangue.md), [Cerco](feature-evento-cerco-ao-vilarejo.md).

## Objetivo
Se aprovado, durante o evento surgem Rifts que o jogador sela, com ondas e recompensa.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand | **Proposta** |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Proposta** |
| Spec | [Infraestrutura de eventos](feature-infraestrutura-de-eventos-mundiais.md) | Defining (pré-requisito) |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `infection` é um `statusEffectOnHit`; não há status de congelamento | `src/types/game.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Existência do Rift (decisão 1 da spec original: três eventos globais) | todos / subconjunto / nenhum | Começar só pelo Eclipse; Rifts depois |
| 2 | Aura de Infecção e dreno de MP, selar em 5 s, ondas, recompensa | aprovar / ajustar | Aprovar após decisão 1 |

## Escopo
Se aprovado: Rift com aura de Infecção e dreno de MP, mecânica de selar em 5 s, ondas e recompensa. Itens verificáveis a definir conforme decisão 2.

## Fora de escopo
- Infraestrutura de agenda e estado; Eclipse; Cerco; sazonais.

## Arquivos e contratos
A definir: depende das decisões 1 e 2. Reuso provável de `infection` (`src/types/game.ts`) e de `src/data/waves.json` (a confirmar). Ler `docs/engineering/risky-files.md` antes de tocar `GameScene.ts`. Comunicação React/Phaser só via Zustand (ADR 0001).

## Critérios de aceite
A definir. A spec original não trazia critérios para os Rifts; não há comportamento aprovado para escrevê-los.

## Plano de verificação
A definir junto aos critérios. Game feel: não validado, precisa de playtest humano.

## Questões em aberto
1. Decisões 1 e 2 sem resposta; valores (5 s) vêm da proposta original.
2. Valores de aura, dreno, ondas e recompensa: a definir.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001 e 0012 aprovados; infraestrutura promovida.
- Decisões 1 e 2 e questões 1 e 2 resolvidas.
- Escrever critérios EARS e preencher *Arquivos e contratos*.

## Referências
- [enemies-and-bestiary.md](../../gameplay/enemies-and-bestiary.md), [status-and-feedback.md](../../gameplay/status-and-feedback.md)
