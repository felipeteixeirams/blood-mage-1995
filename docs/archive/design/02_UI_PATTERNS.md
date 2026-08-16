---
agent_context: frontend, game designer
target_module: artifacts/bloodmage/src/components
priority: high
status: active
last_updated: 2026-08-09
tags: [design, ui]
---
# 🖼️ Padrões de Interface de Usuário (UI Patterns)

Todas as telas e modais em React 19 no Bloodmage 1995 seguem um conjunto estrito de regras de composição que preservam a imersão na atmosfera gótica.

## 📐 Diretrizes de Composição de UI
- **Tipografia**: Uso restrito de fontes clássicas off-line (`Cinzel`, `Press Start 2P`, `VT323`, `UnifrakturMaguntia`) pré-carregadas.
- **Bordas**: Molduras espessas, rústicas e texturizadas com contornos dourados (`border-2 border-[#b8860b]/40`) combinadas com fundos escuros semi-transparentes (`bg-[#171309]/95`).
- **Animações de Transição**: Efeitos sutis e góticos de fade-in e escala baseados em Framer Motion, evitando layouts estáticos abruptos.
