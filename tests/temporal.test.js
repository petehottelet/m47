import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from 'linkedom';
import { createScene, saverPalettes } from '../core/screensaver.js';
import { renderInstrument } from '../core/instruments.js';

test('temporal phases remain abstract and retain geometry between reading updates', () => {
  for (const scheme of saverPalettes) {
    for (const [width, height] of [
      [1700, 145],
      [640, 330],
      [320, 540],
    ]) {
      const render = (tick) =>
        renderInstrument(
          createScene({ purpose: 'temporal', scheme, tick }),
          'temporal',
          20,
          30,
          width,
          height,
        );
      const markup = render(0);
      const doc = new DOMParser().parseFromString(`<svg>${markup}</svg>`, 'image/svg+xml');
      assert.equal(doc.querySelectorAll('text, .network-flow').length, 0);
      assert.equal(doc.querySelectorAll('.temporal-frame').length, 8);
      assert.equal(markup, render(12));
      assert.doesNotMatch(markup, /NaN|Infinity/);
      for (const phase of doc.querySelectorAll('.temporal-frame')) {
        assert.equal(phase.querySelectorAll('.temporal-band, .temporal-lane').length, 2);
        assert.equal(
          phase.querySelectorAll('.core-cell .temporal-gate, .core-cell .temporal-terminal').length,
          2,
        );
      }
    }
  }
});
