# Discovery: pipeline de integração de assets externos

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: manifesto `src/game/assets/assetManifest.json` + `assetManifest.ts` (`queueAssetLoading`, chamado em `BootScene.preload`, enfileira o manifesto inteiro; 1 spritesheet do jogador e as imagens do baú com `required: true`; inimigos, projéteis, itens e tiles listados com `required: false`, sem arquivo em `public/`), fallback procedural por chave (`generateGameTextures(this, { force: false })` em `BootScene.create`, que só gera se `textures.exists(key)` é falso), `loaderror` tratado só com `logger` (também em `TitleScene`, `SettingsScene`, `RecordsScene`), `generateNormalMap` em `src/utils/textureGenerator.ts` (normal maps procedurais), `scripts/verify-assets.cjs` e `src/game/assets/assetIntegrity.test.ts` (cabeçalhos binários). Falta: `AssetLoader` com `loadScene`, mapa cena -> chaves, carga de atlas JSON, consumidor do campo `normalMapPath` (declarado, sem uso), reporte de falha de asset ao Sentry (`Sentry.init` só em `src/main.tsx`), compressão `pngquant`/`cwebp`, CI (`.github/` ausente), guia para artistas. Aura de inimigo (A.2) não implementada (`Enemy.applyEliteGlow` cobre só elites).

## Contexto
- Quem decide o que entra no jogo em arte e áudio e o orçamento de bytes é [discovery-ui-e-assets-externos](discovery-ui-e-assets-externos/README.md) (UIA). Esta spec trata só da **infraestrutura de carga** dos assets de imagem do Phaser.
- Divisão entre as duas specs (sem duplicar):

| Assunto | Dona | A outra spec faz |
|---|---|---|
| `AssetLoader`/manifesto por cena, lazy-loading, atlas, `normalMapPath` | esta (AES) | UIA só cita |
| Telemetria de `loaderror` de imagem/spritesheet | esta (AES) | UIA cobre só a falha do áudio físico |
| Compressão (`pngquant`, WebP), CI e guia do artista | esta (AES) | UIA define apenas os limites (256 cores, qualidade 80) |
| Orçamento (2,5 MB inicial, resoluções máximas), direção artística, 9-slice, áudio, licenças | UIA | esta consome os limites de UIA |

- O fallback procedural por chave já existe e é preservado; o loader novo não pode removê-lo.

## Objetivo
Se aprovada, arte externa entra por chave, sem quebrar o fallback procedural, carregando por cena e reportando falhas, sem perder FPS.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance e bundle (referência para "sem queda de FPS" e pacote inicial) | Proposta |
| [0010](../../decisions/0010-canais-de-distribuicao.md) | Canais (PWA, TWA, Steam) que definem cache e formatos aceitos | Proposta |
| [0008](../../decisions/0008-endpoint-api-log.md) | Endpoint `/api/log` usado pelo `logger` (canal de telemetria já existente) | Aprovada |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `BootScene` enfileira o manifesto inteiro e depois gera texturas com `force: false` | `src/game/scenes/BootScene.ts` (linhas 72 e 77) | 2026-10-11 |
| `loaderror` só chama `logger` (`error` se `required`, `debug` se planejado) | `src/game/assets/assetManifest.ts` | 2026-10-11 |
| `normalMapPath` existe no tipo e nenhum código o lê | `src/game/assets/assetManifest.ts` (tipo) e busca em `src/` | 2026-10-11 |
| Tipos do manifesto: `image`, `spritesheet`, `audio`; não há `atlas` | `src/game/assets/assetManifest.ts` | 2026-10-11 |
| `public/assets/sprites/enemies`, `projectiles` e `public/assets/tilesets` estão vazios | listagem de `public/assets` | 2026-10-11 |
| `.github/workflows` e scripts `pngquant`/`cwebp` não existem | listagem de `scripts/`, ausência de `.github/` | 2026-10-11 |
| CSP libera `connect-src` só para `'self'` e Sentry | `vercel.json` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Carga por cena | A) manter tudo no Boot; B) `SCENE_ASSET_MANIFEST` com `loadScene` | B só quando houver arte externa que pese; antes disso A |
| 2 | Atlas JSON e `normalMapPath` | A) só imagens soltas; B) atlas + normal map externo | B por chave, com fallback procedural preservado |
| 3 | Destino da telemetria de falha | A) só `logger`; B) `logger` + Sentry | B, mesmo DSN opcional de `main.tsx` |
| 4 | Compressão no CI | A) script manual; B) CI com validação | A agora; B exige aprovar CI (não existe) |
| 5 | Aura de inimigo (A.2) | A) adiar até haver atlas com normais e blend aditivo; B) fazer agora | A: glow sobre sprite plano polui a tela |
| 6 | Formatos (PNG/WebP/atlas) | A) PNG com `pngquant`; B) WebP quando compatível | A para sprites, B para fundos; confirmar com UIA |

