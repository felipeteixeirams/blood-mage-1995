import { describe, it, expect } from 'vitest';
import { ViewportCuller } from './ViewportCuller';

function makeObj(x: number, y: number, width = 32, height = 32) {
  const state = { x, y, width, height, active: true, visible: true };
  return {
    ...state,
    setActive: (v: boolean) => { state.active = v; },
    setVisible: (v: boolean) => { state.visible = v; },
    get active() { return state.active; },
    set active(v: boolean) { state.active = v; },
    get visible() { return state.visible; },
    set visible(v: boolean) { state.visible = v; },
  } as any;
}

describe('ViewportCuller', () => {
  it('deixa objeto dentro da viewport visível', () => {
    const culler = new ViewportCuller(50);
    const obj = makeObj(100, 100);
    culler.update(0, 0, 800, 600, [obj]);
    expect(obj.visible).toBe(true);
    expect(culler.getCulledCount()).toBe(0);
  });

  it('esconde objeto fora da viewport (com margem)', () => {
    const culler = new ViewportCuller(50);
    const obj = makeObj(900, 100); // fora dos 800 de largura
    culler.update(0, 0, 800, 600, [obj]);
    expect(obj.visible).toBe(false);
    expect(culler.isCulled(obj)).toBe(true);
    expect(culler.getCulledCount()).toBe(1);
  });

  it('re-exibe objeto que volta para a viewport', () => {
    const culler = new ViewportCuller(50);
    const obj = makeObj(900, 100);
    culler.update(0, 0, 800, 600, [obj]);
    expect(obj.visible).toBe(false);
    obj.x = 200;
    culler.update(0, 0, 800, 600, [obj]);
    expect(obj.visible).toBe(true);
    expect(culler.getCulledCount()).toBe(0);
  });

  it('ignora objetos inativos', () => {
    const culler = new ViewportCuller(50);
    const obj = makeObj(900, 100);
    obj.active = false;
    culler.update(0, 0, 800, 600, [obj]);
    expect(obj.visible).toBe(true); // não mexido pois está inativo
    expect(culler.getCulledCount()).toBe(0);
  });

  it('margem evita culling de objeto no limiar', () => {
    const culler = new ViewportCuller(100);
    const obj = makeObj(850, 100); // dentro de 800 + margem 100
    culler.update(0, 0, 800, 600, [obj]);
    expect(obj.visible).toBe(true);
  });

  it('reset() re-exibe todos os objetos culled', () => {
    const culler = new ViewportCuller(50);
    const obj = makeObj(900, 100);
    culler.update(0, 0, 800, 600, [obj]);
    expect(culler.getCulledCount()).toBe(1);
    culler.reset();
    expect(obj.visible).toBe(true);
    expect(culler.getCulledCount()).toBe(0);
  });
});
