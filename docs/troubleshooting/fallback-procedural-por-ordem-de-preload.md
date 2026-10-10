# Cena de UI sempre mostra o fallback procedural, mesmo com o asset íntegro

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `src/game/scenes/TitleScene.ts` (`preload`/`create`), `SettingsScene.ts`, `RecordsScene.ts`

## Sintoma
`TitleScene`, `SettingsScene` ou `RecordsScene` exibem os placeholders geométricos dourados, e `file src/assets/ui/*` mostra arquivos válidos. Não há erro de carregamento.

## Causa raiz
Se `generateUITextures(this)` (sem filtro de chaves) rodar no `preload()`, as texturas procedurais ocupam as chaves (`altar`, `uiCorner`, ...) antes do `load.image`. O Phaser não sobrescreve uma chave de textura já existente, então o asset real nunca entra: o fallback vence por ordem de execução, não por falha de carga. O comentário em `TitleScene.preload()` registra essa mecânica; o comportamento do Phaser instalado não foi reverificado nesta data (`node_modules` ausente).

## Solução
Em cada cena:
1. `preload()`: importar a arte via Vite (`import altarUrl from "../../assets/ui/altar.png"`) e enfileirar com `this.load.image(chave, url)`; registrar `this.load.on("loaderror", ...)` com `logger.warn("ASSET_LOADER", ...)`. Nunca chamar `generateUITextures(this)` sem filtro aqui.
2. `create()`: `const missingKeys = uiKeys.filter(k => !this.textures.exists(k))` e `generateUITextures(this, missingKeys)` só para as chaves que não carregaram.

Atenção: caminhos literais `"/assets/ui/x.png"` apontam para `public/assets/ui/`, que não existe; a arte de UI vive em `src/assets/ui/` e só é resolvida via `import`.

## Como verificar
```bash
grep -n "generateUITextures" src/game/scenes/TitleScene.ts src/game/scenes/SettingsScene.ts src/game/scenes/RecordsScene.ts
```
As únicas chamadas devem estar em `create()` e com o argumento `missingKeys`. Manual: abrir o menu com os assets íntegros; o console não deve ter `WARN [ASSET_LOADER] ... usando fallback procedural`.
