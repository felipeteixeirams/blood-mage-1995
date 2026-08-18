import { describe, it, expect, vi } from 'vitest';
import { ObjectPool, PooledObject } from './ObjectPool';

interface CustomPooledObject extends PooledObject<[string, number]> {
  activatedCalls: Array<{ x: number; y: number; args: [string, number] }>;
  deactivated: number;
  resets: number;
}

function makePooledObject(): CustomPooledObject {
  return {
    active: false,
    activatedCalls: [],
    deactivated: 0,
    resets: 0,
    activate(x: number, y: number, text: string, num: number) {
      this.activatedCalls.push({ x, y, args: [text, num] });
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
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 5);
    expect(pool.getPoolSize()).toBe(5);
    expect(pool.getActiveCount()).toBe(0);
  });

  it('get() ativa o objeto e chama activate com posição/args tipados', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 1);
    const obj = pool.get(10, 20, 'foo', 42);
    expect(obj.active).toBe(true);
    expect(obj.activatedCalls).toHaveLength(1);
    expect(obj.activatedCalls[0]).toMatchObject({ x: 10, y: 20, args: ['foo', 42] });
    expect(pool.getActiveCount()).toBe(1);
  });

  it('release() desativa, reseta e devolve ao pool', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 1);
    const obj = pool.get(0, 0, 'a', 1);
    pool.release(obj);
    expect(obj.active).toBe(false);
    expect(obj.deactivated).toBe(1);
    expect(obj.resets).toBe(1);
    expect(pool.getActiveCount()).toBe(0);
    expect(pool.getPoolSize()).toBe(1);
  });

  it('release() de objeto não-obtido do pool é no-op e idempotente em múltiplas chamadas', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 1);
    const foreign = makePooledObject();
    pool.release(foreign);
    expect(foreign.deactivated).toBe(0);

    const obj = pool.get(0, 0, 'a', 1);
    pool.release(obj);
    expect(obj.deactivated).toBe(1);
    // Segunda chamada repetida em objeto já liberado
    pool.release(obj);
    expect(obj.deactivated).toBe(1);
  });

  it('expande dinamicamente quando o pool esgota', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 1);
    const a = pool.get(0, 0, 'a', 1);
    const b = pool.get(0, 0, 'b', 2);
    expect(a).not.toBe(b);
    expect(pool.getActiveCount()).toBe(2);
    expect(pool.getPoolSize()).toBe(2); // pool esgotado (0) + 2 ativos; o expandido vai direto para ativo
  });

  it('reusa objeto liberado (mesma referência)', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 1);
    const a = pool.get(0, 0, 'a', 1);
    pool.release(a);
    const b = pool.get(0, 0, 'b', 2);
    expect(b).toBe(a);
  });

  it('releaseAll() libera todos os ativos sem gerar GC (iterador direto)', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 2);
    const obj1 = pool.get(0, 0, 'a', 1);
    const obj2 = pool.get(0, 0, 'b', 2);
    expect(pool.getActiveCount()).toBe(2);

    pool.releaseAll();
    expect(pool.getActiveCount()).toBe(0);
    expect(obj1.active).toBe(false);
    expect(obj2.active).toBe(false);
    expect(obj1.deactivated).toBe(1);
    expect(obj2.deactivated).toBe(1);
  });

  it('forEachActive() itera somente objetos ativos', () => {
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 3);
    const a = pool.get(0, 0, 'a', 1);
    pool.get(0, 0, 'b', 2);
    pool.release(a);
    const visited: string[] = [];
    pool.forEachActive((obj) => visited.push(obj.active ? 'active' : 'inactive'));
    expect(visited).toEqual(['active']);
  });

  it('avisa no console ao expandir dinamicamente', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pool = new ObjectPool<CustomPooledObject, [string, number]>(() => makePooledObject(), 0);
    pool.get(0, 0, 'a', 1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
