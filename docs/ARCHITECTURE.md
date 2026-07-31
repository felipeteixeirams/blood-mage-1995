# Arquitetura do Sistema

## Visão Geral
O projeto é um híbrido de **React + Phaser 3**:
- O arquivo principal `App.tsx` atua como o controlador de cenas e interface.
- O componente `PhaserGame.tsx` inicializa o canvas e hospeda a `GameScene`.
- Toda a lógica de jogo (Colisões, IA, Projéteis, Loot) roda dentro do `GameScene.ts`.
- A HUD e os Modais (Level Up, Game Over, Pause) são implementados em React e recebem callbacks/eventos do Phaser via props.

## Padrões de Inteligência Artificial (Enemy.ts)
A lógica de inimigos utiliza uma Máquina de Estados Finita (Finite State Machine - FSM) combinada com atributos comportamentais descritos em `src/types/game.ts`:
- **Temperamentos:** `aggressive`, `tactical`, `timid`, `relentless`.
- **Estados de IA:** `idle`, `patrol`, `investigating`, `combat`, `flee`, `frenzy`.
- **Tipos de Andar (Gait):** Afeta movimentação, por exemplo, monstros `ethereal` flutuam.
- **Audição e Visão:** Sistema de ruído e Cone de Visão, estimulando transições para `investigating` ou `combat`.

## Persistência
- Pontuações e configurações (Som, Filtro CRT) são salvos no `localStorage` via utilitários isolados (`src/utils/localStorage.ts`).
- Não há banco de dados backend integrado no momento (arquitetura totalmente Client-Side).

## Áudio e Texturas
- Somente a Web Audio API procedural (`soundEngine.ts`) é utilizada para efeitos sonoros e músicas ambientes (sintetizadores de ondas quadradas/senoidais).
- Nenhuma imagem estática externa é carregada; todas as texturas são desenhadas via `Canvas API` nativa transformadas em texturas Base64 para o Phaser.