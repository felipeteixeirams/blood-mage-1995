# Feature: sprites de coletáveis

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): itens são procedurais e `required: false` no manifesto, sem arquivo. `spr_loot_bag` não existe em `src/`.

**Origem:** categoria "Coletáveis" do escopo e questão 2 de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md).

## Objetivo
Orbes, gemas, bolsa de loot e frasco têm sprite físico registrado no manifesto, com fallback procedural.

## Decisões de que depende
Nenhuma ADR; depende das decisões do contrato.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `spr_loot_bag` não existe em `src/`; itens são `required: false` | leitura estática; `assetManifest.json` | 2026-10-11 |

## Escopo
`orb_hp`, `orb_mana`, `gem_xp`, bolsa de loot, frasco curativo. Hoje: procedural.

## Fora de escopo
Gerar a arte; alterar regras de loot; tocar o baú (já tem arte).

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`; `src/utils/textureGenerator.ts` só se uma chave mudar.
- Criar: arquivos em `public/assets/sprites/items/` (a definir). Conferir o header com `file`.

## Critérios de aceite
- **CO-1** (novo, derivado de SP-1) Quando um coletável tem arquivo registrado, o BootScene deve usar o sprite físico em vez da textura procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CO-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Confirmar no manifesto as chaves de itens; nome da chave da bolsa de loot.

## Pendências para promover a backlog
- Aprovação do responsável; confirmar chaves; remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md)
