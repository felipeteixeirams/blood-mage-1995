# Arquitetura — Documento Mestre

**Contexto:** como o código do Bloodmage 1995 está organizado hoje: camada Phaser (jogo) e camada React (UI) ligadas pelo Zustand, `GameScene` e seus sistemas, padrões de código do Phaser.
**Leia quando:** for mexer em `src/game/`, em `src/store/gameStore.ts` ou na comunicação entre HUD e jogo, e precisar saber onde cada responsabilidade vive.

| Satélite | Conteúdo | Status |
|---|---|---|
| [architecture.md](architecture.md) | Mapa do sistema: UI híbrida, instâncias de `Phaser.Game`, `GameScene` e sistemas extraídos, dados e persistência | verificado |
| [state-management.md](state-management.md) | Store Zustand, ponte React-Phaser (canais, campos, callbacks), conquistas e run stats | verificado |
| [phaser-patterns.md](phaser-patterns.md) | Pooling, IA de inimigos, extração/delegação de `GameScene`, texturas procedurais | verificado |
| [game-systems.md](game-systems.md) | Inventário dos 41 módulos de `src/game/systems/` e de quem os consome | não verificado |

Relacionados: [../engineering/README.md](../engineering/README.md) (stack, estrutura de diretórios, scripts) e [../critical/README.md](../critical/README.md) (arquivos de risco e problemas conhecidos).
