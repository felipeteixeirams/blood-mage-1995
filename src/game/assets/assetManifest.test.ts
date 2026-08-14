import { describe, it, expect, vi } from 'vitest';
import { GAME_ASSET_MANIFEST, queueAssetLoading } from './assetManifest';
import Phaser from 'phaser';

describe('assetManifest', () => {
  it('contains valid definitions for player, monsters, projectiles, items and tilesets', () => {
    expect(GAME_ASSET_MANIFEST.length).toBeGreaterThan(10);

    const playerAsset = GAME_ASSET_MANIFEST.find((a) => a.key === 'spr_bloodmage');
    expect(playerAsset).toBeDefined();
    expect(playerAsset?.type).toBe('spritesheet');

    const skeletonAsset = GAME_ASSET_MANIFEST.find((a) => a.key === 'spr_skeleton');
    expect(skeletonAsset).toBeDefined();
    expect(skeletonAsset?.type).toBe('spritesheet');

    const boltAsset = GAME_ASSET_MANIFEST.find((a) => a.key === 'proj_blood_bolt');
    expect(boltAsset).toBeDefined();
    expect(boltAsset?.type).toBe('image');
  });

  it('queues assets properly into Phaser loader and tracks metrics', () => {
    const callbacks: Record<string, Function[]> = {};

    const mockLoader = {
      image: vi.fn(),
      spritesheet: vi.fn(),
      audio: vi.fn(),
      on: vi.fn((event: string, cb: Function) => {
        callbacks[event] = callbacks[event] || [];
        callbacks[event].push(cb);
      }),
    };

    const mockScene = {
      load: mockLoader,
    } as unknown as Phaser.Scene;

    const metrics = queueAssetLoading(mockScene, [
      { key: 'test_img', type: 'image', path: 'assets/test.png' },
      {
        key: 'test_sheet',
        type: 'spritesheet',
        path: 'assets/sheet.png',
        frameWidth: 32,
        frameHeight: 32,
      },
    ]);

    expect(mockLoader.image).toHaveBeenCalledWith('test_img', 'assets/test.png');
    expect(mockLoader.spritesheet).toHaveBeenCalledWith(
      'test_sheet',
      'assets/sheet.png',
      expect.objectContaining({ frameWidth: 32, frameHeight: 32 })
    );
    expect(metrics.total).toBe(2);

    // Simulate filecomplete event
    callbacks['filecomplete']?.forEach((cb) => cb());
    expect(metrics.loaded).toBe(1);

    // Simulate loaderror event
    callbacks['loaderror']?.forEach((cb) => cb({ key: 'test_sheet' }));
    expect(metrics.failed).toBe(1);
    expect(metrics.failedKeys).toContain('test_sheet');
  });
});
