# Eventos sazonais

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não implementado. Não há arte (skin, paleta), status de congelamento (só `bleeding`, `poison`, `infection` em `src/types/game.ts`) nem o feitiço "Lança de Gelo de Sangue".
**Origem:** dividida da spec feature-eventos-mundiais-e-sazonais (2026-10-11)

## Contexto
Eventos por data real (Noite dos Ancestrais, Banquete do Gelo), ancorados no lore gótico (sem decoração natalina moderna). Dependem da [infraestrutura de eventos](feature-infraestrutura-de-eventos-mundiais.md) e exigem arte, status e feitiço novos. Recomenda-se adiar até o [Eclipse](feature-evento-eclipse-de-sangue.md) validado.

## Objetivo
Se aprovado, o jogo ativa eventos sazonais por data real com conteúdo cosmético e recompensas próprias.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só via Zustand | **Proposta** |
| [0012](../../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) | Monetização, preço e metas de retenção | **Proposta** |
| Spec | [Infraestrutura de eventos](feature-infraestrutura-de-eventos-mundiais.md) | Defining (pré-requisito) |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Não há status de congelamento | `src/types/game.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Eventos sazonais por data real (Noite dos Ancestrais, Banquete do Gelo) | calendário real / sem sazonais | Adiar até o Eclipse validado |
| 2 | Arte e recompensas (skin "Mago Esquelético do Fosso", paleta "Necrose Sombria", feitiço "Lança de Gelo de Sangue", congelar 1 s) | aprovar / adiar | Adiar: exige arte, novo status e feitiço |
| 3 | Janelas de datas e fuso dos sazonais | a definir | Responsável define o calendário |

## Escopo
Se aprovado: entradas sazonais no `worldEvents.json`, cosméticos e feitiço conforme decisão 2, e status de congelamento (1 s) se o feitiço for aprovado. Itens verificáveis a definir.

## Fora de escopo
- Infraestrutura de agenda e estado; eventos globais.
- Arte final de skins e novos feitiços até a decisão 2.

## Arquivos e contratos
A definir: depende das decisões 1 a 3. Alteraria `src/data/worldEvents.json`, `src/data/spells.json` e `src/types/game.ts` (status). Arte: assets conforme `src/game/assets/assetManifest.json`.

## Critérios de aceite
A definir. A spec original não trazia critérios para os sazonais; não há comportamento aprovado para escrevê-los.

## Plano de verificação
A definir junto aos critérios.

## Questões em aberto
1. Decisões 1 a 3 sem resposta.
2. Pedem arte, status de congelamento e feitiço novos que não existem.
3. Datas, fuso e comportamento offline/PWA: a definir.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001 e 0012 aprovados; infraestrutura promovida.
- Decisões 1 a 3 e questões 1 a 3 resolvidas; arte, status e feitiço decididos.
- Escrever critérios EARS e preencher *Arquivos e contratos*.

## Referências
- [status-and-feedback.md](../../gameplay/status-and-feedback.md), [feature-atmosfera-e-tensao.md](feature-atmosfera-e-tensao.md)
