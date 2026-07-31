# AI Studio System Prompt - Instruções do Projeto

Este projeto utiliza **Context-Driven Engineering** e **Spec-Driven Development**.
Sempre priorize a leitura desta documentação (diretório `/docs`) antes de realizar alterações arquiteturais ou explorar o código aleatoriamente.

## Domínio do Projeto
Jogo de sobrevivência estilo "Vampire Survivors" / "Dungeon Crawler" com temática Sombria.
- **Engine**: Phaser 3 (Canvas)
- **UI**: React 18 + Tailwind CSS
- **Gerenciamento de Estado**: Zustand (`src/store/gameStore.ts`) para sincronização do estado global entre menus, HUD e Phaser.
- **Estrutura Física**: Movimentação com física Arcade, pathfinding básico e estados de inteligência artificial dos inimigos.

## Regras
1. Utilize o Zustand para o estado que precisa ser compartilhado entre UI (Menus, HUD) e a Engine (Phaser).
2. Sprites são gerados via código base64 proceduralmente.
3. Mantenha as interfaces React limpas, isolando estilos via Tailwind.
4. Siga as diretrizes em `/docs/BEST_PRACTICES.md` para melhorias de UX/Juice e Performance.