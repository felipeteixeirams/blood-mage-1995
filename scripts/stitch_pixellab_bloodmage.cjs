/**
 * Stitches PixelLab 8-directional Blood Mage Idle & Walk frames into master spritesheet.
 * 
 * Rules:
 * - Output: public/assets/sprites/player/bloodmage.png
 * - Frame size: 48x48
 * - Layout: 8 columns x 9 rows (384x432)
 * - Row 0: Idle (South, South-East, East, North-East, North, North-West, West, South-West)
 * - Rows 1-8: Walk (South, South-East, East, North-East, North, North-West, West, South-West) 8 frames each
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const FRAME_SIZE = 48;
const COLS = 8;
const ROWS = 9;
const SHEET_WIDTH = COLS * FRAME_SIZE;
const SHEET_HEIGHT = ROWS * FRAME_SIZE;

const BASE_DIR = path.resolve(process.cwd(), 'sprites_importados/blood_mage/Idle');
const OUTPUT_PATH = path.resolve(process.cwd(), 'public/assets/sprites/player/bloodmage.png');

function readPNG(filePath) {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function copyFrame(srcPng, targetPng, targetCol, targetRow) {
  const targetX = targetCol * FRAME_SIZE;
  const targetY = targetRow * FRAME_SIZE;

  for (let y = 0; y < FRAME_SIZE; y++) {
    for (let x = 0; x < FRAME_SIZE; x++) {
      const srcIdx = (y * srcPng.width + x) * 4;
      const targetIdx = ((targetY + y) * targetPng.width + (targetX + x)) * 4;

      if (x < srcPng.width && y < srcPng.height) {
        targetPng.data[targetIdx] = srcPng.data[srcIdx];         // R
        targetPng.data[targetIdx + 1] = srcPng.data[srcIdx + 1]; // G
        targetPng.data[targetIdx + 2] = srcPng.data[srcIdx + 2]; // B
        targetPng.data[targetIdx + 3] = srcPng.data[srcIdx + 3]; // A
      } else {
        targetPng.data[targetIdx] = 0;
        targetPng.data[targetIdx + 1] = 0;
        targetPng.data[targetIdx + 2] = 0;
        targetPng.data[targetIdx + 3] = 0;
      }
    }
  }
}

async function main() {
  console.log(`[Stitcher] Creating master spritesheet (${SHEET_WIDTH}x${SHEET_HEIGHT})...`);
  const masterSheet = new PNG({ width: SHEET_WIDTH, height: SHEET_HEIGHT });

  // 1. Idle Row (Row 0)
  const idleDirections = [
    'south',
    'south-east',
    'east',
    'north-east',
    'north',
    'north-west',
    'west',
    'south-west',
  ];

  console.log('[Stitcher] Processing Row 0: 8-Directional Idle Rotations...');
  for (let col = 0; col < idleDirections.length; col++) {
    const dirName = idleDirections[col];
    const idlePath = path.join(BASE_DIR, 'rotations', `${dirName}.png`);
    if (!fs.existsSync(idlePath)) {
      throw new Error(`Missing rotation frame: ${idlePath}`);
    }
    const png = readPNG(idlePath);
    copyFrame(png, masterSheet, col, 0);
  }

  // 2. Walk Rows (Rows 1 to 8)
  const walkDirections = [
    'south',
    'south-east',
    'east',
    'north-east',
    'north',
    'north-west',
    'west',
    'south-west',
  ];

  console.log('[Stitcher] Processing Rows 1-8: 8-Directional Walk Animations...');
  for (let rowIdx = 0; rowIdx < walkDirections.length; rowIdx++) {
    const dirName = walkDirections[rowIdx];
    const targetRow = rowIdx + 1;

    for (let frameIdx = 0; frameIdx < 8; frameIdx++) {
      const frameStr = String(frameIdx).padStart(3, '0');
      const framePath = path.join(BASE_DIR, 'animations/Walking', dirName, `frame_${frameStr}.png`);
      if (!fs.existsSync(framePath)) {
        throw new Error(`Missing walk frame: ${framePath}`);
      }
      const png = readPNG(framePath);
      copyFrame(png, masterSheet, frameIdx, targetRow);
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write binary PNG buffer directly
  const buffer = PNG.sync.write(masterSheet);
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`[Stitcher] Master spritesheet successfully generated at: ${OUTPUT_PATH} (${buffer.length} bytes)`);
}

main().catch((err) => {
  console.error('[Stitcher Error]', err);
  process.exit(1);
});
