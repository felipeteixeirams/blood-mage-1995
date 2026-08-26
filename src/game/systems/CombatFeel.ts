import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

export class CombatFeel {
  private static isFreezeActive = false;

  /**
   * Triggers a temporary freeze frame (hit-stop) by pausing physics and scene update loop.
   */
  public static triggerHitStop(scene: Phaser.Scene, durationMs: number) {
    if (this.isFreezeActive) return;
    if (!scene || !scene.physics?.world || !scene.time?.addEvent) return;
    this.isFreezeActive = true;

    // Pause physics
    scene.physics.world.pause();

    // Create a delayed event that resumes physics and flags freeze inactive
    scene.time.addEvent({
      delay: durationMs,
      callback: () => {
        if (scene.physics?.world) {
          scene.physics.world.resume();
        }
        this.isFreezeActive = false;
      }
    });
  }

  /**
   * Triggers screen shake with intensity proportional to the hit.
   * Respects user settings.
   */
  public static triggerScreenShake(scene: Phaser.Scene, intensity: number, durationMs: number) {
    if (!scene || !scene.cameras?.main) return;
    const settings = useGameStore.getState().settings;
    if (settings.screenShakeEnabled === false) return;

    // Phaser main camera shake uses normalized intensity (e.g. 0.01 is decent)
    scene.cameras.main.shake(durationMs, intensity);
  }

  /**
   * Triggers screen shake and hit-stop based on hit criteria.
   */
  public static handleHitImpact(scene: Phaser.Scene, damage: number, isCrit: boolean, isSpecial: boolean, enemyHpRatio: number) {
    // Determine screen shake
    let shakeIntensity = 0.002;
    let shakeDuration = 60; // ~3 frames

    if (isSpecial) {
      shakeIntensity = 0.01;
      shakeDuration = 200; // ~12 frames
    } else if (isCrit) {
      shakeIntensity = 0.006;
      shakeDuration = 130; // ~8 frames
    } else if (damage > 15) {
      shakeIntensity = 0.004;
      shakeDuration = 100;
    }

    this.triggerScreenShake(scene, shakeIntensity, shakeDuration);

    // Determine hit-stop: crit, special skill or enemy HP <= 20%
    if (isCrit || isSpecial || enemyHpRatio <= 0.2) {
      const hitStopDuration = isSpecial ? 80 : 40; // 40-80ms (2-4 frames)
      this.triggerHitStop(scene, hitStopDuration);
    }
  }

  /**
   * Triggers browser-native haptic feedback using the Vibration API.
   * Respects mobile support check.
   */
  public static triggerHapticFeedback(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silently catch security exceptions or unsupported devices
      }
    }
  }

  /**
   * Specific vibration patterns from spec
   */
  public static triggerVibration(type: 'damage_taken' | 'dodge_success' | 'level_up' | 'execution' | 'cooldown_warning') {
    switch (type) {
      case 'damage_taken':
        this.triggerHapticFeedback(50);
        break;
      case 'dodge_success':
        this.triggerHapticFeedback([20, 30, 20]);
        break;
      case 'level_up':
        this.triggerHapticFeedback([80, 20, 80]);
        break;
      case 'execution':
        this.triggerHapticFeedback([30, 10, 20]);
        break;
      case 'cooldown_warning':
        this.triggerHapticFeedback(10);
        break;
    }
  }

  /**
   * Hit Flash com dissolução carmesim — Fase 4
   * Transição: branco puro no frame de acerto → escarlate → tint original do sprite.
   * Funciona em qualquer Phaser.GameObjects.Sprite/Image sem exigir WebGL.
   *
   * @param sprite O sprite do inimigo que recebeu dano
   * @param originalTint Cor original do sprite (hex int, ex: 0xffffff). Padrão 0xffffff (branco)
   * @param isCrit Se true, amplia o flash para duração maior e tom mais vibrante
   */
  public static triggerHitFlash(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    originalTint: number = 0xffffff,
    isCrit: boolean = false,
  ): void {
    if (!sprite?.active) return;

    const flashDuration = isCrit ? 80 : 50;
    const scarleDuration = isCrit ? 120 : 80;

    // Frame 1: flash branco total
    // Phaser 4: setTintFill(color) foi descontinuado — agora é setTint(color) + setTintMode(FILL).
    // Ver: changelog/v4/4.0/MIGRATION-GUIDE.md
    sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);

    // Frame 2: dissolve para escarlate
    scene.time.delayedCall(flashDuration, () => {
      if (!sprite?.active) return;
      sprite.setTint(isCrit ? 0xff1a1a : 0xcc2222).setTintMode(Phaser.TintModes.FILL);
    });

    // Frame 3: restaura tint original (volta ao modo MULTIPLY padrão, senão o fill persiste)
    scene.time.delayedCall(flashDuration + scarleDuration, () => {
      if (!sprite?.active) return;
      sprite.setTintMode(Phaser.TintModes.MULTIPLY);
      // clearTint() se o tint original é branco, senão aplica via setTint
      if (originalTint === 0xffffff) {
        sprite.clearTint();
      } else {
        sprite.setTint(originalTint);
      }
    });
  }

  /**
   * Squash & Stretch Inercial — Fase 4
   * Aplica uma deformação de escala rápida (comprimir no impacto, esticar na saída)
   * que dá peso orgânico ao sprite ao receber dano.
   *
   * @param sprite O sprite a deformar
   * @param baseScaleX Escala base X do sprite
   * @param baseScaleY Escala base Y do sprite
   * @param isCrit Intensidade maior para críticos
   */
  public static triggerSquashStretch(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    baseScaleX: number = 1.0,
    baseScaleY: number = 1.0,
    isCrit: boolean = false,
  ): void {
    if (!sprite?.active) return;

    const squashX = isCrit ? 1.35 : 1.18;
    const squashY = isCrit ? 0.72 : 0.85;
    const stretchX = isCrit ? 0.80 : 0.90;
    const stretchY = isCrit ? 1.30 : 1.15;

    // Squash: esmagamento lateral no frame de impacto
    sprite.setScale(baseScaleX * squashX, baseScaleY * squashY);

    // Stretch: esticamento vertical (recuo)
    scene.time.delayedCall(60, () => {
      if (!sprite?.active) return;
      sprite.setScale(baseScaleX * stretchX, baseScaleY * stretchY);
    });

    // Restaurar escala original
    scene.time.delayedCall(140, () => {
      if (!sprite?.active) return;
      sprite.setScale(baseScaleX, baseScaleY);
    });
  }
}
