# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 4: Orçamento de performance e telemetria de falhas)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática + `grep`). Existe: modelo híbrido de sprites com fallback procedural (`src/game/assets/assetManifest.json` com 37 entradas, 19 `required: true` = `spr_bloodmage` + baús em 8 direções; `queueAssetLoading` com `loaderror` e métricas em `assetManifest.ts`; `src/utils/textureGenerator.ts`; `scripts/verify-assets.cjs`); assets físicos em `public/assets/sprites/{player,items}` e UI em `src/assets/ui/` (usados em `RecordsScene.ts`); fontes locais em `public/fonts/` (Cinzel, UnifrakturMaguntia, Press Start 2P, VT323; classe `.font-cinzel`); `border-image` em `DialogueModal.tsx` (SVG inline) e `src/index.css`; Sentry inicializado em `src/main.tsx`; React gerencia HUD e modais; tintas de elite. Falta: áudio híbrido (`soundEngine.ts` só sintetiza; `public/assets/audio/` só tem `.gitkeep`; `public/audio_samples/*.wav` são renders offline de `scripts/render_bgm_samples.cjs` para `SoundTestModal`); classe `.gothic-panel` e PNGs `gothic_border_slice.png`/`gold_runic_border.png`; envio de falhas de asset ao Sentry (o `loaderror` só usa `logger`); tela de Créditos (`grep -rni credit src` sem UI); `pngquant`, WebP e atlas de ícones; camadas de equipamento no sprite do jogador; inimigos físicos (`public/assets/sprites/enemies/` só tem `.gitkeep`); tilesets físicos (`public/assets/tilesets/` só `.gitkeep`); limite de 2,5 MB e lazy-loading por cena não verificados.

Parte 4 de 5. Índice das partes: [parte 1](discovery-ui-assets-externos-parte-1-visao-e-escopo-visual.md).

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

A estabilidade em produção é nosso maior pilar. Para garantir que o jogo nunca "fique mudo" ou com "quadrados invisíveis" sem sabermos, implementaremos um validador no pipeline de carregamento que reportará falhas silenciosas de recursos externos ao Sentry.

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
