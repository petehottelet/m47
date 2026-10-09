import { random, escape, palette } from './index.js';
import { operationPurposes, instrumentNames, renderInstrument } from './instruments.js';
import { renderStarMap } from './star-map.js';

export const purposes = [
  {
    id: 'navigation',
    title: 'STELLAR CARTOGRAPHY',
    station: 'Navigation',
    diagram: 'stellar-map',
    channels: ['Deflector', 'Inertial array', 'Course lock', 'Astrometry'],
    metrics: [
      ['Velocity', 0.1, 0.9, 'C'],
      ['Range', 1, 90, 'LY'],
      ['Bearing', 0, 359, 'DEG'],
    ],
    records: ['Helios relay', 'Vega approach', 'Outer marker', 'Survey beacon'],
  },
  {
    id: 'engineering',
    title: 'POWER DISTRIBUTION',
    station: 'Engineering',
    diagram: 'schematic',
    channels: ['Primary core', 'Cooling loop', 'Reserve cells', 'Distribution'],
    metrics: [
      ['Output', 40, 98, 'GW'],
      ['Core temp', 800, 1900, 'K'],
      ['Efficiency', 84, 99, '%'],
    ],
    records: ['Drive assembly', 'Thermal exchange', 'Auxiliary bus', 'Field regulator'],
  },
  {
    id: 'science',
    title: 'SPECTRAL ANALYSIS',
    station: 'Science',
    diagram: 'spectrum',
    channels: ['Visible', 'Infrared', 'Ultraviolet', 'Radio'],
    metrics: [
      ['Peak', 380, 740, 'NM'],
      ['Signal', 20, 60, 'DB'],
      ['Integration', 4, 90, 'S'],
    ],
    records: ['Sample alpha', 'Sample beta', 'Reference cell', 'Dark field'],
  },
  {
    id: 'weather',
    title: 'ATMOSPHERIC SURVEY',
    station: 'Weather',
    diagram: 'grid',
    channels: ['Cloud cover', 'Humidity', 'Sensor array', 'Forecast confidence'],
    metrics: [
      ['Temperature', -12, 34, 'C'],
      ['Pressure', 970, 1040, 'HPA'],
      ['Wind', 2, 42, 'KM/H'],
    ],
    records: ['Northern ridge', 'Coastal basin', 'Upper atmosphere', 'Eastern plateau'],
  },
  {
    id: 'communications',
    title: 'SUBSPACE RELAY',
    station: 'Communications',
    diagram: 'network',
    channels: ['Channel one', 'Channel two', 'Relay capacity', 'Error correction'],
    metrics: [
      ['Bandwidth', 100, 980, 'GB/S'],
      ['Latency', 2, 45, 'MS'],
      ['Signal', 24, 62, 'DB'],
    ],
    records: ['Relay alpha', 'Relay delta', 'Deep array', 'Surface link'],
  },
  {
    id: 'biosphere',
    title: 'BIOSPHERE MONITOR',
    station: 'Life support',
    diagram: 'waveform',
    channels: ['Air exchange', 'Water cycle', 'Habitat capacity', 'Light cycle'],
    metrics: [
      ['Oxygen', 20, 22, '%'],
      ['Temperature', 18, 25, 'C'],
      ['Humidity', 38, 62, '%'],
    ],
    records: ['Habitat ring', 'Greenhouse', 'Water recovery', 'Seed archive'],
  },
  {
    id: 'logistics',
    title: 'CARGO OPERATIONS',
    station: 'Logistics',
    diagram: 'grid',
    channels: ['Bay one', 'Bay two', 'Transit capacity', 'Inventory'],
    metrics: [
      ['Manifest', 100, 940, 'UNITS'],
      ['In transit', 10, 90, 'T'],
      ['Capacity', 42, 88, '%'],
    ],
    records: ['Docking bay', 'Transfer lock', 'Cold storage', 'Outbound queue'],
  },
  {
    id: 'ocean',
    title: 'ABYSSAL TELEMETRY',
    station: 'Ocean survey',
    diagram: 'waveform',
    channels: ['Sonar array', 'Sample storage', 'Dive reserve', 'Pressure housing'],
    metrics: [
      ['Depth', 600, 4800, 'M'],
      ['Temperature', 1, 6, 'C'],
      ['Salinity', 33, 37, 'PSU'],
    ],
    records: ['Trench station', 'Drift sensor', 'Hydrophone', 'Sample collector'],
  },
  {
    id: 'transport',
    title: 'TRANSIT NETWORK',
    station: 'Transport',
    diagram: 'network',
    channels: ['Route alpha', 'Route beta', 'Platform load', 'Fleet reserve'],
    metrics: [
      ['Active vehicles', 12, 64, 'UNITS'],
      ['Headway', 40, 120, 'S'],
      ['Throughput', 800, 2400, '/H'],
    ],
    records: ['Central hub', 'Outer ring', 'Cargo junction', 'Orbital terminal'],
  },
  {
    id: 'observatory',
    title: 'DEEP FIELD OBSERVATORY',
    station: 'Observatory',
    diagram: 'sky',
    channels: ['Optical array', 'Tracking', 'Calibration', 'Archive'],
    metrics: [
      ['Exposure', 12, 180, 'S'],
      ['Seeing', 0.2, 2.0, 'ARCSEC'],
      ['Targets', 4, 40, 'FIELDS'],
    ],
    records: ['Open cluster', 'Nebula field', 'Transit candidate', 'Reference star'],
  },
  {
    id: 'computing',
    title: 'COMPUTER SYSTEMS',
    station: 'Computing',
    diagram: 'schematic',
    channels: ['Compute array', 'Memory', 'Storage', 'Scheduler'],
    metrics: [
      ['Operations', 40, 480, 'TFLOPS'],
      ['Memory', 20, 90, '%'],
      ['Queue', 8, 220, 'JOBS'],
    ],
    records: ['Primary cluster', 'Archive node', 'Sensor processor', 'Simulation bank'],
  },
  {
    id: 'geology',
    title: 'PLANETARY GEOLOGY',
    station: 'Geology',
    diagram: 'spectrum',
    channels: ['Seismic array', 'Mineral survey', 'Core samples', 'Mapping'],
    metrics: [
      ['Depth', 200, 2200, 'M'],
      ['Gradient', 12, 42, 'K/KM'],
      ['Samples', 8, 72, 'CORES'],
    ],
    records: ['Basalt plain', 'Rift margin', 'Crater floor', 'Polar deposit'],
  },
  ...operationPurposes,
];
export const layouts = [
  'survey',
  'analysis',
  'telemetry',
  'split',
  'reactor',
  'archive',
  'radial',
  'bridge',
];
export const paletteNames = {
  warm: 'Warm / classic',
  gold: 'Gold / lavender',
  blue: 'Blue / amber',
  electric: 'Electric / ochre',
  silver: 'Silver / ice',
  violet: 'Violet / coral',
  mineral: 'Mineral / seafoam',
  sunset: 'Sunset / rose',
};
export const saverPalettes = Object.keys(paletteNames);
const accents = {
  blue: ['#99CCFF', '#CC99CC', '#FFCC66', '#99CCFF'],
  electric: ['#E0B52D', '#7197FF', '#83D9F5', '#C3BC64'],
  silver: ['#B8CBD8', '#AFA0F4', '#85C7F2', '#E3C579'],
  violet: ['#EF7975', '#C790F8', '#ACA7FF', '#FFAE89'],
  mineral: ['#92C6B0', '#D8BE91', '#A8D8D2', '#AEB9EA'],
  sunset: ['#EDA06F', '#D995AC', '#F4CE8C', '#C0AAF3'],
};

