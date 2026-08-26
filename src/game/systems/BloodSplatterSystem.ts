import Phaser from 'phaser';

export type DecalType =
  | 'blood_pool'
  | 'blood_pool_large'
  | 'splatter_small'
  | 'splatter_directional'
  | 'gore_chunk'
  | 'bone_dust'
  | 'corpse';

export interface DecalConfig {
  x: number;
  y: number;
  textureKey: string;
  type: DecalType;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  tint?: number;
  dryingDurationMs?: number;
  dryTint?: number;
  persistDurationMs?: number;
  fadeDurationMs?: number;
  depth?: number;
}

export interface DecalEntry {
  image: Phaser.GameObjects.Image;
  type: DecalType;
  createdAt: number;
  dryAt: number;
  removeAt: number;
  initialTint?: number;
  dryTint?: number;
  isDry: boolean;
  isFading: boolean;
}

export interface DeathBloodParams {
  x: number;
  y: number;
  monsterId?: string;
  goreEffect?: string;
  dismembermentType?: 'total_destruction' | 'partial_dismemberment' | 'normal_collapse';
  killerSpellId?: string;
  impactAngle?: number;
  scaleMultiplier?: number;
}

export interface CorpseDecalParams {
  x: number;
  y: number;
  textureKey: string;
  scaleX: number;
  scaleY: number;
  isAbomination?: boolean;
  isMutilated?: boolean;
}

