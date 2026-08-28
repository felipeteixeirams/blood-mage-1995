const fs = require('fs');
const path = require('path');

// public/fonts ainda não existe hoje, mas listar aqui é inofensivo — scanDirectory
// pula diretórios ausentes — e já cobre o dia em que fontes locais forem adicionadas.
const ASSET_DIRS = ['src/assets', 'public/assets', 'public/fonts'];
const EXTENSIONS = {
  '.png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // \x89PNG\r\n\x1a\n
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff],
  '.gif': [0x47, 0x49, 0x46, 0x38], // 'GIF8' — cobre os GIFs de showcase em sprites/player/animated/
  '.woff2': [0x77, 0x4f, 0x46, 0x32], // 'wOF2'
  '.ogg': [0x4f, 0x67, 0x67, 0x53], // 'OggS'
};

// .webp's signature isn't one contiguous run of bytes like PNG/JPG: it's
// 'RIFF' at offset 0, a 4-byte little-endian file size at offset 4, then
// 'WEBP' at offset 8. AGENTS.md explicitly allows .webp for compressed
// assets, so it needs the same corruption/header check as PNG/JPG.
const WEBP_EXTENSIONS = new Set(['.webp']);
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46]; // 'RIFF'
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'

// .mp3 has two valid magic patterns — an ID3 tag ('ID3' at offset 0) or, for
// files without one, a raw MPEG frame sync (0xFF followed by a byte whose top
// 3 bits are set). Needs its own check function like .webp instead of a
// single fixed byte sequence.
const MP3_EXTENSIONS = new Set(['.mp3']);
const ID3_MAGIC = [0x49, 0x44, 0x33]; // 'ID3'

const MANIFEST_PATH = path.resolve(process.cwd(), 'src/game/assets/assetManifest.json');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

let hasError = false;

// ---------------------------------------------------------------------------
// Part 1: binary integrity of whatever asset files ARE present on disk.
// (Catches the text-editor-corrupts-a-PNG class of bug.)
// ---------------------------------------------------------------------------

// Diretórios que nunca devem ser varridos mesmo se algum ASSET_DIRS futuro
// apontar para uma raiz mais ampla (defensivo — hoje ASSET_DIRS já é
// suficientemente específico para não tocar nenhum destes).
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', '.git']);

function scanDirectory(directory) {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory);

  for (const file of files) {
    if (SKIP_DIR_NAMES.has(file)) continue;
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      checkFileIntegrity(fullPath);
    }
  }
}

function bytesMatch(buffer, offset, expected) {
  for (let i = 0; i < expected.length; i++) {
    if (buffer[offset + i] !== expected[i]) return false;
  }
  return true;
}

function checkFileIntegrity(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (WEBP_EXTENSIONS.has(ext)) {
    checkWebpIntegrity(filePath);
    return;
  }

  if (MP3_EXTENSIONS.has(ext)) {
    checkMp3Integrity(filePath);
    return;
  }

  const expectedMagicBytes = EXTENSIONS[ext];

  if (!expectedMagicBytes) return; // Ignora outros tipos

  // Verifica se o arquivo tem tamanho mínimo
  const stat = fs.statSync(filePath);
  if (stat.size < expectedMagicBytes.length) {
    console.error(`❌ ERRO: O arquivo ${filePath} está vazio ou curto demais (${stat.size} bytes).`);
    hasError = true;
    return;
  }

  // Lê os primeiros bytes
  const buffer = Buffer.alloc(expectedMagicBytes.length);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, expectedMagicBytes.length, 0);
  fs.closeSync(fd);

  // Verifica corrupção UTF-8 comum (\xEF\xBF\xBD)
  if (buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd) {
    console.error(`🚨 CORRUPÇÃO CRÍTICA (UTF-8 REPLACEMENT DETECTADO): ${filePath}`);
    console.error(`   Este arquivo foi salvo indevidamente como texto. Restaure-o do repositório.`);
    hasError = true;
    return;
  }

  // Verifica se o magic byte bate com o esperado
  if (!bytesMatch(buffer, 0, expectedMagicBytes)) {
    console.error(`❌ HEADER INVÁLIDO: O arquivo ${filePath} não é um ${ext} válido.`);
    hasError = true;
    return;
  }

  // Sanidade de dimensões IHDR para QUALQUER .png no disco (não só os que
  // aparecem no manifesto — pega corrupção em UI/tilesets/decorativos também).
  // A validação de grid contra frameWidth/frameHeight declarado continua
  // sendo feita só para spritesheets do manifesto, em verifyManifestCoverage().
  if (ext === '.png') {
    try {
      const { width, height } = readPngDimensions(filePath);
      if (width === 0 || height === 0 || width > 100000 || height > 100000) {
        console.error(`❌ VALIDAÇÃO DE PAYLOAD FALHOU: ${filePath} — dimensões IHDR inválidas (${width}x${height}).`);
        hasError = true;
      }
    } catch (err) {
      console.error(`❌ ERRO: falha ao ler dimensões IHDR de ${filePath} (${err.message}).`);
      hasError = true;
    }
  }
}

