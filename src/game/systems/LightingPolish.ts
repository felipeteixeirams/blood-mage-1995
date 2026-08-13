import Phaser from 'phaser';

/**
 * LightingPolish (Fase 5 Final - Eixo A: Evolução Gráfica Avançada)
 * Efeitos de glow, flash de impacto crítico e iluminação refinada
 * Integra com LightingSystem e Phaser Light2D para criar atmosfera gótica imersiva.
 */

export interface GlowConfig {
  color: number; // hex color
  intensity: number; // 0-1
  radius: number; // pixels
  type: 'item' | 'monster' | 'spell' | 'portal' | 'damage';
}

export class LightingPolish {
  private scene: Phaser.Scene;
  private glowLights: Map<Phaser.GameObjects.GameObject, Phaser.GameObjects.Light> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Verifica se o sistema de luzes do Phaser está disponível e habilitado
   */
  private isLight2DActive(): boolean {
    return Boolean(
      this.scene &&
      this.scene.lights &&
      this.scene.lights.active
    );
  }

  /**
   * Criar glow para item raro/épico/lendário
   */
  public addItemGlow(sprite: Phaser.GameObjects.Sprite, rarity: 'common' | 'rare' | 'epic' | 'legendary'): void {
    if (!sprite || !sprite.active) return;

    const glowConfigs = {
      common: { color: 0x94a3b8, intensity: 0.35, radius: 24 },
      rare: { color: 0x3b82f6, intensity: 0.65, radius: 36 },
      epic: { color: 0xa855f7, intensity: 0.85, radius: 44 },
      legendary: { color: 0xf59e0b, intensity: 1.1, radius: 56 },
    };

    const config = glowConfigs[rarity] || glowConfigs.common;
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);

