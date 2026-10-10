# Joystick virtual: tocar à esquerda move para a direita

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `src/utils/localStorage.ts` (`floatingStick: true` no default), `src/game/scenes/SettingsScene.ts`, `src/game/systems/VirtualJoystickSystem.ts`, `src/game/systems/VirtualJoystickSystem.test.ts` (describe `regression: fixed-base stick...`)

## Sintoma
Tocar na metade esquerda da tela faz o personagem andar para a direita; arrastar mais para a esquerda só o faz parar; mover para a esquerda só funciona tocando colado na borda.

## Causa raiz
Com `floatingStick: false` a base do stick fica fixa em `min(width * 0.12, 100)` px, mas a zona de toque aceita qualquer ponto até 48% da largura (`handlePointerDown`). Um toque nessa zona fora da base calcula `dx` positivo em relação à base fixa. O teste de regressão reproduz esse caso.

## Solução
- `floatingStick: true` como default de settings (`localStorage.ts`, `SettingsScene.ts`: definição do toggle e reset); com isso a base nasce onde o dedo toca.
- `dragToFollow` com default de classe `true` em `VirtualJoystickSystem.ts`, pois `GameScene` nunca o passa por `updateConfig`.
- O default de classe de `floatingStick` continua `false`; o valor efetivo vem de `updateConfig` com a setting do jogador.

## Como verificar
```bash
pnpm test -- --run src/game/systems/VirtualJoystickSystem.test.ts
```
O describe `regression: fixed-base stick made left movement unreachable` fixa o comportamento antigo (com `floatingStick: false` explícito) e o corrigido. Não executado nesta data (sem `node_modules`).
