---
name: phaser-4-development
description: Diretrizes de arquitetura, renderização WebGL2, Dynamic Textures assadas (baking pattern), Shaders customizados (Vertex/Fragment GLSL), e otimização de 60 FPS para Phaser 4.2.1 no Bloodmage 1995.
---

# 🎮 Skill: Phaser 4.2.1 Game Development & WebGL2 Rendering

Esta skill ensina agentes de IA (como Claude Code) a arquitetar, desenvolver e otimizar recursos utilizando o **Phaser 4.2.1** com foco em renderização WebGL2 de alta performance, padrões de texturas procedurais assadas e shaders customizados no ecossistema do **Bloodmage 1995**.

---

## ⚡ 1. Arquitetura de Renderização WebGL2 no Phaser 4

O Phaser 4 reescreveu completamente o subsistema de renderização (`Phaser.Renderer.WebGL`) para tirar proveito nativo de **WebGL2**:
1. **Pipeline Baseado em RenderNodes e ShaderQuad**:
   - Objetos visuais customizados usam `ShaderQuad` (`Phaser.Renderer.WebGL.RenderNodes.ShaderQuad`), que gerencia buffers de vértices (VAOs), programas de shader compilados e amarração de texturas (`drawElements`).
2. **Ciclo de Uniforms com `setupUniforms`**:
   - Em vez de alterar uniforms manualmente a cada frame no código do jogo, o Phaser 4 invoca `gameObject.setupUniforms(setUniform, drawingContext)` diretamente antes de cada chamada `gl.drawElements`.
3. **Fim dos Pipelines Legados do Phaser 3**:
   - Não tente herdar ou instanciar classes antigas do Phaser 3 (como pipelines multi-pass herdados de `WebGLPipeline`). No Phaser 4, use `Phaser.GameObjects.Shader` ou render nodes do tipo `BaseFilterShader`.

---

## 🌲 2. O Padrão de Ouro: Texturas Dinâmicas Assadas ("Baking Pattern")

### ❌ O Anti-Padrão (Destruidor de Performance)
```typescript
// 🚫 NUNCA FAÇA ISSO: Desenhar gráficos no update() ou instanciar dezenas de Graphics na cena
update() {
  const g = this.add.graphics();
  g.lineStyle(2, 0x5c4033);
  g.lineTo(...); // Desenha árvore fractal a cada 16ms
}
```
*Problema:* Gera centenas de draw calls, destrói o batch do WebGL2 e causa stutter severo de Garbage Collection (GC).

### ✅ O Padrão Profissional do Phaser 4 (Bake Once, Render Millions)
Gere a geometria fractal ou arte procedural **uma única vez** em uma `DynamicTexture` na memória de vídeo e trate-a como um `Sprite` ou passe-a como textura para um `Shader`:

```typescript
// 1. Cria a textura dinâmica no WebGL2
const texKey = 'procedural_tree_0';
const treeTexture = this.scene.textures.addDynamicTexture(texKey, 160, 220);

// 2. Cria o container efêmero de desenho
const g = this.scene.add.graphics();

// 3. Executa os algoritmos generativos (fractais, ruído, etc.)
this.drawProceduralAsset(g, 80, 175);

// 4. "Assa" (bake) na textura da GPU e destrói o Graphics efêmero
if (treeTexture.draw && treeTexture.render) {
  treeTexture.draw(g);
  treeTexture.render();
}
g.destroy();

// 5. Instanciação leve e de alta performance
const treeSprite = this.scene.add.sprite(x, y, texKey);
treeSprite.setOrigin(0.5, 0.85);
treeSprite.setDepth(y + 5);
```

---

## 🎨 3. Shaders Customizados no Phaser 4 (Vento + Sombreamento Atmosférico)

Para aplicar efeitos de vento contínuo nos galhos superiores e iluminação dinâmica/oclusão de ambiente (AO), utilize um `Phaser.GameObjects.Shader` com shaders GLSL dedicados.

