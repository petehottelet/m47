import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import {
  render,
  renderSVG,
  solve,
  validateSpec,
  checkHTML,
  palette,
  random,
  schemes,
} from '../core/index.js';
import { extractSpec } from '../core/extract.js';
import { examples } from '../core/examples.js';
import { decodeSettings, siteHost } from '../extension/shared/settings.js';

const fixtures = [
  ...examples,
  { ...examples[0], name: 'Poster', width: 1600, height: 2400 },
  { ...examples[1], name: 'Narrow portrait', width: 390, height: 1800 },
  { ...examples[2], name: 'Gold console', scheme: 'tng-early', width: 1440, height: 900 },
  { ...examples[3], name: 'Minimum widget', width: 320, height: 240 },
];
for (const [index, example] of fixtures.entries())
  test(`fixture ${index + 1}: ${example.name} deterministic and structurally conformant`, () => {
    const options = {
      width: example.width,
      height: example.height,
      scheme: example.scheme,
      seed: String(index),
    };
    assert.equal(render(example.spec, options), render(example.spec, options));
    assert.equal(renderSVG(example.spec, options), renderSVG(example.spec, options));
    assert.deepEqual(checkHTML(render(example.spec, options)), []);
    const { document } = parseHTML(render(example.spec, options));
    assert.equal(document.querySelectorAll('main section').length, example.spec.sections.length);
    for (const a of document.querySelectorAll('nav a'))
      assert.ok(document.querySelector(a.getAttribute('href')));
  });
