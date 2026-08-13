---
agent_context: game-engine, frontend, game-designer, pixel-artist, developer
target_module: artifacts/bloodmage/src/assets, src/game, src/utils
priority: alta
status: andamento
last_updated: 2026-08-13
tags: [specs, sprites, pixel-art, assets, mapping, checklist, hybrid-system]
---

# 🎨 Mapeamento Completo de Sprites & Checklist de Substituição

> **Documento Vivo de Rastreamento (Living Tracking Spec)**
> Mapeamento exaustivo de todos os elementos visuais do **Bloodmage 1995** que possuem geração procedural (Canvas) e que serão progressivamente substituídos por assets em Pixel Art física (PNG/WebP), preservando o fallback procedural sob a mesma chave única.

---

## 📊 Dashboard de Progresso de Integração

| Categoria | Total de Itens | Procedural (Fallback) | Sprite Físico Integrado | Conclusão |
|---|:---:|:---:|:---:|:---:|
| **1. Personagem Principal & Camadas** | 6 variações / animações | 6 | 0 | 0% |
| **2. Bestiário (Inimigos e Chefes)** | 11 criaturas | 11 | 0 | 0% |
| **3. NPCs & Retratos (Portraits)** | 8 itens | 8 | 0 | 0% |
| **4. Feitiços, Projéteis e VFX** | 8 efeitos | 8 | 0 | 0% |
| **5. Coletáveis, Loot & Recursos** | 5 itens | 5 | 0 | 0% |
| **6. Cenário, Masmorra & Props** | 10 elementos | 10 | 0 | 0% |
| **7. Emotes & Indicadores de IA** | 4 ícones | 4 | 0 | 0% |
| **8. UI, Menus e Molduras Góticas** | 12 elementos | 0 | 12 | **100%** ✅ |
| **TOTAL GERAL DO JOGO** | **64 elementos** | **52** | **12** | **18.7%** |

---

## 📐 Diretrizes Técnicas para Fornecimento de Sprites

Antes de desenhar ou exportar qualquer sprite, certifique-se de respeitar os guardrails de arquitetura:

1. **Chave Única Idêntica:** A chave da textura no Phaser (`key`) deve ser **exatamente a mesma** definida na tabela abaixo (ex: `spr_bloodmage`, `spr_hound`, `orb_hp`).
2. **Formato & Otimização:** PNG com canal alpha (RGBA de 8-bit/color), compactado via `pngquant` ou salvo em `.webp` (sem perdas perceptíveis).
3. **Resolução Máxima Retro 16-bit:** 
   - Personagens/Monstros normais: até **64x64px** por frame.
   - Monstros Colossais / Chefes: até **128x128px** por frame.
   - Tiles isométricos: **64x32px** (padrão 2:1).
   - Projéteis e Ícones: **16x16px** ou **32x32px**.
4. **Paleta Grimdark Oficial:**
   - `Abyssal Void` (`#0a050a` / `#140e15`) — Sombras e fundos
   - `Crimson Blood Red` (`#7a121d` / `#a81c2b` / `#dc2626`) — Sangue, magias, olhos
   - `Tarnished Gold` (`#7a5d12` / `#c9a227` / `#d4af37`) — Bordas, metais, relíquias
   - `Bone White` (`#d1c7b7` / `#e3dac9` / `#e2e8f0`) — Ossadas, armaduras, dentes
   - `Toxic Bile Green` (`#1e382b` / `#22c55e`) — Pústulas, venenos, lodo
5. **Fallback Procedural Ativo:** Se o arquivo físico não for encontrado no carregador da cena, o sistema aciona automaticamente a rotina correspondente em `src/utils/textureGenerator.ts` sem travar o jogo.

---

## 🧙‍♂️ Categoria 1: Personagem Principal (Bloodmage) & Camadas

