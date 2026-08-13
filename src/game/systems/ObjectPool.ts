/**
 * ObjectPool (Fase 5)
 * Pool de objetos reutilizáveis para performance em 60+ FPS
 * Reduz garbage collection e alocação de memória
 */

export interface PooledObject {
  active: boolean;
  reset(): void;
  activate(x: number, y: number, ...args: any[]): void;
  deactivate(): void;
}

export class ObjectPool<T extends PooledObject> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private initialSize: number;

  constructor(factory: () => T, initialSize: number = 20) {
    this.factory = factory;
    this.initialSize = initialSize;
    this.expandPool(initialSize);
  }

  /**
   * Expandir pool adicionando novos objetos
   */
  private expandPool(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  /**
   * Obter objeto do pool ou criar novo
   */
  public get(x: number, y: number, ...args: any[]): T {
    let obj: T;

    // Procurar objeto inativo no pool
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      // Se pool vazio, criar novo (expandir)
      obj = this.factory();
      console.warn(`ObjectPool: Expandindo dinamicamente (tipo: ${obj.constructor.name})`);
    }

    // Ativar objeto
    obj.active = true;
    obj.activate(x, y, ...args);
    this.active.add(obj);

    return obj;
  }

  /**
   * Devolver objeto ao pool
   */
  public release(obj: T): void {
    if (!this.active.has(obj)) return;

    obj.active = false;
    obj.deactivate();
    obj.reset();
    this.active.delete(obj);
    this.pool.push(obj);
  }

  /**
   * Liberar todos os objetos ativos
   */
  public releaseAll(): void {
    const toRelease = Array.from(this.active);
    toRelease.forEach((obj) => this.release(obj));
  }

  /**
   * Obter contagem de objetos ativos
   */
  public getActiveCount(): number {
    return this.active.size;
  }

  /**
   * Obter contagem total no pool
   */
  public getPoolSize(): number {
    return this.pool.length + this.active.size;
  }

  /**
   * Executar função em todos os objetos ativos
   */
  public forEachActive(fn: (obj: T) => void): void {
    this.active.forEach(fn);
  }
}

export default ObjectPool;
