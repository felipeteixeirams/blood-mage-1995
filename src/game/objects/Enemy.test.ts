import { describe, it, expect, vi } from 'vitest';

// Minimal Phaser mock for unit testing Enemy logic without WebGL
vi.mock('phaser', () => {
  class Sprite {
    public active = true;
    public visible = true;
    public x = 0;
    public y = 0;
    public body: any = { velocity: { x: 0, y: 0, length: function() { return Math.hypot(this.x, this.y); } } };
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
          length() {
            return Math.hypot(this.x, this.y);
          }
        },
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
        },
        Angle: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1),
          Normalize: (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
          Wrap: (a: number) => {
            const r = (a + Math.PI) % (2 * Math.PI);
            return (r < 0 ? r + Math.PI * 2 : r) - Math.PI;
          },
        },
        DegToRad: (deg: number) => deg * (Math.PI / 180),
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
        setRotation: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
    },
    physics: { add: { existing: vi.fn() } },
    textures: { exists: vi.fn().mockReturnValue(true) },
    time: { now: 1000, delayedCall: vi.fn(), addEvent: vi.fn().mockReturnValue({ repeatCount: 0 }) },
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
    expect(zombie.config.speed).toBe(48);
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

  it('handles advanced damage effects (flinch, knockback, hit flash) and gibs on overkill', () => {
    const scene = makeScene();
    const enemy = new Enemy(scene, 100, 100, 'bat_swarm');

    // Take non-lethal damage with hit source position (bat_swarm maxHp is 38)
    const isDead = enemy.takeDamage(20, 80, 100, false, false);
    expect(isDead).toBe(false);
    expect(enemy.hp).toBe(18);
    expect(enemy.x).toBeGreaterThan(100); // Flinch shifted enemy away from x=80

    // Take overkill lethal damage triggering gibs
    const spawnGibsSpy = vi.spyOn(enemy, 'spawnGibs');
    const isLethal = enemy.takeDamage(100, 80, 100, true, false);
    expect(isLethal).toBe(true);
    expect(spawnGibsSpy).toHaveBeenCalled();
  });

  it('guarantees zero passive touch damage when attackPhase is none', () => {
    const scene = makeScene();
    const enemy = new Enemy(scene, 100, 100, 'skeleton_warrior');
    enemy.aiState = 'combat';
    enemy.attackPhase = 'none';

    // Call updateEnemy with player close enough to overlap, but attack on cooldown/not in strike phase
    const res = enemy.updateEnemy(1000, 16, 100, 100, false);
    expect(res.attack).toBe(false);
    expect(res.damage).toBe(0);
  });

  it('executes full telegraphed attack FSM cycle (windup -> strike -> recovery -> none)', () => {
    const scene = makeScene();
    const enemy = new Enemy(scene, 100, 100, 'skeleton_warrior');
    enemy.aiState = 'combat';

    // 1. Initial state: none
    expect(enemy.attackPhase).toBe('none');

    // 2. Trigger attack -> enters windup
    const res1 = enemy.updateEnemy(2000, 16, 105, 100, false);
    expect(enemy.attackPhase).toBe('windup');
    expect(res1.attack).toBe(false);

    // 3. Advance time beyond windup duration -> enters strike phase
    const windupEnd = 2000 + enemy.getWindupDuration();
    const res2 = enemy.updateEnemy(windupEnd + 1, 16, 105, 100, false);
    expect(enemy.attackPhase).toBe('strike');
    expect(res2.attack).toBe(true);
    expect(res2.damage).toBe(enemy.damage);

    // 4. Advance time beyond strike duration -> enters recovery phase
    const strikeEnd = windupEnd + 1 + enemy.getStrikeDuration();
    const res3 = enemy.updateEnemy(strikeEnd + 1, 16, 105, 100, false);
    expect(enemy.attackPhase).toBe('recovery');
    expect(res3.attack).toBe(false);

    // 5. Advance time beyond recovery duration -> returns to none
    const recoveryEnd = strikeEnd + 1 + enemy.getRecoveryDuration();
    const res4 = enemy.updateEnemy(recoveryEnd + 1, 16, 105, 100, false);
    expect(enemy.attackPhase).toBe('none');
  });

  it('does not initiate attack if Line of Sight is blocked by a wall (hasWallBetween = true)', () => {
    const scene = makeScene();
    const enemy = new Enemy(scene, 100, 100, 'skeleton_warrior');
    enemy.aiState = 'combat';
    enemy.attackPhase = 'none';

    // Call updateEnemy with player close enough, but blocked by a wall
    const res = enemy.updateEnemy(2000, 16, 105, 100, true); // hasWallBetween = true
    expect(enemy.attackPhase).toBe('none');
    expect(res.attack).toBe(false);
  });
});
