#!/usr/bin/env node
/**
 * Monta o spritesheet do Blood Mage a partir da arte real exportada do PixelLab.
 *
 * Uso:
 *   node scripts/build_bloodmage_spritesheet.cjs [pastaDeOrigem]
 *
 * Origem padrão: sprites_importados/blood_mage_v2
 * Espera a estrutura de export do PixelLab:
 *   <origem>/Idle/rotations/<dir>.png                      (1 frame idle por direção)
 *   <origem>/Idle/animations/Walking/<dir>/frame_00N.png   (8 frames de walk por direção)
 *
 *   <origem>/Idle/animations/casting_a_fireball/<dir>/frame_00N.png  (6 frames de cast por direção, opcional)
 *
 * Saída: public/assets/sprites/player/bloodmage.png
 *   Grade 8 colunas x 17 linhas de células 68x68 (544x1156), no layout exato que
 *   src/game/animations/animationManager.ts espera:
 *     linha 0        -> idle,  1 frame por direção  (frames 0..7)
 *     linhas 1..8    -> walk,  8 frames por direção  (frames 8..71)
 *     linhas 9..16   -> cast,  1 linha por direção, 6 frames usados nas
 *                       colunas 0..5 (colunas 6-7 ficam vazias — cast tem
 *                       menos frames que walk). Se a pasta
 *                       `casting_a_fireball` não existir na origem, essas
 *                       linhas ficam totalmente transparentes e o jogo cai de
 *                       volta no alias `bloodmage_cast` (frames de walk) sem
 *                       quebrar.
 *   Ordem das direções (walk E cast): south, south-east, east, north-east, north, north-west, west, south-west
 *
 * Não usa dependências externas: decodifica e codifica PNG com zlib nativo.
 * Recusa qualquer arquivo de origem corrompido (ver docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md, itens 13-14).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC_ROOT = process.argv[2] || 'sprites_importados/blood_mage_v2';
const OUT_PATH = 'public/assets/sprites/player/bloodmage.png';

const CELL_W = 68;
const CELL_H = 68;
const COLS = 8;
const ROWS = 17;
const WALK_FRAMES = 8;
const CAST_FRAMES = 6;

// Ordem canônica — precisa bater com animationManager.ts
const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// ---------------------------------------------------------------- CRC32 / PNG

let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  CRC_TABLE = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c;
  }
  return CRC_TABLE;
}
function crc32(buf) {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function assertIntact(file, buf) {
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error(
      `${file}: não é um PNG válido (header = ${buf.subarray(0, 4).toString('hex')}). ` +
      `Se começa com "efbfbd", o arquivo foi corrompido como texto UTF-8 — veja o item 14 do troubleshooting.`
    );
  }
  if (buf.includes(Buffer.from([0xef, 0xbf, 0xbd]))) {
    throw new Error(`${file}: contém sequências de substituição UTF-8 (EF BF BD). Arquivo corrompido, recuse.`);
  }
}

/** Decodifica um PNG (bit depth 8; color types 0/2/3/4/6) para {width, height, rgba}. */
function decodePng(file) {
  const buf = fs.readFileSync(file);
  assertIntact(file, buf);

  let pos = 8;
  let ihdr = null;
  const idat = [];
  let palette = null;
  let trns = null;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'tRNS') trns = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }

  if (!ihdr) throw new Error(`${file}: IHDR ausente.`);
  if (ihdr.bitDepth !== 8) throw new Error(`${file}: bit depth ${ihdr.bitDepth} não suportado (esperado 8).`);
  if (ihdr.interlace) throw new Error(`${file}: PNG entrelaçado não é suportado.`);

  const channelsFor = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const channels = channelsFor[ihdr.colorType];
  if (!channels) throw new Error(`${file}: color type ${ihdr.colorType} não suportado.`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const stride = width * channels;
  const out = Buffer.alloc(width * height * channels);

  // Desfaz os filtros por scanline
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      const x = line[i];
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`${file}: filtro PNG desconhecido (${filter}).`);
      }
      cur[i] = v & 0xff;
    }
  }

  // Normaliza para RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, n = width * height; i < n; i++) {
    let r, g, b, a = 255;
    if (ihdr.colorType === 6) { r = out[i*4]; g = out[i*4+1]; b = out[i*4+2]; a = out[i*4+3]; }
    else if (ihdr.colorType === 2) { r = out[i*3]; g = out[i*3+1]; b = out[i*3+2]; }
    else if (ihdr.colorType === 0) { r = g = b = out[i]; }
    else if (ihdr.colorType === 4) { r = g = b = out[i*2]; a = out[i*2+1]; }
    else { // 3 = palette
      const idx = out[i];
      r = palette[idx*3]; g = palette[idx*3+1]; b = palette[idx*3+2];
      if (trns && idx < trns.length) a = trns[idx];
    }
    rgba[i*4] = r; rgba[i*4+1] = g; rgba[i*4+2] = b; rgba[i*4+3] = a;
  }

  return { width, height, rgba };
}

