import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

/**
 * LightingPolish (Fase 5 Final - Eixo A: Evolução Gráfica Avançada)
 * Efeitos de glow, flash de impacto crítico e iluminação refinada
 * Integra com LightingSystem e Phaser Light2D para criar atmosfera gótica imersiva.
 *
 * Bloom PostFX (docs/specs/11_VISUAL_POLISH_FRONTS.md, Frente 5 — 27/08): além
 * das luzes Light2D (que iluminam o CENÁRIO ao redor do sprite), objetos-chave
 * agora também recebem um filtro `Glow` (Phaser 4 Filters API,
 * `sprite.filters.internal.addGlow`) — o equivalente mais próximo a um Bloom
 * real que o Phaser 4 oferece (não existe `addBloom` nativo). Isso faz o
 * próprio sprite "vazar" luz/brilho, em vez de só clarear os tiles vizinhos.
 * Aplicado seletivamente (itens raros+, orbes, projéteis de magia, monstros de
 * elite/chefe, portal, cajado do jogador) para não gerar custo de GPU em toda
 * entidade da tela — ver `isBloomEnabled()` e `MAX_ACTIVE_BLOOM_TARGETS`.
 */

export interface GlowConfig {
  color: number; // hex color
  intensity: number; // 0-1
  radius: number; // pixels
  type: 'item' | 'monster' | 'spell' | 'portal' | 'damage';
}

// Corner case de performance (spec 11, Frente 5): limitar o nº de filtros Glow
// simultâneos evita gargalo de GPU em aparelhos móveis mais fracos quando a
// tela está cheia de projéteis/itens/monstros ao mesmo tempo.
const MAX_ACTIVE_BLOOM_TARGETS = 16;

export class LightingPolish {
  private scene: Phaser.Scene;
  private glowLights: Map<Phaser.GameObjects.GameObject, Phaser.GameObjects.Light> = new Map();
  private bloomTargets: Set<Phaser.GameObjects.Image> = new Set();

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
   * Verifica se o Bloom (filtro Glow por objeto) deve rodar: respeita a config
   * de performance do jogador (`postProcessingEnabled`/`lowPerformanceParticles`)
   * e o limite de instâncias simultâneas.
   */
  private isBloomEnabled(): boolean {
    try {
      const settings = useGameStore.getState().settings;
      if (settings.postProcessingEnabled === false) return false;
      if (settings.lowPerformanceParticles === true) return false;
    } catch {
      // Store indisponível (ex: em testes fora de contexto) — segue habilitado.
    }
    return this.bloomTargets.size < MAX_ACTIVE_BLOOM_TARGETS;
  }

