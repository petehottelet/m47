import { random, escape } from './index.js';

export const meshStyles = [
  {
    id: 'alpine',
    name: 'Alpine grid',
    color: '#FFCC66',
    description: 'Angular highlands above a deep, receding survey grid.',
  },
  {
    id: 'tidal',
    name: 'Tidal lattice',
    color: '#99CCFF',
    description: 'Long ocean swells crossing a low, open horizon.',
  },
  {
    id: 'caldera',
    name: 'Caldera mesh',
    color: '#FF9966',
    description: 'Raised crater rims with a recessed volcanic basin.',
  },
  {
    id: 'fault',
    name: 'Fault plane',
    color: '#CC99CC',
    description: 'Offset terraces divided by an oblique geological fault.',
  },
  {
    id: 'dunes',
    name: 'Dune traverse',
    color: '#92C6B0',
    description: 'Wind-shaped crests flowing across a broad desert grid.',
  },
];
export const ridgeStyles = [
  {
    id: 'carrier',
    name: 'Carrier wave',
    color: '#CC99CC',
    description: 'A modulated signal suspended in closely stacked traces.',
  },
  {
    id: 'pulse',
    name: 'Pulse stack',
    color: '#FFCC66',
    description: 'Narrow packets rising through a quiet baseline.',
  },
  {
    id: 'seismic',
    name: 'Seismic ridges',
    color: '#99CCFF',
    description: 'Jagged, layered mountain signatures with hidden-line masking.',
  },
  {
    id: 'harmonic',
    name: 'Harmonic strata',
    color: '#FFFF99',
    description: 'Broad overlapping frequencies forming smooth standing ridges.',
  },
  {
    id: 'interference',
    name: 'Interference field',
    color: '#FF9966',
    description: 'Two signal sources meeting in a shifting beat pattern.',
  },
];

const clamp = (x) => Math.max(0, Math.min(1, x));
const gauss = (x, spread) => Math.exp(-(x * x) / spread);

// A renderer owns its coordinate buffers. Playback is supplied by the host;
// drawing the same time twice holds the geometry, including during pause.
export function createTerrainRenderer({
  family = 'mesh',
  style = 'alpine',
  seed = '47',
  width = 960,
  height = 540,
} = {}) {
  const presets = family === 'mesh' ? meshStyles : family === 'ridges' ? ridgeStyles : [];
  const preset = presets.find((item) => item.id === style);
  if (!preset) throw new Error('Unknown terrain family or style.');
  if (![width, height].every((n) => Number.isFinite(n) && n >= 100 && n <= 4096))
    throw new Error('Terrain dimensions must be between 100 and 4096.');
  const rng = random(String(seed).slice(0, 100));
  const phase = rng() * Math.PI * 2;
  const rows = family === 'mesh' ? 38 : 44,
    columns = family === 'mesh' ? 65 : 161;
  const lines = Array.from({ length: rows + 1 }, () => ({
    points: new Float64Array(columns * 2),
    baseline: 0,
    weight: 1,
    opacity: 1,
  }));
  const terrain = (x, z) => {
    if (style === 'tidal')
      return 0.28 + 0.16 * Math.sin(x * 3 + z * 2 + phase) + 0.09 * Math.cos(z * 4 - x);
    if (style === 'caldera') {
      const r = Math.hypot(x * 0.8, (((z % 4) + 4) % 4) - 2);
      return 0.65 * gauss(r - 0.94, 0.1) + 0.06 * (1 + Math.sin(x * 7 + z * 4));
    }
    if (style === 'fault')
      return clamp(
        0.26 +
          0.2 * Math.tanh((x + Math.sin(z * 1.4 + phase) * 0.7) * 9) +
          0.16 * Math.sin(z * 4) ** 2 +
          0.12 * Math.cos(x * 3 + z) ** 2,
      );
    if (style === 'dunes')
      return (
        0.12 + 0.5 * ((1 + Math.sin(x * 4.5 + z * 2.7 + 0.65 * Math.sin(z * 2 + phase))) / 2) ** 2
      );
    const a = Math.sin(x * 2.6 + z * 1.8 + phase),
      b = Math.sin(x * 5.5 - z * 3.2),
      c = Math.cos(x * 9 + z * 6);
    return clamp(
      (0.56 * (1 - Math.abs(a)) ** 1.5 + 0.26 * (1 - Math.abs(b)) + 0.12 * (1 - Math.abs(c))) *
        (0.55 + 0.45 * Math.cos(z * 1.2) ** 2),
    );
  };
  const signal = (x, z, time) => {
    const u = x * 2.4,
      phaseT = time * 0.7 + phase;
    if (style === 'pulse')
      return Math.max(
        ...[-1.8, -0.1, 1.5].map(
          (center, i) =>
            gauss(
              u - center - 0.22 * Math.sin(z * 4 + phaseT + i),
              0.035 + 0.025 * (1 + Math.sin(z * 3 + i)),
            ) *
            (0.45 + 0.4 * Math.cos(z * 3 + i) ** 2),
        ),
      );
    if (style === 'seismic')
      return clamp(
        (1 - Math.abs(Math.sin(u * 2 + z * 4 + phaseT * 0.35))) ** 2 * 0.5 +
          0.25 * (1 - Math.abs(Math.sin(u * 7 - z * 5 + phaseT))) +
          0.12 * Math.sin(u * 18 + z * 7) ** 2,
      );
    if (style === 'harmonic')
      return (
        0.12 +
        (0.3 * (1 + Math.sin(u * 2.4 + z * 3 - phaseT))) / 2 +
        (0.4 * (1 + Math.cos(u * 4.5 - z * 2 + phaseT * 0.4))) / 2
      );
    if (style === 'interference')
      return (
        0.12 +
        0.7 *
          ((Math.sin(Math.hypot(u + 1.1, z * 2) * 5 - phaseT) +
            Math.sin(Math.hypot(u - 1.1, z * 2 - 1) * 5 - phaseT)) /
            2) **
            2
      );
    return (
      0.06 +
      gauss(u, 2.5) *
        (0.28 + (0.55 * (1 + Math.sin(u * 7 + z * 5 - phaseT))) / 2) *
        (0.6 + 0.4 * Math.cos(z * 2 + phaseT * 0.3) ** 2)
    );
  };
  const frame = { family, style, width, height, color: preset.color, name: preset.name, lines };
  function sample(time = 0) {
    if (!Number.isFinite(time) || time < 0)
      throw new Error('Playback time must be finite and nonnegative.');
    // Periodic fields stay numerically stable during long ambient sessions.
    const clock = time % 100000;
    const travel = clock * 0.14,
      phaseRow = ((travel * (rows - 1)) / 4) % 1;
    for (let r = 0; r <= rows; r++) {
      const line = lines[r];
      const t = family === 'mesh' ? clamp((r - 1 + phaseRow) / (rows - 1)) : r / rows;
      const q = t / (2.4 - 1.4 * t);
      const amp =
        height *
        (family === 'mesh' ? 0.42 : 0.25) *
        (family === 'mesh' ? 0.1 + 0.9 * q : 0.4 + t * 0.6);
      const baseline =
        family === 'mesh'
          ? height * (0.15 + q * 0.89 + 0.44 * q ** 8)
          : height * (0.11 + 1.15 * t ** 1.3);
      const span = width * (family === 'mesh' ? 1.06 + q * 1.44 : 1.01);
      line.baseline = baseline + 3;
      line.opacity = 0.32 + 0.68 * Math.sqrt(t);
      line.weight = 0.7 + t * 0.8;
      for (let c = 0; c < columns; c++) {
        const x = (c / (columns - 1)) * 2 - 1;
        line.points[c * 2] = width / 2 + (x * span) / 2;
        line.points[c * 2 + 1] =
          baseline -
          amp * (family === 'mesh' ? terrain(x * 2, t * 4 - travel) : signal(x, t, clock));
      }
    }
    return frame;
  }
  return { sample };
}

