# Discovery: premissa, paradigma e lore da campanha

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** D
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existem: modo Campanha (`gameMode`, `campaignState` em `src/store/gameStore.ts`; `src/types/campaign.ts`), progressão por zonas em fatias (`CAMPAIGN_ZONE_CHUNKS` e `ChunkStreamer` em `src/game/systems/DungeonFlowController.ts`), início na Safe House com o diálogo de despertar de Maelen (`src/data/dialogues.json`, `safe_house_maelen_intro`, com família levada às catacumbas do norte), `DialogueModal.tsx`, toggle `contentIntensity` (`SettingsScene.ts`, `DismembermentSystem.ts`, `BloodSplatterSystem.ts`). Faltam: mapa único contínuo e gerador híbrido interior/exterior (spec própria).

**Origem:** dividida de `discovery-campanha-progressao-e-lore` (removida em 2026-10-11; pendência "dividir por tema"). Irmãs: [discovery-progressao-identidade-e-build](discovery-progressao-identidade-e-build.md), [feature-mundo-clima-dinamico](feature-mundo-clima-dinamico.md), [feature-progressao-eco-vital](feature-progressao-eco-vital.md), [feature-combate-ritmo-inicial](feature-combate-ritmo-inicial.md).

## Contexto
- Discovery: o que seria entregue se aprovado; nada aqui é decisão. Referências de gênero: Dungeon Siege 1, Diablo 2.
- Premissa proposta: o protagonista é um homem comum cuja vila foi massacrada por um senhor da guerra de magia de sangue; derrotá-lo transferiu o poder a ele; esposa e filha desaparecidas. A abertura (despertar na Safe House, Maelen citando rastros de carruagens ao norte) já está no código.
- O mundo ainda é montado por zona/andar ([campaign](../../gameplay/campaign.md), [world-generation](../../gameplay/world-generation.md)); `gloomy_woods` usa `ProceduralForestGenerator`; o mundo contínuo tem spec própria: [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md).
- As quests dos capítulos 2 a 4 não avançam: ver [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md) (não duplicado aqui).
- O toggle de intensidade de conteúdo é desenhado em cena Phaser (`SettingsScene`), o que contraria "UI só em React": ver [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md).

## Objetivo
Se aprovado, a campanha adota paradigma, lore e tema definidos pelo responsável como base de um ARPG clássico.

## Decisões de que depende
Nenhuma. As decisões abaixo são de produto, sem ADR registrado.

| ADR | Assunto | Status |
|---|---|---|
| — | Nenhuma | — |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Campanha com 5 zonas em fatias por `ChunkStreamer`, não mapa único | `DungeonFlowController.ts` (`CAMPAIGN_ZONE_CHUNKS`) | 2026-10-11 |
| `contentIntensity: 'full'\|'reduced'` reduz desmembramento e respingo | `DismembermentSystem.ts`, `BloodSplatterSystem.ts` | 2026-10-11 |
| `DungeonGenerator` não recebe seed e usa `Math.random` | `src/game/systems/DungeonGenerator.ts` | 2026-10-11 |

## Decisões a confirmar
Numeração original entre parênteses.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (1) | Paradigma | roguelite arcade / ARPG de campanha / ambos (já há os dois modos) | Manter os dois modos; campanha é o foco, sem remover o Arcade |
| 2 (2) | Lore do protagonista e premissa da maldição | adotar / ajustar | Adotar: já está nos diálogos da Safe House |
| 3 (4) | Tema "Sangue" e intensidade de conteúdo | manter vocabulário + toggle / renomear | Manter e deixar o toggle como alavanca de classificação |
| 4 (6) | Mundo único contínuo e gerador híbrido interior/exterior | seguir a spec de topologia / manter zonas | Decidir na spec de topologia, não aqui |

## Escopo
Condicional às decisões 1 a 4 acima.
- Registrar paradigma, lore e tema aprovados.
- Mundo contínuo e gerador híbrido: entregues pela spec de topologia, não aqui.

## Fora de escopo
- Trocar o tema "Sangue".
- Conserto das quests ch2 a ch4 (bug citado) e mover o toggle para React (bug citado).
- Diálogos dos NPCs de vila sem árvore.
- Progressão por uso estilo Dungeon Siege.

## Arquivos e contratos
- Não tocar: `DungeonGenerator.ts`, `GameScene.ts` (extrair para sistema), `localStorage.ts` sem schema Zod.
- Valores: nenhum fixado; ver Questões em aberto.

## Critérios de aceite
Nenhum critério EARS: esta spec só reúne decisões de produto (sem comportamento novo). Os critérios surgem quando o responsável decidir (mundo contínuo: [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md)).

## Questões em aberto
- Escolha entre mundo único (spec de topologia) e zonas atuais.
- Premissa de design informada pelo responsável em 2026-10-11: o jogo não terá teletransporte nem volta à Safe House. O modelo atual (quests só com a Maelen na Safe House) fica desalinhado; ver a questão 1 de [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md). Alinhar antes de definir o fluxo da Campanha.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto: aprovação do responsável.
- Decisões 1 a 4 respondidas; questões em aberto resolvidas.
- Spec de topologia decidida (dependência de mundo contínuo).
- Critérios EARS escritos após as decisões.

## Referências
- [campaign](../../gameplay/campaign.md), [safe-house-and-quests](../../gameplay/safe-house-and-quests.md), [world-generation](../../gameplay/world-generation.md)
- [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md), [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md), [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md)
