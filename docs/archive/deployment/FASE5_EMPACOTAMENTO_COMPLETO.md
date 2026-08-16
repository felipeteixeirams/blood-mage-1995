---
agent_context: DevOps / all agents
target_module: deployment
priority: high
status: active
last_updated: 2026-08-11
tags: [deployment, production, pwa, twa, steam]
title: Fase 5 - Guia de Empacotamento e Deploy
date: 2026-08-11
production_status: Produção
---

# 🚀 Guia Completo: PWA → TWA (Google Play) → Steam

> **Bloodmage 1995** — De Web PWA para App Nativo em 3 plataformas

---

## 📋 Pré-requisitos

- Node.js 18+
- Android SDK (para TWA/Google Play)
- Java Development Kit (JDK 11+)
- Bubblewrap CLI
- Git + GitHub account
- Google Play Developer account ($25 one-time)

---

## 1️⃣ PWA (Progressive Web App) — Pronta!

### ✅ Status Atual

```
✅ manifest.webmanifest        — Configurado com icons maskable
✅ service-worker              — Gerado via Vite PWA plugin
✅ install-to-homescreen       — Suportado em Android/Chrome
✅ offline-capable             — Pronto (SW caches assets)
✅ 60+ FPS                      — Validado em build de produção
```

### 📱 Testar PWA Localmente

```bash
# Build de produção
pnpm run build

# Servir com HTTPS (necessário para PWA)
npx serve dist --ssl-cert ./cert.pem --ssl-key ./key.pem

# Ou usar Vercel (já tem HTTPS)
vercel deploy --prod
```

**Chrome DevTools → Application → Manifest** para validar.

---

## 2️⃣ TWA (Trusted Web Activity) → Google Play Store

### O que é TWA?

- Wrapper Android nativo que encapsula o PWA
- Pré-requisito: PWA deve estar servido via HTTPS
- Permite: notificações push, deep linking, Google Play install

### 🏗️ Setup Bubblewrap

```bash
# Instalar bubblewrap
npm install -g @bubblewrap/cli

# Criar projeto TWA
bubblewrap init --manifest https://bloodmage-1995.vercel.app/manifest.webmanifest

# Será pedido:
# - App Name: Bloodmage 1995
# - App Package ID: com.felipeteixeira.bloodmage1995
# - Start URL: https://bloodmage-1995.vercel.app
# - App Display: fullscreen (ou standalone)
```

### 📦 Build APK/AAB

```bash
# Gerar chave de assinatura (uma vez)
keytool -genkey -v -keystore bloodmage-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias bloodmage

# Build APK para teste
bubblewrap build
# Output: app-release.apk

# Build AAB para Google Play (recomendado)
bubblewrap build --enable-notification-delegation
# Output: app-release.aab (Google Play aceita este formato)
```

### 📤 Upload para Google Play

1. Google Play Console → Create app
2. App name: "Bloodmage 1995"
3. Category: Games → Action
4. Rating questionnaire (ESRB: T for Teen — violence, blood)
5. Upload `app-release.aab` to Production track
6. Fill metadata:
   - Screenshots (1280×720 landscape)
   - Description (inglês + português)
   - Privacy policy (link)
   - Contact email
7. Review & publish (1-3 dias)

### Configuração Obrigatória no TWA

Adicionar ao `twa-manifest.json`:

```json
{
  "scope": "/",
  "startUrl": "https://bloodmage-1995.vercel.app",
  "display": "standalone",
  "orientation": "landscape",
  "fallbackType": "custom_tabs",
  "fallbackUrl": "https://bloodmage-1995.vercel.app",
  "features": [
    {
      "name": "offline"
    }
  ]
}
```

---

## 3️⃣ Steam (Desktop/Proton)

### Opção A: Electron Wrapper (Recomendado)

Steam aceita apps Electron. Vamos usar `electron-builder`.

```bash
# Install dependencies
npm install -D electron electron-builder

# Create electron main process (main.js)
```

**main.js:**

