---
agent_context: game-engine, frontend, game-designer
target_module: artifacts/bloodmage/src/game
priority: alta
status: proposta
last_updated: 2026-08-11
tags: [specs, proposta, ui, assets-externos, pixel-art, hybrid-system]
---

# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art)

> Este documento detalha a viabilidade técnica, o design de arte e o plano de transição para evoluir o visual do **Bloodmage 1995** a partir de assets externos gratuitos, aderentes à estética gótica sombria de meados dos anos 90 (estilo *Diablo I*, *Diablo II* e *Dungeon Siege 1*), no formato de **Pixel Art de Alta Resolução**.

---

## 1. Visão Geral e Direcionamento Artístico

O **Bloodmage 1995** opera hoje sob uma arquitetura puramente procedural (`textureGenerator.ts` para renderização em canvas HTML5 e `soundEngine.ts` para síntese via Web Audio). Essa restrição foi crucial para o início ágil do projeto e bundle extremamente leve.

Contudo, para atingir o nível de **imersão comercial e "game juice"** desejados, propõe-se uma transição para um **modelo híbrido de renderização**:
* **Assets de Alta Resolução (Pixel Art Sombria):** Utilizar recursos de alta qualidade visual para elementos de alta frequência de foco (personagem, inimigos, ícones, feitiços, cenários e menus).
* **Fallback Procedural Ativo:** Manter o gerador de canvas como um fallback resiliente. Caso os assets falhem no carregamento ou ocorram erros de rede/disco, a engine renderiza os gráficos procedurais, garantindo robustez de execução.

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

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             GAMEPLAY HUD MOBILE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Orbe Vida (Crimson)]                     [Contratos / Quests HUD (Gold)]  │
│                                                                             │
│                                                                             │
│              [Cenário / Masmorras (Pixel Art Gótica Sombria)]               │
│                                                                             │
│         [NPC] <── [Player com Equipamento Visível] ──► [Inimigo / Magia]    │
│                                                                             │
│                                                                             │
│  [Movimento Joystick]                       [Barra / Orbe Mana]             │
│                                             [Slots Habilidades Rúnicos]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

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

## 3. Guia de Licenciamento de Assets Gratuitos

Para garantir que o jogo permaneça 100% legal, sem riscos de custos futuros, quebras de contrato ou disputas de direitos autorais, todas as escolhas de assets externos devem seguir as regras abaixo.

### 3.1. Tipos de Licenças Permitidas

* **CC0 (Creative Commons Zero / Domínio Público):**
  * *O que é:* O criador renunciou a todos os direitos de autor.
  * *Uso:* Pode ser usado, modificado, distribuído comercialmente ou de forma privada sem necessidade de dar créditos ou permissão adicional.
  * *Preferência:* **Máxima**. Ideal para menus de UI, grades, botões e sons.

* **CC-BY (Atribuição Creative Commons):**
  * *O que é:* Permite uso comercial e modificação gratuita.
  * *Condição:* **Obrigatoriamente** requer dar o devido crédito ao autor original nas configurações do jogo ou seção dedicada de créditos.
  * *Contrato Visual:* Não há impacto de contrato visual. Basta colocar o nome do autor, link e tipo de licença de forma organizada em um menu "Créditos" ou arquivo acessível.

* **Licença Livre OpenGameArt (OGA BY / CC-BY-SA):**
  * *Uso:* Permitido em sua totalidade, respeitando as condições de compartilhamento sob a mesma licença se houver modificações drásticas e atribuição do criador original.

### 3.2. Estrutura de Créditos Organizada
Propõe-se a criação do componente `CreditsModal.tsx` ou uma aba dedicada no menu de Configurações, onde os artistas são citados de forma profissional:

> **"Agradecimentos Visuais e Créditos de Arte"**
> * *Mapeamento de Masmorras (Tileset):* [Nome do Autor] sob licença CC-BY 4.0 (link do asset).
> * *Ícones de Magias e Habilidades:* [Nome do Autor] sob licença CC0.
> * *Sprites de Monstros e Criaturas:* [Nome do Autor] sob licença OGA-BY.

---

## 4. Repositórios Recomendados de Pixel Art Gótica

As fontes abaixo contêm acervos vastos de pixel art gratuita voltada especificamente para o terror de alta resolução, fantasia sombria e gótico medieval:

1. **OpenGameArt.org (OGA):**
   * *O que buscar:* Termos como "dark fantasy", "gothic tileset", "necromancer spell", "rpg item icons".
   * *Artistas de Destaque:* *Redshrike* (monstros e sprites), *Crichat* (UI gótica), *Buch* (RPG assets góticos).
2. **Itch.io (Free Game Assets):**
   * *O que buscar:* Filtros de "Free", "Pixel Art", "Dark Fantasy".
   * *Coleções Recomendadas:* *Adamatlas* (UI rúnica e botões), *Penusbmic* (incríveis cenários góticos e monstros pixel art dark), *Caz Creations* (ícones de itens góticos).
