import Phaser from 'phaser';

/**
 * AtmosphericTreeShader — WebGL2 Shader de alta performance integrado ao Phaser 4.2.1
 * 
 * Funcionalidades:
 * 1. Vertex Shader com distorção de vento realista:
 *    - Base do tronco / raízes (inTexCoord.y = 0.0) fixada estaticamente no solo.
 *    - Flexão elástica harmônica crescente em direção ao topo (inTexCoord.y = 1.0)
 *      simulando o balanço natural de galhos e copa sob rajadas de vento.
 * 
 * 2. Fragment Shader com Sombreamento Atmosférico:
 *    - Ambient Occlusion (AO) simulada: Oclusão radial no núcleo da copa e
 *      atenuação de luz difusa em cavidades inferiores e internas.
 *    - Gradiente de Iluminação Direcional: Cálculo de normais na folhagem a partir
 *      de diferenciais de luminância dos texels vizinhos (Half-Lambert) e
 *      realce de borda (rim highlights) no lado iluminado pelo luar/sol.
 *    - Color grading atmosférico: Névoa gótica fria sutil integrada na profundidade.
 */

export interface TreeShaderUniforms {
  windSpeed?: number;
  windStrength?: number;
  lightDirection?: [number, number];
  lightIntensity?: number;
  ambientOcclusion?: number;
  atmosphereColor?: [number, number, number];
  atmosphereFogDensity?: number;
}

export const ATMOSPHERIC_TREE_SHADER_NAME = 'AtmosphericTreeShader';

/**
 * Vertex Shader GLSL:
 * Realiza a deflexão horizontal senoidal ponderada no topo da quad,
 * ancorando rigidamente a base da árvore no solo.
 */
export const TREE_VERTEX_SHADER = `
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
varying float vWindSway;
varying float vHeight;

void main ()
{
    outTexCoord = inTexCoord;
    vHeight = inTexCoord.y;

    // inTexCoord.y varia de 0.0 (base da árvore/raiz) até 1.0 (topo da copa)
    // Curva quadrática garante ancoragem 100% rígida no solo (bendWeight = 0 na raiz)
    // e flexão suave com máxima deflexão elástica nos galhos superiores
    float bendWeight = inTexCoord.y * inTexCoord.y;

    // Superposição harmônica: onda base contínua + oscilação secundária estocástica
    float wave1 = sin(uTime * uWindSpeed);
    float wave2 = sin(uTime * (uWindSpeed * 2.15) + inPosition.x * 0.04) * 0.35;
    float totalSway = (wave1 + wave2) * uWindStrength * bendWeight;

    vWindSway = totalSway;

    vec2 pos = inPosition;
    pos.x += totalSway;

    gl_Position = uProjectionMatrix * vec4(pos, 1.0, 1.0);
}
`;

/**
 * Fragment Shader GLSL:
 * Aplica Ambient Occlusion (AO), Gradiente Direcional de Luz e Atmosfera Gótica.
 */
export const TREE_FRAGMENT_SHADER = `
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
varying float vWindSway;
varying float vHeight;

float getLuminance(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

void main ()
{
    // Micro-vibração das folhas no topo provocada por turbulência de vento de alta frequência
    vec2 uv = outTexCoord;
    float leafFlutter = sin(uTime * 5.2 + uv.y * 30.0 + uv.x * 22.0) * 0.0025 * vHeight;
    uv.x += leafFlutter;

    vec4 texColor = texture2D(uMainSampler, uv);

    // Descarta pixels totalmente transparentes para preservar a silhueta da árvore
    if (texColor.a < 0.02) {
        discard;
    }

    // 1. Ambient Occlusion (AO) Simulada:
    // (a) Gradiente vertical: As partes inferiores e o tronco recebem menos luz difusa da abóbada celeste
    float verticalAO = mix(1.0 - uAmbientOcclusion * 0.7, 1.0, smoothstep(0.0, 0.85, vHeight));
    
    // (b) Oclusão de núcleo: Folhagens internas próximas ao tronco central (x = 0.5) são mais densas
    float distFromCenter = abs(uv.x - 0.5) * 2.0;
    float coreAO = mix(1.0 - uAmbientOcclusion * 0.45, 1.0, smoothstep(0.0, 0.8, distFromCenter));
    float finalAO = verticalAO * coreAO;

    // 2. Gradiente de Iluminação Direcional (Directional Lighting Gradient):
    vec2 texel = vec2(1.0 / max(uResolution.x, 64.0), 1.0 / max(uResolution.y, 64.0));
    float lumCenter = getLuminance(texColor.rgb);
    float lumLeft   = getLuminance(texture2D(uMainSampler, uv - vec2(texel.x, 0.0)).rgb);
    float lumRight  = getLuminance(texture2D(uMainSampler, uv + vec2(texel.x, 0.0)).rgb);
    float lumUp     = getLuminance(texture2D(uMainSampler, uv + vec2(0.0, texel.y)).rgb);
    float lumDown   = getLuminance(texture2D(uMainSampler, uv - vec2(0.0, texel.y)).rgb);

    // Vetor normal estimado a partir do relevo e contraste dos clusters de folhas
    vec3 normal = normalize(vec3(lumLeft - lumRight, lumDown - lumUp, 0.55));
    vec3 lightDir3D = normalize(vec3(uLightDirection.x, -uLightDirection.y, 0.75));

    // Iluminação difusa estilo Half-Lambert para simular translucência orgânica de folhas
    float NdotL = dot(normal, lightDir3D);
    float diffuse = clamp(NdotL * 0.5 + 0.5, 0.0, 1.0);

    // Gradiente direcional macro na copa da árvore
    vec2 dirVec = normalize(uLightDirection);
    float macroDirLight = clamp(((uv.x - 0.5) * dirVec.x + (vHeight - 0.5) * dirVec.y) * 0.6 + 0.5, 0.35, 1.15);

    // Rim highlight nos galhos e folhagens superiores iluminados pelo luar/sol
    float rimLight = pow(clamp(1.0 - abs(uv.x - 0.5) * 1.5, 0.0, 1.0), 3.0) * vHeight * 0.22;

    // 3. Composição de Cor e Atmosfera:
    vec3 litColor = texColor.rgb * (finalAO * 0.55 + diffuse * macroDirLight * uLightIntensity * 0.65);
    litColor += vec3(rimLight * 0.25, rimLight * 0.3, rimLight * 0.35);

    // Mistura com a névoa atmosférica na profundidade (estilo floresta gótica sombria)
    vec3 finalColor = mix(litColor, uAtmosphereColor, uAtmosphereFogDensity * (1.0 - vHeight * 0.5));

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), texColor.a);
}
`;

