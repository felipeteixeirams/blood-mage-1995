# Princípios Mobile-First

**Mestre:** [product](README.md)
**Status:** não verificado
**Verificado em:** —

Os princípios e metas abaixo são propostas de um documento antigo. Nunca foram ratificados pelo responsável; não são regra nem critério de aprovação de features.

## O que o código já faz (verificado por leitura estática)

| Tema | Código | Evidência |
|---|---|---|
| Orientação paisagem | manifest `landscape`; `tryLockLandscape()`; overlay de rotação | `public/manifest.webmanifest`, `src/utils/orientation.ts`, `RotateDeviceOverlay` em `App.tsx` |
| Joystick flutuante, canhoto, escala | `floatingStick`, `leftHandedMode`, `virtualStickScale` | ver [accessibility.md](../ui/accessibility.md) |
| Safe-area | classes `.safe-area-*` | `src/index.css` |
| Offline | service worker com cache de assets | ver [release-strategy.md](release-strategy.md) |
| Dados validados | Zod em `src/utils/localStorage.ts` | [account-and-data.md](account-and-data.md) |
| Hit-stop, shake, vibração | 40/80 ms, `navigator.vibrate` | [roadmap.md](roadmap.md) |
| Lazy-load do Phaser | `App.tsx` carrega `PhaserGame` sob demanda; chunk `phaser` separado | `vite.config.ts` (`manualChunks`) |
| Pooling | ver [architecture](../architecture/README.md) | — |

## Intenção (não ratificada)

Propostas do documento antigo, sem decisão registrada:

- Tempo até jogar < 10 s; loop de combate legível em ~5 s; no máximo 2-3 decisões simultâneas.
- Alvos de toque >= 48 px; controles na zona do polegar em paisagem.
- 60 FPS em aparelhos de entrada; bundle < 2.5 MB.
- Pausar e salvar ao perder foco do app; salvar ao fim de cada sala/andar.
- Metas de retenção (D1/D7/D30), duração de sessão e taxa de crash: benchmarks externos, sem medição no projeto.
- Filtro de 5 perguntas (KPI, simplicidade, ergonomia, performance, ROI) para aprovar features.

## Não verificado

- Todas as metas acima (nenhuma foi medida).
- Se há alvos de toque de 48 px, pausa ao perder foco e salvamento por sala (não conferidos no código).
