import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { createScene, renderScene, layouts } from '../core/screensaver.js';
import { operationPurposes, renderInstrument } from '../core/instruments.js';

const parse = (svg) => new DOMParser().parseFromString(svg, 'image/svg+xml');

test('all eight operation subjects retain their own geometry in every composition', () => {
  const shapes = new Set();
  for (const { id } of operationPurposes) {
    for (const layout of layouts) {
      for (const portrait of [false, true]) {
        const first = parse(renderScene(createScene({ purpose: id, layout }), { portrait }));
        const next = parse(
          renderScene(createScene({ purpose: id, layout, tick: 9 }), { portrait }),
        );
        const instrument = first.querySelector(`[data-instrument="${id}"]`);
        assert.ok(instrument, `${id} must remain visible in ${layout}`);
        assert.equal(
          instrument.outerHTML,
          next.querySelector(`[data-instrument="${id}"]`).outerHTML,
        );
        assert.equal(first.querySelectorAll('.arc-scanner, .scan-sweep').length, 0);
        shapes.add(id + ':' + instrument.outerHTML);
      }
    }
  }
  assert.ok(shapes.size >= operationPurposes.length);
});

test('rectangular scanners provide distinct navigation, imaging and tomography views', () => {
  for (const [purpose, kind] of [
    ['navigation', 'stellar-map'],
    ['observatory', 'sky'],
    ['geology', 'strata'],
  ]) {
    for (const layout of ['survey', 'radial', 'bridge']) {
      for (const portrait of [false, true]) {
        const doc = parse(
          renderScene(createScene({ purpose, layout, scanners: 'rectangular' }), { portrait }),
        );
        assert.ok(doc.querySelector(`[data-instrument="${kind}"]`));
        assert.ok(
          doc.querySelector(purpose === 'navigation' ? '.stellar-course' : '.sensor-sweep'),
        );
        assert.equal(doc.querySelectorAll('.scan-sweep, .arc-scanner').length, 0);
      }
    }
  }
  assert.throws(() => renderInstrument(createScene(), 'missing', 0, 0, 500, 300));
});

test('transporter cells animate as six phase columns and nine buffer rows', () => {
  const doc = parse(renderScene(createScene({ purpose: 'transporter', layout: 'survey' })));
  const groups = [...doc.querySelectorAll('[data-instrument="transporter"] .core-cell')];
  assert.equal(groups.length, 15);
  assert.ok(groups.every((node) => node.querySelectorAll('rect').length === 12));
});

test('environment and temporal instruments retain connected, grouped LCARS banks', () => {
  const scene = createScene({ purpose: 'environment', layout: 'survey' });
  const environment = parse(renderScene(scene)).querySelector('[data-instrument="environment"]');
  assert.equal(environment.querySelectorAll('.environment-bank').length, 6);
  assert.equal(environment.querySelectorAll('.environment-cell').length, 42);
  assert.equal(environment.querySelectorAll('.core-cell').length, 6);
  for (const connection of environment.querySelectorAll('.environment-conduit'))
    assert.equal(connection.querySelectorAll('circle').length, 2);
  const temporal = parse(renderScene(createScene({ purpose: 'temporal', layout: 'survey' })));
  assert.equal(temporal.querySelectorAll('.temporal-frame').length, 8);
  assert.equal(temporal.querySelectorAll('.temporal-gate').length, 8);
});

test('shuttle approach markers are filled curves and the bus cells represent actual utilization', () => {
  const shuttle = parse(renderScene(createScene({ purpose: 'shuttle', layout: 'survey' })));
  const marker = shuttle.querySelector('.direction-marker');
  assert.ok(marker);
  assert.notEqual(marker.getAttribute('fill'), 'none');
  assert.equal(marker.hasAttribute('stroke'), false);
  assert.match(marker.getAttribute('d'), /Q/);
  assert.equal(shuttle.querySelectorAll('.shuttle-berth').length, 3);
  const scene = createScene({ purpose: 'computing', layout: 'survey' });
  const doc = parse(renderScene(scene));
  const buses = [...doc.querySelectorAll('.distribution-bus')];
  assert.equal(buses.length, 4);
  buses.forEach((bus, i) => {
    const cells = [...bus.querySelectorAll('.bus-capacity-cell')];
    assert.equal(cells.length, 20);
    assert.equal(
      cells.filter((cell) => cell.getAttribute('opacity') === '1').length,
      Math.round(scene.channels[i].value / 5),
    );
    assert.match(bus.textContent, new RegExp(scene.channels[i].value + '%'));
  });
});
