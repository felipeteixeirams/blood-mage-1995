# Feature: sprites e retratos de NPCs

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): chaves reais: `spr_npc_maelen`; o Clérigo usa `spr_cultist` com tint (`DungeonFlowController.ts`). `spr_npc_cleric` e `portrait_*` não existem em `src/`.

**Origem:** categoria "NPCs e retratos" do escopo e questão 3 de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md).

## Objetivo
Clérigo, alquimista, ferreiro e ancião têm sprite e retrato físicos registrados no manifesto.

## Decisões de que depende
Nenhuma ADR; depende das decisões do contrato.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `spr_npc_cleric` e `portrait_*` não existem em `src/`; `spr_npc_maelen` existe | leitura estática de `src/` | 2026-10-11 |

## Escopo
Clérigo, alquimista, ferreiro, ancião (sprite e retrato): gerar, registrar no manifesto e validar. Hoje: chaves próprias não existem.

## Fora de escopo
Gerar a arte; alterar diálogos ou lógica de NPC.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`; criar arquivos em `public/assets/sprites/` (pasta e nomes a definir). Conferir o header com `file`.
- Nomes das chaves novas: a definir.

## Critérios de aceite
- **NP-1** (novo, derivado de SP-1) Quando um NPC tem arquivo registrado, o BootScene deve usar o sprite físico em vez da textura procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| NP-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Nomes das chaves novas de NPC e retrato.

## Pendências para promover a backlog
- Aprovação do responsável; nomes das chaves; remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md)
