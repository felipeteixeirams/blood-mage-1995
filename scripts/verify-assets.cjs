const fs = require('fs');
const path = require('path');

const ASSET_DIRS = ['src/assets', 'public/assets'];
const EXTENSIONS = {
  '.png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // \x89PNG\r\n\x1a\n
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff]
};

let hasError = false;

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

function checkFileIntegrity(filePath) {
  const ext = path.extname(filePath).toLowerCase();
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
  let isValid = true;
  for (let i = 0; i < expectedMagicBytes.length; i++) {
    if (buffer[i] !== expectedMagicBytes[i]) {
      isValid = false;
      break;
    }
  }

  if (!isValid) {
    console.error(`❌ HEADER INVÁLIDO: O arquivo ${filePath} não é um ${ext} válido.`);
    hasError = true;
  }
}

console.log('🔍 Executando Verificação de Integridade de Assets Binários...');

ASSET_DIRS.forEach(dir => scanDirectory(dir));

if (hasError) {
  console.error('\n💥 FALHA NA INTEGRIDADE: Assets corrompidos encontrados!');
  console.error('Consulte /docs/critical/05_TROUBLESHOOTING_KNOWN_ISSUES.md para restaurar.\n');
  process.exit(1);
} else {
  console.log('✅ Todos os assets binários estão íntegros e com cabeçalhos válidos!\n');
  process.exit(0);
}
