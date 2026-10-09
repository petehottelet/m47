import { chromium, expect } from '@playwright/test';
import { build } from 'esbuild';
import { Resvg } from '@resvg/resvg-js';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { renderSVG } from '../core/index.js';
import { examples } from '../core/examples.js';
import { meshStyles, ridgeStyles, renderTerrain } from '../core/terrain.js';
import { topographyStyles, renderTopography } from '../core/topography.js';

// Capture isolated local builds; no personal browser profile or live feeds are used.
const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const work = join(root, '.cache', 'readme-demos', String(Date.now()));
const site = join(work, 'site');
const extension = join(work, 'extension');
const assets = join(root, 'docs', 'assets');
const fontPath = join(root, 'extension', 'fonts', 'Antonio.ttf');
const fontData = 'data:font/ttf;base64,' + (await readFile(fontPath)).toString('base64');
const font = { fontFiles: [fontPath], loadSystemFonts: false };
const tokens = JSON.parse(await readFile(join(root, 'core/tokens.json'), 'utf8'));
const color = Object.fromEntries(Object.entries(tokens.color).map(([k, v]) => [k, v.$value]));
const width = 1000;
const height = 650;
const screensaverOnly = process.argv.includes('--screensaver-only');
await run('ffmpeg', ['-version']);
await mkdir(site, { recursive: true });
await mkdir(assets, { recursive: true });

async function copy(source, destination) {
  await mkdir(resolve(destination, '..'), { recursive: true });
  await cp(join(root, source), destination, { recursive: true });
}
async function bundle(source, destination) {
  await build({
    entryPoints: [join(root, source)],
    outfile: destination,
    bundle: true,
    format: 'iife',
    target: ['chrome120'],
    logLevel: 'warning',
  });
}
for (const file of [
  'index.html',
  'app.css',
  'control-groups.css',
  'screensaver.html',
  'screensaver.css',
  'google.html',
  'google.css',
]) {
  await copy(`web/${file}`, join(site, file));
}
await copy('extension/fonts', join(site, 'fonts'));
await copy('extension/icons/icon128.png', join(site, 'icon.png'));
for (const file of ['app.js', 'screensaver.js', 'google.js'])
  await bundle(`web/${file}`, join(site, file));
await copy('extension/newtab/index.html', join(site, 'newtab/index.html'));
await copy('extension/newtab/newtab.css', join(site, 'newtab/newtab.css'));
await copy('extension/fonts', join(site, 'newtab/fonts'));
await bundle('extension/newtab/main.js', join(site, 'newtab/newtab.js'));
for (const folder of ['fonts', 'icons', 'popup'])
  await copy(`extension/${folder}`, join(extension, folder));
await copy('extension/manifest.json', join(extension, 'manifest.json'));
await bundle('extension/bg/main.js', join(extension, 'bg/service_worker.js'));
await bundle('extension/content/swept.js', join(extension, 'content/swept.js'));
await bundle('extension/popup/main.js', join(extension, 'popup/popup.js'));