test('seeds change decoration but retain user content', () => {
  assert.notDeepEqual(
    solve(examples[0].spec, { seed: 'a' }).codes,
    solve(examples[0].spec, { seed: 'b' }).codes,
  );
  assert.deepEqual(
    solve(examples[0].spec, { seed: 'a' }).spec,
    solve(examples[0].spec, { seed: 'b' }).spec,
  );
  assert.equal(random('x')(), random('x')());
});
test('SVG meter labels stay below preceding tracks', () => {
  const { document } = parseHTML(renderSVG(examples[0].spec));
  const meters = [...document.querySelectorAll('.m47-svg-meter')];
  assert.equal(meters.length, 3);
  for (let i = 1; i < meters.length; i++) {
    const previous = meters[i - 1].querySelector('rect'),
      label = meters[i].querySelector('text');
    const trackBottom =
      Number(previous.getAttribute('y')) + Number(previous.getAttribute('height'));
    const labelTop =
      Number(label.getAttribute('y')) - Number(label.getAttribute('font-size')) * 1.2;
    assert.ok(labelTop >= trackBottom + 3, 'Text must not intersect the preceding meter.');
  }
});
test('standalone HTML and SVG retain the embedded font license', async () => {
  const license = await readFile('extension/fonts/OFL.txt', 'utf8');
  const options = { fontData: 'data:font/ttf;base64,AA==' };
  for (const output of [render({}, options), renderSVG({}, options)]) {
    const { document } = parseHTML(output);
    assert.equal(document.querySelector('#m47-font-license').textContent, license);
  }
});
test('rejects invalid schema and unreasonable dimensions', () => {
  for (const width of [0, 319, 99999, NaN, Infinity, 400.5])
    assert.throws(() => solve({}, { width }));
  assert.throws(() => solve({}, { scheme: 'x' }));
  assert.throws(() => solve({}, { density: 'invisible' }));
  assert.throws(() => validateSpec({ title: 'x'.repeat(121) }));
  assert.throws(() => validateSpec({ title: 'a\0b' }));
  assert.throws(() => validateSpec({ sections: [{ type: 'script' }] }));
  assert.throws(() =>
    validateSpec({ sections: [{ type: 'bars', items: [{ label: 'x', value: 101 }] }] }),
  );
  assert.throws(() =>
    validateSpec({ sections: [{ type: 'table', columns: ['a', 'b'], rows: [['a']] }] }),
  );
});
test('escapes hostile content and rejects font injection', () => {
  const title = '<img src=x onerror=alert(1)><script>alert(1)</script>';
  const html = render({ title, sections: [{ title: '" onclick="attack', text: title }] });
  const { document } = parseHTML(html);
  assert.equal(document.querySelector('h1').textContent, title);
  assert.equal(document.querySelectorAll('script,img,[onclick]').length, 0);
  assert.doesNotMatch(renderSVG({ title }), /<script>/);
  assert.throws(() => render({}, { fontData: 'https://evil.test/font' }));
  assert.throws(() => renderSVG({}, { fontData: "');}</style><script>" }));
});
test('vector export refuses overflow while HTML retains all prose', () => {
  const spec = {
    title: 'Long',
    sections: [{ title: 'Notes', text: 'A long paragraph. '.repeat(1000) }],
  };
  assert.throws(() => renderSVG(spec), /more vertical space/);
  assert.ok(render(spec).includes(spec.sections[0].text));
});
test('all semantic reading colors have 4.5:1 contrast on black', () => {
  const luminance = (hex) => {
    const rgb = hex
      .match(/[a-f0-9]{2}/gi)
      .map((x) => parseInt(x, 16) / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const scheme of schemes)
    for (const [name, color] of Object.entries(palette(scheme)))
      if (!['ground', 'onShape'].includes(name))
        assert.ok((luminance(color) + 0.05) / 0.05 >= 4.5, `${scheme}:${name}`);
});
test('extracts local article without forms, navigation or executable content', () => {
  const { document } = parseHTML(
    '<html><head><title>Page</title></head><body><nav>secret nav</nav><article><h1>Field report</h1><p>Useful text</p><form><input value="private"><p>Private field</p></form><script>alert(1)</script><p>Second paragraph</p></article></body></html>',
  );
  const spec = extractSpec(document);
  assert.equal(spec.title, 'Field report');
  assert.match(spec.sections[0].text, /Useful text/);
  assert.doesNotMatch(spec.sections[0].text, /Private|alert|secret/);
});
test('settings isolate per-host keys and ignore invalid values', () => {
  const cfg = decodeSettings({
    'site:example.com': 'off',
    'site:bad': 'hacked',
    defaultMode: 'palette',
    'site:__proto__': 'full',
  });
  assert.equal(cfg.sites['example.com'], 'off');
  assert.equal(cfg.sites.bad, undefined);
  assert.equal(Object.getPrototypeOf(cfg.sites), null);
  assert.equal(siteHost('https://example.com/x'), 'example.com');
  assert.equal(siteHost('chrome://extensions'), null);
  assert.equal(siteHost('file:///tmp/a'), null);
});
test('CLI creates every format, protects existing files, and exits on errors', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'm47-cli-'));
  const spec = join(dir, 'spec.json');
  await writeFile(spec, JSON.stringify(examples[0].spec));
  for (const ext of ['html', 'svg', 'png', 'css']) {
    const out = join(dir, 'panel.' + ext);
    const result = spawnSync(
      process.execPath,
      ['cli/index.js', 'generate', '--spec', spec, '--out', out],
      { cwd: resolve('.'), encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    const buffer = await readFile(out);
    assert.ok(buffer.length > 100);
    if (ext === 'png') {
      assert.equal(buffer.toString('hex', 0, 8), '89504e470d0a1a0a');
      assert.equal(buffer.readUInt32BE(16), 1280);
      assert.equal(buffer.readUInt32BE(20), 800);
    }
  }
  const out = join(dir, 'panel.html');
  assert.equal(spawnSync(process.execPath, ['cli/index.js', 'generate', '--out', out]).status, 1);
  assert.equal(spawnSync(process.execPath, ['cli/index.js', 'check', out]).status, 0);
  assert.equal(
    spawnSync(process.execPath, ['cli/index.js', 'generate', '--size', 'bad']).status,
    1,
  );
});
