import { test, expect } from '@playwright/test';

/**
 * Golden screenshot tests.
 *
 * The Phaser scenes are animated (torch flicker, portal spiral, particles), so a
 * naive screenshot would differ every frame. We use page.clock to install a fake
 * clock BEFORE navigation: once the page settles we pause the clock, which freezes
 * requestAnimationFrame — producing deterministic frames for comparison.
 */
const BOOT_MS = 6_000;
const BASE_W = 960;
const BASE_H = 540;

async function freezeAtMenu(page: import('@playwright/test').Page) {
  await page.clock.install({ time: new Date('2025-01-01T00:00:00Z') });
  await page.goto('/');
  // Advance through splash (6 lines * 250ms) + fade outs; runFor leaves the clock
  // paused, which freezes requestAnimationFrame and makes Phaser frames deterministic.
  await page.clock.runFor(BOOT_MS);
  await expect(page.getByText('BLOODMAGE 1995')).toBeVisible({ timeout: 10_000 });
}

/** Convert TitleScene logical coords (960x540) into canvas element pixel coords. */
async function clickGameCoords(page: import('@playwright/test').Page, gx: number, gy: number) {
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: {
      x: (gx / BASE_W) * box.width,
      y: (gy / BASE_H) * box.height,
    },
  });
}

test('main menu golden screenshot', async ({ page }) => {
  await freezeAtMenu(page);
  await expect(page).toHaveScreenshot('main-menu.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
  });
});

test('settings modal golden screenshot', async ({ page }) => {
  await freezeAtMenu(page);

  // OPÇÕES badge is at (BASE_W - 168, BASE_H - 62) in the TitleScene
  await clickGameCoords(page, BASE_W - 168, BASE_H - 62);
  await expect(page.getByLabel('Configurações do Bloodmage 1995')).toBeVisible({
    timeout: 10_000,
  });

  await expect(page).toHaveScreenshot('settings-modal.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
  });
});

test('high scores modal golden screenshot', async ({ page }) => {
  await freezeAtMenu(page);

  // Trophy button is at (BASE_W - 76, 76) in the TitleScene
  await clickGameCoords(page, BASE_W - 76, 76);
  await expect(page.getByText('RITUAIS DE RECORDES')).toBeVisible({
    timeout: 10_000,
  });

  await expect(page).toHaveScreenshot('high-scores-modal.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
  });
});
