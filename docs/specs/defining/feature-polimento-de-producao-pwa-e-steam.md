# Fase 5: Polimento de Produção, Empacotamento Nativo (Play Store & Steam)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática). Existem: `ObjectPool.ts`, `ViewportCuller.ts`, `PerformanceMonitor.ts`, `InputManager.ts` (Gamepad API; listeners em `src/App.tsx`), `src/utils/haptics.ts`, PWA (`vite-plugin-pwa` em `vite.config.ts`, `public/manifest.webmanifest`, registro em `src/main.tsx` e `src/App.tsx`), `scripts/build-pwa.sh`, `scripts/build-twa.sh`, `scripts/build-steam.sh`, `AdvancedParticles.ts`, `ScreenShake.ts`, `ScreenEffects.ts`, `AchievementSystem.ts` (16 conquistas em `src/data/achievements.json`) e i18n com `pt-BR` e `en-US` (`src/i18n/`, tipo `Language` em `src/types/game.ts`). Falta: idioma espanhol (`Language` só lista `pt-BR | en-US`); Cloud Save (`grep -rniE "firebase|firestore|supabase" src package.json` sem resultados; ver [feature-cloud-save.md](feature-cloud-save.md)); Electron e TWA efetivos (`electron` não está em `package.json`, `build-steam.sh` instala sob demanda; `build-twa.sh` exige Bubblewrap e `twa-manifest.json`, que não existe no repositório).

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Alvos de empacotamento: Google Play (TWA) e Steam (Electron/web wrapper).
2. Idiomas além de pt-BR e en-US (espanhol) e Cloud Save.
3. Conjunto de conquistas e recompensas (o código tem 16; a versão anterior desta spec dizia 10).

---

## Pendente

- Idioma espanhol na interface.
- Cloud Save multiplataforma (spec própria: [feature-cloud-save.md](feature-cloud-save.md)).
- Empacotamento efetivo para Play Store (TWA) e Steam (Electron): os scripts existem, mas não há projeto Electron nem `twa-manifest.json`.
- Critérios de aceite: a definir (spec ainda sem EARS).
