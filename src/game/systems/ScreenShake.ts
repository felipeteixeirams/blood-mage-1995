/**
 * ScreenShake (Fase 5)
 * Sistema de screen shake refinado com diferentes intensidades
 * Melhora feedback visual de impactos
 */

export interface ShakeProfile {
  intensity: number; // 0-1
  duration: number; // ms
  frequency: number; // Hz
  decay: boolean; // fade out com o tempo
}

export class ScreenShake {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private originalX: number = 0;
  private originalY: number = 0;
  private isShaking: boolean = false;
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private shakeFrequency: number = 0;
  private shakeDecay: boolean = false;

  constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
    this.originalX = camera.x;
    this.originalY = camera.y;
  }

  /**
   * Iniciar screen shake customizado
   */
  public shake(profile: ShakeProfile): void {
    this.isShaking = true;
    this.shakeTimer = 0;
    this.shakeDuration = profile.duration;
    this.shakeIntensity = profile.intensity;
    this.shakeFrequency = profile.frequency;
    this.shakeDecay = profile.decay;
    this.originalX = this.camera.x;
    this.originalY = this.camera.y;
  }

  /**
   * Shake leve - impacto de inimigo, tiro
   */
  public light(): void {
    this.shake({
      intensity: 3,
      duration: 100,
      frequency: 8,
      decay: true,
    });
  }

  /**
   * Shake médio - dano crítico, explosão
   */
  public medium(): void {
    this.shake({
      intensity: 6,
      duration: 150,
      frequency: 10,
      decay: true,
    });
  }

  /**
   * Shake forte - morte, impacto massivo
   */
  public heavy(): void {
    this.shake({
      intensity: 10,
      duration: 200,
      frequency: 12,
      decay: true,
    });
  }

  /**
   * Shake contínuo - tremor de piso/medo
   */
  public continuous(intensity: number = 5, duration: number = 500): void {
    this.shake({
      intensity,
      duration,
      frequency: 6,
      decay: false,
    });
  }

  /**
   * Atualizar shake a cada frame
   */
  public update(delta: number): void {
    if (!this.isShaking) return;

    this.shakeTimer += delta;

    // Terminar shake
    if (this.shakeTimer >= this.shakeDuration) {
      this.isShaking = false;
      this.camera.setPosition(this.originalX, this.originalY);
      return;
    }

    // Calcular intensidade com decay
    let intensity = this.shakeIntensity;
    if (this.shakeDecay) {
      const progress = this.shakeTimer / this.shakeDuration;
      intensity *= 1 - progress; // Fade out linear
    }

    // Calcular offset baseado em frequency
    const shakeAmount = Math.sin(this.shakeTimer / 1000 * this.shakeFrequency * Math.PI * 2) * intensity;
    const offsetX = Math.cos(this.shakeTimer / 100) * shakeAmount;
    const offsetY = Math.sin(this.shakeTimer / 100) * shakeAmount;

    this.camera.setPosition(this.originalX + offsetX, this.originalY + offsetY);
  }

  /**
   * Parar shake imediatamente
   */
  public stop(): void {
    this.isShaking = false;
    this.camera.setPosition(this.originalX, this.originalY);
  }

  /**
   * Verificar se está shakando
   */
  public isActive(): boolean {
    return this.isShaking;
  }
}

export default ScreenShake;
