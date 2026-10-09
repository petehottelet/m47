import { test, expect } from '@playwright/test';
import { createScene, renderScene, layouts, purposes } from '../../core/screensaver.js';
import { operationPurposes, renderInstrument } from '../../core/instruments.js';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:4747'
      ? route.continue()
      : route.abort(),
  );
});

test('title, metric and telemetry text clear their neighbors at native and portrait sizes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/screensaver.html');
  await page.evaluate(() => document.fonts.ready);
  for (const portrait of [false, true]) {
    await page.setViewportSize(
      portrait ? { width: 390, height: 844 } : { width: 800, height: 480 },
    );
    const samples = layouts.flatMap((layout) =>
      purposes.map(({ id }) => ({
        id,
        layout,
        svg: renderScene(createScene({ purpose: id, layout }), { portrait }),
      })),
    );
    const problems = await page.evaluate((samples) => {
      const host = document.getElementById('display'),
        problems = [];
      for (const { id, layout, svg } of samples) {
        host.innerHTML = svg;
        const texts = [
          ...host.querySelectorAll('.scene-panel[style="--order:0"] text, .scene-metric text'),
        ];
        for (let i = 0; i < texts.length; i++) {
          const a = texts[i].getBBox();
          for (let j = i + 1; j < texts.length; j++) {
            const b = texts[j].getBBox();
            if (
              Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.5 &&
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.5
            )
              problems.push({ id, layout, a: texts[i].textContent, b: texts[j].textContent });
          }
        }
        if (layout === 'telemetry' && host.querySelector('svg').viewBox.baseVal.width === 1440) {
          const register = host.querySelector('.scene-panel[style="--order:4"]');
          for (const node of register.querySelectorAll('text')) {
            const b = node.getBBox();
            if (b.y < 537 || b.y + b.height > 732)
              problems.push({ id, layout, rail: node.textContent });
          }
        }
      }
      return problems;
    }, samples);
    expect(problems).toEqual([]);
  }
});

test('operation and rectangular instrument geometry stays inside its allocated body', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/screensaver.html');
  await page.evaluate(() => document.fonts.ready);
  for (const portrait of [false, true]) {
    await page.setViewportSize(
      portrait ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    );
    const subjects = [
      ...operationPurposes.map(({ id }) => id),
      'navigation',
      'observatory',
      'geology',
      'engineering',
      'computing',
    ];
    const samples = layouts.flatMap((layout) =>
      subjects.map((purpose) => ({
        purpose,
        layout,
        svg: renderScene(createScene({ purpose, layout, scanners: 'rectangular' }), { portrait }),
      })),
    );
    const problems = await page.evaluate((samples) => {
      const host = document.getElementById('display'),
        problems = [];
      for (const sample of samples) {
        host.innerHTML = sample.svg;
        for (const instrument of host.querySelectorAll('.sensor-instrument, .stellar-map')) {
          const [x, y, w, h] = instrument.dataset.bounds.split(' ').map(Number);
          for (const node of instrument.querySelectorAll('path,rect,text')) {
            const b = node.getBBox();
            if (
              b.x < x - 0.5 ||
              b.y < y - 0.5 ||
              b.x + b.width > x + w + 0.5 ||
              b.y + b.height > y + h + 0.5
            )
              problems.push({
                purpose: sample.purpose,
                layout: sample.layout,
                tag: node.tagName,
                text: node.textContent,
              });
          }
        }
      }
      return problems;
    }, samples);
    expect(problems).toEqual([]);
    if (testInfo.project.name === 'chromium') {
      for (const purpose of ['warp', 'transporter', 'navigation', 'stellar']) {
        if ((await page.locator('#controls-toggle').getAttribute('aria-expanded')) === 'false')
          await page.locator('#controls-toggle').click();
        await page.locator('#purpose').selectOption(purpose);
        await page.locator('#layout').selectOption('survey');
        await page.locator('#scanners').selectOption('rectangular');
        await page.locator('#controls-minimize').click();
        await page.screenshot({
          path: testInfo.outputPath(`${purpose}-${portrait ? 'portrait' : 'desktop'}.png`),
        });
      }
    }
  }
});

