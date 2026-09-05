import { describe, it, expect, vi } from 'vitest';
import {
  ATMOSPHERIC_TREE_SHADER_NAME,
  TREE_VERTEX_SHADER,
  TREE_FRAGMENT_SHADER,
  createAtmosphericTreeShaderConfig,
  createAtmosphericTree,
} from './AtmosphericTreeShader';

describe('AtmosphericTreeShader (WebGL2 / Phaser 4.2.1)', () => {
  it('defines valid vertex and fragment shaders with GLSL WebGL2 precision and uniform semantics', () => {
    expect(TREE_VERTEX_SHADER).toContain('precision highp float');
    expect(TREE_VERTEX_SHADER).toContain('uniform mat4 uProjectionMatrix');
    expect(TREE_VERTEX_SHADER).toContain('uniform float uTime');
    expect(TREE_VERTEX_SHADER).toContain('uniform float uWindSpeed');
    expect(TREE_VERTEX_SHADER).toContain('uniform float uWindStrength');
    expect(TREE_VERTEX_SHADER).toContain('attribute vec2 inPosition');
    expect(TREE_VERTEX_SHADER).toContain('attribute vec2 inTexCoord');
    expect(TREE_VERTEX_SHADER).toContain('varying vec2 outTexCoord');
    expect(TREE_VERTEX_SHADER).toContain('varying float vWindSway');
    expect(TREE_VERTEX_SHADER).toContain('varying float vHeight');
    expect(TREE_VERTEX_SHADER).toContain('bendWeight');

    expect(TREE_FRAGMENT_SHADER).toContain('uniform sampler2D uMainSampler');
    expect(TREE_FRAGMENT_SHADER).toContain('uniform float uAmbientOcclusion');
    expect(TREE_FRAGMENT_SHADER).toContain('uniform vec2 uLightDirection');
    expect(TREE_FRAGMENT_SHADER).toContain('verticalAO');
    expect(TREE_FRAGMENT_SHADER).toContain('coreAO');
    expect(TREE_FRAGMENT_SHADER).toContain('macroDirLight');
    expect(TREE_FRAGMENT_SHADER).toContain('rimLight');
    expect(TREE_FRAGMENT_SHADER).toContain('gl_FragColor');
  });

  it('generates complete ShaderQuadConfig with initialUniforms and setupUniforms hook', () => {
    const mockScene: any = {
      time: { now: 5000 },
    };

    const config = createAtmosphericTreeShaderConfig(mockScene, {
      windSpeed: 2.5,
      windStrength: 6.0,
      lightDirection: [0.8, -0.6],
      ambientOcclusion: 0.6,
      atmosphereColor: [0.1, 0.15, 0.2],
    });

    expect(config.name).toBe(ATMOSPHERIC_TREE_SHADER_NAME);
    expect(config.vertexSource).toBe(TREE_VERTEX_SHADER);
    expect(config.fragmentSource).toBe(TREE_FRAGMENT_SHADER);
    expect(config.initialUniforms).toBeDefined();
    expect((config.initialUniforms as any).uWindSpeed).toBe(2.5);
    expect((config.initialUniforms as any).uWindStrength).toBe(6.0);
    expect((config.initialUniforms as any).uAmbientOcclusion).toBe(0.6);

    const uniformCalls: Record<string, any> = {};
    const setUniformMock = vi.fn((name: string, val: any) => {
      uniformCalls[name] = val;
    });

    if (config.setupUniforms) {
      config.setupUniforms(setUniformMock);
    }

    expect(setUniformMock).toHaveBeenCalled();
    expect(uniformCalls['uTime']).toBe(5.0);
    expect(uniformCalls['uWindSpeed']).toBe(2.5);
    expect(uniformCalls['uWindStrength']).toBe(6.0);
    expect(uniformCalls['uAmbientOcclusion']).toBe(0.6);
    expect(uniformCalls['uMainSampler']).toBe(0);
  });

  it('falls back to standard Sprite with lighting pipeline in headless or non-WebGL environments', () => {
    const mockSprite: any = {
      setOrigin: vi.fn().mockReturnThis(),
      setPixelArt: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };

    const mockScene: any = {
      game: { renderer: { isWebGL: false } },
      add: {
        sprite: vi.fn().mockReturnValue(mockSprite),
      },
      lightingSystem: {
        applyLightPipeline: vi.fn(),
      },
    };

    const result = createAtmosphericTree(mockScene, 400, 300, 'procedural_tree_0');

    expect(mockScene.add.sprite).toHaveBeenCalledWith(400, 285, 'procedural_tree_0');
    expect(mockSprite.setOrigin).toHaveBeenCalledWith(0.5, 0.85);
    expect(mockSprite.setPixelArt).toHaveBeenCalledWith(true);
    expect(mockSprite.setDepth).toHaveBeenCalledWith(305);
    expect(mockScene.lightingSystem.applyLightPipeline).toHaveBeenCalledWith(mockSprite);
    expect(result).toBe(mockSprite);
  });

  it('instantiates Shader GameObject when WebGL renderer and shader factory are available', () => {
    const mockShader: any = {
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };

    const mockScene: any = {
      game: { renderer: { isWebGL: true } },
      textures: {
        get: vi.fn().mockReturnValue({
          source: [{ width: 160, height: 220 }],
        }),
      },
      add: {
        shader: vi.fn().mockReturnValue(mockShader),
        sprite: vi.fn(),
      },
    };

    const result = createAtmosphericTree(mockScene, 500, 400, 'procedural_tree_1', {
      windSpeed: 2.0,
      ambientOcclusion: 0.55,
    });

    expect(mockScene.add.shader).toHaveBeenCalled();
    const shaderCallArgs = mockScene.add.shader.mock.calls[0];
    expect(shaderCallArgs[0].name).toBe(ATMOSPHERIC_TREE_SHADER_NAME);
    expect(shaderCallArgs[1]).toBe(500);
    expect(shaderCallArgs[2]).toBe(385);
    expect(shaderCallArgs[3]).toBe(160);
    expect(shaderCallArgs[4]).toBe(220);
    expect(shaderCallArgs[5]).toEqual(['procedural_tree_1']);
    expect(mockShader.setOrigin).toHaveBeenCalledWith(0.5, 0.85);
    expect(mockShader.setDepth).toHaveBeenCalledWith(405);
    expect(result).toBe(mockShader);
  });
});
