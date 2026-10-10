# `[UNHANDLED_REJECTION] {"reason": {}}` sem causa no log

**Mestre:** [troubleshooting](README.md)
**Verificado em:** 2026-10-10
**Evidência da solução:** `src/utils/logger.ts` (`window.onunhandledrejection`), `src/main.tsx`, `noAudio: true` em `PhaserGame.tsx`, `MainMenu.tsx`, `SettingsModal.tsx`, `HighScoresModal.tsx`

## Sintoma
O logger registra `Unhandled Promise Rejection` com `"reason": {}`, escondendo o erro real.

## Causa raiz
`name`, `message` e `stack` de `Error` e `DOMException` não são enumeráveis; `JSON.stringify({ reason: err })` produz `{"reason":{}}`. Reproduzido em 2026-10-10 com `new Error("x")` e `new DOMException("n","NotAllowedError")` em Node.

## Solução
- `logger.ts`: o handler de `onunhandledrejection` extrai `name`, `message`, `stack`, `code` e as propriedades próprias (inclui `Object.getOwnPropertyNames`) antes de logar, e rebaixa a `debug` rejeições benignas (`The play() request was interrupted`, `ResizeObserver loop`, restrição de autoplay).
- Proteções complementares contra rejeições de autoplay (o vínculo causal de cada uma não foi reproduzido isoladamente): `.catch` em `AudioContext.prototype.resume` e `HTMLMediaElement.prototype.play` (`src/main.tsx`); `audio: { noAudio: true }` nas instâncias de `Phaser.Game`, pois o som usa `src/utils/soundEngine.ts`; `onRegisterError` no `registerSW` (`src/App.tsx`).

## Como verificar
Manual, no console do app em dev: `Promise.reject(new Error('teste'))`. O log deve trazer `reason.message` e `reason.stack`, nunca `{}`. Não há teste automatizado para o handler (`logger.test.ts` cobre só `logger.error`).
