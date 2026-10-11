# Assets: entrega de arte do guia Pixel Lab

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** ADR 0013
**Origem:** dividida de discovery-assets-arte-ui-audio-e-sprites (critérios AAS-24..37, ex-PL-1..14 de feature-guia-pixel-lab, decisões 18 a 27 e fatos da parte 01), 2026-10-11
**Estado vs código:** verificado em 2026-10-11 (leitura estática): nenhum critério abaixo está implementado. Hoje só jogador, baú e UI têm arte física; inimigos, NPCs, `spr_portal`, `spr_skeleton_remains` e tiles seguem procedurais. `verify-assets` já falha por PNG inválido e por grade errada em `required` (base de ENT-3 e ENT-4).

## Contexto
O guia Pixel Lab (movido para [pixel-lab-config](../../operations/pixel-lab-config.md); prompts em `docs/operations/pixel-lab-*.md`) é material de referência em `docs/operations/`. Esta spec cobre só as **entregas** (arquivos, manifesto, verificação), não o texto de prompt. Os critérios dependem da decisão 18 e das decisões 19 a 27.

## Objetivo
Se aprovada, a arte de 11 inimigos, 4 NPCs, `spr_portal`, `spr_skeleton_remains` e tiles entra no repositório como PNG no caminho do manifesto, com grade compatível e canal alpha, sem quebrar o fallback procedural.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance (tamanhos de frame) | Proposta |

Também: decisões 9 (tamanhos) em [orçamento](discovery-assets-orcamento-licencas-e-creditos.md) e 1 e 5 em [direção artística](discovery-assets-direcao-artistica-e-escopo-visual.md).

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `bloodmage.png` mede 544x1156 e o manifesto declara `spr_bloodmage` com células 68x68, `required: true` | `public/assets/sprites/player/bloodmage.png` (IHDR), `assetManifest.json` | 2026-10-11 |
| `build_bloodmage_spritesheet.cjs` gera grade 8x17 de células 68x68; `stitch_pixellab_bloodmage.cjs` monta outra grade de frames 48x48 (8x9) | `scripts/build_bloodmage_spritesheet.cjs`, `scripts/stitch_pixellab_bloodmage.cjs` | 2026-10-11 |
| `spr_portal` e `spr_skeleton_remains` são usados pelo código e não constam no manifesto; `spr_npc_maelen` é usado e não consta no guia Pixel Lab | `src/game/systems/DungeonFlowController.ts` (linhas 419, 729), `DungeonGenerator.ts` (linha 244), `assetManifest.json` | 2026-10-11 |
| `chest.png` mede 48x48 e `generate_chest_assets.cjs` desenha baú procedural 48x48; a origem do PNG atual não foi verificada | `public/assets/sprites/items/chest.png`, `scripts/generate_chest_assets.cjs` | 2026-10-11 |
| Nenhum código referencia `spr_bloodmage_hoodless` nem há seletor de skin | `src/` (grep `hoodless\|skin`) | 2026-10-11 |
| `public/assets/sprites/enemies`, `projectiles` e `public/assets/tilesets` estão vazios | listagem de `public/assets` | 2026-10-11 |
| `verify-assets` valida assinatura, tamanho e IHDR dos PNGs e, para spritesheet `required`, a grade contra `frameWidth`/`frameHeight`; grade errada em não `required` gera só aviso | `scripts/verify-assets.cjs` | 2026-10-11 |

## Decisões a confirmar
Numeração original (preservada).

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 18 | Retomar a produção de sprites físicos (ex-guia PL 1) | A) retomar; B) manter procedural | A, quando o responsável decidir |
| 19 | Tamanho de geração frente à célula do manifesto (ex-guia PL 2) | A) ajustar o manifesto à arte; B) redimensionar na montagem; C) gerar no tamanho do manifesto | A para os 11 inimigos: todos `required: false`, sem custo de migração |
| 20 | Contorno por categoria (ex-guia PL 3) | A) preto em inimigos e chefes, seletivo em NPCs e props; B) um só | A: legibilidade de combate no chão escuro |
| 21 | Modo de geração `Pro` ou `Standard` (ex-guia PL 4) | A) `Pro` só para jogador, cão, chefes e inimigos de 8 direções; B) `Pro` em tudo | A: custo de créditos não verificado |
| 22 | Skin `spr_bloodmage_hoodless` (ex-guia PL 5) | A) fora até haver sistema de skins; B) gerar agora | A: nada no código a consome |
| 23 | Chaves e caminhos de NPCs, props e tiles (ex-guia PL 6) | A) `assets/sprites/npcs/*.png`, `props/*.png`, `assets/tilesets/*.png`, chave igual ao nome do guia; B) outro | A: segue o padrão de `enemies/` e `tilesets/` |
| 24 | Tiles do guia frente às chaves existentes (ex-guia PL 7) | A) mapear para `tile_ground`, `tile_wall_brick` etc.; B) chaves novas | A: evita tiles paralelos sem consumidor |
| 25 | Baú: substituir a arte atual (ex-guia PL 8) | A) fora; B) substituir | A: já tem arte e `required: true` |
| 26 | Identidade visual de cada personagem, inimigo, NPC, prop e tile (ex-guia PL 9) | A) aprovar; B) revisar | A, após ver uma geração de teste de um inimigo |
| 27 | Incluir `spr_npc_maelen` no guia (ex-guia PL 10) | A) incluir; B) fora | A: único NPC com uso real |

