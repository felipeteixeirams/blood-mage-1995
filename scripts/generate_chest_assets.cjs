const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const W = 48;
const H = 48;

function createChestPng(dirName) {
  const png = new PNG({ width: W, height: H });

  // Fill transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const idx = (y * W + x) * 4;
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = a;
  }

  function fillRect(rx, ry, rw, rh, r, g, b, a = 255) {
    for (let py = ry; py < ry + rh; py++) {
      for (let px = rx; px < rx + rw; px++) {
        setPixel(px, py, r, g, b, a);
      }
    }
  }

  function fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  // 1. Soft Shadow Base
  fillEllipse(24, 38, 18, 6, 10, 5, 12, 160);

  // 2. Heavy Gothic Dark Wood Body (Isometric chest)
  const isNorth = dirName && dirName.includes('north');
  const isSide = dirName && (dirName.includes('east') || dirName.includes('west'));

  // Main chest base
  fillRect(8, 18, 32, 20, 56, 28, 14);     // Dark ancient mahogany
  fillRect(9, 19, 30, 18, 78, 38, 18);     // Mid wood plank tone
  fillRect(10, 21, 28, 5, 95, 48, 22);     // Upper wood grain
  fillRect(10, 29, 28, 5, 95, 48, 22);     // Lower wood grain

  // Chest Lid / Dome
  fillRect(6, 12, 36, 8, 45, 20, 10);      // Lid rim dark
  fillRect(8, 10, 32, 5, 88, 42, 20);      // Lid curved top
  fillRect(11, 8, 26, 3, 110, 55, 25);     // Lid highlight peak

  // 3. Black Wrought Iron & Gold Bands with Rivets
  // Left vertical band
  fillRect(12, 9, 4, 29, 30, 28, 35);
  fillRect(13, 9, 2, 29, 217, 119, 6);     // Gold inlay stripe
  setPixel(13, 11, 255, 230, 150);         // Rivet glint
  setPixel(13, 20, 255, 230, 150);         // Rivet glint
  setPixel(13, 30, 255, 230, 150);         // Rivet glint

  // Right vertical band
  fillRect(32, 9, 4, 29, 30, 28, 35);
  fillRect(33, 9, 2, 29, 217, 119, 6);     // Gold inlay stripe
  setPixel(33, 11, 255, 230, 150);         // Rivet glint
  setPixel(33, 20, 255, 230, 150);         // Rivet glint
  setPixel(33, 30, 255, 230, 150);         // Rivet glint

  // Horizontal reinforcing rim
  fillRect(6, 17, 36, 3, 25, 24, 30);      // Lock seam rim
  fillRect(8, 18, 32, 1, 217, 119, 6);     // Gold seam line

  // 4. Central Demonic / Blood Skull Lockplate
  if (!isNorth) {
    // Front Skull / Blood Lock Plate
    fillRect(21, 16, 6, 9, 35, 30, 42);    // Lock plate base
    fillRect(22, 17, 4, 7, 217, 119, 6);   // Gold filigree
    fillRect(23, 19, 2, 3, 220, 38, 38);   // Glowing Crimson Blood Gem Keyhole
    setPixel(23, 19, 255, 200, 200);       // Glint
    
    // Ambient blood runes pulsing on wood
    setPixel(17, 24, 239, 68, 68, 200);
    setPixel(18, 25, 185, 28, 28, 180);
    setPixel(29, 24, 239, 68, 68, 200);
    setPixel(30, 25, 185, 28, 28, 180);
  } else {
    // Back hinges for North angles
    fillRect(14, 11, 4, 5, 20, 20, 24);
    fillRect(30, 11, 4, 5, 20, 20, 24);
    fillRect(15, 12, 2, 3, 180, 140, 50);
    fillRect(31, 12, 2, 3, 180, 140, 50);
  }

  // 5. Directional lighting nuance
  if (dirName && dirName.includes('east')) {
    // Highlight east / right flank
    fillRect(36, 12, 4, 25, 120, 60, 30, 80);
  } else if (dirName && dirName.includes('west')) {
    // Highlight west / left flank
    fillRect(8, 12, 4, 25, 120, 60, 30, 80);
  }

  return PNG.sync.write(png);
}

const chestDirs = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west'
];

const targetDir = path.resolve(process.cwd(), 'public/assets/sprites/items/chest');
fs.mkdirSync(targetDir, { recursive: true });

// Generate directional chests
for (const dir of chestDirs) {
  const buf = createChestPng(dir);
  const outPath = path.join(targetDir, `${dir}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`Generated chest frame: ${outPath} (${buf.length} bytes)`);
}

// Generate default chest.png
const defaultBuf = createChestPng('south');
const defaultPath = path.resolve(process.cwd(), 'public/assets/sprites/items/chest.png');
fs.writeFileSync(defaultPath, defaultBuf);
console.log(`Generated default chest: ${defaultPath} (${defaultBuf.length} bytes)`);
