#!/bin/bash
# Build Steam com Electron
# Pré-requisitos: electron e electron-builder instalados
# Uso: ./scripts/build-steam.sh [win|linux|mac|all]

set -e

PLATFORM=${1:-all}

echo "🎮 Bloodmage 1995 — Build Steam (Electron)"
echo "=========================================="
echo ""

# 1. Validar Electron
echo "1️⃣  Verificando Electron..."
if ! npm list electron &> /dev/null; then
  echo "⚠️  Electron não encontrado. Instalando..."
  npm install --save-dev electron electron-builder
fi
echo "✅ Electron: OK"
echo ""

# 2. Build PWA
echo "2️⃣  Building PWA assets..."
npm run build
echo "✅ PWA assets: PASS"
echo ""

# 3. Verificar electron-builder config
echo "3️⃣  Checking electron-builder config..."
if [ ! -f "electron-builder.yml" ]; then
  echo "⚠️  electron-builder.yml não encontrado. Criando padrão..."
  cat > electron-builder.yml << 'EOF'
appId: com.felipeteixeira.bloodmage1995
productName: Bloodmage 1995
directories:
  buildResources: assets
  output: dist/electron
files:
  - dist/**/*
  - main.js
  - package.json
win:
  target:
    - nsis
    - portable
  certificateFile: null
mac:
  target:
    - dmg
    - zip
  category: public.app-category.games
linux:
  target:
    - AppImage
    - deb
  category: Game
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
EOF
  echo "⚠️  Edite electron-builder.yml conforme necessário"
fi
echo "✅ electron-builder config: READY"
echo ""

# 4. Build por plataforma
echo "4️⃣  Building Electron app..."
case "$PLATFORM" in
  win)
    echo "Building Windows..."
    npx electron-builder --win
    ;;
  linux)
    echo "Building Linux..."
    npx electron-builder --linux
    ;;
  mac)
    echo "Building macOS..."
    npx electron-builder --mac
    ;;
  all)
    echo "Building all platforms..."
    npx electron-builder -mwl
    ;;
  *)
    echo "❌ Plataforma inválida: $PLATFORM"
    echo "Use: win | linux | mac | all"
    exit 1
    ;;
esac

echo ""
echo "✅ Steam Build COMPLETO!"
echo ""
echo "📦 Arquivos gerados em: dist/electron/"
echo ""
echo "Próximos passos:"
echo "1. Teste o executável em seu sistema"
echo "2. Upload para Steamworks Dashboard"
echo "3. Configure página de store (preço, screenshots, descrição)"
echo "4. Submit para review (3-5 dias)"
