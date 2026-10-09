import { test } from 'node:test';
import assert from 'node:assert/strict';
import { meshStyles, ridgeStyles, createTerrainRenderer, renderTerrain } from '../core/terrain.js';

test('five mesh and five ridge variants have distinct, deterministic, moving geometry', () => {
  for (const [family, styles] of [
    ['mesh', meshStyles],
    ['ridges', ridgeStyles],
  ]) {
    assert.equal(styles.length, 5);
    const variants = new Set();
    for (const { id: style } of styles) {
      const options = { family, style };
      const svg = renderTerrain(options);
      assert.equal(svg, renderTerrain(options));
      assert.notEqual(svg, renderTerrain({ ...options, time: 2 }));
      if (style !== 'caldera') assert.notEqual(svg, renderTerrain({ ...options, seed: 'another' }));
      variants.add(svg.replace(/stroke="#[A-Fa-f0-9]+"/g, ''));
      assert.doesNotMatch(svg, /NaN|Infinity|undefined|<script|<image/);
      assert.match(svg, /Simulated data/);
    }
    assert.equal(variants.size, 5);
  }
});

test('terrain buffers are reused and sampling held playback does not change coordinates', () => {
  for (const [family, styles] of [
    ['mesh', meshStyles],
    ['ridges', ridgeStyles],
  ])
    for (const { id: style } of styles) {
      const renderer = createTerrainRenderer({ family, style });
      const first = renderer.sample(2.5);
      const points = first.lines[10].points;
      const snapshot = Array.from(points);
      assert.equal(renderer.sample(2.5).lines[10].points, points);
      assert.deepEqual(Array.from(points), snapshot);
      renderer.sample(3);
      assert.equal(renderer.sample(3).lines[10].points, points);
      assert.notDeepEqual(Array.from(points), snapshot);
    }
});

test('perspective meshes cover the horizon and foreground in desktop and portrait viewports', () => {
  for (const { id: style } of meshStyles)
    for (const [width, height] of [
      [960, 540],
      [390, 844],
    ]) {
      const renderer = createTerrainRenderer({ style, width, height });
      for (const time of [0, 1.93, 10, 61, 1000]) {
        const frame = renderer.sample(time);
        for (const line of frame.lines) {
          assert.ok(line.points[0] <= 0 && line.points.at(-2) >= width);
          assert.ok(Array.from(line.points).every(Number.isFinite));
          for (let i = 1; i < line.points.length; i += 2)
            assert.ok(line.points[i] <= line.baseline);
        }
        const near = frame.lines.at(-1).points;
        for (let i = 1; i < near.length; i += 2) assert.ok(near[i] > height);
      }
    }
});

test('terrain rejects invalid dimensions, families, styles, and playback times', () => {
  for (const options of [
    { family: 'other' },
    { style: 'missing' },
    { width: 0 },
    { height: Infinity },
  ])
    assert.throws(() => createTerrainRenderer(options));
  const renderer = createTerrainRenderer();
  for (const time of [-1, NaN, Infinity]) assert.throws(() => renderer.sample(time));
});
