/**
 * Haptic Feedback Utility (Fase 5)
 * Integra vibração de dispositivo via navigator.vibrate API
 * Suportado: Mobile devices (Android/iOS), alguns desktops com hardware
 */

export class HapticFeedback {
  private static isSupported(): boolean {
    return !!(navigator.vibrate || (navigator as any).webkitVibrate || (navigator as any).mozVibrate || (navigator as any).msVibrate);
  }

  private static vibrate(pattern: number | number[]): void {
    if (!this.isSupported()) return;

    const vibrate = navigator.vibrate || (navigator as any).webkitVibrate || (navigator as any).mozVibrate || (navigator as any).msVibrate;
    try {
      vibrate.call(navigator, pattern as any);
    } catch (e) {
      // Silenciosamente falha se vibração não for suportada
    }
  }

  /**
   * Impacto leve - hit de inimigo, miss de ataque
   * Padrão: 50ms vibração
   */
  public static lightImpact(): void {
    this.vibrate(50);
  }

  /**
   * Impacto médio - dano recebido do player, crítico de inimigo
   * Padrão: 100ms vibração
   */
  public static mediumImpact(): void {
    this.vibrate(100);
  }

  /**
   * Impacto forte - dano crítico do player, morte iminente
   * Padrão: 150ms vibração
   */
  public static heavyImpact(): void {
    this.vibrate(150);
  }

  /**
   * Dano recebido do jogador - padrão duplo
   * Padrão: 80ms vibrando, 40ms pausa, 80ms vibrando
   */
  public static playerDamaged(): void {
    this.vibrate([80, 40, 80]);
  }

  /**
   * Morte do jogador - padrão de alerta longo
   * Padrão: 200ms vibração, 100ms pausa, 200ms vibração
   */
  public static playerDeath(): void {
    this.vibrate([200, 100, 200]);
  }

  /**
   * Sucesso / Pickup de item - vibração curta e alegre
   * Padrão: 30ms, 20ms pausa, 30ms
   */
  public static success(): void {
    this.vibrate([30, 20, 30]);
  }

  /**
   * Padrão customizado - permite controlar a sequência diretamente
   * @param pattern Número (ms de vibração) ou array de números (ms vibrando/pausando alternado)
   */
  public static custom(pattern: number | number[]): void {
    this.vibrate(pattern);
  }

  /**
   * Para qualquer vibração em andamento
   */
  public static stop(): void {
    this.vibrate(0);
  }
}

export default HapticFeedback;
