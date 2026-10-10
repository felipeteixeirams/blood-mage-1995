# Critical — Documento Mestre

**Contexto:** Referência de cautela: arquivos de código com maior risco de regressão, otimizações de performance que o código aplica e superfície de segurança. Descreve o código como ele é hoje, não regras de negócio.
**Leia quando:** For alterar `Player.ts`, `Enemy.ts`, `GameScene.ts`, `DungeonGenerator.ts`, `gameStore.ts`, `localStorage.ts` ou `PhaserGame.tsx`; mexer em raycast/AI por frame; ou mudar CSP, logs e persistência.

## Satélites

| Documento | Conteúdo | Status |
|---|---|---|
| [critical-files](critical-files.md) | Arquivos sensíveis por nível de risco, com o contrato atual de cada um | verificado |
| [performance-optimization](performance-optimization.md) | Técnicas de performance presentes no código e suas exceções | verificado |
| [performance-metrics](performance-metrics.md) | O que o código mede (sem metas numéricas medidas) | verificado |
| [security](security.md) | Cabeçalhos/CSP do `vercel.json`, telemetria, persistência e segredos | verificado |

Testes e pre-commit: [testing](../testing/README.md).
