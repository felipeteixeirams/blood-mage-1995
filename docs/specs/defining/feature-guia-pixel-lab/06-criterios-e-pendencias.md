# Guia para Pixel Lab (parte 6: critérios e pendências)

**Mestre:** [feature-guia-pixel-lab](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): só jogador, baú e UI têm arte física; inimigos, NPCs, `spr_portal`, `spr_skeleton_remains` e tiles do guia não existem como arquivo e seguem procedurais. Detalhe na [parte 1](01-config-e-jogador.md).

Parte 6 de 6. Índice: [README](README.md).

## Critérios de aceite
Descrevem as entregas de arte (arquivo, dimensões, chave no manifesto, `verify-assets`), não o texto dos prompts. Todos provisórios: dependem da aprovação do responsável e da decisão 1 da [parte 1](01-config-e-jogador.md).

- **PL-1** Quando a arte de um dos 11 inimigos do guia é entregue, o repositório deve conter o PNG no `path` que o `assetManifest.json` declara para a chave correspondente (provisório).
- **PL-2** Quando a arte de um inimigo é entregue, o PNG deve ter largura e altura múltiplas de `frameWidth` e `frameHeight` da chave no `assetManifest.json` (provisório; valores: decisão 2).
- **PL-3** Se um PNG entregue tem assinatura inválida, está vazio ou tem dimensões IHDR inválidas, então o verify-assets deve terminar com erro (provisório).
- **PL-4** Se um spritesheet com `required: true` tem grade incompatível com `frameWidth`/`frameHeight`, então o verify-assets deve terminar com erro (provisório).
- **PL-5** Enquanto o PNG de uma chave não está commitado, o `assetManifest.json` deve manter `required: false` para ela (provisório).
- **PL-6** Quando o PNG de uma chave está commitado e `pnpm run verify` passa, o `assetManifest.json` pode marcar `required: true` para ela (provisório).
- **PL-7** Se o PNG de uma chave `required: false` está ausente, então o jogo deve iniciar usando a textura procedural, sem erro de carregamento (provisório).
- **PL-8** Quando a arte de um dos 4 NPCs do guia é entregue, o `assetManifest.json` deve declarar a chave `spr_npc_*` com o caminho da decisão 6 e o PNG deve existir nele (provisório).
- **PL-9** Quando a arte de `spr_portal` ou `spr_skeleton_remains` é entregue, o `assetManifest.json` deve declarar a chave com o caminho da decisão 6 (provisório).
- **PL-10** Quando um tile do guia é entregue, o `assetManifest.json` deve declarar o tile na chave definida pelo mapeamento da decisão 7 (provisório).
- **PL-11** Onde a skin `spr_bloodmage_hoodless` é aprovada (decisão 5), o `assetManifest.json` deve declarar a chave `spr_bloodmage_hoodless` com células do mesmo tamanho de `spr_bloodmage` (provisório).
- **PL-12** Se o spritesheet do jogador é regenerado, então `scripts/build_bloodmage_spritesheet.cjs` deve ser a origem e o arquivo deve manter 544x1156 (8 colunas x 17 linhas de células 68x68) sob a chave `spr_bloodmage` (provisório).
- **PL-13** Se o baú é substituído (decisão 8), então as 8 direções fechado e aberto do manifesto devem permanecer com `required: true` e `pnpm run verify` deve passar (provisório).
- **PL-14** Todo PNG entregue deve ter canal alpha (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PL-1, PL-8, PL-9, PL-10, PL-11 | Revisão do diff: caminho do manifesto x arquivo; `ls` dos diretórios; `file <png>` confere o header |
| PL-2 | `pnpm run verify` (aviso de grade para spritesheet não `required`; erro para `required`) e leitura de IHDR do PNG |
| PL-3 | Teste manual: PNG com header corrompido numa cópia temporária; `node scripts/verify-assets.cjs` deve sair com erro (comportamento já existente) |
| PL-4 | Idem, com spritesheet `required: true` de grade errada numa cópia temporária |
| PL-5, PL-6 | Revisão do diff do `assetManifest.json` e `pnpm run verify` |
| PL-7 | Smoke: `pnpm run build` e carga do jogo sem o PNG (não validado nesta sessão) |
| PL-12 | `file` e IHDR de `bloodmage.png`; `pnpm run verify` |
| PL-13 | `pnpm run verify` |
| PL-14 | Leitura do `colorType` do IHDR (6 ou 4) |
| Identidade visual e coesão entre sprites | Não validado: precisa de revisão visual humana, em jogo, por bioma |

## Questões em aberto
1. Tamanho de geração x célula do manifesto (decisão 2).
2. Layout de frames de cada spritesheet de inimigo (colunas, linhas, direções, animações) e como `Enemy.ts` consome os frames: a spec original não define; não verificado.
3. Caminhos e chaves de NPCs, props e tiles (decisão 6) e mapeamento dos tiles (decisão 7).
4. Os campos do Pixel Lab usados para tiles e props (`Character Type: Humanoid`, `Top-down (flat)`, `No outline`) e a disponibilidade de `64px`, `Pro` e `Standard` no plano em uso: fato externo não verificado (fonte: UI ou documentação do Pixel Lab).
5. Custo em créditos por geração e saldo (`node scripts/pixellab_client.cjs balance`): não verificado.
6. Origem do `chest.png` atual (Pixel Lab ou procedural) para decidir a substituição (decisão 8).
7. `spr_npc_maelen` e sua descrição visual (decisão 10).
8. Animação de `spr_portal` e de props (o guia gera imagem estática): precisa de definição.
9. Licença e uso comercial das saídas do Pixel Lab: não verificado (decisão de negócio do responsável).

## Pendências para promover a backlog
- Aprovação do responsável (cabeçalho) e decisões 1 a 10 da [parte 1](01-config-e-jogador.md).
- Spec [feature-mapeamento-de-sprites.md](../feature-mapeamento-de-sprites.md) aprovada e em `backlog/` (retomada da produção de arte).
- Questões 1 a 9 respondidas; fatos externos 4, 5 e 9 verificados.
- Dividir por categoria (inimigos, NPCs e props, tiles) para caber como unidade implementável; o guia é material de referência de produção, não código.
- Confirmar com o responsável se o guia deve virar spec de implementação ou ir para `docs/operations/`.

## Referências
- [Mapeamento de sprites](../feature-mapeamento-de-sprites.md), [pipeline de arte com IA](../discovery-pipeline-de-arte-com-ia.md)
- [Scripts de assets](../../../operations/asset-scripts.md), [bestiário](../../../gameplay/enemies-and-bestiary.md)
- `scripts/pixellab_client.cjs`, `scripts/verify-assets.cjs`, `src/game/assets/assetManifest.json`
- Skill `spritecook-integration`
