# Gameplay — Documento Mestre

**Contexto:** como cada funcionalidade do jogo funciona hoje (regras, dados, onde fica no código), um satélite por área, para consultar sem ler o código. Descreve o que o código faz, inclusive comportamentos que parecem bugs; não registra decisões. Verificação por leitura estática, sem execução.
**Leia quando:** for entender, alterar ou especificar uma mecânica (combate, magias, talentos, loot, progressão, campanha, HUD). Para a estrutura técnica e os sistemas do `GameScene`, veja [architecture](../architecture/README.md).

| Documento | Papel | Status |
|---|---|---|
| [combat.md](combat.md) | FSM Windup/Strike/Recovery, dano do jogador, crítico, knockback, dash/i-frames, dano recebido, knockouts e telegrafia | verificado |
| [status-and-feedback.md](status-and-feedback.md) | Status de sobrevivência do jogador e de inimigos, feedback de impacto (shake/hit-stop), gibs e sangue | verificado |
| [enemies-and-bestiary.md](enemies-and-bestiary.md) | Os 12 monstros de `monsters.json`, IA e comportamentos, escala por andar, afixos de elite, chefe e as 7 ondas | verificado |
| [spells-and-skills.md](spells-and-skills.md) | As 9 magias de `spells.json` (custo, cooldown, dano), fluxo do cast, desbloqueio e slots | verificado |
| [talents.md](talents.md) | Os 9 talentos de `talents.json`, exclusão mútua, custo em cristais, persistência e aplicação | verificado |
| [loot-and-items.md](loot-and-items.md) | Drop, raridades, atributos, equipar, as 8 relíquias, item de campanha e orbes | verificado |
| [progression-and-prestige.md](progression-and-prestige.md) | XP e níveis, 21 upgrades, 5 contratos, 3 modificadores de run, selos e dificuldades, runStats e recordes | verificado |
| [campaign.md](campaign.md) | Campanha x Arcade, zonas e capítulos, desbloqueio de magias e save de campanha | verificado |
| [safe-house-and-quests.md](safe-house-and-quests.md) | Safe House e Maelen, quests, diálogos, itens de campanha e marcos descobríveis | verificado |
| [world-generation.md](world-generation.md) | Quem chama quem na geração, mapa BSP+autômato, ChunkStreamer, portais e andares, ambiente por bioma, armadilhas | verificado |
| [achievements.md](achievements.md) | 16 conquistas (runStats, desbloqueio x resgate de cristais, AchievementsModal) e as inalcançáveis | verificado |
| [codex.md](codex.md) | Códice de 17 entradas (marcos de abate, CodexSystem, CodexModal, entradas sem desbloqueio) | verificado |
| [audio.md](audio.md) | Áudio sintetizado em Web Audio (29 SFX, tinnitus, 4 temas de BGM, mixagem, flags e WAVs só de teste) | verificado |
| [lighting-and-effects.md](lighting-and-effects.md) | Light2D, PostFX, Glow, névoa/clima, sombras, reflexos, partículas e shake: flags e valores por bioma | verificado |

Telas e HUD: [ui](../ui/README.md).
