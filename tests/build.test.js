import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';

test('Firefox builds use distinct stable UUIDs for their add-on identities', async () => {
  const ids = [];
  for (const directory of ['firefox', 'newtab-firefox', 'theme-firefox']) {
    const manifest = JSON.parse(await readFile(`dist/${directory}/manifest.json`, 'utf8'));
    const id = manifest.browser_specific_settings.gecko.id;
    assert.match(id, /^\{[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}\}$/);
    ids.push(id);
  }
  assert.equal(new Set(ids).size, 3);
});

test('optional Windows screensaver archive includes its runtime, scene assets and legal files', async (t) => {
  const name = 'm47-v0.2.0-screensaver-windows-x64.zip';
  let bytes;
  try {
    bytes = await readFile('dist/' + name);
  } catch {
    t.skip('Run npm run build:screensaver on Windows to inspect the native archive.');
    return;
  }
  const files = unzipSync(bytes);
  for (const file of [
    'M47.scr',
    'M47-preview.exe',
    'Microsoft.Web.WebView2.Core.dll',
    'Microsoft.Web.WebView2.WinForms.dll',
    'WebView2Loader.dll',
    'web/screensaver.html',
    'web/screensaver.js',
    'web/screensaver.css',
    'web/fonts/Antonio.ttf',
    'web/fonts/OFL.txt',
    'LICENSE',
    'WebView2-LICENSE.txt',
    'WebView2-NOTICE.txt',
  ])
    assert.ok(files[file], file);
  assert.equal(strFromU8(files['M47.scr'].slice(0, 2)), 'MZ');
  assert.deepEqual(files['M47.scr'], files['M47-preview.exe']);
  assert.ok(
    (await readFile('dist/SHA256SUMS.txt', 'utf8')).includes(
      createHash('sha256').update(bytes).digest('hex') + '  ' + name,
    ),
  );
});
test('release archives contain legal files, expected permissions and valid checksums', async (t) => {
  let archives;
  try {
    archives = (await readdir('dist')).filter(
      (x) =>
        x.endsWith('.zip') && !x.endsWith('-source.zip') && !x.includes('-screensaver-windows-'),
    );
  } catch {
    t.skip('Run npm run build to inspect release archives.');
    return;
  }
  assert.equal(archives.length, 8);
  const checksums = await readFile('dist/SHA256SUMS.txt', 'utf8');
  for (const name of archives) {
    const bytes = await readFile('dist/' + name),
      files = unzipSync(bytes);
    assert.match(
      checksums,
      new RegExp(
        createHash('sha256').update(bytes).digest('hex') + '  ' + name.replaceAll('.', '\\.'),
      ),
    );
    if (name.includes('website')) {
      for (const file of [
        'index.html',
        'app.js',
        'screensaver.html',
        'screensaver.js',
        'screensaver.css',
        'privacy.html',
        'LICENSE.txt',
        'fonts/OFL.txt',
      ])
        assert.ok(files[file], file);
    } else if (name.includes('skill')) {
      for (const file of [
        'm47/SKILL.md',
        'm47/LICENSE',
        'm47/core/index.js',
        'm47/cli/index.js',
        'm47/reference/tokens.json',
        'm47/reference/control-groups.css',
        'm47/reference/control-groups.md',
        'm47/reference/demos/google.html',
        'm47/reference/demos/youtube.html',
        'm47/reference/demos/youtube.js',
        'm47/reference/demos/screensaver.html',
        'm47/core/screensaver.js',
        'm47/reference/demos/fonts/OFL.txt',
      ])
        assert.ok(files[file], file);
    } else {
      assert.ok(files.LICENSE);
      assert.ok(files.NOTICE);
      assert.ok(files['PRIVACY.md']);
      const manifest = JSON.parse(strFromU8(files['manifest.json']));
      assert.equal(manifest.version, '0.2.0');
      if (name.includes('newtab')) {
        assert.equal(manifest.permissions, undefined);
        assert.equal(manifest.host_permissions, undefined);
      }
      if (name.endsWith('-firefox.zip') && !name.includes('theme'))
        assert.deepEqual(
          manifest.browser_specific_settings.gecko.data_collection_permissions.required,
          ['none'],
        );
    }
  }
});
