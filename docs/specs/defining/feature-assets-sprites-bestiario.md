# Feature: sprites do bestiário (após o piloto)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): `public/assets/sprites/enemies/` vazio; os inimigos estão declarados no manifesto como `required: false`, sem arquivo. `spr_gore_abomination` precisa ser reconferida no manifesto.

**Origem:** categoria "Bestiário" do escopo, questão 2 e decisão 2 (ordem) de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Depende do [piloto](feature-assets-sprites-inimigo-piloto.md), que define spritesheet x sprite único e pivô, e do [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md).
- Hoje o visual é procedural (`src/utils/textureGenerator.ts`).

## Objetivo
Cada inimigo do bestiário tem sprite físico registrado no manifesto, mantendo o fallback procedural.

## Decisões de que depende
Nenhuma ADR; depende das decisões da spec do piloto (ordem, pivô) e do contrato (resolução).

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Chaves de inimigo no manifesto: `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm` | `assetManifest.json` | 2026-10-11 |

## Escopo
Chaves: `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm`, `spr_gore_abomination` (a última a reconferir). Hoje: declarados, arquivos ausentes. Por chave: gerar o arquivo, registrar no manifesto e validar.

## Fora de escopo
Gerar a arte; alterar o jogador; remover o gerador procedural.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`, `src/game/animations/animationManager.ts`; `src/utils/textureGenerator.ts` só se uma chave mudar.
- Criar: arquivos em `public/assets/sprites/enemies/`; conferir o header com `file`.
- Dimensões de frame: a definir.

## Critérios de aceite
- **BE-1** (novo, derivado de SP-1 e SP-5) Quando um inimigo do bestiário tem arquivo registrado, o assetManifest deve declarar `frameWidth` e `frameHeight` iguais ao frame do arquivo e o BootScene deve usar o sprite físico (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| BE-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Confirmar no manifesto a chave `spr_gore_abomination`.
- Dimensões de frame e pivô (vêm do piloto).

## Pendências para promover a backlog
- Aprovação do responsável; piloto concluído; remover "(provisório)".

## Referências
- [piloto](feature-assets-sprites-inimigo-piloto.md), [contrato](feature-assets-sprites-contrato-do-manifesto.md), [enemies-and-bestiary](../../gameplay/enemies-and-bestiary.md)
