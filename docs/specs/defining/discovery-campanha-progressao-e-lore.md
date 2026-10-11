# Discovery: transição para ARPG clássico (campanha, lore e atmosfera)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existem: modo Campanha (`gameMode`, `campaignState` em `src/store/gameStore.ts`; `src/types/campaign.ts`), progressão por zonas em fatias (`CAMPAIGN_ZONE_CHUNKS` e `ChunkStreamer` em `src/game/systems/DungeonFlowController.ts`), início na Safe House com o diálogo de despertar de Maelen (`src/data/dialogues.json`, `safe_house_maelen_intro`, com família levada às catacumbas do norte), `DialogueModal.tsx`, zero-to-hero (`CAMPAIGN_SPELL_UNLOCK_LEVEL` em `gameStore.ts`: nível 3 a 13; adaga em `Player.ts` ~l.565-606), 6 pares `exclusive_with` em `src/data/talents.json`, toggle `contentIntensity` (`SettingsScene.ts`, `DismembermentSystem.ts`, `BloodSplatterSystem.ts`) e clima por partículas (`AtmosphereSystem.ts`). Faltam: mapa único contínuo e gerador híbrido interior/exterior, trovões e chuva leve (`WeatherType` só declarado), "Eco Vital", arquétipos de build nomeados e validação de ritmo de combate.

## Contexto
- Discovery: o que seria entregue se aprovado; nada aqui é decisão. Referências de gênero: Dungeon Siege 1, Diablo 2.
- Premissa proposta: o protagonista é um homem comum cuja vila foi massacrada por um senhor da guerra de magia de sangue; derrotá-lo transferiu o poder a ele; esposa e filha desaparecidas. A abertura (despertar na Safe House, Maelen citando rastros de carruagens ao norte) já está no código.
- O mundo ainda é montado por zona/andar ([campaign](../../gameplay/campaign.md), [world-generation](../../gameplay/world-generation.md)); `gloomy_woods` usa `ProceduralForestGenerator`; o mundo contínuo tem spec própria: [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md).
- `WorldZoneConfig.weather` (`gentle_rain`, `thunderstorm`, `thick_fog`, `blood_mist`) existe só no tipo: nenhum código o lê.
- As quests dos capítulos 2 a 4 não avançam: ver [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md) (não duplicado aqui).
- O toggle de intensidade de conteúdo é desenhado em cena Phaser (`SettingsScene`), o que contraria "UI só em React": ver [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md).

## Objetivo
Se aprovado, a campanha entrega a progressão e a atmosfera de um ARPG clássico: crescimento gradual de poder, clima dinâmico, sustain por abate e liberdade de build dentro de uma identidade fixa.

## Decisões de que depende
Nenhuma. As decisões abaixo são de produto, sem ADR registrado.