export function createScene({
  seed = '47',
  index = 0,
  tick = 0,
  purpose = 'shuffle',
  scheme = 'auto',
  layout = 'auto',
  scanners = 'classic',
} = {}) {
  if (!Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(tick) || tick < 0)
    throw new Error('Scene index and tick must be nonnegative integers.');
  const sequence = random(String(seed).slice(0, 100));
  const rotation = Math.floor(sequence() * purposes.length);
  const selected =
    purpose === 'shuffle'
      ? purposes[(rotation + index) % purposes.length]
      : purposes.find((item) => item.id === purpose);
  if (!selected) throw new Error('Unknown screensaver purpose.');
  if (scheme !== 'auto' && !saverPalettes.includes(scheme))
    throw new Error('Unknown screensaver palette.');
  if (layout !== 'auto' && !layouts.includes(layout))
    throw new Error('Unknown screensaver layout.');
  if (!['classic', 'rectangular'].includes(scanners)) throw new Error('Unknown scanner style.');
  const rng = random(`${String(seed).slice(0, 100)}:${index}`);
  const readings = random(`${String(seed).slice(0, 100)}:${index}:${tick}`);
  const between = (min, max) => min + readings() * (max - min);
  const style =
    scheme === 'auto'
      ? saverPalettes[
          (index +
            Math.floor(index / saverPalettes.length) +
            Math.floor(sequence() * saverPalettes.length)) %
            saverPalettes.length
        ]
      : scheme;
  const colors = palette(style === 'gold' ? 'tng-early' : 'tng-default');
  if (accents[style]) {
    const [structure, secondary, data, interactive] = accents[style];
    Object.assign(colors, { structure, secondary, data, interactive });
  }
  return {
    index,
    tick,
    purpose: selected.id,
    title: selected.title,
    station: selected.station,
    diagram: selected.diagram,
    scanners,
    layout:
      layout === 'auto'
        ? layouts[(index + Math.floor(sequence() * layouts.length)) % layouts.length]
        : layout,
    colors,
    scheme: style,
    code: `${String(1 + Math.floor(rng() * 98)).padStart(2, '0')}-${String(1000 + Math.floor(rng() * 9000))}`,
    metrics: selected.metrics.map(([label, min, max, unit]) => ({
      label,
      value: between(min, max).toFixed(max < 100 ? 1 : 0),
      unit,
    })),
    channels: selected.channels.map((label) => ({ label, value: Math.round(between(25, 98)) })),
    records: selected.records.map((label, i) => ({
      label,
      code: `${String(i + 1).padStart(2, '0')}-${Math.floor(between(100, 999))}`,
      state: ['TRACKING', 'NOMINAL', 'SAMPLING', 'READY'][(index + i) % 4],
    })),
    signal: Array.from({ length: 72 }, (_, i) =>
      Math.max(
        0.08,
        Math.min(0.96, 0.38 + Math.sin(i * 0.21 + tick * 0.12) * 0.22 + readings() * 0.28),
      ),
    ),
    nodes: Array.from({ length: 12 }, (_, i) => ({
      x: 0.08 + (i % 4) * 0.24 + rng() * 0.08,
      y: 0.14 + Math.floor(i / 4) * 0.31 + rng() * 0.08,
    })),
    phase: rng() * Math.PI * 2 + tick * 0.06,
    log: [
      `${selected.station.toUpperCase()} / PASS ${String(index + 1).padStart(4, '0')}`,
      'REFERENCE FRAME SYNCHRONIZED',
      `SAMPLE ${String(tick + 1).padStart(4, '0')} / LOCAL SIMULATION`,
    ],
  };
}

