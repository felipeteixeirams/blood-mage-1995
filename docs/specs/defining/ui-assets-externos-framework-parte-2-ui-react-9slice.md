# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 2: Eixo B: UI híbrida React + Phaser e 9-slice)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática): parcial. Existe: síntese procedural de áudio como única fonte sonora (`src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`, só `AudioContext`), `src/utils/telemetry.ts` e `src/utils/logger.ts`, `Sentry.init` em `src/main.tsx` (condicionado a DSN), fontes locais em `public/fonts/`, imagens de UI em `src/assets/ui/` e `public/assets/ui/` (usadas por `SettingsScene.ts` e `RecordsScene.ts`), `border-image` com SVG inline no `hud/DialogueModal.tsx`, cores de raridade em `InventoryModal.tsx`, tint de elite em `Enemy.ts`. Não existe: `HybridSoundEngine`/carga de áudio físico (nenhum `decodeAudioData` nem `new Audio`; `public/assets/audio` só tem `.gitkeep`), classe `.gothic-panel` e `gothic_border_slice.png`, `AssetLoader` centralizado, reporte de `loaderror` ao Sentry (o loader usa só `logger`), camadas de equipamento no sprite do jogador, retratos de NPC em pixel art (o diálogo usa ícones Lucide), tela de Créditos, sprites de inimigos/NPCs/tiles externos, medição do orçamento de 2,5 MB.

Parte 2 de 5. Índice das partes: [parte 1](ui-assets-externos-framework-parte-1-visao-e-escopo-visual.md).

---

## 3. Eixo B - Interface do Usuário (UI) Híbrida: React + Phaser

O **Bloodmage 1995** utiliza uma estrutura na qual o React gerencia a HUD, modais e telas de menu de forma sobreposta à *viewport* de renderização do Phaser.

### 3.1. Por que manter menus complexos no React?
1. **Responsividade Mobile-First:** O layout HTML/CSS se ajusta nativamente a proporções de tela variáveis, de celulares compactos (vertical/horizontal) a telas ultra-wide na Steam. Implementar o mesmo nível de adaptabilidade no Phaser exige recálculos complexos e caros de viewport.
2. **Escalabilidade Comercial (Steam/Play Store/PWA):** No React, componentes de UI possuem scroll nativo de alta performance, botões de toque precisos e suporte completo a acessibilidade (leitores de tela, escala de texto nítida sem borrões).
3. **Internacionalização (Localization):** Gerenciamento de strings de tradução do React é leve, permitindo transições suaves de idioma no inventário e caixas de diálogo.

### 3.2. Integração de Assets Estéticos na UI do React
Para dar o visual gótico e sombrio de 1995 às bordas e painéis do React de forma extremamente leve, propõe-se a técnica de **9-Slice Scaling (Fatiamento de Imagem)** por meio do CSS `border-image`.

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