    // Pulsação de escala e brilho para itens raros, épicos e lendários
    if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
      this.scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale, to: sprite.scale * 1.18 },
        alpha: { from: 0.85, to: 1.0 },
        duration: rarity === 'legendary' ? 450 : 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Criar glow para monstro baseado em tipo e raridade (Elites/Chefes/Especiais)
   */
  public addMonsterGlow(sprite: Phaser.GameObjects.Sprite, monsterType: string): void {
    if (!sprite || !sprite.active) return;

    const monsterGlows: Record<string, { color: number; intensity: number; radius: number }> = {
      // Tier 1 - Sangue / Pútrido
      skeleton_warrior: { color: 0xdc2626, intensity: 0.4, radius: 28 },
      zombie_shambler: { color: 0x16a34a, intensity: 0.35, radius: 24 },
      cultist_acolyte: { color: 0x9333ea, intensity: 0.5, radius: 32 },

      // Tier 2 - Espectral / Fera
      blood_specter: { color: 0xa855f7, intensity: 0.75, radius: 45 },
      hell_hound: { color: 0xf97316, intensity: 0.6, radius: 36 },

      // Tier 3 - Licantropo / Golem
      werewolf_lycan: { color: 0xfbbf24, intensity: 0.7, radius: 40 },
      flesh_golem: { color: 0xf43f5e, intensity: 0.65, radius: 38 },

      // Chefes / Abominações
      gore_abomination: { color: 0xffffff, intensity: 1.2, radius: 70 },
      blood_overlord: { color: 0xff2222, intensity: 1.3, radius: 80 },
    };

    const config = monsterGlows[monsterType] || { color: 0xff3333, intensity: 0.4, radius: 30 };
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);
  }

  /**
   * Criar glow dinâmico para projétil / spell sendo lançado
   */
  public addSpellGlow(sprite: Phaser.GameObjects.Sprite, spellType: string): void {
    if (!sprite || !sprite.active) return;

    const spellGlows: Record<string, { color: number; intensity: number; radius: number }> = {
      blood_bolt: { color: 0xdc2626, intensity: 0.8, radius: 45 },
      blood_wave: { color: 0xef4444, intensity: 0.9, radius: 55 },
      blood_storm: { color: 0xb91c1c, intensity: 1.0, radius: 65 },
      dark_bolt: { color: 0xa855f7, intensity: 0.8, radius: 40 },
      hellfire_nova: { color: 0xf97316, intensity: 1.2, radius: 80 },
    };

    const config = spellGlows[spellType] || { color: 0xdc2626, intensity: 0.7, radius: 35 };
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);
  }

  /**
   * Criar aura de luz pulsante para portal das profundezas
   */
  public addPortalGlow(sprite: Phaser.GameObjects.Sprite): void {
    if (!sprite || !sprite.active) return;

    this.addGlowEffect(sprite, 0x06b6d4, 0.95, 80);

    // Pulso constante na aura do portal
    this.scene.tweens.add({
      targets: sprite,
      scale: { from: 1.15, to: 1.35 },
      alpha: { from: 0.85, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Criar flash de luz e glow para acerto crítico
   */
  public addCriticalImpactGlow(x: number, y: number): void {
    if (!this.isLight2DActive()) return;

    try {
      const light = this.scene.lights.addLight(x, y, 120, 0xffeb3b, 1.4);
      this.scene.tweens.add({
        targets: light,
        intensity: 0,
        radius: 160,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => {
          try {
            this.scene.lights?.removeLight(light);
          } catch {
            // Safe fallback
          }
        },
      });
    } catch {
      // Ignora silenciosamente se o limite de luzes do WebGL for atingido
    }
  }

  /**
   * Criar glow de morte violenta / dissolução
   */
  public addDeathGlow(x: number, y: number): void {
    if (!this.isLight2DActive()) return;

    try {
      const light = this.scene.lights.addLight(x, y, 140, 0x990000, 1.3);
      this.scene.tweens.add({
        targets: light,
        intensity: 0,
        radius: 20,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => {
          try {
            this.scene.lights?.removeLight(light);
          } catch {
            // Safe fallback
          }
        },
      });
    } catch {
      // Ignora silenciosamente se o limite for atingido
    }
  }

  /**
   * Efeito de pulso de cura (esmeralda / necromancia benéfica)
   */
  public addHealGlow(x: number, y: number): void {
    if (!this.isLight2DActive()) return;

    try {
      const light = this.scene.lights.addLight(x, y, 90, 0x10b981, 1.1);
      this.scene.tweens.add({
        targets: light,
        intensity: 0,
        radius: 170,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => {
          try {
            this.scene.lights?.removeLight(light);
          } catch {
            // Safe fallback
          }
        },
      });
    } catch {
      // Ignora silenciosamente se o limite for atingido
    }
  }

  /**
   * Efeito de Level-up com explosão de luz dourada
   */
  public addLevelUpGlow(x: number, y: number): void {
    if (!this.isLight2DActive()) return;

    try {
      const light = this.scene.lights.addLight(x, y, 130, 0xfef08a, 1.5);
      this.scene.tweens.add({
        targets: light,
        intensity: 0,
        radius: 240,
        duration: 850,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          try {
            this.scene.lights?.removeLight(light);
          } catch {
            // Safe fallback
          }
        },
      });
    } catch {
      // Ignora silenciosamente se o limite for atingido
    }
  }

  /**
   * Adiciona o light2D acoplado ao ciclo de vida do Sprite
   */
  private addGlowEffect(
    sprite: Phaser.GameObjects.Sprite,
    color: number,
    intensity: number,
    radius: number
  ): void {
    if (!this.isLight2DActive() || !sprite) return;

    try {
      const light = this.scene.lights.addLight(sprite.x, sprite.y, radius, color, intensity);
      this.glowLights.set(sprite, light);

      // Sincroniza a posição da luz quando o sprite for atualizado
      const updatePosition = () => {
        if (sprite.active && light) {
          light.setPosition(sprite.x, sprite.y);
        }
      };

      this.scene.events.on('update', updatePosition);

      // Desvincula e remove a luz automaticamente quando o sprite for destruído
      sprite.once('destroy', () => {
        this.scene.events.off('update', updatePosition);
        try {
          this.scene.lights?.removeLight(light);
        } catch {
          // ignore
        }
        this.glowLights.delete(sprite);
      });
    } catch {
      // Ignora falha de luzes secundárias
    }
  }

  /**
   * Limpar todos os glows ativos
   */
  public cleanup(): void {
    this.glowLights.forEach((light) => {
      try {
        this.scene.lights?.removeLight(light);
      } catch {
        // ignore
      }
    });
    this.glowLights.clear();
  }
}

export default LightingPolish;
