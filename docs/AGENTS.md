# AI Studio System Prompt - Instruções do Projeto

Este projeto utiliza **Context-Driven Engineering** e **Spec-Driven Development**.

Sempre priorize a leitura desta documentação (diretório `/docs`) antes de realizar alterações arquiteturais ou explorar o código aleatoriamente.

## Domínio do Projeto
Jogo de sobrevivência estilo "Vampire Survivors" / "Dungeon Crawler" com temática Sombria.
- **Engine**: Phaser 3 (Canvas)
- **UI**: React 18 + Tailwind CSS
- **Gerenciamento de Estado**: React gerencia as interfaces sobrepostas (HUD, Menus), Phaser cuida do Game Loop.
- **Estrutura Física**: Movimentação com física Arcade, pathfinding básico e estados de inteligência artificial dos inimigos.

## Regras
1. Não faça overengineering de padrões de estado (como Redux) sem extrema necessidade.
2. Sprites são gerados via código base64 proceduralmente.
3. Mantenha as interfaces React limpas, isolando estilos via Tailwind.
4. Siga as diretrizes em `/docs/BEST_PRACTICES.md` para melhorias de UX/Juice e Performance.