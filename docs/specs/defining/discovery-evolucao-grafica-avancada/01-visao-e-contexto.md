# Evolução gráfica avançada: visão, decisões e contexto (parte 1)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): o Eixo A já está em boa parte implementado (`PostFXSystem`, `LightingSystem`, `LightingPolish`, normal maps procedurais); falta o que a parte 2 lista. Eixos B e C são cobertos por outras specs (parte 3). Phaser `^4.2.1` e Vite `^7.3.2` em `package.json`.

Parte 1 de 5. Índice das partes: [README](README.md).

## Contexto
A hipótese desta discovery: com Phaser 4.2.1 e WebGL, filtros de pós-processamento e iluminação dinâmica 2D (`Light2D`) com normal maps procedurais podem elevar o visual ao nível de Diablo e Dungeon Siege sem depender de centenas de sprites externos, sem custar FPS em mobile.

O original foi escrito quando os efeitos operavam por overlays 2D. Hoje (verificado em 2026-10-11):
- `PostFXSystem` aplica Vignette, ColorMatrix e Displacement por `camera.filters` (`src/game/systems/PostFXSystem.ts`).
- `LightingSystem` usa `scene.lights` (Light2D) com luz do jogador, tochas e cor ambiente por andar, só com WebGL (`src/game/systems/LightingSystem.ts`).
- `LightingPolish` aplica filtro Glow por objeto, limitado a 16 alvos simultâneos, e `Enemy.applyEliteGlow` faz o mesmo em elites.
- `generateNormalMap` (Sobel simplificado) gera normal maps procedurais; `addTextureWithNormalMap` os registra para 11 inimigos, tiles de chão, parede, porta e madeira, baú e altar (`src/utils/textureGenerator.ts`).
- `ScreenEffects` (canvas 2D) ainda existe, mas seu `render` nunca é chamado ([lighting-and-effects](../../../gameplay/lighting-and-effects.md)), então não é um fallback funcional.

## Objetivo
Se aprovada, a parte do Eixo A que falta (Pixelate, bloom por evento, Light2D em mais objetos, self-shadow, limite de luzes, toggle de qualidade e medição de FPS) é entregue sobre a base atual, e os Eixos B e C seguem nas specs que os cobrem.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0005](../../../decisions/0005-iluminacao-escuridao-e-vinheta.md) | Light2D como único mecanismo de escuridão e vinheta; destino do overlay morto | Proposta |
| [0006](../../../decisions/0006-audio-e-conquistas.md) | Áudio só pelo `soundEngine` (Eixo C) | Proposta |
| [0013](../../../decisions/0013-metas-de-performance.md) | Meta de FPS (60 em "dispositivo médio") e bundle | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Vignette, ColorMatrix e Displacement via `camera.filters.external` ou `internal`, só com WebGL | `src/game/systems/PostFXSystem.ts` | 2026-10-11 |
| Não há Pixelate nem Bloom nativo; o "bloom" é Glow por sprite (`MAX_ACTIVE_BLOOM_TARGETS` = 16) | `src/game/systems/LightingPolish.ts` | 2026-10-11 |
| `setLighting(true)` só é chamado em `Enemy.ts`; nenhum `setSelfShadow` nem `maxLights` em `src/` | busca em `src/` | 2026-10-11 |
| `postProcessingEnabled` existe nas configurações, sem controle na UI | `src/types/game.ts`, `docs/gameplay/lighting-and-effects.md` | 2026-10-11 |
| Normal map não existe para o jogador (`spr_bloodmage` é arte física) | `src/utils/textureGenerator.ts` (nenhum `addTextureWithNormalMap('spr_bloodmage'`) | 2026-10-11 |
| `ScreenEffects.render` nunca é chamado | `docs/gameplay/lighting-and-effects.md` | 2026-10-11 |

## Decisões a confirmar
Propostas sem aprovação registrada; nada aqui está decidido.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Priorização dos eixos | A) Eixo A primeiro; B) B ou C antes | A: valida o teto procedural antes de gastar em arte externa |
| 2 | Filtros postFX e Light2D com normal maps procedurais | A) estender o que existe; B) manter como está | A, mantendo o toggle de qualidade |
| 3 | Gatilho de ativação dos Eixos B e C | A) só com orçamento de arte e áudio aprovados; B) preparar a infraestrutura antes | A para arte; B só para a infraestrutura de AES |
| 4 | Fallback sem WebGL | A) remover `ScreenEffects` ou religá-lo; B) manter morto | Decidir junto ao ADR 0005 (mesmo assunto) |
| 5 | Pixelate | A) usar nos limites de cena; B) não usar | B até haver playtest: pode brigar com `pixelArt: true` |
| 6 | Bloom por evento (crítico, execução) | A) Glow existente; B) filtro novo | A: o Phaser 4 não tem `addBloom` nativo |
| 7 | Self-shadow | A) adotar; B) manter `ShadowSystem` (elipse) | B até medir custo de FPS |

## Fora de escopo
- Arte externa, atlas e carga por cena (Eixo B, [AES](../discovery-assets-externos-e-sprites.md)).
- Áudio físico e trilha composta (Eixo C, [UIA parte 3](../discovery-ui-e-assets-externos/03-audio.md)).
- Mudar a mecânica de combate ou o balance.

## Referências
Ver [parte 4](04-matriz-riscos-referencias.md).
