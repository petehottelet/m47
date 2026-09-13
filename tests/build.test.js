import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';
test('release archives contain legal files, expected permissions and valid checksums', async (t) => {
  let archives;
  try {
    archives = (await readdir('dist')).filter(
      (x) => x.endsWith('.zip') && !x.endsWith('-source.zip'),
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
      for (const file of ['index.html', 'app.js', 'privacy.html', 'LICENSE.txt', 'fonts/OFL.txt'])
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
