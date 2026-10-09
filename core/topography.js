import { random, escape } from './index.js';

export const topographyStyles = [
  {
    id: 'survey',
    name: 'Survey contours',
    description: 'Fine amber isolines, bold index contours, rolling highlands.',
    color: '#FFCC66',
    levels: 24,
  },
  {
    id: 'abyssal',
    name: 'Abyssal depths',
    description: 'Blue depth contours around an elongated ocean trench.',
    color: '#99CCFF',
    levels: 28,
  },
  {
    id: 'volcanic',
    name: 'Volcanic relief',
    description: 'Coral slopes and pale summit contours around a broken caldera.',
    color: '#FF9966',
    levels: 26,
  },
  {
    id: 'glacial',
    name: 'Glacial valleys',
    description: 'Lavender contour bundles cut by broad, branching valleys.',
    color: '#CC99CC',
    levels: 22,
  },
  {
    id: 'dunes',
    name: 'Dune field',
    description: 'Long gold ridgelines with alternating fine and heavy contours.',
    color: '#FFFF99',
    levels: 24,
  },
];

function field(style, seed) {
  const rng = random(String(seed).slice(0, 100));
  const phase = rng() * Math.PI * 2;
  const peaks = Array.from({ length: 11 }, () => [
    rng() * 4 - 0.3,
    rng() * 2.8 - 0.3,
    0.2 + rng() * 0.5,
    0.4 + rng(),
  ]);
  return (x, y) => {
    const u = x + 0.13 * Math.sin(y * 4 + phase) + 0.06 * Math.cos(x * 5 - y * 3);
    const v = y + 0.12 * Math.sin(x * 3 - phase) + 0.05 * Math.cos(y * 7 + x);
    const rolling = peaks.reduce(
      (sum, [px, py, size, amp]) =>
        sum + amp * Math.exp(-((u - px) ** 2 + (v - py) ** 2) / size ** 2),
      0,
    );
    if (style === 'abyssal')
      return (
        1.5 -
        1.7 * Math.exp(-(((v - 1.05 - 0.38 * Math.sin(u * 1.7 + phase)) / 0.36) ** 2)) +
        rolling * 0.38
      );
    if (style === 'volcanic') {
      const radius = Math.hypot((u - 1.75) * 0.9, v - 1.08);
      return (
        1.8 * Math.exp(-(((radius - 0.57) / 0.34) ** 2)) +
        rolling * 0.42 +
        0.1 * Math.sin(u * 6 + v * 5)
      );
    }
    if (style === 'glacial')
      return rolling * 0.4 + 0.8 * Math.sin(u * 3.1 + v * 2.1) + 0.32 * Math.cos(v * 5 - u * 1.6);
    if (style === 'dunes')
      return (
        Math.sin(v * 8 + u * 1.4 + 0.7 * Math.sin(u * 2 + phase)) +
        0.32 * Math.cos(u * 3 - v) +
        rolling * 0.16
      );
    return rolling + 0.2 * Math.sin(u * 3 + v * 4 + phase);
  };
}

