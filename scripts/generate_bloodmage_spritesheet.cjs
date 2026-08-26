const fs = require('fs');
const zlib = require('zlib');

const FRAME_W = 68;
const FRAME_H = 68;
const COLS = 8;
const ROWS = 9;
const SHEET_W = COLS * FRAME_W; // 544
const SHEET_H = ROWS * FRAME_H; // 612

// Color palette (RGBA)
const C = {
  trans: [0, 0, 0, 0],
  shadow: [5, 5, 10, 115],
  bootDark: [35, 20, 15, 255],
  bootMid: [55, 30, 20, 255],
  bootGold: [217, 119, 6, 255],
  robeDark: [69, 10, 10, 255],
  robeShadow: [92, 11, 20, 255],
  robeMid: [153, 27, 27, 255],
  robeBright: [185, 28, 28, 255],
  robeHighlight: [220, 38, 38, 255],
  robeTrim: [245, 158, 11, 255],
  beltBlack: [24, 24, 27, 255],
  beltGold: [251, 191, 36, 255],
  phialGlass: [226, 232, 240, 200],
  phialBlood: [239, 68, 68, 255],
  phialGlint: [255, 255, 255, 255],
  skinPale: [226, 213, 197, 255],
  skinShadow: [180, 165, 150, 255],
  eyeGlow: [255, 20, 60, 255],
  eyePupil: [255, 255, 255, 255],
  staffWood: [45, 40, 48, 255],
  staffWoodLit: [75, 70, 80, 255],
  staffGold: [245, 158, 11, 255],
  orbDark: [153, 27, 27, 255],
  orbMid: [220, 38, 38, 255],
  orbBright: [239, 68, 68, 255],
  orbGlint: [254, 202, 202, 255],
  magicSparks: [248, 113, 113, 190],
  hoodShadow: [24, 9, 20, 255],
};