| Status | Chave (`key`) | Descrição | Tamanho Alvo | Animações / Frames Necessários | Fallback Atual | Localização no Código |
|:---:|---|---|:---:|---|---|---|
| [ ] | `spr_bloodmage` | Mago de Sangue com capuz rubro e cajado com gema | 32x48 (ou 64x64 com padding) | • Idle (4 frames)<br>• Walk 8 direções (4 frames cada)<br>• Cast Spell (4 frames)<br>• Scythe Swing (6 frames)<br>• Hurt (2 frames)<br>• Death (6 frames) | `textureGenerator.ts` (L74-106) | `Player.ts:38`, `GameScene.ts` |
| [ ] | `spr_bloodmage_hoodless` | Skin/Variação: Mago sem capuz (cabelos brancos) | 32x48 | Idle, Walk, Cast, Hurt, Death | Tinting procedural | `Player.ts` |
| [ ] | `spr_bloodmage_robe_tier2` | Camada de Armadura: Manto Carmesim Encantado | 32x48 | Sincronizado com frames do player | N/A (procedural) | `gameStore.ts` |
| [ ] | `spr_bloodmage_robe_tier3` | Camada de Armadura: Túnica de Sangue Ancestral | 32x48 | Sincronizado com frames do player | N/A (procedural) | `gameStore.ts` |
| [ ] | `spr_staff_blood` | Camada de Arma: Cajado com gema de rubi | 32x48 | Sincronizado com walk/cast | N/A (procedural) | `Player.ts` |
| [ ] | `spr_scythe_blood` | Camada de Arma: Foice de Sangue em riste | 48x48 | Frames de corte em arco (180°) | N/A (procedural) | `GameScene.ts` |

---

## 👹 Categoria 2: Bestiário (Inimigos, Criaturas e Chefes)

| Status | Chave (`key`) | Nome do Inimigo | Tamanho Alvo | Animações / Estados FSM | Fallback Atual | Localização no Código |
|:---:|---|---|:---:|---|---|---|
| [ ] | `spr_skeleton` | **Skeleton Warrior** (Esqueleto com espada enferrujada) | 32x40 | • Idle (2 frames)<br>• Walk (4 frames)<br>• Windup (2 frames)<br>• Slash Strike (3 frames)<br>• Collapse/Death (4 frames) | `textureGenerator.ts` (L109-131) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_cultist` | **Cultist Acolyte** (Cultista com manto roxo e olhos verdes) | 32x40 | • Idle (2 frames)<br>• Walk (4 frames)<br>• Windup Cast (3 frames)<br>• Cast Energy Bolt (2 frames)<br>• Death (4 frames) | `textureGenerator.ts` (L134-146) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_hound` | **Hell Hound** (Cão infernal quadrúpede veloz) | 36x28 | • Idle (2 frames)<br>• Run Sprint (4 frames)<br>• Leap Windup (2 frames)<br>• Bite Strike (3 frames)<br>• Death (3 frames) | `textureGenerator.ts` (L149-165) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_golem` | **Flesh Golem** (Golias de carne costurada com olho vermelho) | 48x56 | • Heavy Walk (4 frames)<br>• Smash Windup (3 frames)<br>• Ground Slam (3 frames)<br>• Stagger (2 frames)<br>• Death (5 frames) | `textureGenerator.ts` (L168-185) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_specter` | **Blood Specter** (Espectro etéreo flutuante translúcido) | 32x40 | • Floating Idle (4 frames loop)<br>• Shriek Windup (2 frames)<br>• Phase Dash (3 frames)<br>• Dissipate Death (4 frames) | `textureGenerator.ts` (L188-201) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_boss` | **Necro Lord** (Chefe com armadura de obsidiana e elmo cornudo) | 64x72 | • Intimidating Idle (4 frames)<br>• Walk (4 frames)<br>• Summon Spell (4 frames)<br>• Heavy Blade Slash (5 frames)<br>• Defeat Burst (6 frames) | `textureGenerator.ts` (L203-220) | `Enemy.ts`, `GameScene.ts` |
| [ ] | `spr_zombie_shambler` | **Zombie Shambler** (Zumbi em decomposição com caixa torácica exposta) | 32x40 | • Shambling Walk (4 frames)<br>• Claw Attack (3 frames)<br>• Collapse Death (4 frames) | `textureGenerator.ts` (L223-241) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_vampire_stalker` | **Vampire Stalker** (Predador aristocrata com capa e presas) | 32x44 | • Stalk Walk (4 frames)<br>• Teleport/Dash Flurry (4 frames)<br>• Bite Strike (3 frames)<br>• Ash Death (4 frames) | `textureGenerator.ts` (L244-262) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_werewolf_lycan` | **Werewolf Lycan** (Fera lupina com garras afiadas) | 38x44 | • Ferocious Run (4 frames)<br>• Claw Swipe Combo (4 frames)<br>• Howl Buff (3 frames)<br>• Death (4 frames) | `textureGenerator.ts` (L265-282) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_bat_swarm` | **Bat Swarm** (Morcego vampírico com asas púrpuras) | 20x20 | • Wing Flapping Flight (4 frames)<br>• Dive Attack (2 frames)<br>• Disperse Death (3 frames) | `textureGenerator.ts` (L285-307) | `Enemy.ts`, `DungeonGenerator.ts` |
| [ ] | `spr_gore_abomination` | **Gore Abomination** (Colosso pulsante de carne e pústulas verdes) | 52x60 | • Pulsating Slime Walk (4 frames)<br>• Tentacle Slam (4 frames)<br>• Bile Burst (3 frames)<br>• Massive Rupture Death (6 frames) | `textureGenerator.ts` (L310-333) | `Enemy.ts`, `DungeonGenerator.ts` |

