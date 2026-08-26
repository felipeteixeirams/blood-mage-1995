/**
 * AchievementNotification (Fase 5+)
 * Notificação visual elegante quando achievement é desbloqueado
 * Estilo: retro-futurista + animação suave
 */

export interface AchievementNotificationConfig {
  name: string;
  description: string;
  icon?: string; // emoji ou key de sprite
  rewards?: {
    bloodCrystals?: number;
    talentPoints?: number;
  };
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'; // cor do badge
}

export class AchievementNotification {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private isAnimating = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Mostrar notificação de achievement
   */
  public show(config: AchievementNotificationConfig, duration: number = 5000): void {
    if (this.isAnimating) return; // Evitar overlap
    this.isAnimating = true;

    const { width, height } = this.scene.cameras.main;
    const x = width / 2;
    const y = height * 0.15; // Topo da tela

    // Container principal
    this.container = this.scene.add.container(x, y);

    // Cor de fundo por rarity
    const colors = {
      common: 0x666666,
      rare: 0x3b82f6,
      epic: 0xa855f7,
      legendary: 0xf59e0b,
    };
    const bgColor = colors[config.rarity || 'common'];

    // Fundo com borda
    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor, 0.95);
    bg.fillRoundedRect(-200, -50, 400, 100, 10);
    
    // Borda glowing
    bg.lineStyle(2, bgColor, 1);
    bg.strokeRoundedRect(-200, -50, 400, 100, 10);

    this.container.add(bg);

    // Ícone (emoji ou sprite)
    if (config.icon) {
      const iconText = this.scene.add.text(-160, -25, config.icon, {
        fontFamily: 'Arial',
        fontSize: '32px',
      });
      iconText.setOrigin(0.5);
      this.container.add(iconText);
    }

    // Título "ACHIEVEMENT UNLOCKED"
    const titleText = this.scene.add.text(-160, -35, '🏆 ACHIEVEMENT UNLOCKED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffff00',
    });
    titleText.setOrigin(0, 0.5);
    this.container.add(titleText);

    // Nome do achievement
    const nameText = this.scene.add.text(-160, -15, config.name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffffff',
      wordWrap: { width: 300 },
    });
    nameText.setOrigin(0, 0.5);
    this.container.add(nameText);

    // Descrição
    const descText = this.scene.add.text(-160, 10, config.description, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#e0e0e0',
      wordWrap: { width: 300 },
    });
    descText.setOrigin(0, 0.5);
    this.container.add(descText);

    // Rewards (se houver)
    if (config.rewards) {
      let rewardY = 35;
      if (config.rewards.bloodCrystals) {
        const crystalText = this.scene.add.text(-160, rewardY, 
          `💎 +${config.rewards.bloodCrystals} Blood Crystals`, {
          fontFamily: 'Arial',
          fontSize: '9px',
          color: '#ff6b6b',
        });
        crystalText.setOrigin(0, 0.5);
        this.container.add(crystalText);
        rewardY += 12;
      }

      if (config.rewards.talentPoints) {
        const talentText = this.scene.add.text(-160, rewardY, 
          `⭐ +${config.rewards.talentPoints} Talent Points`, {
          fontFamily: 'Arial',
          fontSize: '9px',
          color: '#ffd700',
        });
        talentText.setOrigin(0, 0.5);
        this.container.add(talentText);
      }
    }

    // Animação: slide in + scale
    this.scene.tweens.add({
      targets: this.container,
      y: y + 20,
      duration: 400,
      ease: 'Back.out',
    });

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.out',
    });

    this.container.setScale(0.8);

    // Pulsação de fundo (glow)
    this.scene.tweens.add({
      targets: bg,
      alpha: 0.9,
      duration: 600,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.inOut',
    });

    // Auto-remove após duração
    this.scene.time.delayedCall(duration, () => {
      this.hide();
    });
  }

  /**
   * Esconder notificação com animação
   */
  private hide(): void {
    if (!this.container) return;

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.container.y - 30,
      duration: 400,
      ease: 'Back.in',
      onComplete: () => {
        this.container?.destroy();
        this.container = null;
        this.isAnimating = false;
      },
    });
  }

  /**
   * Destruir notificação
   */
  public destroy(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

export default AchievementNotification;