const specimen = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Field Journal</title><style>
body{margin:0;background:#faf8f2;color:#26312e;font:17px/1.6 system-ui}nav{padding:20px 5%;background:#e4e7df}nav a{color:inherit;margin-right:24px}main{max-width:880px;margin:32px auto;padding:0 28px}h1{font-size:42px;line-height:1.1}h2{font-size:24px}table{border-collapse:collapse;width:100%}th,td{padding:10px;text-align:left;border-bottom:1px solid #bbb}.note{padding:16px;background:#e4e7df}
</style></head><body><nav><a href="#report">Field Journal</a><a href="#readings">Observations</a></nav><main><article id="report"><h1>A quiet night at the observatory</h1><p>Original demonstration page. No live equipment is connected.</p><p>The last daylight slips below the ridge. Inside the dome, a receiver settles into its evening routine.</p><h2 id="readings">The observation window</h2><table><thead><tr><th>Instrument</th><th>Reading</th><th>State</th></tr></thead><tbody><tr><td>Optical array</td><td>47.02</td><td>Tracking</td></tr><tr><td>Receiver</td><td>1420 MHz</td><td>Locked</td></tr><tr><td>Weather station</td><td>12.4 C</td><td>Recording</td></tr></tbody></table><p class="note">These are sample readings for the M47 demonstration.</p></article></main></body></html>`;
await writeFile(join(site, 'specimen.html'), specimen);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolve(site, '.' + pathname);
    if (!file.startsWith(site + sep)) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const manifests = [];

async function offline(context) {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin || url.protocol === 'chrome-extension:' || url.protocol === 'data:'
      ? route.continue()
      : route.abort();
  });
}
async function capture(page, name, title, status, duration = 2.2) {
  const folder = join(work, name);
  await mkdir(folder, { recursive: true });
  let manifest = manifests.find((m) => m.name === name);
  if (!manifest) {
    manifest = { name, frames: [] };
    manifests.push(manifest);
  }
  const filename = `frame-${String(manifest.frames.length).padStart(3, '0')}.png`;
  const shot = (await page.screenshot()).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="730">
    <rect width="1000" height="730" fill="${color.ground}"/>
    <path d="M24 8H670V16H24A8 8 0 0 0 16 24V48H0V32A24 24 0 0 1 24 8Z" fill="${color.structure}"/>
    <rect x="673" y="8" width="90" height="8" fill="${color.interactive}"/>
    <path d="M766 8H996A4 4 0 0 1 996 16H766Z" fill="${color.data}"/>
    <g font-family="Antonio" font-weight="500"><text x="32" y="46" font-size="27" fill="${color.secondary}">${title}</text><text x="980" y="46" text-anchor="end" font-size="22" fill="${color.data}">${status}</text></g>
    <image href="data:image/png;base64,${shot}" x="0" y="60" width="1000" height="650"/>
    <rect x="0" y="720" width="670" height="6" fill="${color.structure}"/><rect x="673" y="720" width="90" height="6" fill="${color.interactive}"/><path d="M766 720H997A3 3 0 0 1 997 726H766Z" fill="${color.secondary}"/>
  </svg>`;
  await writeFile(join(folder, filename), new Resvg(svg, { font }).render().asPng());
  manifest.frames.push({ filename, duration });
}