## Escopo
Se aprovado:
- Mapa cena -> chaves e `loadScene` com carga sob demanda, mantendo o manifesto como fonte de verdade.
- Tipo `atlas` no manifesto e consumo de `normalMapPath`, com fallback procedural por chave.
- Reporte de `loaderror` ao Sentry, com tags de chave e tipo.
- Script de compressão (`pngquant` para PNG, `cwebp` para fundos) e validação de atlas (CI só se aprovado).
- Guia para artistas (exportação e nome por chave) em `docs/`.

## Fora de escopo
- Orçamento de bytes, resoluções, direção artística, 9-slice, áudio e licenças (UIA).
- Produção de arte; aura de inimigo (decisão 5); mudar a chave de texturas existentes.

## Arquivos e contratos
- Alterar: `src/game/assets/assetManifest.ts`, `assetManifest.json`, `src/game/scenes/BootScene.ts`, `scripts/verify-assets.cjs` e `assetIntegrity.test.ts`; criar o script de compressão em `scripts/` e o guia em `docs/`.
- Atualizar no mesmo commit: `docs/operations/asset-scripts.md` e `docs/engineering/performance.md`.
- Não tocar: `textureGenerator.ts` (a chave e o fallback continuam como estão), `soundEngine.ts`.
- Contrato: uma chave por textura; asset externo e procedural usam a mesma chave; asset `required: true` ausente falha `pnpm run verify`.

## Critérios de aceite
- **AES-1** Quando um asset externo de chave K existe e carrega, o BootScene deve usar a textura externa sob a chave K (provisório).
- **AES-2** Se o arquivo de uma chave não carrega, então o BootScene deve gerar a textura procedural sob a mesma chave (provisório).
- **AES-3** Quando o jogo entra em uma cena, o AssetLoader deve carregar apenas as chaves mapeadas a essa cena que ainda não estão em cache (provisório).
- **AES-4** Se uma chave de cena não carrega, então o AssetLoader deve prosseguir com o fallback procedural sem travar a transição (provisório).
- **AES-5** Onde uma entrada do manifesto declara `normalMapPath`, o loader deve associar o normal map externo à textura; sem o arquivo, o `generateNormalMap` procedural continua valendo (provisório).
- **AES-6** Quando um `loaderror` ocorre e o Sentry está inicializado, o AssetLoader deve enviar a chave, o tipo e a URL ao Sentry (provisório).
- **AES-7** Se o Sentry não está inicializado (sem `VITE_SENTRY_DSN`), então o AssetLoader deve registrar a falha só no `logger` sem lançar erro (provisório).
- **AES-8** Se um asset `required: true` falta ou está corrompido, então o `verify-assets` deve falhar com a chave no erro (provisório).
- **AES-9** O script de compressão deve produzir PNGs de até 256 cores a partir de entradas coloridas (provisório; limite vem de UIA).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| AES-1, AES-2 | Teste unitário do manifesto com cena simulada; manual: apagar `spr_chest` temporariamente e abrir o jogo (não validado) |
| AES-3, AES-4 | Teste unitário do AssetLoader (novo) com mapa e falha simulada |
| AES-5 | Teste unitário de `textureGenerator`/loader com e sem `normalMapPath` |
| AES-6, AES-7 | Teste unitário com mock de `@sentry/react` |
| AES-8 | `pnpm run verify` com arquivo `required` removido; `assetIntegrity.test.ts` |
| AES-9 | Rodar o script sobre uma imagem de teste e contar a paleta |
| Sem queda de FPS | Não validado: precisa de playtest humano (`?perf`) |

## Questões em aberto
- Meta numérica de redução do pacote inicial com lazy-loading (hoje não medido).
- Pré-carregar versus transmitir (streaming) por cena.
- Aprovação de CI e escolha da ferramenta (TexturePacker, Shoebox, Laigter são só sugestões).
- Estimativa de esforço e roadmap de 3 fases do original não foram verificados.
- Padrões de cache PWA: `globPatterns` em `vite.config.ts` não inclui `webp`, `json` nem `ogg`.

## Pendências para promover a backlog
- Discovery: depende de decisão de produto (orçamento de arte e direção artística, hoje inexistentes).
- Aprovação do responsável e das decisões 1 a 6.
- ADR 0013 aprovado (metas de performance).
- Fechar as questões em aberto e aprovar a divisão com UIA.

## Referências
- [Assets (UI e externos)](discovery-ui-e-assets-externos/README.md), [Evolução gráfica](discovery-evolucao-grafica-avancada/README.md) (Eixo B)
- [asset-scripts](../../operations/asset-scripts.md), [performance](../../engineering/performance.md), [lighting-and-effects](../../gameplay/lighting-and-effects.md)
