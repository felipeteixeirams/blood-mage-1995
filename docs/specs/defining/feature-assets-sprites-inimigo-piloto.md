# Feature: sprite físico do inimigo piloto

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): `public/assets/sprites/enemies/` está vazio; o manifesto declara os inimigos como `required: false`, sem arquivo. Chaves reais: `spr_skeleton`, `spr_cultist`; o Clérigo usa `spr_cultist` com tint (`DungeonFlowController.ts`). `src/game/objects/Player.ts` e `Enemy.ts` não chamam `setOrigin`.

**Origem:** decisões 2 (parte "inimigo piloto primeiro") e 3, critério SP-5 e a pendência "escolher uma unidade pequena" de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- A spec original era um épico; a pendência pedia uma unidade pequena. Esta spec é essa unidade: um único inimigo, que fixa as decisões (spritesheet x sprite único, pivô) reaproveitadas pelo [bestiário](feature-assets-sprites-bestiario.md).
- Qual inimigo é o piloto não foi decidido. Proposta, a confirmar: `spr_skeleton`, primeiro da ordem de integração proposta (Skeleton, bestiário Tier 1 a 3, projéteis/orbes, tilesets).
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md).

## Objetivo
Um inimigo, registrado no manifesto com `frameWidth` e `frameHeight` iguais aos do arquivo, usa o sprite físico no jogo.

## Decisões de que depende
Nenhuma ADR. Decisões a confirmar abaixo.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `public/assets/sprites/enemies/` está vazio | `ls public/assets/sprites/enemies` | 2026-10-11 |
| Chaves de inimigo no manifesto: `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm` | `assetManifest.json` | 2026-10-11 |
| `Player.ts` e `Enemy.ts` não chamam `setOrigin` | `grep -n setOrigin src/game/objects/*.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (decisão 2 original) | Ordem de integração | Skeleton, bestiário Tier 1 a 3, projéteis/orbes, tilesets | Manter, com um inimigo piloto primeiro |
| 2 (decisão 3 original) | Spritesheet x sprite único e pivô dos pés (`setOrigin(0.5, 0.7)` proposto) | definir no piloto | Definir no piloto do primeiro inimigo |
| 3 (novo) | Qual inimigo é o piloto | `spr_skeleton` / outro | `spr_skeleton`, por ser o primeiro da ordem proposta |

## Escopo
- Gerar o arquivo do piloto (arte em specs de produção), registrar no manifesto, animar e validar.

## Fora de escopo
- Demais inimigos (spec do bestiário); gerar a arte; remover o gerador procedural.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`, `src/game/animations/animationManager.ts`; `src/utils/textureGenerator.ts` só se uma chave mudar.
- Criar: arquivo em `public/assets/sprites/enemies/`. Binário: conferir o header com `file`.
- Dimensões de frame e pivô: a definir (decisão 2).

## Critérios de aceite
- **IP-1** (SP-5) O assetManifest deve declarar, para o inimigo piloto integrado, `frameWidth` e `frameHeight` iguais às dimensões do frame do arquivo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| IP-1 | `pnpm run test` (integridade do manifesto) |
| Aparência e leitura no jogo | Não validado: precisa de playtest humano |

## Questões em aberto
- Decisões 1 a 3 sem resposta; dimensões de frame e pivô "a definir".

## Pendências para promover a backlog
- Aprovação do responsável; decisões 1 a 3; spec do contrato aprovada.
- Preencher *Arquivos e contratos* e remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md), [bestiário](feature-assets-sprites-bestiario.md)
- [enemies-and-bestiary](../../gameplay/enemies-and-bestiary.md), [asset-scripts](../../operations/asset-scripts.md)
