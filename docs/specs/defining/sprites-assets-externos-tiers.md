# Discovery: Eixo B — Pipeline de Integração de Assets Externos

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática): parcial. Existe: manifesto de assets (`src/game/assets/assetManifest.json` + `assetManifest.ts`, com `queueAssetLoading` chamado em `BootScene.preload`), fallback procedural por chave (`generateGameTextures(this, { force: false })` em `BootScene.create`, só gera se `textures.exists(key)` é falso, via `src/utils/textureGenerator.ts`), flag `required` (a chave que falha com `required: true` vira `logger.error`) validada por `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (cabeçalhos binários), normal maps gerados proceduralmente (`generateNormalMap` em `textureGenerator.ts`), animações 8-direcionais do jogador (`bloodmage.png` 68x68). Não existe: `AssetLoader` com `getTexture`/`loadScene`, `src/assets/definitions.ts`, `sceneManifest`/lazy-loading por cena (o `BootScene` enfileira o manifesto inteiro), carga de atlas JSON, uso do campo `normalMapPath` (declarado em `assetManifest.ts`, sem nenhum consumidor), reporte do loader ao Sentry (o loader só usa `logger`; `Sentry.init` está em `src/main.tsx`), compressão `pngquant`/`cwebp` e CI (`.github/workflows` ausente, `scripts/validate-atlas*` ausente), documentação para artistas. Nenhum asset externo de inimigo, NPC ou tile existe (`public/assets/sprites/enemies` e `public/assets/tilesets` só têm `.gitkeep`). `Enemy.ts` já aplica glow de elite (`applyEliteGlow`); a aura geral de inimigo (item A.2) segue não implementada.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Arquitetura de chaves de ativos com substituição e fallback procedural.
2. Formatos recomendados (PNG/WebP, atlas JSON), ferramentas e CI de compressão.
3. Estimativas de esforço e roadmap de 3 fases.
4. Dependências: orçamento de arte e direção artística (decisão de negócio).
5. Adiamento da aura de inimigo até haver atlas com normais e blend aditivo.

---

## Objetivo (proposta)

Integrar arte externa (spritesheets, texturas, animações) de forma não destrutiva: mesma chave para arte externa e procedural, fallback procedural sempre funcional, substituição incremental por chave, sem queda de performance e agnóstico à origem da arte.

## O que já cobre parte do objetivo

| Item | Onde |
|---|---|
| Chave única + fallback procedural | `assetManifest.json`, `queueAssetLoading`, `generateGameTextures(..., { force: false })` |
| Distinção "planejado" vs "obrigatório" | campo `required`; `scripts/verify-assets.cjs` falha o build se um obrigatório faltar ou estiver corrompido |
| Integridade binária | `assetIntegrity.test.ts`, `verify-assets.cjs` (png, jpg, gif, webp, woff2, ogg, mp3) |
| Animações 8-direcionais do jogador | spritesheet 68x68 carregada como `spr_bloodmage` |

## Pendências (design proposto, não implementado)

1. **Carregamento por cena.** Hoje `BootScene` carrega todo o manifesto. Proposta: mapa cena -> chaves (`SCENE_ASSET_MANIFEST`) e `loadScene` com lazy-loading, para reduzir o pacote inicial.
2. **Atlas e normal maps externos.** Suportar atlas JSON e consumir `normalMapPath` (campo existente, sem uso), preservando o fallback.
3. **Telemetria de falha de asset.** Enviar `loaderror` ao Sentry (hoje só `logger`).
4. **Compressão e CI.** `pngquant` (PNG) e `cwebp` (texturas de fundo) e validação de atlas em CI, se o responsável aprovar CI.
5. **Documentação para artistas.** Como exportar e nomear assets por chave (`docs/` ainda não tem guia).
6. **Aura de inimigo (A.2).** Adiada: aplicar glow colorido sobre sprites planares sem atlas com normais e blend aditivo gera sobreposição e poluição visual (violeta para mágicos, vermelho para sangue, laranja para infernais). Só depois de haver atlas com normais.

## Formatos e ferramentas (propostas)

| Uso | Proposta |
|---|---|
| Sprites com transparência | PNG (paleta reduzida com `pngquant`) ou WebP; atlas JSON para múltiplos sprites |
| Texturas de fundo | WebP (fallback JPG) |
| Animações simples | Spritesheet + JSON (nativo do Phaser) |
| Geração/atlas/normais | Aseprite ou LibreSprite, TexturePacker ou Shoebox, Laigter |

## Critérios de aceite (provisórios)

Sem aprovação do responsável; critérios EARS a escrever. Metas propostas: fallback procedural para 100% das chaves; lazy-loading por cena reduz o pacote inicial (meta numérica a definir); sem queda de FPS com normal maps; decisão pré-carregamento vs streaming; documentação para artistas.

## Riscos

| Risco | Mitigação proposta |
|---|---|
| Draw calls aumentam | Atlas; medir com o monitor de performance existente |
| Fallback procedural lento | Cache; pré-gerar texturas pesadas |
| Exportação incorreta pelo artista | Validação de schema e documentação |
| Pacote inicial cresce | Lazy-loading por cena; compressão |

## Condição para iniciar (proposta)

Orçamento de arte aprovado, direção artística definida e primeiro lote de sprites pronto. A infraestrutura (itens 1 a 4) pode ser feita antes, testando só com fallback.
