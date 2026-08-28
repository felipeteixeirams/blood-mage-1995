# Spec 15: PWA e Offline-First (Standalone Experience)

## Objetivo Geral
Transformar o Blood Mage 1995 em um Progressive Web App (PWA) instalável, focado em rodar perfeitamente sem conexão com a internet (Offline-First), permitindo que o jogo atue como um aplicativo nativo no PC e Mobile.

---

## 1. Implementação PWA & Manifest (Vite-Plugin-PWA)

### 1.1 Configuração Vite e Service Worker
- **Integração `vite-plugin-pwa`:** 
  - Estruturação do `manifest.json` direto no `vite.config.ts`.
  - Configuração do Service Worker (`registerType: 'autoUpdate'`).
- **Tema e Display:**
  - `display: 'fullscreen'` e `orientation: 'landscape'` para garantir imersão máxima em dispositivos móveis.
  - Cores de fundo e barra de status atreladas ao estilo Gótico (`#0c0a09`).

### 1.2 Cache de Assets Físicos (Offline-First)
- **Workbox Caching:**
  - Garantir que todos os recursos binários estáticos (`.mp3`, `.png`, `.jpg`, `.woff2`) sejam cacheados durante o primeiro carregamento ou em background.
  - O jogador, ao perder a rede, poderá abrir e jogar a campanha sem telas de erro de rede, usando 100% de persistência via LocalStorage (`Zod` schema seguro, já implementado) e cache de SW.

### 1.3 Ícones e Splash Screen
- **PWA Icons:**
  - Inserção (ou geração via script/placeholder temporário caso os físicos não existam) de ícones 192x192 e 512x512 para PWA (ícone de App no Android/iOS).
  - Ícone mascarável (`purpose: any maskable`) para integração nativa correta.

---

## 2. Aprimoramento UI Standalone (Sem Browser Chrome)

- Ajuste no container root para garantir `user-select: none`, `touch-action: none` global para que o usuário não selecione texto sem querer ao dar double tap para esquivar em telas *fullscreen*.

---

## 📈 Histórico de Progresso (Changelog)

- **[2026-08-27] Frente 1 e 2 - Arquitetura PWA Base:**
  - Status: **EM ANDAMENTO**.
  - Inserido e configurado `vite-plugin-pwa` via bun, aplicando o manifest no Vite config.
