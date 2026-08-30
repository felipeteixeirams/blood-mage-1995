import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeightmapGenerator } from './HeightmapGenerator';
import { DungeonGenerator } from './DungeonGenerator';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';

// Mock Phaser environment for unit tests under Vitest
vi.mock('phaser', () => {
  class MockVector2 {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
      this.x = x;
      this.y = y;
    }
    set(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
    setTo(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
    normalize() {
      const len = Math.hypot(this.x, this.y) || 1;
      this.x /= len;
      this.y /= len;
      return this;
    }
  }

  class MockGeomLine {
    setTo() {}
  }
  class MockGeomRectangle {
    setTo() {}
  }

  return {
    default: {
      Physics: {
        Arcade: {
          Sprite: class {
            scene: any;
            x: number;
            y: number;
            active: boolean = true;
            visible: boolean = true;
            body: any;
            scaleX: number = 1;
            scaleY: number = 1;
            depth: number = 0;
            flipX: boolean = false;
            texture: any = {};
            constructor(scene: any, x: number, y: number) {
              this.scene = scene;
              this.x = x;
              this.y = y;
              this.body = {
                velocity: { x: 0, y: 0, length: () => 0 },
                reset: (bx: number, by: number) => {
                  this.x = bx;
                  this.y = by;
                },
              };
            }
            setPosition(x: number, y: number) {
              this.x = x;
              this.y = y;
              return this;
            }
            setActive(active: boolean) {
              this.active = active;
              return this;
            }
            setVisible(visible: boolean) {
              this.visible = visible;
              return this;
            }
            setVelocity(vx: number, vy: number) {
              this.body.velocity.x = vx;
              this.body.velocity.y = vy;
              return this;
            }
            setScale(sx: number, sy?: number) {
              this.scaleX = sx;
              this.scaleY = sy ?? sx;
              return this;
            }
            setTint() { return this; }
            clearTint() { return this; }
            setAlpha() { return this; }
            setRotation() { return this; }
            setFlipX(flip: boolean) { this.flipX = flip; return this; }
            setSize() { return this; }
            setCollideWorldBounds() { return this; }
            destroy() { this.active = false; }
          },
          StaticGroup: class {
            getChildren() { return []; }
            create() {
              return {
                setTint: () => {},
                setSize: () => {},
                setDepth: () => {},
                refreshBody: () => {},
              };
            }
          },
        },
      },
      Math: {
        Vector2: MockVector2,
        Angle: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1),
          Normalize: (a: number) => a,
        },
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
        },
        DegToRad: (deg: number) => (deg * Math.PI) / 180,
        Clamp: (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)),
      },
      Geom: {
        Line: MockGeomLine,
        Rectangle: MockGeomRectangle,
        Intersects: {
          LineToRectangle: () => false,
        },
      },
    },
  };
});

