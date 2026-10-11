# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 1: Visão artística e escopo visual)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado em 2026-10-10 (leitura estática): parcial. Existe: síntese procedural de áudio como única fonte sonora (`src/utils/soundEngine.ts`, `src/utils/bgmSynthesizer.ts`, só `AudioContext`), `src/utils/telemetry.ts` e `src/utils/logger.ts`, `Sentry.init` em `src/main.tsx` (condicionado a DSN), fontes locais em `public/fonts/`, imagens de UI em `src/assets/ui/` e `public/assets/ui/` (usadas por `SettingsScene.ts` e `RecordsScene.ts`), `border-image` com SVG inline no `hud/DialogueModal.tsx`, cores de raridade em `InventoryModal.tsx`, tint de elite em `Enemy.ts`. Não existe: `HybridSoundEngine`/carga de áudio físico (nenhum `decodeAudioData` nem `new Audio`; `public/assets/audio` só tem `.gitkeep`), classe `.gothic-panel` e `gothic_border_slice.png`, `AssetLoader` centralizado, reporte de `loaderror` ao Sentry (o loader usa só `logger`), camadas de equipamento no sprite do jogador, retratos de NPC em pixel art (o diálogo usa ícones Lucide), tela de Créditos, sprites de inimigos/NPCs/tiles externos, medição do orçamento de 2,5 MB.

## Partes desta spec

Spec dividida em partes menores; o conteúdo é o do documento original, sem alteração de significado.

| Parte | Assunto |
|---|---|
| [1](ui-assets-externos-framework-parte-1-visao-e-escopo-visual.md) | Visão artística e escopo visual |
| [2](ui-assets-externos-framework-parte-2-ui-react-9slice.md) | Eixo B: UI híbrida React + Phaser e 9-slice |
| [3](ui-assets-externos-framework-parte-3-audio.md) | Eixo C: transição gradual de áudio |
| [4](ui-assets-externos-framework-parte-4-orcamento-e-telemetria.md) | Orçamento de performance e telemetria de falhas |
| [5](ui-assets-externos-framework-parte-5-licencas-repositorios-plano.md) | Licenças, repositórios e plano de transição |

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Direção artística, paleta e resoluções máximas de pixel art.
2. Divisão de UI: menus complexos no React com assets estéticos (9-slice CSS), HUD no Phaser.
3. Estratégia de transição de áudio (SFX/BGM) e formatos.
4. Orçamento de KB/VRAM, lazy-loading e telemetria de falha de imagem.
5. Licenças permitidas e repositórios de arte recomendados.

---

> Este documento detalha a viabilidade técnica, o design de arte, o plano de transição e o gerenciamento de recursos para evoluir o visual e a sonoplastia do **Bloodmage 1995** a partir de assets externos gratuitos ou licenciados. O objetivo é atingir a estética gótica sombria de meados dos anos 90 (estilo *Diablo I*, *Diablo II* e *Dungeon Siege 1*), no formato de **Pixel Art de Alta Resolução/Fidelidade** e sonorização imersiva, sem comprometer a robustez técnica do jogo.

---

## 1. Visão Geral e Direcionamento Artístico

O **Bloodmage 1995** usa hoje `textureGenerator.ts` (canvas HTML5) como fallback de todas as texturas, com carga opcional de arquivos via `assetManifest.json` (só o jogador e o baú têm arte física), e `soundEngine.ts` para síntese via Web Audio API.

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
