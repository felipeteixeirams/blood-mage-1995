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

    // Etapa 1: Centro da câmera e raio circunscrito ao quadrado (viewport + margem)
    const centerX = cameraX + cameraWidth / 2;
    const centerY = cameraY + cameraHeight / 2;
    const halfW = cameraWidth / 2 + this.margin;
    const halfH = cameraHeight / 2 + this.margin;
    const maxRadiusSq = halfW * halfW + halfH * halfH;

    objects.forEach((obj) => {
      if (!obj.active) return;

      const wasCulled = this.culledObjects.has(obj);

      // Descarte rápido via distância ao quadrado do centro do objeto até o centro da câmera
      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const dx = objCenterX - centerX;
      const dy = objCenterY - centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq > maxRadiusSq) {
        if (!wasCulled) {
          obj.setVisible(false);
          this.culledObjects.add(obj);
        }
        return;
      }

      // Etapa 2: Verificação AABB detalhada dentro do raio circunscrito
      const isInViewport =
        obj.x + obj.width > viewportLeft &&
        obj.x < viewportRight &&
        obj.y + obj.height > viewportTop &&
        obj.y < viewportBottom;

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

  /**
   * Verificar se um objeto está atualmente culled (fora da viewport).
   */
  public isCulled(obj: CullableObject): boolean {
    return this.culledObjects.has(obj);
  }
}

export default ViewportCuller;
