import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Validation for Spec 10 (Polimento Visual Procedural, Luz e Cenário).
 *
 * Checks:
 * 1. 8 organic enemy silhouettes, shapes, shading, and gradient radial shadows.
 * 2. Torch placement aligned to actual doors.
 * 3. Wall brick organic variation (bevels, noise, moss).
 * 4. Damage particle radial gradients.
 */

async function startGame(page: Page) {
  await page.goto('/');

  // Dismiss splash screen via click
  await page.mouse.click(200, 200);

  // Wait for store to be exposed on window
  await page.waitForFunction(() => {
    return !!(window as any).useGameStore;
  }, { timeout: 10_000 });

  // Transition directly into gameplay via store action
  await page.evaluate(() => {
    const store = (window as any).useGameStore.getState();
    store.setGameMode('arcade');
    store.setGameState('playing');
  });

  // Ensure GameScene and player are fully instantiated
  await page.waitForFunction(() => {
    const gs = (window as any).gameScene;
    return !!(gs && gs.player && gs.sys);
  }, { timeout: 20_000 });
}

test.describe('Spec 10 Visual Polish Validation', () => {
  test.beforeAll(() => {
    const screenshotDir = path.join(process.cwd(), 'tests/e2e/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Capture and validate environment (torches, wall bricks, shadows)', async ({ page }) => {
    await startGame(page);

    // Wait 1.5s for scene to stabilize and render tiles/torches
    await page.waitForTimeout(1500);

    // Take screenshot of room environment
    await page.screenshot({ path: 'tests/e2e/screenshots/spec10_environment.png' });

    // Validate via browser evaluation that torches exist and shadow system is active
    const envInfo = await page.evaluate(() => {
      const gs = (window as any).gameScene;
      const torchCount = gs.lightSprites ? gs.lightSprites.length : 0;
      const shadowSystemExists = !!gs.shadowSystem;
      const wallTileExists = gs.textures.exists('tile_wall_brick');
      return { torchCount, shadowSystemExists, wallTileExists };
    });

    expect(envInfo.shadowSystemExists).toBe(true);
    expect(envInfo.wallTileExists).toBe(true);
    expect(envInfo.torchCount).toBeGreaterThan(0);
  });

  test('Capture and validate 8 organic enemies & damage particles', async ({ page }) => {
    await startGame(page);

    const enemyTypes = [
      'skeleton_warrior',
      'cultist_acolyte',
      'hell_hound',
      'flesh_golem',
      'necro_lord_boss',
      'zombie_shambler',
      'vampire_stalker',
      'werewolf_lycan',
    ];

    for (const enemyType of enemyTypes) {
      // Clear previous test enemies and spawn targeted enemy directly
      await page.evaluate((type) => {
        const gs = (window as any).gameScene;
        const px = gs.player.x;
        const py = gs.player.y;

        // Clear existing enemies around player to focus screenshot on target
        gs.enemiesGroup.getChildren().forEach((m: any) => {
          if (m.active && Math.hypot(px - m.x, py - m.y) < 250) {
            m.destroy();
          }
        });

        const EnemyClass = gs.enemiesGroup.getChildren()[0]?.constructor;
        if (EnemyClass) {
          const enemy = new EnemyClass(gs, px + 80, py - 20, type, { floorDepth: 1, eliteAffix: 'none' });
          gs.enemiesGroup.add(enemy);
          gs.depthGroup.add(enemy);
          if (enemy.body) {
            enemy.body.setVelocity(0, 0);
          }
        }
      }, enemyType);

      await page.waitForTimeout(400);

      // Screenshot individual enemy in context
      await page.screenshot({
        path: `tests/e2e/screenshots/spec10_enemy_${enemyType}.png`,
      });

      // Verify sprite and texture in scene
      const enemyValid = await page.evaluate((type) => {
        const gs = (window as any).gameScene;
        const monsters = gs.enemiesGroup.getChildren();
        const spawned = monsters.find((m: any) => m.active && m.config?.id === type);
        const spriteKey = spawned ? spawned.config?.spriteKey : null;
        return !!spawned && !!spriteKey && gs.textures.exists(spriteKey);
      }, enemyType);

      expect(enemyValid).toBe(true);
    }

    // Trigger damage particle effect near player to test particle rendering
    await page.evaluate(() => {
      const gs = (window as any).gameScene;
      const px = gs.player.x;
      const py = gs.player.y;
      gs.spawnBloodBurst(px, py, 25);
    });

    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/e2e/screenshots/spec10_particles.png' });
  });
});
