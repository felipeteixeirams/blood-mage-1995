# Discovery: Pipeline de Arte Semi-Automatizado via IA (HuggingFace / ChatGPT)

**Status:** Descoberta / Planejamento para Fase 3 (Escala de Produção)
**Data:** 2026-08-26

## 1. O Conceito
Estabelecer um pipeline híbrido (Scripts + IA + Intervenção Humana) para escalar a produção de assets (personagens, inimigos, props) mantendo coesão visual (Gothic Retro 16-bit) e automatizando a integração do asset com a engine (Phaser) e o controle de estado do jogo.

O foco é parar de tratar a IA como "geradora de assets prontos" e passar a usá-la como **mecanismo de geração de concepts consistentes**, onde ferramentas Node.js assumem a integração e validação técnica.

---

## 2. Por que Não 100% Automático? (Riscos Técnicos)
IAs generativas atuais possuem três falhas críticas para pixel art funcional em engines de jogos:
1. **Inconsistência de "Pixel" (Grid Snap):** IAs geram imagens em alta resolução simulando pixel art. Fazer downscale algorítmico automatizado borra a imagem ou destrói a silhueta.
2. **Alinhamento de Frames (Jitter/Flicker):** Animações (SpriteSheets) precisam de âncoras perfeitas. Se o centro de massa variar 2 pixels de um frame para o outro, o personagem "tremerá" in-game (vide histórico do `bloodmage.png`).
3. **Dimensões e VRAM:** Nossa engine exige assets rígidos (ex: 64x64) compactados agressivamente para rodar no navegador web. 

---

## 3. Arquitetura do Pipeline Proposto (Semi-Automático)

O pipeline divide as responsabilidades onde cada ator é mais forte:

### Passo A: Geração de Prompt Padronizado (Automação)
- **Fonte de Verdade:** Um arquivo `docs/ART_STYLE.md` contém as regras globais imutáveis (paleta, perspectiva ortogonal/top-down, contornos escuros).
- **Especificação do Inimigo:** Um arquivo leve `spec.yaml` por inimigo detalha o tipo, armas e comportamentos.
- **Ferramenta:** Script Node `pnpm run generate-prompt enemy <id>` lê os dois arquivos e cospe um mega-prompt blindado contra alucinações de estilo.

### Passo B: Geração & Limpeza (Humano + IA)
- **Geração:** O prompt é jogado no ChatGPT Images, Midjourney ou Hugging Face Spaces (ex: LoRAs de pixel art).
- **Polimento (O Toque Humano):** O artista pega o arquivo gerado em alta resolução, joga no Aseprite/Photoshop, realiza downscale (Nearest Neighbor) com retoques, limpa o fundo (Alpha Channel) e alinha o SpriteSheet num grid exato (ex: 64x64). Salva como `asset_raw.png`.

### Passo C: Ingestão e Código (Automação)
A "Mágica" acontece aqui. O script `pnpm run ingest-asset <tipo> <nome>` faz o trabalho braçal do desenvolvedor:
1. **Validação:** Lê `asset_raw.png` e valida se dimensões são compatíveis (ex: múltiplos de 64).
2. **Otimização:** Roda `pngquant` para derrubar o tamanho em KBs.
3. **Distribuição:** Move para `public/assets/sprites/enemies/`.
4. **Manifesto:** Altera automaticamente o `assetManifest.json` marcando `required: true`.
5. **Geração de Código (Boilerplate):** Injeta o `preload()` nas cenas necessárias, cria as declarações `this.anims.create()` (baseado no YAML) e constrói a classe inicial `Enemy<Nome>.ts` pronta para receber a lógica de IA.

---

## 4. Estrutura de Diretórios Futura

Para suportar esta funcionalidade na Fase 3, sugerimos:

```text
/tools
  /art-pipeline
    /generator
      generate-prompt.ts     # Lê YAML + ART_STYLE e gera o prompt
    /ingestion
      validate-sprite.ts     # Valida dimensões matemáticas e alpha
      pack-atlas.ts          # Opcional: Empacota vários assets em um JSON Atlas
      scaffold-code.ts       # Gera boilerplate (Classes, Preload, Anims)
    /specs
      ART_STYLE.md           # Regras absolutas
      /enemies
        blood_hound.yaml     # Ex: Definição (6 frames de walk, 4 de attack)
```

## 5. Próximos Passos (Fase 1 e 2)
Este documento fica congelado até a **Fase 3**. Durante a Fase 1 e 2 (provas de conceito e Vertical Slice), continuaremos usando assets limitados, shapes primitivos ou fallback procedural, focando o tempo de engenharia em Game Feel, Balanceamento e Estabilidade de Engine.
