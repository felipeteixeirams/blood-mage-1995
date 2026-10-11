# Assets de arte, UI, áudio e sprites: critérios e pendências (parte 6)

**Mestre:** [discovery-assets-arte-ui-audio-e-sprites](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Origem:** consolidada de discovery-assets-externos-e-sprites, discovery-ui-e-assets-externos (parte 6) e critérios PL-1 a PL-14 de feature-guia-pixel-lab (2026-10-11)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): nenhum critério abaixo está implementado. Hoje: som 100% sintetizado; `border-image` só no `DialogueModal.tsx`; sem tela de Créditos, sem verificação de orçamento, sem `AssetLoader`; só jogador, baú e UI têm arte física (inimigos, NPCs, `spr_portal`, `spr_skeleton_remains` e tiles seguem procedurais). `verify-assets` já falha por PNG inválido e por grade errada em `required` (base de AAS-26, AAS-27). Detalhes nas partes 1 a 5.

Parte 6 de 6. Índice: [README](README.md). Discovery: critérios provisórios, dependem de decisão de produto do responsável. IDs antigos entre parênteses.

## Critérios de aceite

### Carga, atlas e telemetria de imagem (parte 2)
- **AAS-1** (AES-1) Quando um asset externo de chave K existe e carrega, o BootScene deve usar a textura externa sob a chave K (provisório).
- **AAS-2** (AES-2) Se o arquivo de uma chave não carrega, então o BootScene deve gerar a textura procedural sob a mesma chave (provisório).
- **AAS-3** (AES-3) Quando o jogo entra em uma cena, o AssetLoader deve carregar apenas as chaves mapeadas a essa cena que ainda não estão em cache (provisório).
- **AAS-4** (AES-4) Se uma chave de cena não carrega, então o AssetLoader deve prosseguir com o fallback procedural sem travar a transição (provisório).
- **AAS-5** (AES-5) Onde uma entrada do manifesto declara `normalMapPath`, o loader deve associar o normal map externo à textura; sem o arquivo, o `generateNormalMap` procedural continua valendo (provisório).
- **AAS-6** (AES-6) Quando um `loaderror` ocorre e o Sentry está inicializado, o AssetLoader deve enviar a chave, o tipo e a URL ao Sentry (provisório).
- **AAS-7** (AES-7) Se o Sentry não está inicializado (sem `VITE_SENTRY_DSN`), então o AssetLoader deve registrar a falha só no `logger` sem lançar erro (provisório).
- **AAS-8** (AES-8) Se um asset `required: true` falta ou está corrompido, então o `verify-assets` deve falhar com a chave no erro (provisório).
- **AAS-9** (AES-9) O script de compressão deve produzir PNGs de até 256 cores a partir de entradas coloridas (provisório; limite da parte 5).

### UI, áudio, orçamento e licenças (partes 1, 3, 4, 5)
- **AAS-10** (UIA-1) Quando o InventoryModal é aberto, o InventoryModal deve renderizar a moldura do painel por `border-image` com o slice de 16 px (provisório).
- **AAS-11** (UIA-2) Se a imagem da moldura não carrega, então o painel React deve exibir a borda sólida de `.gothic-border` (provisório).
- **AAS-12** (UIA-3) Quando o jogador aciona o SFX de uma chave que tem arquivo físico, o soundEngine deve tocar o buffer do arquivo (provisório).
- **AAS-13** (UIA-4) Se o arquivo de SFX falta ou não decodifica, então o soundEngine deve executar a síntese da mesma chave (provisório).
- **AAS-14** (UIA-5) Se o arquivo de SFX falta ou não decodifica e o Sentry está inicializado, então o soundEngine deve enviar a chave ao Sentry (provisório).
- **AAS-15** (UIA-6) Enquanto o jogo está mudo, o soundEngine não deve emitir som de arquivo físico (provisório).
- **AAS-16** (UIA-7) Quando a trilha física de um tema existe, o soundEngine deve tocá-la em loop (provisório).
- **AAS-17** (UIA-8) Se a trilha física falha, então o bgmSynthesizer deve tocar o tema procedural (provisório).
- **AAS-18** (UIA-9) Quando um diálogo com NPC abre e existe retrato, o DialogueModal deve exibir o retrato; sem o arquivo, o ícone atual (provisório).
- **AAS-19** (UIA-10) Quando o jogador equipa armadura ou arma, o renderizador do jogador deve exibir a camada correspondente (provisório; só se a decisão 3 for A).
- **AAS-20** (UIA-11) Se um frame de spritesheet excede o tamanho máximo da parte 5, então o verify-assets deve falhar nomeando a chave (provisório).
- **AAS-21** (UIA-12) Se o pacote inicial do PWA excede 2,5 MB, então o verify-assets deve falhar (provisório; método de medição em aberto).
- **AAS-22** (UIA-13) Quando o jogador abre Créditos, a tela de Créditos deve listar autor, licença e fonte de cada asset CC-BY e OGA-BY (provisório).
- **AAS-23** (UIA-14) Se um asset externo não tem entrada no registro de origem, então o verify-assets deve falhar nomeando o arquivo (provisório).

