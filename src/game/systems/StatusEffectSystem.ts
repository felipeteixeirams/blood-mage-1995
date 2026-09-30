import Phaser from 'phaser';

export type CombatStatusType = 'burning' | 'frozen' | 'cursed' | 'poison' | 'bleeding';

export interface ActiveStatusEffect {
  type: CombatStatusType;
  durationMs: number;
  remainingMs: number;
  dps: number;
  tickTimer: number;
  tickIntervalMs: number;
  auraSprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
}

export interface StatusTarget extends Phaser.GameObjects.GameObject {
  x: number;
  y: number;
  active: boolean;
  hp?: number;
  maxHp?: number;
  takeDamage?: (amount: number, sourceX?: number, sourceY?: number, isCrit?: boolean, isExecution?: boolean) => boolean;
  setTint?: (tint: number) => this;
  clearTint?: () => this;
  applyBaseTint?: () => void;
  anims?: {
    pause: () => void;
    resume: () => void;
    isPlaying?: boolean;
    timeScale?: number;
  };
}

/**
 * StatusEffectSystem (Spec 10 — Parte 3: Shaders & Efeitos de Status)
 * Gerencia efeitos de status elementais e necromânticos em tempo real para Inimigos e Jogador:
 * - Burning: Chamas de brasas, dissolve térmico, dano periódico contínuo.
 * - Frozen: Cristalização gélida, desaceleração/congelamento total de animação e movimento.
 * - Cursed: Halo de fogo negro e deslocamento senoidal, vulnerabilidade amplificada (+25% de dano recebido).
 * - Poison / Bleeding: DoT e descarte de gotas corrosivas/hemáticas.
 */
