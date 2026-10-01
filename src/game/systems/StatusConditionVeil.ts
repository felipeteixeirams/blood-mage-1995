/**
 * Renderiza um veil sutil (overlay semi-transparente) para indicar status conditions
 * sem obscurecer completamente a visibilidade do personagem.
 *
 * Reduz opacidade em comparação ao tint completo anterior (~40% → ~15%)
 */

export interface StatusConditionConfig {
  color: number;
  label: string;
}

export class StatusConditionVeil {
  private veilGraphics?: Phaser.GameObjects.Graphics;
  private currentCondition: 'none' | 'bleeding' | 'poison' | 'infection' = 'none';
  private currentColor: number = 0xffffff;

  private readonly CONDITIONS: Record<string, StatusConditionConfig> = {
    bleeding: {
      color: 0xf87171, // Deep Red
      label: 'bleeding',
    },
    poison: {
      color: 0x4ade80, // Soft Green
      label: 'poison',
    },
    infection: {
      color: 0xc084fc, // Purple
      label: 'infection',
    },
  };

  constructor(private scene: Phaser.Scene) {
    if (scene.add && scene.add.graphics) {
      this.veilGraphics = scene.add.graphics();
      // Veil sits above everything except UI
      this.veilGraphics.setDepth(1500);
    }
  }

  /**
   * Atualiza o veil para refletir status conditions atual
   * @param statusConditions Objeto com boolean flags (bleeding, poison, infection)
   * @param screenWidth Largura da tela/viewport
   * @param screenHeight Altura da tela/viewport
   */
  public update(
    statusConditions: { bleeding?: boolean; poison?: boolean; infection?: boolean },
    screenWidth: number,
    screenHeight: number
  ): void {
    if (!this.veilGraphics) return;

    const g = this.veilGraphics;
    g.clear();

    // Determinar qual status está ativo (prioridade: infection > poison > bleeding)
    let activeCondition: 'none' | 'bleeding' | 'poison' | 'infection' = 'none';
    let color = 0xffffff;

    if (statusConditions.infection) {
      activeCondition = 'infection';
      color = this.CONDITIONS.infection.color;
    } else if (statusConditions.poison) {
      activeCondition = 'poison';
      color = this.CONDITIONS.poison.color;
    } else if (statusConditions.bleeding) {
      activeCondition = 'bleeding';
      color = this.CONDITIONS.bleeding.color;
    }

    // Renderizar veil se houver status condition
    if (activeCondition !== 'none') {
      // Opacity muito baixa (15%) para não obscurecer gameplay
      g.fillStyle(color, 0.12);
      g.fillRect(0, 0, screenWidth, screenHeight);

      this.currentCondition = activeCondition;
      this.currentColor = color;
    } else {
      this.currentCondition = 'none';
    }
  }

  public destroy(): void {
    if (this.veilGraphics) {
      this.veilGraphics.destroy();
      this.veilGraphics = undefined;
    }
  }

  public getCurrentCondition(): string {
    return this.currentCondition;
  }
}
