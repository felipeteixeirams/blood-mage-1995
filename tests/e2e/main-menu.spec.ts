import { test, expect } from '@playwright/test';

test('splash screen boot sequence renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('DOS.V 6.66')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('INICIANDO PROTOCOLO BLOODMAGE.')).toBeVisible({ timeout: 10_000 });
});

test('main menu renders after boot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('BLOODMAGE 1995')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTitle('Alternar Áudio')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('audio toggle button works in main menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('BLOODMAGE 1995')).toBeVisible({ timeout: 15_000 });

  const volumeButton = page.getByTitle('Alternar Áudio');
  await volumeButton.click();
  await expect(volumeButton).toBeVisible();
});
