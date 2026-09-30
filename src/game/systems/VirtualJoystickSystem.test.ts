import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualJoystickSystem } from './VirtualJoystickSystem';

vi.mock('phaser', () => {
  return {
    default: {
      Math: {
        Linear: (p0: number, p1: number, t: number) => p0 + t * (p1 - p0),
      },
      BlendModes: {
        ADD: 1,
      },
    },
  };
});

function createMockScene() {
  const eventListeners: Record<string, Array<{ fn: Function; context?: any }>> = {};

  const mockGraphics = {
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setBlendMode: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  const scene = {
    scale: {
      width: 1000,
      height: 600,
    },
    add: {
      graphics: vi.fn(() => mockGraphics),
    },
    input: {
      on: vi.fn((event: string, fn: Function, context?: any) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push({ fn, context });
      }),
      off: vi.fn((event: string, fn: Function) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter((entry) => entry.fn !== fn);
        }
      }),
    },
    _emitInput: (event: string, pointer: any) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach((entry) => entry.fn.call(entry.context, pointer));
      }
    },
    _mockGraphics: mockGraphics,
  };

  return scene;
}

describe('VirtualJoystickSystem', () => {
  let scene: ReturnType<typeof createMockScene>;
  let joystick: VirtualJoystickSystem;

  beforeEach(() => {
    scene = createMockScene();
    joystick = new VirtualJoystickSystem(scene as any, {
      maxRadius: 50,
      deadzone: 0.08,
      curve: 1.0,
      sensitivity: 1.0,
      dragToFollow: true,
      floatingStick: true,
    });
    joystick.init();
  });

  it('initializes and registers input listeners and graphics', () => {
    expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function), joystick);
    expect(scene.input.on).toHaveBeenCalledWith('pointermove', expect.any(Function), joystick);
    expect(scene.input.on).toHaveBeenCalledWith('pointerup', expect.any(Function), joystick);
    expect(scene.add.graphics).toHaveBeenCalled();
  });

  it('activates when pointerdown occurs in left movement zone', () => {
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 400 });
    expect(joystick.isActive()).toBe(true);
    expect(joystick.getMovementVector()).toEqual({ x: 0, y: 0 });
  });

  it('does not activate when pointerdown occurs on the right half of the screen', () => {
    scene._emitInput('pointerdown', { id: 1, x: 600, y: 400 });
    expect(joystick.isActive()).toBe(false);
  });

  it('calculates direction vector correctly on pointermove', () => {
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });

    // Drag 50px to the right
    scene._emitInput('pointermove', { id: 1, x: 250, y: 300 });
    const vec = joystick.getMovementVector();
    expect(vec.x).toBeGreaterThan(0.9);
    expect(Math.abs(vec.y)).toBeLessThan(0.01);
  });

  it('applies deadzone when movement is very small', () => {
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });

    // Move only 2px (2/50 = 0.04, which is below deadzone of 0.08)
    scene._emitInput('pointermove', { id: 1, x: 202, y: 300 });
    const vec = joystick.getMovementVector();
    expect(vec.x).toBe(0);
    expect(vec.y).toBe(0);
  });

  it('supports drag-to-follow smoothly when dragging past maxRadius', () => {
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });

    // Drag 100px to the right (beyond maxRadius 50)
    scene._emitInput('pointermove', { id: 1, x: 300, y: 300 });
    const state = joystick.getState();
    expect(state.active).toBe(true);
    expect(state.x).toBeCloseTo(1, 1);
  });

  it('ignores move events from other pointers (multi-touch isolation)', () => {
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });
    scene._emitInput('pointermove', { id: 2, x: 800, y: 500 }); // Different pointer (right hand)

    expect(joystick.getMovementVector()).toEqual({ x: 0, y: 0 });
  });

  it('resets when active pointer is released', () => {
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });
    scene._emitInput('pointermove', { id: 1, x: 250, y: 300 });
    expect(joystick.isActive()).toBe(true);

    scene._emitInput('pointerup', { id: 1, x: 250, y: 300 });
    expect(joystick.isActive()).toBe(false);
    expect(joystick.getMovementVector()).toEqual({ x: 0, y: 0 });
  });

  it('updates configuration dynamically', () => {
    joystick.updateConfig({ deadzone: 0.2, sensitivity: 1.5, enabled: false });
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });
    expect(joystick.isActive()).toBe(false); // Disabled
  });

  it('applies scale multiplier correctly to radii', () => {
    joystick.updateConfig({ scaleMultiplier: 1.25 });
    // Configured maxRadius 50 * 1.25 = 62.5
    scene._emitInput('pointerdown', { id: 1, x: 200, y: 300 });

    // Move 40px to the right (40/62.5 = 0.64 normalized)
    scene._emitInput('pointermove', { id: 1, x: 240, y: 300 });
    const vec = joystick.getMovementVector();
    expect(vec.x).toBeGreaterThan(0.5);
    expect(vec.x).toBeLessThan(0.9);
  });

  it('supports floatingStick dynamic origin placement on touch down', () => {
    joystick.updateConfig({ floatingStick: true, zone: 'left' });
    // Touch down at (150, 450)
    scene._emitInput('pointerdown', { id: 1, x: 150, y: 450 });
    expect(joystick.isActive()).toBe(true);

    // Initial touch at origin has zero movement
    expect(joystick.getMovementVector()).toEqual({ x: 0, y: 0 });

    // Move relative to dynamic origin (150, 450) -> (200, 450)
    scene._emitInput('pointermove', { id: 1, x: 200, y: 450 });
    const vec = joystick.getMovementVector();
    expect(vec.x).toBeGreaterThan(0.9);
  });

  it('destroys listeners and graphics cleanly', () => {
    joystick.destroy();
    expect(scene.input.off).toHaveBeenCalledWith('pointerdown', expect.any(Function), joystick);
    expect(scene._mockGraphics.destroy).toHaveBeenCalled();
  });

  describe('regression: fixed-base stick made left movement unreachable (reported 2026-09-02)', () => {
    // Sintoma real reportado: tocar na região esquerda da tela fazia o
    // personagem andar pra DIREITA, e mover o dedo mais pra esquerda só o
    // fazia parar — nunca de fato mover pra esquerda.
    //
    // Causa-raiz: com `floatingStick: false` (era o default em produção via
    // localStorage.ts e SettingsScene.ts), a base do stick fica ancorada num
    // ponto FIXO minúsculo perto da borda esquerda (init(): baseX = min(width
    // * 0.12, 100)), mas a zona de toque que ativa o stick aceita qualquer
    // toque em até 48% da largura da tela (handlePointerDown: pointer.x <
    // width * 0.48). Qualquer toque nessa zona ampla que não seja bem
    // próximo da base fixa calcula um dx positivo (direita) a partir dela —
    // então "tocar na esquerda da tela" na prática empurrava o personagem
    // pra direita, e só um toque colado na borda (dentro de ~100px) geraria
    // um vetor pra esquerda de verdade.
    //
    // Correção: `floatingStick: true` virou o novo default (localStorage.ts,
    // SettingsScene.ts) — a base passa a nascer exatamente onde o dedo toca
    // (handlePointerDown: if (floatingStick) baseX = pointer.x), igual
    // Mobile Legends/Diablo Immortal, eliminando esse ponto cego.

    it('[bug antigo] floatingStick=false: tocar longe da base fixa gera vetor pra DIREITA mesmo em toque "na esquerda"', () => {
      joystick.updateConfig({ floatingStick: false, zone: 'left' });

      // Base fixa fica em min(1000*0.12, 100) = 100px da borda esquerda.
      // Um toque em x=300 está dentro da zona de movimento (< 48% de 1000 =
      // 480), mas bem à DIREITA da base fixa (100) — reproduz o bug relatado.
      scene._emitInput('pointerdown', { id: 1, x: 300, y: 450 });
      expect(joystick.isActive()).toBe(true);
      // pointerdown sozinho nunca calcula vetor (fica {0,0}); no toque real
      // o dedo sempre gera algum micro-movimento em seguida — simulamos isso
      // com um pointermove na mesma posição em que o dedo pousou.
      scene._emitInput('pointermove', { id: 1, x: 300, y: 450 });

      const vec = joystick.getMovementVector();
      expect(vec.x).toBeGreaterThan(0); // bug: vetor pra direita num toque "à esquerda"
    });

    it('[corrigido] floatingStick=true: tocar em qualquer ponto da zona esquerda começa neutro, arrastar pra esquerda move pra esquerda', () => {
      joystick.updateConfig({ floatingStick: true, zone: 'left' });

      // Mesmo ponto de toque do teste anterior (x=300) — agora a base nasce
      // ali, então o toque inicial é neutro, não "pra direita".
      scene._emitInput('pointerdown', { id: 1, x: 300, y: 450 });
      expect(joystick.getMovementVector()).toEqual({ x: 0, y: 0 });

      // Arrastar o dedo pra esquerda a partir do ponto de toque agora produz
      // um vetor negativo (esquerda) de forma confiável.
      scene._emitInput('pointermove', { id: 1, x: 250, y: 450 });
      const vec = joystick.getMovementVector();
      expect(vec.x).toBeLessThan(0);
    });
  });
});
