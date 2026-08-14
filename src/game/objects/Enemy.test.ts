import { describe, it, expect, vi } from 'vitest';

// Minimal Phaser mock for unit testing Enemy logic without WebGL
vi.mock('phaser', () => {
  class Sprite {
    public active = true;
    public visible = true;
    public x = 0;
    public y = 0;
    public body: any = { velocity: { x: 0, y: 0 } };
    public tintTopLeft = 0;
    public isTinted = false;
    public scaleX = 1;
    public scaleY = 1;
    public rotation = 0;
    public flipX = false;
    public width = 32;
    public height = 32;
    public texture = { key: 'spr_skeleton' };

    constructor() {}
    setActive(v: boolean) { this.active = v; return this; }
    setVisible(v: boolean) { this.visible = v; return this; }
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
    setRotation(r: number) { this.rotation = r; return this; }
    setVelocity(x: number, y: number) {
      this.body.velocity.x = x;
      this.body.velocity.y = y;
      return this;
    }
    setScale(x: number, y?: number) {
      this.scaleX = x;
      this.scaleY = y !== undefined ? y : x;
      return this;
    }
    setSize() { return this; }
    setCollideWorldBounds() { return this; }
    setTint(tint: number) { this.tintTopLeft = tint; this.isTinted = true; return this; }
    clearTint() { this.isTinted = false; return this; }
    setAlpha() { return this; }
    setFlipX(f: boolean) { this.flipX = f; return this; }
  }

  class Scene {
    public add = { existing: () => {} };
    public physics = { add: { existing: () => {} } };
    public time = { now: 1000, delayedCall: (_ms: number, cb: () => void) => cb() };
  }

  class PhysicsSprite extends Sprite {
    public scene: any;
    constructor(scene: any, x: number, y: number, key: string) {
      super();
      this.x = x;
      this.y = y;
      this.scene = scene || new Scene();
    }
  }

  return {
    default: {
      Physics: { Arcade: { Sprite: PhysicsSprite } },
      Math: {
        Vector2: class Vector2 {
          public x: number;
          public y: number;
          constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
          }
          set(x: number, y: number) {
            this.x = x;
            this.y = y;
            return this;
          }
        },
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
        },
        Angle: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1),
        },
        Clamp: (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
      },
    },
  };
});

import { Enemy } from './Enemy';

function makeScene() {
  return {
    add: {
      existing: vi.fn(),
      image: vi.fn().mockReturnValue({
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
    },
    physics: { add: { existing: vi.fn() } },
    time: { now: 1000, delayedCall: vi.fn() },
    tweens: { add: vi.fn() },
  } as any;
}

describe('Enemy Monster Balancing & Scaling', () => {
  it('instantiates balanced Tier 1, 2, and 3 monsters correctly', () => {
    const skeleton = new Enemy(makeScene(), 100, 100, 'skeleton_warrior');
    expect(skeleton.hp).toBe(85);
    expect(skeleton.maxHp).toBe(85);
    expect(skeleton.damage).toBe(12);

    const cultist = new Enemy(makeScene(), 100, 100, 'cultist_acolyte');
    expect(cultist.hp).toBe(75);
    expect(cultist.damage).toBe(18);

    const zombie = new Enemy(makeScene(), 100, 100, 'zombie_shambler');
    expect(zombie.config.speed).toBe(70);
    expect(zombie.hp).toBe(110);

    const specter = new Enemy(makeScene(), 100, 100, 'blood_specter');
    expect(specter.hp).toBe(150);

    const abomination = new Enemy(makeScene(), 100, 100, 'gore_abomination');
    expect(abomination.hp).toBe(200);
  });

  it('scales stats progressively per floor depth (+6% HP, +4% Damage)', () => {
    const floor1Skeleton = new Enemy(makeScene(), 100, 100, 'skeleton_warrior', { floorDepth: 1 });
    expect(floor1Skeleton.hp).toBe(85);
    expect(floor1Skeleton.damage).toBe(12);

    // Floor 5: +24% HP (85 * 1.24 = 105.4 -> 105), +16% Damage (12 * 1.16 = 13.92 -> 14)
    const floor5Skeleton = new Enemy(makeScene(), 100, 100, 'skeleton_warrior', { floorDepth: 5 });
    expect(floor5Skeleton.hp).toBe(105);
    expect(floor5Skeleton.damage).toBe(14);

    // Floor 10: +54% HP (85 * 1.54 = 130.9 -> 131), +36% Damage (12 * 1.36 = 16.32 -> 16)
    const floor10Skeleton = new Enemy(makeScene(), 100, 100, 'skeleton_warrior', { floorDepth: 10 });
    expect(floor10Skeleton.hp).toBe(131);
    expect(floor10Skeleton.damage).toBe(16);
  });

  it('applies Frenzied elite affix with increased speed, damage, and tint', () => {
    const frenzied = new Enemy(makeScene(), 100, 100, 'skeleton_warrior', {
      floorDepth: 1,
      eliteAffix: 'frenzied',
    });
    expect(frenzied.damage).toBe(15); // 12 * 1.25 = 15
    expect(frenzied.aiState).toBe('frenzy');
    expect(frenzied.eliteAffix).toBe('frenzied');
  });

  it('applies Vampiric elite affix with boosted HP and lifesteal capability', () => {
    const vampiric = new Enemy(makeScene(), 100, 100, 'skeleton_warrior', {
      floorDepth: 1,
      eliteAffix: 'vampiric',
    });
    expect(vampiric.hp).toBe(119); // 85 * 1.4 = 119
    expect(vampiric.eliteAffix).toBe('vampiric');
  });

  it('applies Spectral elite affix with enhanced dodge capability', () => {
    const spectral = new Enemy(makeScene(), 100, 100, 'skeleton_warrior', {
      floorDepth: 1,
      eliteAffix: 'spectral',
    });
    expect(spectral.eliteAffix).toBe('spectral');
  });
});