/**
 * Cria a configuração ShaderQuadConfig para o Phaser 4.2.1
 */
export function createAtmosphericTreeShaderConfig(
  scene: Phaser.Scene,
  options?: TreeShaderUniforms,
  textureSize?: [number, number]
): Phaser.Types.GameObjects.Shader.ShaderQuadConfig {
  const windSpeed = options?.windSpeed ?? 1.8;
  const windStrength = options?.windStrength ?? 4.5;
  const lightDirection = options?.lightDirection ?? [0.55, -0.83];
  const lightIntensity = options?.lightIntensity ?? 0.85;
  const ambientOcclusion = options?.ambientOcclusion ?? 0.5;
  const atmosphereColor = options?.atmosphereColor ?? [0.06, 0.1, 0.12];
  const atmosphereFogDensity = options?.atmosphereFogDensity ?? 0.18;
  // uResolution precisa refletir o tamanho REAL da textura assada — usado
  // no fragment shader pra calcular o texel size da amostragem de AO/normal
  // (uResolution errado = amostras vizinhas na proporção errada = artefato
  // sutil de blur/distorção na iluminação direcional). Default 160x220
  // mantido só por compatibilidade com chamadas antigas sem esse argumento.
  const resolution = textureSize ?? [160, 220];

  return {
    name: ATMOSPHERIC_TREE_SHADER_NAME,
    shaderName: ATMOSPHERIC_TREE_SHADER_NAME,
    vertexSource: TREE_VERTEX_SHADER,
    fragmentSource: TREE_FRAGMENT_SHADER,
    initialUniforms: {
      uTime: 0,
      uResolution: resolution,
      uWindSpeed: windSpeed,
      uWindStrength: windStrength,
      uLightDirection: lightDirection,
      uLightIntensity: lightIntensity,
      uAmbientOcclusion: ambientOcclusion,
      uAtmosphereColor: atmosphereColor,
      uAtmosphereFogDensity: atmosphereFogDensity,
      uMainSampler: 0,
    },
    setupUniforms: (setUniform: (name: string, value: any) => void) => {
      // O Phaser 4 invoca setupUniforms antes do drawElements em cada frame
      const timeSec = (scene.time?.now || performance.now()) * 0.001;
      setUniform('uTime', timeSec);
      setUniform('uResolution', resolution);
      setUniform('uWindSpeed', windSpeed);
      setUniform('uWindStrength', windStrength);
      setUniform('uLightDirection', lightDirection);
      setUniform('uLightIntensity', lightIntensity);
      setUniform('uAmbientOcclusion', ambientOcclusion);
      setUniform('uAtmosphereColor', atmosphereColor);
      setUniform('uAtmosphereFogDensity', atmosphereFogDensity);
      setUniform('uMainSampler', 0);
    },
  };
}

/**
 * Fábrica de instâncias de Árvore Atmosférica:
 * Cria um Shader GameObject no Phaser 4 (quando WebGL está ativo) ou
 * realiza fallback transparente para um Sprite tradicional caso o renderer
 * seja Canvas ou esteja rodando em testes headless.
 */
export function createAtmosphericTree(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string,
  options?: TreeShaderUniforms
): Phaser.GameObjects.GameObject {
  const renderer = scene.game?.renderer as any;
  const isWebGL = renderer && renderer.isWebGL === true;

  if (isWebGL && typeof scene.add?.shader === 'function') {
    try {
      const tex = scene.textures.get(textureKey);
      const width = (tex as any)?.source?.[0]?.width || 160;
      const height = (tex as any)?.source?.[0]?.height || 220;

      const shaderConfig = createAtmosphericTreeShaderConfig(scene, options, [width, height]);
      const treeShader = scene.add.shader(
        shaderConfig,
        x,
        y - 15,
        width,
        height,
        [textureKey]
      );

      treeShader.setOrigin(0.5, 0.85);
      treeShader.setDepth(y + 5);
      return treeShader;
    } catch (e) {
      // Em caso de falha no pipeline do shader, faz fallback para Sprite
    }
  }

  // Fallback para Sprite convencional
  const treeSprite = scene.add.sprite(x, y - 15, textureKey);
  treeSprite.setOrigin(0.5, 0.85);
  if (typeof (treeSprite as any).setPixelArt === 'function') {
    (treeSprite as any).setPixelArt(true);
  }
  treeSprite.setDepth(y + 5);

  const gameScene = scene as any;
  if (gameScene.lightingSystem) {
    gameScene.lightingSystem.applyLightPipeline(treeSprite);
  }

  return treeSprite;
}
