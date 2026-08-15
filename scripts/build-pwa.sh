#!/bin/bash
# Build PWA para Vercel
# Uso: ./scripts/build-pwa.sh

set -e

echo "🎮 Bloodmage 1995 — Build PWA"
echo "=============================="
echo ""

# 1. Validar TypeScript
echo "1️⃣  TypeScript validation..."
npx tsc -p tsconfig.json --noEmit
echo "✅ TypeScript: PASS"
echo ""

# 2. Build Vite
echo "2️⃣  Building assets with Vite..."
npm run build
echo "✅ Vite: PASS"
echo ""

# 3. Validar Service Worker
echo "3️⃣  Validating Service Worker..."
if [ -f "dist/sw.js" ]; then
  echo "✅ Service Worker gerado: dist/sw.js"
else
  echo "⚠️  Service Worker não encontrado"
fi
echo ""

# 4. Validar manifest.webmanifest
echo "4️⃣  Validating manifest..."
if [ -f "dist/manifest.webmanifest" ]; then
  echo "✅ PWA Manifest found: dist/manifest.webmanifest"
else
  echo "❌ PWA Manifest not found!"
  exit 1
fi
echo ""

echo "📦 PWA Build COMPLETO!"
echo "Pronto para: vercel deploy --prod"
