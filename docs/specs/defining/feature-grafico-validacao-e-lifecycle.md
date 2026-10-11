# Validação gráfica, ordem de renderização e lifecycle

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática; `node_modules` ausente, nada executado): existem as profundidades sombra 8, reflexo 12, ground fog 750, upper haze 1995 e clima 1996 nos sistemas, e testes dos oito sistemas gráficos; `PostFXSystem.test.ts` cobre callbacks tardios só para dano crítico e infecção. Faltam: baseline visual e de performance (Fase 0), teste das constantes de profundidade, lifecycle por sistema em shutdown/reinício/troca de onda e mapa, smoke WebGL e comparação antes/depois.
**Origem:** dividida da spec feature-polimento-grafico-calibracao (2026-10-11)

## Contexto
Frente I e parte transversal (estratégia, orçamento de performance e testes) do polimento gráfico. É a spec de verificação das filhas [glow e pós-processamento](feature-grafico-glow-e-pos-processamento-calibrados.md), [calibração visual por bioma](feature-grafico-calibracao-visual-por-bioma.md) (luz, atmosfera, sombras, reflexos, partículas, shader e terreno): a Fase 0 (baseline) precede as calibrações e a comparação final as sucede; os critérios de lifecycle e profundidade são implementáveis sozinhos. O HUD é React por cima do canvas: a ordem de profundidade vale só entre objetos do mundo. Satélites: [sistemas de mundo](../../architecture/world-systems.md), [performance](../../engineering/performance.md); bug relacionado: [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md); [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md) tem o aviso de áudio, sem relação com esta spec.

## Objetivo
Garantir ordem de renderização estável, limpeza sem efeitos residuais e validação antes/depois com orçamento de performance medido.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance (FPS, memória, draw calls) | Proposta |
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Iluminação: escuridão e vinheta | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `ShadowSystem` depth 8; `ReflectionSystem` depth 12 | `src/game/systems/ShadowSystem.ts` (121), `ReflectionSystem.ts` (62) | 2026-10-11 |
| `AtmosphereSystem`: ground fog 750, upper haze 1995, clima 1996 | `src/game/systems/AtmosphereSystem.ts` (113, 121, 175) | 2026-10-11 |
| `cleanup()` do `LightingPolish` limpa filtros, `bloomTargets` e luzes de Glow | `src/game/systems/LightingPolish.ts` (543-562) | 2026-10-11 |
| Existem testes dos 8 sistemas gráficos | `src/game/systems/*.test.ts`, `src/game/shaders/AtmosphericTreeShader.test.ts` | 2026-10-11 |
| Scripts `verify`, `typecheck`, `test`, `build`, `e2e` existem (`e2e` não validado nesta sessão) | `CLAUDE.md` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Escopo fechado: sem sistema novo, asset novo ou aumento de limites (16 Glow) | A) fechado; B) abstração pontual | A: expansão exige spec própria |
| 2 | Metas numéricas de performance (FPS mínimo, frame time, memória) | A) usar o ADR 0013 quando aprovado; B) definir aqui | A: evita duas fontes de meta |
| 3 | Quem valida o aceite visual e como | A) responsável com tabela antes/depois das 10 cenas; B) só testes automatizados | A: contraste e legibilidade não são testáveis por máquina |
| 4 | Objetivos de qualidade visual como critério de aceite humano | A) aceitar; B) reescrever | A, validados com as 10 cenas |

## Escopo
- **Fase 0 (baseline):** registrar o comportamento atual em WebGL nas cenas de referência (exploração por bioma, tocha e braseiro, HP alto e baixo, elite/boss, crítico, poça de sangue, clima e floresta); medir FPS, frame time e quantidade aproximada de partículas, luzes e alvos Glow; confirmar o warning 404 já observado, sem atribuí-lo a esta spec.
- Verificar profundidades relativas (piso, sombras, poças, reflexos, entidades, partículas, ground fog, upper haze) e ordem estável de atualização no `GameScene`.
- Evitar que transição de bioma recrie objetos sem destruir o estado anterior; confirmar que shutdown, destroy, troca de onda e de mapa limpam luzes, filtros, tweens, emissores, sombras, reflexos e callbacks atrasados.
- Manter fallback Canvas/headless para testes e a separação React (UI) e Phaser (mundo).
- Smoke tests: cena inicia em WebGL e em Canvas/headless; sequência de exploração, combate, impacto e morte sem tela preta, 404 novo nem erro de ciclo de vida.
- Validação visual antes/depois nas 10 cenas: `fosso_chagas`, `catacumbas_martires`, `santuario_sangue`, `safe_house`, `gloomy_woods`, tocha e braseiro, elite/boss, poça com entidade refletida, HP baixo, baixa performance; aceite por contraste, legibilidade, coerência cromática, ancoragem espacial, ausência de artefatos e de efeitos residuais, identidade procedural.
- Guardrails de performance: 60 FPS desktop e objetivo em mobile (degradar por configurações existentes); sem criar `Graphics`, texturas, emissores ou luzes por frame; sem crescimento contínuo de objetos, listeners, tweens ou emissores após troca de onda ou reinício; `lowPerformanceParticles` continua reduzindo custo.

