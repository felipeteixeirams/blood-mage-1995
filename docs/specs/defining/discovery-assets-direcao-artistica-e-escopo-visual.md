# Assets: direção artística e escopo visual (discovery)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** D
**Depende de:** ADR 0010, ADR 0013
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Origem:** dividida de discovery-assets-arte-ui-audio-e-sprites (parte 01 e critérios AAS-18, AAS-19), 2026-10-11
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: texturas procedurais como fallback (`src/utils/textureGenerator.ts`); arte física só do jogador (`public/assets/sprites/player/bloodmage.png`, 68x68, 8 direções) e do baú; tint por raridade (`src/utils/equipmentPalette.ts`), glow de loot (`LightingPolish.addItemGlow`), tint de elite (`Enemy.ts`), cores de raridade em `InventoryModal.tsx`. Falta: camadas de armadura e arma no jogador, spritesheets de inimigos (`public/assets/sprites/enemies` vazio), retratos de NPC (`DialogueModal.tsx` usa ícones Lucide), tilesets externos (`public/assets/tilesets` vazio), ícones de skill e inventário em pixel art, sprites de loot, túmulo, VFX de magia em arte. Nenhum critério abaixo está implementado.

## Contexto
O jogo usa `textureGenerator.ts` (canvas) como fonte das texturas, com carga opcional de arquivos via `assetManifest.json`. Modelo híbrido proposto: arte física (PNG/WebP) e áudio físico (MP3/OGG) onde o ganho de imersão é maior, com os geradores procedurais como fallback **sob a mesma chave**. Estética: Diablo I e II e Dungeon Siege 1 (pixel art gótica dos anos 90), mobile-first, alto contraste e contorno legível em telas pequenas. O fallback procedural por chave já existe e é preservado.

Paleta Grimdark proposta (aprovação pendente):

| Cor | Hex | Uso |
|---|---|---|
| Deep Charcoal | `#171309` | Fundo de painéis e masmorras |
| Crimson Blood Red | `#990000` | Hemomancia, sangue, orbes vitais |
| Tarnished Gold | `#B8860B` | Bordas góticas, botões rúnicos ativos, itens raros |
| Bone White | `#E3DAC9` | Ossos, fontes rúnicas |
| Abyssal Void | `#000000` | Sombras absolutas e névoa |

## Objetivo
Se aprovada, o jogo troca gradualmente arte procedural por arte gótica licenciada, mantendo a legibilidade em mobile, sem quebrar o fallback procedural por chave. Esta spec fixa a direção e o escopo visual; carga, 9-slice, áudio, orçamento e entrega de arte estão nas specs vizinhas.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais PWA, TWA e Steam (formatos, licenças e créditos) | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance (legibilidade sem queda de FPS) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| O jogador tem spritesheet física 68x68; inimigos, projéteis, itens e tiles são `required: false` sem arquivo | `src/game/assets/assetManifest.json`, `public/assets/` | 2026-10-11 |
| Equipamento tinge o personagem por raridade; não há camadas independentes | `src/utils/equipmentPalette.ts` | 2026-10-11 |
| `DialogueModal.tsx` usa ícones Lucide, não retratos | `src/components/hud/DialogueModal.tsx` (linha 2) | 2026-10-11 |
| Fontes locais existem (Cinzel, UnifrakturMaguntia, Press Start 2P, VT323) | `public/fonts/` | 2026-10-11 |
| `public/assets/sprites/enemies`, `projectiles` e `public/assets/tilesets` estão vazios | listagem de `public/assets` | 2026-10-11 |

## Decisões a confirmar
Numeração original (preservada).

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Direção artística e paleta (ex-UIA 1) | A) paleta proposta; B) outra | A, por coerência com o CSS atual (`#b8860b` já em uso) |
| 2 | Ordem de migração de arte (ex-UIA 2) | A) jogador, inimigos, tiles, UI; B) tiles primeiro | A: o jogador já tem arte e valida o pipeline |
| 3 | Equipamento visível (ex-UIA 3) | A) camadas de spritesheet; B) manter tint por raridade | B até haver arte; camadas multiplicam animações |
| 4 | Retratos de NPC (ex-UIA 4) | A) imagem estática; B) animados (piscada e fala) | A: menor custo de arte |
| 5 | Origem da arte (ex-UIA 5) | A) pacotes CC0/CC-BY; B) arte própria/IA ([pipeline de arte com IA](feature-assets-pipeline-geracao-de-prompt.md)) | A para prototipar; B depende de orçamento de arte (decisão de negócio) |

