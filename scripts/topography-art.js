import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { topographyStyles, renderTopography } from '../core/topography.js';

const destination = resolve('dist/topography');
await mkdir(destination, { recursive: true });
const font = { fontFiles: [resolve('extension/fonts/Antonio.ttf')], loadSystemFonts: false };
const sheets = [];
for (const [index, style] of topographyStyles.entries()) {
  const svg = renderTopography({ style: style.id });
  await writeFile(join(destination, `m47-${style.id}.svg`), svg);
  await writeFile(
    join(destination, `m47-${style.id}.png`),
    new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng(),
  );
  const x = index === 0 ? 28 : 28 + ((index - 1) % 2) * 626;
  const y = index === 0 ? 108 : 558 + Math.floor((index - 1) / 2) * 418;
  const w = index === 0 ? 1224 : 598;
  const h = index === 0 ? 370 : 336;
  sheets.push(
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 960 540" preserveAspectRatio="none">${svg.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg><text x="${x}" y="${y + h + 36}" fill="${style.color}" font-size="28">${style.name.toUpperCase()}</text>`,
  );
}
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1440"><rect width="1280" height="1440" fill="#000"/><g font-family="Antonio"><text x="28" y="58" fill="#FFCC66" font-size="38">M47 / TERRAIN ATLAS</text><text x="1252" y="56" text-anchor="end" fill="#B9AE9C" font-size="18">FIVE PROCEDURAL CONTOUR STYLES</text><path d="M28 83H1252" stroke="#FF9966" stroke-width="8"/>${sheets.join('')}<text x="28" y="1410" fill="#B9AE9C" font-size="18">ILLUSTRATIVE TERRAIN / SCALABLE VECTOR MAPS</text></g></svg>`;
await writeFile(
  join(destination, 'm47-topography-styles.png'),
  new Resvg(sheet, { font }).render().asPng(),
);
console.log('Created five SVG maps, five PNG maps, and a comparison sheet in dist/topography.');
