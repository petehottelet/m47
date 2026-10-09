import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { createTopography, renderTopography, topographyStyles } from '../core/topography.js';

test('five distinct terrain styles are reproducible and vary with their seed', () => {
  assert.equal(topographyStyles.length, 5);
  const geometries = new Set();
  for (const { id } of topographyStyles) {
    const map = createTopography({ style: id });
    assert.deepEqual(map, createTopography({ style: id }));
    assert.notDeepEqual(map.contours, createTopography({ style: id, seed: 'alternate' }).contours);
    geometries.add(map.contours.map((c) => c.d).join(''));
    assert.ok(
      map.contours.some((c) => c.d.includes('Z')),
      `${id} has enclosed terrain`,
    );
    assert.ok(map.contours.some((c) => c.major));
    assert.ok(map.contours.some((c) => !c.major));
  }
  assert.equal(geometries.size, 5);
});

test('contours stay inside their canvas at landscape and portrait sizes', () => {
  for (const { id } of topographyStyles)
    for (const [width, height] of [
      [960, 540],
      [390, 600],
    ]) {
      const map = createTopography({ style: id, width, height });
      for (const contour of map.contours) {
        assert.doesNotMatch(contour.d, /NaN|Infinity|undefined/);
        for (const point of contour.d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)) {
          assert.ok(Number(point[1]) >= 0 && Number(point[1]) <= width);
          assert.ok(Number(point[2]) >= 0 && Number(point[2]) <= height);
        }
      }
      const svg = new DOMParser().parseFromString(
        renderTopography({ style: id, width, height }),
        'image/svg+xml',
      );
      assert.equal(svg.querySelector('svg').getAttribute('role'), 'img');
      assert.match(svg.querySelector('desc').textContent, /Not a geographic survey/);
      assert.equal(svg.querySelectorAll('script, image, foreignObject').length, 0);
    }
});

test('terrain rejects invalid styles and unbounded dimensions', () => {
  for (const options of [
    { style: 'missing' },
    { width: Infinity },
    { height: -1 },
    { width: 5000 },
  ])
    assert.throws(() => createTopography(options));
});