export class StatusEffectSystem {
  private scene: Phaser.Scene;
  private targetStatuses: Map<StatusTarget, Map<CombatStatusType, ActiveStatusEffect>> = new Map();
  private emberEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private frostEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private darkFlameEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initEmitters();
  }

  private initEmitters(): void {
    if (!this.scene.add || !this.scene.textures) return;

    if (this.scene.textures.exists('particle_ember_spark')) {
      this.emberEmitter = this.scene.add.particles(0, 0, 'particle_ember_spark', {
        speedY: { min: -50, max: -90 },
        speedX: { min: -25, max: 25 },
        scale: { start: 1.0, end: 0.2 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 450,
        emitting: false,
      }).setDepth(1850);
    }

    if (this.scene.textures.exists('particle_frost_crystal')) {
      this.frostEmitter = this.scene.add.particles(0, 0, 'particle_frost_crystal', {
        speedY: { min: -15, max: 20 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.9, end: 0.1 },
        alpha: { start: 0.85, end: 0 },
        lifespan: 550,
        emitting: false,
      }).setDepth(1850);
    }

    if (this.scene.textures.exists('particle_dark_flame')) {
      this.darkFlameEmitter = this.scene.add.particles(0, 0, 'particle_dark_flame', {
        speedY: { min: -35, max: -70 },
        speedX: { min: -15, max: 15 },
        scale: { start: 1.1, end: 0.3 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 600,
        emitting: false,
      }).setDepth(1850);
    }
  }

  /**
   * Aplica ou renova um efeito de status no alvo
   */
  public applyStatus(
    target: StatusTarget,
    type: CombatStatusType,
    durationMs: number = 3000,
    dps: number = 10
  ): void {
    if (!target || !target.active) return;

    let targetMap = this.targetStatuses.get(target);
    if (!targetMap) {
      targetMap = new Map();
      this.targetStatuses.set(target, targetMap);

      // Ouvir evento de destruição do target para liberar memória
      target.once('destroy', () => {
        this.clearAllStatuses(target);
        this.targetStatuses.delete(target);
      });
    }

    const existing = targetMap.get(type);
    if (existing) {
      existing.remainingMs = Math.max(existing.remainingMs, durationMs);
      existing.dps = Math.max(existing.dps, dps);
      return;
    }

    const effect: ActiveStatusEffect = {
      type,
      durationMs,
      remainingMs: durationMs,
      dps,
      tickTimer: 0,
      tickIntervalMs: type === 'burning' ? 400 : 800,
    };

    // Criar aura visual senoidal para maldição/corrupção
    if (type === 'cursed' && this.scene.textures?.exists('particle_dark_flame')) {
      const aura = this.scene.add.sprite(target.x, target.y - 12, 'particle_dark_flame');
      aura.setScale(1.6).setAlpha(0.6).setDepth(1820);
      effect.auraSprite = aura;
    }

    targetMap.set(type, effect);
  }

  /**
   * Verifica se o alvo possui um efeito de status ativo
   */
  public hasStatus(target: StatusTarget, type: CombatStatusType): boolean {
    const map = this.targetStatuses.get(target);
    return Boolean(map && map.has(type));
  }

  /**
   * Remove um status específico do alvo
   */
  public removeStatus(target: StatusTarget, type: CombatStatusType): void {
    const map = this.targetStatuses.get(target);
    if (!map) return;

    const effect = map.get(type);
    if (effect?.auraSprite) {
      effect.auraSprite.destroy();
    }

    map.delete(type);

    if (map.size === 0) {
      this.targetStatuses.delete(target);
      if (typeof target.applyBaseTint === 'function') {
        target.applyBaseTint();
      } else if (typeof target.clearTint === 'function') {
        target.clearTint();
      }
    }
  }

  /**
   * Remove todos os status do alvo
   */
  public clearAllStatuses(target: StatusTarget): void {
    const map = this.targetStatuses.get(target);
    if (!map) return;

    map.forEach((effect) => {
      if (effect.auraSprite) {
        effect.auraSprite.destroy();
      }
    });

    this.targetStatuses.delete(target);
    if (typeof target.applyBaseTint === 'function') {
      target.applyBaseTint();
    } else if (typeof target.clearTint === 'function') {
      target.clearTint();
    }
  }

  /**
   * Atualização frame-a-frame de ticks, emissores e efeitos visuais
   */
  public update(time: number, delta: number): void {
    const dt = delta;

    this.targetStatuses.forEach((statusMap, target) => {
      if (!target.active || (target.hp !== undefined && target.hp <= 0)) {
        this.clearAllStatuses(target);
        return;
      }

      let isBurning = false;
      let isFrozen = false;
      let isCursed = false;

      statusMap.forEach((effect, type) => {
        effect.remainingMs -= dt;
        effect.tickTimer += dt;

        if (type === 'burning') isBurning = true;
        if (type === 'frozen') isFrozen = true;
        if (type === 'cursed') isCursed = true;

        // Processar DoT Tick
        if (effect.tickTimer >= effect.tickIntervalMs) {
          effect.tickTimer = 0;
          const tickDamage = Math.max(1, Math.round((effect.dps * effect.tickIntervalMs) / 1000));
          
          if (typeof target.takeDamage === 'function') {
            target.takeDamage(tickDamage, undefined, undefined, false, false);
          }

          if (this.scene && 'spawnFloatingText' in this.scene) {
            const color = type === 'burning' ? '#f97316' : type === 'poison' ? '#22c55e' : '#a855f7';
            const label = type === 'burning' ? `-${tickDamage} QUEIMADURA` : type === 'poison' ? `-${tickDamage} VENENO` : `-${tickDamage} MALDIÇÃO`;
            (this.scene as any).spawnFloatingText(target.x, target.y - 14, label, color, false);
          }
        }

        // Partículas em tempo real
        if (type === 'burning' && this.emberEmitter && Math.random() < 0.3) {
          this.emberEmitter.emitParticleAt(target.x + (Math.random() - 0.5) * 16, target.y + (Math.random() - 0.5) * 16);
        } else if (type === 'frozen' && this.frostEmitter && Math.random() < 0.2) {
          this.frostEmitter.emitParticleAt(target.x + (Math.random() - 0.5) * 14, target.y + (Math.random() - 0.5) * 14);
        } else if (type === 'cursed' && this.darkFlameEmitter && Math.random() < 0.25) {
          this.darkFlameEmitter.emitParticleAt(target.x + (Math.random() - 0.5) * 16, target.y + (Math.random() - 0.5) * 16);
        }

        // Aura senoidal ondulante de maldição
        if (effect.auraSprite && effect.auraSprite.active) {
          const sineOffset = Math.sin(time * 0.006) * 4;
          effect.auraSprite.setPosition(target.x, target.y - 12 + sineOffset);
          effect.auraSprite.setAlpha(0.4 + Math.sin(time * 0.008) * 0.2);
        }

        // Expirar status
        if (effect.remainingMs <= 0) {
          this.removeStatus(target, type);
        }
      });

      // Aplicação de Tints e Modulações Visuais Concorrentes
      if (isFrozen) {
        if (typeof target.setTint === 'function') {
          target.setTint(0x67e8f9); // Ciano Cristalino
        }
        if (target.anims && target.anims.isPlaying) {
          target.anims.timeScale = 0.25; // 75% de lentidão nas animações
        }
      } else if (isBurning) {
        if (typeof target.setTint === 'function') {
          // Pulsação térmica entre laranja e carmesim
          const pulse = (Math.sin(time * 0.015) + 1) / 2;
          const r = 0xff;
          const g = Math.floor(0x44 + 0x55 * pulse);
          const b = 0x11;
          target.setTint((r << 16) | (g << 8) | b);
        }
      } else if (isCursed) {
        if (typeof target.setTint === 'function') {
          target.setTint(0xa855f7); // Violeta Escuro / Fogo Negro
        }
      }
    });
  }

  public destroy(): void {
    this.targetStatuses.forEach((statusMap, target) => {
      this.clearAllStatuses(target);
    });
    this.targetStatuses.clear();
    if (this.emberEmitter) this.emberEmitter.destroy();
    if (this.frostEmitter) this.frostEmitter.destroy();
    if (this.darkFlameEmitter) this.darkFlameEmitter.destroy();
  }
}
