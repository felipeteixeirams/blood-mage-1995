import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BloodSplatterSystem, DecalConfig } from './BloodSplatterSystem';

describe('BloodSplatterSystem', () => {
  let mockScene: any;
  let createdImages: any[] = [];
  let addedTweens: any[] = [];
  let reflectionZones: any[] = [];

  beforeEach(() => {
    createdImages = [];
    addedTweens = [];
    reflectionZones = [];

    mockScene = {
      textures: {
        exists: vi.fn((key: string) => true),
      },
      add: {
        image: vi.fn((x: number, y: number, key: string) => {
          const img = {
            x,
            y,
            texture: { key },
            depth: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            alpha: 1,
            tint: 0xffffff,
            active: true,
            setDepth: vi.fn(function (this: any, d: number) { this.depth = d; return this; }),
            setScale: vi.fn(function (this: any, sx: number, sy?: number) {
              this.scaleX = sx;
              this.scaleY = sy ?? sx;
              return this;
            }),
            setRotation: vi.fn(function (this: any, r: number) { this.rotation = r; return this; }),
            setAlpha: vi.fn(function (this: any, a: number) { this.alpha = a; return this; }),
            setTint: vi.fn(function (this: any, t: number) { this.tint = t; return this; }),
            destroy: vi.fn(function (this: any) { this.active = false; }),
          };
          createdImages.push(img);
          return img;
        }),
      },
      tweens: {
        add: vi.fn((cfg: any) => {
          addedTweens.push(cfg);
          return { stop: vi.fn(), remove: vi.fn() };
        }),
      },
      time: {
        now: 1000,
      },
      bloodStainsGroup: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      reflectionSystem: {
        addLiquidZone: vi.fn((zone: any) => {
          reflectionZones.push(zone);
        }),
      },
    };
  });

  it('initializes with correct defaults and empty decals list', () => {
    const system = new BloodSplatterSystem(mockScene, 50);
    system.initialize();
    expect(system.getActiveDecalCount()).toBe(0);
    expect(system.maxDecals).toBe(50);
    expect(system.isEnabled()).toBe(true);
  });

  it('allows enabling and disabling the system', () => {
    const system = new BloodSplatterSystem(mockScene);
    system.setEnabled(false);
    expect(system.isEnabled()).toBe(false);

    const img = system.addDecal({
      x: 100,
      y: 100,
      textureKey: 'blood_pool_stain',
      type: 'blood_pool',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alpha: 0.9,
    });
    expect(img).toBeNull();
    expect(system.getActiveDecalCount()).toBe(0);
  });

  it('creates decal with correct properties and registers fade tween', () => {
    const system = new BloodSplatterSystem(mockScene);
    const cfg: DecalConfig = {
      x: 150,
      y: 200,
      textureKey: 'blood_pool_large',
      type: 'blood_pool_large',
      scaleX: 1.5,
      scaleY: 1.2,
      rotation: Math.PI / 4,
      alpha: 0.85,
      tint: 0xdc2626,
      depth: 2,
    };

    const img = system.addDecal(cfg);
    expect(img).not.toBeNull();
    expect(img?.x).toBe(150);
    expect(img?.y).toBe(200);
    expect(img?.scaleX).toBe(1.5);
    expect(img?.scaleY).toBe(1.2);
    expect(img?.depth).toBe(2);
    expect(system.getActiveDecalCount()).toBe(1);
    expect(mockScene.bloodStainsGroup.add).toHaveBeenCalledWith(img);
    expect(addedTweens.length).toBeGreaterThan(0);
  });

  it('respects maxDecals budget and safely recycles oldest decal (FIFO)', () => {
    const system = new BloodSplatterSystem(mockScene, 3);
    system.initialize();

    for (let i = 0; i < 5; i++) {
      system.addDecal({
        x: i * 10,
        y: i * 10,
        textureKey: 'blood_splatter_small',
        type: 'splatter_small',
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        alpha: 0.8,
      });
    }

    expect(system.getActiveDecalCount()).toBe(3);
    expect(createdImages.length).toBe(5);
  });

  it('creates total_destruction death gore with large pool, directional spray and gib chunks', () => {
    const system = new BloodSplatterSystem(mockScene);
    system.addDeathBlood({
      x: 300,
      y: 400,
      monsterId: 'cultist_zealot',
      dismembermentType: 'total_destruction',
      impactAngle: 0,
    });

    expect(createdImages.length).toBeGreaterThanOrEqual(6);
    expect(reflectionZones.length).toBe(1);
    expect(reflectionZones[0].type).toBe('blood');
  });

  it('creates partial_dismemberment death blood with medium pool and arterial spray', () => {
    const system = new BloodSplatterSystem(mockScene);
    system.addDeathBlood({
      x: 200,
      y: 250,
      monsterId: 'zombie_shambler',
      dismembermentType: 'partial_dismemberment',
      impactAngle: Math.PI / 2,
    });

    expect(createdImages.length).toBeGreaterThanOrEqual(3);
    expect(reflectionZones.length).toBe(1);
  });

  it('creates bone_dust decals for skeletons without liquid reflection', () => {
    const system = new BloodSplatterSystem(mockScene);
    system.addDeathBlood({
      x: 100,
      y: 100,
      monsterId: 'skeleton_warrior',
      goreEffect: 'bone_dust',
      dismembermentType: 'total_destruction',
    });

    expect(createdImages.length).toBe(4);
    expect(reflectionZones.length).toBe(0); // Bone dust does not create liquid reflections
  });

  it('spawns corpse decal with correct flattened aspect ratio', () => {
    const system = new BloodSplatterSystem(mockScene);
    const corpse = system.addCorpseDecal({
      x: 120,
      y: 180,
      textureKey: 'spr_cultist',
      scaleX: 1.0,
      scaleY: 1.0,
      isMutilated: false,
    });

    expect(corpse).not.toBeNull();
    expect(corpse?.scaleX).toBeCloseTo(1.05);
    expect(corpse?.scaleY).toBeCloseTo(0.55);
    expect(corpse?.depth).toBe(3);
  });

  it('creates wall splatter and hit splatter', () => {
    const system = new BloodSplatterSystem(mockScene);
    system.addWallSplatter(50, 60, Math.PI / 3, true);
    system.addHitSplatter(80, 90, 0, true);

    expect(createdImages.length).toBeGreaterThanOrEqual(3);
  });

  it('updates drying state and applies dry coagulated tint over time', () => {
    const system = new BloodSplatterSystem(mockScene);
    const img = system.addDecal({
      x: 100,
      y: 100,
      textureKey: 'blood_pool_stain',
      type: 'blood_pool',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alpha: 0.9,
      dryingDurationMs: 4000,
      dryTint: 0x450a0a,
    });

    // Before drying time (1000 + 2000 = 3000 < 5000)
    system.update(3000);
    expect(img?.setTint).not.toHaveBeenCalledWith(0x450a0a);

    // After drying time (1000 + 4000 = 5000 <= 5500)
    system.update(5500);
    expect(img?.setTint).toHaveBeenCalledWith(0x450a0a);
  });

  it('clears all decals on clearAll and cleanup', () => {
    const system = new BloodSplatterSystem(mockScene);
    system.addDecal({
      x: 10,
      y: 10,
      textureKey: 'blood_pool_stain',
      type: 'blood_pool',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alpha: 1,
    });
    system.addDecal({
      x: 20,
      y: 20,
      textureKey: 'blood_pool_stain',
      type: 'blood_pool',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alpha: 1,
    });

    expect(system.getActiveDecalCount()).toBe(2);
    system.clearAll();
    expect(system.getActiveDecalCount()).toBe(0);
  });
});