3. **Surt's Public Domain Treasures:**
   * Coleção monumental de assets CC0 voltados a clássicos de PC dos anos 90.

---

## 5. Plano de Implementação e Arquitetura Técnica (Sistema Híbrido)

A transição deve ser cirúrgica, evitando quebras de performance em dispositivos móveis e mantendo a leveza do carregamento.

```
                  ┌────────────────────────────────────────┐
                  │          Início da Cena Phaser         │
                  └───────────────────┬────────────────────┘
                                      │
                         [Tenta carregar spritesheet]
                                      │
                  ┌───────────────────┴────────────────────┐
                  ▼                                        ▼
        [Sucesso: Asset Existe]               [Erro: Falha / Ausência]
                  │                                        │
        ┌─────────┴──────────┐                   ┌─────────┴──────────┐
        │ Injeta Spritesheet │                   │ Roda o Fallback    │
        │    na Key Única    │                   │ Canvas Procedural  │
        └─────────┬──────────┘                   └─────────┬──────────┘
                  │                                        │
                  └───────────────────┬────────────────────┘
                                      ▼
                  ┌────────────────────────────────────────┐
                  │   Renderiza Objeto de Jogo em Tela     │
                  └────────────────────────────────────────┘
```

### 5.1. Mecanismo de Key Única e Fallback no Loader
No Phaser 3, os objetos de jogo se referenciam a texturas usando strings (Ex: `"spr_bloodmage"`). Para fazer a transição gradual sem alterar uma única linha lógica nos arquivos `Player.ts`, `Enemy.ts` ou `LootSystem.ts`:

1. No loop `preload()` da cena Phaser, tenta-se carregar os arquivos de imagem das pastas de assets:
   ```typescript
   preload() {
     // Configura o Loader com timeout de falha silenciosa
     this.load.image('spr_bloodmage_asset', 'assets/sprites/bloodmage.png')
       .on('loaderror', () => {
         this.log.warn('Asset do player falhou. Ativando render procedural...');
       });
   }
   ```
2. No loop `create()`, validamos a presença do asset carregado. Caso esteja ausente ou corrompido, executamos o gerador de canvas procedural injetando o resultado exatamente sob a mesma key de textura:
   ```typescript
   create() {
     if (this.textures.exists('spr_bloodmage_asset')) {
       // Se o asset físico carregou com sucesso, clona para a key principal
       this.textures.addAtlas('spr_bloodmage', this.textures.get('spr_bloodmage_asset').getSourceImage() as HTMLImageElement, ...);
     } else {
       // Fallback: Gera a textura procedural do zero no canvas em tempo de execução
       TextureGenerator.generatePlayerTexture(this, 'spr_bloodmage');
     }
   }
   ```

### 5.2. Empacotamento de Sprites (Atlas / Sprite Sheets)
* **Evitar Múltiplos Arquivos PNG:** Carregar 100 imagens de ícones individuais gera 100 requisições HTTP, quebrando a performance no mobile.
* **Solução:** Unificar todos os itens, botões e runas em um único **Texture Atlas** (uma imagem grande contendo todas as menores e um arquivo JSON contendo as coordenadas X, Y, Largura e Altura de cada ícone).
* **Compilação Automatizada:** Adicionar ferramentas como `spritesheet-js` ou usar scripts de build via Node que compilam as pastas de sprites em atlas de forma automática antes do deployment final.

### 5.3. Otimização no Vite e Service Worker PWA
* **Lazy Loading de Assets:** Os assets de áudio composto e spritesheets de biomas avançados não devem ser baixados no carregamento inicial da página. Eles devem ser carregados dinamicamente via Phaser Loader sob demanda quando a cena correspondente for ativada.
* **Estratégia de Cache Cache-First no PWA:** Ajustar o `vite-plugin-pwa` em `vite.config.ts` para cachear em cache local do navegador todos os arquivos `.png`, `.json` e `.webp` da pasta de assets. O jogador só fará o download desses elementos visuais mais pesados uma única vez.

---

## 6. Próximos Passos Recomendados

1. **Aprovação deste Discovery:** Alinhamento final com o Product Manager sobre as recomendações visuais e técnicas descritas neste documento.
2. **Homologação das Fontes de Arte:** Seleção e download dos primeiros pacotes de Pixel Art sob licenças CC0/CC-BY para os testes iniciais.
3. **Criação do Protótipo Híbrido:** Aplicação do sistema de fallback com key única no `Player.ts` para validar o carregamento simultâneo do sprite em pixel art com fallback dinâmico.
4. **Mapeamento de Sprites e Spritesheets:** Substituição gradual das keys procedurais do `textureGenerator.ts` de acordo com a ordem de prioridades estabelecida no jogo.
