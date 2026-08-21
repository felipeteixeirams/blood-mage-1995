import Phaser from 'phaser';

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export interface ShadowEntity extends Phaser.GameObjects.GameObject {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  active: boolean;
  visible: boolean;
  height?: number;
}

/**
 * ShadowSystem (Spec 10 — Parte 3: Sombras Direcionais Dinâmicas)
 * Projeta sombras dinâmicas no chão para o Jogador e Inimigos em 2.5D:
 * - Calcula a posição e ângulo em relação à fonte de luz mais próxima (tochas, feixe do player, etc.).
 * - Projeta a sombra na direção oposta com escala e achatamento elíptico proporcional à distância.
 * - Suporta fallback suave para sombra de contato estática em áreas escuras ou iluminação zenital.
 */
export class ShadowSystem {
  private scene: Phaser.Scene;
  private shadowSprites: Map<ShadowEntity, Phaser.GameObjects.Image> = new Map();
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
    this.shadowSprites.forEach((shadow) => {
      shadow.setVisible(value);
    });
  }

  /**
   * Registra uma entidade para receber projeção de sombra dinâmica
   */
  public registerEntity(entity: ShadowEntity): void {
    if (!entity || !entity.active || this.shadowSprites.has(entity)) return;

    const textureKey = this.scene.textures.exists('spr_shadow_disc') ? 'spr_shadow_disc' : 'particle_blood_red';
    const shadow = this.scene.add.image(entity.x, entity.y + 12, textureKey);
    shadow.setDepth(8); // Abaixo dos personagens (depth 20-50), acima do piso (depth 0-5)
    shadow.setScale(1.0, 0.45);
    shadow.setAlpha(0.35);

    if (textureKey !== 'spr_shadow_disc') {
      shadow.setTint(0x000000);
    }

    this.shadowSprites.set(entity, shadow);

    entity.once('destroy', () => {
      this.unregisterEntity(entity);
    });
  }

  /**
   * Remove e destrói a sombra de uma entidade
   */
  public unregisterEntity(entity: ShadowEntity): void {
    const shadow = this.shadowSprites.get(entity);
    if (shadow) {
      shadow.destroy();
      this.shadowSprites.delete(entity);
    }
  }

  /**
   * Atualiza as projeções de sombra frame a frame com base nas fontes de luz
   */
  public update(lightSources: LightSource[]): void {
    if (!this.enabled) return;

    this.shadowSprites.forEach((shadow, entity) => {
      if (!entity.active || !entity.visible) {
        shadow.setVisible(false);
        return;
      }

      shadow.setVisible(true);

      const footY = entity.y + ((entity.height || 32) * 0.35);
      let closestLight: LightSource | null = null;
      let minDistance = Infinity;

      // Buscar a fonte de luz mais próxima e influente
      for (let i = 0; i < lightSources.length; i++) {
        const light = lightSources[i];
        const dx = entity.x - light.x;
        const dy = footY - light.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < light.radius && dist < minDistance) {
          minDistance = dist;
          closestLight = light;
        }
      }

      if (closestLight && minDistance < closestLight.radius) {
        // Vetor da luz até o monstro/player
        const dx = entity.x - closestLight.x;
        const dy = footY - closestLight.y;
        const dist = Math.max(1, minDistance);
        const nx = dx / dist;
        const ny = dy / dist;

        // Projeção direcional: afasta a sombra na direção oposta
        const maxOffset = 18;
        const offsetDist = Math.min(maxOffset, (dist / closestLight.radius) * maxOffset);
        
        shadow.x = entity.x + nx * offsetDist;
        shadow.y = footY + ny * (offsetDist * 0.5);

        // Rotação sutil alinhada à direção da luz
        const angle = Math.atan2(ny, nx);
        shadow.setRotation(angle);

        // Elongação proporcional à proximidade e distância da luz
        const stretch = 1.0 + (dist / closestLight.radius) * 0.4;
        const baseScaleX = entity.scaleX || 1.0;
        shadow.setScale(baseScaleX * stretch, baseScaleX * 0.45);

        // Alpha atenuado com base na intensidade da luz e distância
        const lightFactor = (1 - dist / closestLight.radius) * (closestLight.intensity || 1.0);
        shadow.setAlpha(Math.min(0.55, Math.max(0.18, 0.25 + lightFactor * 0.25)));
      } else {
        // Sombra de contato estática padrão sob os pés
        shadow.x = entity.x;
        shadow.y = footY;
        shadow.setRotation(0);
        const baseScaleX = entity.scaleX || 1.0;
        shadow.setScale(baseScaleX * 1.0, baseScaleX * 0.42);
        shadow.setAlpha(0.28);
      }
    });
  }

  public destroy(): void {
    this.shadowSprites.forEach((shadow) => {
      shadow.destroy();
    });
    this.shadowSprites.clear();
  }
}
