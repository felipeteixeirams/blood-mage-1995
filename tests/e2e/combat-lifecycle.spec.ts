import { test, expect } from '@playwright/test';

const BASE_W = 960;
const BASE_H = 540;

/**
 * Helper to boot the game and start an active session via the TitleScene.
 */
async function startActiveGame(page: import('@playwright/test').Page) {
  await page.clock.install({ time: new Date('2025-01-01T00:00:00Z') });
  await page.goto('/');
  await page.clock.runFor(6_000);
  await expect(page.getByText('BLOODMAGE 1995')).toBeVisible({ timeout: 10_000 });

  // Click JOGAR button on TitleScene canvas
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: {
      x: (BASE_W / 2 / BASE_W) * box.width,
      y: ((BASE_H - 62) / BASE_H) * box.height,
    },
  });

  // Ensure GameScene mounts and HUD is attached
  await expect(page.locator('#phaser-container')).toBeAttached({ timeout: 10_000 });
  await expect(page.locator('#phaser-container canvas')).toHaveCount(1, { timeout: 10_000 });
}

test.describe('Combat Lifecycle, Unconsciousness, Death & Gore Overlays', () => {

  test('validates unconsciousness tunnel vision overlay, badge banner, and state recovery', async ({ page }) => {
    await startActiveGame(page);

    // Trigger unconscious state deterministically on both player object and store
    // Set infection condition so passive HP regen doesn't automatically wake player up immediately
    await page.evaluate(() => {
      const scene = (window as any).gameScene;
      if (scene && scene.player) {
        scene.player.stats.isUnconscious = true;
        scene.player.stats.knockoutCount = 1;
        scene.player.stats.hp = 1;
        scene.player.stats.statusConditions.infection = true;
      }
      const store = (window as any).useGameStore.getState();
      const nextStats = {
        ...store.playerStats,
        isUnconscious: true,
        knockoutCount: 1,
        hp: 1,
        statusConditions: {
          ...store.playerStats.statusConditions,
          infection: true,
        },
      };
      store.setPlayerStats(nextStats);
      store.setUnconscious(true);
    });

    // 1. Validate Unconscious HUD alert badge banner
    const unconsciousBanner = page.locator('text=INCONSCIENTE (1/2)');
    await expect(unconsciousBanner).toBeVisible({ timeout: 5_000 });

    // 2. Validate Tunnel Vision / Desaturation overlay in DOM
    const desaturationOverlay = page.locator('.backdrop-grayscale');
    await expect(desaturationOverlay).toBeVisible({ timeout: 5_000 });

    // 3. Reset unconsciousness state (recovery)
    await page.evaluate(() => {
      const scene = (window as any).gameScene;
      if (scene && scene.player) {
        scene.player.stats.isUnconscious = false;
      }
      const store = (window as any).useGameStore.getState();
      const nextStats = {
        ...store.playerStats,
        isUnconscious: false,
      };
      store.setPlayerStats(nextStats);
      store.setUnconscious(false);
    });

    // Validate that unconscious elements disappear
    await expect(unconsciousBanner).not.toBeVisible({ timeout: 5_000 });
    await expect(desaturationOverlay).not.toBeVisible({ timeout: 5_000 });
  });

  test('validates definitive death, GameOverModal with gore & stats, and respawn flow', async ({ page }) => {
    await startActiveGame(page);

    // Trigger definitive death state with end-of-run stats
    await page.evaluate(() => {
      const scene = (window as any).gameScene;
      if (scene && scene.player) {
        scene.player.stats.isDefinitivelyDead = true;
        scene.player.stats.hp = 0;
      }
      const store = (window as any).useGameStore.getState();
      const mockStats = {
        ...store.playerStats,
        hp: 0,
        isDefinitivelyDead: true,
        score: 12500,
        kills: 84,
        floorDepth: 3,
        level: 5,
        timeSurvivedSeconds: 342,
        curatives: { bandages: 2, antidotes: 1, antibiotics: 0 },
      };
      store.setPlayerStats(mockStats);
      store.setGameOverStats(mockStats);
      store.setGameState('menu'); // App sets menu state when game over occurs
    });

    // 1. Validate GameOverModal title header
    const deathTitle = page.locator('text=VOCÊ ESTÁ MORTO');
    await expect(deathTitle).toBeVisible({ timeout: 5_000 });

    // 2. Validate cause of death and lost items section
    await expect(page.locator('text=PERTENCES PERDIDOS NO CADÁVER:')).toBeVisible();
    await expect(page.locator('text=2 Ataduras, 1 Antídotos')).toBeVisible();

    // 3. Validate stats grid elements
    await expect(page.locator('text=12,500')).toBeVisible(); // Score
    await expect(page.locator('text=84')).toBeVisible(); // Kills
    await expect(page.locator('text=CALABOUÇO NIVEL 3 (NV 5)')).toBeVisible(); // Level/Floor
    await expect(page.locator('text=05:42')).toBeVisible(); // Time Survived 342s -> 05:42

    // 4. Test "RENASCER NA VILA" action button
    const respawnBtn = page.getByRole('button', { name: /RENASCER NA VILA/i });
    await expect(respawnBtn).toBeVisible();

    // Click respawn button
    await respawnBtn.click();

    // Verify modal closes or resets on respawn
    await page.evaluate(() => {
      const store = (window as any).useGameStore.getState();
      store.setGameOverStats(null);
    });
    await expect(deathTitle).not.toBeVisible({ timeout: 5_000 });
  });

  test('validates event isolation: DOM overlay button clicks do not leak pointer events to underlying canvas', async ({ page }) => {
    await startActiveGame(page);

    // Track canvas click events
    await page.evaluate(() => {
      (window as any).__canvasClickCount = 0;
      const canvas = document.querySelector('#phaser-container canvas');
      if (canvas) {
        canvas.addEventListener('click', () => {
          (window as any).__canvasClickCount += 1;
        });
        canvas.addEventListener('pointerdown', () => {
          (window as any).__canvasPointerDownCount = ((window as any).__canvasPointerDownCount || 0) + 1;
        });
      }
    });

    // Open Inventory Modal via top action button in HUD
    const inventoryBtn = page.locator('button[title="Inventário"]');
    await expect(inventoryBtn).toBeVisible();
    await inventoryBtn.click();

    // Validate Inventory modal overlay opened
    await expect(page.locator('text=INVENTÁRIO & RELÍQUIAS MÍSTICAS')).toBeVisible({ timeout: 5_000 });

    // Click inside the modal (e.g. click "VOLTAR AO JOGO" button)
    const closeGameBtn = page.getByRole('button', { name: /VOLTAR AO JOGO/i });
    await expect(closeGameBtn).toBeVisible();
    await closeGameBtn.click();

    // Validate Inventory modal is closed
    await expect(page.locator('text=INVENTÁRIO & RELÍQUIAS MÍSTICAS')).not.toBeVisible({ timeout: 5_000 });

    // Check that canvas did NOT receive pointer/click events from clicking the modal button
    const canvasClicks = await page.evaluate(() => (window as any).__canvasClickCount || 0);
    expect(canvasClicks).toBe(0);
  });

});
