import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createScene, renderScene, layouts, purposes } from '../../core/screensaver.js';
import { feeds, describeFeed, parseFeed } from '../../core/public-feeds.js';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:4747'
      ? route.continue()
      : route.abort(),
  );
});

test('instrument animation survives readout updates and stops when paused or hidden', async ({
  page,
}) => {
  await page.goto('/screensaver.html?seed=motion');
  await page.getByRole('combobox', { name: 'Layout', exact: true }).selectOption('radial');
  await page.evaluate(() => {
    window.sweepBefore = document.querySelector('.scan-sweep');
    window.trailBefore = document.querySelector('.scan-trail');
  });
  await expect(page.locator('.scan-sweep')).toHaveCSS('animation-name', 'scan');
  await page.waitForTimeout(3200);
  expect(
    await page.evaluate(() => window.sweepBefore === document.querySelector('.scan-sweep')),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.trailBefore === document.querySelector('.scan-trail')),
  ).toBe(true);
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.scan-sweep')).toHaveCSS('animation-play-state', 'paused');
  const time = await page
    .locator('.scan-sweep')
    .evaluate((node) => node.getAnimations()[0].currentTime);
  await page.waitForTimeout(150);
  expect(
    await page.locator('.scan-sweep').evaluate((node) => node.getAnimations()[0].currentTime),
  ).toBe(time);
  await page.getByRole('button', { name: 'Next scene' }).click();
  await expect(page.locator('#display svg')).not.toHaveClass('enter');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.scan-sweep')).toHaveCSS('animation-play-state', 'paused');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('still');
  await expect(page.locator('.scan-sweep')).toHaveCSS('animation-name', 'none');
});

test('filled scanner sweeps rotate around their centers and stay inside their instruments', async ({
  page,
}) => {
  await page.goto('/screensaver.html?seed=sweep');
  await page.locator('#purpose').selectOption('navigation');
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const layout of ['radial', 'survey']) {
      await page.locator('#layout').selectOption(layout);
      const sample = await page
        .locator('.scan-sweep')
        .first()
        .evaluate((sweep) => {
          const edge = sweep.querySelector('line');
          const radius = Number(edge.getAttribute('x2'));
          const trailBox = sweep.querySelector('.scan-trail').getBBox();
          const animation = sweep.getAnimations()[0];
          animation.pause();
          const transforms = [];
          const envelope = sweep.parentElement.getScreenCTM();
          let maximumRadius = 0;
          for (const time of [0, 4500, 9000, 13500]) {
            animation.currentTime = time;
            const matrix = sweep.getScreenCTM();
            transforms.push(getComputedStyle(sweep).transform);
            for (const point of [new DOMPoint(0, 0), new DOMPoint(radius, 0)]) {
              const local = point.matrixTransform(matrix).matrixTransform(envelope.inverse());
              maximumRadius = Math.max(maximumRadius, Math.hypot(local.x, local.y));
            }
          }
          return {
            radius,
            maximumRadius,
            trailWidth: trailBox.width,
            trailHeight: trailBox.height,
            uniqueTransforms: new Set(transforms).size,
          };
        });
      expect(sample.trailWidth).toBeGreaterThan(sample.radius * 0.8);
      expect(sample.trailHeight).toBeGreaterThan(sample.radius * 0.8);
      expect(sample.uniqueTransforms).toBe(4);
      expect(sample.maximumRadius).toBeLessThanOrEqual(sample.radius + 0.1);
    }
  }
});

test('public observations are opt-in, sourced, cached on failure and removable', async ({
  page,
}) => {
  await page.clock.install();
  let requests = 0,
    fail = false;
  await page.route(feeds.earthquakes.url, (route) => {
    requests++;
    return fail
      ? route.abort()
      : route.fulfill({
          json: {
            type: 'FeatureCollection',
            metadata: { generated: Date.now() },
            features: [
              { properties: { mag: 4.2, time: Date.now() - 60_000, place: 'Example coast' } },
            ],
          },
        });
  });
  await page.goto('/screensaver.html?seed=live');
  expect(requests).toBe(0);
  await page
    .getByRole('combobox', { name: 'Observation band', exact: true })
    .selectOption('earthquakes');
  await expect(page.locator('#observation-band')).toContainText(
    'USGS / EARTHQUAKES / PUBLIC OBSERVATIONS',
  );
  await expect(page.locator('#observation-band')).toContainText('MAX M 4.2');
  await expect(page.locator('#display')).toContainText('SIMULATED SYSTEMS');
  expect(requests).toBe(1);
  fail = true;
  await page.clock.runFor(303_000);
  await expect(page.locator('#observation-band')).toContainText('CACHED · OFFLINE');
  await expect(page.locator('#observation-band')).toContainText('MAX M 4.2');
  await page.keyboard.press('Tab');
  await page.getByRole('combobox', { name: 'Observation band', exact: true }).selectOption('off');
  const count = requests;
  await page.clock.runFor(300_000);
  expect(requests).toBe(count);
  await expect(page.locator('#observation-band')).toContainText('LOCAL SIMULATION');
});

