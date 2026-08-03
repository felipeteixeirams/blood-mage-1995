---
node_type: Master
parent_node: /AGENTS.md
domain: Engineering Rules, UX/Juice & Performance
token_weight: Medium (~700 tokens)
satellites:
  - /docs/satellites/ROADMAP.md
---

# 🛡️ Master: Engineering & UX Best Practices

Este documento consolida as melhores práticas de desenvolvimento, design de interface e otimização para o **Bloodmage 1995**.

---

## 1. Separação Estrita de Responsabilidades

- **Engine (Phaser 3)**: Exclusiva para loop de física, renderização de canvas e lógica espacial (`src/game`).
- **UI (React + Tailwind)**: Exclusiva para menus, HUD e modais (`src/components`).
- **Dados & Configurações**: Constantes de balanceamento e dados de inimigos/magias ficam em arquivos dedicados em `src/types/` e `src/game/data/`.

---

## 2. Metodologia Spec-Driven

Antes de codificar qualquer alteração de média ou alta complexidade:
1. Registre ou consulte a especificação funcional em `/docs/SPEC.md` ou satélites em `/docs/satellites/`.
2. Garanta que os tipos e contratos TypeScript em `src/types/` foram validados antes da implementação do código funcional.

---

## 3. UI/UX, Juice & Sensação de Impacto

- **Feedback Imediato (Juice)**: Cada dano recebido ou causado deve emitir feedback visual (*Screen Shake*, *Flash Vermelho*, *Textos Flutuantes de Dano*).
- **Desempenho de Animação**: Animações de UI e overlays usam `motion/react`, mantendo o canvas Phaser desobstruído.
- **Hierarquia Tipográfica**: Fontes góticas e pixeladas com contraste WCAG adequado em overlays.

---

## 4. Deploy, PWA & Otimização de Performance

- **Build Limpo**: Certifique-se de que `npm run build` e `npm run lint` passem sem erros de TypeScript.
- **Assets Procedurais**: Mantenha a dependência de assets zerada para que o bundle permaneça ultraleve (<2MB) em deploys na Vercel/PWA.
- **Otimização Touch**: Joysticks virtuais otimizados para evitar gestos acidentais do sistema operacional mobile.

---

## 🔗 Satélites Relacionados
- **Roadmap & Evolução do Projeto**: `/docs/satellites/ROADMAP.md`
