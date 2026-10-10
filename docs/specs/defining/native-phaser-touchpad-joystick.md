# Spec 11: Touchpad & Joystick Virtual Nativo no Phaser (Padrão Mobile Legends / Diablo Immortal)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10: parcial. Existe `src/game/systems/VirtualJoystickSystem.ts` (+ `.test.ts`) com joystick nativo em Phaser, instanciado duas vezes em `GameScene.ts` (`virtualJoystick` de movimento e `aimJoystick` de mira), `applyJoystickResponse` em `src/utils/joystickResponse.ts`, `input.activePointers: 3` em `src/game/PhaserGame.tsx`, settings `controlsMode`, `virtualControlsOpacity`, `floatingStick`, `leftHandedMode`. Divergências e lacunas: (1) o HUD React ainda renderiza um joystick DOM de movimento (`useFloatingJoystick` + zona de toque em `src/components/GameplayHUD.tsx`) em paralelo ao nativo; (2) o modo flutuante é opção (`settings.floatingStick`, default da classe `false`; `SettingsScene` usa `true`), não comportamento fixo; (3) raios reais 75/66 e deadzone 0,08 (a proposta dizia 55/65); (4) cores reais incluem `#ffd700` e variante roxa para a mira, não só as três propostas; (5) não há `scale.on('resize')` no sistema (a posição de repouso é recalculada por `updateConfig`/`resetPosition`); (6) não há reset do joystick ao pausar (apenas `destroy()` no shutdown de `GameScene.ts`); (7) o fade usa `opacity` com repouso a 55% da opacidade, não fade-out total.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Joystick flutuante na metade esquerda, drag-to-follow e valores padrão (raio 55, base 65, deadzone 0.08).
2. Estética do joystick (`#b8860b`, `#881337`, `#ef4444`).
3. Comportamento em pausa, resize e perda de ponteiro.
4. Remoção dos divs DOM de movimento no HUD quando o joystick nativo está ativo.

---

## 1. Objetivo (proposta)

Joystick virtual de toque processado 100% no canvas Phaser (`Phaser.Input.Pointer`), sem passar pelo DOM do React, com resposta síncrona no loop da `GameScene`, no estilo de Mobile Legends, Wild Rift e Diablo Immortal.

## 2. Pendências em relação ao código

- Remover o joystick DOM de movimento do `GameplayHUD.tsx` (e `useFloatingJoystick`) quando o nativo estiver ativo, mantendo botões de habilidade e menus com `stopPropagation`.
- Tratar pausa e modais: ocultar e zerar o vetor do joystick nativo ao pausar ou abrir modal.
- Tratar resize/orientação: recalcular zonas e posição de repouso.
- Definir se o modo flutuante é padrão (hoje depende de `settings.floatingStick`).
- Confirmar valores finais de raio, base, deadzone e paleta (código usa 75, 66, 0,08).

## 3. Contrato atual do módulo

```typescript
// src/game/systems/VirtualJoystickSystem.ts (trecho)
export interface VirtualJoystickConfig {
  x?: number; y?: number;
  baseRadius?: number; maxRadius?: number;
  deadzone?: number; curve?: number; sensitivity?: number; opacity?: number;
  enabled?: boolean; dragToFollow?: boolean; scaleMultiplier?: number;
  floatingStick?: boolean; zone?: 'left' | 'right' | 'all'; colorTheme?: 'red' | 'purple';
}
export interface JoystickVector { x: number; y: number; rawX: number; rawY: number; magnitude: number; active: boolean; }
```

## 4. Corner cases a cobrir

| Cenário | Comportamento proposto | Estado no código |
|---|---|---|
| Dedo sai do canvas (`pointerout` / `pointercancel`) | Joystick desativa e zera o vetor | Implementado (`handlePointerUp`) |
| Segundo toque lança magia | Ponteiro independente por `pointer.id` | Implementado (`pointerId` isolado; teste "multi-touch isolation") |
| Pausa ou modal de Level Up | Joystick oculto e velocidade zerada | Não encontrado |
| Resize / mudança de orientação | Zonas recalculadas | Não encontrado |

## 5. Critérios de aceite (provisórios)

Sem aprovação do responsável; critérios EARS a escrever. Validação de game feel (latência, suavidade do drag-to-follow) precisa de playtest humano.
