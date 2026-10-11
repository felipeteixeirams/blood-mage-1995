# Polimento gráfico por calibração dos sistemas existentes (parte 1: contexto, decisões e escopo)

**Mestre:** [feature-polimento-grafico-calibracao](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): parcial. Existem as correções de integração das Frentes A e B e os sistemas com testes: `LightingPolish.applyBloomFilter` (`src/game/systems/LightingPolish.ts`) chama `enableFilters()` uma vez por sprite, limpa o Glow anterior antes de reaplicar, remove no evento `destroy` e em `cleanup()`, com `MAX_ACTIVE_BLOOM_TARGETS = 16` e Glow desligado por `postProcessingEnabled === false` ou `lowPerformanceParticles`; `PostFXSystem.createFilters` usa `camera.filters.external` (com `internal` como alternativa) e guarda `activeFloorDepth`; `PostFXSystem.test.ts` cobre callbacks tardios de `effectCriticalDamage`/`effectInfection`; `AdvancedParticles.emitDirectional` restaura a rotação (teste existe). Faltam: validar `filters.external` no Phaser 4.2.1, Glow em WebGL real, remoção do Glow ao reciclar sem destruir, calibração visual das Frentes C a H, testes de zona líquida do `ReflectionSystem` (só 2 testes), validação antes/depois e orçamento de performance medido.

Parte 1 de 8. Índice: [README](README.md).

## Contexto
O Bloodmage 1995 tem uma camada gráfica procedural ampla: Light2D, Glow, pós-processamento de câmera, cascata de cor por profundidade, névoa por bioma, clima, sombras direcionais, reflexos líquidos, partículas de combate, shader de árvores e texturas assadas (`src/game/systems/`, `src/game/shaders/`; satélites [iluminação e efeitos](../../../gameplay/lighting-and-effects.md) e [sistemas de mundo](../../../architecture/world-systems.md)). Princípio: melhorar o que existe antes de adicionar algo.

Pontos relevantes do código:
- Glow, `filters.external` e `floorDepth` já foram corrigidos (ver "Estado vs código"); falta confirmar em WebGL real e calibrar valores.
- O ADR 0005 (Proposta) registra que o `darknessOverlay` é limpo todo frame em `updateThreatIndicator()`; a calibração da Frente C depende de decidir como a escuridão é obtida.
- O HUD é React por cima do canvas; a ordem de profundidade vale só entre objetos do mundo (parte 2, "Arquivos e contratos").