// Marching squares joins shared grid-edge intersections into continuous isolines.
// Saddle cells use the bilinear determinant rather than crossing their contours.
function isolines(values, nx, ny, level, width, height) {
  const nodes = new Map();
  const segments = [];
  const edge = (x, y, axis) => {
    const id = `${axis}:${x}:${y}`;
    if (!nodes.has(id)) {
      const a = values[y * (nx + 1) + x];
      const b = values[(y + (axis === 'v' ? 1 : 0)) * (nx + 1) + x + (axis === 'h' ? 1 : 0)];
      const t = (level - a) / (b - a);
      nodes.set(id, {
        x: ((x + (axis === 'h' ? t : 0)) / nx) * width,
        y: ((y + (axis === 'v' ? t : 0)) / ny) * height,
        links: [],
      });
    }
    return id;
  };
  const connect = (a, b) => {
    const index = segments.length;
    segments.push([a, b]);
    nodes.get(a).links.push(index);
    nodes.get(b).links.push(index);
  };
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++) {
      const a = values[y * (nx + 1) + x],
        b = values[y * (nx + 1) + x + 1],
        c = values[(y + 1) * (nx + 1) + x + 1],
        d = values[(y + 1) * (nx + 1) + x];
      const crossing = [];
      if (a > level !== b > level) crossing.push(edge(x, y, 'h'));
      if (b > level !== c > level) crossing.push(edge(x + 1, y, 'v'));
      if (d > level !== c > level) crossing.push(edge(x, y + 1, 'h'));
      if (a > level !== d > level) crossing.push(edge(x, y, 'v'));
      if (crossing.length === 2) connect(...crossing);
      else if (crossing.length === 4) {
        const pairs =
          (a - level) * (c - level) - (b - level) * (d - level) > 0
            ? [
                [0, 1],
                [2, 3],
              ]
            : [
                [0, 3],
                [1, 2],
              ];
        for (const [i, j] of pairs) connect(crossing[i], crossing[j]);
      }
    }
  const used = new Set(),
    paths = [];
  function trace(start) {
    let id = start;
    const points = [];
    while (true) {
      const node = nodes.get(id);
      points.push([node.x, node.y]);
      const next = node.links.find((i) => !used.has(i));
      if (next === undefined) break;
      used.add(next);
      id = segments[next].find((key) => key !== id);
      if (id === start) break;
    }
    if (points.length > 1) paths.push({ points, closed: id === start });
  }
  for (const [id, node] of nodes)
    if (node.links.length === 1 && !used.has(node.links[0])) trace(id);
  for (const [i, [id]] of segments.entries()) if (!used.has(i)) trace(id);
  return paths;
}

const cache = new Map();
export function createTopography({
  style = 'survey',
  seed = '47',
  width = 960,
  height = 540,
} = {}) {
  const preset = topographyStyles.find((item) => item.id === style);
  if (!preset) throw new Error('Unknown topography style.');
  if (![width, height].every((n) => Number.isFinite(n) && n >= 100 && n <= 4096))
    throw new Error('Topography dimensions must be between 100 and 4096.');
  const key = JSON.stringify([style, String(seed).slice(0, 100), width, height]);
  if (cache.has(key)) return cache.get(key);
  const nx = 160,
    ny = 100,
    sample = field(style, seed);
  const values = [];
  for (let y = 0; y <= ny; y++)
    for (let x = 0; x <= nx; x++) values.push(sample((x / nx) * 3.4, (y / ny) * 2.1));
  const min = Math.min(...values),
    max = Math.max(...values);
  const contours = Array.from({ length: preset.levels }, (_, index) => {
    const level = min + ((max - min) * (index + 0.6)) / (preset.levels + 0.2);
    const paths = isolines(values, nx, ny, level, width, height);
    const d = paths
      .map(
        ({ points, closed }) =>
          points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('') +
          (closed ? 'Z' : ''),
      )
      .join('');
    const major = index % 4 === 0;
    const color =
      style === 'volcanic'
        ? ['#CC6677', '#FF9966', '#FFCC66', '#FFFF99'][Math.min(3, Math.floor(index / 7))]
        : style === 'abyssal' && major
          ? '#E0ECFF'
          : preset.color;
    return Object.freeze({ d, major, color, index });
  });
  const result = Object.freeze({ style, width, height, contours: Object.freeze(contours) });
  if (cache.size >= 24) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}

export function renderTopography(options = {}) {
  const map = createTopography(options);
  const preset = topographyStyles.find((item) => item.id === map.style);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${map.width} ${map.height}" width="${map.width}" height="${map.height}" role="img" class="topography" data-style="${map.style}"><title>${escape(preset.name)}</title><desc>Procedural terrain illustration. Not a geographic survey.</desc><rect width="100%" height="100%" fill="#000000"/><g fill="none" stroke-linejoin="round" stroke-linecap="round">${map.contours.map((line) => `<path class="contour${line.major ? ' contour-index' : ''}" d="${line.d}" stroke="${line.color}" stroke-width="${line.major ? 2 : 0.9}" opacity="${line.major ? 0.95 : 0.58}"/>`).join('')}</g></svg>`;
}
