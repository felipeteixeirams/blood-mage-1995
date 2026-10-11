# Mapeamento de Sprites e Substituição de Texturas Procedurais

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática).
- Existe: pipeline de assets com fallback procedural (`src/game/assets/assetManifest.ts` + `assetManifest.json`, `BootScene.ts` chama `queueAssetLoading` e depois `generateGameTextures(scene, { force: false })`, tratamento de `loaderror` com `logger`); `src/game/animations/animationManager.ts` com animações do jogador; `scripts/verify-assets.cjs`; pastas `public/assets/sprites/{player,enemies,projectiles,items}` e `public/assets/tilesets` (várias só com `.gitkeep`); sprites físicos: jogador (`public/assets/sprites/player/bloodmage.png`, 544x1156, frames 68x68, 8 colunas por 17 linhas, não 72 frames) e baú em 8 direções fechado/aberto (`public/assets/sprites/items/chest/`, `chest_open/`, 48x48); 12 imagens de UI em `src/assets/ui/` (e cópia em `public/assets/ui/`), importadas em `TitleScene.ts`, `SettingsScene.ts` e `RecordsScene.ts`.
- Falta: nenhum sprite físico de inimigo, projétil, orbe, tile, NPC, retrato, emote ou prop de cenário (`public/assets/sprites/enemies/` só tem `.gitkeep`); o manifesto declara 11 inimigos, 2 projéteis, 3 itens e 2 tiles como `required: false`. Chaves reais divergem da versão anterior da spec: `spr_skeleton` (não `spr_skeleton_warrior`), `spr_cultist` (não `spr_cultist_acolyte`), NPC de Maelen `spr_npc_maelen`, Clérigo usa `spr_cultist` com tint (`DungeonFlowController.ts`). `grep -rn "spr_npc_cleric\|portrait_\|spr_loot_bag\|spr_destructible_urn" src` sem resultados.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

| # | Decisão | Recomendação |
|---|---|---|
| 1 | Início da produção de sprites (orçamento e direção de arte) | Responsável decide; nada no código depende disso |
| 2 | Ordem de integração (proposta: Skeleton Warrior, depois bestiário Tier 1 a 3, projéteis/orbes, tilesets) | Manter essa ordem, começando por um inimigo piloto |
| 3 | Esquema spritesheet versus sprite único e pivô dos pés (`setOrigin(0.5, 0.7)` proposto; `Player.ts` não define origem hoje) | Definir no piloto do primeiro inimigo |
| 4 | Orçamento de VRAM e tamanho inicial do pacote (proposta: abaixo de 2,5 MB com `pngquant`/WebP) | Medir depois do primeiro lote |
| 5 | Diretrizes de resolução por categoria (personagens até 64x64, chefes até 128x128, tiles 64x32, projéteis e ícones 16x16 ou 32x32) e paleta Grimdark | Aprovar junto com a direção de arte |

## Pendente (itens não integrados como sprite físico)

| Categoria | Chaves do manifesto ou do gerador procedural | Observação |
|---|---|---|
| Jogador | variação sem capuz, camadas de manto tier 2/3, cajado, foice | Só tint procedural |
| Bestiário | `spr_skeleton`, `spr_cultist`, `spr_hound`, `spr_golem`, `spr_specter`, `spr_boss`, `spr_zombie_shambler`, `spr_vampire_stalker`, `spr_werewolf_lycan`, `spr_bat_swarm`, `spr_gore_abomination` | Declarados no manifesto, arquivos ausentes |
| NPCs e retratos | clérigo, alquimista, ferreiro, ancião (sprite e retrato) | Chaves próprias ainda não existem no código |
| Feitiços e VFX | `proj_blood_bolt`, `proj_energy_bolt`, foice, círculo e explosão de sangue, partículas, `blood_pool_stain`, `fog_mist` | Procedural |
| Coletáveis | `orb_hp`, `orb_mana`, `gem_xp`, bolsa de loot, frasco curativo | Procedural |
| Cenário | `tile_ground`, `tile_wall_brick`, `tile_door`, `spr_portal`, ossadas, tochas, braseiros, urna destrutível | Procedural |
| Emotes | `icon_alert`, `icon_suspicious`, `icon_flee`, `icon_skull` | Procedural |

## Critérios de aceite

A definir (spec ainda sem EARS). Ligação com [discovery-assets-externos-e-sprites.md](discovery-assets-externos-e-sprites.md) e [ui-assets-externos-framework.md](discovery-ui-e-assets-externos/01-visao-e-escopo-visual.md).
