import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

test('YouTube concept filters, persists Watch Later, loads player on selection and submits search', async ({
  page,
  context,
}) => {
  const players = [];
  await context.route('https://www.youtube-nocookie.com/**', (route) => {
    players.push(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: '<title>Mock video provider</title>' });
  });
  await context.route('https://www.youtube.com/results?**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Mock search provider</title>' }),
  );
  await page.goto('/youtube.html');
  await expect(page.locator('.video-card:visible')).toHaveCount(6);
  expect(players).toEqual([]);
  await page.getByRole('button', { name: 'Earth', exact: true }).click();
  await expect(page.locator('.video-card:visible')).toHaveCount(1);
  await page.getByRole('button', { name: /^Save to Watch Later:/ }).click();
  await page.reload();
  await page.locator('.nav-bank [data-view="saved"]').click();
  await expect(page.locator('.video-card:visible')).toHaveCount(1);
  await page.getByRole('button', { name: /^Watch: / }).click();
  await expect(page.locator('#player iframe')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/ElxVZL526o8',
  );
  await expect(page.locator('#watch-title')).toBeFocused();
  await page.getByRole('button', { name: 'Close player' }).click();
  await expect(page.locator('#player iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Watch: / })).toBeFocused();
  await page.getByRole('button', { name: /^Remove from Watch Later:/ }).click();
  await expect(page.locator('#empty')).toBeVisible();
  await page.getByRole('button', { name: 'Show all videos' }).click();
  await expect(page.locator('.video-card:visible')).toHaveCount(6);
  await page.getByRole('searchbox', { name: 'Search YouTube' }).fill('NASA & the Moon');
  const [search] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Submit YouTube search' }).click(),
  ]);
  await search.waitForLoadState();
  expect(new URL(search.url()).searchParams.get('search_query')).toBe('NASA & the Moon');
  await search.close();
});

test('grouped controls and continuous frame widths work on desktop and mobile', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (testInfo.project.name === 'chromium') await mkdir('store-assets/latest', { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const route of ['youtube.html', 'google.html']) {
      await page.goto('/' + route);
      await page.evaluate(() => document.fonts.ready);
      if (route === 'youtube.html') {
        await expect(page.locator('[data-view="home"]:visible')).toHaveCount(1);
        await expect(page.locator('[data-view="saved"]:visible')).toHaveCount(1);
      }
      const widths = await page.evaluate(() => ({
        rail: document.querySelector('.rail').getBoundingClientRect().width,
        top: parseFloat(getComputedStyle(document.querySelector('.top-elbow'), '::after').left),
        bottom: parseFloat(
          getComputedStyle(document.querySelector('.bottom-elbow'), '::before').left,
        ),
      }));
      expect(widths.top).toBeCloseTo(widths.rail, 1);
      expect(widths.bottom).toBeCloseTo(widths.rail, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (testInfo.project.name === 'chromium') {
        if (route === 'youtube.html')
          await page.evaluate(async () => {
            const images = [...document.images];
            images.forEach((img) => {
              img.loading = 'eager';
            });
            await Promise.race([
              Promise.all(images.map((img) => img.decode().catch(() => {}))),
              new Promise((resolve) => setTimeout(resolve, 5000)),
            ]);
          });
        await page.screenshot({
          path: `store-assets/latest/${route.replace('.html', '')}-${width}.png`,
          fullPage: true,
        });
      }
      if (route === 'youtube.html') {
        const audit = await new AxeBuilder({ page })
          .setLegacyMode(true)
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        expect(audit.violations).toEqual([]);
      }
    }
    await page.goto('/');
    await expect(page.locator('#export-html')).toBeEnabled();
    const exports = page.getByRole('group', { name: 'Export file' });
    const copy = page.getByRole('group', { name: 'Copy & share' });
    await expect(exports.getByRole('button')).toHaveCount(4);
    await expect(copy.getByRole('button')).toHaveCount(2);
    for (const bank of [exports, copy]) {
      const rows = await bank
        .getByRole('button')
        .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().top));
      expect(new Set(rows).size).toBe(1);
      await page.keyboard.press('Tab');
      const first = bank.getByRole('button').first();
      await first.focus();
      const contrast = await first.evaluate((button) => {
        const style = getComputedStyle(button);
        const luminance = (color) =>
          color
            .match(/\d+/g)
            .slice(0, 3)
            .map((value) => {
              const channel = Number(value) / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            })
            .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const a = luminance(style.outlineColor),
          b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(3);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (testInfo.project.name === 'chromium')
      await page
        .locator('.exports')
        .screenshot({ path: `store-assets/latest/control-groups-${width}.png` });
  }
  expect(errors).toEqual([]);
});