describe('Terrain Traversability & Cliff Collision Rules (Z-Elevation Walkability)', () => {
  let heightGen: HeightmapGenerator;

  beforeEach(() => {
    heightGen = new HeightmapGenerator(1995);
  });

  describe('1. Regra de Degrau e Falésia (HeightmapGenerator & DungeonGenerator)', () => {
    it('permite travessia quando Delta Z <= 1 (degrau/rampa suave)', () => {
      vi.spyOn(heightGen, 'getHeightAt').mockImplementation((x, y) => {
        if (x === 0 && y === 0) return 1;
        if (x === 1 && y === 0) return 2; // Delta Z = 1
        return 0;
      });

      expect(heightGen.isTraversable(0, 0, 1, 0, false)).toBe(true);
      expect(heightGen.isTraversable(0, 0, 48, 0, true)).toBe(true);
    });

    it('bloqueia travessia quando Delta Z > 1 (falésia/parede)', () => {
      vi.spyOn(heightGen, 'getHeightAt').mockImplementation((x, y) => {
        if (x === 0 && y === 0) return 1;
        if (x === 2 && y === 0) return 3; // Delta Z = 2
        if (x === 3 && y === 0) return 4; // Delta Z = 3
        return 0;
      });

      expect(heightGen.isTraversable(0, 0, 2, 0, false)).toBe(false);
      expect(heightGen.isTraversable(0, 0, 3, 0, false)).toBe(false);

      expect(heightGen.isTraversable(0, 0, 96, 0, true)).toBe(false);
      expect(heightGen.isTraversable(0, 0, 144, 0, true)).toBe(false);
    });

    it('DungeonGenerator delega a verificação isTraversable corretamente', () => {
      const mockScene: any = {
        add: { image: () => ({ setTint: () => {}, setDepth: () => {} }) },
        physics: { add: { existing: () => {} } },
      };
      const dungeonGen = new DungeonGenerator(mockScene, {} as any, {} as any);
      vi.spyOn(dungeonGen.heightGenerator, 'getHeightAt').mockImplementation((x, y) => {
        if (x === 0 && y === 0) return 0;
        if (x === 1 && y === 0) return 2; // Delta Z = 2
        return 0;
      });

      expect(dungeonGen.isTraversable(0, 0, 48, 0, true)).toBe(false);
    });
  });

  describe('2. Navegação da IA do Inimigo em Falésias (Enemy.ts)', () => {
    it('contorna a borda (slide along wall) ao encontrar um bloco de falésia com Delta Z > 1', () => {
      const mockDungeonGen = {
        isTraversable: vi.fn((fromX, fromY, toX, toY) => {
          // Se tentar mover para X > fromX (com ou sem Y), bloqueia (falésia na direção X)
          if (toX > fromX) return false;
          // Se mover somente em Y (toX === fromX), permite
          return true;
        }),
      };

      const mockScene: any = {
        add: { existing: () => {} },
        physics: { add: { existing: () => {} } },
        dungeonGenerator: mockDungeonGen,
      };

      const enemy = new Enemy(mockScene, 100, 100, 'skeleton_warrior');
      enemy.aiState = 'combat';

      // Executa o update perseguindo um jogador à direita (X=300, Y=100)
      enemy.updateEnemy(1000, 16, 300, 100, false);

      // Como o movimento na horizontal (X) é bloqueado pela falésia, ele deve zerar nextVx e desviar em Y se possível
      expect(mockDungeonGen.isTraversable).toHaveBeenCalled();
      expect(enemy.body?.velocity.x).toBe(0);
    });

    it('para totalmente se a falésia bloquear todas as rotas (X e Y)', () => {
      const mockDungeonGen = {
        isTraversable: vi.fn(() => false), // Tudo bloqueado
      };

      const mockScene: any = {
        add: { existing: () => {} },
        physics: { add: { existing: () => {} } },
        dungeonGenerator: mockDungeonGen,
      };

      const enemy = new Enemy(mockScene, 100, 100, 'skeleton_warrior');
      enemy.aiState = 'combat';

      enemy.updateEnemy(1000, 16, 200, 200, false);

      expect(enemy.body?.velocity.x).toBe(0);
      expect(enemy.body?.velocity.y).toBe(0);
    });
  });

  describe('3. Colisão de Projéteis com Falésias Acentuadas (Projectile.ts)', () => {
    it('dissipa o projétil ao atingir falésia com Delta Z >= 2', () => {
      const mockDungeonGen = {
        isTraversable: vi.fn(() => false), // Falésia Delta Z >= 2
      };

      const mockScene: any = {
        add: { existing: () => {} },
        physics: { add: { existing: () => {} } },
        dungeonGenerator: mockDungeonGen,
      };

      const projectile = new Projectile(mockScene, 100, 100);
      let expiredCalled = false;
      projectile.setOnExpired(() => {
        expiredCalled = true;
      });

      projectile.fire(100, 100, 0, 300, 20); // Dispara para a direita
      projectile.updateProjectile(1000, 16); // 16ms delta

      expect(mockDungeonGen.isTraversable).toHaveBeenCalled();
      expect(projectile.active).toBe(false);
      expect(expiredCalled).toBe(true);
    });

    it('continua ativo enquanto navegar em terreno transitável (Delta Z <= 1)', () => {
      const mockDungeonGen = {
        isTraversable: vi.fn(() => true), // Degrau/terreno plano transitável
      };

      const mockScene: any = {
        add: { existing: () => {} },
        physics: { add: { existing: () => {} } },
        dungeonGenerator: mockDungeonGen,
      };

      const projectile = new Projectile(mockScene, 100, 100);
      projectile.fire(100, 100, 0, 300, 20);
      projectile.updateProjectile(1000, 16);

      expect(mockDungeonGen.isTraversable).toHaveBeenCalled();
      expect(projectile.active).toBe(true);
    });
  });
});
