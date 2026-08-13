# 🚀 Deployment Guide - Bloodmage 1995

Guia rápido para fazer deploy em Web (PWA), Google Play (TWA) e Steam.

---

## 🌐 1. Web PWA (Vercel)

### Requisitos
- Conta Vercel
- Git repo sincronizado

### Build Local
```bash
./scripts/build-pwa.sh
```

### Deploy
```bash
# Opção 1: Auto-deploy via Git
git push  # Vercel detecta e deploya automaticamente

# Opção 2: Deploy manual
vercel deploy --prod
```

### Validação
- Abrir https://bloodmage-1995.vercel.app
- Chrome DevTools → Application → Service Worker (deve estar ativo)
- Lighthouse → PWA score 90+

**Tempo:** ~5 minutos

---

## 📱 2. Google Play (TWA)

### Pré-requisitos
- Android SDK instalado
- Bubblewrap CLI: `npm install -g @bubblewrap/cli`
- Google Play Developer account ($25 one-time)

### Build APK
```bash
./scripts/build-twa.sh
```

Será solicitado:
- Package ID (default: com.felipeteixeira.bloodmage1995)
- Gerar chave de assinatura (guardar em local seguro!)

### Teste em Device
```bash
adb install app-release.apk
# Ou via Android Emulator
```

### Upload para Google Play
1. Google Play Console → Create App
2. App name: "Bloodmage 1995"
3. Category: Games → Action
4. Rating: ESRB T (Teen) - violence, blood
5. Upload AAB (não APK): `bubblewrap build --enable-notification-delegation`
6. Fill metadata:
   - 2-4 screenshots (1280×720)
   - Descrição (Inglês + Português)
   - Privacy policy link
   - Contact email
7. Submit for review

**Tempo:** ~1 hora (setup) + 3-5 dias (review)

---

## 🎮 3. Steam

### Pré-requisitos
- Steamworks account ativo
- Node.js 18+

### Build Electron
```bash
# Todas as plataformas (Windows, macOS, Linux)
./scripts/build-steam.sh all

# Ou específico
./scripts/build-steam.sh win    # Windows
./scripts/build-steam.sh linux  # Linux
./scripts/build-steam.sh mac    # macOS
```

### Teste Local
```bash
npm run electron  # Rodar em desenvolvimento
```

### Upload para Steamworks
1. Steamworks → Create App
2. App type: Game → Tools
3. Configure página:
   - Title: Bloodmage 1995
   - Descrição e trailer
   - Screenshots (mínimo 5)
   - Categorias: Action, Indie, RPG
4. Pricing: $4.99 USD (recomendado)
5. Upload build via Steamworks SDK
6. Submit for review

**Tempo:** ~1 hora (setup) + 3-5 dias (review)

---

## 🔧 Build Scripts Reference

### build-pwa.sh
```bash
./scripts/build-pwa.sh
```
Valida TypeScript → Build Vite → Verifica SW e manifest

### build-twa.sh
```bash
./scripts/build-twa.sh
```
Build Vite → Gera/valida twa-manifest → Build APK/AAB

### build-steam.sh
```bash
./scripts/build-steam.sh [win|linux|mac|all]
```
Build Vite → Gera/valida electron-builder → Build por plataforma

---

## 📊 Performance Targets

| Métrica | Target | Validar |
|---------|--------|---------|
| TTI | < 3s | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| FPS | 60+ | Chrome DevTools |
| Bundle | < 2.5 MB | `npm run build` size |

---

## 🔐 Segurança

### PWA
- HTTPS automático em Vercel ✅
- Service Worker cache offline ✅

### TWA
- Assinatura APK com chave privada
- Google Play signing: Google gerencia chave depois de upload ✅

### Steam
- Electron auto-updates (adicionar depois)

---

## 📈 Monitoramento Pós-Launch

### Analytics
```bash
# Integrar Mixpanel ou Firebase
npm install --save @mixpanel/browser  # ou firebase
```

### Feedback
- Email de suporte: support@bloodmage-1995.com
- GitHub Issues para bug reports

---

## 🐛 Troubleshooting

### PWA não sincroniza
```bash
# Limpar cache
rm -rf .vercel/output
vercel deploy --prod --force
```

### TWA falha no build
```bash
# Remover artefatos antigos
rm -rf .gradle build app-release.*
./scripts/build-twa.sh
```

### Steam build crash
```bash
# Rodar em dev mode com console
npm run electron -- --inspect
```

---

## ✅ Checklist Pré-Launch

- [ ] TypeScript: `npm run typecheck` ✅
- [ ] Build: `npm run build` ✅ (< 30s)
- [ ] Tests: `npm run test` ✅
- [ ] Lighthouse: 90+ PWA score
- [ ] FPS: 60+ em device real
- [ ] Funcionalidades principais testadas:
  - [ ] Fase 1 (inconsciência)
  - [ ] Fase 2 (morte)
  - [ ] Fase 3 (status effects)
  - [ ] Fase 4 (mundo contínuo)
  - [ ] Fase 5 (polimento)

---

**Status:** Ready for Production ✅

Última atualização: 2026-08-11