## Objetivo
Fazer os sistemas gráficos atuais entregarem uma imagem final mais coesa e legível, por correção de integração, calibração de parâmetros e remoção de conflitos entre efeitos, sem novos sistemas, assets ou aumento de custo por frame.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação: escuridão e vinheta no gameplay | Proposta |
| [0013](../../../decisions/0013-metas-de-performance.md) | Metas de performance (FPS, memória, draw calls) | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `applyBloomFilter` chama `enableFilters()` só se `sprite.filters` não existe, limpa o Glow anterior, adiciona o alvo a `bloomTargets` e remove no evento `destroy` | `src/game/systems/LightingPolish.ts` (linhas 76-107) | 2026-10-11 |
| `cleanup()` limpa o filtro de cada alvo, esvazia `bloomTargets` e remove as luzes de Glow | `src/game/systems/LightingPolish.ts` (linhas 543-562) | 2026-10-11 |
| `PostFXSystem` usa `filters.external \|\| filters.internal` e guarda `activeFloorDepth` (padrão de `applyBiomeMatrix`) | `src/game/systems/PostFXSystem.ts` (linhas 42, 69-70, 147) | 2026-10-11 |
| `ShadowSystem` usa `footY = entity.y + entityHeight * 0.38` e `depth 8` | `src/game/systems/ShadowSystem.ts` (linhas 84, 121) | 2026-10-11 |
| `ReflectionSystem` usa `depth 12` e `setFrame(entity.frame.name)` | `src/game/systems/ReflectionSystem.ts` (linhas 62, 117) | 2026-10-11 |
| `AtmosphereSystem`: ground fog `depth 750`, upper haze `1995`, partículas de clima `1996` | `src/game/systems/AtmosphereSystem.ts` (linhas 113, 121, 175) | 2026-10-11 |
| `AdvancedParticles` lê `lowPerformanceParticles` do store | `src/game/systems/AdvancedParticles.ts` (linha 101) | 2026-10-11 |
| Existem testes dos 8 sistemas da spec; o de `ReflectionSystem` tem 2 casos | `src/game/systems/*.test.ts`, `src/game/shaders/AtmosphericTreeShader.test.ts` | 2026-10-11 |
| `phaser` declarado como `^4.2.1`; o pacote não está instalado neste ambiente, então a API de filtros do Phaser não foi conferida | `package.json` (`node_modules` ausente) | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: calibrar sistemas existentes sem nova abstração, sistema, asset ou aumento de limites (16 alvos de Glow) | A) fechado; B) permitir abstração pontual | A: nova abstração exige spec própria aprovada |
| 2 | Valores-alvo de calibração (Glow, pós-processamento, luz, atmosfera, sombra, reflexo, partículas) | A) definir antes; B) definir após o baseline da Fase 0, por bioma, com screenshots | B: sem baseline não há como julgar "melhor" |
| 3 | Objetivos de qualidade visual (parte 2) como critério de aceite humano | A) aceitar; B) reescrever | A, validados com as 10 cenas da parte 6 |
| 4 | Metas numéricas de performance (FPS mínimo, frame time, memória) | A) usar o ADR 0013 quando aprovado; B) definir aqui | A: evita duas fontes de meta |
| 5 | Ordem da Frente C frente ao ADR 0005 (escuridão por Light2D, overlay ou ambos) | A) decidir o 0005 antes da Frente C; B) calibrar só `ambientColor` | A: o valor de `ambientColor` depende da opção |
| 6 | Quem valida o aceite visual e como | A) responsável com tabela antes/depois das 10 cenas; B) só testes automatizados | A: contraste e legibilidade não são testáveis por máquina |

## Escopo
Só o que falta (o que já existe está em "Estado vs código"):
- Confirmar contra o Phaser 4.2.1 instalado a coleção de filtros de tela cheia (`external` ou `internal`) e alinhar implementação e mocks de `PostFXSystem.test.ts`.
- Confirmar em WebGL real o Glow (item, magia, monstro forte, portal) e remover o Glow de sprite de pool devolvido sem `destroy`.
- Garantir que `reset()` do `PostFXSystem` preserve a gradação do bioma e que medo, dano crítico e level-up em sequência não deixem tint ou displacement presos.
- Calibrar, por bioma e frente, os valores existentes de: iluminação (`ambientColor`, raio e cor do jogador, tocha e braseiro, flicker), Glow, vignette/ColorMatrix/displacement/tint, atmosfera, sombras, reflexos, partículas, shader de árvores e texturas assadas (valores-alvo: decisão 2).
- Verificar profundidades relativas e limpeza (luzes, filtros, tweens, emissores, sombras, reflexos, callbacks) em shutdown, troca de andar, onda e mapa.
- Registrar baseline antes e depois e ampliar os testes (parte 6).

## Fora de escopo
- Novos sistemas de renderização.
- Novos efeitos visuais com nova API pública.
- Novos tipos de partículas ou novas texturas de partículas.
- Novas luzes além das já previstas pelo `LightingSystem`.
- Normal maps novos, assets externos ou sprites externos.
- Novo sistema de materiais.
- Fog volumétrico 3D ou renderização em Three.js.
- Mudança de projeção, câmera ou composição de gameplay.
- Novos inimigos, magias, biomas ou mecânicas.
- Reescrita do renderer.
- Aumento do número máximo de filtros, luzes ou partículas como solução primária.

Se uma melhoria exigir nova abstração, avaliá-la primeiro como correção do sistema existente; expansão só por nova spec aprovada.