### A. Vertex Shader com Ancoragem de Solo e Distorção de Vento
```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform mat4 uProjectionMatrix;
uniform float uTime;
uniform float uWindSpeed;
uniform float uWindStrength;

attribute vec2 inPosition;
attribute vec2 inTexCoord;

varying vec2 outTexCoord;
varying float vHeight;

void main ()
{
    outTexCoord = inTexCoord;
    vHeight = inTexCoord.y;

    // inTexCoord.y varia de 0.0 (base da raiz) a 1.0 (copa mais alta)
    // Curva quadrática garante raiz estática no chão e balanço suave na copa
    float bendWeight = inTexCoord.y * inTexCoord.y;

    // Superposição harmônica: onda longa lenta + rajadas de alta frequência
    float wave1 = sin(uTime * uWindSpeed);
    float wave2 = sin(uTime * (uWindSpeed * 2.15) + inPosition.x * 0.04) * 0.35;
    float totalSway = (wave1 + wave2) * uWindStrength * bendWeight;

    vec2 pos = inPosition;
    pos.x += totalSway;

    gl_Position = uProjectionMatrix * vec4(pos, 1.0, 1.0);
}
```

### B. Fragment Shader com Ambient Occlusion (AO) e Iluminação Direcional
```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uLightDirection;
uniform float uLightIntensity;
uniform float uAmbientOcclusion;
uniform vec3 uAtmosphereColor;
uniform float uAtmosphereFogDensity;

varying vec2 outTexCoord;
varying float vHeight;

float getLuminance(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

void main ()
{
    // Micro-flutter nas folhas superiores provocado pelo vento
    vec2 uv = outTexCoord;
    float leafFlutter = sin(uTime * 5.2 + uv.y * 30.0 + uv.x * 22.0) * 0.0025 * vHeight;
    uv.x += leafFlutter;

    vec4 texColor = texture2D(uMainSampler, uv);
    if (texColor.a < 0.02) discard;

    // 1. Ambient Occlusion (AO) simulada:
    // Gradiente vertical (base recebe menos luz difusa)
    float verticalAO = mix(1.0 - uAmbientOcclusion * 0.7, 1.0, smoothstep(0.0, 0.85, vHeight));
    // Oclusão radial no núcleo da copa (tronco e folhagem interna mais densos)
    float distFromCenter = abs(uv.x - 0.5) * 2.0;
    float coreAO = mix(1.0 - uAmbientOcclusion * 0.45, 1.0, smoothstep(0.0, 0.8, distFromCenter));
    float finalAO = verticalAO * coreAO;

    // 2. Gradiente de Iluminação Direcional:
    vec2 texel = vec2(1.0 / max(uResolution.x, 64.0), 1.0 / max(uResolution.y, 64.0));
    float lumCenter = getLuminance(texColor.rgb);
    float lumLeft   = getLuminance(texture2D(uMainSampler, uv - vec2(texel.x, 0.0)).rgb);
    float lumRight  = getLuminance(texture2D(uMainSampler, uv + vec2(texel.x, 0.0)).rgb);
    float lumUp     = getLuminance(texture2D(uMainSampler, uv + vec2(0.0, texel.y)).rgb);
    float lumDown   = getLuminance(texture2D(uMainSampler, uv - vec2(0.0, texel.y)).rgb);

    vec3 normal = normalize(vec3(lumLeft - lumRight, lumDown - lumUp, 0.55));
    vec3 lightDir3D = normalize(vec3(uLightDirection.x, -uLightDirection.y, 0.75));

    // Half-Lambert difuso para translucência orgânica
    float NdotL = dot(normal, lightDir3D);
    float diffuse = clamp(NdotL * 0.5 + 0.5, 0.0, 1.0);

    // Gradiente macro na copa + Rim highlight nos ramos superiores
    vec2 dirVec = normalize(uLightDirection);
    float macroDirLight = clamp(((uv.x - 0.5) * dirVec.x + (vHeight - 0.5) * dirVec.y) * 0.6 + 0.5, 0.35, 1.15);
    float rimLight = pow(clamp(1.0 - abs(uv.x - 0.5) * 1.5, 0.0, 1.0), 3.0) * vHeight * 0.22;

    vec3 litColor = texColor.rgb * (finalAO * 0.55 + diffuse * macroDirLight * uLightIntensity * 0.65);
    litColor += vec3(rimLight * 0.25, rimLight * 0.3, rimLight * 0.35);

    // Atmosfera e névoa gótica na profundidade
    vec3 finalColor = mix(litColor, uAtmosphereColor, uAtmosphereFogDensity * (1.0 - vHeight * 0.5));

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), texColor.a);
}
```

