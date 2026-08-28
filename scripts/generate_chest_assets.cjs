const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const W = 48;
const H = 48;

function createChestPNG(dir) {
  const png = new PNG({ width: W, height: H });

  // Clear to transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const idx = (y * W + x) * 4;
    if (a < 255 && png.data[idx + 3] > 0) {
      const srcA = a / 255;
      const dstA = png.data[idx + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      png.data[idx] = Math.round((r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
      png.data[idx + 1] = Math.round((g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
      png.data[idx + 2] = Math.round((b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
      png.data[idx + 3] = Math.round(outA * 255);
    } else {
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
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

  const cx = 24;
  const cy = 25;

  // 1. Contact Drop Shadow
  fillEllipse(cx, cy + 12, 16, 6, 8, 4, 10, 140);

  // 2. Base Chest Box Dimensions
  const boxW = 28;
  const boxH = 20;
  const bx = cx - Math.floor(boxW / 2);
  const by = cy - 4;

  // Palette: Dark aged oak wood
  // Darkest: #24140e (36, 20, 14), Mid: #422213 (66, 34, 19), Light: #66381e (102, 56, 30), Highlight: #8a4e2a (138, 78, 42)
  // Iron bands: #1c1917 (28, 25, 23), #38322e (56, 50, 46), #574f49 (87, 79, 73)
  // Gold/Brass: #b45309 (180, 83, 9), #f59e0b (245, 158, 11), #fde68a (253, 230, 138)
  // Ruby: #dc2626 (220, 38, 38), #f87171 (248, 113, 113)

  // 3. Wooden Box Body (Planks & Texture)
  for (let y = by; y < by + boxH; y++) {
    for (let x = bx; x < bx + boxW; x++) {
      // Wood plank grain dithering
      const isPlankGap = (y === by + 6 || y === by + 13);
      if (isPlankGap) {
        setPixel(x, y, 25, 12, 8); // Dark groove between planks
      } else {
        const grain = ((x * 7 + y * 13) % 5);
        if (grain === 0) {
          setPixel(x, y, 102, 56, 30); // Wood light grain
        } else if (grain === 1) {
          setPixel(x, y, 138, 78, 42); // Wood highlight
        } else if (grain === 2) {
          setPixel(x, y, 36, 20, 14); // Wood shadow grain
        } else {
          setPixel(x, y, 66, 34, 19); // Wood base
        }
      }
    }
  }

  // 4. Curved Arched Domed Lid (3D perspective)
  const lidY = by - 8;
  const lidH = 10;
  for (let y = lidY; y < by + 2; y++) {
    const prog = (y - lidY) / lidH;
    const curve = Math.round(Math.sin(prog * Math.PI) * 2);
    const lw = boxW + 2;
    const lx = bx - 1;
    for (let x = lx; x < lx + lw; x++) {
      if (y === lidY) {
        // Top edge of lid
        setPixel(x, y, 138, 78, 42); // Top rim highlight
      } else if (y === by + 1) {
        setPixel(x, y, 20, 10, 6); // Lid bottom rim shadow
      } else {
        const g = ((x * 3 + y * 11) % 4);
        if (g === 0) setPixel(x, y, 102, 56, 30);
        else setPixel(x, y, 66, 34, 19);
      }
    }
  }

  // 5. Heavy Black Iron Reinforcement Straps & Corner Brackets
  // Outer perimeter dark iron bevel
  for (let y = lidY; y < by + boxH; y++) {
    setPixel(bx - 1, y, 28, 25, 23);
    setPixel(bx + boxW, y, 28, 25, 23);
  }
  for (let x = bx - 1; x <= bx + boxW; x++) {
    setPixel(x, lidY, 56, 50, 46);
    setPixel(x, by + boxH, 20, 18, 16);
  }

  // Vertical Iron Straps (Left, Center, Right)
  const strapX1 = bx + 5;
  const strapX2 = bx + boxW - 7;
  const strapMid = cx - 1;

  [strapX1, strapX2].forEach((sx) => {
    fillRect(sx, lidY, 3, boxH + lidH, 40, 36, 32);
    for (let y = lidY; y < by + boxH; y++) {
      setPixel(sx, y, 70, 64, 58); // Highlight edge of iron strap
      setPixel(sx + 2, y, 20, 18, 16); // Shadow edge
    }
    // Gold/Iron Rivets
    setPixel(sx + 1, lidY + 3, 245, 158, 11);
    setPixel(sx + 1, by + 4, 245, 158, 11);
    setPixel(sx + 1, by + 10, 245, 158, 11);
    setPixel(sx + 1, by + 16, 245, 158, 11);
  });

  // Horizontal Rim Iron Band across lid/base seam
  fillRect(bx - 1, by - 1, boxW + 2, 3, 40, 36, 32);
  for (let x = bx - 1; x <= bx + boxW; x++) {
    setPixel(x, by - 1, 80, 74, 68); // Upper iron trim shine
    setPixel(x, by + 1, 18, 16, 14); // Lower iron trim shadow
  }

  // 6. Directional Props (Front Skull Lock, Rear Hinges, Side Handles)
  if (dir === 'north' || dir === 'north-west' || dir === 'north-east') {
    // REAR VIEW: Heavy Iron Hinges with bolts
    [strapX1, strapX2].forEach((sx) => {
      fillRect(sx - 1, by - 4, 5, 7, 28, 25, 23);
      fillRect(sx, by - 3, 3, 5, 60, 54, 48);
      // Hinge Pin
      fillRect(sx - 1, by - 1, 5, 2, 90, 84, 76);
      setPixel(sx + 1, by - 1, 245, 158, 11); // Gold hinge bolt
    });
  }

  if (dir === 'east' || dir === 'north-east' || dir === 'south-east') {
    // EAST / RIGHT SIDE: Heavy Iron Drop Handle
    const handleX = bx + boxW;
    fillRect(handleX, by + 4, 3, 3, 50, 45, 40);
    // Ring loop
    fillRect(handleX + 1, by + 6, 2, 4, 30, 26, 22);
    setPixel(handleX + 2, by + 7, 80, 74, 68);
  }

  if (dir === 'west' || dir === 'north-west' || dir === 'south-west') {
    // WEST / LEFT SIDE: Heavy Iron Drop Handle
    const handleX = bx - 3;
    fillRect(handleX, by + 4, 3, 3, 50, 45, 40);
    // Ring loop
    fillRect(handleX, by + 6, 2, 4, 30, 26, 22);
    setPixel(handleX, by + 7, 80, 74, 68);
  }

  if (dir === 'south' || dir === 'south-east' || dir === 'south-west' || !dir) {
    // FRONT VIEW: Ornate Tarnished Brass Skull Latch with Ruby Keyhole
    const lockX = cx - 4;
    const lockY = by - 3;

    // Brass Escutcheon Plate
    fillRect(lockX, lockY, 8, 10, 180, 83, 9);
    fillRect(lockX + 1, lockY + 1, 6, 8, 245, 158, 11);

    // Embossed Skull Emblem in Center
    fillRect(lockX + 2, lockY + 2, 4, 3, 253, 230, 138); // Cranium
    fillRect(lockX + 3, lockY + 5, 2, 2, 253, 230, 138); // Jaw
    // Skull Eye Sockets
    setPixel(lockX + 2, lockY + 3, 30, 15, 10);
    setPixel(lockX + 4, lockY + 3, 30, 15, 10);

    // Glowing Blood Ruby Lock Core below Skull
    setPixel(cx - 1, lockY + 6, 220, 38, 38);
    setPixel(cx, lockY + 6, 248, 113, 113); // Ruby glint
    setPixel(cx - 1, lockY + 7, 153, 27, 27);
    setPixel(cx, lockY + 7, 153, 27, 27);

    // Lower lock hasp lip
    fillRect(cx - 2, lockY + 8, 4, 2, 120, 53, 15);
  }

  return PNG.sync.write(png);
}

const directions = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west',
];

const itemsDir = path.resolve(process.cwd(), 'public/assets/sprites/items');
const chestDir = path.join(itemsDir, 'chest');
fs.mkdirSync(chestDir, { recursive: true });

// 1. Generate master default chest
const defaultBuf = createChestPNG('south');
fs.writeFileSync(path.join(itemsDir, 'chest.png'), defaultBuf);
console.log(`[Chest] Wrote master chest at public/assets/sprites/items/chest.png`);

// 2. Generate 8 directions
directions.forEach((d) => {
  const buf = createChestPNG(d);
  const target = path.join(chestDir, `${d}.png`);
  fs.writeFileSync(target, buf);
  console.log(`[Chest] Wrote directional chest at public/assets/sprites/items/chest/${d}.png`);
});
