import { mkdir, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { unzipSync, zipSync } from 'fflate';

if (process.platform !== 'win32')
  throw new Error(
    'The native screensaver build requires Windows. The browser screensaver builds on every platform.',
  );
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const destination = join(dist, 'screensaver-windows-x64');
const version = '1.0.3595.46';
const hash = 'f448c20859199ecd846a7d693710d143a8cd019ad1dcdc4cd6332d842d871054';
const cache = join(root, 'node_modules/.cache/m47/webview2.nupkg');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
await readFile(join(dist, 'web/screensaver.js')).catch(() => {
  throw new Error('Run npm run build before building the native screensaver.');
});
let bytes;
try {
  bytes = await readFile(cache);
} catch {
  /* Download a pinned official dependency on first build. */
}
if (!bytes || digest(bytes) !== hash) {
  const response = await fetch(
    `https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/${version}/microsoft.web.webview2.${version}.nupkg`,
  );
  if (!response.ok) throw new Error('Could not download the official WebView2 SDK package.');
  bytes = new Uint8Array(await response.arrayBuffer());
  if (digest(bytes) !== hash) throw new Error('WebView2 package checksum mismatch.');
  await mkdir(resolve(cache, '..'), { recursive: true });
  await writeFile(cache, bytes);
}
const sdk = unzipSync(bytes);
await mkdir(join(destination, 'web/fonts'), { recursive: true });
for (const [source, name] of [
  ['lib/net462/Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.Core.dll'],
  ['lib/net462/Microsoft.Web.WebView2.WinForms.dll', 'Microsoft.Web.WebView2.WinForms.dll'],
  ['runtimes/win-x64/native/WebView2Loader.dll', 'WebView2Loader.dll'],
  ['LICENSE.txt', 'WebView2-LICENSE.txt'],
  ['NOTICE.txt', 'WebView2-NOTICE.txt'],
])
  await writeFile(join(destination, name), sdk[source]);
for (const name of [
  'screensaver.html',
  'screensaver.js',
  'screensaver.css',
  'icon.png',
  'fonts/Antonio.ttf',
  'fonts/OFL.txt',
])
  await cp(join(dist, 'web', name), join(destination, 'web', name));
for (const name of ['LICENSE', 'NOTICE', 'PRIVACY.md'])
  await cp(join(root, name), join(destination, name));
await cp(join(root, 'docs/SCREENSAVER.md'), join(destination, 'README.md'));
const compiler = join(
  process.env.WINDIR || 'C:/Windows',
  'Microsoft.NET/Framework64/v4.0.30319/csc.exe',
);
const result = spawnSync(
  compiler,
  [
    '/nologo',
    '/target:winexe',
    '/platform:x64',
    '/optimize+',
    '/debug-',
    `/out:${join(destination, 'M47.scr')}`,
    '/r:System.dll',
    '/r:System.Core.dll',
    '/r:System.Drawing.dll',
    '/r:System.Windows.Forms.dll',
    `/r:${join(destination, 'Microsoft.Web.WebView2.Core.dll')}`,
    `/r:${join(destination, 'Microsoft.Web.WebView2.WinForms.dll')}`,
    join(root, 'screensaver/windows/Program.cs'),
  ],
  { encoding: 'utf8', windowsHide: true },
);
if (result.status !== 0) {
  // Compiler diagnostics can contain local paths; only emit repository-relative locations.
  console.error(
    (result.stdout + result.stderr)
      .replaceAll(root, '')
      .replaceAll(destination, 'screensaver-windows-x64'),
  );
  throw new Error('Windows screensaver compilation failed.');
}
const files = {};
await cp(join(destination, 'M47.scr'), join(destination, 'M47-preview.exe'));
async function archive(folder, prefix = '') {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name),
      name = prefix + entry.name;
    if (entry.isDirectory()) await archive(file, name + '/');
    else files[name] = [new Uint8Array(await readFile(file)), { mtime: new Date(2026, 0, 1) }];
  }
}
await archive(destination);
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const name = `m47-v${pkg.version}-screensaver-windows-x64.zip`;
await writeFile(join(dist, name), zipSync(files, { level: 9 }));
await mkdir(join(dist, 'web/downloads'), { recursive: true });
await cp(join(dist, name), join(dist, 'web/downloads', name));
const archives = (await readdir(dist)).filter((f) => f.endsWith('.zip')).sort();
await writeFile(
  join(dist, 'SHA256SUMS.txt'),
  (
    await Promise.all(
      archives.map(async (file) => `${digest(await readFile(join(dist, file)))}  ${file}`),
    )
  ).join('\n') + '\n',
);
console.log(
  `Built ${name}. Run M47.scr /c for settings, /s for full screen, or install through Windows Screen Saver Settings.`,
);
