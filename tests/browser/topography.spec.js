import { test, expect } from '@playwright/test';

test('terrain atlas presents five maps and downloads a standalone SVG', async ({ page }) => {
  await page.goto('/topography.html');
  await expect(page.locator('article')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Dune field' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save Abyssal depths as SVG' }).click();
  expect((await download).suggestedFilename()).toBe('m47-topography-abyssal.svg');
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const map of await page.locator('.map svg').all()) {
      const box = await map.boundingBox();
      expect(box.width).toBeGreaterThan(300);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
  }
});
