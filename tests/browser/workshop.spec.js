import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { render } from '../../core/index.js';
import { examples } from '../../core/examples.js';
test('edit, validate, export, restore and import without script execution', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Export HTML', exact: true })).toBeEnabled();
  const editor = page.getByLabel('Panel content as JSON');
  const original = JSON.parse(await editor.inputValue());
  original.title = 'TEST / 47';
  await editor.fill(JSON.stringify(original));
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('TEST / 47');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export HTML', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('m47.html');
  await editor.fill('{');
  await expect(page.locator('#error')).not.toBeEmpty();
  await expect(page.getByRole('button', { name: 'Export HTML', exact: true })).toBeDisabled();
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('TEST / 47');
  await page.reload();
  await expect(editor).toHaveValue(/TEST \/ 47/);
  await page.locator('#file').setInputFiles({
    name: 'article.html',
    mimeType: 'text/html',
    buffer: Buffer.from(
      '<html><head><title>Imported</title></head><body><article><h1>Safe import</h1><p>Useful prose.</p><script>window.hacked=true</script></article></body></html>',
    ),
  });
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Safe import');
  expect(await page.evaluate(() => window.hacked)).toBeUndefined();
  expect(errors).toEqual([]);
});
test('all exports and every gallery example work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#export-svg')).toBeEnabled();
  for (const kind of ['svg', 'png', 'css']) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-' + kind).click(),
    ]);
    expect(download.suggestedFilename()).toContain(kind);
    expect(await download.failure()).toBeNull();
  }
  for (const name of [
    'Field notes',
    'Wide console',
    'Tiny widget',
    'Reading room',
    'Instrument log',
    'Alert panel',
    'Blank canvas',
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('#error')).toBeEmpty();
    await expect(page.locator('#export-html')).toBeEnabled();
  }
});
test('share fragment roundtrip, malformed recovery, mobile overflow and keyboard', async ({
  page,
}) => {
  const state = {
    spec: { title: 'SHARED 47', subtitle: 'Unicode café', sections: [] },
    options: { width: 600, height: 1000, seed: 'a', scheme: 'tng-early', density: 'compact' },
  };
  await page.goto('/#' + encodeURIComponent(JSON.stringify(state)));
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('SHARED 47');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/#' + encodeURIComponent(JSON.stringify({})));
  await expect(page.locator('#export-html')).toBeEnabled();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to workshop' })).toBeFocused();
});
test('workshop meets automated WCAG AA checks on desktop and mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#export-html')).toBeEnabled();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const results = await new AxeBuilder({ page })
      // The preview is intentionally sandboxed. Audit it separately as an export;
      // legacy mode avoids axe's blank-page aggregation in Chromium headless shell.
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
  const fontData =
    'data:font/ttf;base64,' +
    (await readFile(new URL('../../extension/fonts/Antonio.ttf', import.meta.url))).toString(
      'base64',
    );
  await page.setContent(render(examples[0].spec, { fontData }));
  await page.evaluate(() => document.fonts.ready);
  const exported = await new AxeBuilder({ page })
    .setLegacyMode(true)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(exported.violations).toEqual([]);
});
test('offline reload restores a saved draft and asset imports stay inert', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.locator('#export-html')).toBeEnabled();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator('#export-html')).toBeEnabled();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#export-html')).toBeEnabled();
  await context.setOffline(false);
  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('must-not-load.test')) requests.push(request.url());
  });
  await page.locator('#file').setInputFiles({
    name: 'inert.html',
    mimeType: 'text/html',
    buffer: Buffer.from(
      '<article><h1>Inert import</h1><p>Text only</p><img src="https://must-not-load.test/pixel"><iframe src="https://must-not-load.test/frame"></iframe></article>',
    ),
  });
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Inert import');
  expect(requests).toEqual([]);
});