test('every layout and purpose fits both orientations including a long observation band', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/screensaver.html');
  await page.evaluate(() => document.fonts.ready);
  const now = Date.now();
  const feed = describeFeed(
    'earthquakes',
    {
      data: parseFeed(
        'earthquakes',
        {
          type: 'FeatureCollection',
          metadata: { generated: now },
          features: [
            {
              properties: {
                mag: 5.4,
                time: now,
                place: 'A deliberately long place description beyond normal labels',
              },
            },
          ],
        },
        now,
      ),
      fetched: now,
    },
    now,
  );
  for (const portrait of [false, true]) {
    const samples = layouts.flatMap((layout) =>
      purposes.map((purpose) => ({
        layout,
        purpose: purpose.id,
        svg: renderScene(createScene({ layout, purpose: purpose.id }), { portrait, feed }),
      })),
    );
    const problems = await page.evaluate((samples) => {
      const host = document.getElementById('display'),
        problems = [];
      for (const sample of samples) {
        host.innerHTML = sample.svg;
        const svg = host.querySelector('svg'),
          { width, height } = svg.viewBox.baseVal;
        for (const node of svg.querySelectorAll('text')) {
          const box = node.getBBox();
          if (box.x < 0 || box.y < 0 || box.x + box.width > width || box.y + box.height > height)
            problems.push({
              layout: sample.layout,
              purpose: sample.purpose,
              text: node.textContent,
            });
        }
      }
      return problems;
    }, samples);
    expect(problems).toEqual([]);
  }
});

test('screensaver cycles offline, pauses, remembers settings and handles keyboard input', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto('/screensaver.html?seed=checks');
  const display = page.locator('#display');
  await expect(display.locator('svg')).toBeVisible();
  await page.getByLabel('New scene').selectOption('15');
  const firstPurpose = await display.locator('svg').getAttribute('data-purpose');
  await page.clock.runFor(16000);
  await expect(display).toHaveAttribute('data-scene', '1');
  expect(await display.locator('svg').getAttribute('data-purpose')).not.toBe(firstPurpose);
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await display.innerHTML();
  await page.clock.fastForward(60000);
  expect(await display.innerHTML()).toBe(paused);
  await page.getByRole('button', { name: 'Next scene' }).click();
  await expect(display).toHaveAttribute('data-scene', '2');
  await page.getByRole('combobox', { name: 'Purpose', exact: true }).selectOption('engineering');
  await page.getByRole('combobox', { name: 'Palette', exact: true }).selectOption('blue');
  await expect(display.locator('svg')).toHaveAttribute('data-purpose', 'engineering');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Purpose', exact: true })).toHaveValue(
    'engineering',
  );
  await expect(page.getByRole('combobox', { name: 'Palette', exact: true })).toHaveValue('blue');
  await page.locator('#display').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('n');
  await expect(display).toHaveAttribute('data-scene', '1');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('fullscreen clears the controls and keyboard navigation reveals them again', async ({
  page,
}) => {
  await page.goto('/screensaver.html');
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await expect(page.locator('#display')).toBeFocused();
  await expect(page.locator('#dock')).toHaveCSS('opacity', '0');
  await page.keyboard.press('Tab');
  await expect(page.locator('#dock')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});

test('reduced motion, responsive diagrams, and controls remain accessible', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/screensaver.html?seed=47');
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#display svg')).toHaveAttribute(
      'viewBox',
      width === 1440 ? '0 0 1440 900' : '0 0 900 1440',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    // Check actual rendered SVG text extents, including the longest purposes.
    for (const purpose of ['observatory', 'communications', 'weather']) {
      await page.getByRole('combobox', { name: 'Purpose', exact: true }).selectOption(purpose);
      const clipped = await page.locator('#display svg').evaluate((svg) => {
        const width = svg.viewBox.baseVal.width;
        return [...svg.querySelectorAll('text')]
          .filter((node) => {
            const box = node.getBBox();
            return box.x < 0 || box.x + box.width > width;
          })
          .map((node) => node.textContent);
      });
      expect(clipped).toEqual([]);
    }
    const audit = await new AxeBuilder({ page })
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    if (testInfo.project.name === 'chromium')
      await page.screenshot({
        path: testInfo.outputPath(`screensaver-${width}.png`),
        fullPage: true,
      });
  }
});
