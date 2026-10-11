# PWA

**Mestre:** [operations](README.md)
**Status:** verificado
**Verificado em:** 2026-10-11

Estado do PWA hoje, por leitura estática (nenhum build rodado; `dist/` e `public/sw.js` não existem no working tree).

## Plugin e Service Worker
| Item | Valor (fonte) |
|---|---|
| Plugin | `VitePWA` de `vite-plugin-pwa ^1.3.0` (`vite.config.ts`, `package.json`) |
| `registerType` / `strategies` | `prompt` / `generateSW` |
| `includeAssets` | `favicon.svg`, `icon-*.png`, `robots.txt`, `fonts/*.woff2`, `audio_samples/*.mp3` |
| Workbox `globPatterns` | `**/*.{js,css,html,woff2,png,svg}` (mp3 só entra via `includeAssets`) |
| Limite por arquivo | 5 MB (`maximumFileSizeToCacheInBytes`) |
| `skipWaiting` / `clientsClaim` | `true` / `true` (SW novo assume sem confirmação, apesar de `registerType: 'prompt'`) |
| Opção `manifest` do plugin | não definida em `vite.config.ts` (o que o plugin gera nesse caso não foi verificado) |
| Cache em runtime | nenhuma regra `runtimeCaching`; só precache do build |

## Registro duplicado
| Onde | Como |
|---|---|
| `src/main.tsx` | só em produção (`import.meta.env.PROD`): `navigator.serviceWorker.register('/sw.js', {scope:'/'})` no `load`; `registration.update()` a cada 6 h; `updatefound` só loga no console |
| `src/App.tsx` | `registerSW` de `virtual:pwa-register` num `useEffect`: `onNeedRefresh` liga `isUpdateReady`; `onOfflineReady` e `onRegisterError` logam via `logger` |

Os dois registram o mesmo escopo; `/sw.js` é o nome padrão do `generateSW` (não verificado em build). Suspeito: registro redundante.

## Manifest
Arquivo estático `public/manifest.webmanifest`, referenciado em `index.html` (`<link rel="manifest">`), junto de `theme-color #0d0709` e metas `apple-mobile-web-app-*`.
- Campos: `display: standalone`, `orientation: landscape`, `start_url` e `scope` `/`, `shortcuts` (Jogar, Recordes `/?view=records`), `share_target` (`POST /share`).
- Não há rota `/share` em `api/` (só existe `api/log.ts`). Suspeito.

## Ícones e screenshots
| Referenciado no manifest | Existe em `public/` |
|---|---|
| `icon-192.png` | sim |
| `icon-512.png` | sim |
| `icon-512-maskable.png` | sim |
| `icon-192-maskable.png` | não |
| `icon-96.png`, `icon-96-trophy.png` (shortcuts) | não |
| `screenshot-1.png`, `screenshot-2.png` | não |

`public/` também tem `favicon.svg`. `index.html` usa `icon-512.png` como `apple-touch-icon`.

## Banner de instalação e hook
- `src/hooks/usePWA.ts` (`beforeinstallprompt`, `appinstalled`, standalone, iOS, online/offline, fullscreen, dispensa por 3 dias) e `src/components/ui/PWAInstallBanner.tsx` existem.
- Nenhum arquivo, fora testes e eles mesmos, importa `usePWA` ou `PWAInstallBanner` (grep): não estão montados e o banner não aparece.

## Offline
O precache cobre JS, CSS, HTML, fontes, PNG e SVG do build; depois da primeira visita o app deve abrir sem rede. Não verificado: se o áudio de `audio_samples/` e os sprites de `public/assets/` ficam em cache offline, e como o jogo se comporta sem rede. `/api/log` falha em silêncio offline (o logger reenfileira, ver [telemetria e logs](telemetry-and-logging.md)).

## Onde fica no código
`vite.config.ts` (`VitePWA`), `public/manifest.webmanifest`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/virtual-pwa-register.d.ts`, `src/hooks/usePWA.ts`, `src/components/ui/PWAInstallBanner.tsx`.

Relacionados: [telemetria e logs](telemetry-and-logging.md), [persistência](../architecture/persistence.md), [build e deploy](build-and-deploy.md).
