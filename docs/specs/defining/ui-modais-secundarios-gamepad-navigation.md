# Spec 25 — Padronização de Modais Secundários, Navegação Gamepad & Retratos Rúnicos

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10: parcial. Fase 1: `BestiaryModal.tsx` é só um wrapper de `CodexModal.tsx`; `CodexModal.tsx` e `AchievementsModal.tsx` usam `ui/ModalBase.tsx` (cantoneiras `#b8860b`, `max-h-[92vh] overflow-y-auto`, `stopPropagation` + `stopImmediatePropagation` no backdrop, no corpo e no botão fechar); `TalentsModal.tsx` replica o mesmo contêiner à mão (cantoneiras, `max-h-[92vh]`, blindagem); `HighScoresModal.tsx` só blinda o backdrop e renderiza uma `RecordsScene` Phaser (`Phaser.Game` próprio), sem cantoneiras DOM nem paleta de modal. Fase 2: `useGamepadUINavigation` está integrado em `ModalBase` (todos os modais que o usam), `hud/DialogueModal.tsx` e `InventoryModal.tsx` (com `onClose`); não há estilos `focus:ring-1 focus:ring-[#b8860b]` em nenhum dos dois (`DialogueModal` usa `focus:border-[#e8c76a]`; o hook marca `data-gamepad-focused`). Fase 3: `DialogueModal.tsx` tem `getSpeakerInfo` com paleta e ícone Lucide por facção (Maelen dourado, Ancião roxo, Mercador âmbar, Guarda cinza, Morte vermelho) e `drop-shadow` estático; faltam ornamentos forjados/relevo no retrato e o efeito de respiração/halo animado. Não verificado: a meta de 405+ testes (não executada; `pnpm test` não foi rodado, sem `node_modules`).

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Paleta e ornamentos (cantoneiras `#b8860b`, fundos `#0f0b09`/`#120a0e`) como padrão visual dos modais.
2. Escopo: quais modais recebem navegação por gamepad (`DialogueModal`, `InventoryModal`) e o comportamento dos botões A/B/Start.
3. Cores de facção dos retratos (Maelen carmesim, Ancião roxo, Sentinela aço, Mercador ouro).
4. Meta de "405+ testes" como gate de aceite.

---

## 1. Objetivo (proposta)

Padronizar visual e blindagem de ponteiro dos modais secundários, estender a navegação por gamepad ao diálogo e ao inventário e enriquecer o retrato do interlocutor, com coerência gótica (cantoneiras `#b8860b`, fundos `#0f0b09`/`#120a0e`) e nenhum vazamento de toque para o canvas do Phaser.

## 2. Pendências por fase

### Fase 1: modais secundários
- `HighScoresModal.tsx`: decidir se recebe contêiner DOM com cantoneiras e paleta (hoje o conteúdo é uma cena Phaser).
- `BestiaryModal.tsx` depende de `CodexModal.tsx`; avaliar se continua wrapper.
- Conferir alvos de toque mínimos de 40-44px nos botões dos modais (não verificado).

### Fase 2: gamepad
- Estilos de foco `focus:border-[#e8c76a] focus:ring-1 focus:ring-[#b8860b]` em `DialogueModal.tsx` e `InventoryModal.tsx` (hoje só `focus:border-[#e8c76a]` no diálogo).
- Definir o botão Start no `InventoryModal.tsx`: a proposta original fecha o modal com Start, mas `useGamepadUINavigation.ts` trata Start como confirmar (igual ao A) e só o B chama `onClose`.

### Fase 3: retratos no `DialogueModal.tsx`
- Ornamentos góticos forjados e relevo no contêiner do retrato.
- Brasões de facção mais ricos que o ícone Lucide atual.
- Efeito sutil de respiração/halo místico no retrato ativo (hoje `drop-shadow` estático).
- Proposta a confirmar: Maelen em carmesim (código usa dourado `#e8c76a`).

## 3. Critérios de aceite (provisórios)

Sem aprovação do responsável; critérios EARS a escrever. Gates propostos: `pnpm run typecheck` e `pnpm test` sem regressão (a meta numérica "405+ testes" é proposta e depende de contagem atual); nenhum clique/toque nos modais dispara projétil ou movimento no canvas; foco visual e seleção por gamepad sem erros de console (validação manual com gamepad).
