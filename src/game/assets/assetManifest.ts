import Phaser from 'phaser';
import { logger } from '../../utils/logger';

export type AssetType = 'image' | 'spritesheet' | 'audio';

export interface BaseAssetConfig {
  key: string;
  path: string;
  type: AssetType;
}

export interface ImageAssetConfig extends BaseAssetConfig {
  type: 'image';
  normalMapPath?: string;
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
 * If any asset fails to load or is not yet present on disk, the engine's
 * procedural textureGenerator automatically generates the fallback texture.
 */
export const GAME_ASSET_MANIFEST: GameAssetConfig[] = [
  // --- PLAYER ENTITIES ---
  {
    key: 'spr_bloodmage',
    type: 'spritesheet',
    path: 'assets/sprites/player/bloodmage.png',
    frameWidth: 68,
    frameHeight: 68,
  },

  // --- MONSTERS & BOSSES ---
  {
    key: 'spr_skeleton',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/skeleton.png',
    frameWidth: 32,
    frameHeight: 40,
  },
  {
    key: 'spr_cultist',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/cultist.png',
    frameWidth: 32,
    frameHeight: 40,
  },
  {
    key: 'spr_hound',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/hound.png',
    frameWidth: 36,
    frameHeight: 28,
  },
  {
    key: 'spr_golem',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/golem.png',
    frameWidth: 48,
    frameHeight: 56,
  },
  {
    key: 'spr_specter',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/specter.png',
    frameWidth: 32,
    frameHeight: 40,
  },
  {
    key: 'spr_boss',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/boss.png',
    frameWidth: 64,
    frameHeight: 72,
  },
  {
    key: 'spr_zombie_shambler',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/zombie_shambler.png',
    frameWidth: 32,
    frameHeight: 40,
  },
  {
    key: 'spr_vampire_stalker',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/vampire_stalker.png',
    frameWidth: 32,
    frameHeight: 44,
  },
  {
    key: 'spr_werewolf_lycan',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/werewolf_lycan.png',
    frameWidth: 38,
    frameHeight: 44,
  },
  {
    key: 'spr_bat_swarm',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/bat_swarm.png',
    frameWidth: 20,
    frameHeight: 20,
  },
  {
    key: 'spr_gore_abomination',
    type: 'spritesheet',
    path: 'assets/sprites/enemies/gore_abomination.png',
    frameWidth: 52,
    frameHeight: 60,
  },

  // --- PROJECTILES & VFX ---
  {
    key: 'proj_blood_bolt',
    type: 'image',
    path: 'assets/sprites/projectiles/blood_bolt.png',
  },
  {
    key: 'proj_energy_bolt',
    type: 'image',
    path: 'assets/sprites/projectiles/energy_bolt.png',
  },

  // --- ITEMS & ORBS ---
  {
    key: 'orb_hp',
    type: 'image',
    path: 'assets/sprites/items/orb_hp.png',
  },
  {
    key: 'orb_mana',
    type: 'image',
    path: 'assets/sprites/items/orb_mana.png',
  },
  {
    key: 'gem_xp',
    type: 'image',
    path: 'assets/sprites/items/gem_xp.png',
  },

  // --- DUNGEON TILESETS & PROPS ---
  {
    key: 'tile_ground',
    type: 'image',
    path: 'assets/tilesets/tile_ground.png',
  },
  {
    key: 'tile_wall_brick',
    type: 'image',
    path: 'assets/tilesets/tile_wall_brick.png',
  },
  {
    key: 'spr_chest',
    type: 'image',
    path: 'assets/sprites/items/chest.png',
  },
  {
    key: 'spr_chest_south',
    type: 'image',
    path: 'assets/sprites/items/chest/south.png',
  },
  {
    key: 'spr_chest_south_west',
    type: 'image',
    path: 'assets/sprites/items/chest/south-west.png',
  },
  {
    key: 'spr_chest_west',
    type: 'image',
    path: 'assets/sprites/items/chest/west.png',
  },
  {
    key: 'spr_chest_north_west',
    type: 'image',
    path: 'assets/sprites/items/chest/north-west.png',
  },
  {
    key: 'spr_chest_north',
    type: 'image',
    path: 'assets/sprites/items/chest/north.png',
  },
  {
    key: 'spr_chest_north_east',
    type: 'image',
    path: 'assets/sprites/items/chest/north-east.png',
  },
  {
    key: 'spr_chest_east',
    type: 'image',
    path: 'assets/sprites/items/chest/east.png',
  },
  {
    key: 'spr_chest_south_east',
    type: 'image',
    path: 'assets/sprites/items/chest/south-east.png',
  },

  // --- UI & THEME ASSETS ---
  {
    key: 'logo',
    type: 'image',
    path: 'assets/ui/title-logo.png',
  },
  {
    key: 'gargoyleTop',
    type: 'image',
    path: 'assets/ui/gargoyle-top.png',
  },
  {
    key: 'gargoyleBottom',
    type: 'image',
    path: 'assets/ui/gargoyle-bottom.png',
  },
  {
    key: 'torch',
    type: 'image',
    path: 'assets/ui/torch.png',
  },
  {
    key: 'altar',
    type: 'image',
    path: 'assets/ui/altar.png',
  },
  {
    key: 'runeArch',
    type: 'image',
    path: 'assets/ui/rune-arch.png',
  },
  {
    key: 'stoneTile',
    type: 'image',
    path: 'assets/ui/stone-tile.jpg',
  },
  {
    key: 'rockTile',
    type: 'image',
    path: 'assets/ui/rock-tile.jpg',
  },
  {
    key: 'uiCorner',
    type: 'image',
    path: 'assets/ui/ui-corner.png',
  },
  {
    key: 'uiPlaque',
    type: 'image',
    path: 'assets/ui/ui-plaque.png',
  },
  {
    key: 'uiGem',
    type: 'image',
    path: 'assets/ui/ui-gem.png',
  },
  {
    key: 'uiCap',
    type: 'image',
    path: 'assets/ui/ui-slider-cap.png',
  },
];

export interface LoadMetrics {
  total: number;
  loaded: number;
  failed: number;
  failedKeys: string[];
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

  const metrics: LoadMetrics = {
    total: assetsToLoad.length,
    loaded: 0,
    failed: 0,
    failedKeys: [],
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
      logger.warn('ASSET_LOADER', `Asset físico não encontrado: [${fileObj.key}] em '${fileObj.url}'. Fallback procedural ativado.`, {
        key: fileObj.key,
        url: fileObj.url,
      });
    }
  });

  scene.load.on('complete', () => {
    if (metrics.failed > 0) {
      logger.warn('ASSET_LOADER', `Carregamento de assets concluído com ${metrics.failed} fallback(s) procedurais necessários.`, {
        total: metrics.total,
        loaded: metrics.loaded,
        failed: metrics.failed,
        failedKeys: metrics.failedKeys,
      });
    } else if (metrics.total > 0) {
      logger.info('ASSET_LOADER', `Todos os ${metrics.total} assets físicos foram carregados com sucesso.`);
    }
  });

  return metrics;
}
