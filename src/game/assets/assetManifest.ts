import Phaser from 'phaser';
import { logger } from '../../utils/logger';
import rawManifest from './assetManifest.json';

export type AssetType = 'image' | 'spritesheet' | 'audio';

export interface BaseAssetConfig {
  key: string;
  path: string;
  type: AssetType;
  /**
   * When true, this asset MUST be present and valid on disk. `pnpm verify`
   * (via scripts/verify-assets.cjs) fails the build if a required asset is
   * missing, corrupted, or has a spritesheet size that doesn't evenly divide
   * its declared frameWidth/frameHeight.
   *
   * When false (the default for anything not yet produced), the asset is
   * "planned": the procedural fallback in textureGenerator.ts is expected
   * to cover it for now, and verify-assets.cjs reports it as pending
   * coverage instead of failing. Flip this to true once the real asset has
   * been generated, stitched, and committed under public/.
   */
  required?: boolean;
  normalMapPath?: string;
}

export interface ImageAssetConfig extends BaseAssetConfig {
  type: 'image';
}

export interface SpritesheetAssetConfig extends BaseAssetConfig {
  type: 'spritesheet';
  frameWidth: number;
  frameHeight: number;
  margin?: number;
  spacing?: number;
  startFrame?: number;
  endFrame?: number;
}

export interface AudioAssetConfig extends BaseAssetConfig {
  type: 'audio';
}

export type GameAssetConfig = ImageAssetConfig | SpritesheetAssetConfig | AudioAssetConfig;

/**
 * Manifest of external physical assets mapped to their engine texture keys.
 *
 * Source of truth: assetManifest.json (plain data, no Phaser dependency) so
 * that scripts/verify-assets.cjs can validate coverage at build time without
 * needing a browser/DOM environment.
 *
 * If a `required: false` asset fails to load or is not yet present on disk,
 * the engine's procedural textureGenerator automatically generates the
 * fallback texture under the same key — this is expected while the asset is
 * still "planned". A `required: true` asset falling back is a regression:
 * queueAssetLoading logs it as an error (not a warning) so it's impossible
 * to miss during `pnpm dev`.
 */
export const GAME_ASSET_MANIFEST: GameAssetConfig[] = rawManifest as GameAssetConfig[];

export interface LoadMetrics {
  total: number;
  loaded: number;
  failed: number;
  failedKeys: string[];
  /** Failed keys where the manifest entry has `required: true` — real regressions. */
  failedRequiredKeys: string[];
  /** Failed keys where the manifest entry has `required: false` — expected fallback. */
  failedPlannedKeys: string[];
}

export interface QueueAssetOptions {
  checkAvailability?: boolean;
}

/**
 * Enqueues configured external assets into the Phaser loader.
 * Missing assets will fail to load and the procedural fallback will take over.
 */
export function queueAssetLoading(
  scene: Phaser.Scene,
  manifest: GameAssetConfig[] = GAME_ASSET_MANIFEST,
  options?: QueueAssetOptions
): LoadMetrics {
  const assetsToLoad = manifest;
  const requiredByKey = new Map(assetsToLoad.map((asset) => [asset.key, Boolean(asset.required)]));

  const metrics: LoadMetrics = {
    total: assetsToLoad.length,
    loaded: 0,
    failed: 0,
    failedKeys: [],
    failedRequiredKeys: [],
    failedPlannedKeys: [],
  };

  assetsToLoad.forEach((asset) => {
    switch (asset.type) {
      case 'image':
        scene.load.image(asset.key, asset.path);
        break;
      case 'spritesheet':
        scene.load.spritesheet(asset.key, asset.path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
          margin: asset.margin ?? 0,
          spacing: asset.spacing ?? 0,
        });
        break;
      case 'audio':
        scene.load.audio(asset.key, asset.path);
        break;
    }
  });

  scene.load.on('filecomplete', () => {
    metrics.loaded += 1;
  });

  scene.load.on('loaderror', (fileObj: Phaser.Loader.File) => {
    metrics.failed += 1;
    if (fileObj && fileObj.key) {
      metrics.failedKeys.push(fileObj.key);
      const isRequired = requiredByKey.get(fileObj.key) ?? false;

      if (isRequired) {
        metrics.failedRequiredKeys.push(fileObj.key);
        logger.error('ASSET_LOADER', `REGRESSÃO: asset obrigatório [${fileObj.key}] não foi encontrado em '${fileObj.url}'. Isso deveria ter sido pego por 'pnpm verify' — rode-o localmente.`, {
          key: fileObj.key,
          url: fileObj.url,
        });
      } else {
        metrics.failedPlannedKeys.push(fileObj.key);
        logger.warn('ASSET_LOADER', `Asset físico ainda não produzido: [${fileObj.key}] em '${fileObj.url}'. Fallback procedural ativado (esperado nesta fase).`, {
          key: fileObj.key,
          url: fileObj.url,
        });
      }
    }
  });

  scene.load.on('complete', () => {
    if (metrics.failedRequiredKeys.length > 0) {
      logger.error('ASSET_LOADER', `${metrics.failedRequiredKeys.length} asset(s) OBRIGATÓRIOS caíram no fallback procedural.`, {
        failedRequiredKeys: metrics.failedRequiredKeys,
      });
    }
    if (metrics.failedPlannedKeys.length > 0) {
      logger.info('ASSET_LOADER', `${metrics.failedPlannedKeys.length} asset(s) planejado(s) ainda usando fallback procedural (esperado).`, {
        failedPlannedKeys: metrics.failedPlannedKeys,
      });
    }
    if (metrics.failed === 0 && metrics.total > 0) {
      logger.info('ASSET_LOADER', `Todos os ${metrics.total} assets físicos foram carregados com sucesso.`);
    }
  });

  return metrics;
}
