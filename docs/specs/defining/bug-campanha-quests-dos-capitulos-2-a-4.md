# Quests dos capítulos 2 a 4 da Campanha não avançam (bug)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Prioridade:** P1 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): bug confirmado em `src/game/systems/DungeonFlowController.ts` (`buildDungeonMap`, único marco `altar_crimson`) e `src/game/scenes/GameScene.ts` (`update`, só avança `discover_zone` por marco). Não validado em execução.

## Contexto
- `src/data/campaignQuests.json`: as quests ch2, ch3 e ch4 têm um objetivo `discover_zone` com alvo `fosso_chagas`, `catacumbas_martires` e `santuario_sangue` (x1). A quest só completa com todos os objetivos no alvo (recompensas: ch2 `corpse_burst`, ch3 `bone_shield`, ch4 `crimson_scythe`).
- O único gatilho de `discover_zone` está em `GameScene.update`: percorre `campaignDiscoverables` e, a menos de 70 px do marco, chama `advanceQuestObjectiveByTarget('discover_zone', <campaignDiscoverableId>, 1)`.
- `DungeonFlowController.buildDungeonMap` só cria um marco: o Altar Ancestral (`campaignDiscoverableId = 'altar_crimson'`), apenas no bioma `gloomy_woods`. Nenhum código emite `discover_zone` com os três ids de zona.
- `gameStore.setCampaignZone` já registra a zona em `discoveredZones` ao entrar no andar, mas isso não avança objetivos.
- Efeito: o objetivo de descoberta das ch2 a ch4 fica em 0 para sempre; as quests nunca concluem e as recompensas e magias ligadas a elas nunca chegam.

## Objetivo (proposta)
Ao entrar (ou alcançar) cada zona da Campanha, o objetivo `discover_zone` correspondente avança uma vez, de modo que as quests ch2 a ch4 possam ser concluídas.

## Decisões
Aprovadas em 2026-10-11 as decisões 1 a 3 (conforme a coluna Recomendação) e a questão 2 (só descoberta). Pendente: a questão em aberto 1 (desalinhamento: o jogo não terá volta à Safe House). A spec fica em `defining/` até o alinhamento.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | O que dispara a descoberta | A) entrar na zona (`advanceToNextFloor`/`setCampaignZone`); B) marco físico por bioma, como o altar | A: menor esforço, já existe o gancho em `setCampaignZone`; B só se quiser exploração ativa |
| 2 | Feedback ao descobrir | A) texto flutuante "ZONA DESCOBERTA"; B) nenhum | A: o jogador percebe o progresso (como "ALTAR DESCOBERTO") |
| 3 | Quest ainda inativa ao entrar na zona | A) descoberta não é guardada; B) guardar e aplicar quando a quest ativar | A: segue a regra atual de `advanceQuestObjectiveByTarget` (só quests `active`); ver questão em aberto 1 |

## Escopo
- Emitir `advanceQuestObjectiveByTarget('discover_zone', <zona>, 1)` para `fosso_chagas`, `catacumbas_martires` e `santuario_sangue` conforme a decisão 1.
- Cobrir só o modo Campanha.

## Fora de escopo
- Mudar `gloomy_woods`/`altar_crimson` e o desbloqueio de `blood_bolt`.
- Alterar recompensas, contagens de morte ou árvores de diálogo.
- Resolver como as quests ch2 a ch4 passam a ser dadas, já que não haverá volta à Safe House (questão em aberto 1; tratar em spec separada).

## Arquivos e contratos
- Alterar (se decisão 1 = A): `src/store/gameStore.ts` (`setCampaignZone`) ou `src/game/systems/DungeonFlowController.ts` (`advanceToNextFloor`); testes em `src/store/gameStore.test.ts`.
- Alterar (se decisão 1 = B): `src/game/systems/DungeonFlowController.ts` (criar marcos por bioma) e `src/game/scenes/GameScene.ts` (texto do marco).
- Contrato: `discover_zone` usa o `ZoneType` como `targetId`; cada alvo avança no máximo `targetCount` (já limitado pela store).
- Não tocar: `src/data/campaignQuests.json`.

## Critérios de aceite (provisórios)
- **QS-1** Quando o jogador entra em `fosso_chagas` com a quest `quest_ch2_the_pit` ativa, o gameStore deve avançar o objetivo `discover_zone` de `fosso_chagas` para 1.
- **QS-2** Quando o jogador entra em `catacumbas_martires` com `quest_ch3_the_martyrs_rest` ativa, o gameStore deve avançar o objetivo `discover_zone` correspondente para 1.
- **QS-3** Quando o jogador entra em `santuario_sangue` com `quest_ch4_blood_sanctuary` ativa, o gameStore deve avançar o objetivo `discover_zone` correspondente para 1.
- **QS-4** Se a zona é revisitada, então o gameStore não deve avançar o objetivo além de `targetCount`.
- **QS-5** Se a quest da zona não está `active`, então o gameStore não deve criar progresso para ela.
- **QS-6** Quando todos os objetivos de uma quest atingem o alvo, o gameStore deve concluir a quest e conceder a recompensa já definida no JSON.
- **QS-7** Onde o modo é Arcade, o jogo não deve avançar objetivos de quest ao trocar de zona.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| QS-1 a QS-3 | Teste unitário em `gameStore.test.ts`: ativar a quest, chamar o gatilho com a zona, checar `objectivesProgress` |
| QS-4, QS-5 | Teste unitário: repetir o gatilho; chamar sem quest ativa |
| QS-6 | Teste unitário: completar mortes + descoberta e checar `status: completed` e `unlockedSpellIds` |
| QS-7 | Teste unitário com `gameMode = 'arcade'` |
| Campanha ponta a ponta | Manual (precisa de playtest humano): ch1 até ch4 |

## Questões em aberto
1. **Desalinhamento a resolver antes de promover (registrado em 2026-10-11).** O responsável informou que o jogo não deve ter teletransporte nem volta à Safe House. Hoje a Maelen (única fonte de `give_quest`) só existe na `safe_house` (andar 1) e não há caminho de volta; logo as quests ch2 a ch4 nunca ficam `active`, e este conserto sozinho não destrava a Campanha. Não verificado se `Continuar` reabre a Safe House. Não decidido: como as quests ch2 a ch4 passam a ser dadas sem retorno. Opções: A) a quest é concedida automaticamente ao concluir a anterior ou ao entrar na zona (sem NPC); B) um NPC da quest aparece dentro da própria zona; C) a Safe House ganha outro modelo (decisão de design maior, fora desta spec). Recomendação: A, é a de menor escopo, não cria retorno nem teletransporte e mantém o modelo de descoberta por zona (decisão 1); a decisão é do responsável.
2. Resolvida em 2026-10-11: o marco por zona é só descoberta, não desbloqueia nada.

## Referências
- [Campanha e Safe House](../../gameplay/safe-house-and-quests.md) (seções Quests e Marcos descobríveis)
