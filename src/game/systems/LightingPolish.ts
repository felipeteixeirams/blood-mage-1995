/**
 * LightingPolish (Fase 5 Final)
 * Efeitos de glow e iluminação refinada para polimento visual final
 * Integra com LightingSystem de Felipe para criar atmosfera imersiva
 */

export interface GlowConfig {
  color: number; // hex color
  intensity: number; // 0-1
  radius: number; // pixels
  type: 'item' | 'monster' | 'spell' | 'portal' | 'damage';
}

export class LightingPolish {
  private scene: Phaser.Scene;
  private glowSprites: Map<string, Phaser.GameObjects.Light> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Criar glow para item raro/épico/lendário
   */
  public addItemGlow(sprite: Phaser.GameObjects.Sprite, rarity: 'common' | 'rare' | 'epic' | 'legendary'): void {
    const glowConfigs = {
      common: { color: 0x888888, intensity: 0.3, radius: 20 },
      rare: { color: 0x3b82f6, intensity: 0.5, radius: 30 },
      epic: { color: 0xa855f7, intensity: 0.6, radius: 35 },
      legendary: { color: 0xf59e0b, intensity: 0.8, radius: 40 },
    };

    const config = glowConfigs[rarity];
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);

    // Pulsação leve para épico/lendário
    if (rarity === 'epic' || rarity === 'legendary') {
      this.scene.tweens.add({
        targets: sprite,
        scale: sprite.scale,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }
  }

  /**
   * Criar glow para monstro baseado em tipo
   */
  public addMonsterGlow(sprite: Phaser.GameObjects.Sprite, monsterType: string): void {
    const monsterGlows: Record<string, { color: number; intensity: number; radius: number }> = {
      // Tier 1 - Vermelho (sangue)
      skeleton_warrior: { color: 0xdc2626, intensity: 0.4, radius: 25 },
      zombie_shambler: { color: 0x16a34a, intensity: 0.35, radius: 20 },

      // Tier 2 - Roxo (sobrenatural)
      blood_specter: { color: 0xa855f7, intensity: 0.6, radius: 35 },
      hell_hound: { color: 0xf97316, intensity: 0.5, radius: 30 },

      // Tier 3 - Amarelo (mágico)
      werewolf_lycan: { color: 0xfbbf24, intensity: 0.55, radius: 32 },
      flesh_golem: { color: 0xf43f5e, intensity: 0.5, radius: 28 },

      // Boss - Branco (perigoso)
      gore_abomination: { color: 0xffffff, intensity: 0.8, radius: 45 },
    };

    const config = monsterGlows[monsterType] || { color: 0xff0000, intensity: 0.3, radius: 20 };
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);
  }

  /**
   * Criar glow para spell/magia sendo lançada
   */
  public addSpellGlow(sprite: Phaser.GameObjects.Sprite, spellType: string): void {
    const spellGlows: Record<string, { color: number; intensity: number; radius: number }> = {
      blood_bolt: { color: 0xdc2626, intensity: 0.7, radius: 40 },
      blood_wave: { color: 0xdc2626, intensity: 0.8, radius: 50 },
      blood_storm: { color: 0xdc2626, intensity: 0.9, radius: 60 },
      dark_bolt: { color: 0xa855f7, intensity: 0.7, radius: 35 },
    };

    const config = spellGlows[spellType] || { color: 0xff0000, intensity: 0.6, radius: 30 };
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);

    // Pulso de magia lançada
    this.scene.tweens.add({
      targets: sprite,
      alpha: sprite.alpha,
      duration: 300,
      yoyo: true,
      ease: 'Quad.out',
    });
  }

  /**
   * Criar glow para portal/transição
   */
  public addPortalGlow(sprite: Phaser.GameObjects.Sprite): void {
    this.addGlowEffect(sprite, 0x06b6d4, 0.7, 50);

    // Rotação contínua para portal
    this.scene.tweens.add({
      targets: sprite,
      rotation: sprite.rotation + Math.PI * 2,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  /**
   * Criar glow de impacto crítico (flash)
   */
  public addCriticalImpactGlow(x: number, y: number): void {
    const light = this.scene.lights.addLight(x, y, 100, 0xffff00, 1.2);

    this.scene.tweens.add({
      targets: light,
      intensity: 0,
      duration: 300,
      onComplete: () => {
        this.scene.lights.removeLight(light);
      },
    });
  }

  /**
   * Criar glow de morte (fade vermelho)
   */
  public addDeathGlow(x: number, y: number): void {
    const light = this.scene.lights.addLight(x, y, 150, 0xff0000, 1.5);

    this.scene.tweens.add({
      targets: light,
      intensity: 0,
      radius: 0,
      duration: 800,
      ease: 'Quad.out',
      onComplete: () => {
        this.scene.lights.removeLight(light);
      },
    });
  }

  /**
   * Efeito de "heal pulse" (verde)
   */
  public addHealGlow(x: number, y: number): void {
    const light = this.scene.lights.addLight(x, y, 80, 0x22c55e, 1.0);

    this.scene.tweens.add({
      targets: light,
      intensity: 0,
      radius: 150,
      duration: 500,
      ease: 'Quad.out',
      onComplete: () => {
        this.scene.lights.removeLight(light);
      },
    });
  }

  /**
   * Efeito de "level up" (glow branco + pulso)
   */
  public addLevelUpGlow(x: number, y: number): void {
    const light = this.scene.lights.addLight(x, y, 120, 0xffffff, 1.2);

    this.scene.tweens.add({
      targets: light,
      intensity: 0,
      radius: 200,
      duration: 700,
      ease: 'Quad.out',
      onComplete: () => {
        this.scene.lights.removeLight(light);
      },
    });
  }

  /**
   * Adicionar glow genérico a sprite
   */
  private addGlowEffect(
    sprite: Phaser.GameObjects.Sprite,
    color: number,
    intensity: number,
    radius: number
  ): void {
    const light = this.scene.lights.addLight(sprite.x, sprite.y, radius, color, intensity);

    // Sync com sprite
    this.scene.physics.world.on('worldbounds', () => {
      light.setPosition(sprite.x, sprite.y);
    });

    const spriteName = `glow_${Math.random()}`;
    this.glowSprites.set(spriteName, light);
  }

  /**
   * Remover glow de um sprite
   */
  public removeGlow(spriteId: string): void {
    const light = this.glowSprites.get(spriteId);
    if (light) {
      this.scene.lights.removeLight(light);
      this.glowSprites.delete(spriteId);
    }
  }

  /**
   * Ambient glow baseado em depth (profundidade do calabouço)
   */
  public setAmbientGlow(depth: number): void {
    // Quanto mais profundo, mais escuro (vermelho/roxo)
    const depthFactor = Math.min(depth / 25, 1); // 0 no andar 1, 1 no andar 25+

    const baseIntensity = 0.5;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.HexStringToColor('#ffffff'), // Branco nos andares iniciais
      Phaser.Display.Color.HexStringToColor('#6b0000'), // Vermelho escuro nos andares profundos
      1,
      depthFactor
    );

    // Aplicar como ambiente light se sistema de lights suportar
    // (dependente de implementação do LightingSystem de Felipe)
  }

  /**
   * Limpar todos os glows
   */
  public cleanup(): void {
    this.glowSprites.forEach((light) => {
      this.scene.lights.removeLight(light);
    });
    this.glowSprites.clear();
  }
}

export default LightingPolish;