### C. Configuração no Phaser 4 (`ShaderQuadConfig` e `setupUniforms`)
```typescript
const shaderConfig: Phaser.Types.GameObjects.Shader.ShaderQuadConfig = {
  name: 'AtmosphericTreeShader',
  vertexSource: TREE_VERTEX_SHADER,
  fragmentSource: TREE_FRAGMENT_SHADER,
  initialUniforms: {
    uTime: 0,
    uResolution: [160, 220],
    uWindSpeed: 1.8,
    uWindStrength: 4.5,
    uLightDirection: [0.6, -0.8],
    uLightIntensity: 0.85,
    uAmbientOcclusion: 0.5,
    uAtmosphereColor: [0.06, 0.1, 0.12],
    uAtmosphereFogDensity: 0.18,
    uMainSampler: 0,
  },
  setupUniforms: (setUniform: (name: string, value: any) => void) => {
    // Chamado pelo Phaser 4 imediatamente antes do drawElements
    const timeSec = (scene.time?.now || performance.now()) * 0.001;
    setUniform('uTime', timeSec);
    setUniform('uResolution', [160, 220]);
    setUniform('uWindSpeed', 1.8);
    setUniform('uWindStrength', 4.5);
    setUniform('uLightDirection', [0.6, -0.8]);
    setUniform('uLightIntensity', 0.85);
    setUniform('uAmbientOcclusion', 0.5);
    setUniform('uAtmosphereColor', [0.06, 0.1, 0.12]);
    setUniform('uAtmosphereFogDensity', 0.18);
    setUniform('uMainSampler', 0);
  },
};

// Instanciação:
const treeShader = scene.add.shader(shaderConfig, x, y, 160, 220, [textureKey]);
treeShader.setOrigin(0.5, 0.85);
treeShader.setDepth(y + 5);
```

---

## 🛡️ 4. Padrão Defensivo de Fallback (Headless & Testes Vitest)

Em testes de backend/Vitest ou ambientes sem WebGL ativo, shaders falham ao inicializar programas de GPU. **Sempre implemente fallback transparente:**

```typescript
export function createAtmosphericTree(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string
): Phaser.GameObjects.GameObject {
  const renderer = scene.game?.renderer as any;
  const isWebGL = renderer && renderer.isWebGL === true;

  if (isWebGL && typeof scene.add?.shader === 'function') {
    try {
      const shader = scene.add.shader(shaderConfig, x, y - 15, width, height, [textureKey]);
      shader.setOrigin(0.5, 0.85);
      shader.setDepth(y + 5);
      return shader;
    } catch (e) {
      // Falha graciosa para sprite
    }
  }

  // Fallback seguro para Sprite tradicional com pipeline de iluminação Light2D
  const sprite = scene.add.sprite(x, y - 15, textureKey);
  sprite.setOrigin(0.5, 0.85);
  sprite.setDepth(y + 5);
  (scene as any).lightingSystem?.applyLightPipeline(sprite);
  return sprite;
}
```

---

## 📐 5. Ordenação de Profundidade Isométrica (Z-Sorting)

Tanto `Phaser.GameObjects.Sprite` quanto `Phaser.GameObjects.Shader` implementam o componente `Phaser.GameObjects.Components.Depth`.
No `GameScene.ts`:
```typescript
// No loop update ou ao adicionar na cena:
this.depthGroup.add(gameObject);

// O Z-sorting do Bloodmage 1995 avalia:
gameObject.setDepth(gameObject.y);
```
Para árvores e objetos altos, ajuste o ponto de contato com o chão utilizando `setOrigin(0.5, 0.85)` (onde `0.85` representa o pé do tronco).

---

## 🚨 6. Regras Críticas de Arquitetura no Bloodmage 1995

1. **Nunca crie UI dentro do Canvas Phaser**:
   - É estritamente proibido usar `this.add.text`, `this.add.dom` ou retângulos interativos para menus, botões ou HUDs.
   - Toda UI pertence à camada React 19 (`src/components/`) com Tailwind CSS sobre o canvas.
2. **Ponte de Comunicação Decoupled**:
   - Use o store Zustand (`src/store/gameStore.ts`) para transferir comandos do React para o Phaser (padrão Comando + Reset) e eventos do Phaser para o React.
3. **Validação Contínua com Testes**:
   - Rode sempre `npm test` e `npm run typecheck` (`pnpm verify`) após qualquer alteração no pipeline de renderização.
