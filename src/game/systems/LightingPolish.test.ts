import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LightingPolish } from './LightingPolish';
import { useGameStore } from '../../store/gameStore';

function makeMockScene() {
  const lights = {
    active: true,
    addLight: vi.fn((x: number, y: number, radius: number, color: number, intensity: number) => ({
      x, y, radius, color, intensity,
      setPosition: vi.fn(),
    })),
    removeLight: vi.fn(),
  };

  const tweens = {
    add: vi.fn(() => ({})),
  };

  const events = {
    on: vi.fn(),
    off: vi.fn(),
  };

  const scene = {
    lights,
    tweens,
    events,
  };

  return { scene, lights, tweens, events };
}

// Sprite mock com a Filters API do Phaser 4 (`sprite.filters.internal.addGlow`),
// usada pelo Bloom (spec 11, Frente 5 — ver LightingPolish.ts).
function makeBloomSprite(overrides: Partial<{ x: number; y: number }> = {}) {
  const addGlow = vi.fn();
  const clear = vi.fn();
  const setTint = vi.fn(function (this: any, t: number) { this.tint = t; return this; });
  return {
    x: overrides.x ?? 10,
    y: overrides.y ?? 20,
    scale: 1,
    tint: 0xffffff,
    active: true,
    once: vi.fn(),
    filters: { internal: { addGlow, clear } },
    setTint,
    __addGlow: addGlow,
    __clear: clear,
    __setTint: setTint,
  } as any;
}

const initialSettings = useGameStore.getState().settings;

