import { mkdir, readFile, writeFile, cp, readdir, rm, lstat } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build, transform } from 'esbuild';
import { zipSync } from 'fflate';
import { Resvg } from '@resvg/resvg-js';
import { render, themeCSS, componentCSS, VERSION } from '../core/index.js';
import { examples } from '../core/examples.js';
const root = fileURLToPath(new URL('../', import.meta.url)),
  dist = resolve(root, 'dist');
if (dist !== resolve(root, 'dist') || !dist.startsWith(resolve(root) + sep))
  throw new Error('Unsafe build output directory.');
try {
  if ((await lstat(dist)).isSymbolicLink())
    throw new Error('Refusing to replace a symlinked dist directory.');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
if (pkg.version !== VERSION) throw new Error('Package and engine versions differ.');
if (
  JSON.parse(await readFile(join(root, 'core/font-license.json'), 'utf8')) !==
  (await readFile(join(root, 'extension/fonts/OFL.txt'), 'utf8')).replace(/\r\n/g, '\n')
)
  throw new Error('Embedded font license must match extension/fonts/OFL.txt.');
const write = async (file, data) => {
  await mkdir(resolve(file, '..'), { recursive: true });
  await writeFile(file, data);
};
const copy = async (from, to) => {
  await mkdir(resolve(to, '..'), { recursive: true });
  await cp(join(root, from), to, { recursive: true });
};
const legal = async (dir) => {
  for (const name of ['LICENSE', 'NOTICE', 'PRIVACY.md']) await copy(name, join(dir, name));
};
const bundle = async (entry, outfile, format = 'iife') =>
  build({
    entryPoints: [join(root, entry)],
    outfile,
    bundle: true,
    minify: format === 'esm',
    format,
    target: ['chrome120', 'firefox140'],
    logLevel: 'warning',
    legalComments: 'inline',
  });
const fontData =
  'data:font/ttf;base64,' +
  (await readFile(join(root, 'extension/fonts/Antonio.ttf'))).toString('base64');
async function zipDir(dir, name) {
  const files = {};
  async function walk(folder) {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = join(folder, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile())
        files[relative(dir, file).split(sep).join('/')] = [
          new Uint8Array(await readFile(file)),
          { mtime: new Date(2026, 0, 1, 0, 0, 0) },
        ];
    }
  }
  await walk(dir);
  await writeFile(join(dist, name), zipSync(files, { level: 9 }));
}
const sourceManifest = JSON.parse(await readFile(join(root, 'extension/manifest.json'), 'utf8'));
const manifest = {
  ...sourceManifest,
  version: VERSION,
  minimum_chrome_version: '120',
  description:
    'Restyle webpages as a calm retro terminal. Per-site controls, instant undo, and a local reader. No telemetry.',
  action: { ...sourceManifest.action, default_title: 'M47', default_popup: 'popup/index.html' },
  commands: {
    'cycle-mode': {
      suggested_key: { default: 'Alt+Shift+L' },
      description: 'Cycle M47 mode for this site (full, palette, off)',
    },
  },
};
const chrome = join(dist, 'chrome');
await mkdir(chrome, { recursive: true });
await Promise.all([
  bundle('extension/bg/main.js', join(chrome, 'bg/service_worker.js')),
  bundle('extension/content/swept.js', join(chrome, 'content/swept.js')),
  bundle('extension/popup/main.js', join(chrome, 'popup/popup.js')),
  copy('extension/popup/index.html', join(chrome, 'popup/index.html')),
  copy('extension/popup/popup.css', join(chrome, 'popup/popup.css')),
  copy('extension/fonts', join(chrome, 'fonts')),
  copy('extension/icons', join(chrome, 'icons')),
  legal(chrome),
]);
await write(join(chrome, 'manifest.json'), JSON.stringify(manifest, null, 2));
const firefox = join(dist, 'firefox');
await cp(chrome, firefox, { recursive: true });
const ff = {
  ...manifest,
  background: { scripts: ['bg/service_worker.js'] },
  browser_specific_settings: {
    gecko: {
      id: '{2aa51a3f-289f-5aa5-b8a1-94f7a592eea8}',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    },
    gecko_android: { strict_min_version: '142.0' },
  },
};
delete ff.minimum_chrome_version;
await write(join(firefox, 'manifest.json'), JSON.stringify(ff, null, 2));
for (const browser of ['chrome', 'firefox'])
  await zipDir(join(dist, browser), `m47-v${VERSION}-${browser}.zip`);
