---
status: DISCOVERY - ROADMAP FUTURO
phase: Pós-Fase 5
priority: MÉDIA
target_date: Q4 2026 (após decisão de arte externa)
responsible: "TBD (quando orçamento de arte for aprovado)"
estimated_effort: "5-7 dias (após aprovação de sprites)"
dependencies: ["Fase 5 completa", "Orçamento de arte aprovado", "Direção artística definida"]
tags: [specs, discovery, assets, pipeline, performance, procedural-replacement]
---

# 🎨 Discovery: Eixo B — Pipeline de Integração de Assets Externos

> **Documento de Discovery** — Define como integrar arte externa (sprites, texturas, animações) sem quebrar o pipeline procedural já estabelecido.

---

## 📋 Contexto

**Fase 5** entregou Bloodmage 1995 com:
- ✅ 100% procedural (Canvas + Web Audio)
- ✅ LightingSystem + PostFXSystem
- ✅ 60+ FPS garantido
- ✅ Pronto para produção

**Eixo B** cobra: "E depois, quando quisermos arte externa?" Para a visão de UI híbrida do React com fatiamento de imagens (9-slice CSS) e a transição gradativa de áudio (Eixo C), consulte o documento de direcionamento macro em `[[02_DISCOVERY_UI_ASSETS_EXTERNOS.md]]`.

---

## 🎯 Objetivo

Estabelecer um **pipeline claro e não-destrutivo** para integrar arte externa (spritesheets, texturas, animações) que:
1. Mantenha fallback procedural funcional (compatibilidade)
2. Não quebre performance (<60 FPS)
3. Reutilize o sistema de ativos procedurais existente
4. Permitir substituição incremental por chave
5. Seja agnóstico à fonte (comprado vs criado internamente)

---

## 🏗️ Arquitetura Proposta

### 1️⃣ Sistema de Chaves de Ativos (Key-Based Replacement)

**Princípio:** Ambos os sistemas (procedural + arte externa) usam **mesmas chaves**.

```typescript
// Hoje: TextureGenerator gera tudo
const spriteTexture = textureGenerator.createSpriteTexture('player');

// Depois: AssetLoader tenta externa primeiro, fallback para procedural
const spriteTexture = assetLoader.getTexture('player');
  // → busca em /assets/sprites/
  // → se não encontrar → cria via TextureGenerator (fallback)
```

**Benefício:** Substituição transparente — nenhuma refatoração de código.

**Arquivos envolvidos:**
- `src/assets/assetLoader.ts` (novo)
- `src/assets/definitions.ts` (mapeamento de chaves)
- `src/utils/textureGenerator.ts` (mantém fallback)

### 2️⃣ Estrutura de Pastas

```
src/assets/
├── definitions.ts          # Mapeamento de chaves
├── assetLoader.ts          # Sistema de loading
├── sprites/
│   ├── player/
│   │   ├── player.png      # sprite base ou atlas
│   │   ├── player.json     # metadata (dimensões, offset, animações)
│   │   └── player.map      # normal map (opcional)
│   ├── enemies/
│   │   ├── skeleton_warrior.atlas.json
│   │   ├── skeleton_warrior.png
│   │   └── ...
│   └── ...
├── textures/               # backgrounds, texturas grandes
│   ├── dungeon-floor.webp
│   ├── dungeon-wall.webp
│   └── ...
├── animations/             # DragonBones ou Spine (futuro)
│   ├── player-walk.json
│   └── ...
└── config/
    ├── sprites.atlas.json  # atlas global (TexturePacker)
    └── sprites.map         # normal map atlas
```

### 3️⃣ Arquivo de Definições (Asset Manifest)

```typescript
// src/assets/definitions.ts

export const ASSET_DEFINITIONS = {
  sprites: {
    player: {
      key: 'player',
      source: 'sprites/player/player.png',
      metadata: 'sprites/player/player.json',
      type: 'sprite' | 'atlas',
      fallback: 'procedural', // se não encontrar, gera via textureGenerator
      normalMap: 'sprites/player/player.map',
    },
    skeleton_warrior: {
      key: 'spr_skeleton_warrior',
      source: 'sprites/enemies/skeleton_warrior.png',
      metadata: 'sprites/enemies/skeleton_warrior.json',
      type: 'atlas',
      fallback: 'procedural',
      animationId: 'anim_skeleton_warrior', // (opcional) DragonBones
    },
    // ... 50+ sprites
  },
  textures: {
    dungeon_floor: {
      key: 'dungeon-floor',
      source: 'textures/dungeon-floor.webp',
      fallback: 'procedural',
    },
    // ...
  },
};
```

