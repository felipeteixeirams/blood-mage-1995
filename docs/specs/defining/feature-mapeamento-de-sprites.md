# Mapeamento de sprites e substituição de texturas procedurais

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: pipeline com fallback procedural (`src/game/assets/assetManifest.ts` e `assetManifest.json`; `BootScene.ts` chama `queueAssetLoading` e `generateGameTextures(scene, { force: false })`), `src/game/animations/animationManager.ts`, `scripts/verify-assets.cjs`, `src/game/assets/assetIntegrity.test.ts`; arte física só de jogador (`public/assets/sprites/player/bloodmage.png`, 544x1156, células 68x68, 8x17), baú (`items/chest/` e `chest_open/`, 48x48, 8 direções, `required: true`) e 12 imagens de UI (`src/assets/ui/`, cópia em `public/assets/ui/`). Falta: `public/assets/sprites/enemies/` está vazio; o manifesto declara inimigos, projéteis, itens e tiles como `required: false`, sem arquivo. Chaves reais: `spr_skeleton`, `spr_cultist`, `spr_npc_maelen`; o Clérigo usa `spr_cultist` com tint (`DungeonFlowController.ts`). `spr_npc_cleric`, `portrait_*`, `spr_loot_bag` e `spr_destructible_urn` não existem em `src/`.

## Contexto
- Quase todo o visual além de jogador, baú e UI é gerado em runtime (`src/utils/textureGenerator.ts`). O manifesto é a fonte de verdade e só aceita `required: true` com o arquivo commitado e `pnpm run verify` passando.
- Esta spec lista o que seria trocado por sprite físico e em que ordem. Produção de arte: [discovery-assets-externos-e-sprites.md](discovery-assets-externos-e-sprites.md), [discovery-ui-e-assets-externos](discovery-ui-e-assets-externos/01-visao-e-escopo-visual.md), [feature-guia-pixel-lab](feature-guia-pixel-lab/README.md). Scripts: [asset-scripts.md](../../operations/asset-scripts.md).

## Objetivo
Substituir, por categoria, as texturas procedurais por sprites físicos registrados no manifesto, mantendo o fallback procedural para toda chave sem arquivo.

