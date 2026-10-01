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
  public static triggerVibration(type: 'damage_taken' | 'dodge_success' | 'level_up' | 'execution' | 'cooldown_warning' | 'critical_hit' | 'bleeding_tick' | 'explosion') {
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
      case 'critical_hit':
        this.triggerHapticFeedback([20, 15, 20]); // Dois toques rapidos
        break;
      case 'bleeding_tick':
        this.triggerHapticFeedback(15); // Pulsos curtinhos de coracao
        break;
      case 'explosion':
        this.triggerHapticFeedback([50, 40, 80, 20, 150]); // Tremor forte
        break;
    }
  }

  // Frente 4 (spec 11, 27/08): `triggerHitFlash`/`triggerSquashStretch` foram
  // removidos daqui — eram implementações completas porém NUNCA chamadas em
  // lugar nenhum do jogo (dead code, achado na auditoria de 27/08). O Hit
  // Flash real que o jogo usa é o inline em `Enemy.ts` (`takeDamage()`),
  // já testado lá. Squash & Stretch nunca chegou a ser usado — `Enemy.ts` tem
  // seu próprio sistema de escala (isométrico/"coil", recalculado a cada
  // frame em `update()`, + `setFlipX`) que provavelmente entraria em conflito
  // com um `setScale()` direto vindo de fora; conectar exigiria investigar
  // essa interação primeiro, fora do escopo desta limpeza. Ver changelog da
  // spec 11 pra rationale completo.
}
