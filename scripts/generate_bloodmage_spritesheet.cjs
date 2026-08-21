const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const FRAME_W = 48;
const FRAME_H = 48;
const COLS = 8;
const ROWS = 17; // Row 0: Idle (8 dirs), Rows 1-8: Walk (8 dirs x 8 frames), Rows 9-16: Cast (8 dirs x 8 frames)
const SHEET_W = COLS * FRAME_W; // 384
const SHEET_H = ROWS * FRAME_H; // 816

function createBloodMageSpritesheet() {
  const png = new PNG({ width: SHEET_W, height: SHEET_H });

  // Clear to transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= SHEET_W || y < 0 || y >= SHEET_H) return;
    const idx = (y * SHEET_W + x) * 4;
    // Alpha blending with underlying pixel if needed
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

  // Directions: 0=S, 1=SE, 2=E, 3=NE, 4=N, 5=NW, 6=W, 7=SW
  function renderFrame(col, row, dir, animType, step) {
    const ox = col * FRAME_W;
    const oy = row * FRAME_H;

    const cx = ox + 24;
    const cy = oy + 24;

    const isWalk = animType === 'walk';
    const isCast = animType === 'cast';

    const phase = step / 8;
    const bobY = isWalk
      ? Math.round(Math.sin(phase * Math.PI * 2) * 1.5)
      : isCast
      ? Math.round(Math.sin(phase * Math.PI) * -2.5)
      : Math.round(Math.sin((col / 8) * Math.PI * 2) * 0.5);

    const legSwing = isWalk ? Math.sin(phase * Math.PI * 2) * 2.5 : 0;
    const swayX = isWalk ? Math.round(Math.cos(phase * Math.PI * 2) * 1.0) : 0;

    // 1. Shadow underneath
    const shadowR = isCast ? 10 + Math.round(Math.sin(phase * Math.PI) * 1.5) : 9;
    fillEllipse(cx, cy + 17, shadowR, 4, 10, 5, 12, 120);

    // 2. Boots (dark leather with gold buckles)
    const bootY = cy + 14 + bobY;
    if (dir === 4 || dir === 3 || dir === 5) {
      // North facing
      fillRect(cx - 4 - Math.round(legSwing * 0.4), bootY, 3, 4, 30, 20, 15);
      fillRect(cx + 2 + Math.round(legSwing * 0.4), bootY, 3, 4, 30, 20, 15);
    } else if (dir === 2 || dir === 1) {
      // East facing
      fillRect(cx - 2 + Math.round(legSwing * 0.7), bootY, 4, 4, 30, 20, 15);
      fillRect(cx - 1 - Math.round(legSwing * 0.7), bootY + 1, 3, 3, 45, 28, 20);
    } else if (dir === 6 || dir === 7) {
      // West facing
      fillRect(cx - 2 - Math.round(legSwing * 0.7), bootY, 4, 4, 30, 20, 15);
      fillRect(cx - 2 + Math.round(legSwing * 0.7), bootY + 1, 3, 3, 45, 28, 20);
    } else {
      // South facing
      fillRect(cx - 4 + Math.round(legSwing * 0.6), bootY, 3, 4, 45, 25, 18);
      fillRect(cx + 1 - Math.round(legSwing * 0.6), bootY, 3, 4, 45, 25, 18);
      setPixel(cx - 3 + Math.round(legSwing * 0.6), bootY + 1, 217, 119, 6);
      setPixel(cx + 2 - Math.round(legSwing * 0.6), bootY + 1, 217, 119, 6);
    }

    // 3. Flowing Crimson Robe (Lower Body)
    const robeTop = cy + 4 + bobY;
    const robeBottom = cy + 15 + bobY;
    const castFlare = isCast ? Math.round(Math.sin(phase * Math.PI) * 2) : 0;
    const baseW = 7 + castFlare;

    for (let y = robeTop; y <= robeBottom; y++) {
      const prog = (y - robeTop) / (robeBottom - robeTop);
      const halfW = Math.round(3 + prog * baseW);
      const leftX = cx - halfW + swayX;
      const rightX = cx + halfW + swayX;

      for (let x = leftX; x <= rightX; x++) {
        let r = 153, g = 27, b = 27; // Mid robe red
        if (x === leftX || x === rightX) {
          r = 69; g = 10; b = 10; // Dark outline
        } else if (y >= robeBottom - 1) {
          if (x % 2 === 0) {
            r = 245; g = 158; b = 11; // Gold ragged hem
          } else {
            r = 185; g = 28; b = 28;
          }
        } else if (x === cx + swayX) {
          r = 220; g = 38; b = 38; // Center pleat highlight
        } else if (x < cx + swayX - 1) {
          r = (dir === 2 || dir === 3) ? 80 : 185;
          g = (dir === 2 || dir === 3) ? 12 : 28;
          b = (dir === 2 || dir === 3) ? 12 : 28;
        } else if (x > cx + swayX + 1) {
          r = (dir === 6 || dir === 5) ? 80 : 185;
          g = (dir === 6 || dir === 5) ? 12 : 28;
          b = (dir === 6 || dir === 5) ? 12 : 28;
        }
        setPixel(x, y, r, g, b, 255);
      }
    }

    // 4. Belt & Tarnished Gold Buckle with Blood Phials
    const beltY = cy + 3 + bobY;
    fillRect(cx - 4 + swayX, beltY, 8, 2, 24, 24, 27);
    fillRect(cx - 1 + swayX, beltY, 2, 2, 251, 191, 36); // Buckle gold
    // Side blood potion phials
    if (dir === 0 || dir === 1 || dir === 7) {
      fillRect(cx + 3 + swayX, beltY - 1, 2, 3, 239, 68, 68);
      setPixel(cx + 3 + swayX, beltY - 1, 255, 255, 255); // Glass glint
    }

    // 5. Torso & Shoulders (Gothic Robes with Mantle)
    const torsoY = cy - 4 + bobY;
    for (let y = torsoY; y < beltY; y++) {
      const tw = (y < torsoY + 2) ? 6 : 5;
      fillRect(cx - tw + swayX, y, tw * 2, 1, 153, 27, 27);
      // Dark gothic mantle shading
      setPixel(cx - tw + swayX, y, 69, 10, 10);
      setPixel(cx + tw - 1 + swayX, y, 69, 10, 10);
    }
    // Mantle gold trim
    fillRect(cx - 5 + swayX, torsoY, 10, 1, 217, 119, 6);

    // 6. Deep Crimson Hood & Sinister Gaunt Visage
    const headY = cy - 13 + bobY;
    // Hood back/outline
    fillEllipse(cx + swayX, headY + 4, 6, 6, 69, 10, 10);
    // Hood cowl
    fillEllipse(cx + swayX, headY + 3, 5, 5, 185, 28, 28);
    // Hood shadow interior
    fillRect(cx - 3 + swayX, headY + 2, 6, 5, 20, 8, 14);

    // Pale Face & Piercing Glowing Eyes
    if (dir !== 4) {
      // Not looking fully away (North)
      const lookOffsetX = (dir === 2 || dir === 1 || dir === 3) ? 1 : (dir === 6 || dir === 7 || dir === 5) ? -1 : 0;
      
      // Gaunt pale skin in shadow
      fillRect(cx - 2 + swayX + lookOffsetX, headY + 3, 4, 3, 220, 205, 190);
      setPixel(cx - 2 + swayX + lookOffsetX, headY + 5, 160, 145, 130); // Gaunt jaw shadow
      setPixel(cx + 1 + swayX + lookOffsetX, headY + 5, 160, 145, 130);

      // Glowing Crimson Eyes
      if (dir === 2 || dir === 3) {
        // Looking East
        setPixel(cx + swayX + 1, headY + 3, 255, 20, 60);
        setPixel(cx + swayX + 1, headY + 3, 255, 255, 255, 180);
      } else if (dir === 6 || dir === 5) {
        // Looking West
        setPixel(cx + swayX - 1, headY + 3, 255, 20, 60);
        setPixel(cx + swayX - 1, headY + 3, 255, 255, 255, 180);
      } else {
        // Looking South / Diagonal
        setPixel(cx - 1 + swayX, headY + 3, 255, 20, 60);
        setPixel(cx + 1 + swayX, headY + 3, 255, 20, 60);
        setPixel(cx - 1 + swayX, headY + 3, 255, 255, 255, 180);
        setPixel(cx + 1 + swayX, headY + 3, 255, 255, 255, 180);
      }
    } else {
      // Facing North - back of pointed hood peak
      setPixel(cx + swayX, headY - 1, 153, 27, 27);
      setPixel(cx + swayX, headY - 2, 69, 10, 10);
    }

    // 7. Petrified Dark Wood Staff with Pulsing Ruby Blood Gem
    let staffX = cx + 8;
    let staffY = cy + bobY;
    let staffTipY = cy - 14 + bobY;

    if (isCast) {
      const castAngle = Math.sin(phase * Math.PI) * 0.8;
      const reach = Math.round(Math.sin(phase * Math.PI) * 6);
      if (dir === 2 || dir === 1 || dir === 3) {
        staffX = cx + 8 + reach;
        staffTipY = cy - 12 - Math.round(reach * 0.8) + bobY;
      } else if (dir === 6 || dir === 7 || dir === 5) {
        staffX = cx - 8 - reach;
        staffTipY = cy - 12 - Math.round(reach * 0.8) + bobY;
      } else if (dir === 4) {
        staffX = cx + 7;
        staffTipY = cy - 16 - reach + bobY;
      } else {
        staffX = cx + 7 + Math.round(reach * 0.5);
        staffTipY = cy - 15 - reach + bobY;
      }
    } else if (dir === 6 || dir === 7 || dir === 5) {
      staffX = cx - 8;
    }

    // Staff Shaft (gnarled petrified wood)
    for (let sy = staffTipY + 4; sy <= staffY + 14; sy++) {
      setPixel(staffX, sy, 45, 30, 25);
      setPixel(staffX + 1, sy, 70, 50, 40);
    }
    // Staff Gold Crown/Prongs
    fillRect(staffX - 1, staffTipY + 2, 3, 2, 217, 119, 6);
    setPixel(staffX - 2, staffTipY + 1, 245, 158, 11);
    setPixel(staffX + 2, staffTipY + 1, 245, 158, 11);

    // Floating Ruby Blood Gem atop Staff
    fillEllipse(staffX, staffTipY, 3, 3, 220, 38, 38);
    setPixel(staffX, staffTipY - 1, 255, 200, 200); // Gem sparkle highlight
    setPixel(staffX - 1, staffTipY, 255, 50, 80);

    // 8. Magic VFX (Sparks / Sigil Circle when Casting)
    if (isCast && step >= 2 && step <= 6) {
      // Swirling blood magic runes at staff tip
      const sparkRadius = Math.round(4 + Math.sin(phase * Math.PI) * 3);
      fillEllipse(staffX, staffTipY, sparkRadius, sparkRadius, 239, 68, 68, 80);
      setPixel(staffX + Math.round(Math.cos(phase * 12) * sparkRadius), staffTipY + Math.round(Math.sin(phase * 12) * sparkRadius), 254, 202, 202);
      setPixel(staffX - Math.round(Math.cos(phase * 12) * sparkRadius), staffTipY - Math.round(Math.sin(phase * 12) * sparkRadius), 255, 100, 100);
      // Front hand thrusting forward
      fillRect(staffX - 2, staffY + 2, 3, 2, 220, 205, 190);
    }
  }

  // Row 0: Idle (8 directions)
  const idleDirs = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let col = 0; col < 8; col++) {
    renderFrame(col, 0, idleDirs[col], 'idle', col);
  }

  // Rows 1-8: Walk (8 directions x 8 frames)
  for (let r = 0; r < 8; r++) {
    const dir = r; // 0=S, 1=SE, 2=E, 3=NE, 4=N, 5=NW, 6=W, 7=SW
    for (let frame = 0; frame < 8; frame++) {
      renderFrame(frame, r + 1, dir, 'walk', frame);
    }
  }

  // Rows 9-16: Cast (8 directions x 8 frames)
  for (let r = 0; r < 8; r++) {
    const dir = r;
    for (let frame = 0; frame < 8; frame++) {
      renderFrame(frame, r + 9, dir, 'cast', frame);
    }
  }

  return PNG.sync.write(png);
}

const outPath = path.resolve(process.cwd(), 'public/assets/sprites/player/bloodmage.png');
const outDir = path.dirname(outPath);
fs.mkdirSync(outDir, { recursive: true });

const buf = createBloodMageSpritesheet();
fs.writeFileSync(outPath, buf);
console.log(`[BloodMage] Generated 48x48 17-row master spritesheet at: ${outPath} (${buf.length} bytes, 384x816 px)`);