### Entrega de arte (ex-guia Pixel Lab; entregas, não texto de prompt)
Dependem da decisão 18 e das decisões 19 a 27 (parte 1).
- **AAS-24** (PL-1) Quando a arte de um dos 11 inimigos do guia é entregue, o repositório deve conter o PNG no `path` que o `assetManifest.json` declara para a chave correspondente (provisório).
- **AAS-25** (PL-2) Quando a arte de um inimigo é entregue, o PNG deve ter largura e altura múltiplas de `frameWidth` e `frameHeight` da chave no `assetManifest.json` (provisório; valores: decisão 19).
- **AAS-26** (PL-3) Se um PNG entregue tem assinatura inválida, está vazio ou tem dimensões IHDR inválidas, então o verify-assets deve terminar com erro (provisório).
- **AAS-27** (PL-4) Se um spritesheet com `required: true` tem grade incompatível com `frameWidth`/`frameHeight`, então o verify-assets deve terminar com erro (provisório).
- **AAS-28** (PL-5) Enquanto o PNG de uma chave não está commitado, o `assetManifest.json` deve manter `required: false` para ela (provisório).
- **AAS-29** (PL-6) Quando o PNG de uma chave está commitado e `pnpm run verify` passa, o `assetManifest.json` pode marcar `required: true` para ela (provisório).
- **AAS-30** (PL-7) Se o PNG de uma chave `required: false` está ausente, então o jogo deve iniciar usando a textura procedural, sem erro de carregamento (provisório).
- **AAS-31** (PL-8) Quando a arte de um dos 4 NPCs do guia é entregue, o `assetManifest.json` deve declarar a chave `spr_npc_*` com o caminho da decisão 23 e o PNG deve existir nele (provisório).
- **AAS-32** (PL-9) Quando a arte de `spr_portal` ou `spr_skeleton_remains` é entregue, o `assetManifest.json` deve declarar a chave com o caminho da decisão 23 (provisório).
- **AAS-33** (PL-10) Quando um tile do guia é entregue, o `assetManifest.json` deve declarar o tile na chave definida pelo mapeamento da decisão 24 (provisório).
- **AAS-34** (PL-11) Onde a skin `spr_bloodmage_hoodless` é aprovada (decisão 22), o `assetManifest.json` deve declarar a chave `spr_bloodmage_hoodless` com células do mesmo tamanho de `spr_bloodmage` (provisório).
- **AAS-35** (PL-12) Se o spritesheet do jogador é regenerado, então `scripts/build_bloodmage_spritesheet.cjs` deve ser a origem e o arquivo deve manter 544x1156 (8x17 células 68x68) sob a chave `spr_bloodmage` (provisório).
- **AAS-36** (PL-13) Se o baú é substituído (decisão 25), então as 8 direções fechado e aberto do manifesto devem permanecer `required: true` e `pnpm run verify` deve passar (provisório).
- **AAS-37** (PL-14) Todo PNG entregue deve ter canal alpha (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| AAS-1, AAS-2 | Teste unitário do manifesto com cena simulada; manual: apagar `spr_chest` temporariamente e abrir o jogo (não validado) |
| AAS-3, AAS-4 | Teste unitário do AssetLoader (novo) com mapa e falha simulada |
| AAS-5 | Teste unitário de `textureGenerator`/loader com e sem `normalMapPath` |
| AAS-6, AAS-7 | Teste unitário com mock de `@sentry/react` |
| AAS-8 | `pnpm run verify` com arquivo `required` removido; `assetIntegrity.test.ts` |
| AAS-9 | Rodar o script sobre uma imagem de teste e contar a paleta |
| AAS-10, AAS-11 | Teste de componente do InventoryModal (classe aplicada); manual com a imagem removida (não validado) |
| AAS-12 a AAS-15 | Teste unitário em `src/utils/soundEngine.test.ts` com `AudioContext` e `fetch` simulados |
| AAS-16, AAS-17 | Teste unitário do soundEngine e do bgmSynthesizer; audição: não validado, precisa de playtest humano |
| AAS-18 | Teste de componente do DialogueModal com e sem retrato |
| AAS-19 | Manual: equipar e olhar o sprite (não validado, precisa de playtest humano) |
| AAS-20, AAS-21, AAS-23 | `pnpm run verify` com arquivo fora do limite ou sem registro |
| AAS-22 | Teste de componente da tela de Créditos |
| AAS-24, AAS-31 a AAS-34 | Revisão do diff (caminho do manifesto x arquivo), `ls` dos diretórios, `file <png>` |
| AAS-25 | `pnpm run verify` (aviso de grade em não `required`; erro em `required`) e IHDR do PNG |
| AAS-26, AAS-27 | Cópia temporária com PNG corrompido ou grade errada; `node scripts/verify-assets.cjs` deve sair com erro (comportamento existente) |
| AAS-28, AAS-29 | Revisão do diff do `assetManifest.json` e `pnpm run verify` |
| AAS-30 | Smoke: `pnpm run build` e carga do jogo sem o PNG (não validado) |
| AAS-35 | `file` e IHDR de `bloodmage.png`; `pnpm run verify` |
| AAS-36 | `pnpm run verify` |
| AAS-37 | Leitura do `colorType` do IHDR (6 ou 4) |
| Sem queda de FPS | Não validado: precisa de playtest humano (`?perf`) |
| Legibilidade mobile e coesão visual entre sprites por bioma | Não validado: precisa de playtest humano em celular |

## Questões em aberto
1. Como medir o "pacote inicial de 2,5 MB" (bytes transferidos, comprimidos ou no precache do PWA) e qual é o valor atual; meta numérica de redução com lazy-loading (hoje não medida).
2. Pré-carregar versus transmitir (streaming) por cena.
3. Aprovação de CI e escolha da ferramenta (TexturePacker, Shoebox, Laigter são só sugestões); custo de `pngquant`/WebP no build.
4. Estimativa de esforço e roadmap de 3 fases do original não verificados.
5. `globPatterns` do PWA em `vite.config.ts` não inclui `webp`, `json`, `mp3` nem `ogg`.
6. Alvo mínimo de toque dos botões com moldura nova.
7. Formato e local do registro de origem dos assets; local do componente de Créditos.
8. Cache negativo: se o arquivo de áudio falta, evitar nova tentativa de download a cada disparo.
9. Fontes e artistas citados (OpenGameArt, Itch.io, Surt) e suas licenças não verificados.
10. Orçamento de arte e direção artística (decisão de negócio) inexistentes; arte e BGM externas versus [pipeline de arte com IA](../discovery-assets-pipeline-de-arte-com-ia.md): qual caminho vale.
11. Conflito a reconciliar: AAS-6 envia chave, tipo e URL ao Sentry; AAS-14 (áudio) só a chave. Enviar tipo e URL também no áudio, com as mesmas tags `system: 'asset-loader'`?
12. Conflito a reconciliar: o guia gera inimigos em 48 ou 64 px e as células do manifesto variam (32x40, 48x56...), enquanto a parte 5 limita frames a 48x48/64x64 (128x128 para chefes); definir tamanhos finais juntos (decisões 9 e 19).
13. Layout de frames de cada spritesheet de inimigo (colunas, linhas, direções, animações) e como `Enemy.ts` consome os frames: não definido nem verificado.
14. Campos do Pixel Lab usados em tiles e props (`Character Type: Humanoid`, `Top-down (flat)`, `No outline`) e disponibilidade de `64px`, `Pro` e `Standard` no plano em uso: fato externo não verificado.
15. Custo em créditos por geração e saldo (`node scripts/pixellab_client.cjs balance`): não verificado.
16. Origem do `chest.png` atual (Pixel Lab ou procedural) para decidir a decisão 25.
17. `spr_npc_maelen` e sua descrição visual (decisão 27).
18. Animação de `spr_portal` e de props (o guia gera imagem estática): definir.
19. Licença e uso comercial das saídas do Pixel Lab: não verificado (decisão de negócio).

## Pendências para promover a backlog
- Discovery: depende de decisão de produto (orçamento de arte, direção artística); não há aprovação do responsável.
- Aprovar as decisões 1 a 27 e os ADRs 0006, 0010 e 0013 (0008 já aprovado).
- Fechar as questões 1 a 19 e trocar os limites "propostos" por valores aprovados; verificar os fatos externos (14, 15, 19).
- Spec [feature-assets-mapeamento-de-sprites](../feature-assets-mapeamento-de-sprites.md) aprovada e em `backlog/` (retomada da produção de arte).
- Dividir em specs implementáveis (infraestrutura de carga, 9-slice, áudio híbrido, créditos e licenças, entrega de arte por categoria: inimigos, NPCs e props, tiles); esta é um épico.
- Confirmar com o responsável o destino do guia Pixel Lab (material de referência em `docs/operations/`, não código).

## Referências
- [Mapeamento de sprites](../feature-assets-mapeamento-de-sprites.md), [pipeline de arte com IA](../discovery-assets-pipeline-de-arte-com-ia.md), [evolução gráfica](../discovery-grafico-evolucao-pendente.md), guia Pixel Lab ([pixel-lab-config](../../../operations/pixel-lab-config.md))
- [asset-scripts](../../../operations/asset-scripts.md), [Áudio](../../../gameplay/audio.md), [Modais e telas](../../../ui/modals-and-screens.md), [Performance](../../../engineering/performance.md)
- [ADR 0006](../../../decisions/0006-audio-e-conquistas.md), [0008](../../../decisions/0008-endpoint-api-log.md), [0010](../../../decisions/0010-canais-de-distribuicao.md), [0013](../../../decisions/0013-metas-de-performance.md)
- `scripts/pixellab_client.cjs`, `scripts/verify-assets.cjs`, `src/game/assets/assetManifest.json`
