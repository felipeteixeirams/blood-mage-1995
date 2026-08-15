import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualJoystickSystem } from './VirtualJoystickSystem';

vi.mock('phaser', () => {
  return {
    default: {
      Math: {
        Linear: (p0: number, p1: number, t: number) => p0 + t * (p1 - p0),
      },
    },
  };
});

function createMockScene() {
  const eventListeners: Record<string, Array<{ fn: Function; context?: any }>> = {};

  const mockGraphics = {
    setScrollFactor: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
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

  it('destroys listeners and graphics cleanly', () => {
    joystick.destroy();
    expect(scene.input.off).toHaveBeenCalledWith('pointerdown', expect.any(Function), joystick);
    expect(scene._mockGraphics.destroy).toHaveBeenCalled();
  });
});