## Escopo
Se aprovado, arte externa (sob o fallback procedural) para:
- **Personagem principal:** ataque de foice, conjuração, hit e morte além das 8 direções; camadas de manto e arma conforme decisão 3.
- **Inimigos:** cães infernais (corrida e mordida com windup), cultistas (conjuração e morte), mortos-vivos (rastejar e erguer); elites seguem com `setTint()`.
- **NPCs:** retratos do Clérigo, Alquimista e Ferreiro no diálogo; sprites estáticos ou de respiração nas Safe Zones.
- **Cenário e props:** tilesets góticos (pedra úmida, grades, rachaduras, poças de sangue); baús, altares rúnicos, recipientes de cinzas e corpos vasculháveis (fechado e aberto); portões que abrem após mini-chefes.
- **Ícones e inventário:** molduras rúnicas nos slots de skill; ícones de foice, explosão e círculo; runas com glow; grade do inventário em ferro cinzelado; miniaturas com cores de raridade (comum cinza, raro azul, épico roxo, lendário dourado).
- **Loot e túmulo:** poções vermelhas e azuis, sacos de couro, pergaminhos; túmulo ou corpo do jogador com fumaça ou facho vermelho.
- **VFX:** corte carmim com rastro, feixe de sangue, explosões necromânticas; bolas de fogo sombrio, garras de sombra e projéteis venenosos verdes legíveis.
- **Entrega de arte (guia Pixel Lab):** 11 inimigos, 4 NPCs, `spr_portal`, `spr_skeleton_remains` e tiles: critérios em [feature-assets-entrega-de-arte-pixel-lab](feature-assets-entrega-de-arte-pixel-lab.md).

## Fora de escopo
- Carga e atlas ([feature-assets-carga-atlas-e-normal-maps](feature-assets-carga-atlas-e-normal-maps.md)), orçamento e licenças ([discovery-assets-orcamento-licencas-e-creditos](discovery-assets-orcamento-licencas-e-creditos.md)), 9-slice ([feature-ui-moldura-9-slice](feature-ui-moldura-9-slice.md)), áudio ([feature-audio-fisico-hibrido](feature-audio-fisico-hibrido.md)).
- Produção da arte e escolha de pacotes (decisões 1 e 5); prompts do guia Pixel Lab.
- Mudar mecânica de combate, telégrafos ou balance; aura de inimigo (decisão 16, na spec de carga); mudar a chave de texturas existentes.

## Arquivos e contratos
- Esta spec não altera arquivos. Chaves seguem `src/game/assets/assetManifest.json`; asset novo usa a mesma chave do gerador procedural.
- Retrato de NPC: `DialogueModal.tsx` (alteração só se a decisão 4 for aprovada). Camadas de equipamento: renderizador do jogador (só se a decisão 3 for A).

## Critérios de aceite
Prefixo `DAE`; ID antigo entre parênteses. Provisórios.
- **DAE-1** (AAS-18, UIA-9) Quando um diálogo com NPC abre e existe retrato, o DialogueModal deve exibir o retrato; sem o arquivo, o ícone atual (provisório).
- **DAE-2** (AAS-19, UIA-10) Quando o jogador equipa armadura ou arma, o renderizador do jogador deve exibir a camada correspondente (provisório; só se a decisão 3 for A).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| DAE-1 | Teste de componente do DialogueModal com e sem retrato |
| DAE-2 | Manual: equipar e olhar o sprite (não validado, precisa de playtest humano) |
| Legibilidade mobile e coesão visual entre sprites por bioma | Não validado: precisa de playtest humano em celular |

## Questões em aberto
- **Q10 do original:** orçamento de arte e direção artística (decisão de negócio) inexistentes; arte e BGM externas versus [pipeline de arte com IA](feature-assets-pipeline-geracao-de-prompt.md): qual caminho vale.

## Pendências para promover a backlog
- Discovery: depende de decisão de produto (orçamento de arte, direção artística); sem aprovação do responsável.
- Aprovar as decisões 1 a 5 e os ADRs 0010 e 0013 (Propostos); fechar a Q10.
- Trocar "proposta" por valores aprovados (paleta) e fixar o escopo visual aprovado por categoria.
- Spec [feature-assets-mapeamento-de-sprites](feature-assets-sprites-contrato-do-manifesto.md) aprovada e em `backlog/` (retomada da produção de arte).

## Referências
- [Mapeamento de sprites](feature-assets-sprites-contrato-do-manifesto.md), [pipeline de arte com IA](feature-assets-pipeline-geracao-de-prompt.md), [evolução gráfica](feature-grafico-efeitos-restantes.md)
- [asset-scripts](../../operations/asset-scripts.md), [lighting-and-effects](../../gameplay/lighting-and-effects.md), [bestiário](../../gameplay/enemies-and-bestiary.md)