describe('LightingPolish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({ settings: { ...initialSettings, postProcessingEnabled: true, lowPerformanceParticles: false } });
  });

  it('adiciona glow ao item e inicia pulsação para itens raros/épicos/lendários', () => {
    const { scene, lights, tweens } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 100,
      y: 200,
      scale: 1,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addItemGlow(mockSprite, 'epic');
    expect(lights.addLight).toHaveBeenCalledWith(100, 200, 44, 0xa855f7, 0.85);
    expect(tweens.add).toHaveBeenCalled();
  });

  it('adiciona glow a monstro baseado no tipo', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 50,
      y: 80,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addMonsterGlow(mockSprite, 'blood_specter');
    expect(lights.addLight).toHaveBeenCalledWith(50, 80, 45, 0xa855f7, 0.75);
  });

  it('dispara flash de luz em impacto crítico', () => {
    const { scene, lights, tweens } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    polish.addCriticalImpactGlow(150, 250);
    expect(lights.addLight).toHaveBeenCalledWith(150, 250, 120, 0xffeb3b, 1.4);
    expect(tweens.add).toHaveBeenCalled();
  });

  it('dispara pulso de cura e level up', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    polish.addHealGlow(200, 300);
    expect(lights.addLight).toHaveBeenCalledWith(200, 300, 90, 0x10b981, 1.1);

    polish.addLevelUpGlow(200, 300);
    expect(lights.addLight).toHaveBeenCalledWith(200, 300, 130, 0xfef08a, 1.5);
  });

  it('adiciona glow a orbes de hp/mana/gemas', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 75,
      y: 125,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addCollectibleGlow(mockSprite, 'hp');
    expect(lights.addLight).toHaveBeenCalledWith(75, 125, 40, 0xef4444, 0.8);

    polish.addCollectibleGlow(mockSprite, 'mana');
    expect(lights.addLight).toHaveBeenCalledWith(75, 125, 40, 0x3b82f6, 0.85);
  });

  it('dispara luz de área para magias (Hellfire Nova, Syphon Soul, etc.)', () => {
    const { scene, lights, tweens } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    polish.addAreaSpellGlow(120, 180, 'hellfire_nova', 220, 400);
    expect(lights.addLight).toHaveBeenCalledWith(120, 180, 88, 0xf97316, 1.6);
    expect(tweens.add).toHaveBeenCalled();
  });

  it('limpa todas as luzes com cleanup()', () => {
    const { scene, lights } = makeMockScene();
    const polish = new LightingPolish(scene as any);

    const mockSprite = {
      x: 50,
      y: 80,
      active: true,
      once: vi.fn(),
    } as any;

    polish.addMonsterGlow(mockSprite, 'skeleton_warrior');
    polish.cleanup();
    expect(lights.removeLight).toHaveBeenCalled();
  });

  describe('Bloom PostFX (spec 11, Frente 5 — filtro Glow por sprite)', () => {
    it('aplica o filtro Glow em item épico/lendário, além da luz Light2D', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addItemGlow(sprite, 'legendary');
      expect(sprite.__addGlow).toHaveBeenCalledWith(0xf59e0b, expect.any(Number), 0, 1, false, 8, 12);
    });

    it('NÃO aplica Glow em item comum (só a luz Light2D)', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addItemGlow(sprite, 'common');
      expect(sprite.__addGlow).not.toHaveBeenCalled();
    });

    it('aplica Glow em orbes coletáveis e em projétil de magia', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const orbSprite = makeBloomSprite();
      const spellSprite = makeBloomSprite();

      polish.addCollectibleGlow(orbSprite, 'mana');
      expect(orbSprite.__addGlow).toHaveBeenCalled();

      polish.addSpellGlow(spellSprite, 'blood_bolt');
      expect(spellSprite.__addGlow).toHaveBeenCalled();
    });

    it('aplica Glow só em monstros de tier alto (elite/chefe), não em mobs comuns', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const bossSprite = makeBloomSprite();
      const trashSprite = makeBloomSprite();

      polish.addMonsterGlow(bossSprite, 'gore_abomination');
      expect(bossSprite.__addGlow).toHaveBeenCalled();

      polish.addMonsterGlow(trashSprite, 'zombie_shambler');
      expect(trashSprite.__addGlow).not.toHaveBeenCalled();
    });

    it('NÃO aplica Glow no cajado do jogador (evita halo no personagem inteiro)', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addPlayerStaffGlow(sprite);
      expect(sprite.__addGlow).not.toHaveBeenCalled();
    });

    it('respeita postProcessingEnabled=false (desliga o Bloom)', () => {
      useGameStore.setState({ settings: { ...useGameStore.getState().settings, postProcessingEnabled: false } });
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addSpellGlow(sprite, 'blood_bolt');
      expect(sprite.__addGlow).not.toHaveBeenCalled();
    });

    it('respeita lowPerformanceParticles=true (desliga o Bloom em aparelhos fracos)', () => {
      useGameStore.setState({ settings: { ...useGameStore.getState().settings, lowPerformanceParticles: true } });
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addSpellGlow(sprite, 'blood_bolt');
      expect(sprite.__addGlow).not.toHaveBeenCalled();
    });

    it('limpa o filtro Glow anterior antes de reaplicar (sprite reciclado do ObjectPool)', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addSpellGlow(sprite, 'blood_bolt');
      polish.addSpellGlow(sprite, 'hellfire_nova');
      expect(sprite.__clear).toHaveBeenCalledTimes(2);
      expect(sprite.__addGlow).toHaveBeenCalledTimes(2);
    });

    it('respeita o teto MAX_ACTIVE_BLOOM_TARGETS de filtros simultâneos', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);

      const sprites = Array.from({ length: 20 }, () => makeBloomSprite());
      sprites.forEach((sprite) => polish.addSpellGlow(sprite, 'blood_bolt'));

      const appliedCount = sprites.filter((s) => s.__addGlow.mock.calls.length > 0).length;
      expect(appliedCount).toBe(16);
    });
  });

  describe('Altar Ancestral (spec 11, Frente 8 — pulso ambiente e proximidade)', () => {
    it('addAltarGlow adiciona luz vermelha suave, Glow e tween de "respiração" contínuo', () => {
      const { scene, lights, tweens } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.addAltarGlow(sprite);

      expect(lights.addLight).toHaveBeenCalledWith(sprite.x, sprite.y, 60, 0x990000, 0.5);
      expect(sprite.__addGlow).toHaveBeenCalledWith(0x990000, expect.any(Number), 0, 1, false, 8, 12);
      expect(tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: sprite,
          duration: 1600,
          yoyo: true,
          repeat: -1,
        })
      );
    });

    it('addAltarGlow não faz nada em sprite inativo/nulo', () => {
      const { scene, lights, tweens } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();
      sprite.active = false;

      polish.addAltarGlow(sprite);
      expect(lights.addLight).not.toHaveBeenCalled();
      expect(tweens.add).not.toHaveBeenCalled();
    });

    it('updateAltarProximity intensifica o tint pra vermelho vivo quando o jogador está perto (distanceRatio baixo)', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.updateAltarProximity(sprite, 0); // em cima do altar
      expect(sprite.__setTint).toHaveBeenCalledWith(0xff6666); // g=b=102 (0x66)
    });

    it('updateAltarProximity mantém o tint neutro na borda do raio de sensor (distanceRatio 1)', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.updateAltarProximity(sprite, 1);
      expect(sprite.__setTint).toHaveBeenCalledWith(0xffffff);
    });

    it('updateAltarProximity ignora ratio fora de [0,1] (clamp) e sprite inativo', () => {
      const { scene } = makeMockScene();
      const polish = new LightingPolish(scene as any);
      const sprite = makeBloomSprite();

      polish.updateAltarProximity(sprite, -5);
      expect(sprite.__setTint).toHaveBeenCalledWith(0xff6666); // clamp -> 0, igual ao caso "em cima do altar"

      const inactiveSprite = makeBloomSprite();
      inactiveSprite.active = false;
      polish.updateAltarProximity(inactiveSprite, 0);
      expect(inactiveSprite.__setTint).not.toHaveBeenCalled();
    });
  });
});
