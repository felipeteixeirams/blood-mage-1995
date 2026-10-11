# Gráficos avançados: fallback Canvas e normal map do jogador (Eixo A)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): já existem `PostFXSystem.ts` (vinheta, ColorMatrix por bioma, Displacement, guarda WebGL, `PostFXSystem.test.ts`), `LightingSystem.ts` (Light2D, no-op fora de WebGL ou com `postProcessingEnabled` falso), `generateNormalMap`/`addTextureWithNormalMap` em `textureGenerator.ts` (chão, paredes, porta e 10 inimigos) e a flag `postProcessingEnabled` (`types/game.ts:275`, `localStorage.ts:217,245`, lida em `GameScene.ts:297,306`). Faltam: normal map de `spr_bloodmage` e desenho do fallback Canvas (`ScreenEffects.render`). Toggle de UI e `darknessOverlay` têm spec/ADR próprios.

## Contexto
Phaser 4.2.1 oferece `camera.filters` e `LightsPlugin`; o jogo os usa com texturas procedurais e sem assets externos. Lacunas atuais:

- `spr_bloodmage` é registrado por `addSpriteSheet` (`textureGenerator.ts:416`), sem normal map.
- `ScreenEffects.render(gameCanvas)` (`ScreenEffects.ts:195`) não é chamado em lugar nenhum; sem WebGL, os efeitos Canvas não aparecem.
- `darknessOverlay` é desenhado em `create()` (`GameScene.ts:327-331`) e apagado todo frame (`:1845`): ver [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md).
- Não há toggle de `postProcessingEnabled` (a chave i18n `settings.postProcessing` existe sem uso) e a flag é lida só na criação: ver [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md), item 3 (não duplicado aqui).

## Objetivo
Sem WebGL, o jogo mantém um visual funcional por fallback; com WebGL, o jogador recebe normal map coerente com os inimigos.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Escuridão e vinheta (destino do `darknessOverlay` e do fallback) | Proposta |
| [0013](../../decisions/0013-metas-de-performance.md) | Metas de performance (60 FPS) | a conferir |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `PostFXSystem` delega a `ScreenEffects` quando o renderer não é WebGL | `src/game/systems/PostFXSystem.ts:9-11,56-58` | 2026-10-11 |
| `ScreenEffects.render` não tem chamador | `grep -rn "\.render(" src/game` (só texturas dinâmicas) | 2026-10-11 |
| `spr_bloodmage` sem normal map | `src/utils/textureGenerator.ts:416` | 2026-10-11 |
| Normal map existe para `tile_ground*`, paredes, `tile_door` e 10 inimigos | `src/utils/textureGenerator.ts:142-1742` | 2026-10-11 |
| A config de iluminação por bioma está em `LightingSystem` (`BIOME_LIGHTING`), não no `WorldManager` | `src/game/systems/LightingSystem.ts:22` | 2026-10-11 |
| Suporte a normal map em spritesheet (`addSpriteSheet`) no Phaser 4.2.1 | não verificado | pendente |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Fallback Canvas | A) chamar `ScreenEffects.render` no fluxo Canvas; B) assumir WebGL e remover o fallback | A: preserva o contrato do `PostFXSystem`; B exige decidir o ADR 0005 antes |
| 2 | Normal map de `spr_bloodmage` | A) gerar por frame do spritesheet; B) não fazer | B: a origem é arte PixelLab (ver `CLAUDE.md`), não procedural; reavaliar com o Eixo B |
| 3 | Expor config de iluminação no `WorldManager` | A) expor; B) manter em `LightingSystem` | B: evita duplicar a tabela (decisão 2 do bug de iluminação) |
| 4 | Verificação de FPS e regressão visual | A) `PerformanceMonitor` + E2E; B) só manual | A: coerente com o ADR 0013 |

## Escopo
- Desenhar o fallback Canvas dos efeitos quando o renderer não é WebGL (decisão 1).
- Normal map do jogador, se a decisão 2 = A e o fato do spritesheet for verificado.
- Testes unitários da lógica pura do fallback.

## Fora de escopo

## Arquivos e contratos
- Alterar (conforme decisões): `src/game/scenes/GameScene.ts` (chamada de `screenEffects.render`), `src/game/systems/ScreenEffects.ts`, `src/utils/textureGenerator.ts` (só se decisão 2 = A), testes correspondentes.
- Atualizar: `docs/gameplay/lighting-and-effects.md` e `Verificado em`.
- Não tocar: API pública do `PostFXSystem`, `Player.ts`, `localStorage.ts` (a flag já existe).
- Contrato: `ScreenEffects.render(gameCanvas: HTMLCanvasElement): void`, chamado após o render do jogo, só em renderer Canvas.

## Critérios de aceite
- **GA-1** Enquanto o renderer não é WebGL, o `GameScene` deve chamar `ScreenEffects.render` a cada frame. (provisório)
- **GA-2** Enquanto o renderer é WebGL, o `GameScene` não deve chamar `ScreenEffects.render`. (provisório)
- **GA-3** Se `ScreenEffects.render` lança exceção, então o `GameScene` deve seguir o frame sem interromper o jogo. (provisório)
- **GA-4** Quando as texturas do jogador são geradas, o `textureGenerator` deve associar um normal map a `spr_bloodmage`. (provisório; só se decisão 2 = A)
- **GA-5** Se o renderer não suporta normal map para o spritesheet, então o `textureGenerator` deve manter a textura sem normal map e sem lançar erro. (provisório)
- **GA-6** O `GameScene` deve iniciar em Canvas e em WebGL sem erro no console. (provisório)

## Plano de verificação
| Critério | Como verificar |
|---|---|
| GA-1 a GA-3 | teste unitário com renderer simulado (`isWebGL` falso e verdadeiro) |
| GA-4, GA-5 | `textureGenerator.test.ts`: chave do normal map presente ou ausente |
| GA-6 | `pnpm run e2e` (não validado nesta sessão) |
| Aparência dos efeitos, 60 FPS | não validado: precisa de playtest humano |

## Questões em aberto
- Aprovação de produto e decisões 1 a 4.
- Fato a verificar: normal map em spritesheet no Phaser 4.2.1.
- Como o fallback Canvas desenha o escurecimento depende do ADR 0005.

## Pendências para promover a backlog
- Aprovação do responsável e decisões 1 a 4.
- ADR 0005 Aprovado; item 3 do bug de iluminação resolvido ou decidido.
- Verificar o fato do spritesheet e conferir a meta de FPS (ADR 0013).

## Referências
- [lighting-and-effects](../../gameplay/lighting-and-effects.md), [bug-grafico-iluminacao-e-efeitos-sem-consumidor](bug-grafico-iluminacao-e-efeitos-sem-consumidor.md), [ADR 0005](../../decisions/0005-iluminacao-escuridao-e-vinheta.md)
- [discovery-grafico-evolucao-pendente](discovery-grafico-evolucao-pendente.md)
