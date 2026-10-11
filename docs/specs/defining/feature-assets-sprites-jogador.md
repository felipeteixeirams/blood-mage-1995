# Feature: variações visuais do jogador em sprite

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): o jogador já tem arte física (`public/assets/sprites/player/bloodmage.png`, 544x1156, células 68x68, 8x17). Variação sem capuz, camadas de manto tier 2/3, cajado e foice hoje só têm tint procedural.

**Origem:** categoria "Jogador" do escopo de `feature-assets-mapeamento-de-sprites.md` (removida).

## Contexto
- Origem do spritesheet do jogador: `scripts/build_bloodmage_spritesheet.cjs` (`CLAUDE.md`); `scripts/generate_bloodmage_spritesheet.cjs` é procedural, só emergência.
- Contrato comum: [feature-assets-sprites-contrato-do-manifesto](feature-assets-sprites-contrato-do-manifesto.md).

## Objetivo
As variações do jogador (sem capuz, mantos tier 2/3, cajado, foice) têm arte física em vez de tint procedural.

## Decisões de que depende
Nenhuma ADR; depende das decisões do contrato (resolução, orçamento).

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Origem do spritesheet do jogador é `scripts/build_bloodmage_spritesheet.cjs` | `CLAUDE.md` | 2026-10-11 |

## Escopo
Variação sem capuz, camadas de manto tier 2/3, cajado, foice: gerar, registrar no manifesto e validar.

## Fora de escopo
Alterar o `bloodmage.png` existente; gerar a arte; remover o fallback procedural.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`, `src/game/animations/animationManager.ts`.
- Criar: arquivos em `public/assets/sprites/player/` (nomes a definir). Conferir o header com `file`.
- Não tocar: `public/assets/sprites/player/bloodmage.png` e `scripts/generate_bloodmage_spritesheet.cjs`.

## Critérios de aceite
- **JO-1** (novo, derivado de SP-1) Quando uma variação do jogador tem arquivo registrado, o BootScene deve usar o sprite físico em vez do tint procedural (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| JO-1 | `pnpm run test`; aparência: não validado, precisa de playtest humano |

## Questões em aberto
- Nomes das chaves e dimensões das variações: a definir.

## Pendências para promover a backlog
- Aprovação do responsável; preencher contratos; remover "(provisório)".

## Referências
- [contrato do manifesto](feature-assets-sprites-contrato-do-manifesto.md), [asset-scripts](../../operations/asset-scripts.md)
