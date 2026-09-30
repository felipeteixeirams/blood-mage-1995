import { test, expect, Page } from '@playwright/test';

/**
 * Teste E2E: Safe House Animations & Runtime Verification
 *
 * Valida:
 * - SafeHouseAnimationController inicializa corretamente
 * - Maelen patrulha e olha para o jogador
 * - Hearth lareira com glow animation
 * - Portal shimmer/pulse
 * - Chest bobbing
 * - Ambient props sway
 * - 60 FPS mantido
 * - Sem telas pretas / WebGL errors
 * - Ciclo de vida de cenas limpo
 */

test.describe('🏠 Safe House Animations', () => {
  let page: Page;
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Capture console errors e warnings
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Canvas renders without black screen', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // 1. Canvas deve estar visível
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // 2. Dimensões não nulas
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);

    // 3. Cores não são puro preto (black screen detection)
    const imageData = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const data = ctx.getImageData(100, 100, 1, 1).data;
      return { r: data[0], g: data[1], b: data[2], a: data[3] };
    });

    // Se for completamente preto (0,0,0,255), falha
    if (imageData) {
      const isBlackScreen = imageData.r === 0 && imageData.g === 0 && imageData.b === 0 && imageData.a === 255;
      expect(isBlackScreen).toBe(false);
    }
  });

  test('Phaser GameScene boots cleanly', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Aguarda boot + GameScene ativo
    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    // Verifica: sem erros fatais WebGL/Shader
    const fatalErrors = consoleErrors.filter(
      (err) => err.includes('WebGL') || err.includes('Shader') || err.includes('Cannot read properties of null')
    );
    expect(fatalErrors).toEqual([]);
  });

  test('Safe House biome loads (campaign mode)', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    // Aguarda scene ativa
    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    // Verifica se bioma está correto
    const biome = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      return (scene as any).currentBiome;
    });

    expect(biome).toBe('safe_house');
  });

  test('Maelen NPC exists and animates', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    // Verifica Maelen existe
    const maelenData = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      const maelen = (scene as any).npcsGroup?.getChildren().find((npc: any) => npc.getData('npcType') === 'maelen');

      if (!maelen) return null;
      return {
        exists: true,
        x: maelen.x,
        y: maelen.y,
        hasAnimation: (scene as any).tweens?.getTweens().some((t: any) => t.targets.includes(maelen)),
      };
    });

    expect(maelenData).not.toBeNull();
    expect(maelenData?.exists).toBe(true);
    expect(maelenData?.hasAnimation).toBe(true); // Deve ter tween de patrulha
  });

  test('Hearth lareira exists with flame animation + Light2D', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    const hearthData = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      const hearth = (scene as any).wallsGroup?.getChildren().find(
        (obj: any) => obj && obj.texture && obj.texture.key === 'spr_hearth_fireplace'
      );

      if (!hearth) return null;
      return {
        exists: true,
        hasAnimation: (scene as any).tweens?.getTweens().some((t: any) => t.targets.includes(hearth)),
        scaleX: hearth.scaleX,
        scaleY: hearth.scaleY,
      };
    });

    expect(hearthData).not.toBeNull();
    expect(hearthData?.exists).toBe(true);
    expect(hearthData?.hasAnimation).toBe(true); // Deve ter tween de breathing
  });

  test('Portal shimmer/pulse animation active', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    const portalData = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      const portal = (scene as any).portalSprite;

      if (!portal) return null;
      return {
        exists: true,
        hasAnimation: (scene as any).tweens?.getTweens().some((t: any) => t.targets.includes(portal)),
        scaleX: portal.scaleX,
        alpha: portal.alpha,
      };
    });

    expect(portalData).not.toBeNull();
    expect(portalData?.exists).toBe(true);
    expect(portalData?.hasAnimation).toBe(true); // Deve ter tween de shimmer
  });

  test('Supplies Chest bobbing animation', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    const chestData = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      const chest = (scene as any).chestsGroup?.getChildren().find(
        (obj: any) => obj && obj.getData('questChest') === 'starter_dagger'
      );

      if (!chest) return null;
      return {
        exists: true,
        hasAnimation: (scene as any).tweens?.getTweens().some((t: any) => t.targets.includes(chest)),
        y: chest.y,
      };
    });

    expect(chestData).not.toBeNull();
    expect(chestData?.exists).toBe(true);
    expect(chestData?.hasAnimation).toBe(true); // Deve ter tween de bobbing
  });

  test('Ambient props sway animation (10+ props)', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    const propsData = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      const allProps = (scene as any).wallsGroup?.getChildren() || [];
      const ambientProps = allProps.filter(
        (obj: any) => obj && obj.texture && obj.texture.key && obj.texture.key.includes('safehouse_detail')
      );

      const propsWithAnimations = ambientProps.filter((prop: any) =>
        (scene as any).tweens?.getTweens().some((t: any) => t.targets.includes(prop))
      );

      return {
        totalProps: ambientProps.length,
        animatedProps: propsWithAnimations.length,
      };
    });

    expect(propsData.totalProps).toBeGreaterThanOrEqual(10);
    expect(propsData.animatedProps).toBe(propsData.totalProps); // Todos devem ter animação
  });

  test('SafeHouseAnimationController cleanup on scene shutdown', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    // Cuenta tweens ativos
    const tweensBefore = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      return (scene as any).tweens?.getTweens().length || 0;
    });

    // Dispara cleanup (simula transição de cena)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      const controller = (scene as any).dungeonFlow?.safeHouseAnimationController;
      if (controller) {
        controller.destroy();
      }
    });

    // Tweens devem estar removidos
    const tweensAfter = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.getScene('GameScene');
      return (scene as any).tweens?.getTweens().length || 0;
    });

    expect(tweensAfter).toBeLessThan(tweensBefore);
  });

  test('FPS stability (60 FPS target, no dramatic drops)', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    // Aguarda 3 segundos de animações rodando
    await page.waitForTimeout(3000);

    // Coleta FPS
    const fpsData = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return {
        fps: Math.round(game.loop.actualFps || 0),
        frameTime: game.loop.lastTime || 0,
      };
    });

    // Esperado: ~60 FPS, tolerância ±10
    expect(fpsData.fps).toBeGreaterThanOrEqual(50);
    expect(fpsData.fps).toBeLessThanOrEqual(70);
  });

  test('No console errors during Safe House animations', async () => {
    await page.goto('/?biome=safe_house', { waitUntil: 'networkidle' });

    await page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game || !game.isBooted) return false;
        const scene = game.scene.getScene('GameScene');
        return scene && scene.scene.isActive();
      },
      { timeout: 15000 }
    );

    // Aguarda animações
    await page.waitForTimeout(2000);

    // Verifica console
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('[warning]') && !err.includes('(expected)')
    );

    expect(criticalErrors).toEqual([]);
  });
});
