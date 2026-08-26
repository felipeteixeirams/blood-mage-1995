---
status: CONCLUÍDO
phase: 5/5
priority: P1 (Alta para Mobile / PWA)
start_date: 2026-08-15
eta: 2026-08-15
responsible: Claude & Felipe Teixeira
progress: 100%
agent_context: game developer, phaser engineer, frontend developer
target_module: /src/game/systems, /src/game/scenes, /src/components
last_updated: 2026-08-15
tags: [specs, touch-controls, virtual-joystick, phaser-native, mobile-legends, diablo-immortal, pwa, 60fps]
---

# 🕹️ Spec 11: Touchpad & Joystick Virtual Nativo no Phaser (Padrão Mobile Legends / Diablo Immortal)

> **Status:** Concluído | **Prioridade:** P1 (Experiência Mobile de Alto Nível)

---

## 1. 🎯 Objetivo Geral

Prover um sistema de controle de toque (*Touchpad / Joystick Virtual*) de nível comercial para mobile e PWAs, inspirado em **Mobile Legends: Bang Bang**, **League of Legends: Wild Rift** e **Diablo Immortal**.

O processamento do joystick passa a ser **100% nativo no Canvas Phaser** (via WebGL / `Phaser.Input.Pointer`), eliminando a latência de eventos DOM do React, evitando atrasos de render e garantindo resposta síncrona a 60/120 FPS no loop de física da `GameScene`.

---

## 2. 🔍 Diagnóstico do Estado Anterior vs. Nova Arquitetura

```
[ ARQUITETURA ANTERIOR - DOM OVERLAY ]
Toque no ecrã -> Div HTML React -> SyntheticEvent -> Hook React -> setState -> useEffect -> GameScene.setTouchInputs() -> Próximo Frame
(Latência: 1-3 frames de atraso + risco de perda de ponteiro em re-renders)

[ NOVA ARQUITETURA - PHASER NATIVE 60 FPS ]
Toque no ecrã -> Phaser Canvas (WebGL) -> PointerDown/PointerMove -> VirtualJoystickSystem -> Player.setMoveInput()
(Latência: 0 frames, cálculo síncrono no mesmo tick de física)
```

---

## 3. 📦 Escopo do Projeto

### ✅ O que entra:
1. **`VirtualJoystickSystem.ts` Nativo no Phaser**:
   - Criação da base e do manche (*knob*) renderizados via `Phaser.GameObjects.Graphics` com estética gótica (ouro envelhecido `#b8860b`, rubi profundo `#881337` e brilho carmesim `#ef4444`).
   - Modo **Flutuante Dinâmico (*Dynamic Floating Joystick*)**: a base se posiciona onde o jogador toca na metade esquerda da tela.
   - **Comportamento Drag-to-Follow (Estilo MOBA/ARPG)**: quando o jogador arrasta o polegar além do raio máximo (`maxRadius`), a base do joystick é suavemente reposicionada em direção ao ponteiro, evitando que o jogador "perca" o joystick ao fazer movimentos longos.
   - Suporte a **Multi-Touch (`activePointers: 3`)** isolado por `pointer.id`.
   - Aplicação de **Deadzone**, **Curva de Resposta Exponencial** e **Sensibilidade** integradas via `applyJoystickResponse`.
   - Fade in / Fade out suave com base em `settings.virtualControlsOpacity`.
2. **Integração na `GameScene.ts`**:
   - Inicialização e atualização síncrona no `update()` da cena.
   - Respeito ao `settings.controlsMode` (`'auto' | 'touch' | 'keyboard'`).
   - Limpeza e liberação de ponteiros em pausas de jogo ou transições.
3. **Ajustes no `GameplayHUD.tsx` (React)**:
   - Eliminação de divs DOM redundantes de movimento quando o joystick nativo está ativo, mantendo os botões de habilidades e menus perfeitamente integrados com `stopPropagation`.
4. **Testes Unitários & Documentação**:
   - Testes unitários com Vitest cobrindo cálculos de vetor, deadzone, sensibilidade e drag-to-follow.
   - Atualização do guia de troubleshooting e documentação de arquitetura.

### 🚫 Fora do Escopo:
- Reescrita dos modais informativos do React (Talentos, Bestiário, Painel de Ajustes).
- Alteração no balanceamento ou valores de velocidade do jogador.

---

## 4. 📐 Arquitetura e Contratos

### Módulo: `src/game/systems/VirtualJoystickSystem.ts`

```typescript
export interface VirtualJoystickConfig {
  radius?: number; // Raio máximo do manche (default: 55px)
  baseRadius?: number; // Raio da base visual (default: 65px)
  deadzone?: number; // Zona morta (default: 0.08)
  curve?: number; // Curva de resposta exponencial (default: 1.0)
  sensitivity?: number; // Fator multiplicador de sensibilidade (0.5 a 2.0)
  opacity?: number; // Opacidade máxima (0.2 a 1.0)
  dragToFollow?: boolean; // Se a base segue o polegar quando ultrapassa o raio (default: true)
}

export interface JoystickVector {
  x: number;
  y: number;
  angle: number;
  magnitude: number;
  active: boolean;
}
```

---

## 5. ⚠️ Corner Cases & Tratamento de Falhas

| Cenário | Comportamento Esperado |
|---|---|
| O jogador tira o dedo fora do canvas (`pointerout` / `pointercancel`) | O joystick desativa imediatamente e zera o vetor de movimento `(0, 0)`. |
| O jogador toca simultaneamente com a mão direita para lançar uma magia | O ponteiro direito não interfere com o ponteiro do joystick (`pointer.id` independente). |
| O jogador ativa a pausa ou modal de Level Up | O joystick é imediatamente ocultado e reseta a velocidade. |
| O jogador muda o tamanho da janela / orientação da tela | As dimensões das zonas de toque são recalculadas automaticamente pelo `scale.on('resize')`. |

---

## 6. 🧪 Critérios de Aceite

1. [x] Joystick flutua dinamicamente onde o polegar toca no lado esquerdo da tela.
2. [x] A base acompanha suavemente o polegar no arraste contínuo (*drag-to-follow*).
3. [x] Curva não-linear, deadzone e sensibilidade são aplicadas com 100% de fidelidade.
4. [x] Zero travamentos ou lags de frame no movimento.
5. [x] 100% dos testes unitários passam sem regressão.