function renderBloodMageFrame(ctx, dir, isWalk, step) {
  // dir: 0=S, 1=SE, 2=E, 3=NE, 4=N, 5=NW, 6=W, 7=SW
  const cx = 34;
  const cy = 34;

  const phase = step / 8;
  const bobY = isWalk ? Math.round(Math.sin(phase * Math.PI * 2) * 1.5) : 0;
  const legSwing = isWalk ? Math.sin(phase * Math.PI * 2) * 3 : 0;
  const swayX = isWalk ? Math.round(Math.cos(phase * Math.PI * 2) * 1.2) : 0;

  // 1. Shadow underneath
  ctx.fillEllipse(cx, cy + 22, 13, 5, C.shadow);

  // 2. Boots
  const bootY = cy + 18 + bobY;
  if (dir === 4 || dir === 3 || dir === 5) {
    // Facing away / north
    ctx.fillRect(cx - 6 - Math.round(legSwing * 0.5), bootY, 4, 6, C.bootDark);
    ctx.fillRect(cx + 2 + Math.round(legSwing * 0.5), bootY, 4, 6, C.bootDark);
  } else if (dir === 2) {
    // East
    ctx.fillRect(cx - 3 + Math.round(legSwing), bootY, 6, 6, C.bootDark);
    ctx.fillRect(cx - 1 - Math.round(legSwing), bootY + 1, 5, 5, C.bootMid);
  } else if (dir === 6) {
    // West
    ctx.fillRect(cx - 3 - Math.round(legSwing), bootY, 6, 6, C.bootDark);
    ctx.fillRect(cx - 4 + Math.round(legSwing), bootY + 1, 5, 5, C.bootMid);
  } else {
    // South / diagonals
    ctx.fillRect(cx - 6 + Math.round(legSwing), bootY, 4, 6, C.bootMid);
    ctx.fillRect(cx + 2 - Math.round(legSwing), bootY, 4, 6, C.bootMid);
    ctx.fillRect(cx - 6 + Math.round(legSwing), bootY, 4, 2, C.bootGold);
    ctx.fillRect(cx + 2 - Math.round(legSwing), bootY, 4, 2, C.bootGold);
  }

  // 3. Robe (Lower Body)
  const robeTop = cy + 6 + bobY;
  const robeBottom = cy + 20 + bobY;
  const robeW = 10;

  for (let y = robeTop; y <= robeBottom; y++) {
    const progress = (y - robeTop) / (robeBottom - robeTop);
    const halfW = Math.round(5 + progress * robeW);
    const leftX = cx - halfW + swayX;
    const rightX = cx + halfW + swayX;

    for (let x = leftX; x <= rightX; x++) {
      let col = C.robeMid;
      if (x === leftX || x === rightX) {
        col = C.robeDark;
      } else if (y === robeBottom || y === robeBottom - 1) {
        col = (x % 3 === 0) ? C.robeTrim : C.robeBright;
      } else if (x === cx + swayX || x === cx + swayX - 1) {
        col = (dir === 4) ? C.robeShadow : C.robeHighlight;
      } else if (x < cx + swayX - 2) {
        col = (dir === 2 || dir === 3) ? C.robeDark : C.robeBright;
      } else if (x > cx + swayX + 2) {
        col = (dir === 6 || dir === 5) ? C.robeDark : C.robeBright;
      }
      ctx.setPixel(x, y, col);
    }
  }

  // 4. Belt & Blood Phials (if facing south/side)
  const beltY = cy + 6 + bobY;
  if (dir !== 4) {
    ctx.fillRect(cx - 6 + swayX, beltY, 12, 2, C.beltBlack);
    ctx.fillRect(cx - 1 + swayX, beltY, 2, 2, C.beltGold);

    // Blood phial on left
    ctx.fillRect(cx - 5 + swayX, beltY + 2, 2, 3, C.phialBlood);
    ctx.fillRect(cx - 5 + swayX, beltY + 1, 2, 1, C.beltGold);
    ctx.setPixel(cx - 5 + swayX, beltY + 2, C.phialGlint);

    // Blood phial on right
    ctx.fillRect(cx + 3 + swayX, beltY + 2, 2, 3, C.phialBlood);
    ctx.fillRect(cx + 3 + swayX, beltY + 1, 2, 1, C.beltGold);
  }

  // 5. Torso & Mantle
  const torsoTop = cy - 6 + bobY;
  for (let y = torsoTop; y < beltY; y++) {
    const halfW = 6;
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      let col = C.robeBright;
      if (x === cx - halfW || x === cx + halfW) col = C.robeDark;
      else if (x === cx || x === cx - 1) col = (dir === 4) ? C.robeDark : C.robeHighlight;
      ctx.setPixel(x + swayX, y, col);
    }
  }

  // Gold Brooch on chest
  if (dir !== 4) {
    ctx.fillRect(cx - 1 + swayX, torsoTop + 2, 2, 2, C.beltGold);
    ctx.setPixel(cx + swayX, torsoTop + 2, C.phialBlood);
  }

  // 6. Pauldrons / Shoulder Guards
  ctx.fillRect(cx - 9 + swayX, torsoTop - 1, 4, 4, C.robeDark);
  ctx.fillRect(cx - 8 + swayX, torsoTop - 1, 2, 2, C.robeTrim);
  ctx.fillRect(cx + 5 + swayX, torsoTop - 1, 4, 4, C.robeDark);
  ctx.fillRect(cx + 6 + swayX, torsoTop - 1, 2, 2, C.robeTrim);

  // 7. Hood & Face
  const headTop = cy - 18 + bobY;
  const headBottom = torsoTop + 1;

  // Hood shape
  for (let y = headTop; y <= headBottom; y++) {
    const prog = (y - headTop) / (headBottom - headTop);
    const halfW = Math.round(2 + prog * 6);
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      let col = C.robeMid;
      if (y === headTop || y === headTop + 1) col = C.robeHighlight;
      else if (x === cx - halfW || x === cx + halfW) col = C.robeDark;
      ctx.setPixel(x + swayX, y, col);
    }
  }

  // Inner cowl shadow & face
  if (dir === 4) {
    // Back of hood
    for (let y = headTop + 4; y <= headBottom; y++) {
      ctx.setPixel(cx + swayX, y, C.robeDark);
      ctx.setPixel(cx - 1 + swayX, y, C.robeShadow);
    }
  } else {
    // Face cavity (shadowed cowl interior)
    const faceY = headTop + 6;
    ctx.fillRect(cx - 4 + swayX, faceY, 8, 7, C.hoodShadow);

    // Pale skin peek
    ctx.fillRect(cx - 3 + swayX, faceY + 2, 6, 4, C.skinPale);
    ctx.fillRect(cx - 2 + swayX, faceY + 5, 4, 2, C.skinShadow);

    // Piercing Crimson Eyes
    if (dir === 0 || dir === 1 || dir === 7) {
      // South / down
      ctx.fillRect(cx - 3 + swayX, faceY + 2, 2, 2, C.eyeGlow);
      ctx.fillRect(cx + 1 + swayX, faceY + 2, 2, 2, C.eyeGlow);
      ctx.setPixel(cx - 3 + swayX, faceY + 2, C.eyePupil);
      ctx.setPixel(cx + 1 + swayX, faceY + 2, C.eyePupil);
    } else if (dir === 2 || dir === 3) {
      // East / North-East
      ctx.fillRect(cx + swayX, faceY + 2, 2, 2, C.eyeGlow);
      ctx.setPixel(cx + 1 + swayX, faceY + 2, C.eyePupil);
    } else if (dir === 6 || dir === 5) {
      // West / North-West
      ctx.fillRect(cx - 2 + swayX, faceY + 2, 2, 2, C.eyeGlow);
      ctx.setPixel(cx - 2 + swayX, faceY + 2, C.eyePupil);
    }
  }

  // 8. Staff / Relic Weapon
  let staffX = cx + 11 + swayX;
  let staffY = cy - 14 + bobY;

  if (dir === 6 || dir === 5 || dir === 7) {
    staffX = cx - 12 + swayX; // Left side when facing west
  }

  // Staff shaft (vertical dark elderwood)
  ctx.fillRect(staffX, staffY + 6, 2, 26, C.staffWood);
  ctx.fillRect(staffX + 1, staffY + 8, 1, 22, C.staffWoodLit);

  // Staff golden head claw
  ctx.fillRect(staffX - 2, staffY + 2, 6, 4, C.staffGold);
  ctx.fillRect(staffX - 3, staffY, 2, 3, C.staffGold);
  ctx.fillRect(staffX + 3, staffY, 2, 3, C.staffGold);

  // Glowing Blood Orb
  ctx.fillCircle(staffX + 1, staffY - 2, 4, C.orbMid);
  ctx.fillCircle(staffX + 1, staffY - 2, 2, C.orbBright);
  ctx.setPixel(staffX, staffY - 3, C.orbGlint);

  // Subtle magic sparkles around staff head
  ctx.setPixel(staffX - 3, staffY - 5, C.magicSparks);
  ctx.setPixel(staffX + 5, staffY - 3, C.magicSparks);
  ctx.setPixel(staffX - 4, staffY + 1, C.magicSparks);
}

