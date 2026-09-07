---
agent_context: product, frontend
target_module: src/components, src/types/game.ts, src/store/gameStore.ts
priority: media
status: active
last_updated: 2026-09-06
tags: [product, acessibilidade, ux, toggles]
---

# ♿ Acessibilidade — Estado Real e Escopo

> **Gap identificado na auditoria de 2026-09-06** (ver
> `docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md`): só existia
> `docs/archive/design/03_ACCESSIBILITY.md`, arquivado, sem substituto
> ativo — ninguém sabia, sem ler o código, o que de acessibilidade já
> existe hoje. Este documento lista o que é REAL no código atual, não uma
> proposta.

## O que já existe hoje (confirmado no código)

### Ajustes de ergonomia/sensorial (`src/types/game.ts`, `src/store/gameStore.ts`)
- **`fearDistortionEnabled`** — desliga o pulso de distorção visual de tela
  (`PostFXSystem.triggerFearDistortion()`) ao encarar Bosses/Elites.
  Existe especificamente por risco de fotossensibilidade/enjoo.
- **`highContrastDamageTexts`** — modo de alto contraste pros números de
  dano flutuantes.
- **`leftHandedMode`** — inverte a posição do joystick/controles pra
  destros vs canhotos.
- **Escala de joystick (S/M/L)** — tamanho do controle virtual ajustável
  (`GameplayHUD.tsx`).
- **Toggle de intensidade de conteúdo (gore)** — ver
  `docs/specs/backlog/15_TOGGLE_INTENSIDADE_CONTEUDO_CLASSIFICACAO.md`
  (proposta formal, checar status real antes de assumir implementado).

### Ergonomia de tela (`src/index.css`)
- **Safe-area-insets** (`env(safe-area-inset-*)`) aplicados em HUD/menus —
  compatibilidade com notch/ilha dinâmica em iOS e Android.

### Fora do escopo atual (não confundir com "esquecido")
Daltonismo (paletas alternativas), leitor de tela, navegação 100% por
teclado, e legendas de áudio **não têm nenhuma implementação hoje**. Isso
não está documentado em nenhum lugar como "decisão consciente de
despriorizar" — é simplesmente um gap real. Se isso vira prioridade,
comece por:
1. Confirmar com Felipe se entra no roadmap (ver
   `docs/product/ROADMAP.md`) antes de implementar.
2. Paleta alternativa pra daltonismo é a peça mais barata (o jogo já usa
   tints/paletas centralizadas via `textureGenerator.ts` e
   `PostFXSystem.setBiome()` — um modo alternativo é troca de paleta, não
   sistema novo).

## Convenção pra novos toggles de acessibilidade

Siga o padrão já estabelecido: campo booleano opcional em
`PlayerSettings`/stats relevante (`src/types/game.ts`), persistido via
`localStorage.ts` (Zod `safeParse` + default seguro — ver
`docs/critical/01_CRITICAL_FILES.md`, seção `gameStore.ts`), exposto no
`SettingsModal`. Nunca gate uma mecânica de gameplay central atrás de um
toggle de acessibilidade sem testar as duas variantes.
