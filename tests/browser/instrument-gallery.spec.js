import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('gallery contains all sixteen instruments and filters each family', async ({ page }) => {
  await page.goto('/instruments.html');
  await expect(page.locator('#instruments article')).toHaveCount(17);
  for (const [name, count] of [
    ['Mesh grids 5', 5],
    ['Oscilloscope ridges 5', 5],
    ['Contour maps 5', 5],
    ['Maps / scans 2', 2],
    ['All 17', 17],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('#instruments article:visible')).toHaveCount(count);
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('visible terrain animates, pauses, expands, and exports a current SVG', async ({ page }) => {
  await page.goto('/instruments.html');
  await page.getByRole('button', { name: 'Mesh grids 5', exact: true }).click();
  const first = page.locator('article[data-style="alpine"]');
  const canvas = first.locator('canvas');
  await expect(canvas).toHaveAttribute('data-time', /\d/);
  const before = await canvas.evaluate((node) => node.toDataURL());
  await expect.poll(() => canvas.evaluate((node) => node.toDataURL())).not.toBe(before);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const held = await canvas.evaluate((node) => node.toDataURL());
  await page.waitForTimeout(180);
  expect(await canvas.evaluate((node) => node.toDataURL())).toBe(held);
  await first.getByRole('button', { name: 'Expand', exact: true }).click();
  await expect(first.getByRole('button', { name: 'Collapse', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const download = page.waitForEvent('download');
  await first.getByRole('button', { name: 'Save Alpine grid as SVG' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('m47-mesh-alpine.svg');
  const stream = await file.createReadStream();
  let svg = '';
  for await (const chunk of stream) svg += chunk;
  expect(svg).toContain('<title>Alpine grid</title>');
  expect(svg).not.toMatch(/NaN|Infinity|<script/);
});

test('mobile gallery has usable actions and reduced motion starts still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/instruments.html');
  await expect(page.getByRole('button', { name: 'Play motion', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand', exact: true })).toHaveCount(0);
  await expect(page.locator('.export').first()).toHaveCSS('border-top-left-radius', '24px');
  await expect(page.locator('.arc-sweep')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('#scene-demo')).toHaveAttribute('src', /\.png$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const canvas = page.locator('canvas').first();
  const before = await canvas.evaluate((node) => node.toDataURL());
  await page.waitForTimeout(180);
  expect(await canvas.evaluate((node) => node.toDataURL())).toBe(before);
});
