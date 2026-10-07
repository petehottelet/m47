import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { families, references, variantCount } from '../review/catalog.js';
import { screenDivisions } from '../review/layout-catalog.js';
import { renderElement, readyFamilies } from '../review/elements.js';
import { readFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import { diagnosticLayout, layoutSpacing } from '../review/layout-geometry.js';

test('diagnostic layouts share aligned rows, panel heights and a single sibling gutter', () => {
  for (let variant = 0; variant < 5; variant++) {
    const { register, enclosure, bank, lower, gutter } = diagnosticLayout(variant);
    assert.equal(gutter, layoutSpacing.gutter);
    assert.equal(register.y, enclosure.y);
    assert.equal(register.h, enclosure.h);
    assert.equal(enclosure.x - (register.x + register.w), gutter);
    assert.equal(lower[0].y, lower[1].y);
    assert.equal(lower[0].h, lower[1].h);
    assert.equal(bank.h, lower[0].h);
    assert.equal(lower[0].y - (bank.y + bank.h), gutter);
    assert.equal(lower[1].x - (lower[0].x + lower[0].w), gutter);
    assert.equal(bank.x, lower[0].x);
    assert.equal(bank.x + bank.w, lower[1].x + lower[1].w);
    for (const box of [register, enclosure, bank, ...lower]) {
      assert.ok(box.w > 0 && box.h > 0);
      for (const value of Object.values(box)) assert.equal(value % layoutSpacing.unit, 0);
    }
  }
});

test('radial separators keep a uniform linear width across inner and outer rings', () => {
  for (const variant of [0, 1, 3]) {
    const image = new Resvg(renderElement('radial', variant), {
      fitTo: { mode: 'width', value: 3200 },
      font: { loadSystemFonts: false },
    }).render();
    const pixels = image.pixels;
    const cx = variant === 3 ? 340 : 400,
      cy = variant === 1 ? 325 : 235;
    const bright = (x, y) => {
      const offset = (Math.floor(y * 4) * image.width + Math.floor(x * 4)) * 4;
      return Math.max(...pixels.slice(offset, offset + 3));
    };
    for (let ring = 0; ring < 3; ring++) {
      const angle = ((variant === 1 ? 211 : ring === 2 ? 8 : 0) * Math.PI) / 180;
      const radius = variant === 1 ? 93.5 + ring * 37 : 74.5 + ring * 39;
      const x = cx + Math.cos(angle) * radius,
        y = cy + Math.sin(angle) * radius;
      for (const side of [-1, 1]) {
        assert.ok(
          bright(x - Math.sin(angle) * side * 1.5, y + Math.cos(angle) * side * 1.5) < 25,
          `variant ${variant}, ring ${ring}: separator center`,
        );
        assert.ok(
          bright(x - Math.sin(angle) * side * 4.5, y + Math.cos(angle) * side * 4.5) > 80,
          `variant ${variant}, ring ${ring}: separator must not widen`,
        );
      }
    }
    const angle = ((variant === 1 ? 199.5 : 60) * Math.PI) / 180;
    for (const radius of variant === 1 ? [112, 149] : [94, 133]) {
      for (const delta of [-1.5, 1.5])
        assert.ok(
          bright(cx + Math.cos(angle) * (radius + delta), cy + Math.sin(angle) * (radius + delta)) <
            25,
          'ring gap matches spoke gap',
        );
    }
  }
});

test('connection and measurement vectors have solid matching dots at both exact endpoints', () => {
  for (const [family, variant, count] of [
    ['reticle', 2, 1],
    ['reticle', 3, 2],
    ['reticle', 4, 3],
    ['space-map', 4, 1],
    ['schematic', 2, 3],
    ['schematic', 4, 1],
    ['viewer', 3, 2],
  ]) {
    const doc = new DOMParser().parseFromString(renderElement(family, variant), 'image/svg+xml');
    const vectors = doc.querySelectorAll('[data-vector="connection"]');
    assert.equal(vectors.length, count, family);
    for (const vector of vectors) {
      const line = vector.querySelector('line'),
        dots = vector.querySelectorAll('circle');
      assert.equal(dots.length, 2);
      for (let i = 0; i < 2; i++) {
        assert.equal(dots[i].getAttribute('cx'), line.getAttribute(`x${i + 1}`));
        assert.equal(dots[i].getAttribute('cy'), line.getAttribute(`y${i + 1}`));
        assert.equal(dots[i].getAttribute('fill'), line.getAttribute('stroke'));
        assert.ok(Number(dots[i].getAttribute('r')) > Number(line.getAttribute('stroke-width')));
      }
    }
  }
});

test('segmented command and status bars have flat facing edges with a constant divider', () => {
  for (const [family, variant, x, y, gap, height] of [
    ['navigation', 3, 164, 100, 3, 56],
    ['status', 3, 230, 165, 4, 94],
  ]) {
    const image = new Resvg(renderElement(family, variant), {
      fitTo: { mode: 'width', value: 3200 },
      font: { loadSystemFonts: false },
    }).render();
    const pixels = image.pixels;
    const bright = (xx, yy) => {
      const offset = (Math.floor(yy * 4) * image.width + Math.floor(xx * 4)) * 4;
      return Math.max(...pixels.slice(offset, offset + 3));
    };
    for (const yy of [y + 4, y + height / 2, y + height - 4]) {
      assert.ok(bright(x - 1, yy) > 80, family + ' leading segment stays flat');
      assert.ok(bright(x + gap / 2, yy) < 25, family + ' divider remains clear');
      assert.ok(bright(x + gap + 1, yy) > 80, family + ' following segment stays flat');
    }
  }
});

test('open schematic paths end in solid points at both terminals', () => {
  for (const [variant, count] of [
    [3, 6],
    [4, 5],
  ]) {
    const doc = new DOMParser().parseFromString(
      renderElement('schematic', variant),
      'image/svg+xml',
    );
    const vectors = doc.querySelectorAll('[data-vector="path"]');
    assert.equal(vectors.length, count);
    for (const vector of vectors) {
      const path = vector.querySelector('path'),
        dots = vector.querySelectorAll('circle');
      assert.equal(dots.length, 2);
      for (const dot of dots) assert.equal(dot.getAttribute('fill'), path.getAttribute('stroke'));
    }
  }
});

test('reference catalogue covers every supplied example and every family has five distinct specimens', () => {
  assert.equal(references.length, 6);
  assert.equal(screenDivisions.length, 6);
  assert.equal(variantCount, 155);
  const ids = new Set();
  for (const family of families) {
    assert.equal(family.variants.length, 5);
    assert.ok(readyFamilies.has(family.id));
    const designs = new Set();
    for (let i = 0; i < 5; i++) {
      const spec = family.variants[i];
      assert.ok(!ids.has(spec.id));
      ids.add(spec.id);
      const svg = renderElement(family.id, i);
      assert.equal(svg, renderElement(family.id, i));
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      assert.equal(doc.querySelectorAll('script, foreignObject, image').length, 0);
      assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
      for (const rect of doc.querySelectorAll('rect')) {
        assert.ok(Number(rect.getAttribute('width')) >= 0, spec.id + ' rect width');
        assert.ok(Number(rect.getAttribute('height')) >= 0, spec.id + ' rect height');
      }
      designs.add(
        [...doc.querySelectorAll('path, rect, circle, line, polyline, g[transform]')]
          .map((n) => n.outerHTML)
          .join(''),
      );
    }
    assert.equal(designs.size, 5, family.id + ' must vary geometry, not just labels');
    assert.ok(family.refs.every((ref) => references.some((r) => r.id === ref)));
  }
});

test('screen maps cover nesting, proportions, hierarchy, alignment and adaptation', () => {
  for (const screen of screenDivisions) {
    assert.ok(families.some((f) => f.id === screen.family && f.group === 'Layouts'));
    for (const key of ['hierarchy', 'structure', 'alignment', 'whitespace', 'adaptation'])
      assert.ok(screen[key].length > 60);
    for (const [, x, y, w, h] of screen.divisions) {
      assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 100 && y + h <= 100);
    }
  }
});

test('review library remains outside screensaver imports and native build', async () => {
  for (const path of [
    'web/screensaver.js',
    'core/screensaver.js',
    'scripts/build-screensaver.js',
  ]) {
    const source = await readFile(path, 'utf8');
    assert.doesNotMatch(source, /(?:from|import).*review\//);
    assert.doesNotMatch(source, /element-review/);
  }
  assert.throws(() => renderElement('missing'));
  assert.throws(() => renderElement('radial', 5));
});
