# Gameplay — Documento Mestre

**Contexto:** como cada funcionalidade do jogo funciona hoje (regras, dados, onde fica no código), um satélite por área, para consultar sem ler o código. Descreve o que o código faz, inclusive comportamentos que parecem bugs; não registra decisões. Verificação por leitura estática, sem execução.
**Leia quando:** for entender, alterar ou especificar uma mecânica (combate, magias, talentos, loot, progressão, campanha, HUD). Para a estrutura técnica e os sistemas do `GameScene`, veja [architecture](../architecture/README.md).

| Documento | Papel | Status |
|---|---|---|
| [combat.md](combat.md) | FSM Windup/Strike/Recovery, dano do jogador, crítico, knockback, dash, status de sobrevivência, telegrafia, gibs e sangue | verificado |
| [enemies-and-bestiary.md](enemies-and-bestiary.md) | Os 12 monstros de `monsters.json`, IA e comportamentos, escala por andar, afixos de elite, chefe e as 7 ondas | verificado |
| [spells-and-skills.md](spells-and-skills.md) | As 9 magias de `spells.json` (custo, cooldown, dano), fluxo do cast, desbloqueio e slots | verificado |
| [talents.md](talents.md) | Os 9 talentos de `talents.json`, exclusão mútua, custo em cristais, persistência e aplicação | verificado |
| [loot-and-items.md](loot-and-items.md) | Drop, raridades, atributos, equipar, as 8 relíquias, item de campanha e orbes | verificado |
| [progression-and-prestige.md](progression-and-prestige.md) | XP e níveis, 21 upgrades, 5 contratos, 3 modificadores de run, selos e dificuldades, runStats e recordes | verificado |
| [campaign-and-safe-house.md](campaign-and-safe-house.md) | Campanha x Arcade, zonas e capítulos, Safe House e Maelen, quests, diálogos e save de campanha | verificado |
| [world-generation.md](world-generation.md) | Quem chama quem na geração, mapa BSP+autômato, ChunkStreamer, portais e andares, ambiente por bioma, armadilhas | verificado |
| [achievements-and-codex.md](achievements-and-codex.md) | 16 conquistas (runStats, desbloqueio x resgate de cristais) e Códice de 17 entradas | verificado |
| [hud-and-modals.md](hud-and-modals.md) | Componentes do HUD em jogo, atalhos de teclado, gamepad, joystick flutuante, hooks e i18n | verificado |
| [modals-reference.md](modals-reference.md) | Modais e telas fora do HUD (ModalBase, cenas Phaser embutidas) e componentes não montados | verificado |
