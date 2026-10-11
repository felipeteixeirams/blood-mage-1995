# Padronização de modais secundários, navegação por gamepad e retratos rúnicos

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Classe:** C
**Depende de:** ADR 0001, ADR 0014
**Prioridade:** P2 (sugerida)
**Esforço:** —
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existem `src/components/ui/ModalBase.tsx` (cantoneiras `#b8860b`, `max-h-[92vh]`, blindagem de ponteiro, Esc e `useGamepadUINavigation`), `src/hooks/useGamepadUINavigation.ts`, estilo global de foco em `src/index.css:249` (`[data-gamepad-focused]`, contorno âmbar de 3 px), e `src/components/hud/DialogueModal.tsx` com `getSpeakerInfo` (ícone e paleta por facção) e `drop-shadow` estático. O hook é usado por `ModalBase`, `DialogueModal`, `InventoryModal`, `TalentsModal`, `LevelUpModal` e `GameOverModal`. Faltam: contêiner único para `InventoryModal`/`TalentsModal` (replicam o de `ModalBase` à mão), decisão sobre `HighScoresModal` (cena Phaser), o botão Start no inventário, gamepad durante a digitação do diálogo e o enriquecimento do retrato. Testes de componente dos modais não foram rodados (sem `node_modules`). Não validado em execução.

## Contexto
Modais secundários: [modals-and-screens](../../ui/modals-and-screens.md); gamepad em menus: [input-and-controls](../../ui/input-and-controls.md); HUD e diálogo: [hud](../../ui/hud.md).

Já implementado (não é escopo): blindagem `stopPropagation` + `stopImmediatePropagation` em backdrop, corpo e botão fechar de `ModalBase`, `TalentsModal`, `InventoryModal` e `DialogueModal`; foco visual por `data-gamepad-focused`; B chama `onClose`; A ou Start clicam o elemento focado; `getSpeakerInfo` por palavra-chave (Maelen dourado, Ancião roxo, Mercador âmbar, Guarda cinza, Morte vermelho).

Lacunas:
- `ModalBase` tem só 4 consumidores (`AchievementsModal`, `CodexModal`, `PrestigeModal`, aviso de `App.tsx`). `TalentsModal` repete o contêiner com `border-double` e `#0c0a09`; `InventoryModal` usa `border-2` e `#0f0b09/98`, com as mesmas cantoneiras.
- `HighScoresModal.tsx` só blinda o backdrop e hospeda `RecordsScene` num `Phaser.Game` próprio; a UI em Phaser é tratada em [bug-ui-fora-do-react-e-codigo-morto.md](bug-ui-fora-do-react-e-codigo-morto.md).
- `BestiaryModal.tsx` só repassa a `CodexModal` e não é montado em `src/` fora do próprio arquivo.
- No `InventoryModal` Start age como A (confirmar), não fecha; só B fecha.
- No `DialogueModal` o hook fica inativo durante a digitação (`isActive: node && !isTyping`): o gamepad não pula a digitação nem fecha o diálogo nesse intervalo; Espaço, Enter e clique pulam.
- Retrato: ícone Lucide em caixa com gradiente; sem ornamento forjado, relevo nem animação.

## Objetivo
Os modais secundários compartilham a mesma moldura e a mesma blindagem de toque, o gamepad opera diálogo e inventário de ponta a ponta, e o retrato do interlocutor ganha ornamento e destaque da facção.

## Decisões de que depende
| ADR | Assunto | Status |
|---|---|---|
| [0001](../../decisions/0001-ponte-phaser-react-so-zustand.md) | Ponte Phaser-React só por Zustand (UI só em React) | Proposta |
| [0014](../../decisions/0014-arquivos-intocaveis-e-niveis-de-risco.md) | Nível de risco de arquivos críticos | Proposta |

