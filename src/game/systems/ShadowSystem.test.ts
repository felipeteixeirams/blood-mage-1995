import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShadowSystem } from './ShadowSystem';

function makeMockScene() {
  const textures = {
    exists: vi.fn(() => true),
  };

  const add = {
    image: vi.fn(() => ({
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setRotation: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
    })),
  };

  const scene = {
    textures,
    add,
  };

  return { scene, textures, add };
}

// Captura a instância de sombra mockada criada pela última chamada de
// `scene.add.image()` — necessário porque o mock retorna um objeto novo a
// cada chamada, e os testes abaixo precisam inspecionar esse objeto depois
// de `registerEntity`/`update` rodarem.
function lastCreatedShadow(add: ReturnType<typeof makeMockScene>['add']) {
  const results = add.image.mock.results;
  return results[results.length - 1].value;
}

describe('ShadowSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra entidade e cria imagem de sombra com depth correto', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 150,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    expect(add.image).toHaveBeenCalledWith(100, 162, 'spr_shadow_disc');
  });

  it('calcula projeção direcional quando próxima de fonte de luz', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 100,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    const shadow = lastCreatedShadow(add);

    // Luz posicionada à esquerda da entidade (x: 50, y: 100)
    const lights = [{ x: 50, y: 100, radius: 150, intensity: 1.0 }];

    system.update(lights);

    // Deve projetar a sombra para a direita (afastada da luz, x > entity.x)
    expect(shadow.x).toBeGreaterThan(mockEntity.x);
    // Sombra sempre visível quando a entidade está ativa e visível
    expect(shadow.setVisible).toHaveBeenCalledWith(true);
    // Rotação/escala/alpha recalculados a cada update (não deixados no default)
    expect(shadow.setRotation).toHaveBeenCalled();
    expect(shadow.setScale).toHaveBeenCalled();
    expect(shadow.setAlpha).toHaveBeenCalled();
  });

  it('projeta sombra de contato estática (sem rotação) quando não há luz influente por perto', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 100,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    const shadow = lastCreatedShadow(add);

    // Luz distante demais (fora do radius) não deve influenciar a projeção
    system.update([{ x: 1000, y: 1000, radius: 10, intensity: 1.0 }]);

    const footY = mockEntity.y + mockEntity.height * 0.38;
    expect(shadow.x).toBe(mockEntity.x);
    expect(shadow.y).toBe(footY);
    expect(shadow.setRotation).toHaveBeenCalledWith(0);
  });

  it('remove e destrói a sombra ao desregistrar a entidade', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 150,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    const shadow = lastCreatedShadow(add);

    system.unregisterEntity(mockEntity);
    expect(shadow.destroy).toHaveBeenCalledTimes(1);

    // Depois de desregistrada, um update() não deve tentar tocar na sombra
    // destruída (o Map interno não deve mais conter a entidade).
    vi.clearAllMocks();
    system.update([]);
    expect(shadow.setVisible).not.toHaveBeenCalled();
  });

  it('oculta a sombra quando a entidade fica inativa ou invisível', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    // Registrada enquanto ainda ativa — registerEntity() descarta entidades
    // já inativas de cara, então o teste precisa desativar DEPOIS de
    // registrar, pra exercitar o caminho de update() que oculta a sombra.
    const mockEntity = {
      x: 100,
      y: 150,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    const shadow = lastCreatedShadow(add);

    mockEntity.active = false;
    system.update([]);

    expect(shadow.setVisible).toHaveBeenCalledWith(false);
    // Nenhum recálculo de posição/rotação deve acontecer pra sombra oculta
    expect(shadow.setRotation).not.toHaveBeenCalled();
  });

  it('destrói o sistema limpando todas as sombras ativas', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 150,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    const shadow = lastCreatedShadow(add);

    system.destroy();
    expect(shadow.destroy).toHaveBeenCalledTimes(1);

    // Um update() após destroy() não deve reviver/tocar em nenhuma sombra.
    vi.clearAllMocks();
    system.update([]);
    expect(shadow.setVisible).not.toHaveBeenCalled();
  });
});
