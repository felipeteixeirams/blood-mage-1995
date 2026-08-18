import { describe, it, expect, vi } from 'vitest';

// Mock mínimo do Phaser para instanciar o Projectile sem WebGL
vi.mock('phaser', () => {
  class Sprite {
    public active = false;
    public visible = false;
    public x = 0;
    public y = 0;
    public body: any = null;
    private velocityX = 0;
    private velocityY = 0;
    constructor() {}
    setActive(v: boolean) { this.active = v; return this; }
    setVisible(v: boolean) { this.visible = v; return this; }
    setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
    setRotation() { return this; }
    setSize() { return this; }
    setVelocity(x: number, y: number) { this.velocityX = x; this.velocityY = y; return this; }
    getVelocityX() { return this.velocityX; }
    getVelocityY() { return this.velocityY; }
  }
  class Scene {
    public add = { existing: () => {} };
    public physics = { add: { existing: () => {} } };
  }
  class PhysicsSprite extends Sprite {
    public scene: any;
    constructor(scene: any, x: number, y: number, key: string) {
      super();
      this.scene = scene || new Scene();
    }
  }
  return {
    default: { Physics: { Arcade: { Sprite: PhysicsSprite } } },
  };
});

import { Projectile } from './Projectile';

function makeScene() {
  return {
    add: { existing: vi.fn() },
    physics: { add: { existing: vi.fn() } },
  } as any;
}

describe('Projectile (pooling)', () => {
  it('fire() ativa e posiciona o projétil', () => {
    const proj = new Projectile(makeScene(), 0, 0, 'proj_blood_bolt');
    proj.fire(100, 50, 0, 220, 15, false);
    expect(proj.active).toBe(true);
    expect(proj.visible).toBe(true);
    expect(proj.x).toBe(100);
    expect(proj.y).toBe(50);
    expect(proj.damage).toBe(15);
    expect(proj.isEnemyProjectile).toBe(false);
  });

  it('releaseToPool() desativa e chama o callback de expiração uma única vez', () => {
    const proj = new Projectile(makeScene(), 0, 0, 'proj_blood_bolt');
    const releaseCb = vi.fn();
    proj.setOnExpired(releaseCb);
    proj.fire(0, 0, 0, 100, 10);
    proj.releaseToPool();
    expect(proj.active).toBe(false);
    expect(proj.visible).toBe(false);
    expect(releaseCb).toHaveBeenCalledTimes(1);
    expect(releaseCb).toHaveBeenCalledWith(proj);
  });

  it('releaseToPool() sem callback não lança', () => {
    const proj = new Projectile(makeScene(), 0, 0, 'proj_blood_bolt');
    proj.fire(0, 0, 0, 100, 10);
    expect(() => proj.releaseToPool()).not.toThrow();
  });

  it('updateProjectile() libera o projétil quando o lifespan expira', () => {
    const proj = new Projectile(makeScene(), 0, 0, 'proj_blood_bolt');
    const releaseCb = vi.fn();
    proj.setOnExpired(releaseCb);
    proj.fire(0, 0, 0, 100, 10);
    proj.updateProjectile(0, 3000); // lifespan de 2500ms é excedido
    expect(releaseCb).toHaveBeenCalledTimes(1);
    expect(proj.active).toBe(false);
  });

  it('activate/deactivate/reset cumprem a interface PooledObject', () => {
    const proj = new Projectile(makeScene(), 0, 0, 'proj_blood_bolt');
    proj.activate(5, 6);
    expect(proj.active).toBe(true);
    expect(proj.visible).toBe(true);
    expect(proj.x).toBe(5);
    expect(proj.y).toBe(6);

    proj.deactivate();
    expect(proj.active).toBe(false);
    expect(proj.visible).toBe(false);

    proj.damage = 99;
    proj.isEnemyProjectile = true;
    proj.statusEffectOnHit = { type: 'poison', chance: 0.5 };
    proj.reset();
    expect(proj.damage).toBe(20);
    expect(proj.isEnemyProjectile).toBe(false);
    expect(proj.statusEffectOnHit).toBeUndefined();
  });
});
