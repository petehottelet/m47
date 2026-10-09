import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { createScene, renderScene } from '../core/screensaver.js';

test('stellar cartography uses a sector map with a plotted course across scanner layouts', () => {
  for (const layout of ['survey', 'radial', 'bridge', 'split', 'analysis', 'telemetry'])
    for (const portrait of [false, true]) {
      const scene = createScene({ purpose: 'navigation', layout });
      const doc = new DOMParser().parseFromString(
        renderScene(scene, { portrait }),
        'image/svg+xml',
      );
      const map = doc.querySelector('.stellar-map');
      assert.ok(map, `${layout} presents the sector map`);
      assert.equal(doc.querySelectorAll('.arc-scanner, .scan-sweep').length, 0);
      assert.equal(map.querySelectorAll('.sector-system').length, 4);
      assert.equal(map.querySelectorAll('.sector-star').length, 42);
      assert.equal(map.querySelectorAll('[data-selected]').length, 1);
      assert.ok(map.querySelector('.stellar-course'));
      assert.equal(map.querySelector('.stellar-course').getAttribute('stroke-width'), '2.5');
      const updated = new DOMParser().parseFromString(
        renderScene(createScene({ purpose: 'navigation', layout, tick: 9 }), { portrait }),
        'image/svg+xml',
      );
      assert.equal(map.outerHTML, updated.querySelector('.stellar-map').outerHTML);
    }
});
