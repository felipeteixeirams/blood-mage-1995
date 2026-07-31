import Phaser from 'phaser';

/**
 * Stitch Design Tokens for Bloodmage 1995.
 * High-fidelity Dark Fantasy color palette.
 */
export const StitchTokens = {
  background: '#0a0508',       // OLED Deep Dark / Void
  charcoalDark: '#110e12',
  charcoalMedium: '#1e1917',
  crimsonRed: '#7a0f1a',
  crimsonBright: '#dc2626',
  crimsonDark: '#99000a',
  tarnishedGold: '#b8860b',
  goldBright: '#eab308',
  boneWhite: '#cbd5e1',
  boneCream: '#e3dac9',
  primaryElectricBlue: '#00D1FF',
  secondaryViolet: '#AF52DE',
  tertiaryMint: '#10b981',
};

/**
 * Procedurally generates 16-bit Dark Fantasy Pixel Art Sprites & Textures for Phaser 3
 * Using synchronous HTMLCanvas elements to prevent race conditions.
 */
export function generateGameTextures(scene: Phaser.Scene) {
  // Check if textures already generated
  if (scene.textures.exists('spr_bloodmage')) return;

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

  // 1. Isometric Ground Tile (64x32 Isometric Diamond)
  const tileCanvas = createPixelCanvas(64, 32, (ctx) => {
    // Fill dark charcoal stone diamond
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Dark borders using charcoal medium
    ctx.strokeStyle = StitchTokens.charcoalMedium;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cobblestone pixel details
    ctx.fillStyle = '#261a1e';
    ctx.fillRect(20, 8, 8, 4);
    ctx.fillRect(36, 12, 10, 5);
    ctx.fillRect(16, 18, 12, 6);
    ctx.fillRect(38, 22, 8, 4);

    // Blood stains - Crimson dark
    ctx.fillStyle = StitchTokens.crimsonDark;
    ctx.fillRect(28, 14, 4, 3);
    ctx.fillRect(32, 16, 3, 3);
  });
  scene.textures.addCanvas('tile_ground', tileCanvas);

  // 2. Bloodmage Player (32x48)
  const playerCanvas = createPixelCanvas(32, 48, (ctx) => {
    // Shadow under cape
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(8, 8, 16, 38);

    // Crimson Cape - Crimson dark
    ctx.fillStyle = StitchTokens.crimsonDark;
    ctx.fillRect(10, 10, 12, 36);

    // Hood & shoulders - Crimson bright
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.fillRect(10, 4, 12, 12);
    ctx.fillRect(8, 14, 16, 8);

    // Glowing eyes - Crimson bright
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.fillRect(12, 9, 3, 2);
    ctx.fillRect(17, 9, 3, 2);

    // Staff of Blood (wood)
    ctx.fillStyle = '#3a2118';
    ctx.fillRect(24, 6, 3, 38);

    // Ruby on staff - Crimson bright
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.beginPath();
    ctx.arc(25.5, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tarnished Gold Trim
    ctx.fillStyle = StitchTokens.tarnishedGold;
    ctx.fillRect(11, 20, 10, 2);
  });
  scene.textures.addCanvas('spr_bloodmage', playerCanvas);

  // 3. Skeleton Warrior (32x40)
  const skeletonCanvas = createPixelCanvas(32, 40, (ctx) => {
    // Skull - Bone cream
    ctx.fillStyle = StitchTokens.boneCream;
    ctx.fillRect(10, 4, 12, 10);
    // Sockets - Charcoal dark
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(12, 7, 3, 3);
    ctx.fillRect(17, 7, 3, 3);

    // Ribcage & Spine - Bone white
    ctx.fillStyle = StitchTokens.boneWhite;
    ctx.fillRect(12, 14, 8, 12);
    ctx.fillStyle = StitchTokens.charcoalMedium;
    ctx.fillRect(12, 17, 8, 2);
    ctx.fillRect(12, 21, 8, 2);

    // Rusty Sword
    ctx.fillStyle = '#645d5a';
    ctx.fillRect(22, 10, 3, 22);
    ctx.fillStyle = StitchTokens.crimsonRed; // Dried rust/blood
    ctx.fillRect(22, 18, 3, 6);
  });
  scene.textures.addCanvas('spr_skeleton', skeletonCanvas);

  // 4. Cultist Acolyte (32x40)
  const cultistCanvas = createPixelCanvas(32, 40, (ctx) => {
    // Purple robe - Secondary violet
    ctx.fillStyle = '#331c44';
    ctx.fillRect(8, 10, 16, 28);
    ctx.fillStyle = StitchTokens.secondaryViolet;
    ctx.fillRect(10, 4, 12, 10);

    // Skull mask - Bone cream
    ctx.fillStyle = StitchTokens.boneCream;
    ctx.fillRect(11, 5, 10, 8);
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(13, 8, 2, 2);
    ctx.fillRect(17, 8, 2, 2);

    // Eldritch green/mint eyes
    ctx.fillStyle = StitchTokens.tertiaryMint;
    ctx.fillRect(13, 8, 1, 1);
    ctx.fillRect(17, 8, 1, 1);
  });
  scene.textures.addCanvas('spr_cultist', cultistCanvas);

  // 5. Hell Hound (36x28)
  const houndCanvas = createPixelCanvas(36, 28, (ctx) => {
    // Charcoal body
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(6, 8, 22, 12);

    // Veins of magma - Crimson bright
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.fillRect(10, 10, 4, 2);
    ctx.fillRect(18, 13, 4, 2);

    // Head
    ctx.fillStyle = StitchTokens.charcoalMedium;
    ctx.fillRect(24, 4, 10, 10);

    // Yellow/gold eyes
    ctx.fillStyle = StitchTokens.goldBright;
    ctx.fillRect(28, 6, 3, 2);

    // Fangs - Bone white
    ctx.fillStyle = StitchTokens.boneWhite;
    ctx.fillRect(32, 12, 2, 4);

    // Obsidian spikes on back
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(10, 4, 2, 4);
    ctx.fillRect(16, 4, 2, 4);
    ctx.fillRect(22, 4, 2, 4);
  });
  scene.textures.addCanvas('spr_hound', houndCanvas);

  // 6. Flesh Golem (48x56)
  const golemCanvas = createPixelCanvas(48, 56, (ctx) => {
    // Stitched necrotic body - mix of decaying colors (dead green, bruised purple, pale grey)
    ctx.fillStyle = '#445143'; // Decaying Green
    ctx.fillRect(8, 10, 32, 40);

    ctx.fillStyle = '#392d47'; // Bruised Purple
    ctx.fillRect(8, 18, 12, 20);
    ctx.fillStyle = '#7a7682'; // Pale Grey patches
    ctx.fillRect(24, 26, 16, 14);

    // Scars and staples - Crimson red and bone white
    ctx.fillStyle = StitchTokens.crimsonRed;
    ctx.fillRect(16, 16, 16, 3);
    ctx.fillRect(22, 28, 12, 3);
    ctx.fillStyle = StitchTokens.boneWhite; // staples
    ctx.fillRect(20, 14, 2, 7);
    ctx.fillRect(26, 26, 2, 7);

    // Head
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(18, 2, 12, 10);
    // Glowing red eye - Crimson bright
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.fillRect(20, 5, 4, 3);
  });
  scene.textures.addCanvas('spr_golem', golemCanvas);

  // 7. Blood Specter (32x40)
  const specterCanvas = createPixelCanvas(32, 40, (ctx) => {
    // Ectoplasm transparent red - Crimson red with alpha
    ctx.fillStyle = 'rgba(122, 15, 26, 0.85)';
    ctx.beginPath();
    ctx.arc(16, 14, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(10, 20, 12, 18);

    // Screaming skull - Bone cream
    ctx.fillStyle = StitchTokens.boneCream;
    ctx.fillRect(11, 8, 10, 10);
    ctx.fillStyle = StitchTokens.charcoalDark; // hollow eye sockets
    ctx.fillRect(13, 10, 2, 3);
    ctx.fillRect(17, 10, 2, 3);
    ctx.fillRect(14, 14, 4, 4); // screaming mouth
  });
  scene.textures.addCanvas('spr_specter', specterCanvas);

  // 8. Necro Lord Boss (64x72)
  const bossCanvas = createPixelCanvas(64, 72, (ctx) => {
    // Obsidian armor
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.fillRect(16, 16, 32, 50);

    // Horns
    ctx.fillStyle = StitchTokens.charcoalMedium;
    ctx.fillRect(10, 4, 6, 16);
    ctx.fillRect(48, 4, 6, 16);

    // Crimson central gem
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.beginPath();
    ctx.arc(32, 32, 8, 0, Math.PI * 2);
    ctx.fill();

    // Crimson cape
    ctx.fillStyle = StitchTokens.crimsonRed;
    ctx.fillRect(12, 22, 6, 44);
    ctx.fillRect(46, 22, 6, 44);
  });
  scene.textures.addCanvas('spr_boss', bossCanvas);

  // 9. Projectile: Blood Bolt (16x16)
  const boltCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = StitchTokens.boneWhite;
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('proj_blood_bolt', boltCanvas);

  // 10. Projectile: Cultist Energy Bolt (16x16)
  const energyBoltCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = StitchTokens.secondaryViolet;
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0abfc';
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('proj_energy_bolt', energyBoltCanvas);

  // 11. Health Orb (16x16)
  const hporbCanvas = createPixelCanvas(16, 16, (ctx) => {
    // Glass flask container
    ctx.strokeStyle = StitchTokens.boneWhite;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Viscous Crimson Fluid
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5'; // glint
    ctx.fillRect(5, 5, 2, 2);
  });
  scene.textures.addCanvas('orb_hp', hporbCanvas);

  // 12. Mana Orb (16x16)
  const manaorbCanvas = createPixelCanvas(16, 16, (ctx) => {
    // Glass flask container
    ctx.strokeStyle = StitchTokens.boneWhite;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Místico Blue Fluid
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = StitchTokens.primaryElectricBlue; // bright glint
    ctx.fillRect(5, 5, 2, 2);
  });
  scene.textures.addCanvas('orb_mana', manaorbCanvas);

  // 13. XP Blood Gem (12x12)
  const gemCanvas = createPixelCanvas(12, 12, (ctx) => {
    // Octahedral Emerald Crystal - Tertiary mint
    ctx.fillStyle = StitchTokens.tertiaryMint;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(12, 6);
    ctx.lineTo(6, 12);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9efad2'; // Highlight facets
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(6, 6);
    ctx.lineTo(12, 6);
    ctx.closePath();
    ctx.fill();
  });
  scene.textures.addCanvas('gem_xp', gemCanvas);

  // 14. Particle Blood Drop (8x8)
  const bloodPartCanvas = createPixelCanvas(8, 8, (ctx) => {
    ctx.fillStyle = StitchTokens.crimsonDark;
    ctx.fillRect(1, 1, 6, 6);
  });
  scene.textures.addCanvas('particle_blood_red', bloodPartCanvas);

  // 15. Blood Pool Ground Stain (32x20)
  const bloodPoolCanvas = createPixelCanvas(32, 20, (ctx) => {
    ctx.fillStyle = 'rgba(122, 15, 26, 0.75)'; // Crimson red alpha
    ctx.beginPath();
    ctx.ellipse(16, 10, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('blood_pool_stain', bloodPoolCanvas);

  // 16. Dungeon Stone Brick Wall Block (32x32)
  const wallCanvas = createPixelCanvas(32, 32, (ctx) => {
    ctx.fillStyle = StitchTokens.charcoalDark; // Base dark stone
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = StitchTokens.charcoalMedium; // Bricks
    ctx.fillRect(2, 2, 13, 6);
    ctx.fillRect(17, 2, 13, 6);
    ctx.fillRect(2, 10, 28, 6);
    ctx.fillRect(2, 18, 13, 6);
    ctx.fillRect(17, 18, 13, 6);
    ctx.fillRect(2, 26, 28, 4);

    // Highlights
    ctx.fillStyle = '#3a2d3c';
    ctx.fillRect(2, 2, 13, 1);
    ctx.fillRect(17, 2, 13, 1);
    ctx.fillStyle = '#112217'; // Dark moss in crevices
    ctx.fillRect(12, 14, 4, 2);
    ctx.fillRect(2, 24, 6, 2);
  });
  scene.textures.addCanvas('tile_wall_brick', wallCanvas);

  // 17. Dungeon Door Archway (32x32)
  const doorCanvas = createPixelCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#1c131d';
    ctx.fillRect(0, 0, 32, 32);

    // Archway outline
    ctx.fillStyle = StitchTokens.crimsonDark;
    ctx.beginPath();
    ctx.arc(16, 16, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(4, 16, 24, 14);

    // Inner passage shadow
    ctx.fillStyle = StitchTokens.charcoalDark;
    ctx.beginPath();
    ctx.arc(16, 16, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(7, 16, 18, 14);
  });
  scene.textures.addCanvas('tile_door', doorCanvas);

  // 18. Portal to Next Dungeon Floor (40x40)
  const portalCanvas = createPixelCanvas(40, 40, (ctx) => {
    // Runes ring - Tarnished Gold
    ctx.strokeStyle = StitchTokens.tarnishedGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Swirling vortex - Crimson red / gold bright
    ctx.fillStyle = StitchTokens.crimsonRed;
    ctx.beginPath();
    ctx.arc(20, 20, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = StitchTokens.goldBright;
    ctx.beginPath();
    ctx.arc(20, 20, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('spr_portal', portalCanvas);

  // 19. Dungeon Treasure Chest (24x20)
  const chestCanvas = createPixelCanvas(24, 20, (ctx) => {
    // Dark mahogany wood
    ctx.fillStyle = '#451a03';
    ctx.fillRect(2, 4, 20, 14);

    // Tarnished Gold Trim
    ctx.fillStyle = StitchTokens.tarnishedGold;
    ctx.fillRect(2, 4, 20, 3);
    ctx.fillRect(2, 15, 20, 3);
    ctx.fillRect(10, 4, 4, 14);

    // Magic Lock - Electric Blue glow
    ctx.fillStyle = StitchTokens.primaryElectricBlue;
    ctx.fillRect(10, 9, 4, 4);
  });
  scene.textures.addCanvas('spr_chest', chestCanvas);

  // 20. AI Alert Icon "!" (12x18)
  const alertCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = StitchTokens.crimsonBright;
    ctx.fillRect(4, 1, 4, 10);
    ctx.fillRect(4, 13, 4, 4);
    ctx.fillStyle = StitchTokens.boneWhite;
    ctx.fillRect(5, 2, 2, 8);
    ctx.fillRect(5, 14, 2, 2);
  });
  scene.textures.addCanvas('icon_alert', alertCanvas);

  // 21. AI Suspicious Icon "?" (12x18)
  const questCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = StitchTokens.goldBright;
    ctx.fillRect(2, 1, 8, 3);
    ctx.fillRect(7, 4, 3, 4);
    ctx.fillRect(4, 8, 4, 3);
    ctx.fillRect(4, 13, 4, 4);
    ctx.fillStyle = StitchTokens.boneWhite;
    ctx.fillRect(5, 14, 2, 2);
  });
  scene.textures.addCanvas('icon_suspicious', questCanvas);

  // 22. AI Panic/Flee Icon (12x18)
  const fleeCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = StitchTokens.primaryElectricBlue;
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
  scene.textures.addCanvas('icon_flee', fleeCanvas);
}