function checkMp3Integrity(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size < 4) {
    console.error(`❌ ERRO: O arquivo ${filePath} está vazio ou curto demais (${stat.size} bytes).`);
    hasError = true;
    return;
  }

  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  if (buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd) {
    console.error(`🚨 CORRUPÇÃO CRÍTICA (UTF-8 REPLACEMENT DETECTADO): ${filePath}`);
    console.error(`   Este arquivo foi salvo indevidamente como texto. Restaure-o do repositório.`);
    hasError = true;
    return;
  }

  const hasId3 = bytesMatch(buffer, 0, ID3_MAGIC);
  // Sem tag ID3: aceita o frame sync MPEG bruto (0xFF seguido de um byte cujos
  // 3 bits mais altos estão setados — 0xE0 = 0b11100000).
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;

  if (!hasId3 && !hasFrameSync) {
    console.error(`❌ HEADER INVÁLIDO: O arquivo ${filePath} não possui assinatura válida de .mp3 (esperado 'ID3' ou frame sync MPEG).`);
    hasError = true;
  }
}

function checkWebpIntegrity(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size < 12) {
    console.error(`❌ ERRO: O arquivo ${filePath} está vazio ou curto demais (${stat.size} bytes).`);
    hasError = true;
    return;
  }

  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);

  if (buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd) {
    console.error(`🚨 CORRUPÇÃO CRÍTICA (UTF-8 REPLACEMENT DETECTADO): ${filePath}`);
    console.error(`   Este arquivo foi salvo indevidamente como texto. Restaure-o do repositório.`);
    hasError = true;
    return;
  }

  const hasRiff = bytesMatch(buffer, 0, RIFF_MAGIC);
  const hasWebp = bytesMatch(buffer, 8, WEBP_MAGIC);

  if (!hasRiff || !hasWebp) {
    console.error(`❌ HEADER INVÁLIDO: O arquivo ${filePath} não é um .webp válido (esperado 'RIFF'...'WEBP').`);
    hasError = true;
  }
}

// ---------------------------------------------------------------------------
// Part 2: PNG dimension reader (IHDR chunk), used to validate that a
// spritesheet's real pixel size is actually sliceable by its declared
// frameWidth/frameHeight — catches silent "wrong grid" bugs where the file
// exists and is a valid PNG, but Phaser will slice it into garbage frames.
// ---------------------------------------------------------------------------

function readPngDimensions(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const header = Buffer.alloc(24);
  fs.readSync(fd, header, 0, 24, 0);
  fs.closeSync(fd);
  // IHDR width/height live at bytes 16-23 (big-endian uint32 each)
  const width = header.readUInt32BE(16);
  const height = header.readUInt32BE(20);
  return { width, height };
}

// ---------------------------------------------------------------------------
// Part 3: asset manifest coverage — cross-checks assetManifest.json against
// what actually exists under public/. This is the check that used to be
// missing entirely: a manifest entry could be silently absent forever and
// nothing would ever fail.
// ---------------------------------------------------------------------------

