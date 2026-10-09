import { test, expect } from '@playwright/test';
import { createScene } from '../../core/screensaver.js';
import { renderInstrument } from '../../core/instruments.js';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:4747'
      ? route.continue()
      : route.abort(),
  );
});

test('phase returns do not cross or escape wide, compact, or tall instrument bounds', async ({
  page,
}) => {
  await page.goto('/screensaver.html');
  const samples = [
    [1700, 145],
    [640, 330],
    [320, 540],
    [180, 90],
  ].map(([w, h]) => ({
    w,
    h,
    markup: renderInstrument(createScene({ purpose: 'temporal' }), 'temporal', 20, 30, w, h),
  }));
  const issues = await page.evaluate((samples) => {
    const issues = [];
    for (const { w, h, markup } of samples) {
      document.getElementById('display').innerHTML = `<svg>${markup}</svg>`;
      const instrument = document.querySelector('[data-instrument="temporal"]');
      for (const shape of instrument.querySelectorAll('path, rect')) {
        const b = shape.getBBox();
        const stroke = Number(shape.getAttribute('stroke-width') || 0) / 2;
        if (
          b.x - stroke < 20 ||
          b.y - stroke < 30 ||
          b.x + b.width + stroke > 20 + w ||
          b.y + b.height + stroke > 30 + h
        )
          issues.push(`${w}x${h}: escaped body`);
      }
      const lanes = [...instrument.querySelectorAll('.temporal-lane')];
      lanes.forEach((lane, i) => {
        const box = lane.getBBox();
        // Each successive return goes farther right and below every previous return.
        for (const previous of lanes.slice(0, i)) {
          const p = previous.getBBox();
          if (box.x + box.width <= p.x + p.width || box.y + box.height <= p.y + p.height)
            issues.push(`${w}x${h}: crossing returns`);
        }
        const terminal = instrument.querySelectorAll('.temporal-terminal')[i].getBBox();
        const length = lane.getTotalLength();
        const beforeEnd = lane.getPointAtLength(length - Math.min(1, length / 10));
        const end = lane.getPointAtLength(length);
        if (end.y >= beforeEnd.y || end.y < terminal.y + terminal.height)
          issues.push(`${w}x${h}: reversed terminal approach`);
      });
    }
    return issues;
  }, samples);
  expect(issues).toEqual([]);
});

test('temporal accents persist and obey slow, pause, hidden, still, and reduced motion', async ({
  page,
}) => {
  await page.goto('/screensaver.html');
  await page.locator('#purpose').selectOption('temporal');
  await page.locator('#layout').selectOption('survey');
  const accent = page.locator('[data-instrument="temporal"] .core-cell').first();
  await expect(accent).toHaveCSS('animation-name', 'energy');
  await page.evaluate(() => {
    window.temporalBefore = document.querySelector('.temporal-frame');
  });
  await page.waitForTimeout(3200);
  expect(
    await page.evaluate(() => window.temporalBefore === document.querySelector('.temporal-frame')),
  ).toBe(true);
  await page.locator('#motion').selectOption('calm');
  await expect(accent).toHaveCSS('animation-duration', '8.4s');
  await page.locator('#pause').click();
  await expect(accent).toHaveCSS('animation-play-state', 'paused');
  await page.locator('#pause').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(accent).toHaveCSS('animation-play-state', 'paused');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('#motion').selectOption('still');
  await expect(accent).toHaveCSS('animation-name', 'none');
  await page.locator('#motion').selectOption('full');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(accent).toHaveCSS('animation-name', 'none');
});
