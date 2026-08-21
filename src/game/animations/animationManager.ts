import Phaser from 'phaser';

export interface AnimationDefinition {
  key: string;
  textureKey: string;
  frames?: number[];
  startFrame?: number;
  endFrame?: number;
  frameRate: number;
  repeat: number; // -1 for infinite, 0 for once
}

/**
 * Standard animation catalogue for Bloodmage 1995.
 */
export const GAME_ANIMATIONS: AnimationDefinition[] = [
  // --- BLOODMAGE (8-Directional) ---
  // Idles
  {
    key: 'bloodmage_idle_south',
    textureKey: 'spr_bloodmage',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_south_east',
    textureKey: 'spr_bloodmage',
    frames: [1],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_east',
    textureKey: 'spr_bloodmage',
    frames: [2],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_north_east',
    textureKey: 'spr_bloodmage',
    frames: [3],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_north',
    textureKey: 'spr_bloodmage',
    frames: [4],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_north_west',
    textureKey: 'spr_bloodmage',
    frames: [5],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_west',
    textureKey: 'spr_bloodmage',
    frames: [6],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_south_west',
    textureKey: 'spr_bloodmage',
    frames: [7],
    frameRate: 4,
    repeat: -1,
  },
  // Legacy Idle Aliases
  {
    key: 'bloodmage_idle_down',
    textureKey: 'spr_bloodmage',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_up',
    textureKey: 'spr_bloodmage',
    frames: [4],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'bloodmage_idle_side',
    textureKey: 'spr_bloodmage',
    frames: [2],
    frameRate: 4,
    repeat: -1,
  },
  // Walks
  {
    key: 'bloodmage_walk_south',
    textureKey: 'spr_bloodmage',
    startFrame: 8,
    endFrame: 15,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_south_east',
    textureKey: 'spr_bloodmage',
    startFrame: 16,
    endFrame: 23,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_east',
    textureKey: 'spr_bloodmage',
    startFrame: 24,
    endFrame: 31,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_north_east',
    textureKey: 'spr_bloodmage',
    startFrame: 32,
    endFrame: 39,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_north',
    textureKey: 'spr_bloodmage',
    startFrame: 40,
    endFrame: 47,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_north_west',
    textureKey: 'spr_bloodmage',
    startFrame: 48,
    endFrame: 55,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_west',
    textureKey: 'spr_bloodmage',
    startFrame: 56,
    endFrame: 63,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_south_west',
    textureKey: 'spr_bloodmage',
    startFrame: 64,
    endFrame: 71,
    frameRate: 8,
    repeat: -1,
  },
  // Legacy Walk Aliases
  {
    key: 'bloodmage_walk_down',
    textureKey: 'spr_bloodmage',
    startFrame: 8,
    endFrame: 15,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_up',
    textureKey: 'spr_bloodmage',
    startFrame: 40,
    endFrame: 47,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'bloodmage_walk_side',
    textureKey: 'spr_bloodmage',
    startFrame: 24,
    endFrame: 31,
    frameRate: 8,
    repeat: -1,
  },
  // Cast (8-Directional)
  {
    key: 'bloodmage_cast_south',
    textureKey: 'spr_bloodmage',
    startFrame: 72,
    endFrame: 79,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_south_east',
    textureKey: 'spr_bloodmage',
    startFrame: 80,
    endFrame: 87,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_east',
    textureKey: 'spr_bloodmage',
    startFrame: 88,
    endFrame: 95,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_north_east',
    textureKey: 'spr_bloodmage',
    startFrame: 96,
    endFrame: 103,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_north',
    textureKey: 'spr_bloodmage',
    startFrame: 104,
    endFrame: 111,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_north_west',
    textureKey: 'spr_bloodmage',
    startFrame: 112,
    endFrame: 119,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_west',
    textureKey: 'spr_bloodmage',
    startFrame: 120,
    endFrame: 127,
    frameRate: 10,
    repeat: 0,
  },
  {
    key: 'bloodmage_cast_south_west',
    textureKey: 'spr_bloodmage',
    startFrame: 128,
    endFrame: 135,
    frameRate: 10,
    repeat: 0,
  },
  // Legacy Cast Alias
  {
    key: 'bloodmage_cast',
    textureKey: 'spr_bloodmage',
    startFrame: 72,
    endFrame: 79,
    frameRate: 10,
    repeat: 0,
  },

  // --- SKELETON ---
  {
    key: 'skeleton_idle',
    textureKey: 'spr_skeleton',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'skeleton_walk',
    textureKey: 'spr_skeleton',
    startFrame: 0,
    endFrame: 3,
    frameRate: 6,
    repeat: -1,
  },
  {
    key: 'skeleton_attack',
    textureKey: 'spr_skeleton',
    startFrame: 4,
    endFrame: 6,
    frameRate: 8,
    repeat: 0,
  },

  // --- CULTIST ---
  {
    key: 'cultist_idle',
    textureKey: 'spr_cultist',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'cultist_walk',
    textureKey: 'spr_cultist',
    startFrame: 0,
    endFrame: 3,
    frameRate: 6,
    repeat: -1,
  },
  {
    key: 'cultist_cast',
    textureKey: 'spr_cultist',
    startFrame: 4,
    endFrame: 6,
    frameRate: 8,
    repeat: 0,
  },

  // --- HOUND ---
  {
    key: 'hound_idle',
    textureKey: 'spr_hound',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'hound_run',
    textureKey: 'spr_hound',
    startFrame: 0,
    endFrame: 3,
    frameRate: 10,
    repeat: -1,
  },
  {
    key: 'hound_bite',
    textureKey: 'spr_hound',
    startFrame: 4,
    endFrame: 5,
    frameRate: 8,
    repeat: 0,
  },

  // --- GOLEM ---
  {
    key: 'golem_idle',
    textureKey: 'spr_golem',
    frames: [0],
    frameRate: 3,
    repeat: -1,
  },
  {
    key: 'golem_walk',
    textureKey: 'spr_golem',
    startFrame: 0,
    endFrame: 3,
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'golem_smash',
    textureKey: 'spr_golem',
    startFrame: 4,
    endFrame: 6,
    frameRate: 6,
    repeat: 0,
  },

  // --- SPECTER ---
  {
    key: 'specter_float',
    textureKey: 'spr_specter',
    startFrame: 0,
    endFrame: 3,
    frameRate: 6,
    repeat: -1,
  },

  // --- ZOMBIE SHAMBLER ---
  {
    key: 'zombie_idle',
    textureKey: 'spr_zombie_shambler',
    frames: [0],
    frameRate: 3,
    repeat: -1,
  },
  {
    key: 'zombie_walk',
    textureKey: 'spr_zombie_shambler',
    startFrame: 0,
    endFrame: 3,
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'zombie_strike',
    textureKey: 'spr_zombie_shambler',
    startFrame: 4,
    endFrame: 6,
    frameRate: 6,
    repeat: 0,
  },

  // --- VAMPIRE STALKER ---
  {
    key: 'vampire_idle',
    textureKey: 'spr_vampire_stalker',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'vampire_walk',
    textureKey: 'spr_vampire_stalker',
    startFrame: 0,
    endFrame: 3,
    frameRate: 8,
    repeat: -1,
  },
  {
    key: 'vampire_strike',
    textureKey: 'spr_vampire_stalker',
    startFrame: 4,
    endFrame: 6,
    frameRate: 10,
    repeat: 0,
  },

  // --- WEREWOLF LYCAN ---
  {
    key: 'lycan_idle',
    textureKey: 'spr_werewolf_lycan',
    frames: [0],
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'lycan_run',
    textureKey: 'spr_werewolf_lycan',
    startFrame: 0,
    endFrame: 3,
    frameRate: 9,
    repeat: -1,
  },
  {
    key: 'lycan_slash',
    textureKey: 'spr_werewolf_lycan',
    startFrame: 4,
    endFrame: 6,
    frameRate: 9,
    repeat: 0,
  },

  // --- BAT SWARM ---
  {
    key: 'bat_fly',
    textureKey: 'spr_bat_swarm',
    startFrame: 0,
    endFrame: 3,
    frameRate: 12,
    repeat: -1,
  },

  // --- GORE ABOMINATION ---
  {
    key: 'abomination_idle',
    textureKey: 'spr_gore_abomination',
    frames: [0],
    frameRate: 3,
    repeat: -1,
  },
  {
    key: 'abomination_walk',
    textureKey: 'spr_gore_abomination',
    startFrame: 0,
    endFrame: 3,
    frameRate: 4,
    repeat: -1,
  },
  {
    key: 'abomination_slam',
    textureKey: 'spr_gore_abomination',
    startFrame: 4,
    endFrame: 6,
    frameRate: 6,
    repeat: 0,
  },
];

