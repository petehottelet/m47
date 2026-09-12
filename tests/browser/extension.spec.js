import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'node:path';
test('real extension switches modes without reload, restores styles and opens reader', async () => {
  const extension = resolve('dist/chrome');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const page = await context.newPage();
    await page.route('http://127.0.0.1:4747/fixture', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="en"><head><title>Local fixture</title><style>body{background:white;color:#111}#panel{background:rgb(240,240,240);padding:30px}button{background:#ddd;color:#111}</style></head><body><article><h1>Field report</h1><p id="panel">An original fixture for testing the extension.</p><input aria-label="Keep my work"><button><span>Continue</span></button></article></body></html>',
      }),
    );
    await page.goto('http://127.0.0.1:4747/fixture');
    await expect(page.locator('#__swept_frame')).toBeAttached();
    await page.getByLabel('Keep my work').fill('Do not lose this');
    const navigation = await page.evaluate(() => performance.timeOrigin);
    await worker.evaluate(() => chrome.storage.local.set({ 'site:127.0.0.1': 'palette' }));
    await expect(page.locator('#__swept_frame')).toHaveCount(0);
    await expect(page.locator('#__swept_base')).toBeAttached();
    await page
      .locator('#panel')
      .evaluate((el) => (el.style.backgroundColor = 'rgb(230, 210, 180)'));
    await expect
      .poll(() => page.locator('#panel').evaluate((el) => el.style.backgroundColor))
      .not.toBe('rgb(230, 210, 180)');
    await worker.evaluate(() => chrome.storage.local.set({ 'site:127.0.0.1': 'off' }));
    await expect(page.locator('#__swept_base')).toHaveCount(0);
    await expect(page.locator('#panel')).toHaveCSS('background-color', 'rgb(230, 210, 180)');
    await expect(page.getByLabel('Keep my work')).toHaveValue('Do not lose this');
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(navigation);
    const tabs = await worker.evaluate(() => chrome.tabs.query({}));
    const tab = tabs.find((x) => x.url?.includes('/fixture'));
    await worker.evaluate((id) => chrome.tabs.sendMessage(id, { type: 'm47-reader' }), tab.id);
    await expect(page.locator('#__m47_reader')).toBeAttached();
    await expect(page.frameLocator('#__m47_reader iframe').locator('h1')).toHaveText(
      'Field report',
    );
    await page.getByRole('button', { name: 'Close reader / Esc' }).click();
    await expect(page.locator('#__m47_reader')).toHaveCount(0);
    await worker.evaluate(() => chrome.storage.local.set({ 'site:127.0.0.1': 'full' }));
    await expect(page.locator('#__swept_frame')).toBeAttached();
    await page.evaluate(() => {
      window.mutations = 0;
      new MutationObserver((m) => (window.mutations += m.length)).observe(document.body, {
        attributes: true,
        subtree: true,
      });
    });
    await page.waitForTimeout(500);
    const before = await page.evaluate(() => window.mutations);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.mutations)).toBe(before);
  } finally {
    await context.close();
  }
});
test('new-tab build has working local links and rejects script URLs', async () => {
  const extension = resolve('dist/newtab-chrome');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const page = await context.newPage();
    await page.goto('chrome://newtab');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'A LITTLE SPACETO BEGIN AGAIN.',
    );
    await page.getByText('Edit quick links', { exact: true }).click();
    await page.getByLabel('Your links').fill('Bad | javascript:alert(1)');
    await page.getByRole('button', { name: 'Save links', exact: true }).click();
    await expect(page.locator('#status')).toContainText('must start');
    await page.getByLabel('Your links').fill('Example | https://example.com');
    await page.getByRole('button', { name: 'Save links', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Example', exact: true })).toHaveAttribute(
      'href',
      'https://example.com/',
    );
    await page.reload();
    await expect(page.getByRole('link', { name: 'Example', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
