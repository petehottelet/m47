import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { families } from '../../review/catalog.js';
import { renderElement } from '../../review/elements.js';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === 'http://127.0.0.1:4747'
      ? route.continue()
      : route.abort(),
  );
});

test('all 155 specimen geometries and text stay within their review canvases', async ({ page }) => {
  await page.goto('/element-review/#radial');
  await page.evaluate(() => document.fonts.ready);
  const samples = families.flatMap((f) =>
    f.variants.map((s, i) => ({ id: s.id, svg: renderElement(f.id, i) })),
  );
  const defects = await page.evaluate((samples) => {
    const host = document.createElement('div');
    document.body.append(host);
    const issues = [];
    for (const { id, svg } of samples) {
      host.innerHTML = svg;
      const root = host.querySelector('svg');
      root.style.width = '800px';
      root.style.height = '480px';
      for (const node of root.querySelectorAll('text,rect,circle,path,line,polyline')) {
        if (node.closest('defs')) continue;
        const box = node.getBBox(),
          matrix = root.getScreenCTM().inverse().multiply(node.getScreenCTM());
        const corners = [
          [box.x, box.y],
          [box.x + box.width, box.y + box.height],
          [box.x, box.y + box.height],
          [box.x + box.width, box.y],
        ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
        if (corners.some((p) => p.x < -1 || p.y < -1 || p.x > 801 || p.y > 481))
          issues.push({
            id,
            node: node.tagName,
            text: node.textContent.slice(0, 70),
            bounds: corners.map((p) => [Math.round(p.x), Math.round(p.y)]),
          });
      }
    }
    host.remove();
    return issues;
  }, samples);
  expect(defects).toEqual([]);
});

test('labels on colored components stay inside their actual shapes, including rounded corners', async ({
  page,
}) => {
  await page.goto('/element-review/#manifold');
  await page.evaluate(() => document.fonts.ready);
  const samples = families.flatMap((family) =>
    family.variants.map((variant, i) => ({ id: variant.id, svg: renderElement(family.id, i) })),
  );
  const defects = await page.evaluate((samples) => {
    const host = document.createElement('div');
    document.body.append(host);
    const issues = [];
    for (const { id, svg } of samples) {
      host.innerHTML = svg;
      const root = host.querySelector('svg');
      const shapes = [...root.querySelectorAll('rect,path,circle,ellipse')].filter((shape) => {
        const fill = shape.getAttribute('fill');
        return fill && fill !== 'none' && fill !== '#000' && !shape.closest('defs');
      });
      for (const label of root.querySelectorAll('text[fill="#000"]')) {
        const box = label.getBBox();
        const corners = [
          [box.x, box.y],
          [box.x + box.width, box.y],
          [box.x, box.y + box.height],
          [box.x + box.width, box.y + box.height],
        ];
        const fits = shapes.some((shape) => {
          const matrix = shape.getScreenCTM().inverse().multiply(label.getScreenCTM());
          return corners.every(([x, y]) =>
            shape.isPointInFill(new DOMPoint(x, y).matrixTransform(matrix)),
          );
        });
        if (!fits) issues.push({ id, label: label.textContent });
      }
    }
    host.remove();
    return issues;
  }, samples);
  expect(defects).toEqual([]);
});

test('layout brackets keep clearance from surrounding frame rails', async ({ page }) => {
  await page.goto('/element-review/#layout-scan');
  const samples = families
    .filter((family) => family.group === 'Layouts')
    .flatMap((family) =>
      family.variants.map((variant, i) => ({ id: variant.id, svg: renderElement(family.id, i) })),
    );
  const defects = await page.evaluate((samples) => {
    const host = document.createElement('div');
    document.body.append(host);
    const issues = [];
    for (const { id, svg } of samples) {
      host.innerHTML = svg;
      for (const bracket of host.querySelectorAll('[data-bracket]')) {
        const length = bracket.getTotalLength();
        const frames = [...host.querySelectorAll('[data-frame]')].map((frame) => ({
          frame,
          matrix: frame.getScreenCTM().inverse().multiply(bracket.getScreenCTM()),
        }));
        let collides = false;
        for (let s = 0; s <= length && !collides; s += 2) {
          const point = bracket.getPointAtLength(s);
          for (const [dx, dy] of [
            [0, 0],
            [-5, 0],
            [5, 0],
            [0, -5],
            [0, 5],
          ]) {
            if (
              frames.some(({ frame, matrix }) =>
                frame.isPointInFill(
                  new DOMPoint(point.x + dx, point.y + dy).matrixTransform(matrix),
                ),
              )
            )
              collides = true;
          }
        }
        if (collides) issues.push({ id, bracket: bracket.getAttribute('d') });
      }
    }
    host.remove();
    return issues;
  }, samples);
  expect(defects).toEqual([]);
});

test('all layout panels contain their content without text or sibling collisions', async ({
  page,
}) => {
  await page.goto('/element-review/#layout-diagnostic');
  await page.evaluate(() => document.fonts.ready);
  const samples = families
    .filter((family) => family.group === 'Layouts')
    .flatMap((family) =>
      family.variants.map((variant, i) => ({ id: variant.id, svg: renderElement(family.id, i) })),
    );
  const issues = await page.evaluate((samples) => {
    const host = document.createElement('div');
    document.body.append(host);
    const defects = [];
    const overlaps = (a, b) =>
      Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 &&
      Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;
    for (const { id, svg } of samples) {
      host.innerHTML = svg;
      const panels = [...host.querySelectorAll('[data-panel]')];
      const region = (panel) => {
        const [x, y, w, h] = panel.dataset.bounds.split(' ').map(Number);
        return { x, y, w, h };
      };
      panels.forEach((panel, index) => {
        const bounds = region(panel);
        for (const next of panels.slice(index + 1))
          if (overlaps(bounds, region(next)))
            defects.push({
              id,
              type: 'panels overlap',
              panels: [panel.dataset.panel, next.dataset.panel],
            });
        const textBoxes = [...panel.querySelectorAll('text')].map((text) => {
          const box = text.getBBox(),
            matrix = panel.getScreenCTM().inverse().multiply(text.getScreenCTM());
          const corners = [
            [box.x, box.y],
            [box.x + box.width, box.y],
            [box.x, box.y + box.height],
            [box.x + box.width, box.y + box.height],
          ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
          const x = Math.min(...corners.map((p) => p.x)),
            y = Math.min(...corners.map((p) => p.y));
          return {
            text: text.textContent,
            x,
            y,
            w: Math.max(...corners.map((p) => p.x)) - x,
            h: Math.max(...corners.map((p) => p.y)) - y,
          };
        });
        textBoxes.forEach((text, index) => {
          if (
            text.x < bounds.x + 8 ||
            text.y < bounds.y + 8 ||
            text.x + text.w > bounds.x + bounds.w - 8 ||
            text.y + text.h > bounds.y + bounds.h - 8
          )
            defects.push({
              id,
              type: 'text outside panel padding',
              panel: panel.dataset.panel,
              text: text.text,
            });
          for (const next of textBoxes.slice(index + 1))
            if (overlaps(text, next))
              defects.push({ id, type: 'text overlap', text: [text.text, next.text] });
        });
      });
    }
    host.remove();
    return defects;
  }, samples);
  expect(issues).toEqual([]);
});

test('decisions persist, notes export, inspection closes, and no integration action exists', async ({
  page,
}) => {
  await page.goto('/element-review/#engine');
  await expect(page.locator('.specimen')).toHaveCount(5);
  await page.locator('.skip').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('.specimen')).toHaveCount(5);
  await page
    .getByRole('combobox', { name: 'Decision for E05-01', exact: true })
    .selectOption('revise');
  await page.getByLabel('Notes for E05-01', { exact: true }).fill('Make the outer cells wider.');
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Decision for E05-01', exact: true }),
  ).toHaveValue('revise');
  await expect(page.getByLabel('Notes for E05-01', { exact: true })).toHaveValue(
    'Make the outer cells wider.',
  );
  await page.getByRole('button', { name: 'Inspect larger' }).first().click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export decisions' }).click();
  expect((await download).suggestedFilename()).toBe('m47-element-decisions.json');
  await expect(page.locator('#progress')).toContainText('1 / 155 reviewed');
  await expect(
    page.getByRole('button', { name: /install|integrate|apply to screensaver/i }),
  ).toHaveCount(0);
});

test('catalogue, layout maps and mobile review stay readable and accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/element-review/#layouts');
    await page.reload();
    await expect(page.locator('.division-map')).toHaveCount(6);
    await page.goto('/element-review/#radial');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const audit = await new AxeBuilder({ page })
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.getByRole('button', { name: 'Animate specimens' }).click();
    await expect(page.locator('[data-specimen]').first()).toHaveAttribute('data-motion', 'true');
  }
});

test('storage failure remains visible after navigation and palette changes', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await page.goto('/element-review/#engine');
  await page.getByLabel('Notes for E05-01', { exact: true }).fill('Keep this note for export.');
  await expect(page.locator('#progress')).toContainText('Export decisions before closing.');
  await page.getByRole('link', { name: 'Screen divisions', exact: true }).click();
  await expect(page.locator('#progress')).toContainText('Export decisions before closing.');
  await page.getByRole('combobox', { name: 'Palette', exact: true }).selectOption('coral');
  await expect(page.locator('#progress')).toContainText('Export decisions before closing.');
  await page.goto('/element-review/#engine');
  await expect(page.getByLabel('Notes for E05-01', { exact: true })).toHaveValue(
    'Keep this note for export.',
  );
});