### 4️⃣ Asset Loader (Sistema Central)

```typescript
// src/assets/assetLoader.ts

export class AssetLoader {
  private cache: Map<string, Texture> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Carregar asset (externa ou fallback procedural)
   */
  async getTexture(key: string): Promise<Texture> {
    // 1. Verificar cache
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const def = ASSET_DEFINITIONS.sprites[key];
    if (!def) {
      throw new Error(`Asset not found: ${key}`);
    }

    try {
      // 2. Tentar carregar externa
      const texture = await this.loadExternalTexture(def);
      this.cache.set(key, texture);
      return texture;
    } catch (e) {
      console.warn(`Failed to load ${key}, using fallback...`);

      // 3. Fallback para procedural
      if (def.fallback === 'procedural') {
        const texture = textureGenerator.createSpriteTexture(key);
        this.cache.set(key, texture);
        return texture;
      }

      throw e;
    }
  }

  /**
   * Carregar todas as assets de uma cena
   */
  async loadScene(sceneKey: string): Promise<void> {
    const sceneDefs = SCENE_ASSET_MANIFEST[sceneKey];
    if (!sceneDefs) return;

    // Lazy-load só os assets dessa cena
    await Promise.all(
      sceneDefs.map((key) => this.getTexture(key).catch(() => null))
    );
  }

  /**
   * Carregar externa (PNG, WebP, atlas)
   */
  private async loadExternalTexture(def: AssetDefinition): Promise<Texture> {
    // Carrega via Phaser.Loader
    return new Promise((resolve, reject) => {
      this.scene.load.image(def.key, def.source);
      this.scene.load.once('complete', () => {
        resolve(this.scene.textures.get(def.key));
      });
      this.scene.load.once('loaderror', (fileObj: any) => {
        // Envia log estruturado local e reporta para o Sentry de forma silenciosa
        console.error(`AssetLoader: Falha ao carregar ${def.key} de ${def.source}`);
        if ((window as any).Sentry) {
          (window as any).Sentry.captureException(new Error(`Asset load error: ${def.key}`), {
            tags: { system: 'asset-loader', asset_key: def.key }
          });
        }
        reject(fileObj);
      });
      this.scene.load.start();
    });
  }

  /**
   * Aplicar normal map (iluminação)
   */
  applyNormalMap(texture: Texture, normalMapKey: string): void {
    const normalMap = this.scene.textures.get(normalMapKey);
    if (normalMap) {
      // Phaser 4.2 suporta normal maps nativamente
      texture.setNormalMap(normalMap);
    }
  }
}
```

### 5️⃣ Lazy-Loading por Cena

```typescript
// src/assets/sceneManifest.ts

export const SCENE_ASSET_MANIFEST: Record<string, string[]> = {
  GameScene: [
    'player',
    'blood_bolt',
    'dungeon_floor',
    'dungeon_wall',
    'spr_skeleton_warrior',
    'spr_zombie_shambler',
    // ... 20-30 assets da cena
  ],
  MenuScene: [
    'ui_button',
    'ui_background',
    'ui_font_atlas',
  ],
  // ...
};

// Em GameScene.create():
await this.assetLoader.loadScene('GameScene');
// Carrega só o que é necessário
```

### 6️⃣ Integração em GameScene

```typescript
export class GameScene extends Phaser.Scene {
  private assetLoader: AssetLoader;

  constructor() {
    super('GameScene');
  }

  async preload() {
    // Carrega assets por cena
    this.assetLoader = new AssetLoader(this);
    await this.assetLoader.loadScene('GameScene');
  }

  create() {
    // Sprites usam a mesma API
    const player = this.add.sprite(512, 300, 'player');
    // ^ Funciona se 'player' veio de /assets/sprites/ ou TextureGenerator
  }
}
```

---

## 📦 Formatos de Arquivo Recomendados

### Sprites & UI

| Formato | Quando usar | Motivo |
|---------|-------------|--------|
| **PNG** | Sprites com transparência | Universal, bem comprimido |
| **WebP** | Todos (quando possível) | 40% menor que PNG |
| **Atlas JSON** | Múltiplos sprites | 1 draw call per atlas |