const newtab = join(dist, 'newtab-chrome');
await mkdir(newtab, { recursive: true });
await Promise.all([
  bundle('extension/newtab/main.js', join(newtab, 'newtab.js')),
  copy('extension/newtab/index.html', join(newtab, 'index.html')),
  copy('extension/newtab/newtab.css', join(newtab, 'newtab.css')),
  copy('extension/fonts', join(newtab, 'fonts')),
  copy('extension/icons', join(newtab, 'icons')),
  legal(newtab),
]);
const nt = {
  manifest_version: 3,
  name: 'M47 New Tab',
  version: VERSION,
  description: 'A calm retro terminal new tab with a local clock and editable quick links.',
  chrome_url_overrides: { newtab: 'index.html' },
  icons: manifest.icons,
};
await write(join(newtab, 'manifest.json'), JSON.stringify(nt, null, 2));
const ntFirefox = join(dist, 'newtab-firefox');
await cp(newtab, ntFirefox, { recursive: true });
await write(
  join(ntFirefox, 'manifest.json'),
  JSON.stringify(
    {
      ...nt,
      browser_specific_settings: {
        gecko: {
          id: '{aad7bd38-503b-5bdc-9511-ee70b0a68220}',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
        gecko_android: { strict_min_version: '142.0' },
      },
    },
    null,
    2,
  ),
);
for (const browser of ['chrome', 'firefox'])
  await zipDir(join(dist, 'newtab-' + browser), `m47-v${VERSION}-newtab-${browser}.zip`);
for (const browser of ['chrome', 'firefox']) {
  const dir = join(dist, 'theme-' + browser);
  await mkdir(dir, { recursive: true });
  await legal(dir);
  const theme = {
    manifest_version: browser === 'chrome' ? 3 : 2,
    name: 'M47 Warm Terminal Theme',
    version: VERSION,
    description: 'Black ground, warm browser chrome, and lavender highlights.',
    theme:
      browser === 'chrome'
        ? {
            colors: {
              frame: [0, 0, 0],
              toolbar: [255, 153, 102],
              tab_text: [0, 0, 0],
              tab_background_text: [255, 204, 102],
              bookmark_text: [0, 0, 0],
              ntp_background: [0, 0, 0],
              ntp_text: [237, 231, 219],
              button_background: [204, 153, 204],
            },
          }
        : {
            colors: {
              frame: '#000000',
              toolbar: '#FF9966',
              tab_text: '#000000',
              tab_background_text: '#FFCC66',
              toolbar_text: '#000000',
              tab_selected: '#FF9966',
              popup: '#000000',
              popup_text: '#EDE7DB',
              icons: '#000000',
            },
          },
  };
  if (browser === 'firefox')
    theme.browser_specific_settings = { gecko: { id: '{e0f08613-a7c6-5b10-ad67-928b5db03e53}' } };
  await write(join(dir, 'manifest.json'), JSON.stringify(theme, null, 2));
  await zipDir(dir, `m47-v${VERSION}-theme-${browser}.zip`);
}
const skill = join(dist, 'skill', 'm47');
await copy('skill/m47', skill);
await legal(skill);
for (const path of ['core', 'cli', 'extension/fonts', 'package.json', 'package-lock.json'])
  await copy(path, join(skill, path));
await copy('core/tokens.json', join(skill, 'reference/tokens.json'));
await write(
  join(skill, 'reference/theme.css'),
  "@font-face{font-family:Antonio;src:url('../extension/fonts/Antonio.ttf');font-weight:100 700;font-display:swap}" +
    themeCSS(),
);
await write(join(skill, 'reference/components.css'), componentCSS);
for (const [i, e] of examples.entries())
  await write(
    join(skill, 'reference/examples', `${i + 1}.html`),
    render(e.spec, { width: e.width, height: e.height, scheme: e.scheme, fontData }),
  );
const web = join(dist, 'web');
await mkdir(web, { recursive: true });
await Promise.all([
  bundle('web/app.js', join(web, 'app.js'), 'esm'),
  bundle('web/google.js', join(web, 'google.js'), 'esm'),
  bundle('web/youtube.js', join(web, 'youtube.js'), 'esm'),
  bundle('web/screensaver.js', join(web, 'screensaver.js'), 'esm'),
  copy('web/screensaver.html', join(web, 'screensaver.html')),
  copy('web/screensaver.css', join(web, 'screensaver.css')),
  copy('web/youtube.html', join(web, 'youtube.html')),
  copy('web/youtube.css', join(web, 'youtube.css')),
  copy('web/control-groups.css', join(web, 'control-groups.css')),
  copy('web/google.html', join(web, 'google.html')),
  copy('web/google.css', join(web, 'google.css')),
  copy('web/index.html', join(web, 'index.html')),
  copy('web/app.css', join(web, 'app.css')),
  copy('web/guide.html', join(web, 'guide.html')),
  copy('web/privacy.html', join(web, 'privacy.html')),
  copy('extension/fonts', join(web, 'fonts')),
  copy('LICENSE', join(web, 'LICENSE.txt')),
]);
await write(
  join(web, 'app.css'),
  (
    await transform(await readFile(join(root, 'web/app.css'), 'utf8'), {
      loader: 'css',
      minify: true,
    })
  ).code,
);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="80" fill="#000"/><path d="M60 400V160Q60 60 160 60H430V120H180Q130 120 130 170V400Z" fill="#ff9966"/><text x="180" y="364" font-size="230" font-family="Antonio" fill="#ffcc66">47</text></svg>`;
for (const size of [192, 512])
  await writeFile(
    join(web, `icon-${size}.png`),
    new Resvg(icon, {
      fitTo: { mode: 'width', value: size },
      font: { fontFiles: [join(root, 'extension/fonts/Antonio.ttf')], loadSystemFonts: false },
    })
      .render()
      .asPng(),
  );
await cp(join(web, 'icon-192.png'), join(web, 'icon.png'));
await write(
  join(web, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'M47 Interface Workshop',
      short_name: 'M47',
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [192, 512].map((size) => ({
        src: `icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
    },
    null,
    2,
  ),
);
const assets = [
  './',
  'index.html',
  'app.js',
  'app.css',
  'google.html',
  'google.css',
  'google.js',
  'youtube.html',
  'youtube.css',
  'youtube.js',
  'screensaver.html',
  'screensaver.css',
  'screensaver.js',
  'control-groups.css',
  'guide.html',
  'privacy.html',
  'LICENSE.txt',
  'fonts/Antonio.ttf',
  'fonts/OFL.txt',
  'icon.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
];
const webHash = createHash('sha256');
for (const asset of assets.filter((x) => x !== './'))
  webHash.update(await readFile(join(web, asset)));
