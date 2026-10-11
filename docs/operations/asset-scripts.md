# Scripts de Arte, Sprites e Áudio

**Mestre:** [operations](README.md)
**Status:** não verificado (nenhum script foi executado; leitura do código e busca de referências)
**Verificado em:** —

Scripts de `scripts/` que geram ou importam assets. Todos são manuais, exceto `render_bgm_samples.cjs` (`npm run audio:render`). Scripts de build e verificação: [build-scripts.md](build-scripts.md). Regras de binários e spritesheet: `CLAUDE.md` e [../troubleshooting/spritesheet-jogador-celulas-48-vs-68.md](../troubleshooting/spritesheet-jogador-celulas-48-vs-68.md).

| Script | O que faz | Entradas | Saídas | Quem chama | Em uso? (evidência) | Efeitos / segredos |
|---|---|---|---|---|---|---|
| `build_bloodmage_spritesheet.cjs [pasta]` | Monta o spritesheet do jogador a partir do export do PixelLab: grade 8x17 de células 68x68 (544x1156): linha 0 idle, 1-8 walk, 9-16 cast (cast opcional) | `sprites_importados/blood_mage_v2` (padrão) com `Idle/rotations`, `Idle/animations/Walking`, `casting_a_fireball` | `public/assets/sprites/player/bloodmage.png` | Manual | Origem oficial segundo `CLAUDE.md`; `sprites_importados/` não existe no checkout (gitignored), então rodar exige reimportar | Sobrescreve o PNG do jogador; exit 1 em erro |
| `generate_bloodmage_spritesheet.cjs` | Gera spritesheet procedural (pixels em código): 8 colunas x 9 linhas de 68x68 (544x612) | Nenhuma | `public/assets/sprites/player/bloodmage.png` | Manual | Só emergência (`CLAUDE.md`); layout (9 linhas) difere do script oficial (17 linhas) | Sobrescreve o PNG do jogador |
| `stitch_pixellab_bloodmage.cjs` | Costura idle + walk do PixelLab em 8x9 de células 48x48 (384x432) | `sprites_importados/blood_mage/Idle` (relativo ao cwd), dep. `pngjs` | `public/assets/sprites/player/bloodmage.png` | Manual | Provavelmente legado: células 48 contra 68 do script oficial; sem referência em `package.json` | Sobrescreve o PNG do jogador. Suspeito: mesmo destino com grade incompatível |
| `pixellab_client.cjs` | Cliente do PixelLab: `balance`, `list`, `get <id>`, `download <id> [dir]`, `create-character --description --directions`, `animate --character-id --template` | `process.argv`; chama `https://api.pixellab.ai/mcp` | Download em `sprites_importados/<id>` (padrão), extraído via `child_process` | Manual; citado em `.gitignore` como forma de recriar `sprites_importados/` | Sim (referência em `.gitignore`); execução não verificada | Variável `PIXELLAB_API_KEY`. **Suspeito:** há um token padrão (`DEFAULT_TOKEN`) escrito no arquivo, usado quando a variável falta; criar personagem e animar consomem créditos |
| `fetch-spritecook-sprite.cjs` | Gera sprite no SpriteCook e baixa o PNG (buffer binário) | `--prompt`, `--output`, `--type` (padrão `sprite`); `https://api.spritecook.ai/v1/api/generate-sync` | Arquivo em `--output` (ex.: `public/assets/sprites/enemies/...`) | Manual; citado em `skills/spritecook-integration/SKILL.md` | Sim (skill do repositório); execução não verificada | Variável `SPRITECOOK_API_KEY`; consome créditos |
| `generate_chest_assets.cjs` | Desenha o baú proceduralmente (48x48): um mestre e 8 direções | Nenhuma (dep. `pngjs`) | `public/assets/sprites/items/chest.png` e `items/chest/<direção>.png` (8 arquivos) | Manual | Sem referência fora do arquivo; não verificado se os PNGs atuais vêm dele | Sobrescreve os PNGs do baú; usa `process.cwd()` |
| `generate_pwa_icons.cjs` | Desenha ícones PWA proceduralmente | Nenhuma (dep. `pngjs`) | `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png` | Manual | Os ícones existem em `public/`; não verificado se vêm do script | Sobrescreve os ícones; usa `process.cwd()` |
| `generate_animated_gifs.cjs` | Cria GIFs animados do jogador (walk e cast por 8 direções, `idle_turntable.gif`, `bloodmage_showcase.gif`) | `sprites_importados/blood_mage/Idle` (relativo ao script) | `public/assets/sprites/player/animated/*.gif` | Manual | Os GIFs existem em `public/assets/sprites/player/animated/` | Executa `convert` (ImageMagick) via `execSync`; ausente = falha. Direções sem frames só avisam |
| `render_bgm_samples.cjs` | Renderiza offline as trilhas procedurais em WAV 16 bits, 44,1 kHz | Nenhuma | `public/audio_samples/`: `catacombs_floor1.wav`, `sanctuary_floor3.wav`, `boss_plutonia.wav`, `catacombs_muffled_inventory.wav`, `boss_panic_low_hp.wav` | `package.json` `audio:render` | Sim (`package.json`); os 5 WAVs existem | Sobrescreve os WAVs. O comentário do cabeçalho cita `catacombs_muffled.wav`, mas o `id` no código é `catacombs_muffled_inventory.wav` |

## Pontos a saber

- Os três geradores de `bloodmage.png` escrevem no mesmo caminho; o gate de grid está em `verify-assets.cjs` (ver [build-scripts.md](build-scripts.md)).
- `sprites_importados/` é gitignored e hoje ausente; `pixellab_client.cjs download` recria a pasta (comentário em `.gitignore`).
- `generate_chest_assets.cjs`, `generate_pwa_icons.cjs` e `stitch_pixellab_bloodmage.cjs` usam `process.cwd()`: rodar da raiz do repositório.

## Onde fica no código

`scripts/*.cjs` listados acima, `public/assets/sprites/player/`, `public/assets/sprites/items/`, `public/audio_samples/`, `public/icon-*.png`, `.gitignore` (`sprites_importados/`), `skills/spritecook-integration/SKILL.md`.

Relacionados: [build-scripts.md](build-scripts.md), [../troubleshooting/spritesheet-jogador-celulas-48-vs-68.md](../troubleshooting/spritesheet-jogador-celulas-48-vs-68.md), [../troubleshooting/png-corrompido-utf8.md](../troubleshooting/png-corrompido-utf8.md)
