# 0005 — Iluminação: escuridão e vinheta no gameplay

**Mestre:** [decisions](README.md)
**Status:** Proposta
**Proposta por:** Claude (Sonnet 5.5), 2026-10-10
**Aprovada por:**
**Specs afetadas:** [feature-eventos-eclipse-de-sangue](../specs/defining/feature-eventos-eclipse-de-sangue.md), [feature-grafico-calibracao-visual-por-bioma](../specs/defining/feature-grafico-calibracao-visual-por-bioma.md), [feature-grafico-efeitos-restantes](../specs/defining/feature-grafico-efeitos-restantes.md), [feature-grafico-validacao-e-lifecycle](../specs/defining/feature-grafico-validacao-e-lifecycle.md)

## Contexto
O `LightingSystem` (Light2D do Phaser 4) descreve, no cabeçalho do arquivo, que em Canvas ou com `postProcessingEnabled` desligado ele vira no-op "e o fallback (`darknessOverlay`) permanece ativo". O código de `GameScene` faz outra coisa:

- `create()` desenha `darknessOverlay` (cor `0x050510`, alpha 0,32) (`GameScene.ts:329-333`), mas `updateThreatIndicator()` chama `darknessOverlay.clear()` (`:1852-1853`), executado todo frame. O overlay é apagado logo após ser criado, portanto **não há escurecimento por overlay em nenhum caminho**, inclusive no fallback descrito.
- A vinheta existe em outros pontos: `PostFXSystem` aplica vinheta fixa 0,40 em `gloomy_woods` (`PostFXSystem.ts:100-103`) e vinheta pulsante por perigo (4+ inimigos em alerta, chefe ativo ou HP <= 25%; `setDangerTension`, chamado todo frame em `GameScene.ts:1849`); `ScreenEffects` aplica vinheta em eventos de dano/morte. Ou seja, "sem vinheta" só vale para o estado calmo fora de `gloomy_woods`.
- A escuridão do bioma vem de `ambientColor` por bioma no Light2D (`LightingSystem.ts` `BIOME_LIGHTING`), só com WebGL e `postProcessingEnabled`.

A única referência na história do repositório para o `clear()` é o commit `058363a` ("Remove passive touch damage and enforce FSM-only combat"), que não trata de iluminação. Não há decisão registrada sobre abrir mão do overlay.

## Opções
| Opção | Prós | Contras |
|---|---|---|
| A. Light2D como único mecanismo; remover o overlay morto e corrigir a descrição do `LightingSystem` | Código e doc coerentes; menos código por frame | Sem Light2D (Canvas ou pós-processamento desligado) não há escurecimento nenhum |
| B. Restaurar o overlay só como fallback (quando Light2D está desligado) | Cumpre o que o cabeçalho promete; atmosfera igual em aparelhos fracos | Mantém duas vias de iluminação; precisa teste visual por bioma |
| C. Restaurar o overlay também com Light2D ligado | Mais escuro, destaca o personagem (era a intenção do comentário original) | Soma com `ambientColor`; muda o visual de todos os biomas |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `darknessOverlay` é criado e desenhado em `create()` | `GameScene.ts:329-333` | 2026-10-10 |
| `darknessOverlay.clear()` roda em `updateThreatIndicator` | `GameScene.ts:1852-1853` | 2026-10-10 |
| Cabeçalho do `LightingSystem` promete fallback pelo `darknessOverlay` | `LightingSystem.ts:7-11` | 2026-10-10 |
| `PostFXSystem.setBiome` liga vinheta 0,40 em `gloomy_woods` | `PostFXSystem.ts:100-103` | 2026-10-10 |
| `setDangerTension` é chamado todo frame | `GameScene.ts:1849` | 2026-10-10 |
| `ambientColor` por bioma em `BIOME_LIGHTING` | `LightingSystem.ts:21-60` | 2026-10-10 |

## Suposições (não verificadas)
- Que o `clear()` é intencional (nenhuma evidência de intenção; o commit que o introduziu trata de outro assunto).
- O resultado visual de cada opção: não validado, precisa de playtest humano em mais de um bioma (regra do `CLAUDE.md`).
- Que `updateThreatIndicator` roda em todos os frames (lido na estrutura de `update()`, não executado).

## Recomendação
**Opção A.** O comportamento observável hoje já é "sem overlay"; remover o código morto e corrigir a descrição evita uma promessa de fallback que não funciona. Se o jogo precisa parecer escuro em aparelhos sem WebGL, escolha B.

## Decisão
_Em branco até o responsável decidir._

## Consequências
- Se A: remover `darknessOverlay` de `GameScene.ts` (arquivo crítico) e atualizar `LightingSystem.ts` e `docs/architecture/game-systems.md`.
- Se B/C: ajuste em `GameScene.ts`, teste visual nos 5 biomas.
