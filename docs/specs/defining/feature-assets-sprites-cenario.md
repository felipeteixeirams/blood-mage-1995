# Feature: sprites e tilesets de cenário

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): tiles são procedurais e `required: false` no manifesto, sem arquivo. `spr_destructible_urn` não existe em `src/`.

**Origem:** categoria "Cenário" do escopo e questão 2 de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md). Última na ordem de integração proposta (tilesets).

## Objetivo
Tiles e objetos de cenário têm arte física registrada no manifesto, com fallback procedural.

## Decisões de que depende
Nenhuma ADR; depende das decisões do contrato (resolução proposta: tiles 64x32).

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `spr_destructible_urn` não existe em `src/`; tiles são `required: false` | leitura estática; `assetManifest.json` | 2026-10-11 |

## Escopo
`tile_ground`, `tile_wall_brick`, `tile_door`, `spr_portal`, ossadas, tochas, braseiros, urna destrutível. Hoje: procedural.

## Fora de escopo
Gerar a arte; alterar geração de masmorra ou iluminação por bioma.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`; `src/utils/textureGenerator.ts` só se uma chave mudar.
- Criar: arquivos em `public/assets/tilesets/` e `public/assets/sprites/<categoria>/` (a definir). Conferir o header com `file`.

## Critérios de aceite
- **CE-1** (novo, derivado de SP-1) Quando uma chave de cenário tem arquivo registrado, o BootScene deve usar a arte física em vez da textura procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CE-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Confirmar no manifesto as chaves de tiles; nome da chave da urna.

## Pendências para promover a backlog
- Aprovação do responsável; confirmar chaves; remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md)
