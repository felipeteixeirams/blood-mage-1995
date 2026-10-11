# Iluminação Light2D calibrada por bioma

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; nada executado): a iluminação Light2D (`LightingSystem.ts`: luz do jogador com redução por HP, tochas, braseiros, cascata por `floorDepth`) e o Glow de destaque (`LightingPolish.ts`) existem; faltam calibrar `ambientColor`, raios, cores e flicker por bioma e testar contagem de luzes, raio mínimo e fases do flicker. Como a escuridão é obtida (Light2D, overlay ou ambos) depende do ADR 0005.
**Origem:** dividida da spec feature-polimento-grafico-calibracao (2026-10-11)

## Contexto
Frente C do polimento gráfico. Problema: a cascata ambiente, as luzes pontuais, o Glow e a ColorMatrix podem somar energia visual e lavar terreno e silhuetas. O ADR 0005 registra que o `darknessOverlay` é limpo todo frame em `updateThreatIndicator()`; o alvo da calibração depende dessa decisão. Satélite: [iluminação e efeitos](../../gameplay/lighting-and-effects.md); bug relacionado: [bug-iluminacao-e-efeitos-sem-consumidor](bug-iluminacao-e-efeitos-sem-consumidor.md). Implementável sem as outras filhas; calibrar depois de [feature-glow-e-pos-processamento-calibrados](feature-glow-e-pos-processamento-calibrados.md) evita retrabalho de contraste.

## Objetivo
Refinar a iluminação existente (mesmas fontes, biomas e regra de redução por HP) para separar piso, entidades e efeitos sem lavar a imagem.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação: escuridão e vinheta no gameplay | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Existem testes de `LightingSystem` e `LightingPolish` | `src/game/systems/*.test.ts` | 2026-10-11 |
| `cleanup()` do `LightingPolish` remove as luzes de Glow | `src/game/systems/LightingPolish.ts` (linhas 543-562) | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: calibrar sem nova luz, abstração ou aumento de limites | A) fechado; B) abstração pontual | A: expansão exige spec própria |
| 2 | Valores-alvo de luz (ambient, jogador, tocha, braseiro, flicker) | A) definir antes; B) após baseline por bioma | B: sem baseline não há como julgar |
| 3 | Objetivos visuais (Escopo) como critério de aceite humano | A) aceitar; B) reescrever | A |
| 4 | Ordem frente ao ADR 0005 (escuridão por Light2D, overlay ou ambos) | A) decidir o 0005 antes; B) calibrar só `ambientColor` | A: o valor de `ambientColor` depende da opção |

## Escopo
- Calibrar `ambientColor` por bioma (separação entre piso, entidades e efeitos).
- Calibrar `playerLightRadius` e `playerLightColor` sem alterar a redução por HP.
- Calibrar `torchRadius`, `torchColor` e o multiplicador de braseiros.
- Garantir transição suave da cascata com `floorDepth`.
- Ajustar o flicker para evitar oscilação mecânica ou mudança abrupta de raio.
- Manter o fallback sem WebGL ou com pós-processamento desligado; garantir que objetos com Light2D recebem o pipeline sem tentativa repetida; limpar luzes na troca de andar e no shutdown.
- Composição: ambiente define clima sem substituir a leitura dos objetos; luz do jogador apoia navegação sem apagar sombras; tochas com legibilidade local maior que o ambiente; braseiros com maior raio sem manchas estouradas; luz de impacto crítico breve, sem alterar o ambiente persistente.

## Fora de escopo
Novas luzes além das previstas; normal maps novos; mudança de projeção; decidir o ADR 0005.

## Arquivos e contratos
**Alterar:** `src/game/systems/{LightingSystem,LightingPolish}.ts` e seus `*.test.ts`. **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md` e `Verificado em`. **Não tocar:** `MAX_ACTIVE_BLOOM_TARGETS = 16`; regra de redução de luz por HP; nenhum asset novo. Valores calibrados novos: "a definir" (questão 1).

## Critérios de aceite
Todos provisórios.
- **IL-1** Quando o andar muda ou a cena reinicia, o LightingSystem deve manter a mesma quantidade de luzes de uma sessão limpa (provisório).
- **IL-2** Enquanto o HP do jogador está baixo, o LightingSystem deve manter o raio da luz do jogador maior que zero (provisório).
- **IL-3** Enquanto duas tochas estão ativas, o LightingSystem deve aplicar flicker com fases diferentes entre elas (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| IL-1, IL-3 | `LightingSystem.test.ts`: contagem de luzes após troca de andar; fases do flicker |
| IL-2 | `LightingSystem.test.ts` com HP mínimo. Sensação visual: não validado, precisa de playtest humano |
| Calibração visual | Tabela antes/depois por bioma. Não validado: precisa de playtest humano |

## Questões em aberto
1. Valores calibrados de `ambientColor`, raio e cor do jogador, tocha, braseiro e flicker: "a definir" após o baseline.
2. Como a escuridão é obtida (ADR 0005): define o alvo.
3. Raio mínimo da luz do jogador com HP baixo e período mínimo do flicker (IL-2, IL-3): sem número na spec original.
4. Quem valida o aceite visual: ver [feature-validacao-grafica-e-lifecycle](feature-validacao-grafica-e-lifecycle.md) (decisão 3 e 4 lá).

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 4; ADR 0005 aprovado.
- Questões 1 a 3 respondidas.

## Referências
- [Iluminação e efeitos](../../gameplay/lighting-and-effects.md)
- [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0013](../../decisions/0013-metas-de-performance.md)
- [bug-iluminacao-e-efeitos-sem-consumidor](bug-iluminacao-e-efeitos-sem-consumidor.md)
