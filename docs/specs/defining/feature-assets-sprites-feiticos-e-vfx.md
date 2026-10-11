# Feature: sprites de feitiços e VFX

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): projéteis e VFX são procedurais; o manifesto os declara como `required: false`, sem arquivo.

**Origem:** categoria "Feitiços e VFX" do escopo e questão 2 de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md). Gerador: `src/utils/textureGenerator.ts`.

## Objetivo
Projéteis, círculos, explosões e partículas têm sprite físico registrado no manifesto, com fallback procedural.

## Decisões de que depende
Nenhuma ADR; depende das decisões do contrato (resolução 16x16 ou 32x32 proposta para projéteis).

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| 19 entradas `required: true` (jogador e baú); projéteis são `required: false` | `src/game/assets/assetManifest.json` | 2026-10-11 |

## Escopo
`proj_blood_bolt`, `proj_energy_bolt`, foice, círculo e explosão de sangue, partículas, `blood_pool_stain`, `fog_mist`. Hoje: procedural.

## Fora de escopo
Gerar a arte; alterar dano ou física de projéteis.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`; `src/utils/textureGenerator.ts` só se uma chave mudar.
- Criar: arquivos em `public/assets/sprites/<categoria>/` (a definir). Conferir o header com `file`.

## Critérios de aceite
- **FV-1** (novo, derivado de SP-1) Quando uma chave de feitiço ou VFX tem arquivo registrado, o BootScene deve usar o sprite físico em vez da textura procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| FV-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Confirmar no manifesto as chaves de projéteis.

## Pendências para promover a backlog
- Aprovação do responsável; confirmar chaves; remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md)
