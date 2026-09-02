---
agent_context: game-engine, frontend, game-designer, product-manager
target_module: artifacts/bloodmage/src/game
priority: alta
status: parcialmente_implementado
last_updated: 2026-09-02
tags: [specs, proposta, ui, assets-externos, pixel-art, hybrid-system, performance, audio]
---

# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art)

> Este documento detalha a viabilidade técnica, o design de arte, o plano de transição e o gerenciamento de recursos para evoluir o visual e a sonoplastia do **Bloodmage 1995** a partir de assets externos gratuitos ou licenciados. O objetivo é atingir a estética gótica sombria de meados dos anos 90 (estilo *Diablo I*, *Diablo II* e *Dungeon Siege 1*), no formato de **Pixel Art de Alta Resolução/Fidelidade** e sonorização imersiva, sem comprometer a robustez técnica do jogo.

> **Nota de Implementação Real (Setembro 2026):** Partes do pipeline híbrido já se encontram ativas no código-fonte:
> - **Sintetizador BGM & Procedural Audio Fallback:** Implementado em `src/utils/bgmSynthesizer.ts` e `src/utils/soundEngine.ts`.
> - **Telemetria de Erros & Ingestão de Logs:** Implementado em `src/utils/telemetry.ts` e `src/utils/logger.ts`.

---

## 1. Visão Geral e Direcionamento Artístico

O **Bloodmage 1995** opera hoje sob uma arquitetura puramente procedural (`textureGenerator.ts` para renderização em canvas HTML5 e `soundEngine.ts` para síntese via Web Audio API). Essa restrição foi essencial para garantir um carregamento instantâneo, leveza extrema e independência de rede.

Contudo, para atingir o nível de **imersão comercial e "game juice"** necessários para competir no mercado (como PWA Premium ou em lojas como Steam e Google Play Store), propõe-se uma transição para um **modelo híbrido de carregamento**:
* **Assets Físicos Sombrios:** Utilizar recursos visuais (PNG/WebP compactados) e sonoros (MP3/OGG) de alta qualidade para focar o jogador em elementos cruciais (mago, monstros, runas, efeitos sonoros de feitiços e trilhas ambientais).
* **Fallback Procedural Resiliente:** Manter os geradores de canvas e síntese de áudio como fallbacks ativos de segurança. Caso os assets externos falhem (erros de rede, corrupção de cache ou ausência física), a engine renderiza os gráficos procedurais e sintetiza os sons em tempo de execução, impedindo falhas críticas ou travamentos de tela.

### 🎨 Paleta de Cores e Diretrizes de Estilo
Todas as escolhas de assets devem alinhar-se à paleta **Grimdark** oficial do jogo:
* **Deep Charcoal (`#171309`):** Fundo de painéis e profundidade das masmorras.
* **Crimson Blood Red (`#990000`):** Feitiços de hemomancia, sangue, orbes vitais.
* **Tarnished Gold (`#B8860B`):** Bordas ornamentadas góticas, botões rúnicos ativos, itens raros.
* **Bone White (`#E3DAC9`):** Texturas de ossos, fontes rúnicas/Courier.
* **Abyssal Void (`#000000`):** Sombras absolutas e névoa da guerra.

---

## 2. Escopo e Mapeamento de Melhorias Visuais

Sendo um jogo focado prioritariamente em **Mobile-First**, cada elemento precisa de alta legibilidade em telas compactas de smartphones, garantindo alto contraste e contornos bem definidos.

### 2.1. O Personagem Principal (Bloodmage)
* **O que muda:** Substituição do sprite atual por uma spritesheet com animações fluidas de 8 direções de movimento, ataques com foice, conjuração de magias, hit (recebimento de dano) e morte.
* **Equipamentos Visíveis:** Implementação de camadas de spritesheet independentes (*layers*):
  * *Camada Base:* Corpo do Mago.
  * *Camada de Armadura:* Manto (que muda visualmente conforme o item equipado no slot de armadura).
  * *Camada de Arma:* Foice ou Cajado em movimento conforme o item equipado na mão principal.

### 2.2. Inimigos e Criaturas
* **Spritesheets Dedicados:** Cães infernais com animações de corrida e mordida com windup; cultistas conjurando feitiços e morrendo em poças de sangue; mortos-vivos rastejando ou se erguendo.
* **Variações de Elite/Campeões:** Uso de tinting WebGL via shader dinâmico (`sprite.setTint()`) para diferenciar monstros de elite (ex: aura dourada, esmeralda ou roxo corrupto) sem carregar novos arquivos.

### 2.3. NPCs (Non-Player Characters)
* **Retratos Dinâmicos (Portraits):** Caixa de diálogos exibindo o rosto ilustrado em pixel art do Clérigo, Alquimista ou Ferreiro, com pequenas animações de piscada ou fala (estilo *Diablo I*).
* **Visual in-game:** Sprites estáticos ou com animações de respiração (*idle*) bem integradas aos hubs de segurança (Safe Zones).