---

## 🏛️ Categoria 3: NPCs e Retratos de Diálogo (Safe Zones)

| Status | Chave (`key`) | Nome do NPC | Tamanho do Sprite | Tamanho do Retrato (Portrait) | Descrição Visual | Localização no Código |
|:---:|---|---|:---:|:---:|---|---|
| [ ] | `spr_npc_cleric` | **Clérigo de Sangue** (Vendedor de Curativos e Bênçãos) | 32x48 | 64x64 | Sacerdote com túnica branca manchada de vinho e capuz | `GameScene.ts:673` |
| [ ] | `portrait_cleric` | Retrato do Clérigo | N/A | 64x64 | Rosto marcado com olhar piedoso e amuleto rúnico | Modais de Diálogo |
| [ ] | `spr_npc_alchemist` | **Alquimista Rubro** (Vendedor de Poções e Frascos) | 32x48 | 64x64 | Erudito com óculos rústicos e frascos borbulhantes | `GameScene.ts:679` |
| [ ] | `portrait_alchemist` | Retrato do Alquimista | N/A | 64x64 | Expressão maníaca, olhos arregalados, tubos de ensaio | Modais de Diálogo |
| [ ] | `spr_npc_blacksmith` | **Ferreiro de Ossos** (Forjador de Armas e Armaduras) | 32x48 | 64x64 | Esqueleto com avental de couro e martelo pesado | `GameScene.ts:685` |
| [ ] | `portrait_blacksmith` | Retrato do Ferreiro | N/A | 64x64 | Caveira polida usando bandana de forja | Modais de Diálogo |
| [ ] | `spr_npc_elder` | **Ancião do Refúgio** (Mestre de Talentos e Lore) | 32x48 | 64x64 | Mago idoso corcunda com barba longa e cajado entalhado | `GameScene.ts:691` |
| [ ] | `portrait_elder` | Retrato do Ancião | N/A | 64x64 | Olhar sábio, runa brilhante na testa | Modais de Diálogo |

---

## 🔮 Categoria 4: Feitiços, Projéteis e Efeitos Visuais (VFX)

