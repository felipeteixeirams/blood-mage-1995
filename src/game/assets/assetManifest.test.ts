import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueAssetLoading, GAME_ASSET_MANIFEST, GameAssetConfig } from './assetManifest';
import { logger } from '../../utils/logger';

describe('assetManifest & queueAssetLoading', () => {
  let mockScene: any;
  let listeners: Record<string, Function[]>;

  beforeEach(() => {
    listeners = {};

    mockScene = {
      load: {
        image: vi.fn(),
        spritesheet: vi.fn(),
        audio: vi.fn(),
        on: vi.fn((event: string, fn: Function) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(fn);
        }),
      },
    };

    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('contains valid GAME_ASSET_MANIFEST configurations', () => {
    expect(GAME_ASSET_MANIFEST.length).toBeGreaterThan(0);
    GAME_ASSET_MANIFEST.forEach((asset) => {
      expect(asset.key).toBeTruthy();
      expect(asset.path).toBeTruthy();
      expect(['image', 'spritesheet', 'audio']).toContain(asset.type);
      if (asset.type === 'spritesheet') {
        expect(asset.frameWidth).toBeGreaterThan(0);
        expect(asset.frameHeight).toBeGreaterThan(0);
      }
    });
  });

  it('queues all manifest assets into Phaser loader accurately based on asset type', () => {
    const testManifest: GameAssetConfig[] = [
      { key: 'test_img', type: 'image', path: 'assets/test.png' },
      { key: 'test_sheet', type: 'spritesheet', path: 'assets/sheet.png', frameWidth: 32, frameHeight: 32, margin: 1, spacing: 2 },
      { key: 'test_audio', type: 'audio', path: 'assets/audio.mp3' },
    ];

    const metrics = queueAssetLoading(mockScene, testManifest);

    expect(metrics.total).toBe(3);
    expect(mockScene.load.image).toHaveBeenCalledWith('test_img', 'assets/test.png');
    expect(mockScene.load.spritesheet).toHaveBeenCalledWith('test_sheet', 'assets/sheet.png', {
      frameWidth: 32,
      frameHeight: 32,
      margin: 1,
      spacing: 2,
    });
    expect(mockScene.load.audio).toHaveBeenCalledWith('test_audio', 'assets/audio.mp3');
  });

  it('tracks metrics accurately on filecomplete, loaderror, and complete events', () => {
    const testManifest: GameAssetConfig[] = [
      { key: 'asset_ok', type: 'image', path: 'ok.png' },
      { key: 'asset_fail', type: 'image', path: 'fail.png' },
    ];

    const metrics = queueAssetLoading(mockScene, testManifest);

    expect(metrics.total).toBe(2);
    expect(metrics.loaded).toBe(0);
    expect(metrics.failed).toBe(0);

    // Simulate filecomplete event
    if (listeners['filecomplete']) {
      listeners['filecomplete'].forEach((fn) => fn());
    }
    expect(metrics.loaded).toBe(1);

    // Simulate loaderror event for missing asset
    if (listeners['loaderror']) {
      listeners['loaderror'].forEach((fn) =>
        fn({ key: 'asset_fail', url: 'fail.png' } as any)
      );
    }
    expect(metrics.failed).toBe(1);
    expect(metrics.failedKeys).toContain('asset_fail');
    expect(logger.warn).toHaveBeenCalledWith(
      'ASSET_LOADER',
      expect.stringContaining('asset_fail'),
      expect.objectContaining({ key: 'asset_fail' })
    );

    // Simulate loader completion event
    if (listeners['complete']) {
      listeners['complete'].forEach((fn) => fn());
    }
    expect(logger.warn).toHaveBeenCalledWith(
      'ASSET_LOADER',
      expect.stringContaining('1 fallback(s) procedurais'),
      expect.anything()
    );
  });

  it('logs info on loader completion when all assets succeed', () => {
    const testManifest: GameAssetConfig[] = [
      { key: 'asset_ok', type: 'image', path: 'ok.png' },
    ];

    queueAssetLoading(mockScene, testManifest);

    if (listeners['filecomplete']) {
      listeners['filecomplete'].forEach((fn) => fn());
    }
    if (listeners['complete']) {
      listeners['complete'].forEach((fn) => fn());
    }

    expect(logger.info).toHaveBeenCalledWith(
      'ASSET_LOADER',
      expect.stringContaining('1 assets físicos foram carregados com sucesso')
    );
  });
});
