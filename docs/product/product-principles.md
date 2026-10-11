# Princípios Mobile-First

**Mestre:** [product](README.md)
**Status:** verificado (somente a seção "O que o código faz hoje"; princípios e metas: não verificado)
**Verificado em:** 2026-10-11 (só a seção "O que o código faz hoje")

Este documento separa o que o código faz hoje (fato) do que seriam princípios ou metas de produto. Os princípios e metas **não têm fonte ratificada** no repositório: não são regra nem critério de aprovação de features. O ADR [0012](../decisions/0012-monetizacao-preco-e-metas-de-retencao.md) (aprovado) adotou "sem metas de retenção definidas por ora"; o ADR [0013](../decisions/0013-metas-de-performance.md) (metas de performance) está como Proposta, sem decisão.

## O que o código faz hoje (verificado em 2026-10-11)

| Tema | O que existe | Evidência |
|---|---|---|
| Orientação paisagem | manifest com `"orientation": "landscape"`; `tryLockLandscape()` é chamado em `SplashScreen.tsx` e `usePWA.ts` (falha sem bloquear); `RotateDeviceOverlay` renderizado em `App.tsx` | `public/manifest.webmanifest`, `src/utils/orientation.ts` |
| Joystick flutuante, canhoto, escala | opções `floatingStick`, `leftHandedMode`, `virtualStickScale` (`small`/`medium`/`large`) | `src/types/game.ts:265-267`; ver [accessibility.md](../ui/accessibility.md) |
| Safe-area | classes `.safe-area-top/-bottom/-left...` com `env(safe-area-inset-*)` | `src/index.css:69+` |
| Offline | PWA via `vite-plugin-pwa` (`registerType: 'prompt'`), Workbox com `globPatterns` de js/css/html/woff2/png/svg | `vite.config.ts:13-30`; ver [release-strategy.md](release-strategy.md) |
| Dados validados | Zod com safe-parse em `src/utils/localStorage.ts` | [account-and-data.md](account-and-data.md) |
| Hit-stop | 40 ms; 80 ms em habilidade especial | `src/game/systems/CombatFeel.ts:66` |
| Vibração | `navigator.vibrate` via `src/utils/haptics.ts` | [roadmap.md](roadmap.md) |
| Lazy-load | `PhaserGame`, `GameplayHUD` e modais carregados com `lazy()`; chunk `phaser` separado de `vendor` | `src/App.tsx:17-21`, `vite.config.ts:49-53` |
| Pooling | `ObjectPool` usado por `Projectile` e `GameScene` | `src/game/systems/ObjectPool.ts` |
| Regra do projeto | "alvo de 60 FPS, inclusive em mobile/touch" é diretriz do `CLAUDE.md`; sem medição registrada (ver ADR 0013) | `CLAUDE.md` |

## Não encontrado no código (busca de 2026-10-11)

| Item antes citado | Resultado |
|---|---|
| Pausar ao perder foco do app | Não há pausa. O único listener de `visibilitychange` é o do logger, que apenas envia o log ao ocultar (`src/utils/logger.ts:290`) |
| Alvo de toque mínimo de 48 px | Não há regra nem constante; botões usam classes Tailwind variadas (ex.: `w-12 h-12` = 48 px em `SkillsOverlay.tsx`, mas não como padrão) |
| Salvar ao fim de cada sala/andar | Não confirmado: há persistência em `gameStore.ts`/`localStorage.ts`, mas não foi verificado o gatilho por sala |
| Medição de FPS/bundle | `PerformanceMonitor` só com `?perf`; sem valores registrados (ADR 0013) |

## Princípios e metas propostos (não verificado — decisão do responsável)

Herdados de documento antigo. Sem fonte no repositório e sem ratificação; listados só para o responsável decidir (ver "Pendências de decisão" em [README.md](README.md)):

- Tempo até jogar < 10 s; loop de combate legível em ~5 s; no máximo 2-3 decisões simultâneas.
- Alvos de toque >= 48 px; controles na zona do polegar em paisagem.
- 60 FPS em aparelhos de entrada; bundle < 2,5 MB.
- Pausar e salvar ao perder foco; salvar ao fim de cada sala/andar.
- Retenção (D1/D7/D30), duração de sessão, taxa de crash: benchmarks externos, sem medição (ADR 0012: sem metas por ora).
- Filtro de 5 perguntas (KPI, simplicidade, ergonomia, performance, ROI) para aprovar features (ADR 0012, opção D, não adotada).

Público-alvo e posicionamento não aparecem em nenhuma fonte do repositório (não verificado).
