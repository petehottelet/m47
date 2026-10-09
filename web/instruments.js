import {
  meshStyles,
  ridgeStyles,
  createTerrainRenderer,
  drawTerrain,
  renderTerrain,
} from '../core/terrain.js';
import { topographyStyles, renderTopography } from '../core/topography.js';
import { createScene, renderScene } from '../core/screensaver.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const gallery = document.getElementById('instruments');
const playback = document.getElementById('playback');
const video = document.getElementById('scene-demo');
let paused = reduced.matches,
  time = 0,
  last = 0,
  request = 0;
const visible = new Set(),
  animated = new Map();
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
  },
  { rootMargin: '60px' },
);

const scannerDocument = new DOMParser().parseFromString(
  renderScene(createScene({ layout: 'radial', purpose: 'engineering', scanners: 'classic' }), {
    portrait: true,
  }),
  'image/svg+xml',
);
const scanner = scannerDocument.querySelector('.arc-scanner');
const bounds = scanner.getAttribute('data-bounds');
const [sx, sy, sw, sh] = bounds.split(' ').map(Number);
const scannerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}" viewBox="${bounds}" role="img"><title>Asymmetric arc scanner</title><desc>Seven simulated targets within broken range arcs.</desc><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#000000"/>${scanner.outerHTML}</svg>`;
const mapDocument = new DOMParser().parseFromString(
  renderScene(createScene({ layout: 'radial', purpose: 'navigation' }), { portrait: true }),
  'image/svg+xml',
);
const starMap = mapDocument.querySelector('.stellar-map');
const mapBounds = starMap.getAttribute('data-bounds');
const [mx, my, mw, mh] = mapBounds.split(' ').map(Number);
const starMapSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${mw}" height="${mh}" viewBox="${mapBounds}" role="img"><title>Stellar sector map</title><desc>Simulated star systems and a plotted course.</desc><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="#000000"/>${starMap.outerHTML}</svg>`;
const entries = [
  {
    family: 'scanner',
    id: 'sector',
    name: 'Stellar sector map',
    color: '#99CCFF',
    description: 'Plotted star systems, coordinate references, and a highlighted four-node course.',
  },
  {
    family: 'scanner',
    id: 'arc',
    name: 'Asymmetric arc scanner',
    color: '#FF9966',
    description: 'Broken arc bands, seven bracketed targets, and a filled oscillating sweep.',
  },
  ...meshStyles.map((style) => ({ ...style, family: 'mesh' })),
  ...ridgeStyles.map((style) => ({ ...style, family: 'ridges' })),
  ...topographyStyles.map((style) => ({ ...style, family: 'contour' })),
];
for (const item of entries) {
  const article = document.createElement('article');
  article.dataset.family = item.family;
  article.dataset.style = item.id;
  article.style.setProperty('--map-color', item.color);
  const view = document.createElement('div');
  view.className = 'instrument-view';
  if (item.family === 'scanner') view.innerHTML = item.id === 'sector' ? starMapSVG : scannerSVG;
  else if (item.family === 'contour') view.innerHTML = renderTopography({ style: item.id });
  else {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${item.name}: ${item.description} Simulated data.`);
    const renderer = createTerrainRenderer({ family: item.family, style: item.id });
    const context = canvas.getContext('2d');
    drawTerrain(context, renderer.sample(0));
    animated.set(article, { renderer, context, canvas });
    view.append(canvas);
  }
  article.append(view);
  const caption = document.createElement('div');
  caption.className = 'caption';
  caption.innerHTML = `<h2>${item.name}</h2><p>${item.description}</p><div class="instrument-actions"><button type="button" class="expand" aria-expanded="false">Expand</button><button type="button" class="export">Save SVG</button></div>`;
  caption.querySelector('.expand').addEventListener('click', (event) => {
    const expanded = article.classList.toggle('expanded');
    event.target.setAttribute('aria-expanded', String(expanded));
    event.target.textContent = expanded ? 'Collapse' : 'Expand';
    if (expanded) article.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  const exportButton = caption.querySelector('.export');
  exportButton.setAttribute('aria-label', `Save ${item.name} as SVG`);
  exportButton.addEventListener('click', async () => {
    let svg;
    if (item.family === 'contour') svg = renderTopography({ style: item.id });
    else if (item.family === 'scanner') {
      const font = await fetch('fonts/Antonio.ttf')
        .then((response) => {
          if (!response.ok) throw new Error('Font unavailable');
          return response.arrayBuffer();
        })
        .catch(() => null);
      const encoded = font
        ? btoa(Array.from(new Uint8Array(font), (byte) => String.fromCharCode(byte)).join(''))
        : '';
      const snapshot = view.querySelector('svg').cloneNode(true);
      const sweep = snapshot.querySelector('.arc-sweep');
      if (sweep)
        sweep.style.transform = getComputedStyle(view.querySelector('.arc-sweep')).transform;
      const course = snapshot.querySelector('.stellar-course');
      if (course) {
        course.setAttribute('stroke-dasharray', '12 8');
        course.setAttribute(
          'stroke-dashoffset',
          getComputedStyle(view.querySelector('.stellar-course')).strokeDashoffset,
        );
      }
      svg = snapshot.outerHTML.replace(
        '<title>',
        `<style>${encoded ? `@font-face{font-family:Antonio;src:url(data:font/ttf;base64,${encoded})}` : ''}.arc-scanner{font-family:Antonio,sans-serif}</style><title>`,
      );
    } else
      svg = renderTerrain({
        family: item.family,
        style: item.id,
        time: Number(animated.get(article).canvas.dataset.time || 0),
      });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `m47-${item.family}-${item.id}.svg`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  article.append(caption);
  gallery.append(article);
  observer.observe(article);
}

for (const button of document.querySelectorAll('[data-family]:is(button)'))
  button.addEventListener('click', () => {
    for (const control of document.querySelectorAll('nav button'))
      control.setAttribute('aria-pressed', String(control === button));
    for (const article of gallery.children)
      article.hidden =
        button.dataset.family !== 'all' && button.dataset.family !== article.dataset.family;
    document.getElementById('gallery-status').textContent =
      `${button.textContent} selected. Simulated data; contour maps are static.`;
  });

function loop(now) {
  request = 0;
  if (paused || document.hidden) return;
  if (!last) last = now;
  const elapsed = now - last;
  if (elapsed >= 1000 / 24) {
    time += Math.min(elapsed, 100) / 1000;
    last = now;
    for (const [article, { renderer, context, canvas }] of animated)
      if (visible.has(article) && !article.hidden) {
        drawTerrain(context, renderer.sample(time));
        canvas.dataset.time = time.toFixed(3);
      }
  }
  request = requestAnimationFrame(loop);
}
function motionState() {
  document.body.classList.toggle('gallery-paused', paused);
  document.body.classList.toggle('gallery-hidden', document.hidden);
  playback.textContent = paused ? 'Play motion' : 'Pause motion';
  if (request) cancelAnimationFrame(request);
  request = 0;
  last = 0;
  const demoSource = `gallery-assets/demo-screensaver.${paused || document.hidden || reduced.matches ? 'png' : 'gif'}`;
  if (video.getAttribute('src') !== demoSource) video.src = demoSource;
  if (!paused && !document.hidden) request = requestAnimationFrame(loop);
}
playback.addEventListener('click', () => {
  paused = !paused;
  motionState();
});
document.addEventListener('visibilitychange', motionState);
reduced.addEventListener('change', () => {
  paused = reduced.matches;
  motionState();
});
motionState();
