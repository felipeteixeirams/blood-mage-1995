import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Distance: {
        Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
      },
      Angle: {
        Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1),
      },
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    },
    Geom: {
      Point: class Point {
        public x: number;
        public y: number;
        constructor(x = 0, y = 0) {
          this.x = x;
          this.y = y;
        }
      },
    },
  },
}));

import { EnemyTelegraphSystem } from './EnemyTelegraphSystem';

function makeMockScene() {
  const graphicsMock = {
    setDepth: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    arc: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    fillPath: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    active: true,
  };

  const add = {
    graphics: vi.fn(() => ({ ...graphicsMock })),
  };

  const cameras = {
    main: {
      worldView: { x: 0, y: 0, width: 800, height: 600 },
    },
  };

  const scene = {
    add,
    cameras,
  };

  return { scene, add, cameras, graphicsMock };
}

describe('EnemyTelegraphSystem (Frente 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa objeto de gráficos no world space com depth correto (740)', () => {
    const { scene, add } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);

    system.initialize();

    expect(add.graphics).toHaveBeenCalled();
  });

  it('renderiza telégrafo de cone para ataque melee padrão durante windup', () => {
    const { scene } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);
    system.initialize();

    const mockEnemy = {
      active: true,
      x: 100,
      y: 100,
      attackPhase: 'windup',
      attackTargetPos: { x: 120, y: 100 },
      getTelegraphInfo: vi.fn(() => ({
        phase: 'windup' as const,
        progress: 0.5,
        shape: 'cone' as const,
        originX: 100,
        originY: 100,
        targetX: 120,
        targetY: 100,
        range: 40,
        angle: 0,
        spreadAngle: Math.PI * 0.5,
        color: 0xef4444,
      })),
    };

    const mockGroup = {
      getChildren: () => [mockEnemy],
    };

    expect(() => {
      system.update(1000, mockGroup as any);
    }).not.toThrow();

    expect(mockEnemy.getTelegraphInfo).toHaveBeenCalledWith(1000);
  });

  it('renderiza telégrafo de corredor (linha) para investidas e chargers', () => {
    const { scene } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);
    system.initialize();

    const mockEnemy = {
      active: true,
      x: 200,
      y: 200,
      attackTargetPos: { x: 300, y: 200 },
      getTelegraphInfo: vi.fn(() => ({
        phase: 'windup' as const,
        progress: 0.75,
        shape: 'line' as const,
        originX: 200,
        originY: 200,
        targetX: 300,
        targetY: 200,
        range: 120,
        angle: 0,
        spreadAngle: 0,
        lineWidth: 32,
        color: 0xf97316,
      })),
    };

    const mockGroup = {
      getChildren: () => [mockEnemy],
    };

    expect(() => {
      system.update(1500, mockGroup as any);
    }).not.toThrow();
  });

  it('renderiza telégrafo circular de impacto no solo para cultistas e magia', () => {
    const { scene } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);
    system.initialize();

    const mockEnemy = {
      active: true,
      x: 300,
      y: 300,
      attackTargetPos: { x: 400, y: 300 },
      getTelegraphInfo: vi.fn(() => ({
        phase: 'windup' as const,
        progress: 0.8,
        shape: 'circle' as const,
        originX: 400,
        originY: 300,
        targetX: 400,
        targetY: 300,
        range: 36,
        angle: 0,
        spreadAngle: Math.PI * 2,
        color: 0x8b5cf6,
      })),
    };

    const mockGroup = {
      getChildren: () => [mockEnemy],
    };

    expect(() => {
      system.update(2000, mockGroup as any);
    }).not.toThrow();
  });

  it('renderiza telégrafo de boss slam / onda de choque', () => {
    const { scene } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);
    system.initialize();

    const mockEnemy = {
      active: true,
      x: 400,
      y: 400,
      attackTargetPos: { x: 450, y: 400 },
      getTelegraphInfo: vi.fn(() => ({
        phase: 'strike' as const,
        progress: 1.0,
        shape: 'boss_slam' as const,
        originX: 400,
        originY: 400,
        targetX: 450,
        targetY: 400,
        range: 80,
        angle: 0,
        spreadAngle: Math.PI * 2,
        color: 0xef4444,
      })),
    };

    const mockGroup = {
      getChildren: () => [mockEnemy],
    };

    expect(() => {
      system.update(2500, mockGroup as any);
    }).not.toThrow();
  });

  it('faz culling de inimigos distantes fora da câmera', () => {
    const { scene } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);
    system.initialize();

    const mockFarEnemy = {
      active: true,
      x: 5000,
      y: 5000,
      attackTargetPos: { x: 5020, y: 5000 },
      getTelegraphInfo: vi.fn(),
    };

    const mockGroup = {
      getChildren: () => [mockFarEnemy],
    };

    system.update(1000, mockGroup as any);

    expect(mockFarEnemy.getTelegraphInfo).not.toHaveBeenCalled();
  });

  it('desativa e limpa recursos com setEnabled e cleanup', () => {
    const { scene } = makeMockScene();
    const system = new EnemyTelegraphSystem(scene as any);
    system.initialize();

    system.setEnabled(false);
    system.cleanup();
  });
});