## Fora de escopo
Calibração dos valores de cada frente (filhas); produção de arte; migração de engine; novas features; aumento do limite de Glow, luzes ou partículas como solução primária.

## Arquivos e contratos
**Alterar:** `src/game/scenes/GameScene.ts` (só ordem de atualização e limpeza, sem acumular lógica; ver `docs/engineering/risky-files.md`), os oito sistemas gráficos só para corrigir lifecycle, e `*.test.ts` correspondentes; teste novo das constantes de profundidade. **Atualizar no mesmo commit:** `docs/gameplay/lighting-and-effects.md`, `docs/architecture/world-systems.md` se a ordem mudar, e `Verificado em`. **Não tocar:** `assetManifest.json`; APIs públicas do `PostFXSystem`. Comandos: `pnpm run typecheck`, `pnpm run test`, `pnpm run build`, `pnpm run verify`.

## Critérios de aceite
Todos provisórios.
- **VG-1** O GameScene deve manter a ordem de profundidade sombra 8, reflexo 12, entidades 20 ou mais, ground fog 750, upper haze 1995 e clima 1996 (provisório).
- **VG-2** Quando uma run reinicia, o GameScene não deve duplicar luzes, sombras, reflexos, emissores nem tweens (provisório).
- **VG-3** Quando a cena encerra, o PostFXSystem não deve executar callbacks atrasados de efeitos temporários (provisório).
- **VG-4** O polimento não deve criar sistema novo nem adicionar asset ao `assetManifest.json` (provisório).
- **VG-5** Se `pnpm run verify` falha, então a entrega não deve ser considerada concluída (provisório).
- **VG-6** Enquanto a cena roda em WebGL, o frame time não deve piorar de forma sustentada em relação ao baseline (provisório; número em aberto).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| VG-1 | Teste que lê as constantes de profundidade dos sistemas; conferência manual das 10 cenas |
| VG-2, VG-3 | Teste de lifecycle por sistema (shutdown e reinício) e smoke Playwright (`pnpm run e2e`, não validado nesta sessão) |
| VG-4 | Revisão do diff: nenhum arquivo novo em `src/game/systems/`; `assetManifest.json` sem chave nova |
| VG-5 | `pnpm run typecheck`, `pnpm run test`, `pnpm run build`, `pnpm run verify` |
| VG-6 | Frame time antes/depois nas 10 cenas. Não validado: precisa de playtest humano |
| Melhoria visual | Tabela antes/depois das 10 cenas revisada pelo responsável. Não validado: precisa de playtest humano |

## Questões em aberto
1. Metas de performance: FPS mínimo, frame time e limite de objetos Phaser (ADR 0013); número do VG-6.
2. O warning 404 já observado: origem não identificada (baseline da Fase 0).
3. Como a escuridão é obtida (ADR 0005), pois afeta o baseline de iluminação.
4. Formato e responsável da tabela antes/depois (decisão 3).
5. Confirmar que os testes novos cobrem os mocks pela API real do Phaser 4.2.1 (depende de [feature-grafico-glow-e-pos-processamento-calibrados](feature-grafico-glow-e-pos-processamento-calibrados.md), questão 2).

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 4; ADRs 0005 e 0013 aprovados.
- Questões 1 a 5 respondidas.
- Ambiente com `pnpm install` e WebGL para medir o baseline.

## Referências
- [Sistemas de mundo](../../architecture/world-systems.md), [performance](../../engineering/performance.md), [iluminação e efeitos](../../gameplay/lighting-and-effects.md)
- [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md), [ADR 0013](../../decisions/0013-metas-de-performance.md)
- [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md), [bug-audio-bgmgain-e-temas](bug-audio-bgmgain-e-temas.md)
- Skills `phaser-4-fx-filters`, `phaser-4-playtest-harness`