/**
 * Registers animations in the Phaser animation manager safely.
 * Only builds multi-frame animations if the texture has enough frames.
 * If texture only has 1 frame, creates single-frame fallback animations.
 */
export function registerAllAnimations(
  scene: Phaser.Scene,
  animationList: AnimationDefinition[] = GAME_ANIMATIONS
): void {
  animationList.forEach((anim) => {
    // Remove if already exists to allow clean re-registration
    if (scene.anims.exists(anim.key)) {
      scene.anims.remove(anim.key);
    }

    if (!scene.textures.exists(anim.textureKey)) {
      return;
    }

    const texture = scene.textures.get(anim.textureKey);
    const frameTotal = texture.frameTotal ?? 1;

    try {
      if (frameTotal > 1) {
        // Multi-frame physical spritesheet
        let frames: Phaser.Types.Animations.AnimationFrame[] = [];

        if (anim.frames) {
          frames = anim.frames
            .filter((f) => f < frameTotal)
            .map((frame) => ({ key: anim.textureKey, frame }));
        } else if (anim.startFrame !== undefined && anim.endFrame !== undefined) {
          const maxEnd = Math.min(anim.endFrame, frameTotal - 1);
          const start = Math.min(anim.startFrame, maxEnd);
          frames = scene.anims.generateFrameNumbers(anim.textureKey, {
            start,
            end: maxEnd,
          });
        }

        if (frames.length > 0) {
          scene.anims.create({
            key: anim.key,
            frames,
            frameRate: anim.frameRate,
            repeat: anim.repeat,
          });
        }
      } else {
        // Single-frame texture / procedural fallback
        scene.anims.create({
          key: anim.key,
          frames: [{ key: anim.textureKey, frame: 0 }],
          frameRate: 1,
          repeat: -1,
        });
      }
    } catch {
      // Safe fallback - single frame 0
      scene.anims.create({
        key: anim.key,
        frames: [{ key: anim.textureKey, frame: 0 }],
        frameRate: 1,
        repeat: -1,
      });
    }
  });
}

/**
 * Safely plays an animation on a sprite.
 * If the animation does not exist or has 1 frame, prevents errors and handles fallback.
 */
export function safePlayAnimation(
  sprite: Phaser.GameObjects.Sprite,
  animKey: string,
  ignoreIfPlaying = true
): boolean {
  if (!sprite) return false;

  if (sprite.scene && sprite.scene.anims && sprite.scene.anims.exists(animKey)) {
    if (typeof sprite.play === 'function') {
      sprite.play(animKey, ignoreIfPlaying);
      return true;
    }
  }
  return false;
}
