import { test, expect } from '@playwright/test';

const BASE_W = 960;
const BASE_H = 540;

async function freezeAtMenu(page: import('@playwright/test').Page) {
  await page.clock.install({ time: new Date('2025-01-01T00:00:00Z') });
  await page.goto('/');
  await page.clock.runFor(6_000);
  await expect(page.getByText('BLOODMAGE 1995')).toBeVisible({ timeout: 10_000 });
}

test('game starts when JOGAR is pressed', async ({ page }) => {
  await freezeAtMenu(page);

  // JOGAR badge is at (BASE_W / 2, BASE_H - 62) in the TitleScene
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: {
      x: (BASE_W / 2 / BASE_W) * box.width,
      y: ((BASE_H - 62) / BASE_H) * box.height,
    },
  });

  // GameScene mounts the Phaser container and a gameplay canvas
  await expect(page.locator('#phaser-container')).toBeAttached({ timeout: 10_000 });
  await expect(page.locator('#phaser-container canvas')).toHaveCount(1, { timeout: 10_000 });
});
