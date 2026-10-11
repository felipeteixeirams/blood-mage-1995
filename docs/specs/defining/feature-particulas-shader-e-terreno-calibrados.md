# Partículas, shader de árvores e terreno procedural calibrados

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; nada executado): `AdvancedParticles` (`src/game/systems/AdvancedParticles.ts`) existe com os nove emissores, lê `lowPerformanceParticles` do store e `emitDirectional` restaura a rotação do emissor (teste existe); `AtmosphericTreeShader` e `TerrainDetailFactory` existem com testes. Faltam: calibração de quantidade, lifespan, escala, velocidade e paleta; emissores vivos após `stopAll`/`stopAmbient`/troca de cena (a verificar); teste de ausência de `Graphics`/texturas após o bake.
**Origem:** dividida da spec feature-polimento-grafico-calibracao (2026-10-11)

## Contexto
Frentes G e H do polimento gráfico. Os emissores usam configurações diferentes de velocidade, gravidade, escala, alpha e lifespan; o trabalho é harmonizar comportamento e timing, não criar famílias novas. Padrão a manter: `bake once, render many`. Satélites: [iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md); skill `phaser-4-procedural-generation`. Independente das outras filhas.

## Objetivo
Calibrar os emissores, o shader de árvores e as texturas assadas existentes por parâmetros e timing, sem novos emissores, texturas ou aumento de custo por frame.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `AdvancedParticles` lê `lowPerformanceParticles` do store | `src/game/systems/AdvancedParticles.ts` (linha 101) | 2026-10-11 |
| Existem testes de `AdvancedParticles`, `AtmosphericTreeShader` e `TerrainDetailFactory` | `src/game/systems/*.test.ts`, `src/game/shaders/AtmosphericTreeShader.test.ts` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: sem novos emissores, texturas ou aumento de densidade | A) fechado; B) permitir pontual | A: expansão exige spec própria |
| 2 | Valores-alvo (quantidade por `intensity`, lifespan, escala, velocidade, gravidade, alpha, vento, AO, paleta) | A) definir antes; B) após baseline por bioma | B: sem baseline não há como julgar |
| 3 | Objetivos visuais (Escopo) como critério de aceite humano | A) aceitar; B) reescrever | A |

## Escopo
**Partículas (G)** — emissores `blood_splatter`, `bone_dust`, `acid_splash`, `spectral_burst`, `critical_hit`, `atmospheric_fog`, `torch_embers`, `forest_pollen`, `spell_trail`:
- Calibrar quantidade por `intensity` sem picos abruptos; harmonizar lifespan e fade; ajustar escala inicial/final para baixa resolução.
- Refinar velocidade, gravidade e ângulo dos emissores direcionais; separar sangue, poeira, ácido, energia e crítico por alpha e tint dos recursos existentes.
- Manter a ordem de profundidade existente e a redução em `lowPerformanceParticles`; reutilizar emissores (nunca um por impacto).
- Corrigir emissores vivos após `stopAll`, `stopAmbient` ou troca de cena.

**Shader e terreno (H)**
- Ajustar intensidade e velocidade do vento, fog e iluminação direcional do `AtmosphericTreeShader` sem descolar a árvore do chão; AO aproximada com volume e sem bordas pretas.
- Preservar variação procedural e seeds; ajustar paleta e contraste das texturas assadas; reduzir repetição por escala, rotação e variação existentes; sem criar `Graphics` por frame.

## Fora de escopo
Novos tipos de partículas ou texturas; novas famílias de assets; normal maps novos; novo sistema de materiais; mudança da arquitetura de geração; aumento de densidade de partículas como primeira resposta.

## Arquivos e contratos
**Alterar:** `src/game/systems/{AdvancedParticles,TerrainDetailFactory}.ts`, `src/game/shaders/AtmosphericTreeShader.ts` e os `*.test.ts` correspondentes. **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md` e `Verificado em`. **Não tocar:** texturas e emissores existentes (lista acima), seeds, nenhum asset novo. Valores calibrados novos: "a definir".

## Critérios de aceite
Todos provisórios.
- **PT-1** Quando a intensidade de `emit` aumenta, o AdvancedParticles não deve emitir menos partículas (provisório).
- **PT-2** Quando `stopAll` é chamado ou a cena encerra, o AdvancedParticles não deve manter emissor ativo (provisório).
- **PT-3** Se `lowPerformanceParticles` é `true`, então o AdvancedParticles deve emitir menos partículas que no modo normal (provisório).
- **PT-4** Durante o gameplay, o AtmosphericTreeShader e o TerrainDetailFactory não devem criar `Graphics` nem texturas depois do bake (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| PT-1, PT-2, PT-3 | `AdvancedParticles.test.ts` |
| PT-4 | `TerrainDetailFactory.test.ts` e `AtmosphericTreeShader.test.ts` (contagem de `add.graphics`/`textures.addCanvas` após o bake) |
| Calibração visual | Cenas 5 e 7 da spec de validação. Não validado: precisa de playtest humano |

## Questões em aberto
1. Valores calibrados de partículas, vento, AO e paleta: "a definir" após o baseline.
2. Metas de performance (ADR 0013).
3. Emissores realmente continuam vivos após `stopAll`/`stopAmbient`/troca de cena? Não verificado; PT-2 cobre o resultado.

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 3.
- Questões 1 a 3 respondidas.

## Referências
- [Iluminação e efeitos](../../gameplay/lighting-and-effects.md), [sistemas de mundo](../../architecture/world-systems.md)
- [ADR 0013](../../decisions/0013-metas-de-performance.md); skills `phaser-4-fx-filters`, `phaser-4-procedural-generation`
