# Atmosfera, sombras e reflexos calibrados

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; nada executado): `AtmosphereSystem` (ground fog depth 750, upper haze 1995, clima 1996), `ShadowSystem` (`footY = y + altura * 0.38`, depth 8) e `ReflectionSystem` (depth 12, `setFrame(entity.frame.name)`) existem com testes; o de `ReflectionSystem` tem só 2 casos. Faltam: calibração visual, testes de zona líquida, frame sincronizado, interpolação de transição de bioma e limpeza por entidade/zona.
**Origem:** dividida da spec feature-polimento-grafico-calibracao (2026-10-11)

## Contexto
Frentes D, E e F do polimento gráfico. A atmosfera deve ficar subordinada ao gameplay (leitura de inimigos, projéteis, telégrafos, itens e jogador). Sombras e reflexos são sensíveis a pequenos offsets: posição dos pés, profundidade, escala vertical, alpha e rotação. Satélites: [iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md). Tema próximo, não duplicado: [feature-atmosfera-e-tensao](feature-atmosfera-e-tensao.md). Independente das outras filhas; a ordem de profundidade global é verificada em [feature-validacao-grafica-e-lifecycle](feature-validacao-grafica-e-lifecycle.md).

## Objetivo
Melhorar composição das camadas de névoa e clima, ancoragem das sombras e integração dos reflexos à superfície líquida, mantendo os sistemas e texturas atuais.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `ShadowSystem` usa `footY = entity.y + entityHeight * 0.38` e `depth 8` | `src/game/systems/ShadowSystem.ts` (linhas 84, 121) | 2026-10-11 |
| `ReflectionSystem` usa `depth 12` e `setFrame(entity.frame.name)` | `src/game/systems/ReflectionSystem.ts` (linhas 62, 117) | 2026-10-11 |
| `AtmosphereSystem`: ground fog `depth 750`, upper haze `1995`, partículas de clima `1996` | `src/game/systems/AtmosphereSystem.ts` (linhas 113, 121, 175) | 2026-10-11 |
| Existem testes dos três sistemas; o de `ReflectionSystem` tem 2 casos | `src/game/systems/*.test.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: calibrar sem novo sistema, textura ou aumento de limites | A) fechado; B) abstração pontual | A: expansão exige spec própria |
| 2 | Valores-alvo (tint/alpha por bioma, escala, alpha, rotação, offsets) | A) definir antes; B) após baseline por bioma | B: sem baseline não há como julgar |
| 3 | Objetivos visuais (Escopo) como critério de aceite humano | A) aceitar; B) reescrever | A |

## Escopo
**Atmosfera (D)**
- Manter os limites de opacidade do sistema como teto; ajustar tint e alpha por bioma com as configurações existentes.
- Calibrar o movimento das duas camadas para não parecerem texturas independentes deslizando; transições de bioma sem mudança instantânea de cor ou densidade.
- Manter redução de atmosfera em combate intenso e chefe (existência hoje: questão 3), emissor de clima alinhado à câmera, redução em baixa performance e ausência de clima onde não deve aparecer.

**Sombras (E)**
- Calibrar `footY` por escala e altura real; offset inicial sob os pés, não sob o centro; escala para entidades pequenas, grandes e chefes (alturas de referência: questão 4).
- Calibrar rotação projetada sem ângulos exagerados; alpha de contato e sob luz sem virar mancha preta; manter sombra de contato sem fonte influente e a textura/fallback existentes.
- Ocultar, destruir e registrar sombras conforme o lifecycle da entidade; não atualizar entidades inativas.

**Reflexos (F)**
- Calibrar deslocamento a partir dos pés, escala vertical, alpha separado para sangue e água, tint sem apagar a silhueta; ripple senoidal existente com amplitude e frequência discretas.
- Reflexo só na zona líquida; frame e textura sincronizados em objetos animados; limpeza ao remover entidade ou zona; toggle sem reflexos invisíveis consumindo atualização.

## Fora de escopo
Novos sistemas de sombra/reflexo/atmosfera; novas texturas; fog volumétrico 3D; Three.js; mudança de câmera; aumento de limites como solução primária.

## Arquivos e contratos
**Alterar:** `src/game/systems/{AtmosphereSystem,ShadowSystem,ReflectionSystem}.ts` e seus `*.test.ts`. **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md` e `Verificado em`. **Não tocar:** textura de sombra existente, profundidades atuais (sombra 8, reflexo 12, fog 750, haze 1995, clima 1996), nenhum asset novo. Valores calibrados novos: "a definir".

## Critérios de aceite
Todos provisórios.
- **AM-1** O AtmosphereSystem deve manter a opacidade de ground fog e upper haze dentro dos limites definidos no sistema (provisório).
- **AM-2** Quando o bioma muda, o AtmosphereSystem deve interpolar tint e alpha, sem atribuir o valor final em um único frame (provisório).
- **AM-3** Quando a atmosfera é destruída ao trocar de bioma ou mapa, o AtmosphereSystem não deve deixar emissor nem tween ativo (provisório).
- **AM-4** Enquanto a entidade se move ou muda de escala, o ShadowSystem deve manter a sombra ancorada em `footY` (provisório).
- **AM-5** Se não há luz influente, então o ShadowSystem deve manter a sombra de contato sem rotação (provisório).
- **AM-6** O ReflectionSystem deve exibir o reflexo somente enquanto a entidade está dentro da zona líquida (provisório).
- **AM-7** Quando o frame do objeto original muda, o ReflectionSystem deve aplicar o mesmo frame ao reflexo (provisório).
- **AM-8** Quando a entidade é destruída, o ShadowSystem e o ReflectionSystem não devem deixar sprite de sombra nem de reflexo (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| AM-1, AM-2, AM-3 | `AtmosphereSystem.test.ts` (limites, tween de transição, `cleanup`) |
| AM-4, AM-5, AM-8 | `ShadowSystem.test.ts` e `ReflectionSystem.test.ts` (âncora, contato, destruição) |
| AM-6, AM-7 | Novos casos em `ReflectionSystem.test.ts` (dentro e fora da zona; troca de frame) |
| Calibração visual | Cenas 4, 5, 6 e 8 da spec de validação. Não validado: precisa de playtest humano |

## Questões em aberto
1. Valores calibrados (tint, alpha, escala, rotação, offsets, amplitude do ripple): "a definir" após o baseline.
2. Metas de performance (ADR 0013).
3. A redução de atmosfera em combate intenso e chefe existe hoje no `AtmosphereSystem`? Não verificado; AM-1 a AM-3 cobrem só limites, transição e limpeza.
4. Definição de "entidade pequena, grande e chefe" para sombra e reflexo (alturas de referência).

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 3.
- Questões 1 a 4 respondidas; fato da questão 3 verificado.

## Referências
- [Iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md)
- [feature-atmosfera-e-tensao](feature-atmosfera-e-tensao.md), [ADR 0013](../../decisions/0013-metas-de-performance.md)
