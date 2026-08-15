import Phaser from 'phaser';

export interface TextureGenerationOptions {
  /** If true, overwrites existing textures in Phaser's TextureManager */
  force?: boolean;
}

/**
 * Procedurally generates 16-bit Pixel Art Sprites & Textures for Phaser 3
 */
/* v8 ignore start -- Geração de sprites é código visual não coberto por testes unitários */
export function generateGameTextures(scene: Phaser.Scene, options: TextureGenerationOptions = {}) {
  const addTexture = (key: string, canvas: HTMLCanvasElement) => {
    if (!options.force && scene.textures.exists(key)) {
      return;
    }
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    scene.textures.addCanvas(key, canvas);
  };

  const addTextureWithNormalMap = (key: string, canvas: HTMLCanvasElement) => {
    if (!options.force && scene.textures.exists(key)) {
      return;
    }
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    const normalMap = generateNormalMap(canvas);
    const textureManager = scene.textures as any;
    textureManager.addImage(key, canvas, normalMap);
  };

  const createPixelCanvas = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      drawFn(ctx);
    }
    return canvas;
  };

  // 1. Dark Gothic Isometric Ground Tile (64x32 Isometric Diamond)
  const tileCanvas = createPixelCanvas(64, 32, (ctx) => {
    // Fill dark stone diamond base
    ctx.fillStyle = '#140e15';
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Dark slate stone border mortar
    ctx.strokeStyle = '#221623';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cobblestone / Flagstone slab pixel textures
    ctx.fillStyle = '#1f1621';
    ctx.fillRect(18, 6, 12, 6);
    ctx.fillRect(34, 10, 14, 7);
    ctx.fillRect(12, 16, 16, 8);
    ctx.fillRect(32, 20, 12, 6);

    // Subtle stone highlights
    ctx.fillStyle = '#2b1e2d';
    ctx.fillRect(19, 7, 10, 2);
    ctx.fillRect(35, 11, 12, 2);
    ctx.fillRect(13, 17, 14, 2);

    // Ancient blood stains on dungeon floor
    ctx.fillStyle = 'rgba(100, 12, 20, 0.65)';
    ctx.fillRect(26, 12, 6, 4);
    ctx.fillRect(30, 15, 5, 4);
  });
  addTextureWithNormalMap('tile_ground', tileCanvas);

  // 2. Bloodmage Player (32x48)
  const playerCanvas = createPixelCanvas(32, 48, (ctx) => {
    // Dark red hood & robe
    ctx.fillStyle = '#110507'; // Shadow
    ctx.fillRect(8, 8, 16, 38);

    ctx.fillStyle = '#7a121d'; // Crimson Cape
    ctx.fillRect(10, 10, 12, 36);

    // Hood & Shoulders
    ctx.fillStyle = '#a81c2b';
    ctx.fillRect(10, 4, 12, 12);
    ctx.fillRect(8, 14, 16, 8);

    // Glowing Crimson Eyes
    ctx.fillStyle = '#ff3344';
    ctx.fillRect(12, 9, 3, 2);
    ctx.fillRect(17, 9, 3, 2);

    // Staff of Blood
    ctx.fillStyle = '#3a271d'; // Wood
    ctx.fillRect(24, 6, 3, 38);

    // Staff Ruby Orb
    ctx.fillStyle = '#ff1133';
    ctx.beginPath();
    ctx.arc(25.5, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Golden Trim
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(11, 20, 10, 2);
  });
  addTextureWithNormalMap('spr_bloodmage', playerCanvas);

  // 3. Skeleton Warrior (32x40)
  const skeletonCanvas = createPixelCanvas(32, 40, (ctx) => {
    // Skull
    ctx.fillStyle = '#d1c7b7';
    ctx.fillRect(10, 4, 12, 10);
    // Eye sockets
    ctx.fillStyle = '#0f0c08';
    ctx.fillRect(12, 7, 3, 3);
    ctx.fillRect(17, 7, 3, 3);

    // Ribcage & Spine
    ctx.fillStyle = '#e8e0d3';
    ctx.fillRect(12, 14, 8, 12);
    ctx.fillStyle = '#100e0b';
    ctx.fillRect(12, 17, 8, 2);
    ctx.fillRect(12, 21, 8, 2);

    // Rusty Sword
    ctx.fillStyle = '#73706c';
    ctx.fillRect(22, 10, 3, 22);
    ctx.fillStyle = '#8f4115'; // Rust
    ctx.fillRect(22, 18, 3, 6);
  });
  addTextureWithNormalMap('spr_skeleton', skeletonCanvas);

  // 4. Cultist Acolyte (32x40)
  const cultistCanvas = createPixelCanvas(32, 40, (ctx) => {
    // Purple robe
    ctx.fillStyle = '#3b1254';
    ctx.fillRect(8, 10, 16, 28);
    // Dark cowl
    ctx.fillStyle = '#5c1d85';
    ctx.fillRect(10, 4, 12, 10);
    // Green glowing eyes
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
  });
  addTexture('spr_cultist', cultistCanvas);

  // 5. Hell Hound (36x28)
  const houndCanvas = createPixelCanvas(36, 28, (ctx) => {
    // Demonic red quadruped
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(6, 8, 22, 12);
    // Head & Fangs
    ctx.fillRect(24, 4, 10, 10);
    ctx.fillStyle = '#facc15'; // Yellow eyes
    ctx.fillRect(28, 6, 3, 2);
    ctx.fillStyle = '#ffffff'; // Fangs
    ctx.fillRect(32, 12, 2, 4);
    // Spikes on back
    ctx.fillStyle = '#18181b';
    ctx.fillRect(10, 4, 2, 4);
    ctx.fillRect(16, 4, 2, 4);
    ctx.fillRect(22, 4, 2, 4);
  });
  addTextureWithNormalMap('spr_hound', houndCanvas);

  // 6. Flesh Golem (48x56)
  const golemCanvas = createPixelCanvas(48, 56, (ctx) => {
    // Massive stitched body
    ctx.fillStyle = '#3f2e2b';
    ctx.fillRect(8, 10, 32, 40);
    // Sutures & Scars
    ctx.fillStyle = '#8c2d19';
    ctx.fillRect(16, 16, 16, 3);
    ctx.fillRect(22, 28, 12, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(20, 14, 2, 7);
    ctx.fillRect(26, 26, 2, 7);
    // Head
    ctx.fillStyle = '#2b1e1b';
    ctx.fillRect(18, 2, 12, 10);
    ctx.fillStyle = '#ef4444'; // Glowing red eye
    ctx.fillRect(20, 5, 4, 3);
  });
  addTexture('spr_golem', golemCanvas);

  // 7. Blood Specter (32x40)
  const specterCanvas = createPixelCanvas(32, 40, (ctx) => {
    ctx.fillStyle = 'rgba(225, 29, 72, 0.85)';
    ctx.beginPath();
    ctx.arc(16, 14, 12, 0, Math.PI * 2);
    ctx.fill();
    // Wispy tail
    ctx.fillRect(10, 20, 12, 18);
    // White glowing hollow eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 12, 3, 4);
    ctx.fillRect(18, 12, 3, 4);
  });
  addTexture('spr_specter', specterCanvas);

  // 8. Necro Lord Boss (64x72)
  const bossCanvas = createPixelCanvas(64, 72, (ctx) => {
    // Huge obsidian armor & horned helm
    ctx.fillStyle = '#18181b';
    ctx.fillRect(16, 16, 32, 50);
    // Horns
    ctx.fillRect(10, 4, 6, 16);
    ctx.fillRect(48, 4, 6, 16);
    // Glowing red chest gem
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(32, 32, 8, 0, Math.PI * 2);
    ctx.fill();
    // Crimson cape
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(12, 22, 6, 44);
    ctx.fillRect(46, 22, 6, 44);
  });
  addTexture('spr_boss', bossCanvas);

  // 8b. Zombie Shambler (32x40) - Classic Rotting Corpse
  const zombieCanvas = createPixelCanvas(32, 40, (ctx) => {
    // Olive/decay green rotting flesh
    ctx.fillStyle = '#2d3a24';
    ctx.fillRect(8, 10, 16, 26);
    // Open gore chest wound
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(12, 16, 8, 10);
    // Exposed ribcage bone
    ctx.fillStyle = '#dcd3c1';
    ctx.fillRect(13, 18, 6, 2);
    ctx.fillRect(13, 22, 6, 2);
    // Head with missing jaw
    ctx.fillStyle = '#3a4a2f';
    ctx.fillRect(10, 2, 12, 10);
    ctx.fillStyle = '#f59e0b'; // Feral glowing yellow eyes
    ctx.fillRect(12, 5, 2, 2);
    ctx.fillRect(17, 5, 2, 2);
  });
  addTexture('spr_zombie_shambler', zombieCanvas);

  // 8c. Vampire Stalker (32x44) - Aristocratic Blood Predator
  const vampireCanvas = createPixelCanvas(32, 44, (ctx) => {
    // Pale alabaster skin
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(10, 2, 12, 10);
    // Velvet black coat & crimson lining
    ctx.fillStyle = '#18181b';
    ctx.fillRect(6, 12, 20, 30);
    ctx.fillStyle = '#991b1b'; // Red cape interior
    ctx.fillRect(4, 12, 4, 28);
    ctx.fillRect(24, 12, 4, 28);
    // Glowing crimson eyes & sharp white fangs
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(12, 5, 2, 2);
    ctx.fillRect(18, 5, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 9, 2, 3);
    ctx.fillRect(17, 9, 2, 3);
  });
  addTexture('spr_vampire_stalker', vampireCanvas);

  // 8d. Werewolf Lycan (38x44) - Feral Beast
  const lycanCanvas = createPixelCanvas(38, 44, (ctx) => {
    // Dark hunched charcoal fur
    ctx.fillStyle = '#27272a';
    ctx.fillRect(6, 8, 26, 32);
    // Hunched head with snout
    ctx.fillRect(12, 2, 18, 10);
    // Massive razor claws
    ctx.fillStyle = '#a1a1aa';
    ctx.fillRect(2, 22, 5, 12);
    ctx.fillRect(31, 22, 5, 12);
    // Feral yellow eyes & white fangs
    ctx.fillStyle = '#facc15';
    ctx.fillRect(20, 4, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 8, 3, 3);
  });
  addTexture('spr_werewolf_lycan', lycanCanvas);

  // 8e. Bat Swarm (20x20) - Fast Shadow Bat
  const batCanvas = createPixelCanvas(20, 20, (ctx) => {
    // Small dark purple body
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(8, 6, 4, 8);
    // Membrane wings
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(1, 2);
    ctx.lineTo(4, 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 8);
    ctx.lineTo(19, 2);
    ctx.lineTo(16, 14);
    ctx.closePath();
    ctx.fill();
    // Glowing red eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, 7, 1, 1);
    ctx.fillRect(11, 7, 1, 1);
  });
  addTexture('spr_bat_swarm', batCanvas);

  // 8f. Gore Abomination (52x60) - Huge Pulsating Flesh Colossus
  const abomCanvas = createPixelCanvas(52, 60, (ctx) => {
    // Massive gore flesh colossus
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(8, 10, 36, 46);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(12, 14, 28, 38);
    // Toxic green puss pustules
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(18, 22, 5, 0, Math.PI * 2);
    ctx.arc(32, 34, 6, 0, Math.PI * 2);
    ctx.arc(22, 42, 4, 0, Math.PI * 2);
    ctx.fill();
    // Bone protrusions
    ctx.fillStyle = '#dcd3c1';
    ctx.fillRect(4, 18, 6, 12);
    ctx.fillRect(42, 28, 6, 12);
    // Multiple glowing eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(20, 6, 3, 3);
    ctx.fillRect(26, 8, 2, 2);
    ctx.fillRect(30, 5, 3, 3);
  });
  addTexture('spr_gore_abomination', abomCanvas);

  // 9. Projectile: Blood Bolt (16x16)
  const boltCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  addTexture('proj_blood_bolt', boltCanvas);

  // 10. Projectile: Cultist Energy Bolt (16x16)
  const energyBoltCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0abfc';
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  addTexture('proj_energy_bolt', energyBoltCanvas);

  // 11. Health Orb (16x16)
  const hporbCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(5, 5, 3, 3);
  });
  addTexture('orb_hp', hporbCanvas);

  // 12. Mana Orb (16x16)
  const manaorbCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(5, 5, 3, 3);
  });
  addTexture('orb_mana', manaorbCanvas);

  // 13. XP Blood Gem (12x12)
  const gemCanvas = createPixelCanvas(12, 12, (ctx) => {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(12, 6);
    ctx.lineTo(6, 12);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
  });
  addTexture('gem_xp', gemCanvas);

  // 14. Particle Blood Drop (8x8)
  const bloodPartCanvas = createPixelCanvas(8, 8, (ctx) => {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(1, 1, 6, 6);
  });
  addTexture('particle_blood_red', bloodPartCanvas);

  // 14b. Status Effect Particles (Ember Spark, Frost Crystal, Dark Flame)
  const emberPartCanvas = createPixelCanvas(6, 6, (ctx) => {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(1, 1, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 2, 2);
  });
  addTexture('particle_ember_spark', emberPartCanvas);

  const frostPartCanvas = createPixelCanvas(8, 8, (ctx) => {
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(3, 1, 2, 6);
    ctx.fillRect(1, 3, 6, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 3, 2, 2);
  });
  addTexture('particle_frost_crystal', frostPartCanvas);

  const darkFlamePartCanvas = createPixelCanvas(8, 8, (ctx) => {
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(3, 1, 2, 4);
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(3, 4, 2, 3);
  });
  addTexture('particle_dark_flame', darkFlamePartCanvas);

  // 14c. Dynamic Directional Ground Shadow Disc (32x16)
  const shadowDiscCanvas = createPixelCanvas(32, 16, (ctx) => {
    const grad = ctx.createRadialGradient(16, 8, 2, 16, 8, 15);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(16, 8, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  addTexture('spr_shadow_disc', shadowDiscCanvas);

  // 14d. Liquid Reflection Distortion Wave (32x16)
  const rippleCanvas = createPixelCanvas(32, 16, (ctx) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(16, 8, 14, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(16, 8, 8, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  addTexture('spr_reflection_ripple', rippleCanvas);

  // 15. Blood Pool Ground Stain (32x20)
  const bloodPoolCanvas = createPixelCanvas(32, 20, (ctx) => {
    ctx.fillStyle = 'rgba(120, 10, 18, 0.75)';
    ctx.beginPath();
    ctx.ellipse(16, 10, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  addTexture('blood_pool_stain', bloodPoolCanvas);

  // 16. Dungeon Stone Brick Wall Block (32x32)
  const wallCanvas = createPixelCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#221922'; // Base dark stone
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#3a2d3c'; // Bricks
    ctx.fillRect(2, 2, 13, 6);
    ctx.fillRect(17, 2, 13, 6);
    ctx.fillRect(2, 10, 28, 6);
    ctx.fillRect(2, 18, 13, 6);
    ctx.fillRect(17, 18, 13, 6);
    ctx.fillRect(2, 26, 28, 4);

    // Highlights & Moss
    ctx.fillStyle = '#533e56';
    ctx.fillRect(2, 2, 13, 1);
    ctx.fillRect(17, 2, 13, 1);
    ctx.fillStyle = '#1e382b'; // Dark moss in crevices
    ctx.fillRect(12, 14, 4, 2);
    ctx.fillRect(2, 24, 6, 2);
  });
  addTexture('tile_wall_brick', wallCanvas);

  // 17. Dungeon Door Archway (32x32)
  const doorCanvas = createPixelCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#1c131d';
    ctx.fillRect(0, 0, 32, 32);

    // Archway outline
    ctx.fillStyle = '#4a2333';
    ctx.beginPath();
    ctx.arc(16, 16, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(4, 16, 24, 14);

    // Inner passage shadow
    ctx.fillStyle = '#0a050a';
    ctx.beginPath();
    ctx.arc(16, 16, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(7, 16, 18, 14);
  });
  addTexture('tile_door', doorCanvas);

  // 18. Portal to Next Dungeon Floor (40x40)
  const portalCanvas = createPixelCanvas(40, 40, (ctx) => {
    ctx.fillStyle = '#831843'; // Outer rim
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626'; // Mid swirl
    ctx.beginPath();
    ctx.arc(20, 20, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a'; // Glowing core
    ctx.beginPath();
    ctx.arc(20, 20, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  addTexture('spr_portal', portalCanvas);

  // 19. Dungeon Treasure Chest (24x20)
  const chestCanvas = createPixelCanvas(24, 20, (ctx) => {
    ctx.fillStyle = '#78350f'; // Dark wood
    ctx.fillRect(2, 4, 20, 14);

    ctx.fillStyle = '#d97706'; // Gold trim
    ctx.fillRect(2, 4, 20, 3);
    ctx.fillRect(2, 15, 20, 3);
    ctx.fillRect(10, 4, 4, 14);

    ctx.fillStyle = '#fef08a'; // Glowing lock
    ctx.fillRect(10, 9, 4, 4);
  });
  addTexture('spr_chest', chestCanvas);

  const chestDirs = ['south', 'south_west', 'west', 'north_west', 'north', 'north_east', 'east', 'south_east'];
  chestDirs.forEach((dir) => {
    addTexture(`spr_chest_${dir}`, chestCanvas);
  });

  // 19b. Skeleton Remains (Bones)
  const bonesCanvas = createPixelCanvas(24, 18, (ctx) => {
    ctx.fillStyle = '#e3dac9'; // Bone white
    // Draw skull
    ctx.fillRect(8, 2, 8, 8);
    ctx.fillStyle = '#111111'; // Eye sockets
    ctx.fillRect(10, 4, 2, 2);
    ctx.fillRect(13, 4, 2, 2);
    // Draw crossbones
    ctx.fillStyle = '#e3dac9';
    ctx.fillRect(2, 11, 20, 2);
    ctx.fillRect(4, 8, 2, 8);
    ctx.fillRect(18, 8, 2, 8);
  });
  addTexture('spr_skeleton_remains', bonesCanvas);

  // 19c. Dead Soldier
  const corpseCanvas = createPixelCanvas(28, 16, (ctx) => {
    ctx.fillStyle = '#475569'; // Steel armor body
    ctx.fillRect(4, 4, 18, 8);
    ctx.fillStyle = '#991b1b'; // Dried blood
    ctx.fillRect(12, 5, 4, 4);
    ctx.fillStyle = '#e2e8f0'; // Helmet
    ctx.fillRect(2, 4, 4, 6);
    ctx.fillStyle = '#1e293b'; // Boots/gloves
    ctx.fillRect(22, 5, 4, 5);
  });
  addTexture('spr_dead_soldier', corpseCanvas);

  // 20. AI Alert Icon "!" (12x18)
  const alertCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(4, 1, 4, 10);
    ctx.fillRect(4, 13, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 2, 2, 8);
    ctx.fillRect(5, 14, 2, 2);
  });
  addTexture('icon_alert', alertCanvas);

  // 21. AI Suspicious Icon "?" (12x18)
  const questCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, 1, 8, 3);
    ctx.fillRect(7, 4, 3, 4);
    ctx.fillRect(4, 8, 4, 3);
    ctx.fillRect(4, 13, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 14, 2, 2);
  });
  addTexture('icon_suspicious', questCanvas);

  // 22. AI Panic/Flee Icon (12x18)
  const fleeCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(6, 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(10, 12);
    ctx.lineTo(2, 12);
    ctx.closePath();
    ctx.fill();
  });
  addTexture('icon_flee', fleeCanvas);

  // 23. Torch Light Sprite (128×128 — visible handle + flame + glow)
  const torchLightCanvas = createPixelCanvas(128, 128, (ctx) => {
    // Draw torch handle (brown wooden stick) — centered at (64, 64), pointing down-right
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(59, 70, 10, 28);            // stick
    ctx.fillStyle = '#3d2510';
    ctx.fillRect(61, 72, 6, 24);              // stick shadow side

    // Flame core (bright yellow-white teardrop)
    ctx.fillStyle = '#ffecb3';
    ctx.beginPath();
    ctx.ellipse(64, 56, 10, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flame mid (orange)
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.ellipse(64, 58, 14, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flame outer (red)
    ctx.fillStyle = '#d43d1a';
    ctx.beginPath();
    ctx.ellipse(64, 60, 18, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow gradient over everything
    const gradient = ctx.createRadialGradient(64, 58, 0, 64, 58, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(0.2, 'rgba(255, 150, 50, 0.35)');
    gradient.addColorStop(0.45, 'rgba(200, 80, 20, 0.15)');
    gradient.addColorStop(0.75, 'rgba(100, 30, 10, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  });
  addTexture('light_torch', torchLightCanvas);

  // 24. Brazier / Large Light Sprite (192×192 — visible bowl + flame + glow)
  const brazierLightCanvas = createPixelCanvas(192, 192, (ctx) => {
    // Brazier bowl (dark metal cauldron shape) — centered at (96, 106)
    ctx.fillStyle = '#2a1e1a';
    ctx.beginPath();
    ctx.moveTo(66, 92);
    ctx.lineTo(56, 118);
    ctx.lineTo(60, 130);
    ctx.lineTo(132, 130);
    ctx.lineTo(136, 118);
    ctx.lineTo(126, 92);
    ctx.closePath();
    ctx.fill();

    // Bowl rim highlight
    ctx.fillStyle = '#4a3630';
    ctx.fillRect(64, 92, 64, 4);

    // Bowl inner (dark ember glow)
    ctx.fillStyle = '#8a3a1a';
    ctx.fillRect(68, 96, 56, 18);

    // Embers inside
    ctx.fillStyle = '#ff6a20';
    ctx.fillRect(76, 100, 8, 6);
    ctx.fillRect(92, 98, 10, 8);
    ctx.fillRect(110, 102, 6, 4);

    // Flame rising from bowl (multiple tongues)
    for (let i = 0; i < 5; i++) {
      const fx = 78 + i * 9;
      const fy = 68 + Math.sin(i * 1.3) * 8;
      const fw = 6 + (i % 3) * 2;
      const fh = 14 + (i % 4) * 6;
      ctx.fillStyle = i % 2 === 0 ? '#ff8c42' : '#d43d1a';
      ctx.beginPath();
      ctx.ellipse(fx, fy, fw, fh, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flame core
    ctx.fillStyle = '#ffecb3';
    ctx.beginPath();
    ctx.ellipse(96, 62, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow gradient
    const gradient = ctx.createRadialGradient(96, 80, 0, 96, 80, 96);
    gradient.addColorStop(0, 'rgba(255, 180, 80, 0.45)');
    gradient.addColorStop(0.2, 'rgba(255, 120, 40, 0.3)');
    gradient.addColorStop(0.4, 'rgba(200, 70, 20, 0.12)');
    gradient.addColorStop(0.65, 'rgba(100, 30, 10, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 192, 192);
  });
  addTexture('light_brazier', brazierLightCanvas);

  // 25. Ground Mist / Fog Texture (128×128 soft clouds)
  const fogCanvas = createPixelCanvas(128, 128, (ctx) => {
    for (let i = 0; i < 300; i++) {
      const fx = Math.random() * 128;
      const fy = Math.random() * 128;
      const fr = 6 + Math.random() * 20;
      const alpha = 0.01 + Math.random() * 0.04;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  addTexture('fog_mist', fogCanvas);
}

/**
 * Procedurally generates 16-bit UI textures & fallback graphics for menus and HUDs
 */
export function generateUITextures(scene: Phaser.Scene, onlyKeys?: string[]) {
  const addTexture = (key: string, canvas: HTMLCanvasElement) => {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    scene.textures.addCanvas(key, canvas);
  };

  const createPixelCanvas = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      drawFn(ctx);
    }
    return canvas;
  };

  const builders: Record<string, () => HTMLCanvasElement> = {
    // 1. Red Ruby Diamond Gem (uiGem)
    uiGem: () => createPixelCanvas(64, 64, (ctx) => {
      // Outer Gold Diamond Border
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(62, 32);
      ctx.lineTo(32, 62);
      ctx.lineTo(2, 32);
      ctx.closePath();
      ctx.fill();

      // Inner Dark Maroon Outline
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(32, 6);
      ctx.lineTo(58, 32);
      ctx.lineTo(32, 58);
      ctx.lineTo(6, 32);
      ctx.closePath();
      ctx.fill();

      // Main Ruby Body
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(32, 8);
      ctx.lineTo(56, 32);
      ctx.lineTo(32, 56);
      ctx.lineTo(8, 32);
      ctx.closePath();
      ctx.fill();

      // Upper-left Facet (Bright Red)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(32, 8);
      ctx.lineTo(32, 32);
      ctx.lineTo(8, 32);
      ctx.closePath();
      ctx.fill();

      // Top Facet Highlight (Light Pink/White)
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.moveTo(32, 8);
      ctx.lineTo(22, 20);
      ctx.lineTo(32, 20);
      ctx.closePath();
      ctx.fill();

      // Specular Sparkle Spot
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(26, 16, 4, 4);

      // Lower-Right Facet (Dark Crimson Shadow)
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(32, 32);
      ctx.lineTo(56, 32);
      ctx.lineTo(32, 56);
      ctx.closePath();
      ctx.fill();
    }),

    // 2. Gothic Slider End Cap (uiCap)
    uiCap: () => createPixelCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 32, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Small Ruby Diamond Stud
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(32, 20);
      ctx.lineTo(44, 32);
      ctx.lineTo(32, 44);
      ctx.lineTo(20, 32);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, 24, 3, 3);
    }),

    // 3. Gothic Corner Bracket (uiCorner)
    uiCorner: () => createPixelCanvas(180, 180, (ctx) => {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 180, 32);
      ctx.fillRect(0, 0, 32, 180);

      ctx.fillStyle = '#c9a227';
      ctx.fillRect(0, 0, 180, 6);
      ctx.fillRect(0, 0, 6, 180);

      ctx.fillRect(0, 26, 180, 4);
      ctx.fillRect(26, 0, 4, 180);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(18, 18, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }),

    // 4. Header Plaque Banner (uiPlaque)
    uiPlaque: () => createPixelCanvas(600, 130, (ctx) => {
      ctx.fillStyle = '#110d13';
      ctx.fillRect(0, 0, 600, 130);

      ctx.fillStyle = '#221623';
      ctx.fillRect(10, 10, 580, 110);

      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 588, 118);

      ctx.strokeStyle = '#7a5d12';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, 568, 98);

      const studs = [[24, 24], [576, 24], [24, 106], [576, 106]];
      studs.forEach(([sx, sy]) => {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }),

    // 5. Title Logo Banner (logo)
    logo: () => createPixelCanvas(520, 291, (ctx) => {
      ctx.fillStyle = '#0f080c';
      ctx.fillRect(10, 10, 500, 271);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 488, 259);

      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 4;
      ctx.strokeRect(26, 26, 468, 239);

      ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(260, 145, 90, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = "bold 56px Georgia, 'Times New Roman', serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#1c0305';
      ctx.fillText('BLOODMAGE', 263, 128);

      ctx.fillStyle = '#e8c76a';
      ctx.fillText('BLOODMAGE', 260, 125);

      ctx.font = "bold 38px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = '#dc2626';
      ctx.fillText('1995', 262, 192);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('1995', 260, 190);
    }),

    // 6. Top Gargoyle (gargoyleTop)
    gargoyleTop: () => createPixelCanvas(200, 200, (ctx) => {
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.arc(100, 80, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(60, 20, 20, 50);
      ctx.fillRect(120, 20, 20, 50);
      ctx.fillRect(30, 110, 140, 70);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(80, 75, 10, 6);
      ctx.fillRect(110, 75, 10, 6);
    }),

    // 7. Bottom Gargoyle (gargoyleBottom)
    gargoyleBottom: () => createPixelCanvas(176, 176, (ctx) => {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(28, 40, 120, 100);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(40, 120, 20, 40);
      ctx.fillRect(78, 120, 20, 40);
      ctx.fillRect(116, 120, 20, 40);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(83, 70, 10, 10);
    }),

    // 8. Torch Bracket (torch)
    torch: () => createPixelCanvas(140, 140, (ctx) => {
      ctx.fillStyle = '#262626';
      ctx.fillRect(50, 60, 40, 60);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(62, 30, 16, 80);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(70, 30, 18, 0, Math.PI * 2);
      ctx.fill();
    }),

    // 9. Stone Altar (altar)
    altar: () => createPixelCanvas(470, 190, (ctx) => {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(20, 40, 430, 130);

      ctx.fillStyle = '#292524';
      ctx.fillRect(10, 20, 450, 30);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 100); ctx.lineTo(100, 80); ctx.lineTo(120, 100);
      ctx.moveTo(210, 80); ctx.lineTo(235, 120); ctx.lineTo(260, 80);
      ctx.moveTo(350, 100); ctx.lineTo(370, 80); ctx.lineTo(390, 100);
      ctx.stroke();
    }),

    // 10. Rune Arch (runeArch)
    runeArch: () => createPixelCanvas(560, 350, (ctx) => {
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.arc(280, 350, 240, Math.PI, 0);
      ctx.stroke();

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(280, 350, 240, Math.PI, 0);
      ctx.stroke();
    }),

    // 11. Stone Tile (stoneTile)
    stoneTile: () => createPixelCanvas(128, 128, (ctx) => {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 128, 128);

      ctx.fillStyle = '#27272a';
      ctx.fillRect(4, 4, 58, 58);
      ctx.fillRect(66, 4, 58, 58);
      ctx.fillRect(4, 66, 58, 58);
      ctx.fillRect(66, 66, 58, 58);

      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(6, 6, 54, 4);
      ctx.fillRect(68, 6, 54, 4);
    }),

    // 12. Rock Tile (rockTile)
    rockTile: () => createPixelCanvas(128, 128, (ctx) => {
      ctx.fillStyle = '#140e15';
      ctx.fillRect(0, 0, 128, 128);

      ctx.fillStyle = '#1f1621';
      for (let i = 0; i < 16; i++) {
        const rx = (i * 37) % 110;
        const ry = (i * 53) % 110;
        ctx.fillRect(rx, ry, 24, 18);
      }
    }),
  };

  const keysToBuild = onlyKeys || Object.keys(builders);
  keysToBuild.forEach((key) => {
    if (builders[key]) {
      addTexture(key, builders[key]());
    }
  });
}
/* v8 ignore stop */

/**
 * Gera um normal map procedural a partir de uma textura de altura/alpha.
 * Cada pixel recebe a normal derivada do gradiente de luminância (Sobel simplificado):
 * - Canais R/G codificam a direção (0-255, 128 = plano)
 * - Canal B codifica a "elevação" (alturas ficam mais claras)
 * Retorna um canvas pronto para uso como normal map (RGB).
 *
 * @param source Canvas de origem (qualquer textura procedimental).
 * @param strength Fator de intensidade da elevação (default 2.0).
 * @param invert Inverter a altura (default false).
 */
export function generateNormalMap(
  source: HTMLCanvasElement,
  strength: number = 2.0,
  invert: boolean = false
): HTMLCanvasElement {
  const width = source.width;
  const height = source.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const srcCtx = source.getContext('2d');
  if (!ctx || !srcCtx) return canvas;

  const imageData = srcCtx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const out = ctx.createImageData(width, height);
  const dst = out.data;

  const lum = (i: number): number => {
    return 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(width - 1, x + 1);
      const y0 = Math.max(0, y - 1);
      const y1 = Math.min(height - 1, y + 1);

      const hL = lum((y * width + x0) * 4);
      const hR = lum((y * width + x1) * 4);
      const hU = lum((y0 * width + x) * 4);
      const hD = lum((y1 * width + x) * 4);

      let dx = hL - hR;
      let dy = hU - hD;
      if (invert) {
        dx = -dx;
        dy = -dy;
      }

      const nx = Math.max(-1, Math.min(1, dx / 255)) * strength;
      const ny = Math.max(-1, Math.min(1, dy / 255)) * strength;
      const nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      dst[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}
