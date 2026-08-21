const fs = require('fs');
const path = require('path');

const SCAN_DIRS = ['src/assets', 'public/assets', 'public/fonts', 'public'];
const MAGIC_SIGNATURES = {
  '.png': {
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    validator: (buffer, filePath) => {
      // Check IHDR width and height
      if (buffer.length >= 24) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        if (width === 0 || height === 0 || width > 100000 || height > 100000) {
          return `Dimensões IHDR inválidas (${width}x${height})`;
        }
      }
      return null;
    }
  },
  '.jpg': {
    bytes: [0xff, 0xd8, 0xff]
  },
  '.jpeg': {
    bytes: [0xff, 0xd8, 0xff]
  },
  '.webp': {
    bytes: [0x52, 0x49, 0x46, 0x46] // RIFF
  },
  '.gif': {
    bytes: [0x47, 0x49, 0x46, 0x38] // GIF8
  },
  '.woff2': {
    bytes: [0x77, 0x4f, 0x46, 0x32] // wOF2
  },
  '.ogg': {
    bytes: [0x4f, 0x67, 0x67, 0x53] // OggS
  },
  '.mp3': {
    bytes: [0x49, 0x44, 0x33] // ID3 (ou MPEG frame sync 0xFF 0xFB)
  }
};

let hasError = false;
let totalChecked = 0;

function scanDirectory(directory, rootDir = true) {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Don't recurse node_modules, dist, .git
      if (['node_modules', 'dist', '.git'].includes(file)) continue;
      scanDirectory(fullPath, false);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (MAGIC_SIGNATURES[ext]) {
        checkFileIntegrity(fullPath, ext);
      }
    }
  }
}

function checkFileIntegrity(filePath, ext) {
  const sig = MAGIC_SIGNATURES[ext];
  if (!sig) return;

  totalChecked++;
  const stat = fs.statSync(filePath);
  if (stat.size < 8) {
    console.error(`❌ ERRO: O arquivo ${filePath} está vazio ou curto demais (${stat.size} bytes).`);
    hasError = true;
    return;
  }

  const fd = fs.openSync(filePath, 'r');
  const readLen = Math.min(stat.size, 64);
  const buffer = Buffer.alloc(readLen);
  fs.readSync(fd, buffer, 0, readLen, 0);
  fs.closeSync(fd);

  // Verifica corrupção UTF-8 replacement (\xEF\xBF\xBD)
  if (buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd) {
    console.error(`🚨 CORRUPÇÃO CRÍTICA (UTF-8 REPLACEMENT DETECTADO): ${filePath}`);
    console.error(`   Este arquivo binário foi corrompido por manipulação como texto UTF-8.`);
    hasError = true;
    return;
  }

  // Verifica magic bytes esperados
  if (sig.bytes) {
    let matches = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[i] !== sig.bytes[i]) {
        matches = false;
        break;
      }
    }

    // MP3 fallback to frame sync if no ID3 tag
    if (!matches && ext === '.mp3' && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
      matches = true;
    }

    if (!matches) {
      console.error(`❌ HEADER INVÁLIDO: O arquivo ${filePath} não possui assinatura válida de ${ext}. (Recebido: ${buffer.slice(0, 8).toString('hex')})`);
      hasError = true;
      return;
    }
  }

  if (sig.validator) {
    const valErr = sig.validator(buffer, filePath);
    if (valErr) {
      console.error(`❌ VALIDAÇÃO DE PAYLOAD FALHOU: ${filePath} - ${valErr}`);
      hasError = true;
    }
  }
}

console.log('🔍 Executando Verificação de Integridade de Todos os Assets Binários...');
SCAN_DIRS.forEach(dir => scanDirectory(dir));

if (hasError) {
  console.error('\n💥 FALHA NA INTEGRIDADE: Assets binários corrompidos encontrados!');
  console.error('Consulte /docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md para restaurar via Git Blobs.\n');
  process.exit(1);
} else {
  console.log(`✅ Todos os ${totalChecked} assets binários verificados estão 100% íntegros e válidos!\n`);
  process.exit(0);
}

