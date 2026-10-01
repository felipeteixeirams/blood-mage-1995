---
agent_context: frontend, backend
target_module: src/types/game.ts
priority: high
status: active
last_updated: 2026-08-09
tags: [reference, types]
---
# 🔑 Principais Tipos de Dados (Types TypeScript)

Todos os tipos críticos de dados que coordenam a lógica de jogo estão especificados e documentados sob o arquivo central `src/types/game.ts`.

## ⚙️ Tipos Principais
- **PlayerStats**: Mantém toda a saúde do jogador, mana, nível, cristais, KO counts, statusConditions, curativas, e corpse retrieval state.
- **HighScoreRecord**: Define as propriedades salvas ao término de uma run (score, kills, wave, timeSurvived, levelReached, etc.).
- **GameSettings**: Modos de controle, volume do sintetizador de áudio, filtro CRT, minimap alpha e visibilidade, screen shake.
- **MonsterConfig**: Configurações procedurais dos monstros de cada bioma.