### 2.4. Cenário e Ambientação (Tilesets e Props)
* **Masmorra e Estepes:** Utilização de tilesets góticos escuros com paredes de pedra úmida, grades de ferro oxidadas, rachaduras no chão e poças de sangue.
* **Props Interativos (Scavenging):** Baús de madeira com dobradiças de metal envelhecido, altares de sacrifício rúnicos, recipientes de cinzas e corpos vasculháveis que alteram visualmente o estado de "fechado" para "aberto/vazio".
* **Gargalos e Passagens:** Portões góticos gigantescos com correntes pesadas que se abrem fisicamente após derrotar os mini-chefes.

### 2.5. Ícones de Habilidades, Runas e Inventário
* **Skill Slots:** Molduras rúnicas circulares de pedra com bordas metálicas envelhecidas.
* **Ícones de Habilidades (Foice, Explosão, Círculo):** Imagens de pixel art de alta definição com alto contraste, fáceis de identificar sob sol e brilho de tela mobile.
* **Runas e Talentos:** Runas góticas em pedra entalhada com iluminação interna (glow procedural ou WebGL) indicando a ativação.

### 2.6. Grade de Inventário e Slots
* **Grade (Grid Layout):** Slots representados por caixas de ferro cinzelado com fundo de feltro escuro escurecido.
* **Itens Equipáveis (Armas, Mantos e Relíquias):** Miniaturas limpas de foices, cajados, mantos tecidos, anéis e olhos rúnicos correspondentes às raridades (Comum = Cinza, Raro = Azul, Épico = Roxo, Lendário = Dourado).

### 2.7. Coletáveis e Loot Drops no Chão
* **Visual Físico no Chão:** Itens dropados não são textos, mas pequenos objetos em pixel art brilhante (potes de poções vermelhas/azuis, sacos de couro com cristais, pergaminhos antigos).
* **O "Cadáver" do Jogador (Túmulo):** Um monumento gótico ou um corpo de aventureiro caído que emite uma sutil fumaça ou facho de luz vermelha indicando onde os itens perdidos estão depositados.

### 2.8. Efeitos de Magia (VFX)
* **Hemomancia do Jogador:** Efeitos de corte de Foice Carmim com rastro de partículas avermelhadas fluidas; feixe de hemomancia composto por laser de sangue espesso; explosões necromânticas com estilhaços de ossos e carne.
* **Ataques dos Inimigos:** Bolas de fogo sombrio, garras de sombra rasgando a tela, projéteis venenosos esverdeados com rastros visíveis para esquiva ágil do jogador.

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

---

## 4. Eixo C - Transição Gradual de Áudio (SFX e BGM)

Atualmente, o `soundEngine.ts` sintetiza ondas senoidais, dentes-de-serra e ruídos programáticos via Web Audio API. Para evoluir a experiência auditiva para algo digno de horror medieval, adotaremos um modelo de carregamento gradativo de arquivos físicos de áudio.

### 4.1. Estratégia de Transição Híbrida do SoundEngine
Os efeitos de alta prioridade (conjuração de magias, impactos de foice, rugidos de monstros) e músicas de fundo serão migrados gradualmente para arquivos compactados (`.mp3` ou `.ogg`), mantendo o gerador Web Audio como fallback silencioso para evitar erros de execução.

```typescript
// Estrutura conceitual do SoundEngine Híbrido
import { logger } from './logger';

export class HybridSoundEngine {
  private audioContext: AudioContext;
  private sfxCache: Map<string, AudioBuffer> = new Map();
  private bgmElement: HTMLAudioElement | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Tenta tocar um arquivo de som físico. Caso falhe ou não exista, ativa a síntese via Web Audio.
   */
  async playSFX(key: string, fallbackSynthFn: () => void): Promise<void> {
    try {
      const cached = this.sfxCache.get(key);
      if (cached) {
        this.playBuffer(cached);
        return;
      }

      // Tenta carregar o arquivo sob demanda (lazy-loading)
      const url = `/assets/audio/sfx/${key}.mp3`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`SFX file not found: ${key}`);

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.sfxCache.set(key, audioBuffer);
      this.playBuffer(audioBuffer);
    } catch (error) {
      logger.warn(`Falha ao tocar SFX físico '${key}'. Ativando fallback procedural.`, error);

      // Envia telemetria do erro silencioso
      this.reportAudioErrorToSentry(key, error);

      // Roda o sintetizador antigo de ondas
      fallbackSynthFn();
    }
  }

  /**
   * Executa streaming de música longa diretamente por elemento HTMLAudio
   */
  playBGM(key: string, volume: number = 0.4): void {
    if (this.bgmElement) {
      this.bgmElement.pause();
    }

    this.bgmElement = new Audio(`/assets/audio/bgm/${key}.mp3`);
    this.bgmElement.loop = true;
    this.bgmElement.volume = volume;

    this.bgmElement.play().catch(error => {
      logger.warn(`Erro no streaming da trilha ${key}. Usando silêncio de segurança.`, error);
    });
  }

  private playBuffer(buffer: AudioBuffer): void {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  private reportAudioErrorToSentry(key: string, error: any): void {
    // Integração com Sentry para logs silenciosos em produção
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: { system: 'audio-engine', asset_key: key },
        extra: { message: `Audio asset failed to stream or load. Procedural fallback activated.` }
      });
    }
  }
}
```

