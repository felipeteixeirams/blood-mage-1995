import Phaser from 'phaser';

/**
 * Procedurally generates high-fidelity 16-bit Pixel Art Sprites & Textures for Phaser 3
 * with a polished Dark Fantasy Gothic aesthetic (Charcoal, Blood Crimson, Tarnished Gold, Bone White).
 * Uses synchronous canvas injection to guarantee zero-latency rendering and eliminate async load races.
 */
export function generateGameTextures(scene: Phaser.Scene) {
  // Check if textures already generated
  if (scene.textures.exists('spr_bloodmage')) return;

  const createPixelCanvasElement = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
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

  // Helper to draw dither patterns (checkerboard transparent overlay)
  const applyDither = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if ((x + dx + y + dy) % 2 === 0) {
          ctx.fillRect(x + dx, y + dy, 1, 1);
        }
      }
    }
  };

  // 1. Isometric Ground Tile (64x32 Isometric Diamond)
  const tileCanvas = createPixelCanvasElement(64, 32, (ctx) => {
    // Fill deep dark charcoal-stone diamond
    ctx.fillStyle = '#110e12';
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Dark slate beveled border
    ctx.strokeStyle = '#2d1f27';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cobblestone outlines (subdivisions)
    ctx.strokeStyle = '#1a0f15';
    ctx.lineWidth = 1;

    // Horizontal stone splits
    ctx.beginPath();
    ctx.moveTo(16, 8); ctx.lineTo(32, 16); ctx.lineTo(48, 8);
    ctx.moveTo(8, 20); ctx.lineTo(32, 24); ctx.lineTo(56, 12);
    ctx.stroke();

    // Individual cobblestones shading (Dark Fantasy colors)
    ctx.fillStyle = '#1d171d'; // Dark Slate stone
    ctx.fillRect(24, 6, 10, 4);
    ctx.fillRect(10, 12, 14, 5);
    ctx.fillRect(38, 14, 16, 6);
    ctx.fillRect(22, 21, 18, 5);

    // Weathered highlights on stone edges (Tarnished Stone / Bone White hint)
    ctx.fillStyle = '#3a2b36';
    ctx.fillRect(25, 6, 8, 1);
    ctx.fillRect(11, 12, 10, 1);
    ctx.fillRect(39, 14, 12, 1);
    ctx.fillRect(23, 21, 14, 1);

    // Hard shadows on bottom of stones
    ctx.fillStyle = '#0a0307';
    ctx.fillRect(24, 10, 10, 1);
    ctx.fillRect(10, 17, 14, 1);
    ctx.fillRect(38, 20, 16, 1);

    // Fine stippled / dithered shadow on tiles
    applyDither(ctx, 4, 18, 12, 6, '#060105');
    applyDither(ctx, 44, 20, 12, 6, '#060105');

    // Viscous dark crimson blood stains in stone crevices
    ctx.fillStyle = '#6b0008'; // Dry blood
    ctx.fillRect(28, 13, 6, 3);
    ctx.fillRect(30, 15, 3, 2);
    ctx.fillStyle = '#99000a'; // Fresh blood highlight
    ctx.fillRect(29, 13, 3, 1);
  });
  scene.textures.addCanvas('tile_ground', tileCanvas);

  // 2. Bloodmage Player (32x48)
  const playerCanvas = createPixelCanvasElement(32, 48, (ctx) => {
    // Drop Shadow on floor
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(16, 44, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Base Layer: Shadow of Cloak
    ctx.fillStyle = '#080104';
    ctx.fillRect(8, 12, 16, 31);

    // 2. Cloak back / shadow (Deep Crimson Red)
    ctx.fillStyle = '#4c050c';
    ctx.fillRect(7, 14, 18, 28);

    // 3. Main Robe / Cape (Crimson Velvet)
    ctx.fillStyle = '#7a0f1a';
    ctx.fillRect(9, 13, 14, 28);

    // Dither folds of the robe
    applyDither(ctx, 9, 24, 14, 16, '#3a0209');

    // 4. Tarnished Gold Embroidery / Trim at front and hem
    ctx.fillStyle = '#b8860b'; // Tarnished Gold
    ctx.fillRect(8, 40, 16, 2);
    ctx.fillRect(15, 18, 2, 22);
    ctx.fillStyle = '#e5c158'; // Gold Highlight
    ctx.fillRect(11, 40, 3, 1);
    ctx.fillRect(18, 40, 3, 1);
    ctx.fillRect(15, 22, 1, 12);

    // 5. Hood & Shoulders
    ctx.fillStyle = '#5c060e'; // Shadowed hood
    ctx.fillRect(10, 4, 12, 11);
    ctx.fillStyle = '#99000a'; // Highlighted hood crown
    ctx.fillRect(11, 3, 10, 9);
    ctx.fillStyle = '#c1121f'; // Edge highlights
    ctx.fillRect(11, 3, 2, 8);
    ctx.fillRect(19, 3, 2, 8);

    // Face shadow / dark cavity
    ctx.fillStyle = '#0f0205';
    ctx.fillRect(11, 9, 10, 5);

    // Piercing Glowing Crimson Eyes with a small white core
    ctx.fillStyle = '#ff0022';
    ctx.fillRect(12, 11, 3, 2);
    ctx.fillRect(17, 11, 3, 2);
    ctx.fillStyle = '#ffffff'; // Core
    ctx.fillRect(13, 11, 1, 1);
    ctx.fillRect(18, 11, 1, 1);

    // 6. Staff of Blood (Gothic metal + bone wrapped)
    // Shaft (Tarnished Obsidian iron)
    ctx.fillStyle = '#1e2022';
    ctx.fillRect(25, 12, 2, 31);
    ctx.fillStyle = '#708090'; // Highlights
    ctx.fillRect(25, 16, 1, 24);
    // Grip (Ancient bone wrap)
    ctx.fillStyle = '#e3dac9';
    ctx.fillRect(24, 22, 4, 3);
    ctx.fillRect(24, 32, 4, 3);

    // Gothic Crown Tip clutching the ruby
    ctx.fillStyle = '#b8860b'; // Gold crown head
    ctx.fillRect(23, 6, 6, 6);
    ctx.fillStyle = '#e5c158';
    ctx.fillRect(24, 5, 4, 2);

    // Glowing ruby orb
    ctx.fillStyle = '#990000';
    ctx.beginPath();
    ctx.arc(26, 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0033'; // Hot spot
    ctx.fillRect(25, 4, 2, 2);
    ctx.fillStyle = '#ffffff'; // White glint
    ctx.fillRect(26, 4, 1, 1);
  });
  scene.textures.addCanvas('spr_bloodmage', playerCanvas);

  // 3. Skeleton Warrior (32x40)
  const skeletonCanvas = createPixelCanvasElement(32, 40, (ctx) => {
    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(16, 37, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Ancient Shaded Bones (Greyish Bone White)
    ctx.fillStyle = '#7d7465'; // Shadow bones
    ctx.fillRect(12, 14, 8, 16); // Spine/Ribs base
    ctx.fillRect(10, 28, 3, 10); // Legs
    ctx.fillRect(19, 28, 3, 10);

    ctx.fillStyle = '#cbd5e1'; // Light bone
    // Rib cage detailing
    ctx.fillRect(11, 13, 10, 2);
    ctx.fillRect(12, 16, 8, 1);
    ctx.fillRect(12, 19, 8, 1);
    ctx.fillRect(13, 22, 6, 1);
    ctx.fillRect(14, 25, 4, 4); // Pelvis

    // Legs details
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(11, 29, 2, 4);
    ctx.fillRect(11, 35, 2, 3);
    ctx.fillRect(19, 29, 2, 4);
    ctx.fillRect(19, 35, 2, 3);

    // 2. Skull with Rusty Iron Helmet & Horns
    ctx.fillStyle = '#8a8070'; // Skull shadow
    ctx.fillRect(11, 4, 10, 9);
    ctx.fillStyle = '#e2e8f0'; // Skull face
    ctx.fillRect(12, 5, 8, 7);

    // Skeletal hollow nose & eyes (pitch black)
    ctx.fillStyle = '#0f0502';
    ctx.fillRect(13, 8, 2, 2);
    ctx.fillRect(17, 8, 2, 2);
    ctx.fillRect(15, 10, 2, 1);

    // Red glowing pinprick eyes
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(13, 8, 1, 1);
    ctx.fillRect(18, 8, 1, 1);

    // Helmet (Rusty steel with bronze crest)
    ctx.fillStyle = '#334155'; // Dark steel
    ctx.fillRect(10, 2, 12, 3);
    ctx.fillRect(13, 1, 6, 1);
    ctx.fillStyle = '#b45309'; // Rust spots
    ctx.fillRect(11, 2, 2, 1);
    ctx.fillRect(19, 3, 1, 1);

    // Horns (Ancient yellow/brown)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8, 2, 2, 2);
    ctx.fillRect(6, 0, 2, 2);
    ctx.fillRect(22, 2, 2, 2);
    ctx.fillRect(24, 0, 2, 2);

    // 3. Rusty Broadsword (Right Hand)
    ctx.fillStyle = '#475569'; // Steel
    ctx.fillRect(24, 10, 2, 24);
    ctx.fillStyle = '#94a3b8'; // Blade edge highlight
    ctx.fillRect(25, 10, 1, 22);
    ctx.fillStyle = '#b45309'; // Blood rust
    ctx.fillRect(24, 14, 2, 4);
    ctx.fillRect(24, 22, 2, 6);
    // Hilt / Crossguard (Tarnished brass)
    ctx.fillStyle = '#a16207';
    ctx.fillRect(22, 30, 6, 2);
    ctx.fillRect(24, 32, 2, 4); // Grip

    // 4. Wooden Round Shield (Left Hand)
    ctx.fillStyle = '#451a03'; // Dark brown wood
    ctx.beginPath();
    ctx.arc(5, 20, 7, 0, Math.PI * 2);
    ctx.fill();
    // Metal Rim (Slate/Iron)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Shield Boss / Center Spike
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(4, 19, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 20, 1, 1);
  });
  scene.textures.addCanvas('spr_skeleton', skeletonCanvas);

  // 4. Cultist Acolyte (32x40)
  const cultistCanvas = createPixelCanvasElement(32, 40, (ctx) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(16, 36, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Dark purple flowing robe
    ctx.fillStyle = '#1e072b'; // Shadow robe
    ctx.fillRect(8, 10, 16, 26);
    ctx.fillStyle = '#3b1254'; // Purple base
    ctx.fillRect(9, 11, 14, 24);
    ctx.fillStyle = '#5c1d85'; // Mid purple folds
    ctx.fillRect(10, 12, 12, 22);

    // Golden runic trim on robe hem
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(8, 33, 16, 2);
    ctx.fillStyle = '#e5c158';
    ctx.fillRect(10, 33, 2, 1);
    ctx.fillRect(16, 33, 2, 1);
    ctx.fillRect(20, 33, 2, 1);

    // Dither folds
    applyDither(ctx, 9, 20, 14, 12, '#1e072b');

    // 2. Dark cowl / hood
    ctx.fillStyle = '#2e0b41';
    ctx.fillRect(10, 3, 12, 10);
    ctx.fillStyle = '#5c1d85';
    ctx.fillRect(11, 2, 10, 8);

    // Face shadow cavity
    ctx.fillStyle = '#0a0110';
    ctx.fillRect(11, 8, 10, 4);

    // Glowing Green Skull-Mask
    ctx.fillStyle = '#f1f5f9'; // Bone mask
    ctx.fillRect(13, 9, 6, 5);
    ctx.fillStyle = '#0f172a'; // Eye holes
    ctx.fillRect(14, 10, 1, 1);
    ctx.fillRect(17, 10, 1, 1);

    // Glowing Neon Green Eyes
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(14, 10, 1, 1);
    ctx.fillRect(17, 10, 1, 1);

    // 3. Eldritch Runic Scroll in hand
    ctx.fillStyle = '#e3dac9'; // Scroll paper
    ctx.fillRect(22, 18, 4, 8);
    ctx.fillStyle = '#78350f'; // Roller wood
    ctx.fillRect(21, 17, 6, 1);
    ctx.fillRect(21, 26, 6, 1);
    // Glowing green runes on scroll
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(23, 20, 2, 1);
    ctx.fillRect(23, 23, 2, 1);
  });
  scene.textures.addCanvas('spr_cultist', cultistCanvas);

  // 5. Hell Hound (36x28)
  const houndCanvas = createPixelCanvasElement(36, 28, (ctx) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(18, 25, 13, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Demonic Charcoal Hide
    ctx.fillStyle = '#1c1917'; // Charcoal shadow
    ctx.fillRect(6, 9, 22, 11); // Body
    ctx.fillRect(5, 14, 4, 10);  // Back leg
    ctx.fillRect(23, 14, 4, 10); // Front leg

    ctx.fillStyle = '#44403c'; // Charcoal muscle midtone
    ctx.fillRect(7, 10, 20, 9);
    ctx.fillRect(6, 14, 2, 8);
    ctx.fillRect(24, 14, 2, 8);

    // 2. Magma veins on body
    ctx.fillStyle = '#dc2626'; // Red magma
    ctx.fillRect(11, 12, 8, 1);
    ctx.fillRect(13, 14, 6, 1);
    ctx.fillStyle = '#ea580c'; // Orange heat
    ctx.fillRect(12, 12, 3, 1);
    ctx.fillRect(15, 14, 2, 1);

    // 3. Muscular Head with fangs
    ctx.fillStyle = '#292524';
    ctx.fillRect(24, 3, 10, 10); // Head block
    ctx.fillStyle = '#dc2626'; // Snarl red mouth
    ctx.fillRect(29, 8, 5, 4);

    // Yellow/White Fangs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, 8, 1, 1);
    ctx.fillRect(33, 8, 1, 1);
    ctx.fillRect(31, 11, 1, 1);

    // Flaming Yellow Eyes
    ctx.fillStyle = '#eab308';
    ctx.fillRect(27, 5, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 5, 1, 1);

    // 4. Obsidian spines on back
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.moveTo(9, 10); ctx.lineTo(11, 4); ctx.lineTo(13, 10);
    ctx.moveTo(15, 10); ctx.lineTo(17, 3); ctx.lineTo(19, 10);
    ctx.moveTo(21, 10); ctx.lineTo(23, 5); ctx.lineTo(25, 10);
    ctx.fill();

    // Spikes highlights
    ctx.fillStyle = '#78716c';
    ctx.fillRect(10, 5, 1, 3);
    ctx.fillRect(16, 4, 1, 4);
    ctx.fillRect(22, 6, 1, 2);
  });
  scene.textures.addCanvas('spr_hound', houndCanvas);

  // 6. Flesh Golem (48x56)
  const golemCanvas = createPixelCanvasElement(48, 56, (ctx) => {
    // Big Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(24, 52, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Necrotic skin patches (bruised purple, dead green, pale grey)
    ctx.fillStyle = '#1e1b18'; // Shadow underlayer
    ctx.fillRect(8, 12, 32, 39);

    // Patch A: Dead Green (top left)
    ctx.fillStyle = '#3f4e3c';
    ctx.fillRect(8, 12, 16, 18);
    // Patch B: Bruised Purple-Grey (top right)
    ctx.fillStyle = '#4a3e4d';
    ctx.fillRect(24, 12, 16, 22);
    // Patch C: Pale cadaver grey (bottom half)
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 30, 32, 21);

    // Flesh Golem detailing / muscle shade
    ctx.fillStyle = '#14532d'; // Darker green shade
    ctx.fillRect(10, 14, 12, 12);
    ctx.fillStyle = '#2e103f'; // Darker purple shade
    ctx.fillRect(26, 14, 12, 16);

    // Dither lower body
    applyDither(ctx, 8, 36, 32, 14, '#1e293b');

    // 2. Thick black stitch sutures & metal staples
    ctx.fillStyle = '#020617'; // Deep black stitch cuts
    ctx.fillRect(8, 29, 32, 2); // Horizontal dividing stitch
    ctx.fillRect(23, 12, 2, 20); // Vertical dividing stitch
    ctx.fillRect(16, 38, 2, 13);

    // Shiny silver metal staples across stitches
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(14, 28, 2, 4);
    ctx.fillRect(22, 28, 2, 4);
    ctx.fillRect(30, 28, 2, 4);
    ctx.fillRect(21, 16, 6, 2);
    ctx.fillRect(21, 24, 6, 2);

    // 3. Massive neck bolt (Rusted iron)
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(12, 8, 4, 4);
    ctx.fillRect(32, 8, 4, 4);

    // 4. Ugly monstrous head
    ctx.fillStyle = '#27272a'; // Face shadow
    ctx.fillRect(18, 2, 12, 10);
    ctx.fillStyle = '#52525b'; // Highlight head
    ctx.fillRect(19, 1, 10, 7);

    // Cyclopean Glowing Red Eye with surrounding decay
    ctx.fillStyle = '#7f1d1d'; // Crimson eye socket
    ctx.fillRect(22, 3, 5, 4);
    ctx.fillStyle = '#ef4444'; // Radiant red core
    ctx.fillRect(23, 4, 3, 2);
    ctx.fillStyle = '#ffffff'; // Glint
    ctx.fillRect(24, 4, 1, 1);
  });
  scene.textures.addCanvas('spr_golem', golemCanvas);

  // 7. Blood Specter (32x40)
  const specterCanvas = createPixelCanvasElement(32, 40, (ctx) => {
    // Ethereal floating shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(16, 38, 7, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Transparent red ectoplasm body (Volumetric gradient)
    ctx.fillStyle = 'rgba(153, 27, 27, 0.75)'; // Dark crimson core
    ctx.beginPath();
    ctx.arc(16, 13, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)'; // Lighter outer envelope
    ctx.beginPath();
    ctx.arc(16, 13, 14, 0, Math.PI * 2);
    ctx.fill();

    // Ghostly wispy tail
    ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
    ctx.beginPath();
    ctx.moveTo(6, 17);
    ctx.quadraticCurveTo(10, 36, 16, 38);
    ctx.quadraticCurveTo(22, 36, 26, 17);
    ctx.closePath();
    ctx.fill();

    // Flowing blood droplets floating off specter
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 26, 2, 3);
    ctx.fillRect(20, 28, 2, 2);
    ctx.fillRect(14, 33, 2, 4);

    // 2. Screaming Hollow Skull Face
    ctx.fillStyle = '#1e0205'; // Hollow black eye sockets & mouth
    ctx.fillRect(12, 10, 3, 3); // Left eye
    ctx.fillRect(17, 10, 3, 3); // Right eye
    ctx.fillRect(14, 15, 4, 6); // Screaming mouth cavity

    // Glowing white eyes inside black sockets
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 11, 1, 1);
    ctx.fillRect(18, 11, 1, 1);
  });
  scene.textures.addCanvas('spr_specter', specterCanvas);

  // 8. Necro Lord Boss (64x72)
  const bossCanvas = createPixelCanvasElement(64, 72, (ctx) => {
    // Massive Dark Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(32, 68, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Giant Armored Plate Frame (Charcoal Obsidian Armor)
    ctx.fillStyle = '#090d16'; // Deep space black base
    ctx.fillRect(14, 16, 36, 49);

    ctx.fillStyle = '#1e293b'; // Slate armor plates
    ctx.fillRect(16, 18, 32, 45);

    // Gold filigree runic engravings on chest/shoulders
    ctx.fillStyle = '#854d0e'; // Tarnished Gold shadow
    ctx.fillRect(20, 28, 24, 18);
    ctx.fillStyle = '#eab308'; // Glowing gold runes
    ctx.fillRect(22, 30, 2, 2);
    ctx.fillRect(28, 30, 8, 1);
    ctx.fillRect(28, 34, 8, 1);
    ctx.fillRect(40, 30, 2, 2);
    ctx.fillRect(25, 38, 14, 2);

    // Dither lower armor folds
    applyDither(ctx, 16, 44, 32, 18, '#0f172a');

    // 2. Heavy Iron Spikes on shoulders
    ctx.fillStyle = '#475569';
    // Left Shoulder Spikes
    ctx.beginPath();
    ctx.moveTo(12, 24); ctx.lineTo(16, 16); ctx.lineTo(16, 24);
    ctx.moveTo(8, 30); ctx.lineTo(14, 26); ctx.lineTo(14, 32);
    ctx.fill();
    // Right Shoulder Spikes
    ctx.beginPath();
    ctx.moveTo(52, 24); ctx.lineTo(48, 16); ctx.lineTo(48, 24);
    ctx.moveTo(56, 30); ctx.lineTo(50, 26); ctx.lineTo(50, 32);
    ctx.fill();

    // 3. Huge horned kingly crown helmet
    ctx.fillStyle = '#1e293b'; // Helm block
    ctx.fillRect(24, 4, 16, 12);
    ctx.fillStyle = '#0f172a'; // T-shaped visor gap
    ctx.fillRect(28, 9, 8, 5);
    ctx.fillRect(31, 14, 2, 4);

    // Horns / Crown peaks (Obsidian + gold trim)
    ctx.fillStyle = '#854d0e'; // Gold rim crown
    ctx.fillRect(23, 2, 2, 4);
    ctx.fillRect(26, 1, 2, 3);
    ctx.fillRect(31, 0, 2, 3);
    ctx.fillRect(36, 1, 2, 3);
    ctx.fillRect(39, 2, 2, 4);

    // Demonic Glowing red visor slits
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(29, 10, 2, 2);
    ctx.fillRect(33, 10, 2, 2);

    // 4. Pulsing red skull gem in center of breastplate
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(32, 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444'; // Bright core
    ctx.beginPath();
    ctx.arc(32, 26, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // White glint
    ctx.fillRect(31, 24, 1.5, 1.5);

    // 5. Majestic Tattered Crimson Cape (flowing out from shoulders)
    ctx.fillStyle = '#4c0519'; // Shadow crimson cape
    ctx.fillRect(10, 24, 4, 41);
    ctx.fillRect(50, 24, 4, 41);
    ctx.fillStyle = '#9f1239'; // Velvet cape highlights
    ctx.fillRect(11, 26, 2, 38);
    ctx.fillRect(51, 26, 2, 38);
    // Tattered holes
    ctx.fillStyle = '#000000'; // Make transparent on texture
    ctx.fillRect(11, 38, 2, 3);
    ctx.fillRect(51, 46, 2, 2);
    ctx.fillRect(11, 55, 2, 4);

    // 6. Giant Rune Scythe of Death
    // Pole (Ancient iron-bound dark wood)
    ctx.fillStyle = '#27272a';
    ctx.fillRect(4, 8, 3, 56);
    ctx.fillStyle = '#71717a'; // Metallic bracket rings
    ctx.fillRect(3, 12, 5, 2);
    ctx.fillRect(3, 32, 5, 2);
    ctx.fillRect(3, 52, 5, 2);

    // Huge curved blade of the scythe (Glow blood rune on steel blade)
    ctx.fillStyle = '#4b5563'; // Dark steel
    ctx.beginPath();
    ctx.moveTo(5, 10);
    ctx.quadraticCurveTo(2, 2, -18, -4);
    ctx.quadraticCurveTo(-2, 4, 5, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#9ca3af'; // Outer razor edge
    ctx.beginPath();
    ctx.moveTo(4, 10);
    ctx.quadraticCurveTo(1, 1, -19, -5);
    ctx.quadraticCurveTo(1, 3, 4, 11);
    ctx.closePath();
    ctx.fill();

    // Crimson glowing runes engraved on blade
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-4, 0, 2, 2);
    ctx.fillRect(-10, -2, 2, 1.5);
  });
  scene.textures.addCanvas('spr_boss', bossCanvas);

  // 9. Projectile: Blood Bolt (16x16)
  const boltCanvas = createPixelCanvasElement(16, 16, (ctx) => {
    // Outer trail glow
    ctx.fillStyle = 'rgba(153,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(8, 8, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Saturated blood core
    ctx.fillStyle = '#99000a';
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444'; // Bright blood
    ctx.beginPath();
    ctx.arc(8, 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hot specular core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, 7, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('proj_blood_bolt', boltCanvas);

  // 10. Projectile: Cultist Energy Bolt (16x16)
  const energyBoltCanvas = createPixelCanvasElement(16, 16, (ctx) => {
    // Purple Outer trail glow
    ctx.fillStyle = 'rgba(112,26,117,0.4)';
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6b21a8'; // Dark purple
    ctx.beginPath();
    ctx.arc(8, 8, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c084fc'; // Light lilac glow
    ctx.beginPath();
    ctx.arc(8, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // White electric spark core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 7, 2, 2);
  });
  scene.textures.addCanvas('proj_energy_bolt', energyBoltCanvas);

  // 11. Health Orb (16x16) - Glass Flask with Fluid
  const hporbCanvas = createPixelCanvasElement(16, 16, (ctx) => {
    // Glass Sphere outline (Dark Slate)
    ctx.fillStyle = 'rgba(15,23,42,0.3)';
    ctx.beginPath();
    ctx.arc(8, 8, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Saturated red fluid filling 3/4 of the orb
    ctx.fillStyle = '#7f1d1d'; // Crimson dark fluid
    ctx.beginPath();
    ctx.arc(8, 8, 6.5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();
    ctx.fillRect(2, 8, 12, 6);

    ctx.fillStyle = '#dc2626'; // Vibrant red fluid highlight
    ctx.fillRect(3, 9, 10, 4);

    // Surface bubbles / meniscus
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(4, 7, 2, 1);
    ctx.fillRect(10, 7, 2, 1);

    // Spherical specular white light glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 3, 3, 2);
    ctx.fillRect(3, 4, 1, 1);
  });
  scene.textures.addCanvas('orb_hp', hporbCanvas);

  // 12. Mana Orb (16x16) - Glass Flask with Glowing Blue Fluid
  const manaorbCanvas = createPixelCanvasElement(16, 16, (ctx) => {
    // Glass Sphere outline
    ctx.fillStyle = 'rgba(15,23,42,0.3)';
    ctx.beginPath();
    ctx.arc(8, 8, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Deep blue mistic fluid filling 3/4
    ctx.fillStyle = '#1e3a8a'; // Royal blue dark fluid
    ctx.beginPath();
    ctx.arc(8, 8, 6.5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();
    ctx.fillRect(2, 8, 12, 6);

    ctx.fillStyle = '#2563eb'; // Bright mistic blue highlight
    ctx.fillRect(3, 9, 10, 4);

    // Surface meniscus
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(4, 7, 2, 1);
    ctx.fillRect(10, 7, 2, 1);

    // Specular white glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 3, 3, 2);
    ctx.fillRect(3, 4, 1, 1);
  });
  scene.textures.addCanvas('orb_mana', manaorbCanvas);

  // 13. XP Blood Gem (12x12)
  const gemCanvas = createPixelCanvasElement(12, 12, (ctx) => {
    // Sharp octahedral crystal (Emerald / Teal glowing)
    ctx.fillStyle = '#064e3b'; // Shadow emerald
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.lineTo(12, 6); ctx.lineTo(6, 12); ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#10b981'; // Bright emerald face
    ctx.beginPath();
    ctx.moveTo(6, 1); ctx.lineTo(11, 6); ctx.lineTo(6, 11); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#a7f3d0'; // Crystalline glint highlight
    ctx.beginPath();
    ctx.moveTo(6, 1); ctx.lineTo(6, 11); ctx.lineTo(3, 6);
    ctx.closePath();
    ctx.fill();

    // Core white sparkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 5, 2, 2);
  });
  scene.textures.addCanvas('gem_xp', gemCanvas);

  // 14. Particle Blood Drop (8x8)
  const bloodPartCanvas = createPixelCanvasElement(8, 8, (ctx) => {
    ctx.fillStyle = '#7f1d1d'; // Crimson core
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillStyle = '#b91c1c'; // Bright red
    ctx.fillRect(3, 1, 2, 5);
    ctx.fillRect(1, 3, 6, 2);
    ctx.fillStyle = '#fca5a5'; // Highlight glint
    ctx.fillRect(3, 2, 1, 1);
  });
  scene.textures.addCanvas('particle_blood_red', bloodPartCanvas);

  // 15. Blood Pool Ground Stain (32x20)
  const bloodPoolCanvas = createPixelCanvasElement(32, 20, (ctx) => {
    // Irregular pool shape with dried outline and shiny center
    ctx.fillStyle = 'rgba(76, 5, 12, 0.6)'; // Dried dark red outer rim
    ctx.beginPath();
    ctx.ellipse(16, 10, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(153, 0, 10, 0.75)'; // Shiny viscous wet blood core
    ctx.beginPath();
    ctx.ellipse(16, 10, 11, 6.5, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Viscous specular shiny glints
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(10, 7, 4, 1);
    ctx.fillRect(20, 11, 3, 1);
  });
  scene.textures.addCanvas('blood_pool_stain', bloodPoolCanvas);

  // 16. Dungeon Stone Brick Wall Block (32x32)
  const wallCanvas = createPixelCanvasElement(32, 32, (ctx) => {
    ctx.fillStyle = '#110e12'; // Base dark charcoal stone
    ctx.fillRect(0, 0, 32, 32);

    // Sharp beveled dark brick layers
    ctx.fillStyle = '#2d1f27'; // Dark stone highlight/base
    ctx.fillRect(1, 1, 30, 30);

    ctx.fillStyle = '#1d151c'; // Shaded bricks inside
    ctx.fillRect(2, 2, 13, 6);
    ctx.fillRect(17, 2, 13, 6);
    ctx.fillRect(2, 10, 28, 6);
    ctx.fillRect(2, 18, 13, 6);
    ctx.fillRect(17, 18, 13, 6);
    ctx.fillRect(2, 26, 28, 4);

    // Weathered textures / cracks in stone bricks
    ctx.fillStyle = '#0f050c'; // Deep crack crevices
    ctx.fillRect(8, 2, 1, 4);
    ctx.fillRect(22, 12, 4, 1);
    ctx.fillRect(10, 20, 1, 3);

    // Highlight edges (Tarnished Goth Stone / Bone White)
    ctx.fillStyle = '#3f2d3d'; // Beveled light edge
    ctx.fillRect(2, 2, 13, 1);
    ctx.fillRect(17, 2, 13, 1);
    ctx.fillRect(2, 10, 28, 1);
    ctx.fillRect(2, 18, 13, 1);
    ctx.fillRect(17, 18, 13, 1);

    // Sickly dark green moss dripping down crevices (Dark Fantasy)
    ctx.fillStyle = '#143a1d'; // Moist dark moss
    ctx.fillRect(14, 6, 2, 3);
    ctx.fillRect(6, 14, 4, 2);
    ctx.fillRect(17, 24, 3, 2);
    ctx.fillStyle = '#22c55e'; // Green moss highlight
    ctx.fillRect(7, 14, 2, 1);
  });
  scene.textures.addCanvas('tile_wall_brick', wallCanvas);

  // 17. Dungeon Door Archway (32x32)
  const doorCanvas = createPixelCanvasElement(32, 32, (ctx) => {
    ctx.fillStyle = '#0c080d';
    ctx.fillRect(0, 0, 32, 32);

    // Ancient Iron Archway Outline with corner rivets
    ctx.fillStyle = '#1f2937'; // Iron grey arch
    ctx.beginPath();
    ctx.arc(16, 16, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(4, 16, 24, 16);

    // Beveled Inner passage shadow (pitch black)
    ctx.fillStyle = '#030204';
    ctx.beginPath();
    ctx.arc(16, 16, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(7, 16, 18, 16);

    // Rusted iron reinforcements & Rivets
    ctx.fillStyle = '#7c2d12'; // Rust patches on arch
    ctx.fillRect(4, 10, 2, 3);
    ctx.fillRect(26, 8, 2, 2);

    ctx.fillStyle = '#d1d5db'; // Silver Rivets on frame
    ctx.fillRect(5, 16, 1, 1);
    ctx.fillRect(26, 16, 1, 1);
    ctx.fillRect(16, 5, 1, 1);
  });
  scene.textures.addCanvas('tile_door', doorCanvas);

  // 18. Portal to Next Dungeon Floor (40x40)
  const portalCanvas = createPixelCanvasElement(40, 40, (ctx) => {
    // Outer swirling runic ring (Tarnished Gold / Obsidian metal)
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.arc(20, 20, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Runic notches on metal ring
    ctx.fillStyle = '#ea580c'; // Glowing runes on rim
    ctx.fillRect(20, 1, 2, 2);
    ctx.fillRect(20, 37, 2, 2);
    ctx.fillRect(1, 20, 2, 2);
    ctx.fillRect(37, 20, 2, 2);

    // Swirling Crimson and Dark Purple Abyss Vortex
    ctx.fillStyle = '#310a5d'; // Deep indigo core void
    ctx.beginPath();
    ctx.arc(20, 20, 15, 0, Math.PI * 2);
    ctx.fill();

    applyDither(ctx, 8, 8, 24, 24, '#99000a'); // Crimson swirl texture

    ctx.fillStyle = '#dc2626'; // High-heat crimson swirls
    ctx.beginPath();
    ctx.arc(20, 20, 10, 0.25 * Math.PI, 1.25 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#fde047'; // Blazing gold core of vortex
    ctx.beginPath();
    ctx.arc(20, 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(20, 20, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  scene.textures.addCanvas('spr_portal', portalCanvas);

  // 19. Dungeon Treasure Chest (24x20)
  const chestCanvas = createPixelCanvasElement(24, 20, (ctx) => {
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 17, 24, 3);

    // Ancient heavy dark mahogany body
    ctx.fillStyle = '#3b1502'; // Deep shadow mahogany
    ctx.fillRect(1, 3, 22, 15);
    ctx.fillStyle = '#5c2205'; // Mahogany wood planks
    ctx.fillRect(2, 4, 20, 13);

    // Structural Wood subdivisions (horizontal lines)
    ctx.fillStyle = '#220b00';
    ctx.fillRect(2, 8, 20, 1);
    ctx.fillRect(2, 13, 20, 1);

    // Ornate Tarnished Gold bands / reinforcement rims
    ctx.fillStyle = '#713f12'; // Gold shadow bands
    ctx.fillRect(2, 3, 3, 14);
    ctx.fillRect(19, 3, 3, 14);
    ctx.fillRect(2, 3, 20, 2); // Lid top rim

    ctx.fillStyle = '#d97706'; // Gold band highlights
    ctx.fillRect(3, 4, 1, 13);
    ctx.fillRect(20, 4, 1, 13);
    ctx.fillRect(3, 3, 18, 1);

    // Beveled corner rivets on gold bands
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, 5, 1, 1);
    ctx.fillRect(3, 15, 1, 1);
    ctx.fillRect(20, 5, 1, 1);
    ctx.fillRect(20, 15, 1, 1);

    // Giant central iron / gold lock pulsing with runic magic
    ctx.fillStyle = '#1e293b'; // Iron lock plate
    ctx.fillRect(9, 7, 6, 6);
    ctx.fillStyle = '#f59e0b'; // Gold keyhole cylinder
    ctx.fillRect(10, 8, 4, 4);
    ctx.fillStyle = '#ffffff'; // Pulsing lock core dot
    ctx.fillRect(11, 9, 2, 2);
  });
  scene.textures.addCanvas('spr_chest', chestCanvas);

  // 20. AI Alert Icon "!" (12x18)
  const alertCanvas = createPixelCanvasElement(12, 18, (ctx) => {
    // Gothic metal border (Obsidian dark shadow)
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, 0, 8, 12);
    ctx.fillRect(2, 13, 8, 5);

    // Visceral crimson neon sign
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(3, 1, 6, 10);
    ctx.fillRect(3, 14, 6, 3);

    ctx.fillStyle = '#fca5a5'; // Soft inner bloom (Pink/White)
    ctx.fillRect(4, 2, 4, 8);
    ctx.fillRect(4, 15, 4, 1);

    ctx.fillStyle = '#ffffff'; // White core
    ctx.fillRect(5, 3, 2, 6);
  });
  scene.textures.addCanvas('icon_alert', alertCanvas);

  // 21. AI Suspicious Icon "?" (12x18)
  const questCanvas = createPixelCanvasElement(12, 18, (ctx) => {
    // Black outline
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, 0, 8, 3);
    ctx.fillRect(7, 3, 3, 5);
    ctx.fillRect(4, 7, 4, 3);
    ctx.fillRect(4, 13, 4, 5);

    // Amber suspicious glow
    ctx.fillStyle = '#ea580c'; // Saturated orange
    ctx.fillRect(3, 1, 6, 2);
    ctx.fillRect(7, 3, 2, 4);
    ctx.fillRect(5, 7, 2, 2);
    ctx.fillRect(5, 14, 2, 3);

    ctx.fillStyle = '#fde047'; // Yellow highlight bloom
    ctx.fillRect(4, 1, 4, 1);
    ctx.fillRect(5, 14, 2, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 1, 2, 1);
  });
  scene.textures.addCanvas('icon_suspicious', questCanvas);

  // 22. AI Panic/Flee Icon (12x18)
  const fleeCanvas = createPixelCanvasElement(12, 18, (ctx) => {
    // Black outline
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(6, 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 1); ctx.lineTo(12, 13); ctx.lineTo(0, 13);
    ctx.closePath();
    ctx.fill();

    // Cold blue panic sign
    ctx.fillStyle = '#1d4ed8'; // Dark blue
    ctx.beginPath();
    ctx.arc(6, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 3); ctx.lineTo(10, 12); ctx.lineTo(2, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#60a5fa'; // Light cyan neon bloom
    ctx.fillRect(5, 7, 2, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 9, 2, 2);
  });
  scene.textures.addCanvas('icon_flee', fleeCanvas);
}