export function drawTerrain(context, frame) {
  const { width, height, lines, color, family } = frame;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000000';
  context.fillRect(0, 0, width, height);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  let previous;
  for (const line of lines) {
    const p = line.points;
    context.globalAlpha = 1;
    context.beginPath();
    context.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) context.lineTo(p[i], p[i + 1]);
    context.lineTo(p[p.length - 2], line.baseline);
    context.lineTo(p[0], line.baseline);
    context.closePath();
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = line.weight;
    if (family === 'mesh' && previous) {
      context.globalAlpha = line.opacity * 0.55;
      context.beginPath();
      for (let i = 0; i < p.length; i += 2) {
        context.moveTo(previous[i], previous[i + 1]);
        context.lineTo(p[i], p[i + 1]);
      }
      context.stroke();
    }
    context.globalAlpha = line.opacity;
    context.beginPath();
    context.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) context.lineTo(p[i], p[i + 1]);
    context.stroke();
    previous = p;
  }
  context.globalAlpha = 1;
}

export function renderTerrain(options = {}) {
  const frame = createTerrainRenderer(options).sample(options.time ?? 0);
  let previous;
  const paths = frame.lines
    .map((line) => {
      const p = line.points;
      let trace = '';
      for (let i = 0; i < p.length; i += 2)
        trace += `${i ? 'L' : 'M'}${p[i].toFixed(2)} ${p[i + 1].toFixed(2)}`;
      const mask = `${trace}L${p[p.length - 2].toFixed(2)} ${line.baseline.toFixed(2)}H${p[0].toFixed(2)}Z`;
      let columns = '';
      if (frame.family === 'mesh' && previous)
        for (let i = 0; i < p.length; i += 2)
          columns += `M${previous[i].toFixed(2)} ${previous[i + 1].toFixed(2)}L${p[i].toFixed(2)} ${p[i + 1].toFixed(2)}`;
      previous = p;
      return `<path d="${mask}" fill="#000000"/><g fill="none" stroke="${frame.color}" stroke-width="${line.weight.toFixed(2)}"><path d="${columns}" opacity="${(line.opacity * 0.55).toFixed(2)}"/><path d="${trace}" opacity="${line.opacity.toFixed(2)}"/></g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}" role="img"><title>${escape(frame.name)}</title><desc>Procedural ${frame.family === 'mesh' ? 'perspective mesh' : 'oscilloscope ridge'} illustration. Simulated data.</desc><rect width="100%" height="100%" fill="#000000"/><g stroke-linejoin="round" stroke-linecap="round">${paths}</g></svg>`;
}