| Status | Chave (`key`) | Efeito / Magia | Resolução | Tipo / Animação | Fallback Atual | Localização no Código |
|:---:|---|---|:---:|---|---|---|
| [ ] | `proj_blood_bolt` | **Blood Bolt** (Projétil Primário de Sangue) | 16x16 | Esfera de sangue com rastro energético (2-3 frames) | `textureGenerator.ts` (L336-346) | `Projectile.ts`, `GameScene.ts` |
| [ ] | `proj_energy_bolt` | **Cultist Energy Bolt** (Projétil Roxo dos Cultistas) | 16x16 | Esfera arcana púrpura cintilante (2-3 frames) | `textureGenerator.ts` (L349-359) | `Projectile.ts`, `GameScene.ts` |
| [ ] | `vfx_blood_scythe` | **Foice de Sangue** (Arco de Corte Melee) | 48x48 | Lâmina vermelha translúcida cortando o ar (4 frames) | Renderização dinâmica | `GameScene.ts` |
| [ ] | `vfx_blood_pool` | **Círculo de Sangue** (Poça Rúnica de Drenagem) | 64x40 | Selo rúnico pulsante no chão com sangue borbulhante | Procedural Canvas | `GameScene.ts` |
| [ ] | `vfx_blood_surge` | **Explosão de Sangue** (Nova Radial) | 64x64 | Onda de choque carmesim expandindo em anel | Procedural Canvas | `GameScene.ts` |
| [ ] | `particle_blood_red` | **Gota / Partícula de Sangue** | 8x8 | Pingo e respingos de sangue com variações | `textureGenerator.ts` (L397-401) | `GameScene.ts:2467` |
| [ ] | `blood_pool_stain` | **Mancha de Sangue no Chão** (Decal Permanente) | 32x20 | Poça de sangue estática com bordas irregulares | `textureGenerator.ts` (L404-410) | `GameScene.ts:2396` |
| [ ] | `fog_mist` | **Névoa de Chão da Masmorra** | 128x128 | Nuvem suave translúcida para efeito de atmosfera | `textureGenerator.ts` (L654-666) | `LightingSystem.ts` |

---

## 💎 Categoria 5: Coletáveis, Recursos e Loot

| Status | Chave (`key`) | Item Coletável | Dimensões | Animação / Efeito | Fallback Atual | Localização no Código |
|:---:|---|---|:---:|---|---|---|
| [ ] | `orb_hp` | **Orbe de Vida (Carmesim)** | 16x16 | Orbe esférico vermelho flutuando e pulsando (4 frames) | `textureGenerator.ts` (L362-370) | `Collectible.ts:10` |
| [ ] | `orb_mana` | **Orbe de Mana (Azul Arcana)** | 16x16 | Orbe esférico azul safira com brilho interno (4 frames) | `textureGenerator.ts` (L373-381) | `Collectible.ts:10` |
| [ ] | `gem_xp` | **Cristal de Sangue / XP (Esmeralda/Rubi)** | 12x12 ou 16x16 | Cristal facetado girando suavemente (4 frames) | `textureGenerator.ts` (L384-394) | `GameScene.ts`, `LootSystem.ts` |
| [ ] | `spr_loot_bag` | **Bolsa de Saques de Equipamento** | 20x20 | Bolsa de couro amarrada com cordão de ouro | `particle_orb_blue` | `Loot.ts:9` |
| [ ] | `spr_curative_potion` | **Frasco de Sangue Curativo** | 16x20 | Frasco de vidro gótico com líquido vermelho | Procedural | `GameplayHUD.tsx` |

---

## 🏰 Categoria 6: Cenário, Masmorra e Props Interativos

