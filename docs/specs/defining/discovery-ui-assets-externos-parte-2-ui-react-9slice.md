# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 2: Eixo B: UI híbrida React + Phaser e 9-slice)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática + `grep`). Existe: modelo híbrido de sprites com fallback procedural (`src/game/assets/assetManifest.json` com 37 entradas, 19 `required: true` = `spr_bloodmage` + baús em 8 direções; `queueAssetLoading` com `loaderror` e métricas em `assetManifest.ts`; `src/utils/textureGenerator.ts`; `scripts/verify-assets.cjs`); assets físicos em `public/assets/sprites/{player,items}` e UI em `src/assets/ui/` (usados em `RecordsScene.ts`); fontes locais em `public/fonts/` (Cinzel, UnifrakturMaguntia, Press Start 2P, VT323; classe `.font-cinzel`); `border-image` em `DialogueModal.tsx` (SVG inline) e `src/index.css`; Sentry inicializado em `src/main.tsx`; React gerencia HUD e modais; tintas de elite. Falta: áudio híbrido (`soundEngine.ts` só sintetiza; `public/assets/audio/` só tem `.gitkeep`; `public/audio_samples/*.wav` são renders offline de `scripts/render_bgm_samples.cjs` para `SoundTestModal`); classe `.gothic-panel` e PNGs `gothic_border_slice.png`/`gold_runic_border.png`; envio de falhas de asset ao Sentry (o `loaderror` só usa `logger`); tela de Créditos (`grep -rni credit src` sem UI); `pngquant`, WebP e atlas de ícones; camadas de equipamento no sprite do jogador; inimigos físicos (`public/assets/sprites/enemies/` só tem `.gitkeep`); tilesets físicos (`public/assets/tilesets/` só `.gitkeep`); limite de 2,5 MB e lazy-loading por cena não verificados.

Parte 2 de 5. Índice das partes: [parte 1](discovery-ui-assets-externos-parte-1-visao-e-escopo-visual.md).

---

## 3. Eixo B - Interface do Usuário (UI) Híbrida: React + Phaser

O **Bloodmage 1995** utiliza uma estrutura na qual o React gerencia a HUD, modais e telas de menu de forma sobreposta à *viewport* de renderização do Phaser.

### 3.1. Por que manter menus complexos no React?
1. **Responsividade Mobile-First:** O layout HTML/CSS se ajusta nativamente a proporções de tela variáveis, de celulares compactos (vertical/horizontal) a telas ultra-wide na Steam. Implementar o mesmo nível de adaptabilidade no Phaser exige recálculos complexos e caros de viewport.
2. **Escalabilidade Comercial (Steam/Play Store/PWA):** No React, componentes de UI possuem scroll nativo de alta performance, botões de toque precisos e suporte completo a acessibilidade (leitores de tela, escala de texto nítida sem borrões).
3. **Internacionalização (Localization):** Gerenciamento de strings de tradução do React é leve, permitindo transições suaves de idioma no inventário e caixas de diálogo.

### 3.2. Integração de Assets Estéticos na UI do React
Para dar o visual gótico e sombrio de 1995 às bordas e painéis do React de forma extremamente leve, adota-se a técnica de **9-Slice Scaling (Fatiamento de Imagem)** por meio do CSS `border-image`.

```
     FATIAMENTO 9-SLICE (Bordas de Pedra Escura e Cantos de Metal)

     Canto Sup. Esq. (A)      Borda Superior (B)      Canto Sup. Dir. (C)
            ┌───────────────┬───────────────────┬───────────────┐
            │    16 x 16    │    Repetível      │    16 x 16    │
            ├───────────────┼───────────────────┼───────────────┤
            │               │                   │               │
  Borda     │  Repetível    │   Fundo de Feltro │   Repetível   │  Borda
  Esq. (D)  │               │     Escuro (E)    │               │  Dir. (F)
            │               │                   │               │
            ├───────────────┼───────────────────┼───────────────┤
            │    16 x 16    │    Repetível      │    16 x 16    │
            └───────────────┴───────────────────┴───────────────┘
     Canto Inf. Esq. (G)      Borda Inferior (H)      Canto Inf. Dir. (I)
```

#### Exemplo Prático de Estilização em CSS/Tailwind:
Criar uma borda gótica texturizada usando um asset de cantoneira de pedra de 16px sem sofrer distorções de estiramento:

```css
/* src/index.css ou um arquivo de estilos dedicado */
.gothic-panel {
  border-width: 16px;
  border-style: solid;
  border-image-source: url('/assets/ui/gothic_border_slice.png');
  border-image-slice: 16 fill; /* O 'fill' desenha a textura de fundo do feltro */
  border-image-repeat: repeat; /* Repete a textura da borda sem esticar */
  background-clip: padding-box;
}

.gothic-button-active {
  border-width: 8px;
  border-image-source: url('/assets/ui/gold_runic_border.png');
  border-image-slice: 8 fill;
  filter: drop-shadow(0 0 4px rgba(184, 134, 11, 0.6)); /* Glow de Ouro Envelhecido */
  font-family: 'Cinzel', serif;
  color: #e3dac9; /* Bone White */
}
```

#### Aplicação no React:
```tsx
// Exemplo de modal de inventário híbrido no React
import React from 'react';

export const InventoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div
        className="gothic-panel w-full max-w-md p-6 relative bg-[#171309] text-[#e3dac9]"
        style={{ imageRendering: 'pixelated' }} /* Garante pixel art nítida */
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 gothic-button-active px-3 py-1 text-sm cursor-pointer"
        >
          X
        </button>
        <h2 className="text-xl font-bold font-cinzel text-[#b8860b] mb-4 text-center">
          INVENTÁRIO
        </h2>
        {/* Grid de Slots */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 bg-[#0a0705] border-2 border-[#3a271d] hover:border-[#b8860b] flex items-center justify-center cursor-pointer transition-colors"
            >
              {/* O item em pixel art é renderizado aqui */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```
