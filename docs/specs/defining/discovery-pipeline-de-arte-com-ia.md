# Discovery: Pipeline de Arte Semi-Automatizado via IA (HuggingFace / ChatGPT)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** verificado: não implementado (verificado em 2026-10-10). `ls tools` (não existe); `grep -n "generate-prompt\|ingest-asset\|pngquant" package.json` (sem resultado); `find . -iname "*art_style*" -o -name "*.yaml"` (só `pnpm-workspace.yaml` e `lib/api-spec/openapi.yaml`, nenhum `spec.yaml` de inimigo nem `ART_STYLE.md`). Existe apenas ferramental correlato que não é o pipeline proposto: `src/game/assets/assetManifest.json` (campo `required`, 37 entradas, 19 `required: true`), `src/game/assets/assetManifest.ts` (`queueAssetLoading` com fallback procedural), `scripts/verify-assets.cjs` (valida cabeçalho e dimensões dos assets em `src/assets`, `public/assets`, `public/fonts`), `scripts/pixellab_client.cjs` e `scripts/fetch-spritecook-sprite.cjs` (clientes de geradores externos), `scripts/stitch_pixellab_bloodmage.cjs`. Risco encontrado: `scripts/pixellab_client.cjs` contém um token (`DEFAULT_TOKEN`) em texto no código.

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Uso de IA generativa como fonte de concepts com limpeza humana (Aseprite/Photoshop).
2. Scripts propostos `generate-prompt` e `ingest-asset` e a estrutura `tools/art-pipeline`.
3. Congelamento até a "Fase 3" (escala de produção).

---

## 1. O Conceito
Estabelecer um pipeline híbrido (Scripts + IA + Intervenção Humana) para escalar a produção de assets (personagens, inimigos, props) mantendo coesão visual (Gothic Retro 16-bit) e automatizando a integração do asset com a engine (Phaser) e o controle de estado do jogo.

O foco é parar de tratar a IA como "geradora de assets prontos" e passar a usá-la como **mecanismo de geração de concepts consistentes**, onde ferramentas Node.js assumem a integração e validação técnica.

---

## 2. Por que Não 100% Automático? (Riscos Técnicos)
IAs generativas atuais possuem três falhas críticas para pixel art funcional em engines de jogos:
1. **Inconsistência de "Pixel" (Grid Snap):** IAs geram imagens em alta resolução simulando pixel art. Fazer downscale algorítmico automatizado borra a imagem ou destrói a silhueta.
2. **Alinhamento de Frames (Jitter/Flicker):** Animações (SpriteSheets) precisam de âncoras perfeitas. Se o centro de massa variar 2 pixels de um frame para o outro, o personagem "tremerá" in-game (exemplo citado pelo texto original, `bloodmage.png`; não verificado).
3. **Dimensões e VRAM:** A engine hoje declara frames de tamanho fixo no manifesto (ex: 68x68 em `spr_bloodmage`; a proposta cita 64x64) compactados agressivamente para rodar no navegador web. 

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

## 4. Estrutura de diretórios proposta

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

## 5. Condição proposta de início

Proposta: manter este pipeline congelado até a "Fase 3" (escala de produção), usando até lá assets limitados, shapes primitivos ou fallback procedural (ver decisão 3).