export class BloodSplatterSystem {
  private scene: Phaser.Scene;
  private decals: DecalEntry[] = [];
  public maxDecals: number = 140;
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene, maxDecals = 140) {
    this.scene = scene;
    this.maxDecals = maxDecals;
  }

  public initialize(): void {
    this.decals = [];
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getActiveDecalCount(): number {
    return this.decals.length;
  }

  /**
   * Adiciona um decal individual no piso com suporte a ciclo de vida,
   * coagulação/secagem e descarte FIFO seguro.
   */
  public addDecal(cfg: DecalConfig): Phaser.GameObjects.Image | null {
    if (!this.enabled || !this.scene || !this.scene.add) return null;

    // Se atingir capacidade máxima, recicla suavemente o decal mais antigo (FIFO)
    while (this.decals.length >= this.maxDecals) {
      const oldest = this.decals.shift();
      if (oldest && oldest.image && oldest.image.active) {
        if (!oldest.isFading) {
          oldest.isFading = true;
          if (this.scene.tweens) {
            this.scene.tweens.add({
              targets: oldest.image,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                if (oldest.image && oldest.image.active) {
                  oldest.image.destroy();
                }
              },
            });
          } else {
            oldest.image.destroy();
          }
        }
      }
    }

    const texKey = this.scene.textures.exists(cfg.textureKey) ? cfg.textureKey : 'blood_pool_stain';
    const image = this.scene.add.image(cfg.x, cfg.y, texKey);
    const depth = cfg.depth ?? 2;
    image.setDepth(depth);
    image.setScale(cfg.scaleX, cfg.scaleY);
    image.setRotation(cfg.rotation);
    image.setAlpha(cfg.alpha);

    if (cfg.tint !== undefined) {
      image.setTint(cfg.tint);
    }

    const now = this.scene.time ? this.scene.time.now : Date.now();
    const dryingDuration = cfg.dryingDurationMs ?? 6000;
    const persistDuration = cfg.persistDurationMs ?? 55000;
    const fadeDuration = cfg.fadeDurationMs ?? 15000;

    const entry: DecalEntry = {
      image,
      type: cfg.type,
      createdAt: now,
      dryAt: now + dryingDuration,
      removeAt: now + persistDuration,
      initialTint: cfg.tint,
      dryTint: cfg.dryTint ?? (cfg.type === 'bone_dust' ? 0x94a3b8 : 0x450a0a),
      isDry: false,
      isFading: false,
    };

    // Adiciona ao grupo global de compatibilidade se existir
    const anyScene = this.scene as any;
    if (anyScene.bloodStainsGroup && anyScene.bloodStainsGroup.add) {
      anyScene.bloodStainsGroup.add(image);
    }

    // Agenda o fadeout suave final
    if (this.scene.tweens) {
      this.scene.tweens.add({
        targets: image,
        alpha: 0,
        delay: persistDuration,
        duration: fadeDuration,
        onComplete: () => {
          this.removeDecal(entry);
        },
      });
    }

    this.decals.push(entry);
    return image;
  }

  /**
   * Remove e destrói um decal específico
   */
  private removeDecal(entry: DecalEntry): void {
    const idx = this.decals.indexOf(entry);
    if (idx !== -1) {
      this.decals.splice(idx, 1);
    }

    const anyScene = this.scene as any;
    if (anyScene.bloodStainsGroup && anyScene.bloodStainsGroup.remove) {
      anyScene.bloodStainsGroup.remove(entry.image, true, true);
    }

    if (entry.image && entry.image.active) {
      entry.image.destroy();
    }
  }

  /**
   * Adiciona conjunto completo de sangue, respingos e poças de morte
   */
  public addDeathBlood(params: DeathBloodParams): void {
    if (!this.enabled) return;

    const {
      x,
      y,
      monsterId = '',
      goreEffect,
      dismembermentType = 'normal_collapse',
      impactAngle = Math.random() * Math.PI * 2,
      scaleMultiplier = 1.0,
    } = params;

    const isBone = goreEffect === 'bone_dust' || monsterId.includes('skeleton');
    const isAbomination = monsterId === 'gore_abomination';
    const isSpecter = monsterId.includes('specter') || monsterId.includes('wraith');

    // Paleta de cores do decal
    let bloodTint: number | undefined;
    let dryTint: number | undefined;

    if (isBone) {
      bloodTint = 0xf1f5f9;
      dryTint = 0x94a3b8;
    } else if (isSpecter) {
      bloodTint = 0x8b5cf6;
      dryTint = 0x3b0764;
    } else if (isAbomination) {
      bloodTint = 0x15803d;
      dryTint = 0x052e16;
    }

    if (isBone) {
      // Esqueleto/Ossos: Gera manchas de pó de ossos e lascas
      const count = dismembermentType === 'total_destruction' ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * 24;
        const oy = (Math.random() - 0.5) * 20;
        this.addDecal({
          x: x + ox,
          y: y + oy,
          textureKey: 'particle_bone_dust',
          type: 'bone_dust',
          scaleX: (0.9 + Math.random() * 0.5) * scaleMultiplier,
          scaleY: (0.9 + Math.random() * 0.5) * scaleMultiplier,
          rotation: Math.random() * Math.PI * 2,
          alpha: 0.85,
          tint: bloodTint,
          dryTint,
          depth: 2,
        });
      }
      return;
    }

    if (dismembermentType === 'total_destruction') {
      // 1. Poça massiva no solo
      const poolScale = (1.2 + Math.random() * 0.4) * (isAbomination ? 2.0 : 1.0) * scaleMultiplier;
      this.addDecal({
        x,
        y: y + 4,
        textureKey: 'blood_pool_large',
        type: 'blood_pool_large',
        scaleX: poolScale,
        scaleY: poolScale * 0.85,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0.95,
        tint: bloodTint,
        dryTint,
        depth: 2,
        persistDurationMs: 65000,
      });

      // 2. Jatos arteriais / respingos direcionais em 2-4 direções
      const sprayCount = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < sprayCount; i++) {
        const sprayAngle = impactAngle + (i - 1) * 0.8 + (Math.random() - 0.5) * 0.4;
        const dist = 18 + Math.random() * 28;
        const sx = x + Math.cos(sprayAngle) * dist;
        const sy = y + Math.sin(sprayAngle) * dist;

        this.addDecal({
          x: sx,
          y: sy,
          textureKey: 'blood_splatter_directional',
          type: 'splatter_directional',
          scaleX: (0.9 + Math.random() * 0.5) * scaleMultiplier,
          scaleY: (0.8 + Math.random() * 0.4) * scaleMultiplier,
          rotation: sprayAngle,
          alpha: 0.88,
          tint: bloodTint,
          dryTint,
          depth: 2,
        });
      }

      // 3. Pedaços de vísceras / gore no chão
      const goreCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < goreCount; i++) {
        const gx = x + (Math.random() - 0.5) * 40;
        const gy = y + (Math.random() - 0.5) * 32;
        this.addDecal({
          x: gx,
          y: gy,
          textureKey: 'gore_chunk_decal',
          type: 'gore_chunk',
          scaleX: (0.8 + Math.random() * 0.5) * scaleMultiplier,
          scaleY: (0.8 + Math.random() * 0.5) * scaleMultiplier,
          rotation: Math.random() * Math.PI * 2,
          alpha: 0.9,
          tint: bloodTint,
          dryTint,
          depth: 3,
        });
      }

      // 4. Registra zona líquida reflexiva se ReflectionSystem estiver ativo
      const anyScene = this.scene as any;
      if (anyScene.reflectionSystem && anyScene.reflectionSystem.addLiquidZone) {
        anyScene.reflectionSystem.addLiquidZone({
          x,
          y: y + 4,
          radius: 38 * poolScale,
          type: isAbomination ? 'poison' : 'blood',
        });
      }
    } else if (dismembermentType === 'partial_dismemberment') {
      // Poça média
      const poolScale = (0.95 + Math.random() * 0.3) * scaleMultiplier;
      this.addDecal({
        x,
        y: y + 2,
        textureKey: 'blood_pool_stain',
        type: 'blood_pool',
        scaleX: poolScale * 1.1,
        scaleY: poolScale * 0.9,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0.9,
        tint: bloodTint,
        dryTint,
        depth: 2,
        persistDurationMs: 50000,
      });

      // 1-2 Jatos direcionais no sentido do impacto
      const sx = x + Math.cos(impactAngle) * 20;
      const sy = y + Math.sin(impactAngle) * 20;
      this.addDecal({
        x: sx,
        y: sy,
        textureKey: 'blood_splatter_directional',
        type: 'splatter_directional',
        scaleX: 0.9 * scaleMultiplier,
        scaleY: 0.8 * scaleMultiplier,
        rotation: impactAngle,
        alpha: 0.85,
        tint: bloodTint,
        dryTint,
        depth: 2,
      });

      // 1 pedaço de gore
      this.addDecal({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 16,
        textureKey: 'gore_chunk_decal',
        type: 'gore_chunk',
        scaleX: 0.85 * scaleMultiplier,
        scaleY: 0.85 * scaleMultiplier,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0.85,
        tint: bloodTint,
        dryTint,
        depth: 3,
      });

      const anyScene = this.scene as any;
      if (anyScene.reflectionSystem && anyScene.reflectionSystem.addLiquidZone) {
        anyScene.reflectionSystem.addLiquidZone({
          x,
          y: y + 2,
          radius: 26 * poolScale,
          type: isAbomination ? 'poison' : 'blood',
        });
      }
    } else {
      // Normal Collapse: Poça padrão e pequenos respingos
      const poolScale = (0.8 + Math.random() * 0.25) * scaleMultiplier;
      this.addDecal({
        x,
        y: y + 2,
        textureKey: 'blood_pool_stain',
        type: 'blood_pool',
        scaleX: poolScale,
        scaleY: poolScale * 0.8,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0.85,
        tint: bloodTint,
        dryTint,
        depth: 2,
        persistDurationMs: 40000,
      });

      // Gotas menores ao redor
      for (let i = 0; i < 2; i++) {
        const rx = x + (Math.random() - 0.5) * 24;
        const ry = y + (Math.random() - 0.5) * 20;
        this.addDecal({
          x: rx,
          y: ry,
          textureKey: 'blood_splatter_small',
          type: 'splatter_small',
          scaleX: 0.7 + Math.random() * 0.4,
          scaleY: 0.7 + Math.random() * 0.4,
          rotation: Math.random() * Math.PI * 2,
          alpha: 0.75,
          tint: bloodTint,
          dryTint,
          depth: 2,
        });
      }

      const anyScene = this.scene as any;
      if (anyScene.reflectionSystem && anyScene.reflectionSystem.addLiquidZone) {
        anyScene.reflectionSystem.addLiquidZone({
          x,
          y: y + 2,
          radius: 20 * poolScale,
          type: isAbomination ? 'poison' : 'blood',
        });
      }
    }
  }

  /**
   * Adiciona o cadáver caído do monstro no piso
   */
  public addCorpseDecal(params: CorpseDecalParams): Phaser.GameObjects.Image | null {
    if (!this.enabled) return null;

    const { x, y, textureKey, scaleX, scaleY, isAbomination, isMutilated } = params;

    const corpseTint = isAbomination ? 0x1a4a1a : isMutilated ? 0x4a0a0a : 0x3a0a0a;

    return this.addDecal({
      x,
      y: y + 4,
      textureKey,
      type: 'corpse',
      scaleX: scaleX * (isMutilated ? 0.95 : 1.05),
      scaleY: scaleY * (isMutilated ? 0.45 : 0.55),
      rotation: Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2,
      alpha: 0.9,
      tint: corpseTint,
      dryTint: 0x1f1f1f,
      depth: 3,
      persistDurationMs: 65000,
      fadeDurationMs: 18000,
    });
  }

  /**
   * Adiciona respingo de impacto em parede
   */
  public addWallSplatter(x: number, y: number, angle?: number, isHeavy = false): void {
    if (!this.enabled) return;

    if (isHeavy) {
      this.addDecal({
        x,
        y,
        textureKey: 'blood_splatter_directional',
        type: 'splatter_directional',
        scaleX: 0.6 + Math.random() * 0.3,
        scaleY: 0.6 + Math.random() * 0.3,
        rotation: angle ?? Math.random() * Math.PI * 2,
        alpha: 0.8,
        depth: 4,
        persistDurationMs: 30000,
      });
    } else {
      this.addDecal({
        x,
        y,
        textureKey: 'blood_splatter_small',
        type: 'splatter_small',
        scaleX: 0.6 + Math.random() * 0.4,
        scaleY: 0.6 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        alpha: 0.75,
        depth: 4,
        persistDurationMs: 25000,
      });
    }
  }

  /**
   * Adiciona pequenas gotas no solo durante combate ativo (hits pesados / críticos)
   */
  public addHitSplatter(x: number, y: number, angle?: number, isCrit = false): void {
    if (!this.enabled) return;

    const count = isCrit ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const dist = 6 + Math.random() * 14;
      const spreadAngle = (angle ?? Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 0.8;
      const sx = x + Math.cos(spreadAngle) * dist;
      const sy = y + Math.sin(spreadAngle) * dist;

      this.addDecal({
        x: sx,
        y: sy,
        textureKey: isCrit && Math.random() > 0.5 ? 'blood_splatter_directional' : 'blood_splatter_small',
        type: isCrit ? 'splatter_directional' : 'splatter_small',
        scaleX: (isCrit ? 0.7 : 0.5) + Math.random() * 0.3,
        scaleY: (isCrit ? 0.6 : 0.5) + Math.random() * 0.3,
        rotation: spreadAngle,
        alpha: 0.8,
        depth: 2,
        persistDurationMs: 20000,
      });
    }
  }

  /**
   * Atualiza o estado de secagem e coagulação de sangue dos decals
   */
  public update(time: number): void {
    if (!this.enabled || this.decals.length === 0) return;

    for (let i = 0; i < this.decals.length; i++) {
      const entry = this.decals[i];
      if (!entry.isDry && time >= entry.dryAt) {
        entry.isDry = true;
        if (entry.image && entry.image.active && entry.dryTint !== undefined) {
          // Sangue seca: escurece para tom coagulado e reduz sutilmente opacidade
          entry.image.setTint(entry.dryTint);
          entry.image.setAlpha(entry.image.alpha * 0.9);
        }
      }
    }
  }

  /**
   * Remove todos os decals instantaneamente (usado na transição de nível)
   */
  public clearAll(): void {
    for (const entry of this.decals) {
      if (entry.image && entry.image.active) {
        entry.image.destroy();
      }
    }
    this.decals = [];
  }

  public cleanup(): void {
    this.clearAll();
  }
}
