const fs = require('fs');
const path = require('path');

const ASSET_DIRS = ['src/assets', 'public/assets'];
const EXTENSIONS = {
  '.png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // \x89PNG\r\n\x1a\n
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff]
};

// .webp's signature isn't one contiguous run of bytes like PNG/JPG: it's
// 'RIFF' at offset 0, a 4-byte little-endian file size at offset 4, then
// 'WEBP' at offset 8. AGENTS.md explicitly allows .webp for compressed
// assets, so it needs the same corruption/header check as PNG/JPG.
const WEBP_EXTENSIONS = new Set(['.webp']);
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46]; // 'RIFF'
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'

const MANIFEST_PATH = path.resolve(process.cwd(), 'src/game/assets/assetManifest.json');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

let hasError = false;

// ---------------------------------------------------------------------------
// Part 1: binary integrity of whatever asset files ARE present on disk.
// (Catches the text-editor-corrupts-a-PNG class of bug.)
// ---------------------------------------------------------------------------

function scanDirectory(directory) {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory);

  for (const file of files) {
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
