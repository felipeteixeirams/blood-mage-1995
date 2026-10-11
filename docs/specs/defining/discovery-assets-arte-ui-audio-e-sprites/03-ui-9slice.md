# Assets de arte, UI, áudio e sprites: UI React com 9-slice (parte 3)

**Mestre:** [discovery-assets-arte-ui-audio-e-sprites](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Origem:** consolidada de discovery-ui-e-assets-externos, parte 2 (2026-10-11)
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: HUD e modais em React sobre o canvas Phaser; `border-image` com SVG inline só em `src/components/hud/DialogueModal.tsx` (`borderImageSlice: '20 fill'`, `round`); classes `.gothic-border`, `.blood-border`, `.gold-gothic-border` com `border` sólido e `.font-cinzel` em `src/index.css`; `ui-corner.png`, `ui-plaque.png`, `stone-tile.jpg` em `src/assets/ui/` e `public/assets/ui/`, usadas só por `SettingsScene.ts` e `RecordsScene.ts` (menus em Phaser); `InventoryModal.tsx` já usa `image-rendering: pixelated`. Falta: classe `.gothic-panel`, `gothic_border_slice.png`, `gold_runic_border.png`, `.gothic-button-active`, slices de arte para os modais.

Parte 3 de 6. Índice: [README](README.md).

## Contexto
Decisão 6 abaixo: modais e HUD ficam em React (regra do projeto: UI só em React; o original dizia "HUD no Phaser", o que contradiz o `CLAUDE.md`). Paleta e tipografia: [parte 1](01-visao-e-direcao-artistica.md).

## Objetivo
Se aprovada, a moldura gótica dos painéis e botões React vem de imagens 9-slice via CSS `border-image`, sem esticar a arte.

## Decisões de que depende
ADRs na [parte 1](01-visao-e-direcao-artistica.md); nenhum específico desta parte.

## Fatos técnicos verificados
Os fatos de UI estão no "Estado vs código" acima (leitura de `DialogueModal.tsx`, `src/index.css`, `InventoryModal.tsx`, `SettingsScene.ts`, `RecordsScene.ts`, verificado em 2026-10-11).

## Decisões a confirmar
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| 6 | Divisão de UI (ex-UIA 6) | A) modais e HUD em React com 9-slice; B) parte no Phaser | A: `CLAUDE.md` exige UI só em React |

## Escopo
Se aprovado:
- Classe `.gothic-panel` (borda 16 px, `border-image-slice: 16 fill`, `repeat`, `background-clip: padding-box`) com `public/assets/ui/gothic_border_slice.png`.
- Classe `.gothic-button-active` (borda 8 px, `gold_runic_border.png`, glow `drop-shadow(0 0 4px rgba(184,134,11,0.6))`, fonte Cinzel, cor Bone White `#e3dac9`).
- `.gothic-panel` nos modais React existentes (`InventoryModal`, `TalentsModal`, `PrestigeModal` e semelhantes), com `image-rendering: pixelated`.
- Grade do inventário (4 colunas, slots de 64 px), fundo `#0a0705`, borda `#3a271d` (`#b8860b` no hover).
- Motivo de React: layout responsivo, scroll e toque precisos, acessibilidade e tradução mais baratos que no Phaser.

Fatiamento 9-slice: cantos 16x16 fixos, bordas repetidas, centro de feltro escuro.

```css
.gothic-panel {
  border-width: 16px;
  border-style: solid;
  border-image-source: url('/assets/ui/gothic_border_slice.png');
  border-image-slice: 16 fill;
  border-image-repeat: repeat;
  background-clip: padding-box;
}
```

## Fora de escopo
- Mover HUD ou modais para dentro do Phaser.
- Reescrever em React as telas hoje em Phaser (`TitleScene`, `SettingsScene`, `RecordsScene`): é assunto de [bug-ui-fora-do-react-e-codigo-morto](../bug-ui-fora-do-react-e-codigo-morto.md).
- Localização (i18n) das strings.

## Arquivos e contratos
- Criar: `public/assets/ui/gothic_border_slice.png` (borda 16 px) e `public/assets/ui/gold_runic_border.png` (borda 8 px); binários, nunca por ferramentas de texto.
- Alterar: `src/index.css` e os modais React escolhidos.
- Atualizar no mesmo commit: [modals-and-screens](../../../ui/modals-and-screens.md), [hud](../../../ui/hud.md) e `Verificado em`.
- Não tocar: `GameScene`, cenas Phaser de menu.
- Contrato visual: cantos 16x16 e 8x8 sem distorção; texto legível sobre o feltro; alvo mínimo de toque a definir.

Critérios: [parte 6](06-criterios-e-pendencias.md) (`AAS-10`, `AAS-11`).

## Referências
- [HUD](../../../ui/hud.md), [Modais e telas](../../../ui/modals-and-screens.md), [Modais secundários e gamepad](../feature-ui-modais-secundarios-e-gamepad.md), [HUD com referências visuais](../feature-ui-hud-referencias-visuais.md)
