# Feature: clima dinâmico por zona

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Prioridade:** P3 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe clima por partículas (`AtmosphereSystem.ts`). Faltam: trovões e chuva leve (`WeatherType` só declarado; nenhum código lê `WorldZoneConfig.weather`).

**Origem:** dividida de `discovery-campanha-progressao-e-lore` (removida em 2026-10-11). Decisão original 7; critérios CP-1, CP-2, CP-3 e CP-7. Premissa: [discovery-campanha-premissa-e-paradigma](discovery-campanha-premissa-e-paradigma.md).

## Contexto
- Discovery; nada aqui é decisão.
- `WorldZoneConfig.weather` (`gentle_rain`, `thunderstorm`, `thick_fog`, `blood_mist`) existe só no tipo: nenhum código o lê.
- O toggle de intensidade de conteúdo é desenhado em cena Phaser (`SettingsScene`), o que contraria "UI só em React": ver [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md).

## Objetivo
Se aprovado, cada zona pode definir um clima (chuva leve, trovão) que o `AtmosphereSystem` exibe.

## Decisões de que depende
Nenhuma. A decisão abaixo é de produto, sem ADR registrado.

| ADR | Assunto | Status |
|---|---|---|
| — | Nenhuma | — |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `WeatherType` e `WorldZoneConfig.weather` só aparecem em `types/campaign.ts`; `grep -rniE "thunder\|trov\|lightning" src` sem uso fora do tipo | `src/types/campaign.ts` | 2026-10-11 |
| `contentIntensity: 'full'\|'reduced'` reduz desmembramento e respingo | `DismembermentSystem.ts`, `BloodSplatterSystem.ts` | 2026-10-11 |

## Decisões a confirmar
Numeração original entre parênteses.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (7) | Clima dinâmico: quais tipos e em quais zonas | chuva leve, trovão, névoa, névoa de sangue | Só os de `WeatherType`; mapa zona -> clima fica a definir |

## Escopo
Condicional à decisão 1.
- Consumo de `WorldZoneConfig.weather` por zona: partículas de chuva leve e trovão (flash de luz e som) via `AtmosphereSystem` e `soundEngine`.

## Fora de escopo
- Conserto das quests ch2 a ch4 e mover o toggle para React (bugs citados).
- Mundo contínuo (spec de topologia).

## Arquivos e contratos
- Alterar: `src/game/systems/AtmosphereSystem.ts` (clima), `src/game/systems/WorldManager.ts` (ponto onde a zona define clima), `src/utils/soundEngine.ts` (trovão).
- Testes: ao lado dos sistemas (`AtmosphereSystem.test.ts`).
- Não tocar: `DungeonGenerator.ts`, `GameScene.ts` (extrair para sistema), `localStorage.ts` sem schema Zod.
- Valores: nenhum fixado; ver Questões em aberto.

## Critérios de aceite
- **CL-1** (era CP-1) Enquanto a zona atual tem clima `gentle_rain`, o AtmosphereSystem deve emitir partículas de chuva (provisório).
- **CL-2** (era CP-2) Enquanto a zona atual tem clima `thunderstorm`, quando o intervalo de trovão expira, o sistema deve disparar um flash de luz e um som de trovão (provisório).
- **CL-3** (era CP-3) Se a Configuração de intensidade está `reduced`, então o flash de trovão deve ter intensidade reduzida (provisório; depende da decisão 1).
- **CL-4** (era CP-7) Se a zona não define clima, então o AtmosphereSystem não deve emitir clima (comportamento atual) (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| CL-1, CL-2, CL-4 | teste em `AtmosphereSystem.test.ts` com zona simulada; manual: ver chuva e flash; não validado: precisa de playtest humano |
| CL-3 | teste unitário com `contentIntensity: 'reduced'` |

## Questões em aberto
- Mapa zona -> clima; intervalo, intensidade e som do trovão.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto: aprovação do responsável.
- Decisão 1 respondida; questões em aberto resolvidas.
- Valores concretos (intervalo, intensidade, som) fixados.

## Referências
- [campaign](../../gameplay/campaign.md), [world-generation](../../gameplay/world-generation.md)
- [bug-ui-fora-do-react-e-codigo-morto](bug-ui-fora-do-react-e-codigo-morto.md)
