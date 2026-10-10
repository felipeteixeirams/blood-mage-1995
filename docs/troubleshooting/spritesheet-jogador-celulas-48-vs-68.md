# Spritesheet do jogador: frames idle 48x48 e walk 68x68 desalinhados

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `scripts/build_bloodmage_spritesheet.cjs` (`contentBounds`, `blit`, `DIRS`), `src/game/animations/animationManager.ts`, `src/game/assets/assetManifest.json` (`spr_bloodmage`)

## Sintoma
Personagem "pula" alguns pixels ao alternar entre parado e andando; ou anda virado para a direção errada.

## Causa raiz
O export do PixelLab não é homogêneo: `Idle/rotations/*.png` vêm em 48x48 e `Idle/animations/Walking/<dir>/frame_00N.png` em 68x68 (registrado no cabeçalho de `blit()`). Alinhar pela borda do arquivo desloca os pés entre idle e walk. A direção errada ocorre se a ordem das direções do montador diferir da usada pelos índices de frame em `animationManager.ts`.

## Solução
- `blit()` alinha pelo conteúdo: calcula a caixa dos pixels não transparentes (`contentBounds`), centraliza na célula 68x68 e ancora os pés a `BOTTOM_MARGIN` do fundo. As células ficam 68x68, então `assetManifest.json` (`frameWidth`/`frameHeight` 68) não muda.
- Ordem canônica das direções, igual no montador (`DIRS`) e nos índices de `animationManager.ts`: `south, south-east, east, north-east, north, north-west, west, south-west`. Layout: linha 0 idle (frames 0-7), linhas 1-8 walk (8-71), linhas 9-16 cast (72+).
- O montador recusa arquivo de origem corrompido (header PNG e `EF BF BD`); ver [png-corrompido-utf8](png-corrompido-utf8.md).

## Como verificar
```bash
node -e 'const b=require("fs").readFileSync("public/assets/sprites/player/bloodmage.png");console.log(b.readUInt32BE(16),b.readUInt32BE(20))'   # 544 1156 (8 colunas x 17 linhas de 68x68)
node scripts/verify-assets.cjs   # valida que as dimensões dividem frameWidth/frameHeight
```
Manual: no jogo, alternar parado/andando nas 8 direções; os pés não devem saltar e a direção do sprite deve bater com o movimento. O alinhamento por conteúdo não foi reconferido célula a célula (a pasta de origem `sprites_importados/` não está no repositório).