**Recomendação:** PNG com `pngquant` (40-70% menor).

### Texturas de Fundo

| Formato | Quando usar | Motivo |
|---------|-------------|--------|
| **WebP** | Todas (moderno) | ~40% menor, compressão melhor |
| **JPG** | Fallback (older browsers) | Compatibilidade |

### Animações

| Formato | Quando usar | Motivo |
|---------|-------------|--------|
| **JSON + Spritesheet** | Animações simples | Nativo no Phaser, sem dep. externas |
| **DragonBones JSON** | Animações complexas | Suporte nativo Phaser 4.2 |
| **Spine** | Futuro | Mais poderoso, mas pago |

---

## 🛠️ Ferramentas Recomendadas

### Geração de Assets

- **Sprites/Tileset:** Aseprite ($20) ou LibreSprite (free)
- **Texturas:** Substance Designer ou Krita + plugins
- **Atlas:** TexturePacker (commercial) ou Shoebox (free)
- **Normal Maps:** Laigter (free, standalone) ou NVIDIA Texture Tools

### Otimização

```bash
# Compressão PNG
pngquant 256 --speed 1 sprite.png -o sprite-compressed.png

# Converter para WebP
cwebp -q 80 texture.png -o texture.webp

# Validar atlas JSON
node scripts/validate-atlas.js sprites.atlas.json
```

### CI/CD

```yaml
# .github/workflows/asset-compression.yml
- name: Optimize images
  run: |
    pngquant 256 --speed 1 src/assets/sprites/**/*.png
    find src/assets -name "*.png" | xargs cwebp -q 80 -o
```

---

## 📊 Critérios de Aceite

- [ ] AssetLoader implementado e testado
- [ ] Fallback procedural funciona para 100% das chaves
- [ ] Lazy-loading por cena reduz bundle em 30%+
- [ ] Normal maps aplicados sem queda de FPS
- [ ] Pré-carregamento vs Streaming: decisão tomada
- [ ] Testes de performance: <60 FPS com assets externas
- [ ] Documentação para artistas (como exportar/preparar assets)

---

## 🎨 Fluxo de Substituição (Exemplo)

```
1. Artista cria sprite em Aseprite
   → Exporta como PNG + spritesheet JSON

2. Artista coloca em /src/assets/sprites/player/

3. AssetLoader detecta arquivo
   → Carrega em vez de gerar procedural

4. GameScene usa 'player' key
   → Obtém arte externa (transparente)

5. Se deletar arquivo:
   → AssetLoader volta para procedural
```

**Nenhuma mudança de código necessária.**

---

## 💰 Estimativa de Esforço

| Tarefa | Dias | Responsável |
|--------|------|-------------|
| AssetLoader + definições | 1 | Backend |
| Teste e otimização | 1 | QA |
| Documentação para artistas | 0.5 | Designer |
| **Total** | **2.5 dias** | |

(Assumindo que arte já foi criada/aprovada)

---

## ⚠️ Riscos & Mitigações

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Draw calls aumentam | Média | Usar atlas; validar com PerformanceMonitor |
| Fallback procedural lento | Média | Cache; pré-gerar texturas pesadas |
| Artistas exportam errado | Baixa | Validação de schema + documentação clara |
| Bundle cresce > 2.5MB | Média | Lazy-load; compressão agressiva |

---

## 🚀 Roadmap Integração

### Fase 1: Infra (1 semana após aprovação)
- AssetLoader + mapeamento de chaves
- Testes básicos de fallback
- CI/CD de compressão

### Fase 2: Integração (1-2 semanas)
- Integrar em GameScene
- Testes de performance
- Lazy-loading por cena

### Fase 3: Suporte a Artistas (ongoing)
- Documentação clara
- Template de exportação
- Validação automática

---

## 📝 Recomendação

**Iniciar quando:**
- Orçamento de arte for aprovado
- Direção artística definida
- Primeiro lote de sprites pronto

**Paralelização:** AssetLoader pode ser desenvolvido mesmo sem sprites prontos (testes com fallback).

---

**Próximas ações:**
1. Aguardar aprovação de Felipe
2. Quando aprovado: iniciar Eixo B + Eixo C em paralelo
3. Mover de `propostas/` para `andamento/` quando começar

---

Data: 2026-08-11  
Status: Discovery Completo  
Pronto para: Roadmap Pós-Fase 5
