# Specs — Backlog (prontas para implementar)

Specs com escopo definido e **aprovadas pelo responsável**, prontas para serem pegas por qualquer modelo (ver [Definition of Ready](../ears.md)). Ao iniciar a implementação, mova para [`../in-progress/`](../in-progress/README.md).

| Spec | Resumo |
|---|---|
| [Bug: dano por contato passivo de inimigos](bug-dano-por-contato-passivo.md) | O overlay jogador×inimigos causa 40% do dano e status por contato, contra a regra de ataque só via FSM telegrafada; proposta de remover. |
| [Reset de opções pela SettingsScene e lacunas de opções (bug)](bug-settingsscene-restaurar-e-opcoes.md) | RESTAURAR não restaura `defaultSettings` (14 campos, volumes e opacidade diferentes, omite `language` e outros), `floatingStick` com padrões conflitantes, sliders gravam a cada `pointermove`; opções sem UI, idioma binário e chaves i18n mortas. |

Visão geral e ciclo de vida: [specs](../README.md).