| Status | Chave (`key`) | Elemento de Cenário | Dimensões | Estados Requeridos | Fallback Atual | Localização no Código |
|:---:|---|---|:---:|---|---|---|
| [ ] | `tile_ground` | **Tile de Chão Isométrico** (Pedra de Masmorra) | 64x32 | Variações com pedra lisa, rachada, musgo e manchas | `textureGenerator.ts` (L37-71) | `DungeonGenerator.ts:43` |
| [ ] | `tile_wall_brick` | **Bloco de Parede de Pedra Gótica** | 32x32 / 64x64 | Textura de tijolos escuros com relevo e fendas | `textureGenerator.ts` (L413-433) | `DungeonGenerator.ts:138` |
| [ ] | `tile_door` | **Arco / Portão de Passagem** | 32x32 / 64x64 | • Fechado (Grade de ferro)<br>• Aberto (Vão escuro) | `textureGenerator.ts` (L436-454) | `DungeonGenerator.ts:94` |
| [ ] | `spr_portal` | **Portal de Transição de Andar** | 40x40 / 64x64 | Vórtice espiral com runas girando (6-8 frames) | `textureGenerator.ts` (L457-473) | `GameScene.ts:2517` |
| [ ] | `spr_chest` | **Baú de Tesouro Gótico** | 24x20 / 32x32 | • Fechado com fechadura de ouro<br>• Abrindo (3 frames)<br>• Aberto e Vazio | `textureGenerator.ts` (L476-488) | `DungeonGenerator.ts:112`, `Scavengeable.ts` |
| [ ] | `spr_skeleton_remains` | **Ossada de Aventureiro Vasculhável** | 24x18 / 32x32 | • Intacto com crânio e ossos cruzados<br>• Revirado/Vazio | `textureGenerator.ts` (L491-504) | `Scavengeable.ts:16` |
| [ ] | `spr_dead_soldier` | **Cadáver de Soldado com Armadura** | 28x16 / 32x32 | • Com armadura de aço e elmo<br>• Pilhado/Vazio | `textureGenerator.ts` (L507-517) | `Scavengeable.ts:19` |
| [ ] | `light_torch` | **Tocha de Parede com Fogo Animado** | 32x64 (ou 128x128) | Suporte de metal/madeira com chama animada (4 frames) | `textureGenerator.ts` (L558-593) | `GameScene.ts:353` |
| [ ] | `light_brazier` | **Braseiro / Caldeirão de Chão** | 64x64 (ou 192x192) | Caldeirão de ferro com labaredas vivas (4 frames) | `textureGenerator.ts` (L596-651) | `GameScene.ts:353` |
| [ ] | `spr_destructible_urn` | **Urna / Jarro de Cinzas Quebrável** | 24x24 | • Inteira<br>• Quebrando em cacos (3 frames) | N/A | `DungeonGenerator.ts` |

---

## ⚠️ Categoria 7: Emotes Táticos e Indicadores de IA

| Status | Chave (`key`) | Indicador Tático | Dimensões | Descrição Visual | Fallback Atual | Localização no Código |
|:---:|---|---|:---:|---|---|---|
| [ ] | `icon_alert` | **Alerta de Inimigo (!)** | 12x18 / 16x16 | Ponto de exclamação vermelho com contorno branco | `textureGenerator.ts` (L520-528) | `Enemy.ts:186` |
| [ ] | `icon_suspicious` | **Suspeita / Investigação (?)** | 12x18 / 16x16 | Ponto de interrogação dourado/âmbar | `textureGenerator.ts` (L531-540) | `Enemy.ts:166` |
| [ ] | `icon_flee` | **Pânico / Fuga do Monstro** | 12x18 / 16x16 | Gotas azuis de suor ou seta azulada em fuga | `textureGenerator.ts` (L543-555) | `Enemy.ts:161` |
| [ ] | `icon_skull` | **Ponteiro de Cadáver / Morte** | 16x16 | Caveira pequena indicando local do cadáver no mapa | `textureGenerator.ts` | `GameScene.ts:420` |

---

## 🖼️ Categoria 8: Interface de Usuário, Menus e Molduras (UI/HUD)

> **Status Atual:** 100% dos assets do Menu Principal e Painéis de Ajustes/Recordes foram integrados em alta fidelidade.

