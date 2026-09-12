import source from './tokens.json' with { type: 'json' };
import fontLicense from './font-license.json' with { type: 'json' };
import { componentCSS } from './styles.js';
export { componentCSS };
export const VERSION = '0.2.0';
export const tokens = source;
export const schemes = Object.keys(tokens.schemes);
export const NOTICE =
  'M47 · Original fan-made interface. LCARS created by Michael Okuda. Not affiliated with CBS Studios or Paramount. Antonio font: SIL OFL. Code: MIT.';
export const fontLicenseMarkup = (format = 'html') =>
  format === 'svg'
    ? `<metadata id="m47-font-license">${escape(fontLicense)}</metadata>`
    : `<template id="m47-font-license">${escape(fontLicense)}</template>`;
export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function palette(scheme = 'tng-default') {
  if (!schemes.includes(scheme)) throw new Error(`Unknown scheme: ${scheme}`);
  return {
    ...Object.fromEntries(Object.entries(tokens.color).map(([k, v]) => [k, v.$value])),
    ...tokens.schemes[scheme],
  };
}
export function themeCSS(scheme) {
  return `:root{${Object.entries(palette(scheme))
    .map(([k, v]) => `--m47-${k}:${v}`)
    .join(';')}}`;
}
export function random(seed = '47') {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.codePointAt(0), 16777619) >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function str(value, name, max = 2000) {
  if (typeof value !== 'string' || value.length > max)
    throw new Error(`${name} must be text of at most ${max} characters.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))
    throw new Error(`${name} contains unsupported control characters.`);
  return value;
}
function list(value, name, max) {
  if (!Array.isArray(value) || value.length > max)
    throw new Error(`${name} must be an array of at most ${max} items.`);
  return value;
}
export function validateSpec(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Spec must be a JSON object.');
  const title = str(input.title ?? 'M47 / SYSTEM STATUS', 'title', 120);
  const subtitle = str(input.subtitle ?? 'Original demonstration data', 'subtitle', 300);
  const sections = list(input.sections ?? [], 'sections', 24).map((s, i) => {
    if (!s || typeof s !== 'object') throw new Error(`Section ${i + 1} must be an object.`);
    const title = str(s.title ?? `Section ${i + 1}`, 'section title', 100);
    const type = s.type ?? 'text';
    if (type === 'text') return { type, title, text: str(s.text ?? '', 'section text', 50000) };
    if (type === 'metrics' || type === 'bars')
      return {
        type,
        title,
        items: list(s.items ?? [], 'items', 24).map((item) => {
          if (!item || typeof item !== 'object') throw new Error('Each item must be an object.');
          const label = str(item.label, 'item label', 80);
          if (type === 'bars') {
            if (
              typeof item.value !== 'number' ||
              !Number.isFinite(item.value) ||
              item.value < 0 ||
              item.value > 100
            )
              throw new Error('Bar values must be numbers from 0 to 100.');
            return { label, value: item.value };
          }
          return { label, value: str(String(item.value ?? ''), 'metric value', 80) };
        }),
      };
    if (type === 'table') {
      const columns = list(s.columns, 'columns', 8).map((c) => str(c, 'column', 80));
      if (!columns.length) throw new Error('A table needs at least one column.');
      const rows = list(s.rows ?? [], 'rows', 100).map((row) => {
        if (!Array.isArray(row) || row.length !== columns.length)
          throw new Error('Every row must match the table column count.');
        return row.map((c) => str(String(c), 'cell', 300));
      });
      return { type, title, columns, rows };
    }
    throw new Error(`Unsupported section type: ${type}`);
  });
  return { title, subtitle, sections };
}
export function solve(input = {}, options = {}) {
  const spec = validateSpec(input);
  const width = Number(options.width ?? 1280),
    height = Number(options.height ?? 800);
  if (![width, height].every((n) => Number.isInteger(n) && n >= 170 && n <= 4096) || width < 320)
    throw new Error('Size must be integer pixels: width 320–4096, height 170–4096.');
  const scheme = options.scheme ?? 'tng-default';
  const colors = palette(scheme);
  const density = options.density ?? 'comfortable';
  if (!['comfortable', 'compact'].includes(density))
    throw new Error('Density must be comfortable or compact.');
  const seed = str(String(options.seed ?? '47'), 'seed', 100);
  const rng = random(seed);
  const topology =
    height <= 240
      ? 'strip'
      : width < 600 || height > width * 1.2
        ? 'portrait'
        : width / height > 2.4
          ? 'wide'
          : 'desktop';
  return {
    spec,
    width,
    height,
    scheme,
    colors,
    density,
    seed,
    topology,
    codes: Array.from(
      { length: 6 },
      (_, i) =>
        `${i === 0 ? '47' : String(Math.floor(rng() * 99)).padStart(2, '0')}-${String(Math.floor(rng() * 9999)).padStart(4, '0')}`,
    ),
  };
}
function sectionHTML(s, i) {
  let body;
  if (s.type === 'text')
    body = s.text
      .split(/\n\s*\n/)
      .map((p) => `<p>${escape(p)}</p>`)
      .join('');
  if (s.type === 'metrics')
    body = `<dl class="metrics">${s.items.map((x) => `<div><dt>${escape(x.label)}</dt><dd>${escape(x.value)}</dd></div>`).join('')}</dl>`;
  if (s.type === 'table')
    body = `<div class="table-wrap"><table><thead><tr>${s.columns.map((c) => `<th scope="col">${escape(c)}</th>`).join('')}</tr></thead><tbody>${s.rows.map((row) => `<tr>${row.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if (s.type === 'bars')
    body = `<div class="bars">${s.items.map((x) => `<div class="meter"><span>${escape(x.label)}</span><meter aria-label="${escape(x.label)}" min="0" max="100" value="${x.value}">${x.value}%</meter><span>${x.value}%</span></div>`).join('')}</div>`;
  return `<section id="section-${i}" aria-labelledby="heading-${i}"><h2 id="heading-${i}">${escape(s.title)}</h2>${body}</section>`;
}
export function render(input, options = {}) {
  const m = solve(input, options);
  const font = options.fontData ?? '';
  if (font && !/^data:font\/ttf;base64,[A-Za-z0-9+/=]+$/.test(font))
    throw new Error('fontData must be an embedded TTF data URL.');
  const fontCSS = font
    ? `@font-face{font-family:Antonio;src:url('${font}');font-weight:100 700;font-display:swap}`
    : '';
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="M47 ${VERSION}"><title>${escape(m.spec.title)}</title><style>${fontCSS}${themeCSS(m.scheme)}${componentCSS}</style></head><body>${font ? fontLicenseMarkup() : ''}<div class="m47 ${m.density}" data-topology="${m.topology}"><header aria-hidden="true"><div class="elbow"></div><div class="bar"></div></header><div class="layout"><nav aria-label="Sections">${m.spec.sections
    .slice(0, 6)
    .map(
      (s, i) =>
        `<a href="#section-${i}" aria-label="${escape(s.title)}">${String(i + 1).padStart(2, '0')}</a>`,
    )
    .join(
      '',
    )}<span class="decor" aria-hidden="true">47</span></nav><main><h1>${escape(m.spec.title)}</h1><p>${escape(m.spec.subtitle)}</p>${m.spec.sections.map(sectionHTML).join('')}<footer class="end"><span>${escape(m.codes[0])} / ${escape(m.topology)}</span><span>M47 ${VERSION}</span></footer><p style="font-size:12px;margin-top:24px">${NOTICE}</p></main></div></div></body></html>\n`;
}
export function wrapText(text, width) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (line && line.length + word.length + 1 > width) {
        lines.push(line);
        line = '';
      }
      let rest = word;
      while (rest.length > width) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(rest.slice(0, width));
        rest = rest.slice(width);
      }
      line += (line ? ' ' : '') + rest;
    }
    lines.push(line);
  }
  return lines;
}
export function renderSVG(input, options = {}) {
  const m = solve(input, options),
    p = m.colors,
    { width: w, height: h } = m;
  const small = h <= 240,
    pad = small ? 16 : 28,
    left = m.topology === 'desktop' || m.topology === 'wide' ? 128 : pad;
  const usable = w - left - pad;
  let y = small ? 50 : 98;
  const content = [];
  const text = (value, x, yy, size, color = p.text, weight = 400) =>
    `<text x="${x}" y="${yy}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`;
  const fontSize = small ? 14 : m.density === 'compact' ? 17 : 20;
  const lineHeight = fontSize * 1.45;
  const chars = Math.max(10, Math.floor(usable / (fontSize * 0.65)));
  for (const line of wrapText(
    m.spec.title.toUpperCase(),
    Math.floor(usable / ((small ? 24 : 38) * 0.65)),
  )) {
    content.push(text(line, left, y, small ? 24 : 38, p.bright, 600));
    y += small ? 28 : 44;
  }
  for (const line of wrapText(m.spec.subtitle, chars)) {
    content.push(text(line, left, y, fontSize, p.muted));
    y += lineHeight;
  }
  for (const s of m.spec.sections) {
    y += small ? 8 : 20;
    for (const line of wrapText(s.title.toUpperCase(), chars)) {
      content.push(text(line, left, y, fontSize + 3, p.secondary, 600));
      y += lineHeight;
    }
    let lines = [];
    if (s.type === 'text') lines = wrapText(s.text, chars);
    if (s.type === 'metrics')
      lines = s.items.flatMap((x) => wrapText(`${x.label.toUpperCase()}    ${x.value}`, chars));
    if (s.type === 'table')
      lines = [s.columns.join('  /  '), ...s.rows.map((r) => r.join('  /  '))].flatMap((x) =>
        wrapText(x, chars),
      );
    if (s.type === 'bars')
      for (const x of s.items) {
        content.push('<g class="m47-svg-meter">');
        for (const line of wrapText(`${x.label} / ${x.value}%`, chars)) {
          content.push(text(line, left, y, fontSize, p.data));
          y += lineHeight;
        }
        content.push(
          `<rect x="${left}" y="${y - 3}" width="${usable}" height="8" rx="4" fill="${p.muted}"/><rect x="${left}" y="${y - 3}" width="${(usable * x.value) / 100}" height="8" rx="4" fill="${p.data}"/>`,
        );
        // Leave room for the next label's ascent beneath this meter track.
        y += lineHeight + 14;
        content.push('</g>');
      }
    for (const line of lines) {
      content.push(text(line, left, y, fontSize, s.type === 'text' ? p.text : p.data));
      y += lineHeight;
    }
  }
  if (y > h - 30)
    throw new Error(
      `Content needs more vertical space (${Math.ceil(y + 30)}px). Increase height, use compact density, or export scrolling HTML.`,
    );
  const rail =
    left > pad
      ? `<path d="M 28 65 Q 28 28 65 28 H ${w - pad - 12} Q ${w - pad} 28 ${w - pad} 40 Q ${w - pad} 52 ${w - pad - 12} 52 H 100 Q 88 52 88 64 V ${h - 60} Q 88 ${h - 30} 58 ${h - 30} Q 28 ${h - 30} 28 ${h - 60} Z" fill="${p.structure}"/>${text('47', 42, h - 52, 26, '#000', 700)}`
      : `<rect x="${pad}" y="16" width="${w - pad * 2}" height="${small ? 10 : 18}" rx="${small ? 5 : 9}" fill="${p.structure}"/>`;
  const font = options.fontData ?? '';
  if (font && !/^data:font\/ttf;base64,[A-Za-z0-9+/=]+$/.test(font))
    throw new Error('fontData must be an embedded TTF data URL.');
  const fontStyle = font
    ? `<style>@font-face{font-family:Antonio;src:url('${font}');font-weight:100 700}</style>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">${escape(m.spec.title)}</title><desc id="desc">${escape(NOTICE)}</desc>${font ? fontLicenseMarkup('svg') : ''}${fontStyle}<rect width="${w}" height="${h}" fill="#000000"/><g font-family="Antonio,Arial,sans-serif">${rail}${content.join('')}${text('M47 / ' + m.codes[0], left, h - 12, 12, p.muted)}</g></svg>\n`;
}
export function checkHTML(html) {
  const issues = [];
  if (!/lang=["'][a-z-]+["']/i.test(html))
    issues.push({ rule: 'language', selector: 'html', message: 'Set the document language.' });
  if (!/<main[\s>]/i.test(html))
    issues.push({ rule: 'landmark', selector: 'body', message: 'Provide a main landmark.' });
  if (!/<h1[\s>]/i.test(html))
    issues.push({ rule: 'heading', selector: 'main', message: 'Provide a page heading.' });
  if (!/--m47-ground\s*:\s*#000000/i.test(html))
    issues.push({ rule: 'ground', selector: ':root', message: 'Use the pure black ground token.' });
  if (/linear-gradient\(|radial-gradient\(|box-shadow\s*:\s*(?!none)/i.test(html))
    issues.push({ rule: 'flat', selector: 'style', message: 'Remove gradients and shadows.' });
  if (!/prefers-reduced-motion/.test(html))
    issues.push({ rule: 'motion', selector: 'style', message: 'Respect reduced motion.' });
  return issues;
}
