#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  render,
  renderSVG,
  themeCSS,
  checkHTML,
  validateSpec,
  solve,
  VERSION,
} from '../core/index.js';
import { extractSpec } from '../core/extract.js';

const help = `M47 ${VERSION} — original retro terminal layouts

  m47 generate --spec panel.json --size 1280x800 --out panel.html
  m47 generate --title "Station 47" --content notes.md --out panel.svg
  m47 generate --from-html article.html --out reader.html
  m47 check panel.html

Options: --spec FILE, --title TEXT, --content FILE, --from-html FILE,
         --size WxH, --seed TEXT, --scheme tng-default|tng-early|red-alert,
         --density comfortable|compact, --out FILE (.html/.svg/.png/.css),
         --force (replace an existing output), --help, --version

All input is local. HTML embeds the font and scrolls for long content.
SVG/PNG require enough canvas space; an error suggests a larger height.
The check command is a static subset of the conformance rubric.
`;
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: Object.fromEntries(
      ['spec', 'title', 'content', 'from-html', 'size', 'seed', 'scheme', 'density', 'out']
        .map((k) => [k, { type: 'string' }])
        .concat(['help', 'version', 'force'].map((k) => [k, { type: 'boolean' }])),
    ),
  });
  if (values.version) return console.log(VERSION);
  const [command, file] = positionals;
  if (values.help || !command) return console.log(help);
  if (command === 'check') {
    if (!file) throw new Error('Supply an HTML file to check.');
    const issues = checkHTML(await readFile(file, 'utf8'));
    console.log(
      issues.length
        ? JSON.stringify(issues, null, 2)
        : 'PASS: static conformance checks. Visual and behavioral review still required.',
    );
    if (issues.length) process.exitCode = 1;
    return;
  }
  if (command !== 'generate') throw new Error(`Unknown command: ${command}. Use --help.`);
  if (positionals.length > 1)
    throw new Error('Unexpected positional argument. Use --spec or --content.');
  if ([values.spec, values.content, values['from-html']].filter(Boolean).length > 1)
    throw new Error('Choose one input: --spec, --content, or --from-html.');
  let spec = {
    title: values.title ?? 'STATION 47',
    subtitle: 'Generated locally with M47',
    sections: [],
  };
  if (values.spec) spec = JSON.parse(await readFile(values.spec, 'utf8'));
  if (values.content)
    spec.sections = [
      { type: 'text', title: 'Notes', text: await readFile(values.content, 'utf8') },
    ];
  if (values['from-html']) {
    const { parseHTML } = await import('linkedom');
    spec = extractSpec(parseHTML(await readFile(values['from-html'], 'utf8')).document);
  }
  if (values.title) spec.title = values.title;
  spec = validateSpec(spec);
  const size = /^(\d+)x(\d+)$/i.exec(values.size ?? '1280x800');
  if (!size) throw new Error('Use --size WIDTHxHEIGHT, for example 1280x800.');
  const fontPath = fileURLToPath(new URL('../extension/fonts/Antonio.ttf', import.meta.url));
  const fontData = 'data:font/ttf;base64,' + (await readFile(fontPath)).toString('base64');
  const options = {
    width: +size[1],
    height: +size[2],
    seed: values.seed,
    scheme: values.scheme,
    density: values.density,
    fontData,
  };
  solve(spec, options);
  const out = resolve(values.out ?? 'm47.html'),
    format = extname(out).toLowerCase();
  let result;
  if (format === '.html') result = render(spec, options);
  else if (format === '.svg') result = renderSVG(spec, options);
  else if (format === '.css') result = themeCSS(options.scheme);
  else if (format === '.png') {
    const { Resvg } = await import('@resvg/resvg-js');
    result = new Resvg(renderSVG(spec, options), {
      font: { fontFiles: [fontPath], loadSystemFonts: false, defaultFontFamily: 'Antonio' },
    })
      .render()
      .asPng();
  } else throw new Error('Output must end in .html, .svg, .png, or .css.');
  await writeFile(out, result, { flag: values.force ? 'w' : 'wx' });
  console.log(`Created ${out}`);
}
main().catch((error) => {
  console.error(`M47: ${error.message}`);
  process.exitCode = 1;
});