try {
  const context = await browser.newContext({
    viewport: { width, height },
    serviceWorkers: 'block',
  });
  await offline(context);
  const page = await context.newPage();
  if (!screensaverOnly) {
    // Render the engine's real SVG exports at their native aspect ratios.
    for (const name of [
      'Observatory',
      'Field notes',
      'Wide console',
      'Tiny widget',
      'Instrument log',
    ]) {
      const example = examples.find((e) => e.name === name);
      const svg = renderSVG(example.spec, {
        width: example.width,
        height: example.height,
        seed: '47',
        scheme: example.scheme,
        fontData,
      });
      const outlined = new Resvg(svg, { font }).toString();
      await page.setContent(
        `<!doctype html><html><head><style>body{margin:0;background:#000;display:grid;place-items:center;height:100vh}svg{max-width:96vw;max-height:96vh;width:auto;height:auto}</style></head><body>${outlined}</body></html>`,
      );
      await capture(page, 'demo-layouts', 'M47 / GENERATED LAYOUTS', name.toUpperCase());
    }
    console.log('Captured five engine layouts.');

    await page.setViewportSize({ width: 1440, height: 936 });
    await page.goto(origin);
    await expect(page.locator('#export-html')).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    // The capture is scaled as a whole; controls and content retain their actual layout.
    for (const [scheme, label] of [
      ['tng-default', 'WARM / CLASSIC'],
      ['tng-early', 'GOLD / LAVENDER'],
      ['red-alert', 'ALERT / RED'],
    ]) {
      await page.locator('#scheme').selectOption(scheme);
      await expect(page.frameLocator('#preview').locator('h1')).toHaveText('REMOTE OBSERVATORY');
      await page.waitForTimeout(250);
      await capture(page, 'demo-workshop', 'M47 / INTERFACE WORKSHOP', label);
    }
    await page.getByRole('button', { name: 'Instrument log', exact: true }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.frameLocator('#preview').locator('h1')).toHaveText('INSTRUMENT LOG');
    await capture(page, 'demo-workshop', 'M47 / INTERFACE WORKSHOP', 'LOAD ANOTHER COMPOSITION');
    console.log('Captured the interactive workshop.');
  }

  await page.setViewportSize({ width, height });
  await page.goto(origin + '/screensaver.html?seed=47');
  await page.evaluate(() => document.fonts.ready);
  await capture(
    page,
    'demo-screensaver',
    'M47 / GENERATIVE SCREENSAVER',
    'CONTROLS / CIRCULAR X',
    1.5,
  );
  await page.locator('#controls-minimize').click();
  await capture(
    page,
    'demo-screensaver',
    'M47 / GENERATIVE SCREENSAVER',
    'GEAR / REOPEN CONTROLS',
    1.5,
  );
  for (const [layout, purpose, scheme] of [
    ['radial', 'navigation', 'warm'],
    ['radial', 'engineering', 'gold'],
    ['reactor', 'engineering', 'electric'],
    ['bridge', 'communications', 'blue'],
    ['telemetry', 'temporal', 'warm'],
    ['survey', 'warp', 'violet'],
    ['analysis', 'transporter', 'blue'],
    ['survey', 'stellar', 'sunset'],
  ]) {
    await page.goto(origin + '/screensaver.html?seed=47');
    await page.bringToFront();
    await page.locator('#purpose').selectOption(purpose);
    await page.locator('#palette').selectOption(scheme);
    await page.locator('#layout').selectOption(layout);
    await page.locator('#brightness').fill('100');
    await page.locator('#brightness').dispatchEvent('input');
    await page.locator('#controls-minimize').click();
    await page.locator('#display').focus();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#dock')).toHaveCSS('opacity', '0');
    await page.waitForFunction(() =>
      document
        .getElementById('display')
        .getAnimations({ subtree: true })
        .every(
          (animation) =>
            animation.effect.getTiming().iterations === Infinity ||
            animation.playState === 'finished',
        ),
    );
    for (let i = 0; i < 24; i++) {
      await capture(
        page,
        ['temporal', 'warp', 'transporter', 'stellar'].includes(purpose)
          ? 'demo-operations'
          : 'demo-screensaver',
        'M47 / GENERATIVE SCREENSAVER',
        `${purpose === 'navigation' ? 'STELLAR SECTOR MAP' : purpose === 'temporal' ? 'TEMPORAL PHASE BANDS' : purpose === 'engineering' && layout === 'radial' ? 'ARC SCANNER' : purpose.toUpperCase()} / ${layout.toUpperCase()}`,
        0.125,
      );
      await page.waitForTimeout(90);
    }
  }
  console.log('Captured screensaver controls and eight moving compositions.');

  if (!screensaverOnly) {
    for (const [family, styles, title] of [
      ['mesh', meshStyles, 'M47 / MESH GRIDS'],
      ['ridges', ridgeStyles, 'M47 / OSCILLOSCOPE RIDGES'],
      ['contours', topographyStyles, 'M47 / CONTOUR MAPS'],
    ]) {
      for (const style of styles) {
        for (let frame = 0; frame < (family === 'contours' ? 1 : 16); frame++) {
          const svg =
            family === 'contours'
              ? renderTopography({ style: style.id, width: 960, height: 540 })
              : renderTerrain({
                  family,
                  style: style.id,
                  width: 960,
                  height: 540,
                  time: frame / 4,
                });
          await page.setContent(
            `<!doctype html><html><head><style>body{margin:0;background:#000;display:grid;place-items:center;height:100vh}svg{width:960px;height:540px}</style></head><body>${svg}</body></html>`,
          );
          await capture(
            page,
            `demo-${family}`,
            title,
            `${style.name.toUpperCase()} / SIMULATED`,
            family === 'contours' ? 2.2 : 0.125,
          );
        }
      }
      console.log(`Captured all five ${family} styles.`);
    }
    await page.goto(origin + '/google.html');
    await page.evaluate(() => document.fonts.ready);
    await capture(page, 'demo-interfaces', 'M47 / EVERYDAY INTERFACES', 'SEARCH CONCEPT');
    await page.locator('#query').fill('planetary science');
    await capture(page, 'demo-interfaces', 'M47 / EVERYDAY INTERFACES', 'LOCAL SEARCH FORM');
    await page.goto(origin + '/newtab/');
    await page.evaluate(() => document.fonts.ready);
    await capture(page, 'demo-interfaces', 'M47 / EVERYDAY INTERFACES', 'NEW-TAB DASHBOARD');
    console.log('Captured search and new-tab interfaces.');
  }
  await context.close();

  if (!screensaverOnly) {
    const extContext = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      viewport: { width, height },
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    try {
      await offline(extContext);
      const worker =
        extContext.serviceWorkers()[0] ?? (await extContext.waitForEvent('serviceworker'));
      await worker.evaluate(() => chrome.storage.local.set({ 'site:127.0.0.1': 'off' }));
      const extPage = await extContext.newPage();
      await extPage.goto(origin + '/specimen.html');
      await expect(extPage.locator('#__swept_base')).toHaveCount(0);
      await capture(extPage, 'demo-extension', 'M47 / BROWSER EXTENSION', 'ORIGINAL PAGE');
      for (const mode of ['full', 'palette']) {
        await worker.evaluate((mode) => chrome.storage.local.set({ 'site:127.0.0.1': mode }), mode);
        await expect(extPage.locator('#__swept_base')).toBeAttached();
        await expect(extPage.locator('#__swept_frame')).toHaveCount(mode === 'full' ? 1 : 0);
        await extPage.evaluate(() => document.fonts.ready);
        await capture(
          extPage,
          'demo-extension',
          'M47 / BROWSER EXTENSION',
          `${mode.toUpperCase()} MODE`,
        );
      }
      const tabs = await worker.evaluate(() => chrome.tabs.query({}));
      const tab = tabs.find((t) => t.url?.endsWith('/specimen.html'));
      await worker.evaluate((id) => chrome.tabs.sendMessage(id, { type: 'm47-reader' }), tab.id);
      await expect(extPage.locator('#__m47_reader')).toBeAttached();
      await expect(extPage.frameLocator('#__m47_reader iframe').locator('h1')).toHaveText(
        'A quiet night at the observatory',
      );
      await capture(extPage, 'demo-extension', 'M47 / BROWSER EXTENSION', 'READER VIEW');
      await extPage.getByRole('button', { name: 'Close reader / Esc' }).click();
      await worker.evaluate(() => chrome.storage.local.set({ 'site:127.0.0.1': 'off' }));
      await expect(extPage.locator('#__swept_base')).toHaveCount(0);
      await capture(
        extPage,
        'demo-extension',
        'M47 / BROWSER EXTENSION',
        'OFF / ORIGINAL RESTORED',
      );
    } finally {
      await extContext.close();
    }
    console.log('Captured the real extension and Reader.');
  }
} finally {
  await browser.close();
  server.close();
}

for (const manifest of manifests) {
  const folder = join(work, manifest.name);
  const concat = manifest.frames
    .map((f) => `file '${f.filename}'\nduration ${f.duration}`)
    .join('\n');
  await writeFile(
    join(folder, 'frames.txt'),
    concat + `\nfile '${manifest.frames.at(-1).filename}'\n`,
  );
  const paletteSize = manifest.name === 'demo-screensaver' ? 256 : 128;
  const frameRate =
    manifest.name === 'demo-screensaver' ? 6 : manifest.name === 'demo-operations' ? 7 : 8;
  await run(
    'ffmpeg',
    [
      '-v',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '1',
      '-i',
      'frames.txt',
      '-filter_complex',
      `[0:v]fps=${frameRate},split[a][b];[a]palettegen=max_colors=${paletteSize}:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`,
      '-map_metadata',
      '-1',
      '-loop',
      '0',
      join(assets, `${manifest.name}.gif`),
    ],
    { cwd: folder, maxBuffer: 1024 * 1024 },
  );
  await cp(join(folder, manifest.frames[0].filename), join(assets, `${manifest.name}.png`));
  console.log(`Built ${manifest.name}.gif and its still preview.`);
}
console.log('README demos use local sample content; all instrument readings are simulated.');