```javascript
const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: { nodeIntegration: false },
  });

  mainWindow.loadURL('https://bloodmage-1995.vercel.app');
  mainWindow.webContents.openDevTools(); // Remove em produção
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

**package.json scripts:**

```json
{
  "scripts": {
    "electron": "electron .",
    "build:electron": "electron-builder --publish never"
  }
}
```

**electron-builder.yml:**

```yaml
appId: com.felipeteixeira.bloodmage1995
productName: Bloodmage 1995
directories:
  buildResources: assets

files:
  - dist/**/*
  - main.js
  - package.json

linux:
  target:
    - AppImage
    - deb
  category: Game

windows:
  target:
    - nsis
    - portable
```

### 📦 Build para Steam

```bash
# Build Electron
npm run build:electron

# Output: dist/Bloodmage 1995-1.0.0.AppImage (Linux) ou .exe (Windows)
```

### 📤 Upload para Steam

1. Steamworks → Create App
2. App type: Game → Tools (webview)
3. Upload build via Steamworks SDK
4. Set store page metadata
5. Configure pricing (recomendado: $4.99 USD)
6. Submit for review (3-5 dias)

### Proton para Mac/Linux

Steam roda Electron nativo em Linux/Windows. Para Mac, configure:

```bash
# electron-builder.yml
mac:
  target:
    - dmg
    - zip
  category: public.app-category.games
```

---

## 🔐 SSL/HTTPS para PWA

### Usar Vercel (Automático)

```bash
# Já está servido via HTTPS
# https://bloodmage-1995.vercel.app
```

### Ou Auto-renewals com Let's Encrypt

```bash
# Usar com certbot
sudo certbot certonly --standalone -d bloodmage-1995.com

# Renovar a cada 90 dias (automático via cron)
```

---

## ✅ Checklist Pré-Launch

### PWA
- [ ] manifest.webmanifest válido (validar via WebManifest spec)
- [ ] Service Worker offline-capable
- [ ] HTTPS em produção
- [ ] Icons 192×192 e 512×512 PNG (não SVG)
- [ ] Screenshots 1280×720 PNG

### TWA/Google Play
- [ ] Bubblewrap instalado
- [ ] `twa-manifest.json` configurado
- [ ] APK/AAB assinado com chave privada
- [ ] Privacy policy publicada
- [ ] App testado em Android 8+
- [ ] Orientação landscape fixa

### Steam
- [ ] Electron/NW.js wrapper funcional
- [ ] Build .exe/.AppImage/DMG
- [ ] Steamworks account ativo
- [ ] ESRB rating preenchido
- [ ] Preço definido

---

## 🧪 Teste Completo Pré-Launch

```bash
# 1. PWA local
pnpm run build
serve dist

# 2. TWA test via Android emulator
bubblewrap preview

# 3. Electron local
npm run electron

# 4. Lighthouse audit (PWA score 90+)
npx lighthouse https://bloodmage-1995.vercel.app --view
```

---

## 📊 Performance Requirements (Fase 5)

| Métrica | Target | Status |
|---------|--------|--------|
| Time to Interactive (TTI) | < 3s | ✅ |
| Largest Contentful Paint (LCP) | < 2.5s | ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | ✅ |
| Frame Rate | 60 FPS | ✅ |
| Bundle Size | < 2.5 MB | ✅ (2.0 MB) |

---

## 🔄 Processo de Update

### PWA
```bash
# Service Worker auto-updates a cada visita
# Usuários recebem nova versão automaticamente
git push → vercel deploy → live
```

### TWA
```bash
# Update via Google Play
# Usuários recebem notificação de update
# Timeline: 2-4 horas após upload
```

### Steam
```bash
# Update via Steamworks
# Usuários recebem notificação automática
# Timeline: imediato
```

---

## 💡 Dicas Finais

- **Versioning**: Use semver (1.0.0, 1.0.1, etc)
- **Changelog**: Mantenha `CHANGELOG.md` atualizado
- **Testing**: Sempre testar em dispositivos reais
- **Analytics**: Integre Mixpanel/Firebase para track de uso
- **Support**: Crie email de suporte (support@bloodmage-1995.com)

---

**Happy shipping! 🚀**
