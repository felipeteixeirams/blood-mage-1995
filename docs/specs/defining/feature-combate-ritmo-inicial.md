# Feature: ritmo inicial de combate (golpes por inimigo e stunlock)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não verificado em execução. Ritmo de 4 a 5 golpes e ausência de stunlock exigem playtest.

**Origem:** dividida de `discovery-campanha-progressao-e-lore` (removida em 2026-10-11). Decisão original 9; critério CP-6. Premissa: [discovery-campanha-premissa-e-paradigma](discovery-campanha-premissa-e-paradigma.md).

## Contexto
- Discovery; nada aqui é decisão. Sem `blood_bolt` desbloqueado, o ataque é a adaga (curto alcance), só com arma equipada (zero-to-hero; ver [discovery-progressao-identidade-e-build](discovery-progressao-identidade-e-build.md)).

## Objetivo
Se aprovado, o início da campanha tem ritmo de 4 a 5 golpes por inimigo comum, sem stunlock sem controle de grupo.

## Decisões de que depende
Nenhuma. A decisão abaixo é de produto, sem ADR registrado.

| ADR | Assunto | Status |
|---|---|---|
| — | Nenhuma | — |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Sem `blood_bolt` desbloqueado, o ataque é a adaga (curto alcance), só com arma equipada | `src/game/objects/Player.ts` | 2026-10-11 |

## Decisões a confirmar
Numeração original entre parênteses.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (9) | Ritmo inicial (4 a 5 golpes por inimigo comum; sem stunlock sem controle de grupo) | adotar / ajustar | Validar por playtest antes de fixar |

## Escopo
Condicional à decisão 1.
- Ajuste do dano/HP iniciais para o ritmo de 4 a 5 golpes, se o playtest mostrar desvio.
- Garantir que inimigos comuns não sofram stunlock automático (só por magia de controle), se o playtest mostrar desvio.

## Fora de escopo
- Progressão por uso estilo Dungeon Siege.

## Arquivos e contratos
- Alterar: dados de balance e `Player.ts` (a definir após o playtest).
- Não tocar: `DungeonGenerator.ts`, `GameScene.ts` (extrair para sistema).
- Valores: nenhum fixado; ver Questões em aberto.

## Critérios de aceite
- **RI-1** (era CP-6) Enquanto o jogador não tem magia de controle de grupo, o inimigo comum não deve entrar em stunlock automático por golpe (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| RI-1 | manual: bater em inimigo comum sem feitiço; não validado: precisa de playtest humano |

## Questões em aberto
- Ritmo de 4 a 5 golpes: não verificado (exige execução).
- Stunlock: não verificado.

## Pendências para promover a backlog
- Discovery; depende de decisão de produto: aprovação do responsável.
- Decisão 1 respondida; questões em aberto resolvidas.
- Fatos a verificar: ritmo de combate e stunlock em execução.

## Referências
- [campaign](../../gameplay/campaign.md)
