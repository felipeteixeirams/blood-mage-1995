/**
 * Blood Mage 1995 - PixelLab Animated GIF Generator
 * Converts PixelLab multi-frame animations and rotations into high quality,
 * optimized animated GIFs for use in React UI, Codex, HUD, and web previews.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_BASE = path.resolve(__dirname, '../sprites_importados/blood_mage/Idle');
const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/sprites/player/animated');

const DIRECTIONS = [
  { name: 'south', folder: 'south' },
  { name: 'south_east', folder: 'south-east' },
  { name: 'east', folder: 'east' },
  { name: 'north_east', folder: 'north-east' },
  { name: 'north', folder: 'north' },
  { name: 'north_west', folder: 'north-west' },
  { name: 'west', folder: 'west' },
  { name: 'south_west', folder: 'south-west' },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateWalkingGifs() {
  console.log('[GIF Generator] Generating 8-directional walking GIFs...');
  const walkAnimDir = path.join(SOURCE_BASE, 'animations/Walking');
  if (!fs.existsSync(walkAnimDir)) {
    console.warn(`[GIF Generator] Walking dir not found: ${walkAnimDir}`);
    return;
  }

  ensureDir(OUTPUT_DIR);

  for (const dir of DIRECTIONS) {
    const frameDir = path.join(walkAnimDir, dir.folder);
    if (!fs.existsSync(frameDir)) {
      console.warn(`[GIF Generator] Walking frames missing: ${frameDir}`);
      continue;
    }

    const outputFile = path.join(OUTPUT_DIR, `walk_${dir.name}.gif`);
    const cmd = `convert -delay 10 -dispose Background -loop 0 "${frameDir}/frame_*.png" "${outputFile}"`;
    execSync(cmd);
    const stat = fs.statSync(outputFile);
    console.log(`  ✓ Generated walk_${dir.name}.gif (${stat.size} bytes)`);
  }
}

function generateCastGifs() {
  console.log('[GIF Generator] Generating 8-directional casting (fireball/blood orb) GIFs...');
  const castAnimDir = path.join(SOURCE_BASE, 'animations/casting_a_fireball');
  if (!fs.existsSync(castAnimDir)) {
    console.warn(`[GIF Generator] Cast dir not found: ${castAnimDir}`);
    return;
  }

  ensureDir(OUTPUT_DIR);

  for (const dir of DIRECTIONS) {
    const frameDir = path.join(castAnimDir, dir.folder);
    if (!fs.existsSync(frameDir)) {
      console.warn(`[GIF Generator] Cast frames missing: ${frameDir}`);
      continue;
    }

    const outputFile = path.join(OUTPUT_DIR, `cast_${dir.name}.gif`);
    const cmd = `convert -delay 10 -dispose Background -loop 0 "${frameDir}/frame_*.png" "${outputFile}"`;
    execSync(cmd);
    const stat = fs.statSync(outputFile);
    console.log(`  ✓ Generated cast_${dir.name}.gif (${stat.size} bytes)`);
  }
}

function generateIdleTurntable() {
  console.log('[GIF Generator] Generating idle 360-degree turntable GIF...');
  const rotDir = path.join(SOURCE_BASE, 'rotations');
  if (!fs.existsSync(rotDir)) return;

  const sequence = [
    'south.png',
    'south-east.png',
    'east.png',
    'north-east.png',
    'north.png',
    'north-west.png',
    'west.png',
    'south-west.png',
  ].map((f) => path.join(rotDir, f)).filter((f) => fs.existsSync(f));

  if (sequence.length === 8) {
    const outputFile = path.join(OUTPUT_DIR, 'idle_turntable.gif');
    const inputFiles = sequence.map((f) => `"${f}"`).join(' ');
    const cmd = `convert -delay 25 -dispose Background -loop 0 ${inputFiles} "${outputFile}"`;
    execSync(cmd);
    const stat = fs.statSync(outputFile);
    console.log(`  ✓ Generated idle_turntable.gif (${stat.size} bytes)`);
  }
}

function generateShowcaseGif() {
  console.log('[GIF Generator] Generating master hero showcase GIF (idle + walk + cast)...');
  // Combine south idle (x2) -> south walk -> south cast
  const walkSouthFrames = path.join(SOURCE_BASE, 'animations/Walking/south');
  const castSouthFrames = path.join(SOURCE_BASE, 'animations/casting_a_fireball/south');
  const idleSouth = path.join(SOURCE_BASE, 'rotations/south.png');

  if (fs.existsSync(walkSouthFrames) && fs.existsSync(castSouthFrames) && fs.existsSync(idleSouth)) {
    const outputFile = path.join(OUTPUT_DIR, 'bloodmage_showcase.gif');
    const cmd = `convert -delay 12 -dispose Background -loop 0 "${idleSouth}" "${idleSouth}" "${walkSouthFrames}/frame_*.png" "${castSouthFrames}/frame_*.png" "${outputFile}"`;
    execSync(cmd);
    const stat = fs.statSync(outputFile);
    console.log(`  ✓ Generated bloodmage_showcase.gif (${stat.size} bytes)`);
  }
}

function main() {
  ensureDir(OUTPUT_DIR);
  generateWalkingGifs();
  generateCastGifs();
  generateIdleTurntable();
  generateShowcaseGif();
  console.log('[GIF Generator] All GIF assets generated successfully!');
}

main();
