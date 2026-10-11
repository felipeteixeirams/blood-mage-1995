# Discovery: zero-to-hero, identidade fixa e arquétipos de build

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** D
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existem: zero-to-hero (`CAMPAIGN_SPELL_UNLOCK_LEVEL` em `gameStore.ts`: nível 3 a 13; adaga em `Player.ts` ~l.565-606) e 6 pares `exclusive_with` em `src/data/talents.json`. Faltam: arquétipos de build nomeados (melee pesado, híbrido, caster puro).

**Origem:** dividida de `discovery-campanha-progressao-e-lore` (removida em 2026-10-11). Decisões originais 3, 5 e 10. Premissa e paradigma: [discovery-campanha-premissa-e-paradigma](discovery-campanha-premissa-e-paradigma.md).

## Contexto
- Discovery; nada aqui é decisão. Referências de gênero: Dungeon Siege 1, Diablo 2.
- Premissa: o poder do protagonista não é escolhido (foi transferido); a liberdade de build vem de ramificações exclusivas, não de progressão por uso.

## Objetivo
Se aprovado, a campanha entrega crescimento gradual de poder e liberdade de build dentro de uma identidade fixa.

## Decisões de que depende
Nenhuma. As decisões abaixo são de produto, sem ADR registrado.

| ADR | Assunto | Status |
|---|---|---|
| — | Nenhuma | — |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Magias por nível: hellfire_nova 3, bone_shield 5, crimson_scythe 7, syphon_soul 9, hemomancy_beam 11, blood_ritual_circle 13 | `src/store/gameStore.ts` | 2026-10-11 |
| Sem `blood_bolt` desbloqueado, o ataque é a adaga (curto alcance), só com arma equipada | `src/game/objects/Player.ts` | 2026-10-11 |
| `talents.json` tem 6 pares `exclusive_with` | `src/data/talents.json` | 2026-10-11 |

## Decisões a confirmar
Numeração original entre parênteses.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (3) | Zero-to-hero | começar sem magias / manter | Manter como está (já implementado para a Campanha) |
| 2 (5) | Identidade fixa + build livre por ramificação exclusiva (em vez de progressão por uso) | adotar / progressão por uso | Adotar: preserva a premissa de poder não escolhido |
| 3 (10) | Arquétipos de build (melee pesado, híbrido, caster puro) | nomear na UI / só nos pares exclusivos | Só nos pares existentes até o responsável pedir |

## Escopo
Condicional às decisões acima. Nenhuma mudança de código prevista enquanto as recomendações (manter o atual) forem aceitas.

## Fora de escopo
- Progressão por uso estilo Dungeon Siege.
- Nomear arquétipos na UI, salvo pedido do responsável.

## Arquivos e contratos
- Não tocar: `GameScene.ts` (extrair para sistema), `localStorage.ts` sem schema Zod.
- Valores: nenhum fixado.

## Critérios de aceite
Nenhum critério EARS: com as recomendações aceitas não há comportamento novo. Se o responsável pedir arquétipos nomeados, escrever critérios antes de promover.

## Questões em aberto
- Nomear arquétipos de build na UI ou manter só os pares exclusivos (decisão 3).

## Pendências para promover a backlog
- Discovery; depende de decisão de produto: aprovação do responsável.
- Decisões 1 a 3 respondidas; questões em aberto resolvidas.
- Critérios EARS escritos se houver mudança de comportamento.

## Referências
- [campaign](../../gameplay/campaign.md)
- [discovery-campanha-premissa-e-paradigma](discovery-campanha-premissa-e-paradigma.md)