function verifyManifestCoverage() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn(`⚠️  Manifesto de assets não encontrado em ${MANIFEST_PATH} — pulando verificação de cobertura.`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const requiredOk = [];
  const requiredMissing = [];
  const requiredBadDimensions = [];
  const plannedPending = [];
  const plannedPresent = [];

  for (const asset of manifest) {
    const isRequired = Boolean(asset.required);
    const absPath = path.join(PUBLIC_DIR, asset.path);
    const exists = fs.existsSync(absPath);

    if (!exists) {
      if (isRequired) {
        requiredMissing.push(asset);
      } else {
        plannedPending.push(asset);
      }
      continue;
    }

    // File exists — for required spritesheets, validate the frame grid.
    if (asset.type === 'spritesheet' && path.extname(absPath).toLowerCase() === '.png') {
      try {
        const { width, height } = readPngDimensions(absPath);
        const gridOk = width % asset.frameWidth === 0 && height % asset.frameHeight === 0;
        if (!gridOk) {
          const message = `[${asset.key}] ${asset.path}: dimensões reais ${width}x${height} não são múltiplas do frame declarado ${asset.frameWidth}x${asset.frameHeight}.`;
          if (isRequired) {
            requiredBadDimensions.push({ ...asset, message });
          } else {
            console.warn(`⚠️  ATENÇÃO (planejado): ${message} — corrija o grid antes de marcar como required.`);
          }
          continue;
        }
      } catch (err) {
        if (isRequired) {
          requiredBadDimensions.push({ ...asset, message: `[${asset.key}] ${asset.path}: falha ao ler dimensões PNG (${err.message}).` });
          continue;
        }
      }
    }

    if (isRequired) {
      requiredOk.push(asset);
    } else {
      plannedPresent.push(asset);
    }
  }

  console.log('\n📦 Cobertura do Manifesto de Assets (assetManifest.json)');
  console.log(`   ✅ Obrigatórios OK: ${requiredOk.length}`);
  if (plannedPresent.length > 0) {
    console.log(`   ✅ Planejados já produzidos (considere marcar required: true): ${plannedPresent.length}`);
    plannedPresent.forEach((a) => console.log(`      - [${a.key}] ${a.path}`));
  }
  if (plannedPending.length > 0) {
    console.log(`   🟡 Planejados pendentes (usando fallback procedural, esperado nesta fase): ${plannedPending.length}`);
    plannedPending.forEach((a) => console.log(`      - [${a.key}] ${a.path}`));
  }

  if (requiredMissing.length > 0) {
    hasError = true;
    console.error(`\n💥 ${requiredMissing.length} asset(s) OBRIGATÓRIOS ausentes em public/:`);
    requiredMissing.forEach((a) => console.error(`   - [${a.key}] esperado em public/${a.path}`));
    console.error('   Corrija o arquivo, ou marque required: false em assetManifest.json se ele deixou de existir de propósito.');
  }

  if (requiredBadDimensions.length > 0) {
    hasError = true;
    console.error(`\n💥 ${requiredBadDimensions.length} asset(s) OBRIGATÓRIOS com grid de spritesheet inválido:`);
    requiredBadDimensions.forEach((a) => console.error(`   - ${a.message}`));
  }
}

console.log('🔍 Executando Verificação de Integridade de Assets Binários...');

ASSET_DIRS.forEach((dir) => scanDirectory(dir));

if (!hasError) {
  console.log('✅ Todos os assets binários estão íntegros e com cabeçalhos válidos!');
}

verifyManifestCoverage();

if (hasError) {
  console.error('\n💥 FALHA NA INTEGRIDADE: assets corrompidos ou obrigatórios ausentes encontrados!');
  console.error('Consulte /docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md para restaurar assets corrompidos.\n');
  process.exit(1);
} else {
  console.log('\n✅ Verificação de assets concluída sem falhas obrigatórias.\n');
  process.exit(0);
}
