import Phaser from 'phaser';

export interface LiquidZone {
  x: number;
  y: number;
  radius: number;
  type: 'blood' | 'water';
}

export interface ReflectionEntity extends Phaser.GameObjects.GameObject {
  x: number;
  y: number;
  texture: Phaser.Textures.Texture;
  frame: Phaser.Textures.Frame;
  scaleX: number;
  scaleY: number;
  active: boolean;
  visible: boolean;
  height?: number;
}

/**
 * ReflectionSystem (Spec 10 — Parte 3: Reflexos Procedurais em Superfícies Líquidas)
 * Renderiza reflexos invertidos dinâmicos para o Jogador e Inimigos sobre poças de sangue e canais de líquido:
 * - Inverte o sprite no eixo Y (flipY: true) com transparência translúcida (alpha: 0.28-0.35).
 * - Aplica tint atmosférico (vermelho escuro para sangue / azul ardósia para água de masmorra).
 * - Ondula sutilmente em tempo real com senoide procedural para simular a tensão superficial e perturbações do líquido.
 */
export class ReflectionSystem {
  private scene: Phaser.Scene;
  private reflectionSprites: Map<ReflectionEntity, Phaser.GameObjects.Sprite> = new Map();
  private liquidZones: LiquidZone[] = [];
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
    this.reflectionSprites.forEach((refl) => refl.setVisible(value));
  }

  /**
   * Adiciona ou atualiza as zonas de líquido (poças de sangue ou canais) ativas no mapa
   */
  public setLiquidZones(zones: LiquidZone[]): void {
    this.liquidZones = zones;
  }

  public addLiquidZone(zone: LiquidZone): void {
    this.liquidZones.push(zone);
  }

  /**
   * Registra uma entidade para renderização de reflexo procedural
   */
  public registerEntity(entity: ReflectionEntity): void {
    if (!entity || !entity.active || this.reflectionSprites.has(entity)) return;

    const refl = this.scene.add.sprite(entity.x, entity.y, entity.texture.key);
    refl.setDepth(12); // Acima do piso e poças (depth 6), abaixo dos monstros e projéteis (depth 20+)
    refl.setFlipY(true);
    refl.setAlpha(0.3);
    refl.setVisible(false);

    this.reflectionSprites.set(entity, refl);

    entity.once('destroy', () => {
      this.unregisterEntity(entity);
    });
  }

  /**
   * Remove e destrói o reflexo de uma entidade
   */
  public unregisterEntity(entity: ReflectionEntity): void {
    const refl = this.reflectionSprites.get(entity);
    if (refl) {
      refl.destroy();
      this.reflectionSprites.delete(entity);
    }
  }

  /**
   * Atualização em tempo real de posições, distorção e visibilidade dos reflexos
   */
  public update(time: number): void {
    if (!this.enabled) return;

    this.reflectionSprites.forEach((refl, entity) => {
      if (!entity.active || !entity.visible) {
        refl.setVisible(false);
        return;
      }

      const footY = entity.y + ((entity.height || 32) * 0.35);

      // Verificar se a entidade está sobre ou muito próxima de alguma zona líquida/poça de sangue
      let inZone: LiquidZone | null = null;
      for (let i = 0; i < this.liquidZones.length; i++) {
        const zone = this.liquidZones[i];
        const dx = entity.x - zone.x;
        const dy = footY - zone.y;
        if (dx * dx + dy * dy <= zone.radius * zone.radius) {
          inZone = zone;
          break;
        }
      }

      if (inZone) {
        refl.setVisible(true);

        // Copiar textura / frame do sprite original
        if (entity.frame && refl.frame !== entity.frame) {
          refl.setFrame(entity.frame.name);
        }

        // Ondulação senoidal horizontal e vertical sutil no reflexo
        const rippleX = Math.sin(time * 0.006 + entity.y * 0.1) * 1.5;
        const rippleScale = 0.85 + Math.sin(time * 0.008) * 0.05;

        refl.setPosition(entity.x + rippleX, footY + 8);
        refl.setScale(entity.scaleX, entity.scaleY * rippleScale);

        // Tint dependendo da composição do líquido (sangue = 0x881122, água escura = 0x224466)
        if (inZone.type === 'blood') {
          refl.setTint(0x7f1d1d);
          refl.setAlpha(0.32);
        } else {
          refl.setTint(0x1e293b);
          refl.setAlpha(0.26);
        }
      } else {
        refl.setVisible(false);
      }
    });
  }

  public destroy(): void {
    this.reflectionSprites.forEach((refl) => refl.destroy());
    this.reflectionSprites.clear();
    this.liquidZones = [];
  }
}
