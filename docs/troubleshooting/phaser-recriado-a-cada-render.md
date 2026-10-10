# Game Phaser recriado a cada render do React (FPS cai, áudio duplicado)

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `src/game/PhaserGame.tsx` (`useEffect` de criação com `[]`), `src/components/MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`

## Sintoma
FPS cai gradualmente no menu, efeitos duplicados, vários canvases/`Phaser.Game` no DOM.

## Causa raiz
Se o `useEffect` que faz `new Phaser.Game(...)` listar callbacks de props (`onStartGame`, `onOpenSettings`, ...) nas dependências, cada re-render com callback novo destrói e recria a engine.

## Solução
- O `useEffect` de criação tem dependências `[]` e destrói o jogo no cleanup (`game.destroy(true)`).
- Callbacks e dados dinâmicos vão para `game.registry.set(...)` no momento da criação e são atualizados por um segundo `useEffect` leve que depende das props (`MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`; `PhaserGame.tsx` usa efeitos separados por comando).

## Como verificar
Manual: abrir o menu, alternar modais e props algumas vezes e contar `document.querySelectorAll('canvas')` (um por jogo montado). Estático: o array de dependências do efeito que contém `new Phaser.Game` deve ser `[]`.
