# Evolução de UI e assets externos góticos: UI React com 9-slice (parte 2)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente
**Estado vs código:** verificado em 2026-10-11 (leitura estática): parcial. Existe: HUD e modais em React sobre o canvas Phaser; `border-image` com SVG inline só em `src/components/hud/DialogueModal.tsx` (`borderImageSlice: '20 fill'`, `round`); classes `.gothic-border`, `.blood-border`, `.gold-gothic-border` com `border` sólido em `src/index.css`; `.font-cinzel` em `src/index.css`; imagens `ui-corner.png`, `ui-plaque.png`, `stone-tile.jpg` em `src/assets/ui/` e `public/assets/ui/`, usadas só por `SettingsScene.ts` e `RecordsScene.ts` (menus desenhados em Phaser). `InventoryModal.tsx` já usa `image-rendering: pixelated`. Falta: classe `.gothic-panel`, `gothic_border_slice.png`, `gold_runic_border.png` e `.gothic-button-active`, slices de arte para os modais.

Parte 2 de 6. Índice das partes: [README](README.md).

## Escopo
Se aprovado, a moldura gótica dos painéis e botões do React passa a vir de imagens 9-slice via CSS `border-image`, sem esticar a arte:
- Por que React: layout responsivo nativo (celular a ultra-wide), scroll e toque precisos, acessibilidade e tradução de textos mais baratos que no Phaser.
- Classe `.gothic-panel` (borda de 16 px, `border-image-slice: 16 fill`, `repeat`, `background-clip: padding-box`) com a imagem `public/assets/ui/gothic_border_slice.png`.
- Classe `.gothic-button-active` (borda de 8 px, `gold_runic_border.png`, glow dourado `drop-shadow(0 0 4px rgba(184,134,11,0.6))`, fonte Cinzel, cor Bone White `#e3dac9`).
- Aplicar `.gothic-panel` aos modais React existentes (`InventoryModal`, `TalentsModal`, `PrestigeModal` e semelhantes), com `image-rendering: pixelated`.
- Grade do inventário (4 colunas, slots 64 px) com fundo `#0a0705` e borda `#3a271d` (`#b8860b` no hover), conforme o exemplo abaixo.

Esquema do fatiamento 9-slice (cantos de 16x16 fixos, bordas repetidas, centro de feltro escuro):

```
 A (16x16) | B repetível  | C (16x16)
 D repet.  | E feltro      | F repet.
 G (16x16) | H repetível  | I (16x16)
```

Exemplo conceitual de CSS (valores propostos):

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

Exemplo conceitual de uso (o `InventoryModal` real tem outras props e lista de itens):

```tsx
<div className="gothic-panel w-full max-w-md p-6 relative bg-[#171309] text-[#e3dac9]"
     style={{ imageRendering: 'pixelated' }}>
  <h2 className="text-xl font-cinzel text-[#b8860b] text-center">INVENTÁRIO</h2>
  <div className="grid grid-cols-4 gap-2">{/* slots */}</div>
</div>
```

## Fora de escopo
- Mover o HUD ou os modais para dentro do Phaser: a regra do projeto é UI só em React; o original dizia "HUD no Phaser" e isso contradiz o `CLAUDE.md`.
- Reescrever em React as telas hoje desenhadas em Phaser (`TitleScene`, `SettingsScene`, `RecordsScene`): é assunto de [bug-ui-fora-do-react-e-codigo-morto](../bug-ui-fora-do-react-e-codigo-morto.md).
- Localização (i18n) das strings.

## Arquivos e contratos
- Criar: `public/assets/ui/gothic_border_slice.png` (borda 16 px) e `public/assets/ui/gold_runic_border.png` (borda 8 px); binários, nunca editar por ferramentas de texto.
- Alterar: `src/index.css` (classes novas) e os modais React escolhidos.
- Atualizar no mesmo commit: `docs/ui/modals-and-screens.md`, `docs/ui/hud.md` e `Verificado em`.
- Não tocar: `GameScene`, cenas Phaser de menu.
- Contrato visual: cantos 16x16 e 8x8 sem distorção; texto legível sobre o feltro; botões de toque com alvo mínimo a definir (questão em aberto).

Critérios, verificação e pendências: [parte 6](06-criterios-e-pendencias.md).

## Referências
- [HUD](../../../ui/hud.md), [Modais e telas](../../../ui/modals-and-screens.md)
- [Modais secundários e gamepad](../feature-modais-secundarios-e-gamepad.md), [HUD com referências visuais](../feature-hud-referencias-visuais.md)
