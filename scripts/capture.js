import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { render, renderSVG } from '../core/index.js';
import { examples } from '../core/examples.js';
const out = resolve('store-assets/v0.2');
await mkdir(out, { recursive: true });
const fontPath = resolve('extension/fonts/Antonio.ttf');
const fontData = 'data:font/ttf;base64,' + (await readFile(fontPath)).toString('base64');
const sample = `<!doctype html><html lang="en"><head><title>The Field Journal — M47 demonstration</title><style>body{margin:0;background:#faf8f2;color:#26312e;font:18px/1.7 system-ui}nav{padding:20px 6%;background:#e4e7df}nav a{color:#26312e;margin-right:24px}main{max-width:1000px;margin:44px auto;padding:0 36px}h1{font-size:56px;line-height:1.1}h2{margin-top:32px}p{max-width:70ch}table{border-collapse:collapse;width:100%}th,td{padding:12px;border-bottom:1px solid #ccc;text-align:left}button{background:#e4e7df;border:0;padding:14px 26px;border-radius:4px;font-size:16px}.note{padding:20px;background:#eef0ea}</style></head><body><nav><a href="#report">Field Journal</a><a href="#readings">Observations</a></nav><main><article id="report"><h1>A quiet night at the observatory</h1><p>Original demonstration page · September 12, 2026</p><p>The last daylight slips below the ridge. Inside the dome, a receiver settles into its evening routine. A little space, a few instruments, and enough silence to notice what changes.</p><h2 id="readings">The observation window</h2><table><thead><tr><th>Instrument</th><th>Reading</th><th>State</th></tr></thead><tbody><tr><td>Optical array</td><td>47.02</td><td>Tracking</td></tr><tr><td>Receiver</td><td>1420 MHz</td><td>Locked</td></tr><tr><td>Weather station</td><td>12.4 °C</td><td>Recording</td></tr></tbody></table><p class="note">These are sample readings. No live equipment is connected.</p><button type="button">Continue reading</button></article></main></body></html>`;
const ext = resolve('dist/chrome');
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
try {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.route('http://127.0.0.1:4747/store-demo', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: sample.replace('<head>', '<head><meta charset="utf-8">'),
    }),
  );
  await page.goto('http://127.0.0.1:4747/store-demo');
  await expect(page.locator('#__swept_frame')).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, 'screenshot-1.png') });
  const tabs = await worker.evaluate(() => chrome.tabs.query({}));
  const tab = tabs.find((x) => x.url?.includes('/store-demo'));
  await worker.evaluate((id) => chrome.tabs.sendMessage(id, { type: 'm47-reader' }), tab.id);
  await expect(page.locator('#__m47_reader')).toBeAttached();
  await page.screenshot({ path: join(out, 'screenshot-2.png') });
  await page.getByRole('button', { name: 'Close reader / Esc' }).click();
  const popup = await context.newPage();
  await page.bringToFront();
  await popup.goto(`chrome-extension://${id}/popup/index.html`);
  await expect(popup.locator('#site [data-m=full]')).toBeEnabled();
  await popup.setViewportSize({ width: 340, height: 720 });
  await popup.screenshot({ path: join(out, 'popup.png'), fullPage: true });
} finally {
  await context.close();
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:4747');
  await expect(page.locator('#export-html')).toBeEnabled();
  await page.screenshot({ path: join(out, 'workshop-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(out, 'workshop-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(render(examples[0].spec, { fontData }));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, 'generated-html.png'), fullPage: true });
} finally {
  await browser.close();
}
const newtab = resolve('dist/newtab-chrome');
const newtabContext = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${newtab}`, `--load-extension=${newtab}`],
});
try {
  const page = await newtabContext.newPage();
  await page.goto('chrome://newtab');
  await expect(page.getByRole('link', { name: 'Wikipedia', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, 'newtab.png') });
} finally {
  await newtabContext.close();
}
for (const [w, h, name] of [
  [440, 280, 'promo-small-440x280.png'],
  [1400, 560, 'promo-marquee-1400x560.png'],
]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/><path d="M24 ${h - 24}V70Q24 24 70 24H${w - 24}V44H90Q64 44 64 70V${h - 24}Z" fill="#ff9966"/><text x="94" y="${h * 0.52}" font-family="Antonio" font-size="${h * 0.35}" fill="#ffff99">M47</text><text x="94" y="${h * 0.72}" font-family="Antonio" font-size="${h * 0.075}" fill="#ffcc66">RETRO TERMINAL INTERFACE</text><text x="94" y="${h * 0.84}" font-family="Antonio" font-size="${h * 0.05}" fill="#cc99cc">YOUR WEB. A LITTLE MORE SPACE.</text></svg>`;
  await writeFile(
    join(out, name),
    new Resvg(svg, { font: { fontFiles: [fontPath], loadSystemFonts: false } }).render().asPng(),
  );
}
await writeFile(
  join(out, 'generated-svg.png'),
  new Resvg(renderSVG(examples[0].spec, { fontData }), {
    font: { fontFiles: [fontPath], loadSystemFonts: false },
  })
    .render()
    .asPng(),
);
console.log(`Current submission and workshop assets: ${out}`);
