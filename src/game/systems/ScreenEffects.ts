/**
 * ScreenEffects (Fase 5+)
 * Sistema de pós-processamento visual para qualidade gráfica refinada
 * Vinhetas, darkness overlay, screen distortion, chromatic aberration
 */

export interface ScreenEffectConfig {
  darkness?: number; // 0-1, overlay escuro
  vignetteStrength?: number; // 0-1, borda escura
  chromaticAberration?: number; // 0-1, separação RGB
  distortion?: number; // 0-1, wave distortion
  screenTint?: string; // hex color para tint
  duration?: number; // ms para easing
}

export class ScreenEffects {
  private scene: Phaser.Scene;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private vignetteTexture: any | null = null;
  private currentConfig: ScreenEffectConfig = {};
  private targetConfig: ScreenEffectConfig = {};
  private easeProgress: number = 0;
  private easeDuration: number = 0;

  constructor(scene: Phaser.Scene, canvasWidth: number = 1280, canvasHeight: number = 720) {
    this.scene = scene;
    this.canvas = document.createElement('canvas');
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.ctx = this.canvas.getContext('2d')!;
    this.generateVignetteTexture();
  }

  /**
   * Gerar textura de vinheta (borda escura)
   */
  private generateVignetteTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Gradiente radial para vinheta
    const gradient = ctx.createRadialGradient(128, 128, 50, 128, 128, 180);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    this.vignetteTexture = this.scene.make.graphics({ x: 0, y: 0 }, false)
      .generateTexture('vignette', 256, 256) as any;
  }

  /**
   * Aplicar efeito de escuridão (environment tense)
   */
  public setDarkness(level: number, duration: number = 500): void {
    this.targetConfig.darkness = Math.max(0, Math.min(1, level));
    this.targetConfig.duration = duration;
    this.easeProgress = 0;
    this.easeDuration = duration;
  }

  /**
   * Aplicar vinheta
   */
  public setVignette(strength: number, duration: number = 300): void {
    this.targetConfig.vignetteStrength = Math.max(0, Math.min(1, strength));
    this.targetConfig.duration = duration;
    this.easeProgress = 0;
    this.easeDuration = duration;
  }

  /**
   * Aplicar distorção (wave effect - tensão)
   */
  public setDistortion(amount: number, duration: number = 300): void {
    this.targetConfig.distortion = Math.max(0, Math.min(1, amount));
    this.targetConfig.duration = duration;
    this.easeProgress = 0;
    this.easeDuration = duration;
  }

  /**
   * Aberração cromática (RGB separation - impacto crítico)
   */
  public setChromaticAberration(amount: number, duration: number = 200): void {
    this.targetConfig.chromaticAberration = Math.max(0, Math.min(1, amount));
    this.targetConfig.duration = duration;
    this.easeProgress = 0;
    this.easeDuration = duration;
  }

  /**
   * Aplicar tint de cor
   */
  public setTint(color: string, duration: number = 300): void {
    this.targetConfig.screenTint = color;
    this.targetConfig.duration = duration;
    this.easeProgress = 0;
    this.easeDuration = duration;
  }

  /**
   * Efeito completo: Morte (red tint + heavy vignette + distortion)
   */
  public effectDeath(): void {
    this.setTint('#8b0000', 500); // Vermelho escuro
    this.setVignette(0.9, 500); // Borda escura total
    this.setDistortion(0.15, 500); // Distorção leve
  }

  /**
   * Efeito: Dano crítico (flash branco + aberração cromática)
   */
  public effectCriticalDamage(): void {
    this.setChromaticAberration(0.2, 150);
    this.setTint('#ffffff', 100);
    setTimeout(() => this.setTint('transparent', 200), 100);
  }

  /**
   * Efeito: Infecção (green tint + distortion)
   */
  public effectInfection(): void {
    this.setTint('#00ff00', 300);
    this.setDistortion(0.1, 300);
    setTimeout(() => this.setTint('transparent', 200), 300);
  }

  /**
   * Efeito: Tensão (darkness leve)
   */
  public effectTension(level: number = 0.2): void {
    this.setDarkness(level, 1000);
  }

  /**
   * Restaurar a normal
   */
  public reset(): void {
    this.targetConfig = {};
    this.easeProgress = 0;
    this.easeDuration = 0;
  }

  /**
   * Atualizar easing
   */
  public update(delta: number): void {
    if (this.easeDuration > 0) {
      this.easeProgress += delta;
      const progress = Math.min(this.easeProgress / this.easeDuration, 1);

      // Easing: ease-out-quad
      const eased = 1 - Math.pow(1 - progress, 2);

      Object.keys(this.targetConfig).forEach((key) => {
        if (key !== 'duration') {
          const target = (this.targetConfig as any)[key];
          const current = (this.currentConfig as any)[key] || 0;
          (this.currentConfig as any)[key] = current + (target - current) * eased;
        }
      });

      if (progress === 1) {
        this.easeDuration = 0;
      }
    }
  }

  /**
   * Renderizar efeitos (chamar depois de render do jogo)
   */
  public render(gameCanvas: HTMLCanvasElement): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Distorção (wave effect)
    if ((this.currentConfig.distortion || 0) > 0.01) {
      this.applyDistortion(gameCanvas);
    }

    // Aberração cromática
    if ((this.currentConfig.chromaticAberration || 0) > 0.01) {
      this.applyChromaticAberration(gameCanvas);
    } else {
      ctx.drawImage(gameCanvas, 0, 0);
    }

    // Vigneta
    if ((this.currentConfig.vignetteStrength || 0) > 0.01) {
      this.applyVignette();
    }

    // Darkness overlay
    if ((this.currentConfig.darkness || 0) > 0.01) {
      this.applyDarkness();
    }

    // Tint de cor
    if (this.currentConfig.screenTint && this.currentConfig.screenTint !== 'transparent') {
      this.applyTint();
    }
  }

  /**
   * Aplicar distorção tipo onda
   */
  private applyDistortion(source: HTMLCanvasElement): void {
    const strength = (this.currentConfig.distortion || 0) * 3;
    const time = Date.now() / 100;

    for (let x = 0; x < this.canvas.width; x += 4) {
      const offset = Math.sin(x / 40 + time) * strength;
      this.ctx.drawImage(
        source,
        x, 0, 4, this.canvas.height,
        x, offset, 4, this.canvas.height
      );
    }
  }

  /**
   * Aberração cromática (RGB separation)
   */
  private applyChromaticAberration(source: HTMLCanvasElement): void {
    const strength = (this.currentConfig.chromaticAberration || 0) * 4;

    // Red channel
    this.ctx.globalCompositeOperation = 'lighten';
    this.ctx.globalAlpha = 0.8;
    this.ctx.filter = `hue-rotate(0deg)`;
    this.ctx.drawImage(source, strength, 0);

    // Green channel
    this.ctx.globalAlpha = 0.9;
    this.ctx.filter = `hue-rotate(120deg)`;
    this.ctx.drawImage(source, 0, 0);

    // Blue channel
    this.ctx.globalAlpha = 0.8;
    this.ctx.filter = `hue-rotate(240deg)`;
    this.ctx.drawImage(source, -strength, 0);

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
    this.ctx.filter = 'none';
  }

  /**
   * Aplicar vigneta (borda escura)
   */
  private applyVignette(): void {
    const strength = (this.currentConfig.vignetteStrength || 0);
    this.ctx.globalAlpha = strength;
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.ellipse(this.canvas.width / 2, this.canvas.height / 2, 
                     this.canvas.width / 1.5, this.canvas.height / 1.5, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Aplicar overlay de escuridão
   */
  private applyDarkness(): void {
    const darkness = (this.currentConfig.darkness || 0);
    this.ctx.globalAlpha = darkness;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Aplicar tint de cor
   */
  private applyTint(): void {
    const tint = this.currentConfig.screenTint || 'transparent';
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = tint;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Obter canvas renderizado
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

export default ScreenEffects;
