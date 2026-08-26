---
agent_context: frontend, backend
target_module: src
priority: high
status: complete
last_updated: 2026-08-09
tags: [gameplay, records]
---
# 🏆 Salão de Recordes e Persistência

Para manter a competitividade e o registro histórico das melhores partidas (runs), o jogo conta com um Salão de Recordes unificado e persistente.

## ⚙️ Funcionamento
- **Persistência Local**: Runs completadas ou que resultaram em morte gravam um registro detalhado de pontuação, kills totais, nível alcançado, ondas sobrevividas e tempo de sobrevivência no `localStorage`.
- **Golden Trophy**: Botão dourado central na tela de menu que serve como a única entrada limpa para exibir a tabela de High Scores, prevenindo botões redundantes.
- **Zod Array validation**: Todas as runs gravadas passam por validação de array estrita do Zod para evitar corrupção.