  /**
   * Aplica o filtro Glow (Bloom) a um sprite emissivo. Idempotente: reaplicar
   * num sprite reciclado de ObjectPool limpa o filtro anterior antes, pra não
   * empilhar Glows de spells/cores diferentes no mesmo objeto reutilizado.
   */
  private applyBloomFilter(sprite: Phaser.GameObjects.Image, color: number, strength: number = 3): void {
    if (!sprite || !this.isBloomEnabled()) return;
    const filters = (sprite as any).filters;
    if (!filters || !filters.internal || typeof filters.internal.addGlow !== 'function') return;

    try {
      if (typeof filters.internal.clear === 'function') {
        filters.internal.clear();
      }
      filters.internal.addGlow(color, strength, 0, 1, false, 8, 12);
      this.bloomTargets.add(sprite);

      const removeBloom = () => {
        try {
          if (filters.internal && typeof filters.internal.clear === 'function') {
            filters.internal.clear();
          }
        } catch {
          // ignore
        }
        this.bloomTargets.delete(sprite);
      };
      sprite.once('destroy', removeBloom);
    } catch {
      // Filtro indisponível (renderer sem suporte, ex: Canvas) — a luz Light2D
      // já cobre parte do efeito, segue sem o Glow do sprite.
    }
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
      this.applyBloomFilter(sprite, config.color, config.intensity * 3);
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
   * Criar glow para orbes de HP / Mana / Gemas
   */
  public addCollectibleGlow(sprite: Phaser.GameObjects.Sprite, type: 'hp' | 'mana' | 'gem'): void {
    if (!sprite || !sprite.active) return;

    const collectibleGlows = {
      hp: { color: 0xef4444, intensity: 0.8, radius: 40 },
      mana: { color: 0x3b82f6, intensity: 0.85, radius: 40 },
      gem: { color: 0xf59e0b, intensity: 0.75, radius: 35 },
    };

    const config = collectibleGlows[type] || collectibleGlows.hp;
    this.addGlowEffect(sprite, config.color, config.intensity, config.radius);
    this.applyBloomFilter(sprite, config.color, config.intensity * 3);
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

    // Bloom só nos tiers mais fortes (elites/chefes/abominações) — aplicar em
    // todo mob comum geraria ruído visual e custo de GPU desnecessário.
    if (config.intensity >= 0.7) {
      this.applyBloomFilter(sprite, config.color, config.intensity * 2.5);
    }
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
    this.applyBloomFilter(sprite, config.color, config.intensity * 3);
  }

  /**
   * Criar aura de luz pulsante para portal das profundezas
   */
  public addPortalGlow(sprite: Phaser.GameObjects.Sprite): void {
    if (!sprite || !sprite.active) return;

    this.addGlowEffect(sprite, 0x06b6d4, 0.95, 80);
    this.applyBloomFilter(sprite, 0x06b6d4, 3.2);

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
   * Frente 8 (spec 11, 27/08) — pulso ambiente sutil para estruturas
   * interativas da campanha (Altar Ancestral): luz vermelha suave + leve
   * "respiração" de escala/alpha, sempre ativa desde a criação do objeto —
   * mais discreta que `addPortalGlow` (o altar é um marco de descoberta, não
   * um chamariz gritante). Chamar uma vez, na criação do sprite.
   */
  public addAltarGlow(sprite: Phaser.GameObjects.Image): void {
    if (!sprite || !sprite.active) return;

    const color = 0x990000; // vermelho sangue, tom do altar
    this.addGlowEffect(sprite, color, 0.5, 60);
    this.applyBloomFilter(sprite, color, 1.6);

    this.scene.tweens.add({
      targets: sprite,
      scale: { from: sprite.scale, to: sprite.scale * 1.045 },
      alpha: { from: 0.92, to: 1.0 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Frente 8 (spec 11, 27/08) — reage à proximidade do jogador: dentro do
   * raio de "sensor" (maior que o raio de descoberta efetivo), intensifica o
   * tint do altar pra um vermelho mais vivo conforme o jogador se aproxima —
   * um aviso visual de "há algo aqui" antes mesmo do texto de descoberta
   * aparecer. Chamar a cada frame com o `distanceRatio` (0 = em cima do
   * altar, 1 = na borda do raio de sensor ou além).
   */
  public updateAltarProximity(sprite: Phaser.GameObjects.Image, distanceRatio: number): void {
    if (!sprite || !sprite.active) return;
    // Clamp manual (não Phaser.Math.Clamp): tocar o namespace Phaser.Math em
    // runtime cascateia o carregamento de um chunk interno do bundle do
    // Phaser 4 que espera um `canvas.getContext('2d')` de verdade — quebra em
    // jsdom sem o pacote opcional `canvas` instalado (achado rodando `pnpm
    // test` de verdade, 27/08 — LightingPolish.test.ts passava antes desta
    // linha existir). Resultado idêntico, sem tocar o runtime do Phaser.
    const t = Math.max(0, Math.min(1, 1 - distanceRatio));
    const g = Math.round(255 - t * 153); // 255 (neutro) -> 102 conforme se aproxima
    const b = Math.round(255 - t * 153);
    sprite.setTint((0xff << 16) | (g << 8) | b);
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
   * Criar luz dinâmica pulsante para o cajado do Bloodmage
   */
  public addPlayerStaffGlow(sprite: Phaser.GameObjects.Sprite): void {
    if (!this.isLight2DActive() || !sprite) return;

    // A luz do cajado é um vermelho sangue vibrante
    const color = 0xef4444;
    const intensity = 0.8;
    const radius = 60;
    // Nota: propositalmente SEM `applyBloomFilter` aqui — o filtro Glow cobre o
    // sprite inteiro, então aplicá-lo no personagem completo (em vez de só na
    // ponta do cajado, como a luz Light2D já simula via offset) deixaria o
    // Bloodmage inteiro com um halo vermelho o tempo todo, pesado demais para
    // o sprite principal sempre visível em tela.

    try {
      // Posiciona a luz ligeiramente acima e à direita do centro do sprite, para simular a ponta do cajado
      const light = this.scene.lights.addLight(sprite.x + 8, sprite.y - 12, radius, color, intensity);
      this.glowLights.set(sprite, light);

      // Pulsação suave do cajado
      this.scene.tweens.add({
        targets: light,
        intensity: { from: 0.6, to: 0.9 },
        radius: { from: 55, to: 65 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const updatePosition = () => {
        if (sprite.active && light) {
          // Mantém o offset relativo (baseado no flipX se quisermos precisão, mas simplificando aqui)
          const offsetX = sprite.flipX ? -8 : 8;
          light.setPosition(sprite.x + offsetX, sprite.y - 12);
        }
      };
      this.scene.events.on('update', updatePosition);

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
      // Ignora
    }
  }

  /**
   * Criar flash de luz e glow para magias de área (Hellfire Nova, Syphon Soul, etc.)
   */
  public addAreaSpellGlow(
    x: number,
    y: number,
    spellType: 'hellfire_nova' | 'syphon_soul' | 'blood_ritual_circle' | 'crimson_scythe' | 'hemomancy_beam' | string,
    customRadius?: number,
    durationMs: number = 400
  ): void {
    if (!this.isLight2DActive()) return;

    const areaGlowConfigs: Record<string, { color: number; intensity: number; radius: number; ease?: string }> = {
      hellfire_nova: { color: 0xf97316, intensity: 1.6, radius: 220, ease: 'Quad.easeOut' },
      syphon_soul: { color: 0x9333ea, intensity: 1.3, radius: 160, ease: 'Sine.easeOut' },
      blood_ritual_circle: { color: 0xdc2626, intensity: 1.2, radius: 180, ease: 'Sine.easeInOut' },
      crimson_scythe: { color: 0xef4444, intensity: 1.4, radius: 140, ease: 'Cubic.easeOut' },
      hemomancy_beam: { color: 0xff2222, intensity: 1.5, radius: 150, ease: 'Quad.easeOut' },
    };

    const cfg = areaGlowConfigs[spellType] || { color: 0xef4444, intensity: 1.2, radius: 150, ease: 'Quad.easeOut' };
    const radius = customRadius || cfg.radius;

    try {
      const light = this.scene.lights.addLight(x, y, radius * 0.4, cfg.color, cfg.intensity);
      this.scene.tweens.add({
        targets: light,
        radius: radius,
        intensity: 0,
        duration: durationMs,
        ease: cfg.ease || 'Quad.easeOut',
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
    sprite: Phaser.GameObjects.Image,
    color: number,
    intensity: number,
    radius: number
  ): void {
    if (!this.isLight2DActive() || !sprite) return;

    try {
      const light = this.scene.lights.addLight(sprite.x, sprite.y, radius, color, intensity);
      this.glowLights.set(sprite, light);

      // Sincroniza a posição e visibilidade da luz quando o sprite for atualizado
      const updatePosition = () => {
        if (sprite.active && light) {
          light.setPosition(sprite.x, sprite.y);
          light.setVisible(sprite.visible);
        } else if (!sprite.active && light) {
          // Se o sprite foi desativado (ex: devolvido ao ObjectPool), remove a luz
          this.scene.events.off('update', updatePosition);
          try {
            this.scene.lights?.removeLight(light);
          } catch {
            // ignore
          }
          this.glowLights.delete(sprite);
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
