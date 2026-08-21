import { describe, it, expect, vi } from 'vitest';
import { ObjectPool } from './ObjectPool';

function makePooledObject() {
  return {
    active: false,
    activatedCalls: [] as Array<{ x: number; y: number; args: unknown[] }>,
    deactivated: 0,
    resets: 0,
    activate(x: number, y: number, ...args: unknown[]) {
      this.activatedCalls.push({ x, y, args });
      this.active = true;
    },
    deactivate() {
      this.deactivated++;
      this.active = false;
    },
    reset() {
      this.resets++;
    },
  };
}

describe('ObjectPool', () => {
  it('pré-popula o pool com objetos inativos', () => {
    const pool = new ObjectPool(() => makePooledObject(), 5);
    expect(pool.getPoolSize()).toBe(5);
    expect(pool.getActiveCount()).toBe(0);
  });

  it('get() ativa o objeto e chama activate com posição/args', () => {
    const pool = new ObjectPool(() => makePooledObject(), 1);
    const obj = pool.get(10, 20, 'foo', 42);
    expect(obj.active).toBe(true);
    expect(obj.activatedCalls).toHaveLength(1);
    expect(obj.activatedCalls[0]).toMatchObject({ x: 10, y: 20, args: ['foo', 42] });
    expect(pool.getActiveCount()).toBe(1);
  });

  it('release() desativa, reseta e devolve ao pool', () => {
    const pool = new ObjectPool(() => makePooledObject(), 1);
    const obj = pool.get(0, 0);
    pool.release(obj);
    expect(obj.active).toBe(false);
    expect(obj.deactivated).toBe(1);
    expect(obj.resets).toBe(1);
    expect(pool.getActiveCount()).toBe(0);
    expect(pool.getPoolSize()).toBe(1);
  });

  it('release() de objeto não-obtido do pool é no-op (idempotente)', () => {
    const pool = new ObjectPool(() => makePooledObject(), 1);
    const foreign = makePooledObject();
    pool.release(foreign as any);
    expect(foreign.deactivated).toBe(0);
  });

  it('expande dinamicamente quando o pool esgota', () => {
    const pool = new ObjectPool(() => makePooledObject(), 1);
    const a = pool.get(0, 0);
    const b = pool.get(0, 0);
    expect(a).not.toBe(b);
    expect(pool.getActiveCount()).toBe(2);
    expect(pool.getPoolSize()).toBe(2); // pool esgotado (0) + 2 ativos; o expandido vai direto para ativo
  });

  it('reusa objeto liberado (mesma referência)', () => {
    const pool = new ObjectPool(() => makePooledObject(), 1);
    const a = pool.get(0, 0);
    pool.release(a);
    const b = pool.get(0, 0);
    expect(b).toBe(a);
  });

  it('releaseAll() libera todos os ativos', () => {
    const pool = new ObjectPool(() => makePooledObject(), 2);
    pool.get(0, 0);
    pool.get(0, 0);
    expect(pool.getActiveCount()).toBe(2);
    pool.releaseAll();
    expect(pool.getActiveCount()).toBe(0);
  });

  it('forEachActive() itera somente objetos ativos', () => {
    const pool = new ObjectPool(() => makePooledObject(), 3);
    const a = pool.get(0, 0);
    pool.get(0, 0);
    pool.release(a);
    const visited: string[] = [];
    pool.forEachActive((obj) => visited.push(obj.active ? 'active' : 'inactive'));
    expect(visited).toEqual(['active']);
  });

  it('avisa no console ao expandir dinamicamente', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pool = new ObjectPool(() => makePooledObject(), 0);
    pool.get(0, 0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
