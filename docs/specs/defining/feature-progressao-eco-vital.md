# Feature: Eco Vital (sustain por abate)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** B
**Depende de:** nenhum
**Estado vs código:** verificado em 2026-10-11 (leitura estática): não existe. Vampirismo é só atributo (`getEffectiveVampirism`, usado em `CollisionHandlers.ts`); nenhum "Eco Vital" no código.

**Origem:** dividida de `discovery-campanha-progressao-e-lore` (removida em 2026-10-11). Decisão original 8; critérios CP-4 e CP-5. Premissa: [discovery-campanha-premissa-e-paradigma](discovery-campanha-premissa-e-paradigma.md).

## Contexto
- Discovery; nada aqui é decisão. Sustain por abate é a recuperação de vida ao matar inimigos, como num ARPG clássico.

## Objetivo
Se aprovado, abater um inimigo na Campanha cura o jogador por uma quantidade fixa e limitada.

## Decisões de que depende
Nenhuma. A decisão abaixo é de produto, sem ADR registrado.

| ADR | Assunto | Status |
|---|---|---|
| — | Nenhuma | — |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| "Eco Vital"/sustain por abate não existe; vampirismo é só atributo (`getEffectiveVampirism`, usado em `CollisionHandlers.ts`) | `grep -rniE "eco.?vital\|killSustain\|lifeOnKill" src`; `Player.ts` | 2026-10-11 |

## Decisões a confirmar
Numeração original entre parênteses.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 (8) | Eco Vital (sustain por abate) | quantidade, teto, vale em Arcade | Fração mínima por abate; número a definir com balance |

## Escopo
Condicional à decisão 1.
- "Eco Vital": cura fixa por abate, só na Campanha, com teto, definida pelo balance.

## Fora de escopo
- Alterar o vampirismo existente (atributo).

## Arquivos e contratos
- Alterar: `src/store/gameStore.ts` ou `Player.ts` (Eco Vital), `src/data/` (dados de balance, a definir).
- Testes: teste dedicado para a fórmula do Eco Vital (regra do projeto).
- Não tocar: `GameScene.ts` (extrair para sistema), `localStorage.ts` sem schema Zod.
- Valores: nenhum fixado; ver Questões em aberto.

## Critérios de aceite
- **EV-1** (era CP-4) Quando o jogador abate um inimigo na Campanha, o PlayerSkillSystem ou o Player deve restaurar a cura do Eco Vital definida na decisão 1, sem ultrapassar o HP máximo (provisório).
- **EV-2** (era CP-5) Se o jogador abate um inimigo com HP cheio, então o gameStore não deve exceder o HP máximo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| EV-1, EV-2 | teste dedicado da fórmula (novo, ao lado de `Player.ts` ou do sistema escolhido) |

## Questões em aberto
- Valor e teto do Eco Vital; vale em Arcade?

## Pendências para promover a backlog
- Discovery; depende de decisão de produto: aprovação do responsável.
- Decisão 1 respondida; questões em aberto resolvidas (valor, teto, Arcade).

## Referências
- [campaign](../../gameplay/campaign.md)
