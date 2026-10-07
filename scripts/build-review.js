// Deliberately separate from production builds and the screensaver module graph.
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { build } from 'esbuild';
import { zipSync } from 'fflate';
import { fileURLToPath } from 'node:url';
import { families, references, variantCount } from '../review/catalog.js';
import { screenDivisions } from '../review/layout-catalog.js';
import { renderElement, readyFamilies } from '../review/elements.js';
const output = new URL('../dist/web/element-review/', import.meta.url);
await mkdir(new URL('svg/', output), { recursive: true });
await mkdir(new URL('fonts/', output), { recursive: true });
for (const [source, target] of [
  ['review/index.html', 'index.html'],
  ['review/review.css', 'review.css'],
  ['extension/fonts/Antonio.ttf', 'fonts/Antonio.ttf'],
  ['extension/fonts/OFL.txt', 'fonts/OFL.txt'],
])
  await cp(new URL('../' + source, import.meta.url), new URL(target, output));
await build({
  entryPoints: [fileURLToPath(new URL('../review/review.js', import.meta.url))],
  outfile: fileURLToPath(new URL('review.js', output)),
  bundle: true,
  format: 'esm',
  target: ['chrome120', 'firefox140'],
});
const font = (await readFile(new URL('../extension/fonts/Antonio.ttf', import.meta.url))).toString(
    'base64',
  ),
  zip = {};
for (const f of families)
  if (readyFamilies.has(f.id))
    for (const [i, v] of f.variants.entries()) {
      const svg = renderElement(f.id, i, { font });
      await writeFile(new URL(`svg/${v.id}.svg`, output), svg);
      zip[`${f.id}/${v.id}.svg`] = new TextEncoder().encode(svg);
    }
let md = `# M47 reference and element catalogue\n\nReview only. ${families.length} families, ${variantCount} planned variants; ${readyFamilies.size * 5} rendered. No integration is authorized by a local decision. All example values are synthetic.\n\n## Reference observations\n\n`;
for (const ref of references)
  md += `### ${ref.id}: ${ref.title}\n\n${ref.elements.map((s) => '- ' + s).join('\n')}\n\n`;
md +=
  '## Whole-screen divisions\n\nApproximate visual proportions; overlapping regions represent nested structure. X, Y, width and height are percentages of the reference canvas excluding its outer screenshot border.\n\n';
for (const layout of screenDivisions) {
  md += `### ${layout.ref}: ${layout.name}\n\n| Region | X | Y | W | H |\n|---|---:|---:|---:|---:|\n${layout.divisions.map((row) => '| ' + row.join(' | ') + ' |').join('\n')}\n\n`;
  for (const key of ['hierarchy', 'structure', 'alignment', 'whitespace', 'adaptation'])
    md += `**${key}:** ${layout[key]}\n\n`;
}
md +=
  '## Geometry rules\n\nRadial dividers use a constant linear width across rings; deliberate open sectors remain distinct from dividers. Connection and measurement vectors have solid dots at both terminals. Labels must fit their actual colored shapes, including rounded corners. Adjacent command segments have flat facing edges; round only exposed ends. Nested brackets retain clearance from surrounding rails.\n\n';
md += '## Review specimens\n\n';
for (const f of families)
  md += `### ${f.prefix}: ${f.title}\n\n${f.description} References: ${f.refs.join(', ')}.\n\n${f.variants.map((v) => `- **${v.id} — ${v.name}:** ${v.difference}`).join('\n')}\n\n`;
md +=
  '## Interpretation boundaries\n\nScreenshot borders, transparency checkerboards, watermarks, template credits and stock placeholder text are not component designs. R3 has a metallic material treatment; the flat and metallic appearances are visual skins, not additional geometry families. Only the six-frame R4 GIF provides observed motion; animation on other specimens is a proposed treatment. R6 photographic content is represented with original synthetic vector fields, not copied imagery. Layout alternatives describe screen divisions, not production-responsive behavior already implemented.\n';
await writeFile(new URL('catalog.md', output), md);
await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
await writeFile(new URL('../docs/ELEMENT-CATALOG.md', import.meta.url), md);
zip['CATALOG.md'] = new TextEncoder().encode(md);
zip['OFL.txt'] = await readFile(new URL('../extension/fonts/OFL.txt', import.meta.url));
zip['LICENSE'] = await readFile(new URL('../LICENSE', import.meta.url));
await writeFile(new URL('specimens.zip', output), zipSync(zip, { level: 6 }));
console.log(
  `Review ready: ${readyFamilies.size * 5} / ${variantCount} specimens at /element-review/`,
);