## Fatos técnicos verificados
| Afirmação | Fonte | Verificado em |
|---|---|---|
| `ModalBase` chama `useGamepadUINavigation` e bloqueia `pointerdown` | `src/components/ui/ModalBase.tsx` | 2026-10-11 |
| Hook usado em 6 componentes (acima) | `grep useGamepadUINavigation src/components` | 2026-10-11 |
| Start e A compartilham a confirmação; só B chama `onClose` | `src/hooks/useGamepadUINavigation.ts` | 2026-10-11 |
| Foco por gamepad já tem contorno e brilho globais | `src/index.css:249-257` | 2026-10-11 |
| `DialogueModal` usa só `focus:border-[#e8c76a]` nos botões; hook ativo só com `!isTyping` | `src/components/hud/DialogueModal.tsx` | 2026-10-11 |
| `InventoryModal` e `TalentsModal` replicam cantoneiras e `max-h-[92vh]` | `InventoryModal.tsx:121-135`, `TalentsModal.tsx:96-99` | 2026-10-11 |
| Botão fechar dos modais tem 36 px (`w-9 h-9`) | `ModalBase.tsx`, `TalentsModal.tsx` | 2026-10-11 |
| `BestiaryModal` sem importadores | `grep BestiaryModal src` | 2026-10-11 |
| Retrato usa `drop-shadow` estático (`speakerInfo.glow`) | `DialogueModal.tsx` | 2026-10-11 |

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 1 | Moldura padrão dos modais (cantoneiras `#b8860b`, fundo `#0c0a09`) | A) usar `ModalBase`; B) manter variações | A: uma fonte única |
| 2 | `InventoryModal` e `TalentsModal` | A) migrar para `ModalBase`; B) manter contêiner próprio | A: remove duplicação; confirmar que o layout largo (`max-w-3xl`) cabe |
| 3 | `HighScoresModal` | A) recriar a lista em React com `ModalBase` (junto do bug de UI fora do React); B) manter a cena Phaser | A, ligado à decisão 2 do bug de UI fora do React |
| 4 | `BestiaryModal` | A) remover (não montado); B) manter wrapper | A: código morto |
| 5 | Botão Start no inventário | A) fecha o modal; B) confirma (comportamento atual) | B: Start igual ao A é o padrão do hook |
| 6 | Gamepad durante a digitação do diálogo | A) A pula a digitação, B fecha; B) só após terminar | A: o toque e o teclado já pulam |
| 7 | Estilo de foco | A) manter o global; B) acrescentar `focus:ring-1 focus:ring-[#b8860b]` | A: o global já destaca; ring duplica |
| 8 | Cor da facção Maelen | A) manter dourado `#e8c76a`; B) carmesim | A: sem motivo registrado para mudar |
| 9 | Ornamento e animação do retrato | A) moldura forjada, relevo e halo de 2 a 3 s; B) manter | A, só com orçamento de performance confirmado |
| 10 | Gate "405+ testes" | A) trocar por "sem regressão"; B) manter o número | A: contagem vira número fixo que envelhece |

## Escopo
- Aplicar as decisões 1 a 4: contêiner único e remoção do que sobrar.
- Gamepad do `DialogueModal` conforme a decisão 6; Start do `InventoryModal` conforme a decisão 5.
- Retrato do `DialogueModal` com ornamento e halo conforme as decisões 8 e 9.
- Alvos de toque dos botões dos modais com no mínimo 44 px se a medição confirmar menos.
- Testes de componente (Vitest) para blindagem e navegação por gamepad dos modais alterados.

## Fora de escopo
- Mudar conteúdo, textos, dados ou balance dos modais; novos modais; i18n.
- Arte própria dos retratos; remapeamento de botões do gamepad em jogo (ver [bug-controles-joysticks-e-gamepad.md](bug-controles-joysticks-e-gamepad.md)).

## Arquivos e contratos
- Alterar: `src/components/InventoryModal.tsx`, `src/components/TalentsModal.tsx`, `src/components/HighScoresModal.tsx` (se decisão 3 = A), `src/components/hud/DialogueModal.tsx`, `src/hooks/useGamepadUINavigation.ts` (só se necessário para a decisão 6), `src/components/ui/ModalBase.tsx` (props de largura, se a decisão 2 = A).
- Remover: `src/components/BestiaryModal.tsx` (decisão 4 = A).
- Atualizar no mesmo commit: `docs/ui/modals-and-screens.md`, `docs/ui/hud.md`, `docs/ui/input-and-controls.md` e `Verificado em`.
- Não tocar: `GameScene.ts`, `gameStore.ts` (sem mudança de estado), `RecordsScene.ts` salvo decisão 3.
- Contrato: todo modal em React chama `e.stopPropagation()` e `e.nativeEvent.stopImmediatePropagation()` em `onPointerDown` (regra do projeto).