/** Codifica RGBA8 para um buffer PNG. */
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    PNG_MAGIC,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- composição

/** Calcula a caixa delimitadora dos pixels não-transparentes. */
function contentBounds(img) {
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.rgba[(y * img.width + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null; // frame totalmente transparente
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Cola src na célula alinhando o CONTEÚDO (não a tela do arquivo): centro
 * horizontal e base do personagem sempre no mesmo ponto da célula.
 *
 * Isso é essencial porque o PixelLab exporta as rotações idle em 48x48 e os
 * frames de Walking em 68x68 — alinhar pela borda do arquivo faria o
 * personagem "pular" alguns pixels ao alternar entre parado e andando.
 */
function blit(dst, dstW, src, cellCol, cellRow) {
  const b = contentBounds(src);
  if (!b) return;

  const dstH = dst.length / (dstW * 4);
  const cellX = cellCol * CELL_W;
  const cellY = cellRow * CELL_H;
  if (cellY + CELL_H > dstH || cellX + CELL_W > dstW) {
    // Guarda defensiva: uma célula fora do buffer é sinal de ROWS/COLS
    // dessincronizado do número real de direções/frames — falha alto e claro
    // em vez de descartar pixels silenciosamente (bug já cometido uma vez aqui).
    throw new Error(
      `blit: célula [col=${cellCol}, row=${cellRow}] cai fora do sheet ` +
      `(${dstW}x${dstH}). Confira ROWS/COLS contra o número real de direções/frames.`
    );
  }

  // Âncora: centro horizontal da célula, pés a BOTTOM_MARGIN do fundo.
  let offX = cellX + Math.round((CELL_W - b.w) / 2) - b.minX;
  let offY = cellY + (CELL_H - BOTTOM_MARGIN - b.h) - b.minY;

  // Não deixa o conteúdo escapar da célula
  offX = Math.max(cellX - b.minX, Math.min(offX, cellX + CELL_W - b.w - b.minX));
  offY = Math.max(cellY - b.minY, Math.min(offY, cellY + CELL_H - b.h - b.minY));

  for (let y = b.minY; y <= b.maxY; y++) {
    const dy = offY + y;
    if (dy < cellY || dy >= cellY + CELL_H) continue;
    for (let x = b.minX; x <= b.maxX; x++) {
      const dx = offX + x;
      if (dx < cellX || dx >= cellX + CELL_W) continue;
      const si = (y * src.width + x) * 4;
      if (src.rgba[si + 3] === 0) continue;
      const di = (dy * dstW + dx) * 4;
      dst[di] = src.rgba[si];
      dst[di + 1] = src.rgba[si + 1];
      dst[di + 2] = src.rgba[si + 2];
      dst[di + 3] = src.rgba[si + 3];
    }
  }
}

const BOTTOM_MARGIN = 4; // pixels de folga abaixo dos pés dentro da célula

/** Localiza a pasta de estado do export (a que contém `rotations/`). */
function resolveStateDir(root) {
  const direct = path.join(root, 'Idle');
  if (fs.existsSync(path.join(direct, 'rotations'))) return direct;
  const candidates = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(root, e.name))
    .filter((d) => fs.existsSync(path.join(d, 'rotations')));
  if (candidates.length === 0) {
    throw new Error(
      `Nenhuma pasta com 'rotations/' encontrada em ${root}. ` +
      `Estrutura esperada: <origem>/<Estado>/rotations/*.png`
    );
  }
  // Prefere a que também tem animações de Walking
  const withWalk = candidates.find((d) => fs.existsSync(path.join(d, 'animations', 'Walking')));
  return withWalk || candidates[0];
}

function main() {
  if (!fs.existsSync(SRC_ROOT)) {
    console.error(`❌ Pasta de origem não encontrada: ${SRC_ROOT}`);
    console.error(`   Baixe a arte primeiro:`);
    console.error(`   node scripts/pixellab_client.cjs download 5b677987-c87a-4f2e-a3d7-c0fdcea7eeb5 ${SRC_ROOT}`);
    process.exit(1);
  }

  const sheetW = COLS * CELL_W;
  const sheetH = ROWS * CELL_H;
  const sheet = Buffer.alloc(sheetW * sheetH * 4); // RGBA transparente

  // O PixelLab nomeia a pasta de estado conforme o personagem ("Idle", etc.).
  // Detecta automaticamente qual subpasta contém as rotações.
  const stateDir = resolveStateDir(SRC_ROOT);
  const idleDir = path.join(stateDir, 'rotations');
  const walkDir = path.join(stateDir, 'animations', 'Walking');
  if (path.basename(stateDir) !== 'Idle') {
    console.log(`ℹ️  Usando pasta de estado detectada: ${path.relative(SRC_ROOT, stateDir) || '.'}`);
  }

  let count = 0;
  const sizes = new Set();

  // Linha 0 — idle, um frame por direção
  DIRS.forEach((dir, col) => {
    const f = path.join(idleDir, `${dir}.png`);
    if (!fs.existsSync(f)) throw new Error(`Idle ausente: ${f}`);
    const img = decodePng(f);
    sizes.add(`${img.width}x${img.height}`);
    blit(sheet, sheetW, img, col, 0);
    count++;
  });

  // Linhas 1..8 — walk, 8 frames por direção
  DIRS.forEach((dir, i) => {
    const row = 1 + i;
    for (let step = 0; step < WALK_FRAMES; step++) {
      const f = path.join(walkDir, dir, `frame_${String(step).padStart(3, '0')}.png`);
      if (!fs.existsSync(f)) throw new Error(`Walk ausente: ${f}`);
      const img = decodePng(f);
      sizes.add(`${img.width}x${img.height}`);
      blit(sheet, sheetW, img, step, row);
      count++;
    }
  });

  // Linhas 9..14 — cast, 6 frames por direção (opcional; some sem quebrar o build)
  const castDir = path.join(stateDir, 'animations', 'casting_a_fireball');
  let castIncluded = false;
  if (fs.existsSync(castDir)) {
    DIRS.forEach((dir, i) => {
      const row = 9 + i;
      for (let step = 0; step < CAST_FRAMES; step++) {
        const f = path.join(castDir, dir, `frame_${String(step).padStart(3, '0')}.png`);
        if (!fs.existsSync(f)) return; // pasta parcial — pula a direção, não quebra o build
        const img = decodePng(f);
        sizes.add(`${img.width}x${img.height}`);
        blit(sheet, sheetW, img, step, row);
        count++;
        castIncluded = true;
      }
    });
  }

  const png = encodePng(sheetW, sheetH, sheet);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, png);

  console.log(`✅ ${OUT_PATH}`);
  console.log(`   ${sheetW}x${sheetH}  (grade ${COLS}x${ROWS} de células ${CELL_W}x${CELL_H})`);
  console.log(`   ${count} frames compostos  |  tamanho dos originais: ${[...sizes].join(', ')}`);
  console.log(`   Cast: ${castIncluded ? 'incluído (linhas 9-16)' : 'AUSENTE na origem — linhas 9-16 ficam transparentes, jogo usa fallback de walk'}`);
  console.log(`   ${png.length} bytes  |  header: ${png.subarray(0, 4).toString('hex')}`);
  console.log(`\n   Confira com: pnpm verify`);
}

try { main(); } catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
