import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { createScene, renderScene, purposes, layouts, saverPalettes } from '../core/screensaver.js';

test('screensaver seeds reproduce complete cycles with varied layouts and palettes', () => {
  const scenes = purposes.map((_, index) => createScene({ seed: 'survey-47', index }));
  assert.equal(new Set(scenes.map((s) => s.purpose)).size, purposes.length);
  assert.equal(new Set(scenes.map((s) => s.layout)).size, layouts.length);
  assert.equal(new Set(scenes.map((s) => s.scheme)).size, saverPalettes.length);
  assert.deepEqual(
    scenes,
    purposes.map((_, index) => createScene({ seed: 'survey-47', index })),
  );
  assert.notDeepEqual(scenes[0], createScene({ seed: 'another-seed' }));
  assert.equal(
    scenes[0].purpose,
    createScene({ seed: 'survey-47', index: purposes.length }).purpose,
  );
});

test('telemetry updates retain composition and keep every reading in its domain', () => {
  for (const purpose of purposes) {
    const first = createScene({ purpose: purpose.id });
    for (const tick of [1, 2, 50, 1000]) {
      const scene = createScene({ purpose: purpose.id, tick });
      for (const property of ['title', 'purpose', 'layout', 'colors', 'nodes', 'code'])
        assert.deepEqual(scene[property], first[property]);
      assert.notDeepEqual(scene.signal, first.signal);
      scene.metrics.forEach((metric, i) => {
        assert.ok(Number(metric.value) >= purpose.metrics[i][1]);
        assert.ok(Number(metric.value) <= purpose.metrics[i][2]);
      });
      assert.ok(scene.channels.every((channel) => channel.value >= 25 && channel.value <= 98));
      assert.ok(scene.signal.every((value) => value >= 0 && value <= 1));
    }
  }
});

test('every purpose renders self-contained, labeled SVG in landscape and portrait', () => {
  const diagrams = new Set();
  for (const purpose of purposes) {
    for (const portrait of [false, true]) {
      const scene = createScene({ purpose: purpose.id });
      diagrams.add(scene.diagram);
      const markup = renderScene(scene, { portrait });
      const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
      assert.equal(document.querySelector('svg').getAttribute('role'), 'img');
      assert.equal(document.querySelector('title').textContent, purpose.title);
      assert.match(document.querySelector('desc').textContent, /All readings are simulated/);
      assert.equal(document.querySelectorAll('script, image, foreignObject').length, 0);
      assert.doesNotMatch(markup, /NaN|Infinity|<text[^>]*>undefined/);
      for (const rect of document.querySelectorAll('rect')) {
        assert.ok(Number(rect.getAttribute('width')) >= 0);
        assert.ok(Number(rect.getAttribute('height')) >= 0);
      }
    }
  }
  assert.equal(diagrams.size, 6);
});

test('screensaver rejects unknown settings and invalid counters', () => {
  for (const options of [
    { purpose: 'missing' },
    { scheme: 'missing' },
    { layout: 'missing' },
    { index: -1 },
    { index: NaN },
    { tick: 0.5 },
  ])
    assert.throws(() => createScene(options));
});

test('radar and orbital scanners have a filled fading trail and a single leading edge', () => {
  for (const layout of ['radial', 'bridge', 'survey']) {
    for (const portrait of [false, true]) {
      const scene = createScene({ layout, purpose: 'navigation' });
      const doc = new DOMParser().parseFromString(
        renderScene(scene, { portrait }),
        'image/svg+xml',
      );
      const sweeps = doc.querySelectorAll('.scan-sweep');
      assert.ok(sweeps.length > 0);
      for (const sweep of sweeps) {
        const layers = [...sweep.querySelectorAll('.scan-trail path')];
        assert.ok(layers.length > 1, 'A scanner must illuminate an area, not just draw rays.');
        assert.equal(sweep.querySelector('.scan-trail').getAttribute('fill'), scene.colors.data);
        let accumulated = 0;
        for (const layer of layers) {
          const opacity = Number(layer.getAttribute('opacity'));
          assert.ok(opacity > 0 && opacity < 0.05, 'Individual layers must fade smoothly.');
          accumulated += (1 - accumulated) * opacity;
          assert.match(layer.getAttribute('d'), /^M0 0L.+A.+Z$/, 'Trail sectors must be closed.');
        }
        assert.ok(
          accumulated > 0.3 && accumulated < 0.5,
          'The sweep stays visible and translucent.',
        );
        const edges = sweep.querySelectorAll('line');
        assert.equal(edges.length, 1, 'One leading edge replaces the old pair of rays.');
        assert.equal(edges[0].getAttribute('x1'), '0');
        assert.equal(edges[0].getAttribute('y1'), '0');
        assert.equal(edges[0].getAttribute('y2'), '0');
        assert.ok(Number(edges[0].getAttribute('x2')) > 0);
      }
    }
  }
});

test('all layouts support every purpose and preserve positive frame geometry', () => {
  const silhouettes = new Set();
  for (const layout of layouts) {
    for (const purpose of purposes) {
      for (const portrait of [false, true]) {
        const scene = createScene({ layout, purpose: purpose.id });
        const doc = new DOMParser().parseFromString(
          renderScene(scene, { portrait }),
          'image/svg+xml',
        );
        assert.equal(doc.querySelector('svg').getAttribute('data-layout'), layout);
        for (const rect of doc.querySelectorAll('rect')) {
          assert.ok(Number(rect.getAttribute('width')) >= 0);
          assert.ok(Number(rect.getAttribute('height')) >= 0);
        }
        if (!portrait)
          silhouettes.add(
            [...doc.querySelectorAll('.scene-frame')].map((node) => node.outerHTML).join(''),
          );
      }
    }
  }
  assert.equal(silhouettes.size, layouts.length);
});

test('successive palette cycles pair each layout with different colors', () => {
  const first = createScene({ seed: 'variation' });
  const next = createScene({ seed: 'variation', index: layouts.length });
  assert.equal(first.layout, next.layout);
  assert.notEqual(first.scheme, next.scheme);
});
