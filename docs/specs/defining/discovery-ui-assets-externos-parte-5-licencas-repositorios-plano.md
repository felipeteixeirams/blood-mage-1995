# Proposta de Discovery — Evolução de UI e Assets Externos Góticos (Pixel Art) (parte 5: Licenças, repositórios e plano de transição)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática + `grep`). Existe: modelo híbrido de sprites com fallback procedural (`src/game/assets/assetManifest.json` com 37 entradas, 19 `required: true` = `spr_bloodmage` + baús em 8 direções; `queueAssetLoading` com `loaderror` e métricas em `assetManifest.ts`; `src/utils/textureGenerator.ts`; `scripts/verify-assets.cjs`); assets físicos em `public/assets/sprites/{player,items}` e UI em `src/assets/ui/` (usados em `RecordsScene.ts`); fontes locais em `public/fonts/` (Cinzel, UnifrakturMaguntia, Press Start 2P, VT323; classe `.font-cinzel`); `border-image` em `DialogueModal.tsx` (SVG inline) e `src/index.css`; Sentry inicializado em `src/main.tsx`; React gerencia HUD e modais; tintas de elite. Falta: áudio híbrido (`soundEngine.ts` só sintetiza; `public/assets/audio/` só tem `.gitkeep`; `public/audio_samples/*.wav` são renders offline de `scripts/render_bgm_samples.cjs` para `SoundTestModal`); classe `.gothic-panel` e PNGs `gothic_border_slice.png`/`gold_runic_border.png`; envio de falhas de asset ao Sentry (o `loaderror` só usa `logger`); tela de Créditos (`grep -rni credit src` sem UI); `pngquant`, WebP e atlas de ícones; camadas de equipamento no sprite do jogador; inimigos físicos (`public/assets/sprites/enemies/` só tem `.gitkeep`); tilesets físicos (`public/assets/tilesets/` só `.gitkeep`); limite de 2,5 MB e lazy-loading por cena não verificados.

Parte 5 de 5. Índice das partes: [parte 1](discovery-ui-assets-externos-parte-1-visao-e-escopo-visual.md).

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

## 9. Plano de transição proposto

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
