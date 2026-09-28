---
agent_context: frontend, game-designer
target_module: src/game/scenes/GameScene.ts, src/components/GameplayHUD.tsx
priority: low
criticality: low
status: completed
last_updated: 2026-09-28
tags: [design, ui, hud, referencia-visual, mouse, desktop, tier-b]
---

> **Reduzido de uma spec maior em 2026-09-08** (ver
> `docs/architecture/05_SPEC_AND_CONTEXT_DRIVEN_ENGINEERING.md` Seção 6). O
> Tier A desta frente (marcador de NPC, minimap, acabamento de HP/MP,
> cinturão de curativos) já estava 100% codificado e foi movido para
> [[../delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md]]. Tier C (moldura
> pintada à mão, ícones customizados) segue fora de escopo — depende de
> sprites que não existem (ver
> `backlog/08_MAPEAMENTO_COMPLETO_SPRITES_E_CHECKLIST.md`). Este arquivo
> cobre só o item Tier B que sobrou: baixa prioridade, específico de
> desktop com mouse.

# Menu Contextual de Alvo (Hover com Mouse) — Residual Tier B.6

## 1. Contexto

O jogo é mobile-first (ver `docs/specs/discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md`)
e no touch o combate já usa tap direto no alvo — sem necessidade de menu
contextual. Em desktop com mouse, porém, a referência visual de Diablo II
mostra um texto contextual junto ao cursor ao passar sobre um alvo (ex:
"ATACAR", "CONVERSAR"). Hoje isso não existe: o clique já ataca/interage
direto, sem esse feedback intermediário.

## 2. Objetivo

Adicionar um pequeno texto contextual que aparece junto ao cursor do mouse
ao pairar (`hover`) sobre um alvo interativo (inimigo ou NPC) em desktop,
sem alterar o comportamento de clique/toque existente.

## 3. Escopo

### 3.1 Dentro do Escopo (In-Scope)
- Detecção de hover do ponteiro sobre um `Enemy` ou NPC ativo em
  `GameScene.ts` (Phaser já expõe `pointermove` e hit-test de Game Objects
  interativos via `setInteractive()`).
- Um `Phaser.GameObjects.Text` (ou componente React posicionado por
  coordenada de tela, se mais simples de estilizar) mostrando "ATACAR" (
  sobre inimigo) ou "CONVERSAR" (sobre NPC), seguindo o cursor com um
  pequeno offset.
- Aparece só em desktop: gatilho é o evento `pointermove` de mouse: usar a
  mesma checagem de dispositivo já usada pelo joystick virtual (
  `VirtualJoystickSystem`/detecção touch vs mouse) para não desenhar nada
  em sessões touch.

### 3.2 Fora do Escopo (Out-of-Scope)
- Nenhuma mudança no fluxo de toque/clique existente (o ataque continua
  disparando do mesmo jeito).
- Nenhum novo sprite — texto/tipografia apenas, seguindo
  `docs/archive/design/02_UI_PATTERNS.md` (fontes já aprovadas:
  `Cinzel`/`Press Start 2P`/`VT323`/`UnifrakturMaguntia`).
- Nenhuma mudança em mobile/touch.

## 4. Requisitos Técnicos

1. Em `GameScene.ts`, registrar um listener `this.input.on('pointermove',
   ...)` que faz hit-test contra o grupo de inimigos ativos e o grupo de
   NPCs (mesmos grupos já usados pelo raycast de IA/interação).
2. Reutilizar a detecção de dispositivo já existente no projeto para
   touch vs mouse (ver `VirtualJoystickSystem.ts`/`03_PHASER_PATTERNS.md`)
   — só criar/mostrar o texto contextual quando o input ativo for mouse.
3. Texto: `this.add.text(x, y, label, style)` com a paleta Grimdark (ver
   `docs/archive/design/01_VISUAL_IDENTITY.md`), depth acima do mundo mas
   abaixo da UI React (mesma convenção de outros textos flutuantes do
   Phaser no `GameScene.ts`).
