# Evento Cerco ao Vilarejo

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. NPCs (Clérigo, Alquimista, Ferreiro, Ancião) existem na Safe House (`src/game/systems/DungeonFlowController.ts`, `src/i18n/ptBR.ts`). Não existe combate na Room 0 nem efeito de evento em lojas.
**Origem:** dividida da spec feature-eventos-mundiais-e-sazonais (2026-10-11)

## Contexto
Evento global em que o vilarejo (Safe House, Room 0) é atacado. Afeta Safe House e economia, sem ADR nem spec de Safe House que o suporte. Depende da [infraestrutura de eventos](feature-infraestrutura-de-eventos-mundiais.md). Outros: [Eclipse](feature-evento-eclipse-de-sangue.md), [Rifts](feature-evento-rifts-de-infeccao.md).

## Objetivo
Se aprovado, durante o Cerco há combate na Room 0 com consequências para os NPCs da Safe House.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand | **Proposta** |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Proposta** |
| Spec | [Infraestrutura de eventos](feature-infraestrutura-de-eventos-mundiais.md) | Defining (pré-requisito) |
| Spec | Safe House com combate | Não existe |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| NPCs (Clérigo, Alquimista, Ferreiro, Ancião) existem na Safe House | `src/game/systems/DungeonFlowController.ts`, `src/i18n/ptBR.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Existência do Cerco (decisão 1 da spec original: três eventos globais) | todos / subconjunto / nenhum | Começar só pelo Eclipse; Cerco depois |
| 2 | Combate na Room 0 e consequências a NPCs (loja fechada 10 min ou taxa maior; desconto de 20% por 1 h; Baú de Suprimentos Rúnicos) | aprovar / redesenhar | Redesenhar: afeta Safe House e economia, sem ADR |

## Escopo
Se aprovado e redesenhado conforme decisão 2: combate na Room 0 durante o evento, efeito em lojas dos NPCs e recompensa (Baú de Suprimentos Rúnicos). Itens verificáveis a definir.

## Fora de escopo
- Infraestrutura de agenda e estado; Eclipse; Rifts; sazonais.
- Cooperativo ([discovery-multijogador-cooperativo.md](discovery-multijogador-cooperativo.md)).

## Arquivos e contratos
A definir: depende da decisão 2 e de spec de Safe House com combate. Ler `docs/engineering/risky-files.md` antes de tocar `GameScene.ts`. Comunicação React/Phaser só via Zustand (ADR 0001).

## Critérios de aceite
A definir. A spec original não trazia critérios para o Cerco; não há comportamento aprovado para escrevê-los.

## Plano de verificação
A definir junto aos critérios.

## Questões em aberto
1. Decisões 1 e 2 sem resposta; valores (10 min, 20%, 1 h) vêm da proposta original.
2. Depende de combate na Room 0 e de efeito em lojas, sem spec de Safe House que o suporte.
3. "Cooperativo" citado na proposta não existe no jogo.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001 e 0012 aprovados; infraestrutura promovida.
- Spec de Safe House com combate; decisões 1 e 2 e questões 1 a 3 resolvidas.
- Escrever critérios EARS e preencher *Arquivos e contratos*.

## Referências
- [world-generation.md](../../gameplay/world-generation.md), [enemies-and-bestiary.md](../../gameplay/enemies-and-bestiary.md)