function generateSpritesheetBuffer() {
  const pixelBuffer = Buffer.alloc(SHEET_W * SHEET_H * 4, 0);

  function createSubContext(frameX, frameY) {
    const originX = frameX * FRAME_W;
    const originY = frameY * FRAME_H;

    return {
      setPixel(x, y, [r, g, b, a]) {
        if (x < 0 || x >= FRAME_W || y < 0 || y >= FRAME_H) return;
        const targetX = originX + x;
        const targetY = originY + y;
        const offset = (targetY * SHEET_W + targetX) * 4;

        if (a === 255) {
          pixelBuffer[offset] = r;
          pixelBuffer[offset + 1] = g;
          pixelBuffer[offset + 2] = b;
          pixelBuffer[offset + 3] = 255;
        } else if (a > 0) {
          // Alpha blend over background
          const oldA = pixelBuffer[offset + 3] / 255;
          const newA = a / 255;
          const outA = newA + oldA * (1 - newA);
          if (outA > 0) {
            pixelBuffer[offset] = Math.round((r * newA + pixelBuffer[offset] * oldA * (1 - newA)) / outA);
            pixelBuffer[offset + 1] = Math.round((g * newA + pixelBuffer[offset + 1] * oldA * (1 - newA)) / outA);
            pixelBuffer[offset + 2] = Math.round((b * newA + pixelBuffer[offset + 2] * oldA * (1 - newA)) / outA);
            pixelBuffer[offset + 3] = Math.round(outA * 255);
          }
        }
      },
      fillRect(x, y, w, h, col) {
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            this.setPixel(x + dx, y + dy, col);
          }
        }
      },
      fillCircle(cx, cy, radius, col) {
        const r2 = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= r2) {
              this.setPixel(cx + dx, cy + dy, col);
            }
          }
        }
      },
      fillEllipse(cx, cy, rx, ry, col) {
        for (let dy = -ry; dy <= ry; dy++) {
          for (let dx = -rx; dx <= rx; dx++) {
            if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0) {
              this.setPixel(cx + dx, cy + dy, col);
            }
          }
        }
      }
    };
  }

  // Row 0: 8 Idle frames (1 per direction)
  for (let dir = 0; dir < 8; dir++) {
    const ctx = createSubContext(dir, 0);
    renderBloodMageFrame(ctx, dir, false, 0);
  }

  // Rows 1..8: Walk animations (8 frames per direction)
  for (let dir = 0; dir < 8; dir++) {
    const row = 1 + dir;
    for (let step = 0; step < 8; step++) {
      const ctx = createSubContext(step, row);
      renderBloodMageFrame(ctx, dir, true, step);
    }
  }

  // Convert raw pixelBuffer into PNG using zlib
  const stride = 1 + SHEET_W * 4;
  const rawPngData = Buffer.alloc(SHEET_H * stride);

  for (let y = 0; y < SHEET_H; y++) {
    const rowStart = y * stride;
    rawPngData[rowStart] = 0; // Filter None
    pixelBuffer.copy(rawPngData, rowStart + 1, y * SHEET_W * 4, (y + 1) * SHEET_W * 4);
  }

  const idatCompressed = zlib.deflateSync(rawPngData, { level: 9 });

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c >>> 0;
  }

  function chunk(type, data) {
    const len = data ? data.length : 0;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    if (data) data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    crcBuf.write(type, 0, 4, 'ascii');
    if (data) data.copy(crcBuf, 4);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(SHEET_W, 0);
  ihdrData.writeUInt32BE(SHEET_H, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', idatCompressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const pngBuffer = generateSpritesheetBuffer();
fs.writeFileSync('public/assets/sprites/player/bloodmage.png', pngBuffer);
console.log('Successfully generated public/assets/sprites/player/bloodmage.png with size:', pngBuffer.length, 'bytes');
