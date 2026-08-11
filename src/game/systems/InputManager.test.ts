import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager', () => {
  const originalGetGamepads = navigator.getGamepads;

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => []),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalGetGamepads) {
      Object.defineProperty(navigator, 'getGamepads', { value: originalGetGamepads });
    }
  });

  it('init() é idempotente (não duplica listeners/polling)', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((() => 0) as any);
    InputManager.init();
    InputManager.init();
    // 3 listeners de jogo (2 gamepad + 2 keyboard = 4; cada init adicionaria 4 -> esperado 4 total)
    expect(addEventListener).toHaveBeenCalledTimes(4);
    expect(rafSpy).toHaveBeenCalledTimes(1);
    rafSpy.mockRestore();
  });

  it('getMovementInput() normaliza diagonal WASD', () => {
    InputManager.init();
    // Simula tecla W pressionada
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    const move = InputManager.getMovementInput();
    expect(move.x).toBe(0);
    expect(move.y).toBe(-1);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));

    // W + D juntos -> diagonal normalizada
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    const diag = InputManager.getMovementInput();
    expect(Math.hypot(diag.x, diag.y)).toBeCloseTo(1, 5);
    expect(diag.x).toBeGreaterThan(0);
    expect(diag.y).toBeLessThan(0);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
  });

  it('getMovementInput() sem input retorna (0,0)', () => {
    InputManager.init();
    const move = InputManager.getMovementInput();
    expect(move).toEqual({ x: 0, y: 0 });
  });

  it('isKeyPressed() reflete o estado das teclas', () => {
    InputManager.init();
    expect(InputManager.isKeyPressed('a')).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(InputManager.isKeyPressed('a')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    expect(InputManager.isKeyPressed('a')).toBe(false);
  });

  it('isGamepadConnected() é false sem gamepad', () => {
    InputManager.init();
    expect(InputManager.isGamepadConnected()).toBe(false);
    expect(InputManager.getGamepadState().isConnected).toBe(false);
  });
});
