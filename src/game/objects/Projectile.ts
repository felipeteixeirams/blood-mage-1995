import Phaser from 'phaser';

/**
 * Projectile — projétil de sangue (player) ou energia (inimigos).
 * Suporta pooling (Fase 5/ObjectPool): em vez de destroy(), o projétil
 * é desativado com releaseToPool() e devolvido ao pool para reuso.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 20;
  public isEnemyProjectile: boolean = false;
  public statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number };
  private lifespanTimer: number = 3000;
  private onExpired?: (proj: Projectile) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string = 'proj_blood_bolt') {
    super(scene, x, y, key);
    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  /**
   * Registrar callback de expiração (chamado pelo pool quando a vida acaba).
   */
  public setOnExpired(cb: (proj: Projectile) => void): void {
    this.onExpired = cb;
  }

  /**
   * Interface PooledObject: ativa/posiciona o objeto quando obtido do pool.
   * A lógica de disparo completa é aplicada via fire() pelos chamadores.
   */
  public activate(x: number, y: number, ..._args: unknown[]): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
  }

  /**
   * Interface PooledObject: desativa o objeto (corpo físico parado, invisível).
   */
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.body?.reset(0, 0);
  }

  /**
   * Interface PooledObject: zera estado para reuso.
   */
  public reset(): void {
    this.damage = 20;
    this.isEnemyProjectile = false;
    this.statusEffectOnHit = undefined;
    this.lifespanTimer = 2500;
  }

  public fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    isEnemy: boolean = false,
    statusEffectOnHit?: { type: 'bleeding' | 'poison' | 'infection'; chance: number }
  ) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.isEnemyProjectile = isEnemy;
    this.statusEffectOnHit = statusEffectOnHit;
    this.lifespanTimer = 2500;

    this.setRotation(angle);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  /**
   * Devolve o projétil ao pool (desativa corpo físico, esconde e zera estado).
   */
  public releaseToPool(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.setPosition(0, 0);
    this.body?.reset(0, 0);
    if (this.onExpired) {
      const cb = this.onExpired;
      this.onExpired = undefined;
      cb(this);
    }
  }

  public updateProjectile(time: number, delta: number) {
    if (!this.active) return;
    this.lifespanTimer -= delta;
    if (this.lifespanTimer <= 0) {
      this.releaseToPool();
    }
  }

  /**
   * Hook chamado pelo Physics Group (runChildUpdate: true).
   */
  public update(_time: number, delta: number) {
    this.updateProjectile(_time, delta);
  }
}