### 4.2. Diretrizes de Compactação e Formatos de Áudio
Para manter o carregamento instantâneo do PWA, o áudio deve ser altamente otimizado:
* **Efeitos Sonoros (SFX):** Formato `.mp3` mono, taxa de amostragem reduzida para **22.050 Hz** ou **32.000 Hz**, taxa de bits constante (CBR) de **64 kbps**. Essa compressão combina perfeitamente com a estética rústica e crua de meados dos anos 90, pesando apenas de 10 KB a 30 KB por arquivo de som.
* **Trilhas de Fundo (BGM):** Formato `.mp3` estéreo, taxa de amostragem de **44.100 Hz**, taxa de bits de **96 kbps** ou **128 kbps**. As faixas devem ser curtas (loops de 1m30s a 2m) e tocadas via streaming (`new Audio()`), evitando carregar todo o arquivo na memória RAM do dispositivo.

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

---

## 7. Guia de Licenciamento de Assets Gratuitos

Para garantir a total legalidade e conformidade de direitos autorais em canais de distribuição comercial (Steam e Play Store), todas as escolhas de novos assets góticos devem seguir regras claras de licença.

### 7.1. Tipos de Licenças Permitidas

* **CC0 (Creative Commons Zero / Domínio Público):**
  * *O que é:* Renúncia completa de direitos de autor.
  * *Uso:* Totalmente livre para fins comerciais, modificação e redistribuição sem exigência de créditos.
  * *Preferência:* **Máxima**. Excelente para botões, bordas, ícones de poção e efeitos visuais básicos.

* **CC-BY (Atribuição Creative Commons):**
  * *O que é:* Permite uso comercial e alteração.
  * *Condição:* Exige a citação adequada do autor em seção acessível do jogo.
  * *Implementação:* Se usarmos um asset CC-BY, devemos incluir o nome do criador, link para a licença e link para a fonte no arquivo de Créditos do Jogo.

* **Licença Livre OpenGameArt (OGA BY):**
  * *Uso:* Totalmente liberado para uso comercial, respeitando as exigências de crédito especificadas na página do autor.

### 7.2. Estrutura de Créditos Organizada
A aba de Créditos será acessível pelas Configurações do jogo ou pelo Menu Principal usando o componente React, listando as atribuições de forma legível e profissional.

---

## 8. Repositórios Recomendados de Pixel Art Gótica

As fontes abaixo contêm acervos vastos de pixel art gratuita e compatível com a paleta sombria do projeto:

1. **OpenGameArt.org (OGA):**
   * *O que buscar:* Termos como "dark fantasy", "gothic tileset", "necromancer spell", "rpg item icons".
   * *Artistas de Destaque:* *Redshrike* (monstros), *Crichat* (UI gótica), *Buch* (RPG assets góticos).
2. **Itch.io (Free Game Assets):**
   * *Coleções Recomendadas:* *Adamatlas* (UI rúnica), *Penusbmic* (cenários góticos sombrios), *Caz Creations* (ícones de itens góticos).
3. **Surt's Public Domain Treasures:**
   * Coleção monumental de assets CC0 voltados a clássicos de PC dos anos 90.

---

## 9. Plano de Transição e Próximos Passos

A migração de procedural para assets externos será modular e executada em etapas:

1. **Etapa 1: Preparação do Pipeline Híbrido**
   * Criação do `AssetLoader` centralizado e integração com o `TextureGenerator` como fallback unificado.
   * Modificação do `soundEngine.ts` para herdar o modelo de carregamento híbrido e logs estruturados.
2. **Etapa 2: Protótipo de Validação**
   * Implementação de uma única spritesheet física do Player em pixel art com o fallback procedural ativo sob a mesma chave.
   * Validação de renderização sem queda de performance (<60 FPS) e teste do fallback simulando erro de download.
3. **Etapa 3: Migração de Biomas e UI**
   * Fatiamento e estilização do React HUD utilizando CSS `border-image` com as cantoneiras góticas.
   * Migração gradual dos tilesets das masmorras e spritesheets de inimigos conforme novos pacotes de assets forem homologados e compactados.
4. **Etapa 4: Auditoria de Performance e Publicação**
   * Verificação de vazamentos de memória (VRAM) em celulares mais antigos.
   * Lançamento comercial em lojas e PWAs com a nova assinatura estética sombria de 1995 de alta qualidade.
