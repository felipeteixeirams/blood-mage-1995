import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager', () => {
  const originalGetGamepads = navigator.getGamepads;

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      getGamepads: vi.fn(() => []),
    });
    InputManager.resetForTests();
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

  it('wasButtonPressed() é true apenas na borda de subida', () => {
    InputManager.resetForTests();
    const gamepad = {
      connected: true,
      id: 'Test Pad',
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    const getGamepads = vi.fn(() => [gamepad]);
    vi.stubGlobal('navigator', { getGamepads });

    // Simula o polling inicial (nada pressionado)
    InputManager.readGamepadState();
    expect(InputManager.wasButtonPressed('a')).toBe(false);

    // A pressão do botão A (frame seguinte)
    gamepad.buttons[0].pressed = true;
    InputManager.readGamepadState();
    expect(InputManager.wasButtonPressed('a')).toBe(true);
    // Mantendo o padrão pressionado -> não dispara de novo
    expect(InputManager.wasButtonPressed('a')).toBe(false);

    // Solta o botão
    gamepad.buttons[0].pressed = false;
    InputManager.readGamepadState();
    expect(InputManager.wasButtonPressed('a')).toBe(false);
  });

  it('os botões D-pad (12-15) são refletidos no estado', () => {
    InputManager.resetForTests();
    const gamepad = {
      connected: true,
      id: 'Test Pad',
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    };
    gamepad.buttons[14].pressed = true; // D-pad Left
    gamepad.buttons[15].pressed = true; // D-pad Right
    vi.stubGlobal('navigator', { getGamepads: vi.fn(() => [gamepad]) });

    InputManager.readGamepadState();

    const state = InputManager.getGamepadState();
    expect(state.isConnected).toBe(true);
    expect(state.buttons.dpadLeft).toBe(true);
    expect(state.buttons.dpadRight).toBe(true);
    expect(state.buttons.dpadUp).toBe(false);
  });
});
