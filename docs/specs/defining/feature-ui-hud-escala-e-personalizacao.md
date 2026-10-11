# Escala e personalização do HUD mobile

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** C
**Depende de:** ADR 0004
**Prioridade:** P2 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): classes `safe-area-*` em `src/index.css` (l.69-82, margens 16 px vertical e 20 px horizontal) usadas em `src/components/GameplayHUD.tsx` (topo, esquerda, direita e canto inferior, l.547/575); `virtualStickScale`, `leftHandedMode`, `floatingStick`, `virtualControlsOpacity` em `src/types/game.ts`. Faltam escala global do HUD, tamanho de botões e âncoras livres.
**Origem:** dividida da spec feature-evolucao-de-ui-e-terreno (2026-10-11)

## Contexto
O HUD já respeita safe area e tem configurações de joystick, mas não há escala global nem posição livre. Controles e orientação: [ADR 0004](../../decisions/0004-controles-mobile-e-orientacao.md). Independente das specs irmãs ([câmera](feature-grafico-camera-e-escala-de-entidades.md), [mira](feature-controles-mira-e-alvo-inteligente.md), terreno).

## Objetivo
Se aprovada, o jogador ajusta escala, opacidade, tamanho de botões e posição do HUD, com margens de safe area consistentes.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0004](../../decisions/0004-controles-mobile-e-orientacao.md) | Controles mobile e orientação | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| Safe area já aplicada ao canto inferior (cluster de ações e joystick) | `GameplayHUD.tsx` l.547, 575; `index.css` l.69-82 | 2026-10-11 |
| Margens atuais: 16 px vertical, 20 px horizontal | `src/index.css` l.69-79 | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 3 | Escala/opacidade/diâmetro/posição do HUD | A) tudo; B) só o que já existe | B; o resto depende de playtest mobile |

## Escopo
Depende da decisão 3; valores vêm da proposta original.
- Margens `env(safe-area-inset-*)` de 16 px (vertical) e 24 px (horizontal); minimapa e status no canto superior esquerdo, habilidades no inferior direito, joystick no inferior esquerdo.
- HUD: escala global 80%-120%, opacidade 30%-100%, botões de 48 a 72 px, âncoras livres de joystick e feitiços.

## Fora de escopo
Alterar o joystick flutuante e a orientação (ADR 0004); câmera, mira e terreno (specs irmãs).

## Arquivos e contratos
- Alterar (conforme decisão 3): `src/components/GameplayHUD.tsx`, `src/index.css`, `src/types/game.ts` e `src/utils/localStorage.ts` (novas configurações, com schema Zod).
- Não tocar: `GameScene.ts`, `Player.ts`; arquivos de alto risco só conforme `docs/engineering/risky-files.md`. Toda persistência passa por `localStorage.ts`.
- Contratos e valores: os da seção Escopo.
- Atualizar no mesmo commit: [hud](../../ui/hud.md) e `Verificado em`.

## Critérios de aceite
Todos provisórios; dependem da decisão 3.
- **HU-1** O HUD React deve manter os elementos fora das áreas de safe area com as margens de 16 px e 24 px (provisório).
- **HU-2** Quando o jogador altera a escala do HUD, o HUD React deve aplicá-la entre 80% e 120% e persisti-la pelo `localStorage.ts` (provisório).
- **HU-3** Se o valor de escala salvo estiver fora de 80%-120%, então o localStorage deve usar o padrão (provisório).

## Plano de verificação
| Critério | Como verificar |
|---|---|
| HU-1 | inspeção de `GameplayHUD.tsx`; manual em aparelho com notch (não validado: precisa de playtest humano) |
| HU-2, HU-3 | teste de schema em `src/utils/localStorage.test.ts` |

## Questões em aberto
- Margem de safe area: a proposta traz 24 px horizontal; o código usa 20 px.
- Valor padrão da escala do HUD (não definido na original).
- Opacidade, tamanho de botões e âncoras livres não têm critério até a decisão 3.

## Pendências para promover a backlog
- Aprovação do responsável.
- Decisão 3 respondida; ADR 0004 aprovado.
- Questões em aberto resolvidas; critérios sem a marca (provisório).

## Referências
[hud](../../ui/hud.md) · [modals-and-screens](../../ui/modals-and-screens.md) · [input-and-controls](../../ui/input-and-controls.md) · [0004](../../decisions/0004-controles-mobile-e-orientacao.md)
