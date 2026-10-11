# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 4: Orçamento de performance e telemetria de falhas)

**Mestre:** [discovery-ui-e-assets-externos](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática): parcial. Existe: síntese procedural de áudio como única fonte sonora (`src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`, só `AudioContext`), `src/utils/telemetry.ts` e `src/utils/logger.ts`, `Sentry.init` em `src/main.tsx` (condicionado a DSN), fontes locais em `public/fonts/`, imagens de UI em `src/assets/ui/` e `public/assets/ui/` (usadas por `SettingsScene.ts` e `RecordsScene.ts`), `border-image` com SVG inline no `hud/DialogueModal.tsx`, cores de raridade em `InventoryModal.tsx`, tint de elite em `Enemy.ts`. Não existe: `HybridSoundEngine`/carga de áudio físico (nenhum `decodeAudioData` nem `new Audio`; `public/assets/audio` só tem `.gitkeep`), classe `.gothic-panel` e `gothic_border_slice.png`, `AssetLoader` centralizado, reporte de `loaderror` ao Sentry (o loader usa só `logger`), camadas de equipamento no sprite do jogador, retratos de NPC em pixel art (o diálogo usa ícones Lucide), tela de Créditos, sprites de inimigos/NPCs/tiles externos, medição do orçamento de 2,5 MB.

Parte 4 de 5. Índice das partes: [parte 1](01-visao-e-escopo-visual.md).

---

## 5. Limites de Performance, Compactação e Orçamento de VRAM

Dispositivos móveis de entrada possuem fortes limitações de memória gráfica (VRAM) e processamento. Para evitar lentidão na taxa de quadros (micro-stuttering) ou fechamento abrupto do navegador, todas as adições de artes físicas seguirão um orçamento rigoroso.

### 5.1. Resoluções Máximas de Pixel Art (Fidelidade Controlada)
Para manter o visual clássico e o consumo de memória sob controle, os sprites deverão respeitar as seguintes grades de tamanho:
* **Pisos e Paredes (Tiles):** Máximo **64x32** (isométrico de chão) e **32x32** (blocos de parede).
* **Sprites de Personagem/Inimigos Médios:** Máximo **48x48** ou **64x64** por frame de animação.
* **Inimigos Grandes / Chefes:** Máximo **128x128** por frame de animação.
* **Ícones de Menu/Habilidades:** Máximo **32x32** ou **48x48** com alta definição cromática.

### 5.2. Orçamento de Kilobytes e Carregamento sob Demanda (Lazy-Loading)
O limite de tamanho total do pacote inicial de carregamento (*initial bundle size*) do jogo PWA deve ser estritamente preservado:
* **Limite Inicial do PWA:** Máximo **2.5 MB** para as cenas iniciais (Título, Menu Principal e Safe Zone).
* **Carregamento Assíncrono por Cenas:** Os spritesheets e trilhas dos biomas mais avançados (ex: Masmorras Nível 2+, Áreas de Chefe) devem ser carregados dinamicamente apenas quando o jogador for transicionar para a cena correspondente.

### 5.3. Ferramentas e Processamento de Compactação Gráfica
Nenhum arquivo PNG bruto deve ser publicado em produção:
1. **Compressão de Spritesheets:** Uso obrigatório de compactação com perda controlada via `pngquant` com limitação de paleta para 256 cores (estilo retrô legítimo), reduzindo o peso do arquivo em até 70% sem alterar os detalhes visuais perceptíveis.
2. **Utilização de WebP:** Sempre que compatível (navegadores modernos e aplicativos empacotados), converter as texturas de plano de fundo e tilesets para o formato `.webp` com fator de qualidade ajustado para **80%**, obtendo tamanhos de arquivo até 40% menores que o PNG.
3. **Texture Atlas (Spritesheet Único):** Reunir todos os ícones de inventário e magias em um único arquivo de Atlas utilizando ferramentas como o *TexturePacker* ou *Shoebox*. Isso reduz a quantidade de requisições HTTP e otimiza as *Draw Calls* do WebGL no Phaser para apenas 1 (um único envio de imagem para a placa de vídeo).

---

## 6. Telemetria de Falhas e Logs Estruturados

Para garantir que o jogo nunca "fique mudo" ou com "quadrados invisíveis" sem sabermos, propõe-se um validador no pipeline de carregamento que reportará falhas silenciosas de recursos externos ao Sentry.

### 6.1. Exemplo de Captura de Falha de Imagem no Phaser
```typescript
export function registerAssetLoadingListeners(scene: Phaser.Scene) {
  scene.load.on('loaderror', (fileObj: any) => {
    const errorMsg = `Falha ao carregar asset: [${fileObj.key}] de ${fileObj.url}`;

    // Log estruturado local usando o serviço de logger do jogo
    logger.error(errorMsg, {
      system: 'asset-loader',
      key: fileObj.key,
      url: fileObj.url,
      type: fileObj.type
    });

    // Envio para telemetria de produção (Sentry)
    if ((window as any).Sentry) {
      (window as any).Sentry.captureMessage(errorMsg, {
        level: 'warning',
        tags: {
          system: 'asset-loader',
          asset_key: fileObj.key,
          asset_type: fileObj.type
        },
        extra: {
          attempted_url: fileObj.url,
          browser_info: navigator.userAgent
        }
      });
    }
  });
}
```
