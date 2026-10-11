# Chunks gerados sobre a Safe House e o fosso (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `DungeonFlowController.loadChunkBiome` e `DungeonGenerator.generate`. Não validado em execução.

> Precisa de playtest para confirmar o efeito visual e de colisão. A leitura estática mostra a causa; não mostra o que o jogador vê. Decisões de arquitetura já tratadas no [ADR 0003](../../decisions/0003-mundo-continuo-e-geradores-de-floresta.md) (Proposta); esta spec não o duplica.

## Contexto
- `DungeonFlowController` mantém `CAMPAIGN_ZONE_CHUNKS` (5 chunks de 1920x1440: `safe_house`, `gloomy_woods`, `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`) e um `ChunkStreamer` com `loadRadius: 1`. `GameScene.update` chama `updateChunkStream(player.x)` todo frame.
- `onLoad` chama `loadChunkBiome(biome, chunkIndex)`, que calcula `offsetX = chunkIndex * 1920` e chama `dungeonGenerator.generate(1920, 1440, biome)` **sem** passar o deslocamento. `DungeonGenerator.generate(mapW, mapH, biome, _offsetX = 0, _offsetY = 0)` ignora os dois últimos parâmetros; `offsetX` só vai para a telemetria `chunk_load`. Cada chunk gera salas, paredes, baús e inimigos nas mesmas coordenadas 0..1920, sobre o piso que já existe.
- Efeitos colaterais de `loadChunkBiome`: soma as salas novas a `scene.rooms`, chama `setCurrentBiome`, `worldManager.setBiome`, `postFX.setBiome`, `atmosphereSystem.setBiome` e `lightingSystem.enable`, e `generate` troca `dungeonGenerator.heightGenerator`. O ambiente do piso atual pode mudar para o do chunk vizinho.
- Proteção parcial: `markOwnFloorChunkAsBuilt(biome)` só roda na Campanha (`buildDungeonMap`, modo `campaign`) e marca apenas o índice do bioma do piso. Com `loadRadius: 1`, o chunk vizinho (índice +1, e -1 quando existe) é gerado por cima. Ex.: na Safe House (índice 0) carrega o chunk 1 (`gloomy_woods`).
- Arcade: nenhum chunk é marcado. O piso 1-2 usa `fosso_chagas` e o jogador começa perto do canto superior esquerdo (chunk 0, `safe_house`); com `loadRadius: 1` os chunks 0 e 1 são gerados sobre o fosso. A Safe House é sala única 800x600 centrada; ao gerá-la sobre o fosso, podem aparecer paredes de madeira e piso de outro bioma.
- Documentos: `docs/gameplay/world-generation.md` (seção Mundo contínuo), `docs/architecture/game-systems-world.md`.

## Objetivo
Proposta: nenhum chunk vizinho é gerado sobre o piso em jogo; o piso do jogador nunca recebe geometria, inimigos ou troca de bioma de outro chunk.

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | O que fazer com o streaming | A) desligar `loadChunkBiome` (manter só a mistura de ambiente na fronteira); B) usar o deslocamento de verdade em `generate`; C) restringir o streaming à Campanha e marcar todos os chunks fora do piso como construídos | A: um piso por vez é o que o portal já faz e evita reescrever `generate`; B só se a Campanha precisar de mundo contínuo (ver ADR 0003) |
| 2 | Arcade usa streaming? | sim / não | Não: o Arcade tem biomas por profundidade, não por posição |
| 3 | Efeito colateral de bioma ao carregar chunk | manter / remover | Remover: só `buildDungeonMap` troca o bioma do piso |

## Escopo
- Impedir a geração de chunks sobre o piso atual, na Campanha e no Arcade, conforme a decisão 1.
- Garantir que `onLoad` não altere bioma, luz, pós-processamento nem `heightGenerator` do piso em jogo.
- Teste unitário de `DungeonFlowController` cobrindo Campanha e Arcade.

## Fora de escopo
- Escolher entre `ProceduralForestGenerator` e `PathDrivenGenerator` (ADR 0003).
- Implementar mundo contínuo real; mudar tamanho ou ordem dos chunks.
- Comentários desatualizados de `ChunkStreamer.ts` (só se a decisão 1 mudar o código ao redor).

## Arquivos e contratos
- Alterar: `src/game/systems/DungeonFlowController.ts` (`loadChunkBiome`, `markOwnFloorChunkAsBuilt`, `updateChunkStream`); só se a opção B for escolhida: `src/game/systems/DungeonGenerator.ts` (`generate`, parâmetros `_offsetX/_offsetY`).
- Testes: arquivo de teste de `DungeonFlowController` (criar se não existir).
- Docs a atualizar no mesmo commit: `docs/gameplay/world-generation.md`, `docs/architecture/game-systems-world.md`.
- Não tocar: `ChunkStreamer.ts` (puro), geradores de bioma.
- Valores: dependem das decisões 1 a 3 (nada é inventado aqui).

## Critérios de aceite (provisórios)
- **CH-1** Enquanto o jogador está em um piso da Campanha, o DungeonFlowController não deve gerar salas, paredes, baús nem inimigos de chunks vizinhos sobre esse piso.
- **CH-2** Enquanto o jogador está em um piso do Arcade, o DungeonFlowController não deve gerar nenhum chunk da Campanha.
- **CH-3** Quando `updateChunkStream` é chamado, o DungeonFlowController não deve alterar `currentBiome`, `WorldManager`, PostFX, atmosfera nem luz fora do bioma do piso.
- **CH-4** Quando o jogador avança de piso, o DungeonFlowController deve gerar o novo piso uma única vez.
- **CH-5** Se um chunk já está em `builtChunkIndices`, então o DungeonFlowController deve ignorar um novo `onLoad` para ele.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CH-1 | Teste unitário: `buildDungeonMap` na Campanha com `generate` espiado; mover `player.x` perto da borda; `generate` chamado 1 vez |
| CH-2 | Idem em Arcade, pisos 1 a 5 |
| CH-3 | Teste unitário: espiar `setCurrentBiome` e `worldManager.setBiome` após `updateChunkStream` |
| CH-4 | Teste: `advanceToNextFloor` e contar chamadas de `generate` |
| CH-5 | Teste: chamar `loadChunkBiome` duas vezes para o mesmo índice |
| Todos | Manual (playtest humano, não validado): jogar Safe House e piso 1 do Arcade até a borda direita e conferir que não aparecem paredes ou piso estranhos |

## Questões em aberto
- Há de fato sobreposição visível no Arcade? Depende de playtest.
- A mistura de ambiente na fronteira (`updateBoundaryTransitions`) deve continuar sem chunks vizinhos?

## Referências
- `docs/gameplay/world-generation.md`, `docs/architecture/game-systems-world.md`
- [ADR 0003](../../decisions/0003-mundo-continuo-e-geradores-de-floresta.md)
