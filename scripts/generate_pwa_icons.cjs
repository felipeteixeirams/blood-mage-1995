const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createPwaIcon(size) {
  const png = new PNG({ width: size, height: size });

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = a;
  }

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  // 1. Dark Gothic Background with Vignette
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy) / maxR;
      const k = Math.min(dist, 1);
      // Dark gothic obsidian background
      const r = Math.round(20 * (1 - k * 0.7));
      const g = Math.round(10 * (1 - k * 0.7));
      const b = Math.round(18 * (1 - k * 0.7));
      setPixel(x, y, r, g, b, 255);
    }
  }

  // 2. Glowing Blood Sigil / Crimson Crest
  const ringR = size * 0.38;
  const ringThickness = Math.max(2, Math.round(size * 0.025));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (Math.abs(dist - ringR) < ringThickness) {
        setPixel(x, y, 217, 119, 6); // Antique gold ring
      } else if (dist < ringR && dist > ringR - ringThickness * 2) {
        setPixel(x, y, 185, 28, 28); // Crimson inner ring
      }
    }
  }

  // 3. Central Crimson Blood Chalice / Mage Crest
  const scale = size / 192;
  function fillCircle(ox, oy, radius, r, g, b, a = 255) {
    for (let y = Math.floor(oy - radius); y <= Math.ceil(oy + radius); y++) {
      for (let x = Math.floor(ox - radius); x <= Math.ceil(ox + radius); x++) {
        if (Math.hypot(x - ox, y - oy) <= radius) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  // Blood Orb in center
  fillCircle(cx, cy - 10 * scale, 32 * scale, 220, 38, 38);
  fillCircle(cx - 8 * scale, cy - 18 * scale, 10 * scale, 254, 202, 202); // Glint
  fillCircle(cx + 8 * scale, cy - 4 * scale, 6 * scale, 255, 100, 100);

  // Gold Chalice holding the Blood Orb
  for (let y = Math.floor(cy); y < cy + 45 * scale; y++) {
    const dy = y - cy;
    const chaliceHalfW = (36 - dy * 0.5) * scale;
    for (let x = Math.floor(cx - chaliceHalfW); x <= Math.ceil(cx + chaliceHalfW); x++) {
      if (Math.abs(x - cx) >= chaliceHalfW - 4 * scale) {
        setPixel(x, y, 251, 191, 36); // Gold rim
      } else {
        setPixel(x, y, 180, 120, 20); // Gold body
      }
    }
  }

  // Chalice stem and base
  for (let y = Math.floor(cy + 35 * scale); y < cy + 60 * scale; y++) {
    for (let x = Math.floor(cx - 6 * scale); x <= Math.ceil(cx + 6 * scale); x++) {
      setPixel(x, y, 217, 119, 6);
    }
  }
  for (let y = Math.floor(cy + 55 * scale); y < cy + 68 * scale; y++) {
    const baseW = (18 + (y - (cy + 55 * scale)) * 3) * scale;
    for (let x = Math.floor(cx - baseW); x <= Math.ceil(cx + baseW); x++) {
      setPixel(x, y, 245, 158, 11);
    }
  }

  return PNG.sync.write(png);
}

const icons = [
  { path: 'public/icon-192.png', size: 192 },
  { path: 'public/icon-512.png', size: 512 },
  { path: 'public/icon-512-maskable.png', size: 512 },
];

for (const icon of icons) {
  const buf = createPwaIcon(icon.size);
  fs.writeFileSync(path.resolve(process.cwd(), icon.path), buf);
  console.log(`Generated PWA icon: ${icon.path} (${buf.length} bytes)`);
}
