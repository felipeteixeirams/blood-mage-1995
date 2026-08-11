/**
 * ViewportCuller (Fase 5)
 * Culling rigoroso de objetos fora da viewport
 * Melhora performance desabilitando renderização de objetos invisíveis
 */

export interface CullableObject {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  visible: boolean;
  setActive(active: boolean): void;
  setVisible(visible: boolean): void;
}

export class ViewportCuller {
  private culledObjects: Set<CullableObject> = new Set();
  private margin: number; // pixels para fora da viewport

  constructor(margin: number = 100) {
    this.margin = margin;
  }

  /**
   * Cullar/Visibilizar objetos baseado na viewport
   */
  public update(
    cameraX: number,
    cameraY: number,
    cameraWidth: number,
    cameraHeight: number,
    objects: CullableObject[]
  ): void {
    const viewportLeft = cameraX - this.margin;
    const viewportRight = cameraX + cameraWidth + this.margin;
    const viewportTop = cameraY - this.margin;
    const viewportBottom = cameraY + cameraHeight + this.margin;

    objects.forEach((obj) => {
      if (!obj.active) return;

      const isInViewport =
        obj.x + obj.width > viewportLeft &&
        obj.x < viewportRight &&
        obj.y + obj.height > viewportTop &&
        obj.y < viewportBottom;

      const wasCulled = this.culledObjects.has(obj);

      if (isInViewport && wasCulled) {
        // Objeto entrando na viewport
        obj.setVisible(true);
        this.culledObjects.delete(obj);
      } else if (!isInViewport && !wasCulled) {
        // Objeto saindo da viewport
        obj.setVisible(false);
        this.culledObjects.add(obj);
      }
    });
  }

  /**
   * Resetar culler
   */
  public reset(): void {
    this.culledObjects.forEach((obj) => {
      obj.setVisible(true);
    });
    this.culledObjects.clear();
  }

  /**
   * Obter contagem de objetos culled
   */
  public getCulledCount(): number {
    return this.culledObjects.size;
  }
}

export default ViewportCuller;
