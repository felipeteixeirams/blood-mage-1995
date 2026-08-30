---
agent_context: technical_specification_pwa_offline_ready
target_module: docs/specs/15_PWA_AND_OFFLINE_READY.md
priority: high
status: implemented
last_updated: "2026-08-30"
tags:
  - pwa
  - offline_first
  - service_worker
  - workbox
  - standalone
  - mobile_ready
---

# 📜 Spec 15: PWA e Offline-First (Standalone Experience)

> **Status:** Implementado & Concluído  
> **Data:** 30 de Agosto de 2026  
> **Domínio:** Infraestrutura Mobile, Standalone PWA, Resiliência Offline e Cache.

## Objetivo Geral
Transformar o *Blood Mage 1995* em um Progressive Web App (PWA) instalável, focado em rodar perfeitamente sem conexão com a internet (Offline-First), permitindo que o jogo atue como um aplicativo nativo no PC e Mobile.

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
  - Inserção de ícones 192x192 e 512x512 para PWA (ícone de App no Android/iOS).
  - Ícone mascarável (`purpose: any maskable`) para integração nativa correta.

---

## 2. Aprimoramento UI Standalone (Sem Browser Chrome)

- Hook React `usePWA.ts` para detectar prontidão de instalação (`beforeinstallprompt`) e gerenciar estado offline/online.
- Componente `PWAInstallPrompt.tsx` com banner de instalação com 1 toque, respeitando o tema gótico.
- Indicador visual `OfflineIndicator.tsx` discreto informando o jogador que a sessão está salva localmente e offline-ready.
- Ajuste no container root para garantir `user-select: none`, `touch-action: none` global para evitar seleção involuntária de texto em toques rápidos no mobile.

---

## 📈 3. Histórico de Progresso & Status de Entrega

- [x] **Manifest e Service Worker**: Configurados via `vite-plugin-pwa` com suporte a `display: fullscreen` e `orientation: landscape`.
- [x] **Cache Workbox de Assets**: Configurado com auto-update de assets e fontes locais.
- [x] **Hook `usePWA` & Banner de Instalação**: Implementados e testados com `src/hooks/usePWA.test.ts`.
- [x] **Indicador Offline**: Exibição sutil de badge offline na interface React.
- [x] **Testes Unitários**: 4/4 testes passando com 100% de sucesso.