4. Destruir/ocultar o texto assim que o ponteiro sai do alvo ou o alvo é
   destruído (mesmo padrão de cleanup usado pelo marcador "!" de NPC em
   [[../delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md]]).

## 5. Arquivos-Alvo
- `src/game/scenes/GameScene.ts` — novo listener `pointermove` + método
  `updateHoverContextLabel()`/`clearHoverContextLabel()` (padrão
  Extract/Delegate se crescer além de ~20 linhas).

## 6. Decisões de Produto Necessárias
Nenhuma — comportamento puramente aditivo, sem ambiguidade de design (a
referência visual já define o texto e o gatilho).

## 7. Testes e Critério de Aceite
- [x] Passar o mouse sobre um inimigo mostra "ATACAR" junto ao cursor;
  sobre um NPC mostra "CONVERSAR".
- [x] Nada aparece em sessão touch (coberto por teste unitário de
  `isDesktopPointerEnvironment()`, não por E2E emulando touch).
- [x] Texto some imediatamente ao tirar o mouse do alvo ou ao o alvo ser
  destruído/desativado.
- [x] `pnpm test` e `pnpm verify` passando; sem regressão de FPS
  perceptível (é só 1 `Text` object, sem novo raycast custoso — hit-test por
  distância euclidiana, não `setInteractive()`, ver Trade-off no changelog).

## 8. Guardrails
- Não altere o fluxo de clique/toque existente em `Player.ts`/`Enemy.ts`.
- Não crie um novo sistema de detecção de dispositivo — reutilize o que já
  existe para touch vs mouse.

## 9. Referências
- [[../delivered/09_HUD_TIER_A_REFERENCIAS_VISUAIS.md]] — resto desta
  frente, já entregue
- `docs/specs/discovery/04_MOBILE_APP_E_MONETIZACAO_INDIE.md` — prioridade
  mobile-first que mantém este item como baixa prioridade
- `docs/archive/design/02_UI_PATTERNS.md` — tipografia e composição de UI

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-25 | Item identificado como Tier B.6 dentro da spec original de HUD | Claude |
| 2026-09-08 | Spec original dividida: Tier A → `delivered/09`; este arquivo reduzido só ao Tier B.6, reescrito no formato Blueprint | Claude |
| 2026-09-28 | Tier B.6 implementado (agente paralelo): menu contextual de alvo no hover do mouse. `GameScene.ts` ganhou `updateHoverContextLabel()`/`clearHoverContextLabel()` — hit-test por distância euclidiana (raio 34px, sem `setInteractive()`, sem tocar em `Enemy.ts`) contra `enemiesGroup`/`npcsGroup`, mostrando "ATACAR"/"CONVERSAR" junto ao cursor (`Phaser.GameObjects.Text`, paleta Grimdark, `scrollFactor(0)`, depth 3000). Só roda em desktop: a spec sugeria reutilizar a detecção touch-vs-mouse de `VirtualJoystickSystem.ts`, mas essa lógica não existe lá — o agente localizou a checagem real em `GameplayHUD.tsx` (`isTouchCapable`) e recriou o mesmo cálculo do lado Phaser via `isDesktopPointerEnvironment()`, sem inventar heurística nova. Lógica de hit-test/prioridade e a checagem de dispositivo extraídas para `src/game/systems/HoverContextTarget.ts` (funções puras, 9 testes novos em `HoverContextTarget.test.ts`). Nenhuma mudança no fluxo de clique/toque existente. Trade-off declarado: hit-test por raio fixo em vez de `setInteractive()`, para não auditar efeitos colaterais em `Enemy.ts` (NÍVEL 1 crítico). Validado: `pnpm run typecheck`, `pnpm test -- --run` (551 testes) e `pnpm verify` passando. Não validado: game feel/legibilidade do texto em jogo real (precisa de playtest humano). | Claude (agente paralelo) |
