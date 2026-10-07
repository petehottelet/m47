import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const tokens = JSON.parse(await readFile(new URL('core/tokens.json', root), 'utf8'));
const color = Object.fromEntries(
  Object.entries(tokens.color).map(([name, token]) => [name, token.$value]),
);
const rail = Number.parseInt(tokens.geometry.rail.$value, 10);
const gap = Number.parseInt(tokens.geometry.gap.$value, 10);
const output = new URL('docs/assets/', root);
await mkdir(output, { recursive: true });

// Outline the bundled Antonio font so GitHub needs no external fonts or services.
async function artwork(name, width, height, label, content) {
  const svg = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g font-family="Antonio" font-weight="500">${content}</g>
    </svg>`,
    {
      font: {
        loadSystemFonts: false,
        fontFiles: [fileURLToPath(new URL('extension/fonts/Antonio.ttf', root))],
      },
    },
  );
  const escapedLabel = label.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  const outlined = svg
    .toString()
    .replace('<svg ', '<svg role="img" aria-labelledby="title" ')
    .replace(/(<svg[^>]*>)/, `$1<title id="title">${escapedLabel}</title>`);
  await writeFile(new URL(name, output), outlined);
}

await artwork(
  'm47-title.svg',
  960,
  336,
  'M47: An LCARS-style design skill for Claude and Codex',
  `<rect width="960" height="336" fill="${color.ground}"/>
   <path d="M112 16H660V40H112A32 32 0 0 0 ${16 + rail} 72V112H16A96 96 0 0 1 112 16Z" fill="${color.structure}"/>
   <rect x="${660 + gap}" y="16" width="149" height="24" fill="${color.interactive}"/>
   <path d="M815 16H932A12 12 0 0 1 932 40H815Z" fill="${color.secondary}"/>
   <rect x="16" y="${112 + gap}" width="${rail}" height="70" fill="${color.interactive}"/>
   <rect x="16" y="${185 + gap}" width="${rail}" height="45" fill="${color.data}"/>
   <text x="108" y="274" font-size="222" fill="${color.bright}">M47:</text>
   <text x="500" y="121" font-size="46" fill="${color.structure}">AN LCARS-STYLE</text>
   <text x="500" y="189" font-size="62" fill="${color.structure}">DESIGN SKILL</text>
   <text x="500" y="260" font-size="34" fill="${color.data}">FOR CLAUDE AND CODEX</text>
   <path d="M16 ${233 + gap}H${16 + rail}V276A20 20 0 0 0 100 296H532V320H100A84 84 0 0 1 16 236Z" fill="${color.structure}"/>
   <rect x="${532 + gap}" y="296" width="149" height="24" fill="${color.interactive}"/>
   <path d="M687 296H932A12 12 0 0 1 932 320H687Z" fill="${color.secondary}"/>`,
);

// Compact section titles keep the display face readable on narrow README views.
for (const [name, label, end] of [
  ['motion', 'SEE M47 IN MOTION', 266],
  ['surfaces', 'CHOOSE YOUR SURFACE', 298],
  ['start', 'START HERE', 170],
  ['engine', 'ENGINE & CLI', 192],
  ['browser', 'BROWSER BUILDS', 234],
  ['skill', 'AGENT SKILL', 178],
  ['validate', 'VALIDATE & RELEASE', 280],
  ['credits', 'CREDITS & LICENSE', 264],
]) {
  await artwork(
    `section-${name}.svg`,
    480,
    56,
    label,
    `<rect width="480" height="56" fill="${color.ground}"/>
     <path d="M24 4H${end}V10H24A8 8 0 0 0 16 18V40H0V28A24 24 0 0 1 24 4Z" fill="${color.structure}"/>
     <text x="32" y="42" font-size="30" fill="${color.secondary}">${label.replaceAll('&', '&amp;')}</text>
     <rect x="${end + gap}" y="4" width="48" height="6" fill="${color.interactive}"/>
     <path d="M${end + 54} 4H477A3 3 0 0 1 477 10H${end + 54}Z" fill="${color.data}"/>
     <path d="M0 43H16V48A8 8 0 0 1 0 48Z" fill="${color.interactive}"/>`,
  );
}

for (const [name, label, value, fill, width, split] of [
  ['license', 'LICENSE', pkg.license, color.structure, 106, 66],
  ['version', 'VERSION', pkg.version, color.interactive, 124, 70],
  ['node', 'NODE', pkg.engines.node.replace('>=', '') + '+', color.data, 96, 54],
]) {
  await artwork(
    `badge-${name}.svg`,
    width,
    30,
    `${label}: ${value}`,
    `<rect width="${width}" height="30" rx="15" fill="${fill}"/>
     <path d="M${split} 0V30" stroke="${color.ground}" stroke-width="3"/>
     <text x="${split / 2}" y="21" text-anchor="middle" font-size="15" fill="${color.ground}">${label}</text>
     <text x="${(split + width) / 2}" y="21" text-anchor="middle" font-size="15" fill="${color.ground}">${value}</text>`,
  );
}
console.log('Updated README masthead, section titles, and badges.');
