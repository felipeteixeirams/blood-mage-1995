# Superfícies de Distribuição

**Mestre:** [product](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10

Descreve o que existe no repositório hoje. Detalhes de build e deploy: [operations](../operations/README.md). Estratégia de lançamento não está ratificada.

## PWA (existe)

- `vite.config.ts`: `VitePWA` com `registerType: 'prompt'`, `strategies: 'generateSW'`, cache de `js,css,html,woff2,png,svg`, limite de 5 MB por arquivo, `skipWaiting` e `clientsClaim`.
- `public/manifest.webmanifest`: `display: standalone`, `orientation: landscape`, `start_url: /`, ícones, atalhos ("Iniciar Partida", "Salão dos Recordes" em `/?view=records`) e `share_target` apontando para `/share`.
- Registro do service worker em dois pontos: `src/main.tsx` (registra `/sw.js` em produção, checa update a cada 6 h) e `src/App.tsx` (`registerSW` de `virtual:pwa-register`; mostra aviso de atualização).
- Divergências encontradas:
  - O manifest referencia arquivos ausentes em `public/`: `icon-192-maskable.png`, `icon-96.png`, `icon-96-trophy.png`, `screenshot-1.png`, `screenshot-2.png` (presentes: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`).
  - Nenhuma rota `/share` existe em `src/`, e nenhum código de `src/` lê o parâmetro `?view=records` do atalho "Salão dos Recordes".
  - `PWAInstallBanner.tsx` e `usePWA.ts` existem, mas o componente não é montado em nenhum lugar de `src/`: o banner de instalação não aparece.

## Play Store / TWA (só script)

`scripts/build-twa.sh` existe e usa Bubblewrap, mas o repositório não tem `twa-manifest.json` (o script cria um padrão com placeholder de fingerprint). Nada foi publicado que o repositório comprove.

## Steam / Electron (só script)

`scripts/build-steam.sh` existe, mas o repositório não tem `electron-builder.yml`, `main.js` nem dependência `electron` (o script instala e cria um padrão). O `main.js` que o padrão lista não existe.

## Intenção (não ratificada)

Lançar primeiro como link PWA, depois TWA/Play Store e Steam; política de privacidade, formulário Data Safety, classificação etária, preço. Não há decisão registrada; não existe política de privacidade no código.

## Não verificado

- Funcionamento real dos scripts de TWA e Steam (não executados).
- Se o jogo está publicado em alguma loja.