## Decisões de que depende
Nenhuma.

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `public/assets/sprites/enemies/` está vazio | `ls public/assets/sprites/enemies` | 2026-10-11 |
| 19 entradas `required: true` (jogador e baú); inimigos, projéteis, itens e tiles são `required: false` | `src/game/assets/assetManifest.json` | 2026-10-11 |
| Chaves de inimigo no manifesto: `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm` | `assetManifest.json` | 2026-10-11 |
| Origem do spritesheet do jogador é `scripts/build_bloodmage_spritesheet.cjs`; `verify-assets.cjs` valida o header de binários | `CLAUDE.md`, `scripts/verify-assets.cjs` | 2026-10-11 |
| `src/game/objects/Player.ts` e `Enemy.ts` não chamam `setOrigin` | `grep -n setOrigin src/game/objects/*.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Início da produção de sprites (orçamento, direção de arte) | iniciar agora / adiar | Responsável decide; nada no código depende |
| 2 | Ordem de integração | Skeleton, bestiário Tier 1 a 3, projéteis/orbes, tilesets | Manter, com um inimigo piloto primeiro |
| 3 | Spritesheet x sprite único e pivô dos pés (`setOrigin(0.5, 0.7)` proposto) | definir no piloto | Definir no piloto do primeiro inimigo |
| 4 | Orçamento de VRAM e tamanho do pacote (proposta: abaixo de 2,5 MB com `pngquant`/WebP) | medir | Medir depois do primeiro lote |
| 5 | Resolução por categoria (personagens até 64x64, chefes até 128x128, tiles 64x32, projéteis e ícones 16x16 ou 32x32) e paleta Grimdark | aprovar ou ajustar | Aprovar junto com a direção de arte |

## Escopo
Por categoria, quando aprovada: gerar o arquivo, registrar no manifesto e validar.

| Categoria | Chaves (manifesto ou gerador procedural) | Hoje |
|---|---|---|
| Jogador | variação sem capuz, camadas de manto tier 2/3, cajado, foice | Só tint procedural |
| Bestiário | `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm`, `spr_gore_abomination` | Declarados (a última a reconferir), arquivos ausentes |
| NPCs e retratos | clérigo, alquimista, ferreiro, ancião (sprite e retrato) | Chaves próprias não existem |
| Feitiços e VFX | `proj_blood_bolt`, `proj_energy_bolt`, foice, círculo e explosão de sangue, partículas, `blood_pool_stain`, `fog_mist` | Procedural |
| Coletáveis | `orb_hp`, `orb_mana`, `gem_xp`, bolsa de loot, frasco curativo | Procedural |
| Cenário | `tile_ground`, `tile_wall_brick`, `tile_door`, `spr_portal`, ossadas, tochas, braseiros, urna destrutível | Procedural |
| Emotes | `icon_alert`, `icon_suspicious`, `icon_flee`, `icon_skull` | Procedural |

## Fora de escopo
- Gerar a arte (PixelLab, SpriteCook, pipeline de IA): ver os discoveries.
- Alterar jogador, baú e UI que já têm arte física.
- Remover o gerador procedural (continua como fallback).

## Arquivos e contratos
- Alterar por categoria: `src/game/assets/assetManifest.json` (chave única, `path`, `frameWidth`/`frameHeight`, `required`), `src/game/animations/animationManager.ts` (animações) e `src/utils/textureGenerator.ts` (só se uma chave mudar).
- Criar: arquivos em `public/assets/sprites/<categoria>/` e `public/assets/tilesets/`. Binários: nunca editar com ferramentas de texto; conferir o header com `file`.
- Não tocar: `public/assets/sprites/player/bloodmage.png` e `scripts/generate_bloodmage_spritesheet.cjs`.
- Dimensões de frame, pivô e orçamento: a definir (decisões 3 a 5).

## Critérios de aceite
- **SP-1** Quando uma chave do manifesto tem arquivo carregado, o BootScene deve usar o sprite físico em vez da textura procedural (provisório).
- **SP-2** Se o arquivo de uma chave `required: false` não existir, então o BootScene deve registrar o aviso e usar a textura procedural, sem erro fatal (provisório).
- **SP-3** O assetManifest deve marcar `required: true` só para chaves cujo arquivo esteja commitado (provisório).
- **SP-4** Se um binário em `public/assets` ou `src/assets` tiver header inválido, então o `verify-assets` deve falhar (provisório).
- **SP-5** O assetManifest deve declarar, para cada inimigo integrado, `frameWidth` e `frameHeight` iguais às dimensões do frame do arquivo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| SP-1, SP-2 | `src/game/assets/assetIntegrity.test.ts` (ou novo teste do manifesto) e Playwright de fumaça (skill `phaser-4-playtest-harness`) |
| SP-3, SP-5 | `pnpm run test` (integridade do manifesto) |
| SP-4 | `pnpm run verify` |
| Aparência e leitura no jogo | Não validado: precisa de playtest humano |

## Questões em aberto
1. Decisões 1 a 5 sem resposta; dimensões de frame e pivô "a definir".
2. Confirmar no manifesto a chave `spr_gore_abomination` e as chaves de projéteis, itens e tiles.
3. Nomes das chaves novas de NPC e retrato.

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 5.
- Questões 1 a 3; escolher uma unidade pequena (ex.: um inimigo piloto), pois a spec atual é um épico.
- Preencher *Arquivos e contratos* com valores e remover "(provisório)".

## Referências
- [asset-scripts.md](../../operations/asset-scripts.md), [enemies-and-bestiary.md](../../gameplay/enemies-and-bestiary.md)
- Skills `phaser-4-playtest-harness` e `spritecook-integration`
