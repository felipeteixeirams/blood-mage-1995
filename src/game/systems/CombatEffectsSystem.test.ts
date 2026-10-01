import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  }

  class PhysicsSprite extends Sprite {
    public scene: any;
    constructor(scene: any, x: number, y: number, key: string) {
      super();
      this.x = x;
      this.y = y;
      this.scene = scene;
    }
  }

  return {
    default: {
      Physics: { Arcade: { Sprite: PhysicsSprite } },
      Math: {
        Distance: {
          Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
        },
        Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
      },
    },
  };
});

vi.mock('../../utils/soundEngine', () => ({
  soundEngine: {
    playExecutionGore: vi.fn(),
    playGoreExplosion: vi.fn(),
    playOrbPickup: vi.fn(),
    playNova: vi.fn(),
  },
}));

vi.mock('../../utils/haptics', () => ({
  default: {
    playerDeath: vi.fn(),
  },
}));

import { CombatEffectsSystem } from './CombatEffectsSystem';

describe('CombatEffectsSystem', () => {
  let mockScene: any;
  let combatEffects: CombatEffectsSystem;

  beforeEach(() => {
    mockScene = {
      player: {
        x: 100,
        y: 100,
        stats: {
          level: 1,
        },
      },
      lightingPolish: {
        addLevelUpGlow: vi.fn(),
      },
      callbacks: {
        onLevelUp: vi.fn(),
      },
    };
    combatEffects = new CombatEffectsSystem(mockScene);
  });

  describe('triggerLevelUp', () => {
    it('triggers onboarding event and invokes onLevelUp callback with 3 upgrade options', () => {
      mockScene.player.stats.level = 2;
      combatEffects.triggerLevelUp();

      expect(mockScene.callbacks.onLevelUp).toHaveBeenCalledTimes(1);
      const [level, options] = mockScene.callbacks.onLevelUp.mock.calls[0];
      expect(level).toBe(2);
      expect(options).toHaveLength(3);
    });

    it('filters upgrade pool exclusively for spell evolutions / legendary / spell category at level 5', () => {
      mockScene.player.stats.level = 5;
      combatEffects.triggerLevelUp();

      expect(mockScene.callbacks.onLevelUp).toHaveBeenCalledTimes(1);
      const [level, options] = mockScene.callbacks.onLevelUp.mock.calls[0];
      expect(level).toBe(5);
      expect(options).toHaveLength(3);

      options.forEach((opt: any) => {
        const isEligible = opt.isSpellEvolution || opt.rarity === 'legendary' || opt.category === 'spell';
        expect(isEligible).toBe(true);
      });
    });

    it('filters upgrade pool exclusively for spell evolutions / legendary / spell category at level 10', () => {
      mockScene.player.stats.level = 10;
      combatEffects.triggerLevelUp();

      expect(mockScene.callbacks.onLevelUp).toHaveBeenCalledTimes(1);
      const [level, options] = mockScene.callbacks.onLevelUp.mock.calls[0];
      expect(level).toBe(10);
      expect(options).toHaveLength(3);

      options.forEach((opt: any) => {
        const isEligible = opt.isSpellEvolution || opt.rarity === 'legendary' || opt.category === 'spell';
        expect(isEligible).toBe(true);
      });
    });
  });
});