| Status | Chave (`key`) | Elemento de UI | Arquivo Físico | Resolução | Descrição |
|:---:|---|---|---|:---:|---|
| [x] | `logo` | **Logotipo Principal Bloodmage 1995** | `src/assets/ui/title-logo.png` | 1088x608 | Logotipo em relevo dourado e carmesim com textura gótica |
| [x] | `altar` | **Altar de Pedra do Menu** | `src/assets/ui/altar.png` | 1152x576 | Altar gótico detalhado em pedra esculpida com runas |
| [x] | `gargoyleTop` | **Gárgula Superior Ornamental** | `src/assets/ui/gargoyle-top.png` | 816x816 | Escultura de gárgula de pedra em posição de guarda |
| [x] | `gargoyleBottom` | **Gárgula Inferior de Suporte** | `src/assets/ui/gargoyle-bottom.png` | 816x816 | Base gótica esculpida de sustentação do portal |
| [x] | `torch` | **Suporte de Tocha Medieval** | `src/assets/ui/torch.png` | 816x816 | Braço de tocha de ferro forjado e madeira |
| [x] | `runeArch` | **Arco de Runas Arcano** | `src/assets/ui/rune-arch.png` | 1024x640 | Arco de pedra maciça com inscrições mágicas púrpuras |
| [x] | `stoneTile` | **Textura de Pedra para Painéis** | `src/assets/ui/stone-tile.jpg` | 816x816 | Padrão contínuo de lajotas de pedra escura |
| [x] | `rockTile` | **Textura de Rocha Cavernosa** | `src/assets/ui/rock-tile.jpg` | 816x816 | Padrão contínuo de rocha escura para o fundo |
| [x] | `uiCorner` | **Cantoneira Dourada Ornamental** | `src/assets/ui/ui-corner.png` | 816x816 | Cantoneira em ouro envelhecido com gema de rubi central |
| [x] | `uiPlaque` | **Placa de Cabeçalho / Banner** | `src/assets/ui/ui-plaque.png` | 1280x512 | Banner gótico de títulos para modais de Settings e HighScores |
| [x] | `uiGem` | **Diamante de Rubi para Sliders/Botões** | `src/assets/ui/ui-gem.png` | 816x816 | Gema de rubi lapidada com moldura dourada |
| [x] | `uiCap` | **Terminal de Slider de Volume** | `src/assets/ui/ui-slider-cap.png` | 816x816 | Terminal circular em metal escuro com rebites de ouro |

---

## 🔄 Fluxo Operacional de Integração (Passo a Passo)

Sempre que um novo pacote ou lote de sprites for fornecido:

```
[1. Fornecer Asset] ──> [2. Salvar em src/assets/ ou public/assets/]
                                 │
                                 ▼
[3. Carregar em Scene.preload()] ──> [4. Teste Visual & Typecheck]
                                              │
                                              ▼
                                 [5. Marcar [x] no Checklist]
```

1. **Salvar Arquivo:** Armazenar a imagem na pasta adequada (ex: `src/assets/sprites/enemies/spr_hound.png`).
2. **Importação / Carregamento:**
   ```ts
   // Exemplo em BootScene.ts ou GameScene.ts
   import houndSpriteUrl from '@/assets/sprites/enemies/spr_hound.png';
   
   preload() {
     this.load.spritesheet('spr_hound', houndSpriteUrl, {
       frameWidth: 36,
       frameHeight: 28
     });
   }
   ```
3. **Criação das Animações (se spritesheet):**
   ```ts
   this.anims.create({
     key: 'hound_run',
     frames: this.anims.generateFrameNumbers('spr_hound', { start: 0, end: 3 }),
     frameRate: 10,
     repeat: -1
   });
   ```
4. **Verificação de Segurança e Testes:**
   ```bash
   npm run typecheck && npm test
   ```
5. **Atualização do Checklist:** Marcar o elemento como `[x]` neste documento e atualizar a tabela de progresso no topo.

---

## 🔗 Documentos de Referência
- `[[docs/specs/propostas/02_DISCOVERY_UI_ASSETS_EXTERNOS.md]]` — Proposta de Arte e UI Gótica.
- `[[docs/specs/propostas/02_EIXO_B_ASSETS_EXTERNOS_DISCOVERY.md]]` — Discovery do Pipeline Híbrido de Assets.
- `[[docs/critical/00_ANTI_REGRESSION_GUIDE.md]]` — Guardrails de Estabilidade e Fallback Mandatório.
- `[[docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md]]` — Solução de Problemas Conhecidos com Assets.
