import { describe, it, expect, vi } from 'vitest';
import {
  GAME_ANIMATIONS,
  registerAllAnimations,
  safePlayAnimation,
} from './animationManager';
import Phaser from 'phaser';

describe('animationManager', () => {
  it('contains valid animation definitions for game entities', () => {
    expect(GAME_ANIMATIONS.length).toBeGreaterThan(5);

    const bloodmageIdle = GAME_ANIMATIONS.find((a) => a.key === 'bloodmage_idle_south');
    expect(bloodmageIdle).toBeDefined();
    expect(bloodmageIdle?.textureKey).toBe('spr_bloodmage');

    const bloodmageWalkNE = GAME_ANIMATIONS.find((a) => a.key === 'bloodmage_walk_north_east');
    expect(bloodmageWalkNE).toBeDefined();
    expect(bloodmageWalkNE?.textureKey).toBe('spr_bloodmage');

    const bloodmageCastS = GAME_ANIMATIONS.find((a) => a.key === 'bloodmage_cast_south');
    expect(bloodmageCastS).toBeDefined();
    expect(bloodmageCastS?.textureKey).toBe('spr_bloodmage');

    const skeletonWalk = GAME_ANIMATIONS.find((a) => a.key === 'skeleton_walk');
    expect(skeletonWalk).toBeDefined();
    expect(skeletonWalk?.textureKey).toBe('spr_skeleton');
  });

  it('registers animations safely on a Phaser scene', () => {
    const createdAnims: Record<string, any> = {};
    const existingTextures: Record<string, { frameTotal: number }> = {
      spr_bloodmage: { frameTotal: 136 },
      spr_skeleton: { frameTotal: 1 }, // single frame fallback
    };

    const mockScene = {
      anims: {
        exists: vi.fn((key: string) => Boolean(createdAnims[key])),
        remove: vi.fn((key: string) => {
          delete createdAnims[key];
        }),
        create: vi.fn((config: any) => {
          createdAnims[config.key] = config;
        }),
        generateFrameNumbers: vi.fn((key: string, { start, end }: any) => {
          const frames = [];
          for (let i = start; i <= end; i++) {
            frames.push({ key, frame: i });
          }
          return frames;
        }),
      },
      textures: {
        exists: vi.fn((key: string) => Boolean(existingTextures[key])),
        get: vi.fn((key: string) => existingTextures[key]),
      },
    } as unknown as Phaser.Scene;

    registerAllAnimations(mockScene);

    // Multi-frame animation check
    expect(createdAnims['bloodmage_walk_down']).toBeDefined();
    expect(createdAnims['bloodmage_walk_down'].frames.length).toBeGreaterThan(1);

    // Single-frame animation fallback check
    expect(createdAnims['skeleton_idle']).toBeDefined();
    expect(createdAnims['skeleton_idle'].frames.length).toBe(1);
  });

  it('safePlayAnimation plays if animation exists and avoids crashing if missing', () => {
    const mockSprite = {
      play: vi.fn(),
      anims: {
        play: vi.fn(),
      },
      scene: {
        anims: {
          exists: vi.fn((key: string) => key === 'bloodmage_walk_down'),
        },
      },
    } as unknown as Phaser.GameObjects.Sprite;

    const playedExisting = safePlayAnimation(mockSprite, 'bloodmage_walk_down');
    expect(playedExisting).toBe(true);
    expect(mockSprite.play).toHaveBeenCalledWith('bloodmage_walk_down', true);

    const playedMissing = safePlayAnimation(mockSprite, 'unknown_anim');
    expect(playedMissing).toBe(false);
  });
});
