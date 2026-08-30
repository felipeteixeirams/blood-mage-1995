import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal Phaser mock for unit testing OnboardingFlow without WebGL
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
    setOffset() { return this; }
    setCollideWorldBounds() { return this; }
    setTint(tint: number) { this.tintTopLeft = tint; this.isTinted = true; return this; }
    clearTint() { this.isTinted = false; return this; }
    setAlpha() { return this; }
    setFlipX(f: boolean) { this.flipX = f; return this; }
  }

  class Scene {
    public add = { existing: () => {}, image: () => ({ setDepth: () => {}, setRotation: () => {}, setAlpha: () => {}, setScale: () => {}, setTint: () => {}, destroy: () => {} }) };
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

import { DungeonFlowController } from './DungeonFlowController';
import { Enemy } from '../objects/Enemy';
import { Player } from '../objects/Player';
import { useGameStore } from '../../store/gameStore';

function makeMockScene() {
  const addedEnemies: Enemy[] = [];
  return {
    currentFloorDepth: 1,
    totalFloorMonsters: 0,
    floorMonstersKilled: 0,
    pendingEnemySpawns: [],
    enemiesGroup: {
      add: vi.fn((enemy: Enemy) => addedEnemies.push(enemy)),
      countActive: () => addedEnemies.filter((e) => e.active).length,
    },
    depthGroup: { add: vi.fn() },
    wallsGroup: { clear: vi.fn(), create: vi.fn() },
    chestsGroup: { clear: vi.fn(), create: vi.fn() },
    collectiblesGroup: { clear: vi.fn() },
    enemyProjectilesGroup: { clear: vi.fn() },
    scavengeablesGroup: { clear: vi.fn() },
    lootGroup: { clear: vi.fn() },
    bloodStainsGroup: { clear: vi.fn() },
    npcsGroup: { clear: vi.fn() },
    clearNpcMarkers: vi.fn(),
    shadowSystem: { registerEntity: vi.fn() },
    reflectionSystem: { registerEntity: vi.fn() },
    lightingPolish: { addMonsterGlow: vi.fn() },
    add: {
      existing: vi.fn(),
      text: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
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
    tweens: { add: vi.fn() },
    time: { now: 1000, delayedCall: vi.fn(), addEvent: vi.fn() },
    _addedEnemies: addedEnemies,
  } as any;
}

describe('Spec 16: Onboarding "In Media Res" & Combat Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('spawns initial siege ("O Cerco ao Altar de Sangue") on Floor 1 with 3 scout beasts & 1 skeleton warrior in windup', () => {
    const scene = makeMockScene();
    const controller = new DungeonFlowController(scene);

    const spawnRoom = {
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      centerX: 300,
      centerY: 300,
    };

    controller.spawnInitialSiege(spawnRoom);

    const enemies = scene._addedEnemies as Enemy[];
    expect(enemies.length).toBe(4);
    expect(scene.totalFloorMonsters).toBe(4);

    const scoutBeasts = enemies.filter((e) => e.config.id === 'scout_beast');
    const skeletonWarriors = enemies.filter((e) => e.config.id === 'skeleton_warrior');

    expect(scoutBeasts.length).toBe(3);
    expect(skeletonWarriors.length).toBe(1);

    const skel = skeletonWarriors[0];
    expect(skel.attackPhase).toBe('windup');
    expect(skel.attackType).toBe('melee');
  });

  it('accelerates player level progression from Level 1 to Level 2 upon defeating initial siege monsters (65 XP > 50 XP threshold)', () => {
    const scene = makeMockScene();
    const player = new Player(scene, 300, 300);

    expect(player.stats.level).toBe(1);
    expect(player.stats.currentXp).toBe(0);
    expect(player.stats.nextLevelXp).toBe(50);

    // Defeating 3 scout beasts (15 XP each) = 45 XP
    player.addXp(15);
    player.addXp(15);
    player.addXp(15);
    expect(player.stats.level).toBe(1);
    expect(player.stats.currentXp).toBe(45);

    // Defeating 1 skeleton warrior (20 XP) = +20 XP -> total 65 XP (levels up to 2, remaining 15 XP)
    const leveledUp = player.addXp(20);
    expect(leveledUp).toBe(true);
    expect(player.stats.level).toBe(2);
    expect(player.stats.currentXp).toBe(15);
  });

  it('manages onboarding state flags (firstDashDone, firstSiegeCleared) with Zod persistence', () => {
    const store = useGameStore.getState();

    expect(store.onboarding.firstDashDone).toBe(false);
    expect(store.onboarding.firstSiegeCleared).toBe(false);

    // Trigger firstDashDone
    store.triggerOnboardingEvent('firstDashDone');
    expect(useGameStore.getState().onboarding.firstDashDone).toBe(true);

    // Trigger firstSiegeCleared
    store.triggerOnboardingEvent('firstSiegeCleared');
    expect(useGameStore.getState().onboarding.firstSiegeCleared).toBe(true);

    // Verify localStorage payload
    const rawSaved = localStorage.getItem('bloodmage_1995_onboarding');
    expect(rawSaved).not.toBeNull();
    const parsed = JSON.parse(rawSaved!);
    expect(parsed.firstDashDone).toBe(true);
    expect(parsed.firstSiegeCleared).toBe(true);
  });
});