## Critérios de aceite
- **MG-1** Quando um modal secundário é renderizado, o modal deve usar a moldura de `ModalBase` (provisório).
- **MG-2** Quando o jogador toca ou clica em qualquer região de um modal, o modal não deve propagar o `pointerdown` ao canvas do Phaser.
- **MG-3** Enquanto um modal com `useGamepadUINavigation` está aberto, o hook deve mover o foco com D-Pad e analógico esquerdo e marcar o elemento com `data-gamepad-focused`.
- **MG-4** Quando o botão B é pressionado com um modal aberto, o modal deve chamar `onClose`.
- **MG-5** Quando o botão Start é pressionado no `InventoryModal`, o modal deve confirmar o elemento focado (provisório).
- **MG-6** Quando o botão A é pressionado durante a digitação do `DialogueModal`, o diálogo deve exibir o texto completo (provisório).
- **MG-7** Quando o botão B é pressionado durante a digitação do `DialogueModal`, o diálogo deve fechar (provisório).
- **MG-8** Enquanto o `DialogueModal` mostra um interlocutor, o retrato deve usar a paleta e o ícone da facção do `getSpeakerInfo`.
- **MG-9** Enquanto o `DialogueModal` mostra um interlocutor, o retrato deve exibir o ornamento e o halo animado definidos na decisão 9 (provisório).
- **MG-10** Se nenhum gamepad está conectado, então o `useGamepadUINavigation` não deve lançar exceção nem alterar o foco.
- **MG-11** Se `navigator.getGamepads` não existe, então o `useGamepadUINavigation` não deve lançar exceção.

## Plano de verificação
| Critério | Como verificar |
|---|---|
| MG-1 | teste de componente (Vitest + Testing Library) por modal: presença das cantoneiras; revisão visual manual |
| MG-2 | teste de componente: `pointerdown` com spy em `stopImmediatePropagation`; manual: tocar no modal em jogo não dispara projétil |
| MG-3, MG-4, MG-10, MG-11 | teste unitário do hook com `navigator.getGamepads` simulado, novo `src/hooks/useGamepadUINavigation.test.tsx` |
| MG-5 a MG-7 | teste de componente com gamepad simulado; manual com gamepad físico |
| MG-8 | teste de `getSpeakerInfo` por nome |
| MG-9 | não validado: precisa de playtest humano (aparência e custo de animação) |

## Questões em aberto
- Decisões 1 a 10 sem resposta.
- O layout largo de Inventário e Talentos cabe em `ModalBase` (`max-w-2xl`)? Não verificado.
- Medida real dos alvos de toque nos botões dos modais (44 px): não conferida; o botão fechar tem 36 px.
- Valores do halo (duração, intensidade) e do ornamento: a definir pelo responsável.
- Contagem atual de testes: não executada.

## Pendências para promover a backlog
- Aprovação do responsável; ADRs 0001 e 0014 Aprovados.
- Decisões 1 a 10 respondidas; questões em aberto fechadas; critérios MG-1, MG-5 a MG-7 e MG-9 sem a marca (provisório).
- Ordem frente ao [bug-ui-fora-do-react-e-codigo-morto.md](bug-ui-fora-do-react-e-codigo-morto.md) (decisão 3).
- Rodar `pnpm run test` para registrar o baseline de testes.

## Referências
- [modals-and-screens](../../ui/modals-and-screens.md), [input-and-controls](../../ui/input-and-controls.md), [hud](../../ui/hud.md), [accessibility](../../ui/accessibility.md)
- [bug-ui-fora-do-react-e-codigo-morto.md](bug-ui-fora-do-react-e-codigo-morto.md), [bug-controles-joysticks-e-gamepad.md](bug-controles-joysticks-e-gamepad.md)
