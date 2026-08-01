import Phaser from 'phaser';

/**
 * Procedurally generates 16-bit Pixel Art Sprites & Textures for Phaser 3
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
    // Fill dark stone diamond
    ctx.fillStyle = '#1c151b';
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Dark border
    ctx.strokeStyle = '#2d1f27';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cobblestone pixel details
    ctx.fillStyle = '#2d2229';
    ctx.fillRect(20, 8, 8, 4);
    ctx.fillRect(36, 12, 10, 5);
    ctx.fillRect(16, 18, 12, 6);
    ctx.fillRect(38, 22, 8, 4);

    // Blood stains in cobblestone
    ctx.fillStyle = '#610a0e';
    ctx.fillRect(28, 14, 4, 3);
    ctx.fillRect(32, 16, 3, 3);
  });
  scene.textures.addCanvas('tile_ground', tileCanvas);

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
  scene.textures.addCanvas('spr_bloodmage', playerCanvas);

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
  scene.textures.addCanvas('spr_skeleton', skeletonCanvas);

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
  scene.textures.addCanvas('spr_cultist', cultistCanvas);

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
  scene.textures.addCanvas('spr_hound', houndCanvas);

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
  scene.textures.addCanvas('spr_golem', golemCanvas);

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
  scene.textures.addCanvas('spr_specter', specterCanvas);

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
  scene.textures.addCanvas('spr_boss', bossCanvas);

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
  scene.textures.addCanvas('proj_blood_bolt', boltCanvas);

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
  scene.textures.addCanvas('proj_energy_bolt', energyBoltCanvas);

  // 11. Health Orb (16x16)
  const hporbCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(5, 5, 3, 3);
  });
  scene.textures.addCanvas('orb_hp', hporbCanvas);

  // 12. Mana Orb (16x16)
  const manaorbCanvas = createPixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(5, 5, 3, 3);
  });
  scene.textures.addCanvas('orb_mana', manaorbCanvas);

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
  scene.textures.addCanvas('gem_xp', gemCanvas);

  // 14. Particle Blood Drop (8x8)
  const bloodPartCanvas = createPixelCanvas(8, 8, (ctx) => {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(1, 1, 6, 6);
  });
  scene.textures.addCanvas('particle_blood_red', bloodPartCanvas);

  // 15. Blood Pool Ground Stain (32x20)
  const bloodPoolCanvas = createPixelCanvas(32, 20, (ctx) => {
    ctx.fillStyle = 'rgba(120, 10, 18, 0.75)';
    ctx.beginPath();
    ctx.ellipse(16, 10, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('blood_pool_stain', bloodPoolCanvas);

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
  scene.textures.addCanvas('tile_wall_brick', wallCanvas);

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
  scene.textures.addCanvas('tile_door', doorCanvas);

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
  scene.textures.addCanvas('spr_portal', portalCanvas);

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
  scene.textures.addCanvas('spr_chest', chestCanvas);

  // 20. AI Alert Icon "!" (12x18)
  const alertCanvas = createPixelCanvas(12, 18, (ctx) => {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(4, 1, 4, 10);
    ctx.fillRect(4, 13, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 2, 2, 8);
    ctx.fillRect(5, 14, 2, 2);
  });
  scene.textures.addCanvas('icon_alert', alertCanvas);

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
  scene.textures.addCanvas('icon_suspicious', questCanvas);

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
  scene.textures.addCanvas('icon_flee', fleeCanvas);
}