await write(
  join(web, 'sw.js'),
  `const CACHE='m47-${webHash.digest('hex').slice(0, 12)}';const ASSETS=${JSON.stringify(assets)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('m47-')&&k!==CACHE).map(k=>caches.delete(k))))));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});`,
);
await zipDir(web, `m47-v${VERSION}-website.zip`);
await cp(web, join(skill, 'reference/demos'), { recursive: true });
await write(
  join(skill, 'reference/control-groups.md'),
  (await readFile(join(root, 'docs/CONTROL-GROUPS.md'), 'utf8')).split(
    /\r?\n## Validation and review/,
  )[0] + '\n\nWorking browser examples are included in `reference/demos/` in this skill bundle.\n',
);
await copy('web/control-groups.css', join(skill, 'reference/control-groups.css'));
await zipDir(join(dist, 'skill'), `m47-v${VERSION}-skill.zip`);
await write(join(dist, 'example.json'), JSON.stringify(examples[0].spec, null, 2));
await write(join(dist, 'preview.html'), render(examples[0].spec, { fontData }));
const archives = (await readdir(dist)).filter((f) => f.endsWith('.zip')).sort();
const sums = await Promise.all(
  archives.map(
    async (file) =>
      `${createHash('sha256')
        .update(await readFile(join(dist, file)))
        .digest('hex')}  ${file}`,
  ),
);
await write(join(dist, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
console.log(
  `Built M47 ${VERSION}: ${archives.length} archives, unpacked browser builds, website, skill, and SHA256SUMS.txt.`,
);
