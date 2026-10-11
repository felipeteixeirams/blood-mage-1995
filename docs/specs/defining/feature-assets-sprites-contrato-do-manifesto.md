# Feature: contrato do manifesto e fallback procedural de sprites

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: pipeline com fallback procedural (`src/game/assets/assetManifest.ts` e `assetManifest.json`; `BootScene.ts` chama `queueAssetLoading` e `generateGameTextures(scene, { force: false })`), `src/game/animations/animationManager.ts`, `scripts/verify-assets.cjs`, `src/game/assets/assetIntegrity.test.ts`. Arte física só de jogador (`public/assets/sprites/player/bloodmage.png`, 544x1156, células 68x68, 8x17), baú (`items/chest/` e `chest_open/`, 48x48, 8 direções, `required: true`) e 12 imagens de UI (`src/assets/ui/`, cópia em `public/assets/ui/`). Inimigos, projéteis, itens e tiles são `required: false`, sem arquivo.

**Origem:** contexto, objetivo, decisões 1, 4 e 5, critérios SP-1 a SP-4 e fatos gerais de `feature-assets-mapeamento-de-sprites.md` (removida; era um épico). As categorias viraram specs próprias (ver Referências).

## Contexto
- Quase todo o visual além de jogador, baú e UI é gerado em runtime (`src/utils/textureGenerator.ts`). O manifesto é a fonte de verdade e só aceita `required: true` com o arquivo commitado e `pnpm run verify` passando.
- Esta spec é o contrato comum que as specs por categoria herdam. Produção de arte: [discovery-assets-arte-ui-audio-e-sprites](discovery-assets-direcao-artistica-e-escopo-visual.md); [pixel-lab-config](../../operations/pixel-lab-config.md); [asset-scripts](../../operations/asset-scripts.md).

## Objetivo
Toda chave do manifesto com arquivo usa o sprite físico, e toda chave sem arquivo mantém o fallback procedural.

## Decisões de que depende
Nenhuma ADR. Decisões a confirmar abaixo.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| 19 entradas `required: true` (jogador e baú); inimigos, projéteis, itens e tiles são `required: false` | `src/game/assets/assetManifest.json` | 2026-10-11 |
| Origem do spritesheet do jogador é `scripts/build_bloodmage_spritesheet.cjs`; `verify-assets.cjs` valida o header de binários | `CLAUDE.md`, `scripts/verify-assets.cjs` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (decisão 1 original) | Início da produção de sprites (orçamento, direção de arte) | iniciar agora / adiar | Responsável decide; nada no código depende |
| 2 (decisão 4 original) | Orçamento de VRAM e tamanho do pacote (proposta: abaixo de 2,5 MB com `pngquant`/WebP) | medir | Medir depois do primeiro lote |
| 3 (decisão 5 original) | Resolução por categoria (personagens até 64x64, chefes até 128x128, tiles 64x32, projéteis e ícones 16x16 ou 32x32) e paleta Grimdark | aprovar ou ajustar | Aprovar junto com a direção de arte |

## Escopo
- Garantir, no código e nos testes, o comportamento de carga e fallback por chave, valendo para todas as categorias.

## Fora de escopo
- Gerar a arte (PixelLab, SpriteCook, pipeline de IA): ver os discoveries.
- Alterar jogador, baú e UI que já têm arte física; remover o gerador procedural (continua como fallback).
- A integração de cada categoria (specs por categoria).

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json` (chave única, `path`, `frameWidth`/`frameHeight`, `required`).
- Binários: nunca editar com ferramentas de texto; conferir o header com `file`.
- Não tocar: `public/assets/sprites/player/bloodmage.png` e `scripts/generate_bloodmage_spritesheet.cjs`.
- Dimensões de frame, pivô e orçamento: a definir (decisões 2 e 3 aqui; pivô na spec do piloto).

## Critérios de aceite
- **SM-1** (SP-1) Quando uma chave do manifesto tem arquivo carregado, o BootScene deve usar o sprite físico em vez da textura procedural (provisório).
- **SM-2** (SP-2) Se o arquivo de uma chave `required: false` não existir, então o BootScene deve registrar o aviso e usar a textura procedural, sem erro fatal (provisório).
- **SM-3** (SP-3) O assetManifest deve marcar `required: true` só para chaves cujo arquivo esteja commitado (provisório).
- **SM-4** (SP-4) Se um binário em `public/assets` ou `src/assets` tiver header inválido, então o `verify-assets` deve falhar (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| SM-1, SM-2 | `src/game/assets/assetIntegrity.test.ts` (ou novo teste do manifesto) e Playwright de fumaça (skill `phaser-4-playtest-harness`) |
| SM-3 | `pnpm run test` (integridade do manifesto) |
| SM-4 | `pnpm run verify` |
| Aparência e leitura no jogo | Não validado: precisa de playtest humano |

## Questões em aberto
- Decisões 1 a 3 sem resposta.

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 3.
- Remover "(provisório)" e preencher os valores de *Arquivos e contratos*.

## Referências
- Categorias: [piloto de inimigo](feature-assets-sprites-inimigo-piloto.md), [bestiário](feature-assets-sprites-bestiario.md), [jogador](feature-assets-sprites-jogador.md), [NPCs e retratos](feature-assets-sprites-npcs-e-retratos.md), [feitiços e VFX](feature-assets-sprites-feiticos-e-vfx.md), [coletáveis](feature-assets-sprites-coletaveis.md), [cenário](feature-assets-sprites-cenario.md), [emotes](feature-assets-sprites-emotes.md).
- [asset-scripts](../../operations/asset-scripts.md), [enemies-and-bestiary](../../gameplay/enemies-and-bestiary.md); skills `phaser-4-playtest-harness` e `spritecook-integration`.
