import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

test('Google concept keeps input local and submits searches to a new tab', async ({
  page,
  context,
}, testInfo) => {
  const externalRequests = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('https://**/*', (route) => {
    externalRequests.push(route.request().url());
    return route.fulfill({ contentType: 'text/html', body: '<title>Intercepted search</title>' });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/google.html');
  await expect(page.getByRole('heading', { name: 'Google' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (testInfo.project.name === 'chromium') {
    await mkdir('store-assets/google', { recursive: true });
    await page.screenshot({ path: 'store-assets/google/desktop.png', fullPage: true });
  }
  const query = page.getByRole('searchbox', { name: 'Search the web' });
  await page.getByRole('button', { name: 'Webb telescope' }).click();
  await expect(query).toHaveValue('James Webb telescope images');
  await expect(query).toBeFocused();
  await query.fill('M47 & deep space');
  expect(externalRequests).toEqual([]);
  const [results] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Google Search', exact: true }).click(),
  ]);
  await results.waitForLoadState();
  expect(new URL(results.url()).searchParams.get('q')).toBe('M47 & deep space');
  await results.close();
  const [lucky] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: "I'm Feeling Lucky", exact: true }).click(),
  ]);
  await lucky.waitForLoadState();
  expect(new URL(lucky.url()).searchParams.get('btnI')).toBe("I'm Feeling Lucky");
  await lucky.close();
  await expect(page).toHaveURL(/google\.html$/);
  await query.fill('   ');
  expect(await query.evaluate((input) => input.checkValidity())).toBe(false);
  expect(externalRequests).toHaveLength(2);
  expect(errors).toEqual([]);
});

test('Google concept supports mobile, keyboard controls and automated accessibility checks', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/google.html');
  await page.evaluate(() => document.fonts.ready);
  if (testInfo.project.name === 'chromium') {
    await mkdir('store-assets/google', { recursive: true });
    await page.screenshot({ path: 'store-assets/google/mobile.png', fullPage: true });
  }
  const query = page.getByRole('searchbox', { name: 'Search the web' });
  await page.keyboard.press('/');
  await expect(query).toBeFocused();
  await query.fill('test');
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(query).toHaveValue('');
  await expect(query).toBeFocused();
  await page.locator('.apps summary').click();
  await expect(page.getByRole('navigation', { name: 'More Google services' })).toBeVisible();
  const services = page.getByRole('navigation', { name: 'More Google services' });
  const gmail = services.getByRole('link', { name: /Gmail/ });
  const images = services.getByRole('link', { name: /Images/ });
  await expect(gmail).toBeVisible();
  await expect(images).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(gmail).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(images).toBeFocused();
  if (testInfo.project.name === 'chromium') {
    await page.screenshot({ path: 'store-assets/google/mobile-menu.png', fullPage: true });
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'More Google services' })).not.toBeVisible();
  await expect(page.locator('.apps summary')).toBeFocused();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const audit = await new AxeBuilder({ page })
    .setLegacyMode(true)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
});