export function renderScene(scene, { portrait = false, feed = null } = {}) {
  const c = scene.colors;
  const width = portrait ? 900 : 1440,
    height = portrait ? 1440 : 900;
  const rect = (x, y, w, h, fill, radius = 0) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"/>`;
  const text = (x, y, value, size = 18, fill = c.data, extra = '') =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
  const line = (x1, y1, x2, y2, stroke = c.data, width = 2, extra = '') =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
  const circle = (x, y, r, stroke = c.data, fill = 'none', width = 2) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const heading = (x, y, w, label) =>
    rect(x, y, 8, 24, c.interactive) +
    text(x + 20, y + 20, label, 22, c.interactive) +
    line(x, y + 36, x + w, y + 36, c.interactive, 3);

  function sweepTrail(radius, span = 84) {
    // Overlapping translucent sectors build a smooth angular afterglow without
    // seams, filters, or external images. Only their parent rotates per frame.
    const steps = 48;
    let trail = '',
      previousOpacity = 0;
    for (let i = 0; i < steps; i++) {
      const angle = ((-span * (steps - i)) / steps) * (Math.PI / 180);
      const opacity = 0.38 * ((i + 1) / steps) ** 1.6;
      const layerOpacity = (opacity - previousOpacity) / (1 - previousOpacity);
      const x = (Math.cos(angle) * radius).toFixed(3);
      const y = (Math.sin(angle) * radius).toFixed(3);
      trail += `<path d="M0 0L${x} ${y}A${radius} ${radius} 0 0 1 ${radius} 0Z" opacity="${layerOpacity.toFixed(5)}"/>`;
      previousOpacity = opacity;
    }
    return trail;
  }

  function arcScanner(x, y, w, h) {
    const fieldH = h - 38,
      cx = x + w * 0.29,
      cy = y + fieldH * 0.54,
      rx = w * 0.63,
      ry = fieldH * 0.46;
    const point = (angle, fraction = 1, inset = 0) => {
      const a = (angle * Math.PI) / 180;
      return [
        cx + Math.cos(a) * (rx * fraction - inset),
        cy + Math.sin(a) * (ry * fraction - inset),
      ];
    };
    const arc = (a, b, fraction = 1, inset = 0) =>
      `M${point(a, fraction, inset)}A${rx * fraction - inset} ${ry * fraction - inset} 0 0 1 ${point(b, fraction, inset)}`;
    const band = (a, b, thickness, color) =>
      `<path d="${arc(a, b)}L${point(b, 1, thickness)}A${rx - thickness} ${ry - thickness} 0 0 0 ${point(a, 1, thickness)}Z" fill="${color}" stroke="${c.ground}" stroke-width="3"/>`;
    const curve = (a, b, fraction, color, width = 1) =>
      `<path d="${arc(a, b, fraction)}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
    const bracket = (px, py, size, color) => {
      const edge = size / 2,
        arm = size * 0.3;
      return `<path d="M${px - edge} ${py - edge + arm}v${-arm}h${arm}M${px + edge - arm} ${py - edge}h${arm}v${arm}M${px + edge} ${py + edge - arm}v${arm}h${-arm}M${px - edge + arm} ${py + edge}h${-arm}v${-arm}" fill="none" stroke="${color}" stroke-width="2"/>`;
    };
    let out = `<g class="arc-scanner" data-bounds="${x} ${y} ${w} ${h}">`;
    out += `<g class="arc-envelope" transform="translate(${cx} ${cy}) scale(1 ${ry / rx})"><g class="arc-sweep"><g class="arc-trail" fill="${c.data}">${sweepTrail(rx * 0.87, 26)}</g>${line(0, 0, rx * 0.87, 0, c.bright, 1.5)}</g></g>`;
    out +=
      band(-104, -58, 16, c.structure) +
      band(-58, -24, 16, c.secondary) +
      band(-16, 34, 8, c.interactive) +
      band(42, 70, 16, c.structure);
    out +=
      curve(-96, 63, 0.88, c.interactive) +
      curve(-78, 48, 0.61, c.interactive) +
      curve(-51, 64, 0.33, c.data);
    for (const angle of [-76, -28, 20, 62]) {
      const start = point(angle, 0.15),
        end = point(angle, 0.85);
      out += line(...start, ...end, c.interactive, 1, 'opacity=".28"');
    }
    for (let i = 0; i < 25; i++) {
      const angle = -96 + i * 6.5;
      out += line(...point(angle, 0.92), ...point(angle, 0.92, i % 4 ? 3 : 7), c.data, 1);
    }
    const contacts = [
      [-70, 0.46],
      [-45, 0.78],
      [-22, 0.62],
      [22, 0.74],
      [60, 0.52],
      [14, 0.36],
      [-83, 0.83],
    ];
    contacts.forEach(([bearing, distance], i) => {
      const angle = bearing + (scene.nodes[i].x - 0.5) * 5,
        [px, py] = point(angle, distance),
        selected = i === 2;
      out += `<g class="arc-contact" data-contact="${i + 1}"${selected ? ' data-selected="true"' : ''}>`;
      out += bracket(px, py, selected ? 24 : 12, selected ? c.bright : c.data);
      out += rect(px - 2, py - 2, 4, 4, selected ? c.bright : c.data);
      if (selected) {
        out += `<path d="M${px + 15} ${py + 3}l20 18h${w * 0.15}" fill="none" stroke="${c.secondary}" stroke-width="1"/>`;
        out +=
          text(px + 39, py + 14, 'TRACK 03', portrait ? 28 : 17, c.bright) +
          text(
            px + 39,
            py + (portrait ? 45 : 39),
            `${(distance * 8.4).toFixed(1)} LY`,
            portrait ? 26 : 14,
            c.data,
          );
      }
      out += '</g>';
    });
    out +=
      text(x + 2, y + 60, '047', 48, c.structure) +
      text(
        x + (portrait ? 8 : 2),
        y + (portrait ? 96 : 83),
        'AZIMUTH',
        portrait ? 28 : 14,
        c.interactive,
      ) +
      line(cx - 30, cy, cx - 9, cy, c.secondary, 3) +
      line(cx, cy - 8, cx, cy + 8, c.secondary, 2) +
      line(cx - 8, cy, cx + 8, cy, c.secondary, 2) +
      line(
        x,
        y + h - (portrait ? 42 : 28),
        x + w * 0.37,
        y + h - (portrait ? 42 : 28),
        c.secondary,
        3,
      ) +
      text(
        x + (portrait ? 8 : 0),
        y + h - (portrait ? 8 : 4),
        '07 CONTACTS',
        portrait ? 28 : 17,
        c.secondary,
      ) +
      text(
        x + w - (portrait ? 8 : 2),
        y + h - 6,
        'SECTOR 047 / 8.4 LY',
        portrait ? 26 : 16,
        c.data,
        'text-anchor="end"',
      );
    return out + '</g>';
  }

  function diagram(x, y, w, h, kind = scene.diagram) {
    if (scene.purpose === 'navigation' && ['stellar-map', 'radar', 'course'].includes(kind)) {
      return heading(x, y, w, 'STELLAR SECTOR MAP') + renderStarMap(scene, x, y + 62, w, h - 78);
    }
    if (
      scene.scanners === 'rectangular' &&
      (kind === 'radar' || (kind === 'spectrum' && scene.purpose === 'geology'))
    )
      kind =
        scene.purpose === 'navigation' ? 'course' : scene.purpose === 'geology' ? 'strata' : 'sky';
    if (instrumentNames[kind]) {
      const title = instrumentNames[kind];
      return `<g class="instrument-panel">${rect(x, y, 8, 24, c.interactive)}${text(x + 20, y + 20, title, Math.min(22, (w - 20) / (title.length * 0.55)), c.interactive)}${line(x, y + 36, x + w, y + 36, c.interactive, 3)}${renderInstrument(scene, kind, x, y + 52, w, h - 66)}</g>`;
    }
    let out = heading(
      x,
      y,
      w,
      {
        spectrum: 'FREQUENCY RESPONSE',
        grid: 'SECTOR DISTRIBUTION',
        network: 'RELAY TOPOLOGY',
        waveform: 'CONTINUOUS TELEMETRY',
        schematic: 'SYSTEM ARCHITECTURE',
        radar: 'LONG RANGE SCAN',
        reactor: 'FIELD CONTAINMENT',
      }[kind],
    );
    y += 62;
    h -= 78;
    const cx = x + w / 2,
      cy = y + h / 2;
    if (kind === 'radar') {
      out += arcScanner(x, y, w, h);
    } else if (kind === 'reactor') {
      const rw = Math.min(w * 0.3, 150);
      out += line(cx, y + 8, cx, y + h - 8, c.secondary, 4);
      for (let i = 0; i < 10; i++) {
        const py = y + (i * h) / 10;
        out += `<g class="core-cell" style="--phase:${i * -180}ms">${rect(cx - rw / 2, py, rw, h / 10 - 5, i % 3 ? c.secondary : c.data, 14)}</g>`;
        out +=
          line(x + 12, py + 8, cx - rw / 2 - 10, py + 8, c.interactive, 1) +
          text(x + 12, py + 27, String(100 + Math.round(scene.signal[i] * 800)), 17);
        out += text(cx + rw / 2 + 24, py + 22, `F${String(i + 1).padStart(2, '0')}`, 17);
      }
      out +=
        circle(cx, cy, rw * 0.37, c.ground, c.ground, 7) +
        circle(cx, cy, rw * 0.26, c.bright, c.bright, 2);
    } else if (kind === 'spectrum' || kind === 'waveform') {
      for (let i = 0; i <= 4; i++)
        out += line(x, y + (h * i) / 4, x + w, y + (h * i) / 4, c.data, 1, 'opacity="0.25"');
      if (kind === 'spectrum') {
        const step = w / scene.signal.length;
        scene.signal.forEach((v, i) => {
          out +=
            `<g class="spectrum-bar" style="transform-origin:${x + i * step}px ${y + h}px;--phase:${i * -137}ms">` +
            rect(
              x + i * step,
              y + h * (1 - v),
              Math.max(2, step - 3),
              h * v,
              i % 9 === 0 ? c.secondary : c.data,
            ) +
            '</g>';
        });
      } else {
        for (let band = 0; band < 3; band++) {
          const points = scene.signal
            .map(
              (v, i) =>
                `${x + (i / 71) * w},${y + h * ((band + 0.5) / 3) + Math.sin(i * (0.15 + band * 0.08) + scene.phase) * h * 0.08 + (v - 0.5) * h * 0.09}`,
            )
            .join(' ');
          out += `<polyline class="signal-trace" style="--phase:${band * -900}ms" points="${points}" fill="none" stroke="${[c.data, c.secondary, c.interactive][band]}" stroke-width="3"/>`;
        }
      }
      out +=
        text(x, y + h + 26, '00', 15) +
        text(x + w / 2, y + h + 26, 'SAMPLE WINDOW', 15) +
        text(x + w, y + h + 26, '72', 15, c.data, 'text-anchor="end"');
    } else if (kind === 'grid') {
      const cols = 8,
        rows = 5,
        cellW = w / cols,
        cellH = h / rows;
      for (let i = 0; i < cols * rows; i++) {
        const value = scene.signal[i],
          px = x + (i % cols) * cellW,
          py = y + Math.floor(i / cols) * cellH;
        out += rect(
          px,
          py,
          cellW - 4,
          cellH - 4,
          value > 0.64 ? c.secondary : value > 0.4 ? c.data : c.interactive,
        );
        out += text(
          px + 10,
          py + cellH / 2 + 6,
          Math.round(value * 100)
            .toString()
            .padStart(2, '0'),
          20,
          c.ground,
        );
      }
    } else if (kind === 'network') {
      const nodes = scene.nodes.map((p) => ({ x: x + p.x * w, y: y + p.y * h }));
      nodes.forEach((node, i) => {
        if (i)
          out += line(
            node.x,
            node.y,
            nodes[Math.floor((i - 1) / 2)].x,
            nodes[Math.floor((i - 1) / 2)].y,
            c.data,
            2,
            'class="network-flow"',
          );
      });
      nodes.forEach((node, i) => {
        out +=
          circle(node.x, node.y, i === 0 ? 18 : 8, c.secondary, c.ground, 3) +
          text(node.x + 14, node.y - 12, `N${String(i + 1).padStart(2, '0')}`, 15, c.bright);
      });
    }
    return out;
  }
  function channels(x, y, w) {
    let out = heading(x, y, w, 'SUBSYSTEM UTILIZATION');
    scene.channels.forEach((item, i) => {
      const py = y + 66 + i * 51;
      out +=
        text(x, py, item.label.toUpperCase(), 18, c.text) +
        text(x + w, py, `${item.value}%`, 18, c.secondary, 'text-anchor="end"');
      out +=
        rect(x, py + 10, w, 10, c.interactive) +
        rect(x + (w * item.value) / 100, py + 10, (w * (100 - item.value)) / 100, 10, c.ground);
      out += line(x + w, py + 7, x + w, py + 23, c.interactive, 2);
    });
    return out;
  }
  function records(x, y, w, pitch = 38) {
    let out = heading(x, y, w, 'OPERATIONS REGISTER');
    scene.records.forEach((item, i) => {
      const py = y + 67 + i * pitch;
      out +=
        text(x, py, item.label.toUpperCase(), 18, c.text) +
        text(x + w, py, item.state, 16, c.data, 'text-anchor="end"');
    });
    return out;
  }
  const panel = (markup, order = 1) =>
    `<g class="scene-panel" style="--order:${order}">${markup}</g>`;
  function frame(x, y, w, h, color = c.structure, mirror = false) {
    // Both elbow tangents and every vertical segment share the same 62-unit rail.
    const t = mirror ? `translate(${x + w} ${y}) scale(-1 1)` : `translate(${x} ${y})`;
    return `<g class="scene-frame" transform="${t}">
      <path d="M60 0H${w}V22H92Q62 22 62 52V72H0V60Q0 0 60 0Z" fill="${color}"/>
      ${rect(0, 75, 62, (h - 118) * 0.34, color)}
      ${rect(0, 78 + (h - 118) * 0.34, 62, (h - 118) * 0.29, c.secondary)}
      ${rect(0, 81 + (h - 118) * 0.63, 62, (h - 118) * 0.37 - 3, c.interactive)}
      <path d="M0 ${h - 37}H62Q62 ${h - 18} 82 ${h - 18}H${w}V${h}H38Q0 ${h} 0 ${h - 37}Z" fill="${color}"/>
      </g>`;
  }
  const metrics = (x, y, w) =>
    scene.metrics
      .map((m, i) => {
        const px = x + (i * w) / 3;
        return `<g class="scene-metric">${text(px, y, m.label.toUpperCase(), 16, c.text)}${text(px, y + 56, m.value, 36, c.secondary)}${text(px + Math.min(146, w / 3 - 62), y + 54, m.unit, 18, c.data)}</g>`;
      })
      .join('');
  function bank(x, y, w, rows = 9) {
    let out = heading(x, y, w, 'COMPUTER DATA / SIM');
    for (let row = 0; row < rows; row++) {
      const py = y + 64 + row * 29;
      out += rect(
        x,
        py - 17,
        44,
        20,
        [c.structure, c.secondary, c.data][row % 3],
        row % 3 === 0 ? 10 : 0,
      );
      out += text(
        x + 35,
        py - 2,
        String(row + 1).padStart(2, '0'),
        13,
        c.ground,
        'text-anchor="end"',
      );
      for (let col = 0; col < 4; col++) {
        const value = Math.round(scene.signal[(row * 4 + col + Math.floor(x / 10)) % 72] * 899999);
        out += text(
          x + 58 + (col * (w - 58)) / 4,
          py,
          String(value).padStart(6, '0'),
          18,
          [c.data, c.secondary, c.text, c.interactive][col],
        );
      }
    }
    return out;
  }
  function ribbons(x, y, w) {
    return [0, 1]
      .map((row) =>
        [0, 1, 2, 3, 4]
          .map((i) =>
            rect(
              x + (i * w) / 5,
              y + row * 14,
              w / 5 - 3,
              11,
              [c.structure, c.data, c.secondary, c.interactive, c.secondary][(i + row) % 5],
            ),
          )
          .join(''),
      )
      .join('');
  }
  let content = '',
    furniture = '',
    tx = 40,
    ty = 104;
  const primary = (kind) =>
    operationPurposes.some(({ id }) => id === scene.purpose) ? scene.diagram : kind;
  if (portrait) {
    const mirrored = ['split', 'bridge', 'analysis'].includes(scene.layout);
    const px = mirrored ? 40 : 126;
    furniture = frame(20, 20, 860, 1388, c.structure, mirrored);
    tx = px;
    const kind = primary(
      scene.layout === 'radial' ? 'radar' : scene.layout === 'reactor' ? 'reactor' : scene.diagram,
    );
    content = panel(metrics(px, 162, 720)) + panel(diagram(px, 250, 718, 460, kind), 2);
    if (['archive', 'analysis', 'bridge'].includes(scene.layout))
      content += panel(bank(px, 755, 718, 8), 3);
    else content += panel(channels(px, 755, 718), 3);
    content += panel(records(px, 1080, 718), 4);
  } else if (scene.layout === 'survey') {
    furniture = frame(20, 20, 1400, 860);
    tx = 122;
    content =
      panel(metrics(122, 162, 1248)) +
      panel(diagram(122, 250, 775, 475), 2) +
      panel(channels(955, 250, 415), 3) +
      panel(records(955, 544, 415), 4);
  } else if (scene.layout === 'analysis') {
    furniture = frame(344, 20, 1076, 250, c.secondary) + frame(344, 273, 1076, 477, c.structure);
    tx = 436;
    content =
      panel(bank(30, 32, 280, 20), 1) +
      panel(metrics(436, 162, 920), 2) +
      panel(diagram(438, 316, 920, 392), 3);
  } else if (scene.layout === 'telemetry') {
    furniture = ribbons(30, 20, 1380) + frame(30, 515, 1380, 235, c.secondary, true);
    content =
      panel(metrics(40, 162, 1340)) +
      panel(diagram(40, 245, 1340, 238), 2) +
      panel(bank(40, 550, 605, 4), 3) +
      panel(records(714, 553, 586, 32), 4);
  } else if (scene.layout === 'split') {
    furniture = frame(20, 232, 698, 518, c.data, true) + frame(721, 232, 699, 518, c.secondary);
    content =
      panel(metrics(40, 162, 1340)) +
      panel(diagram(45, 282, 570, 417), 2) +
      panel(bank(820, 284, 552, 10), 3);
    furniture += ribbons(40, 20, 1340);
  } else if (scene.layout === 'reactor') {
    furniture =
      frame(460, 20, 520, 730, c.structure) + ribbons(1010, 20, 390) + ribbons(30, 20, 390);
    tx = 552;
    ty = 92;
    // The narrow center frame reserves its title for the instrument; the purpose sits above the banks.
    content =
      panel(bank(30, 97, 386, 12)) +
      panel(diagram(558, 160, 366, 542, primary('reactor')), 2) +
      panel(channels(1010, 100, 380), 3) +
      panel(records(1010, 437, 380), 4);
  } else if (scene.layout === 'archive') {
    furniture = frame(20, 20, 1400, 460, c.secondary, true) + frame(20, 483, 1400, 267, c.data);
    content =
      panel(bank(40, 150, 595, 9)) +
      panel(bank(703, 150, 594, 9), 2) +
      panel(diagram(124, 522, 1230, 177, primary('waveform')), 3);
  } else if (scene.layout === 'radial') {
    furniture = frame(20, 20, 760, 730, c.structure) + ribbons(810, 20, 590);
    tx = 122;
    content =
      panel(diagram(122, 178, 600, 510, primary('radar')), 2) +
      panel(bank(820, 98, 568, 9), 1) +
      panel(diagram(820, 476, 568, 235, 'spectrum'), 3);
  } else {
    furniture = frame(20, 20, 1400, 730, c.data, true) + ribbons(40, 252, 1270);
    content =
      panel(metrics(40, 162, 1260)) +
      panel(diagram(40, 309, 575, 395, primary('radar')), 2) +
      panel(
        diagram(684, 309, 613, 395, instrumentNames[scene.diagram] ? 'spectrum' : scene.diagram),
        3,
      );
  }
  const narrowTitle = !portrait && scene.layout === 'reactor';
  const titleSize = narrowTitle ? 25 : portrait ? 34 : 40;
  const title =
    text(tx, ty, scene.title, titleSize, c.bright) +
    text(
      tx,
      narrowTitle ? ty + 31 : 134,
      'SIMULATED SYSTEMS / ' + scene.code,
      narrowTitle ? 16 : 14,
      c.interactive,
    );
  // Real observations occupy a separate band, never the simulated instrument channels.
  const fx = portrait ? 126 : scene.layout === 'survey' ? 122 : 40,
    fy = height - (portrait ? 102 : 115),
    fw = portrait ? 650 : width - fx - 50;
  let feedMarkup = '';
  if (feed) {
    feedMarkup =
      line(fx, fy - 13, fx + fw, fy - 13, c.secondary, 3) +
      text(fx, fy + 9, feed.label, portrait ? 17 : 20, c.bright);
    feedMarkup += text(fx, fy + 35, feed.summary, portrait ? 16 : 19, c.data);
    feedMarkup += text(fx, fy + 58, feed.detail, portrait ? 14 : 16, c.interactive);
  } else {
    feedMarkup =
      ribbons(fx, fy - 8, fw) +
      text(
        fx,
        fy + 51,
        `${scene.station.toUpperCase()} / PASS ${String(scene.index + 1).padStart(4, '0')} / SAMPLE ${String(scene.tick + 1).padStart(4, '0')} / LOCAL SIMULATION`,
        16,
        c.interactive,
      );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="scene-title scene-desc" data-purpose="${scene.purpose}" data-layout="${scene.layout}" data-palette="${scene.scheme}">
    <title id="scene-title">${escape(scene.title)}</title><desc id="scene-desc">Randomized ${escape(scene.station)} console. ${feed ? 'Instrument readings are simulated. Separate public observation band: ' + escape(feed.label + '. ' + feed.summary + '. ' + feed.detail) : 'All readings are simulated.'} ${escape(scene.metrics.map((m) => `${m.label}: ${m.value} ${m.unit}`).join('; '))}.</desc>
    <g font-family="Antonio, sans-serif" font-weight="400">
    ${rect(0, 0, width, height, c.ground)}${furniture}${panel(title, 0)}${content}<g id="observation-band">${feedMarkup}</g>
    ${text(width - (portrait ? 105 : 40), height - 25, `M47 / ${scene.layout === 'radial' ? 'ARC SCANNER' : scene.layout.toUpperCase()} / ${scene.scheme.toUpperCase()}`, 14, !portrait && scene.layout === 'survey' ? c.ground : c.bright, 'text-anchor="end"')}
    </g></svg>`;
}
