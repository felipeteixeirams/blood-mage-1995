#!/bin/bash
# Build TWA para Google Play Store
# Pré-requisitos: Bubblewrap CLI instalado (npm install -g @bubblewrap/cli)
# Uso: ./scripts/build-twa.sh

set -e

echo "🎮 Bloodmage 1995 — Build TWA (Google Play)"
echo "============================================"
echo ""

# 1. Validar se Bubblewrap está instalado
echo "1️⃣  Verificando Bubblewrap..."
if ! command -v bubblewrap &> /dev/null; then
  echo "❌ Bubblewrap não está instalado"
  echo "Instale com: npm install -g @bubblewrap/cli"
  exit 1
fi
echo "✅ Bubblewrap encontrado"
echo ""

# 2. Build PWA primeiro
echo "2️⃣  Building PWA assets..."
npm run build
echo "✅ PWA assets: PASS"
echo ""

# 3. Verificar/criar twa-manifest.json
echo "3️⃣  Checking TWA manifest..."
if [ ! -f "twa-manifest.json" ]; then
  echo "⚠️  twa-manifest.json não encontrado. Criando padrão..."
  cat > twa-manifest.json << 'EOF'
{
  "manifestUrl": "https://bloodmage-1995.vercel.app/manifest.webmanifest",
  "packageId": "com.felipeteixeira.bloodmage1995",
  "sha256Fingerprints": ["put_your_sha256_fingerprint_here"],
  "name": "Bloodmage 1995",
  "launcherUrl": "https://bloodmage-1995.vercel.app",
  "startUrl": "/",
  "display": "standalone",
  "themeColor": "#0d0709",
  "backgroundColor": "#0d0709",
  "orientation": "landscape",
  "scope": "/",
  "shortcuts": [
    {
      "name": "Iniciar Partida",
      "short_name": "Jogar",
      "description": "Comece uma nova aventura",
      "url": "/",
      "icons": []
    }
  ],
  "generatedApks": false,
  "apkVersion": 1
}
EOF
  echo "⚠️  Atualize SHA256 fingerprint após gerar chave de assinatura"
fi
echo "✅ TWA manifest: READY"
echo ""

# 4. Build APK
echo "4️⃣  Building APK com Bubblewrap..."
echo "⚠️  Se for primeira vez, será solicitado para gerar chave de assinatura"
echo "   Guarde 'bloodmage-key.jks' em lugar seguro!"
echo ""

bubblewrap build

echo ""
echo "✅ TWA Build COMPLETO!"
echo ""
echo "📱 Próximos passos:"
echo "1. Teste APK em Android device/emulator"
echo "2. Upload AAB para Google Play Console"
echo "3. Preencha metadata (screenshots, descrição, ESRB rating)"
echo ""
echo "📦 Arquivo gerado: app-release.apk ou app-release.aab"