test('berth, circuit and bus labels stay inside solid rails and clear guide lines', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/screensaver.html');
  await page.evaluate(() => document.fonts.ready);
  const samples = ['shuttle', 'environment', 'schematic'].flatMap((kind) =>
    [
      [760, 440],
      [320, 540],
      [1700, 145],
      [180, 90],
    ].map(([w, h]) => ({
      kind,
      w,
      h,
      markup: renderInstrument(
        createScene({ purpose: kind === 'schematic' ? 'computing' : kind }),
        kind,
        20,
        30,
        w,
        h,
      ),
    })),
  );
  const issues = await page.evaluate((samples) => {
    const issues = [];
    for (const { kind, w, h, markup } of samples) {
      document.getElementById('display').innerHTML =
        `<svg font-family="Antonio, sans-serif">${markup}</svg>`;
      const instrument = document.querySelector('.sensor-instrument');
      const fills = [...instrument.querySelectorAll('path[fill]')].filter(
        (p) => p.getAttribute('fill') !== 'none',
      );
      const guides = [...instrument.querySelectorAll('line, path[fill="none"]')];
      for (const label of instrument.querySelectorAll('text')) {
        const b = label.getBBox();
        const corners = [
          [b.x, b.y],
          [b.x + b.width, b.y],
          [b.x, b.y + b.height],
          [b.x + b.width, b.y + b.height],
        ];
        if (
          !fills.some((fill) => corners.every(([x, y]) => fill.isPointInFill(new DOMPoint(x, y))))
        )
          issues.push(`${kind} ${w}x${h}: label outside rail: ${label.textContent}`);
        for (const guide of guides) {
          const length = guide.getTotalLength();
          const pad = Number(guide.getAttribute('stroke-width') || 0) / 2;
          for (let d = 0; d <= length; d += Math.max(1, length / 200)) {
            const p = guide.getPointAtLength(d);
            if (
              p.x >= b.x - pad &&
              p.x <= b.x + b.width + pad &&
              p.y >= b.y - pad &&
              p.y <= b.y + b.height + pad
            ) {
              issues.push(`${kind} ${w}x${h}: guide crosses ${label.textContent}`);
              break;
            }
          }
        }
      }
    }
    return issues;
  }, samples);
  expect(issues).toEqual([]);
});

test('linear sweeps persist through updates and honor every motion control', async ({ page }) => {
  await page.goto('/screensaver.html');
  await page.locator('#purpose').selectOption('observatory');
  await page.locator('#layout').selectOption('survey');
  await page.getByLabel('Scan instruments').selectOption('rectangular');
  await page.evaluate(() => {
    window.sensorBefore = document.querySelector('.sensor-sweep');
  });
  const sweep = page.locator('.sensor-sweep');
  await expect(sweep).toHaveCSS('animation-name', 'sensor-scan');
  await page.waitForTimeout(3200);
  expect(
    await page.evaluate(() => window.sensorBefore === document.querySelector('.sensor-sweep')),
  ).toBe(true);
  await page.locator('#motion').selectOption('calm');
  await expect(sweep).toHaveCSS('animation-duration', '12.6s');
  await page.locator('#pause').click();
  await expect(sweep).toHaveCSS('animation-play-state', 'paused');
  await page.locator('#pause').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(sweep).toHaveCSS('animation-play-state', 'paused');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('#motion').selectOption('still');
  await expect(sweep).toHaveCSS('animation-name', 'none');
  await page.reload();
  await expect(page.getByLabel('Scan instruments')).toHaveValue('rectangular');
  await page.locator('#motion').selectOption('full');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(sweep).toHaveCSS('animation-name', 'none');
});