| ADR | Assunto | Status |
|---|---|---|
| — | Nenhuma | — |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Campanha com 5 zonas em fatias por `ChunkStreamer`, não mapa único | `DungeonFlowController.ts` (`CAMPAIGN_ZONE_CHUNKS`) | 2026-10-11 |
| `WeatherType` e `WorldZoneConfig.weather` só aparecem em `types/campaign.ts`; `grep -rniE "thunder\|trov\|lightning" src` sem uso fora do tipo | `src/types/campaign.ts` | 2026-10-11 |
| "Eco Vital"/sustain por abate não existe; vampirismo é só atributo (`getEffectiveVampirism`, usado em `CollisionHandlers.ts`) | `grep -rniE "eco.?vital\|killSustain\|lifeOnKill" src`; `Player.ts` | 2026-10-11 |
| Magias por nível: hellfire_nova 3, bone_shield 5, crimson_scythe 7, syphon_soul 9, hemomancy_beam 11, blood_ritual_circle 13 | `src/store/gameStore.ts` | 2026-10-11 |
| Sem `blood_bolt` desbloqueado, o ataque é a adaga (curto alcance), só com arma equipada | `src/game/objects/Player.ts` | 2026-10-11 |
| `talents.json` tem 6 pares `exclusive_with` | `src/data/talents.json` | 2026-10-11 |
| `contentIntensity: 'full'\|'reduced'` reduz desmembramento e respingo | `DismembermentSystem.ts`, `BloodSplatterSystem.ts` | 2026-10-11 |
| `DungeonGenerator` não recebe seed e usa `Math.random` | `src/game/systems/DungeonGenerator.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Paradigma | roguelite arcade / ARPG de campanha / ambos (já há os dois modos) | Manter os dois modos; campanha é o foco, sem remover o Arcade |
| 2 | Lore do protagonista e premissa da maldição | adotar / ajustar | Adotar: já está nos diálogos da Safe House |
| 3 | Zero-to-hero | começar sem magias / manter | Manter como está (já implementado para a Campanha) |
| 4 | Tema "Sangue" e intensidade de conteúdo | manter vocabulário + toggle / renomear | Manter e deixar o toggle como alavanca de classificação |
| 5 | Identidade fixa + build livre por ramificação exclusiva (em vez de progressão por uso) | adotar / progressão por uso | Adotar: preserva a premissa de poder não escolhido |
| 6 | Mundo único contínuo e gerador híbrido interior/exterior | seguir a spec de topologia / manter zonas | Decidir na spec de topologia, não aqui |
| 7 | Clima dinâmico: quais tipos e em quais zonas | chuva leve, trovão, névoa, névoa de sangue | Só os de `WeatherType`; mapa zona -> clima fica a definir |
| 8 | Eco Vital (sustain por abate) | quantidade, teto, vale em Arcade | Fração mínima por abate; número a definir com balance |
| 9 | Ritmo inicial (4 a 5 golpes por inimigo comum; sem stunlock sem controle de grupo) | adotar / ajustar | Validar por playtest antes de fixar |
| 10 | Arquétipos de build (melee pesado, híbrido, caster puro) | nomear na UI / só nos pares exclusivos | Só nos pares existentes até o responsável pedir |

## Escopo
Condicional às decisões 6 a 10.
- Consumo de `WorldZoneConfig.weather` por zona: partículas de chuva leve e trovão (flash de luz e som) via `AtmosphereSystem` e `soundEngine`.
- "Eco Vital": cura fixa por abate, só na Campanha, com teto, definida pelo balance.
- Ajuste do dano/HP iniciais para o ritmo de 4 a 5 golpes, se o playtest mostrar desvio.
- Garantir que inimigos comuns não sofram stunlock automático (só por magia de controle), se o playtest mostrar desvio.
- Mundo contínuo e gerador híbrido: entregues pela spec de topologia, não aqui.

## Fora de escopo
- Progressão por uso estilo Dungeon Siege.
- Trocar o tema "Sangue".
- Conserto das quests ch2 a ch4 (bug citado) e mover o toggle para React (bug citado).
- Diálogos dos NPCs de vila sem árvore.

## Arquivos e contratos
- Alterar: `src/game/systems/AtmosphereSystem.ts` (clima), `src/game/systems/WorldManager.ts` (ponto onde a zona define clima), `src/utils/soundEngine.ts` (trovão), `src/store/gameStore.ts` ou `Player.ts` (Eco Vital), `src/data/` (dados de balance, a definir).
- Testes: ao lado dos sistemas (`AtmosphereSystem.test.ts`) e teste dedicado para a fórmula do Eco Vital (regra do projeto).
- Não tocar: `DungeonGenerator.ts`, `GameScene.ts` (extrair para sistema), `localStorage.ts` sem schema Zod.
- Valores: nenhum fixado; ver Questões em aberto.

## Critérios de aceite
- **CP-1** Enquanto a zona atual tem clima `gentle_rain`, o AtmosphereSystem deve emitir partículas de chuva (provisório).
- **CP-2** Enquanto a zona atual tem clima `thunderstorm`, quando o intervalo de trovão expira, o sistema deve disparar um flash de luz e um som de trovão (provisório).
- **CP-3** Se a Configuração de intensidade está `reduced`, então o flash de trovão deve ter intensidade reduzida (provisório; depende da decisão 7).
- **CP-4** Quando o jogador abate um inimigo na Campanha, o PlayerSkillSystem ou o Player deve restaurar a cura do Eco Vital definida na decisão 8, sem ultrapassar o HP máximo (provisório).
- **CP-5** Se o jogador abate um inimigo com HP cheio, então o gameStore não deve exceder o HP máximo (provisório).
- **CP-6** Enquanto o jogador não tem magia de controle de grupo, o inimigo comum não deve entrar em stunlock automático por golpe (provisório).
- **CP-7** Se a zona não define clima, então o AtmosphereSystem não deve emitir clima (comportamento atual) (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CP-1, CP-2, CP-7 | teste em `AtmosphereSystem.test.ts` com zona simulada; manual: ver chuva e flash; não validado: precisa de playtest humano |
| CP-3 | teste unitário com `contentIntensity: 'reduced'` |
| CP-4, CP-5 | teste dedicado da fórmula (novo, ao lado de `Player.ts` ou do sistema escolhido) |
| CP-6 | manual: bater em inimigo comum sem feitiço; não validado: precisa de playtest humano |

## Questões em aberto
- Mapa zona -> clima; intervalo, intensidade e som do trovão.
- Valor e teto do Eco Vital; vale em Arcade?
- Ritmo de 4 a 5 golpes: não verificado (exige execução).
- Stunlock: não verificado.
- Escolha entre mundo único (spec de topologia) e zonas atuais.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto: aprovação do responsável.
- Decisões 1 a 10 respondidas; questões em aberto resolvidas.
- Fatos a verificar: ritmo de combate e stunlock em execução.
- Dividir por tema (clima, Eco Vital, ritmo) em specs menores.
- Spec de topologia decidida (dependência de mundo contínuo).

## Referências
- [campaign](../../gameplay/campaign.md), [safe-house-and-quests](../../gameplay/safe-house-and-quests.md), [world-generation](../../gameplay/world-generation.md)
- [feature-mundo-topologia-continua](feature-mundo-topologia-continua.md), [bug-campanha-quests-dos-capitulos-2-a-4](bug-campanha-quests-dos-capitulos-2-a-4.md), [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md)