## Escopo
Se aprovado:
- Entregar o PNG de cada um dos 11 inimigos, 4 NPCs, `spr_portal`, `spr_skeleton_remains` e tiles do guia no `path` do manifesto, com grade compatível e canal alpha.
- Declarar no `assetManifest.json` as chaves novas (NPCs, `spr_portal`, `spr_skeleton_remains`, tiles) conforme as decisões 23 e 24, `required: false` até o arquivo estar commitado e `pnpm run verify` passar.
- Skin `spr_bloodmage_hoodless` só se a decisão 22 for B; baú só se a decisão 25 for B.

## Fora de escopo
- Texto dos prompts do guia Pixel Lab (ficam em `docs/operations/`); produção e escolha de pacotes de arte; carga por cena e atlas ([feature-assets-carga-atlas-e-normal-maps](feature-assets-carga-atlas-e-normal-maps.md)); orçamento e licenças ([discovery-assets-orcamento-licencas-e-creditos](discovery-assets-orcamento-licencas-e-creditos.md)).
- Mudar a mecânica de combate; mudar a chave de texturas existentes.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.json`; arte em `public/assets/sprites/enemies/`, `npcs/`, `props/` e `public/assets/tilesets/` (caminhos da decisão 23).
- Contrato: PNG no `path` do manifesto, `required: false` até o arquivo estar commitado e `pnpm run verify` passar; spritesheet do jogador só por `scripts/build_bloodmage_spritesheet.cjs` (544x1156, 8x17 de 68x68); binários nunca por ferramentas de texto (usar `Buffer`, `curl --output`, conferir com `file`).
- Não tocar: `scripts/generate_bloodmage_spritesheet.cjs` (procedural, só emergência).

## Critérios de aceite
Prefixo `ENT`; ID antigo entre parênteses. Provisórios.
- **ENT-1** (AAS-24, PL-1) Quando a arte de um dos 11 inimigos do guia é entregue, o repositório deve conter o PNG no `path` que o `assetManifest.json` declara para a chave correspondente (provisório).
- **ENT-2** (AAS-25, PL-2) Quando a arte de um inimigo é entregue, o PNG deve ter largura e altura múltiplas de `frameWidth` e `frameHeight` da chave no `assetManifest.json` (provisório; valores: decisão 19).
- **ENT-3** (AAS-26, PL-3) Se um PNG entregue tem assinatura inválida, está vazio ou tem dimensões IHDR inválidas, então o verify-assets deve terminar com erro (provisório).
- **ENT-4** (AAS-27, PL-4) Se um spritesheet com `required: true` tem grade incompatível com `frameWidth`/`frameHeight`, então o verify-assets deve terminar com erro (provisório).
- **ENT-5** (AAS-28, PL-5) Enquanto o PNG de uma chave não está commitado, o `assetManifest.json` deve manter `required: false` para ela (provisório).
- **ENT-6** (AAS-29, PL-6) Quando o PNG de uma chave está commitado e `pnpm run verify` passa, o `assetManifest.json` pode marcar `required: true` para ela (provisório).
- **ENT-7** (AAS-30, PL-7) Se o PNG de uma chave `required: false` está ausente, então o jogo deve iniciar usando a textura procedural, sem erro de carregamento (provisório).
- **ENT-8** (AAS-31, PL-8) Quando a arte de um dos 4 NPCs do guia é entregue, o `assetManifest.json` deve declarar a chave `spr_npc_*` com o caminho da decisão 23 e o PNG deve existir nele (provisório).
- **ENT-9** (AAS-32, PL-9) Quando a arte de `spr_portal` ou `spr_skeleton_remains` é entregue, o `assetManifest.json` deve declarar a chave com o caminho da decisão 23 (provisório).
- **ENT-10** (AAS-33, PL-10) Quando um tile do guia é entregue, o `assetManifest.json` deve declarar o tile na chave definida pelo mapeamento da decisão 24 (provisório).
- **ENT-11** (AAS-34, PL-11) Onde a skin `spr_bloodmage_hoodless` é aprovada (decisão 22), o `assetManifest.json` deve declarar a chave `spr_bloodmage_hoodless` com células do mesmo tamanho de `spr_bloodmage` (provisório).
- **ENT-12** (AAS-35, PL-12) Se o spritesheet do jogador é regenerado, então `scripts/build_bloodmage_spritesheet.cjs` deve ser a origem e o arquivo deve manter 544x1156 (8x17 células 68x68) sob a chave `spr_bloodmage` (provisório).
- **ENT-13** (AAS-36, PL-13) Se o baú é substituído (decisão 25), então as 8 direções fechado e aberto do manifesto devem permanecer `required: true` e `pnpm run verify` deve passar (provisório).
- **ENT-14** (AAS-37, PL-14) Todo PNG entregue deve ter canal alpha (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| ENT-1, ENT-8 a ENT-11 | Revisão do diff (caminho do manifesto x arquivo), `ls` dos diretórios, `file <png>` |
| ENT-2 | `pnpm run verify` (aviso de grade em não `required`; erro em `required`) e IHDR do PNG |
| ENT-3, ENT-4 | Cópia temporária com PNG corrompido ou grade errada; `node scripts/verify-assets.cjs` deve sair com erro (comportamento existente) |
| ENT-5, ENT-6 | Revisão do diff do `assetManifest.json` e `pnpm run verify` |
| ENT-7 | Smoke: `pnpm run build` e carga do jogo sem o PNG (não validado) |
| ENT-12 | `file` e IHDR de `bloodmage.png`; `pnpm run verify` |
| ENT-13 | `pnpm run verify` |
| ENT-14 | Leitura do `colorType` do IHDR (6 ou 4) |

## Questões em aberto
Numeração original entre parênteses.
1. (Q12) Conflito a reconciliar: o guia gera inimigos em 48 ou 64 px e as células do manifesto variam (32x40, 48x56...), enquanto o [orçamento](discovery-assets-orcamento-licencas-e-creditos.md) limita frames a 48x48/64x64 (128x128 para chefes); definir tamanhos finais juntos (decisões 9 e 19).
2. (Q13) Layout de frames de cada spritesheet de inimigo (colunas, linhas, direções, animações) e como `Enemy.ts` consome os frames: não definido nem verificado.
3. (Q14) Campos do Pixel Lab usados em tiles e props (`Character Type: Humanoid`, `Top-down (flat)`, `No outline`) e disponibilidade de `64px`, `Pro` e `Standard` no plano em uso: fato externo não verificado.
4. (Q15) Custo em créditos por geração e saldo (`node scripts/pixellab_client.cjs balance`): não verificado.
5. (Q16) Origem do `chest.png` atual (Pixel Lab ou procedural) para decidir a decisão 25.
6. (Q17) `spr_npc_maelen` e sua descrição visual (decisão 27).
7. (Q18) Animação de `spr_portal` e de props (o guia gera imagem estática): definir.
8. (Q19) Licença e uso comercial das saídas do Pixel Lab: não verificado (decisão de negócio).

## Pendências para promover a backlog
- Discovery: sem aprovação do responsável.
- Aprovar as decisões 18 a 27 e o ADR 0013 (Proposto); verificar os fatos externos (Q14, Q15, Q19).
- Fechar as questões 1 a 8 e definir tamanhos finais de frame.
- Spec [feature-assets-mapeamento-de-sprites](feature-assets-sprites-contrato-do-manifesto.md) aprovada e em `backlog/` (retomada da produção de arte).
- Dividir a entrega por categoria (inimigos, NPCs e props, tiles) ao promover, já que esta ainda cobre várias.
- Confirmar com o responsável o destino do guia Pixel Lab (material de referência em `docs/operations/`, não código).

## Referências
- Guia Pixel Lab ([pixel-lab-config](../../operations/pixel-lab-config.md)), [asset-scripts](../../operations/asset-scripts.md), [Mapeamento de sprites](feature-assets-sprites-contrato-do-manifesto.md), [pipeline de arte com IA](feature-assets-pipeline-geracao-de-prompt.md)
- `scripts/pixellab_client.cjs`, `scripts/verify-assets.cjs`, `src/game/assets/assetManifest.json`
