import { escape } from './index.js';

// Each subject supplies real layout semantics and bounded, explicitly simulated readings.
export const operationPurposes = [
  {
    id: 'tactical',
    title: 'TACTICAL ANALYSIS',
    station: 'Tactical analysis',
    diagram: 'tactical',
    channels: ['Forward sector', 'Port sector', 'Starboard sector', 'Aft sector'],
    metrics: [
      ['Tracks', 3, 12, 'REF'],
      ['Separation', 2, 45, 'DEG'],
      ['Resolution', 0.1, 0.9, 'AU'],
    ],
    records: ['Survey track', 'Relay track', 'Probe track', 'Local vector'],
  },
  {
    id: 'transporter',
    title: 'TRANSPORTER CONTROL',
    station: 'Transporter control',
    diagram: 'transporter',
    channels: ['Phase alignment', 'Pattern buffer', 'Carrier lock', 'Integrity'],
    metrics: [
      ['Carrier', 4, 5, 'GHZ'],
      ['Buffer', 40, 90, '%'],
      ['Deviation', 0.1, 0.8, 'MS'],
    ],
    records: ['Pattern alpha', 'Pattern beta', 'Phase reference', 'Return buffer'],
  },
  {
    id: 'warp',
    title: 'WARP FIELD DYNAMICS',
    station: 'Warp dynamics',
    diagram: 'warp',
    channels: ['Port coils', 'Starboard coils', 'Intermix feed', 'Containment'],
    metrics: [
      ['Warp factor', 2, 8, 'WF'],
      ['Containment', 95, 99, '%'],
      ['Intermix', 0.9, 1.1, ':1'],
    ],
    records: ['Port nacelle', 'Starboard nacelle', 'Feed manifold', 'Field regulator'],
  },
  {
    id: 'medical',
    title: 'MEDICAL DIAGNOSTICS',
    station: 'Medical diagnostics',
    diagram: 'medical',
    channels: ['Cardiac array', 'Neural array', 'Respiratory array', 'Sample buffer'],
    metrics: [
      ['Temperature', 36, 38, 'C'],
      ['Oxygen', 95, 99, '%'],
      ['Metabolic index', 0.8, 1.2, 'REF'],
    ],
    records: ['Synthetic sample', 'Neural sample', 'Cellular sample', 'Reference scan'],
  },
  {
    id: 'shuttle',
    title: 'SHUTTLE OPERATIONS',
    station: 'Shuttle operations',
    diagram: 'shuttle',
    channels: ['Bay one', 'Bay two', 'Bay three', 'Approach corridor'],
    metrics: [
      ['Approach', 10, 80, 'M/S'],
      ['Berths', 1, 3, 'OPEN'],
      ['Window', 20, 120, 'S'],
    ],
    records: ['Survey craft', 'Cargo craft', 'Service craft', 'Outbound craft'],
  },
  {
    id: 'environment',
    title: 'ENVIRONMENTAL SYSTEMS',
    station: 'Environmental systems',
    diagram: 'environment',
    channels: ['Air intake', 'Bio filter', 'Water recovery', 'Thermal loop'],
    metrics: [
      ['Pressure', 100, 103, 'KPA'],
      ['Humidity', 38, 55, '%'],
      ['Air exchange', 6, 10, 'M3/S'],
    ],
    records: ['Deck supply', 'Water return', 'Reclaim plant', 'Habitat loop'],
  },
  {
    id: 'temporal',
    title: 'TEMPORAL MECHANICS',
    station: 'Temporal mechanics',
    diagram: 'temporal',
    channels: ['Reference lock', 'Phase coherence', 'Clock array', 'Sample buffer'],
    metrics: [
      ['Offset', 0.1, 0.9, 'MS'],
      ['Coherence', 95, 99, '%'],
      ['Reference', 40, 48, 'MHZ'],
    ],
    records: ['Reference frame', 'Causality lattice', 'Clock standard', 'Phase sample'],
  },
  {
    id: 'stellar',
    title: 'STELLAR EVOLUTION',
    station: 'Stellar evolution',
    diagram: 'stellar',
    channels: ['Main sequence', 'Giant branch', 'White dwarfs', 'Population fit'],
    metrics: [
      ['Population', 120, 180, 'STARS'],
      ['Sequence age', 2, 8, 'GYR'],
      ['Abundance', 0.1, 0.9, 'REF'],
    ],
    records: ['Protostar field', 'Main sequence', 'Giant branch', 'Remnant field'],
  },
];

export const instrumentNames = {
  course: 'NAVIGATION VECTOR ARRAY',
  sky: 'DEEP FIELD IMAGING',
  strata: 'SUBSURFACE TOMOGRAPHY',
  tactical: 'SECTOR INTERCEPT MATRIX',
  transporter: 'PHASE ALIGNMENT / BUFFER',
  warp: 'NACELLE COIL ASSEMBLY',
  medical: 'BIOMETRIC ARRAY / SIM',
  shuttle: 'BAY GEOMETRY / APPROACH',
  environment: 'REGENERATION CIRCUIT',
  temporal: 'REFERENCE FRAME CASCADE',
  stellar: 'STELLAR POPULATION',
  schematic: 'DISTRIBUTION SWITCHBOARD',
};

/** Render an instrument inside a supplied body rectangle. Geometry stays stable between ticks. */
export function renderInstrument(scene, kind, x, y, w, h) {
  if (!instrumentNames[kind]) throw new Error('Unknown instrument.');
  const c = scene.colors;
  const X = (u) => +(x + u * w).toFixed(3);
  const Y = (v) => +(y + v * h).toFixed(3);
  const point = (u, v) => `${X(u)} ${Y(v)}`;
  const path = (d, color = c.data, extra = '') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" ${extra}/>`;
  const line = (a, b, d, e, color = c.data, extra = '') =>
    path(`M${point(a, b)}L${point(d, e)}`, color, extra);
  const rect = (u, v, width, height, color = c.data, extra = '') =>
    `<rect x="${X(u)}" y="${Y(v)}" width="${+(width * w).toFixed(3)}" height="${+(height * h).toFixed(3)}" fill="${color}" ${extra}/>`;
  const label = (u, v, value, color = c.text, anchor = 'start') =>
    h < 220 || w < 440
      ? ''
      : `<text x="${X(u)}" y="${Y(Math.max(v, 28 / h))}" font-size="${w < 740 ? 20 : 22}" text-anchor="${anchor}" fill="${color}">${escape(value)}</text>`;
  const pulse = (body, phase) =>
    `<g class="core-cell" style="--phase:${-phase * 230}ms">${body}</g>`;
  const flow = (d) => path(d, c.secondary, 'class="network-flow"');
  const sweep = () =>
    `<g class="sensor-sweep" style="--scan-distance:${+(w * 0.92).toFixed(3)}px">${line(0.04, 0.06, 0.04, 0.94, c.bright, 'opacity=".6"')}</g>`;
  const grid = () =>
    Array.from({ length: 7 }, (_, i) =>
      line(
        0.04 + (i + 1) * 0.115,
        0.06,
        0.04 + (i + 1) * 0.115,
        0.94,
        c.interactive,
        'opacity=".22"',
      ),
    ).join('') +
    Array.from({ length: 4 }, (_, i) =>
      line(
        0.04,
        0.06 + (i + 1) * 0.176,
        0.96,
        0.06 + (i + 1) * 0.176,
        c.interactive,
        'opacity=".22"',
      ),
    ).join('');
  const trace = (baseline, phase, cardiac = false) =>
    path(
      Array.from({ length: 121 }, (_, i) => {
        const t = i / 120,
          q = (t * 5 + phase) % 1;
        const a = cardiac
          ? q > 0.38 && q < 0.42
            ? -0.5
            : q >= 0.42 && q < 0.47
              ? 1
              : q >= 0.47 && q < 0.52
                ? -0.3
                : 0.03 * Math.sin(t * 150)
          : 0.55 * Math.sin(t * 24 + phase) + 0.2 * Math.sin(t * 61 + phase);
        return `${i ? 'L' : 'M'}${point(0.22 + t * 0.73, baseline - a * 0.07)}`;
      }).join(''),
      phase ? c.secondary : c.data,
      `class="signal-trace" style="--phase:${-phase * 1000}ms"`,
    );
  let out = '';
  if (kind === 'course' || kind === 'tactical') {
    out += grid();
    const nodes = [
      [0.08, 0.8],
      [0.25, 0.64],
      [0.4, 0.35],
      [0.62, 0.48],
      [0.76, 0.22],
      [0.9, 0.4],
    ];
    out += flow(nodes.map(([u, v], i) => `${i ? 'L' : 'M'}${point(u, v)}`).join(''));
    out += path(
      `M${point(0.08, 0.8)}L${point(0.16, 0.2)}L${point(0.4, 0.35)}M${point(0.25, 0.64)}L${point(0.62, 0.84)}L${point(0.9, 0.4)}`,
      c.interactive,
      'stroke-dasharray="6 7"',
    );
    nodes.forEach(([u, v], i) => {
      out += path(
        `M${point(u - 0.012, v - 0.024)}H${X(u + 0.012)}V${Y(v + 0.024)}H${X(u - 0.012)}Z`,
        i === 2 ? c.bright : c.data,
      );
      out += label(
        u,
        v - 0.065,
        `${kind === 'tactical' ? 'TRK' : 'NAV'} 0${i + 1}`,
        c.text,
        'middle',
      );
    });
    out += sweep();
  } else if (kind === 'sky' || kind === 'stellar') {
    out += grid();
    for (let i = 0; i < 120; i++) {
      const t = ((i * 61) % 127) / 127;
      let u = kind === 'sky' ? 0.06 + (((i * 137 + 61) % 997) / 997) * 0.86 : 0.08 + t * 0.84;
      let v =
        kind === 'sky'
          ? 0.1 + (((i * i * 53 + 149) % 991) / 991) * 0.78
          : 0.17 + t * 0.68 + Math.sin(i * 2.7) * 0.035;
      if (kind === 'stellar' && i % 6 === 0) {
        u = 0.57 + t * 0.33;
        v = 0.17 + Math.sin(i) * 0.04;
      }
      if (kind === 'stellar' && i % 11 === 0) {
        u = 0.13 + t * 0.2;
        v = 0.78 + Math.cos(i) * 0.035;
      }
      out += rect(
        u,
        v,
        i % 8 === 0 ? 0.007 : 0.003,
        i % 8 === 0 ? 0.012 : 0.006,
        i % 6 === 0 ? c.secondary : c.data,
      );
    }
    if (kind === 'sky')
      out +=
        path(
          `M${point(0.38, 0.36)}v${-h * 0.08}h${w * 0.06}M${point(0.62, 0.28)}h${w * 0.06}v${h * 0.08}M${point(0.38, 0.62)}v${h * 0.08}h${w * 0.06}M${point(0.62, 0.7)}h${w * 0.06}v${-h * 0.08}`,
          c.secondary,
        ) + label(0.4, 0.22, 'FIELD 047');
    else
      out +=
        label(0.6, 0.1, 'GIANTS', c.secondary) +
        label(0.07, 0.66, 'DWARFS') +
        label(0.44, 0.48, 'MAIN SEQUENCE');
    out += sweep();
  } else if (kind === 'strata') {
    out += grid();
    for (let j = 0; j < 4; j++)
      out += path(
        Array.from(
          { length: 41 },
          (_, i) =>
            `${i ? 'L' : 'M'}${point(0.04 + i * 0.023, 0.2 + j * 0.18 + Math.sin(i * 0.22 + j) * 0.05 + (i > 25 ? -0.09 : 0))}`,
        ).join(''),
        [c.data, c.interactive, c.secondary, c.structure][j],
      );
    [0.22, 0.5, 0.78].forEach((u, i) => {
      out +=
        line(u, 0.08, u, 0.91, c.bright, 'stroke-dasharray="5 5"') +
        label(u, 0.065, `CORE 0${i + 1}`, c.text, 'middle');
    });
    out += sweep();
  } else if (kind === 'transporter') {
    for (let col = 0; col < 6; col++) {
      let cells = '';
      for (let row = 0; row < 12; row++)
        cells += rect(
          0.04 + col * 0.086,
          0.16 + row * 0.058,
          0.06,
          0.04,
          [c.data, c.secondary, c.interactive][(row + col) % 3],
        );
      out += pulse(cells, col) + label(0.07 + col * 0.086, 0.1, `P${col + 1}`, c.text, 'middle');
    }
    for (let row = 0; row < 9; row++) {
      let cells = '';
      for (let col = 0; col < 12; col++)
        cells += rect(
          0.61 + col * 0.028,
          0.16 + row * 0.08,
          0.021,
          0.055,
          (row + col) % 7 === 0 ? c.secondary : c.data,
        );
      out += pulse(cells, row + 6);
    }
    out += label(0.61, 0.1, 'PATTERN BUFFER');
  } else if (kind === 'warp') {
    for (const [bank, v] of [0.14, 0.65].entries()) {
      out += path(
        `M${point(0.24, v - 0.03)}H${X(0.91)}L${point(0.96, v + 0.04)}V${Y(v + 0.18)}L${point(0.91, v + 0.25)}H${X(0.24)}Z`,
        c.interactive,
      );
      for (let phase = 0; phase < 3; phase++) {
        let cells = '';
        for (let i = phase; i < 13; i += 3)
          cells +=
            rect(0.27 + i * 0.05, v, 0.03, 0.21, i % 3 ? c.data : c.secondary) +
            rect(0.28 + i * 0.05, v + 0.04, 0.01, 0.13, c.ground);
        out += pulse(cells, phase + bank * 3);
      }
      out +=
        flow(`M${point(0.24, v + 0.105)}H${X(0.94)}`) +
        label(0.26, v - 0.07, bank ? 'STARBOARD / 13 COILS' : 'PORT / 13 COILS');
    }
    out += rect(0.04, 0.3, 0.1, 0.4, c.secondary);
    for (let i = 0; i < 7; i++) out += rect(0.055, 0.32 + i * 0.052, 0.07, 0.03, c.ground);
    out +=
      flow(`M${point(0.14, 0.5)}H${X(0.52)}V${Y(0.4)}M${point(0.52, 0.5)}V${Y(0.65)}`) +
      label(0.65, 0.52, 'INTERMIX 1:1');
  } else if (kind === 'medical') {
    ['CARDIAC', 'NEURAL', 'RESP.'].forEach((name, i) => {
      const v = 0.24 + i * 0.29;
      out +=
        label(0.04, v, name) +
        line(0.22, v, 0.95, v, c.interactive, 'opacity=".3"') +
        trace(v, i * 0.23, i === 0);
    });
    out += sweep();
  } else if (kind === 'shuttle') {
    for (let i = 0; i < 5; i++)
      out += line(0.46 + i * 0.12, 0.07, 0.46 + i * 0.12, 0.94, c.interactive, 'opacity=".2"');
    for (let i = 0; i < 5; i++)
      out += line(0.44, 0.09 + i * 0.19, 0.96, 0.09 + i * 0.19, c.interactive, 'opacity=".2"');
    for (let i = 0; i < 3; i++) {
      const bx = X(0.04),
        by = Y(0.09 + i * 0.29),
        bw = w * 0.35,
        bh = h * 0.23;
      const bar = Math.min(28, bh * 0.28),
        rail = Math.min(13, bh * 0.13),
        radius = Math.min(24, bh * 0.3);
      const inner = radius - rail,
        cap = bar / 2;
      out += `<g class="shuttle-berth" data-berth="${i + 1}">`;
      out += `<path class="berth-frame" d="M${bx + radius} ${by}H${bx + bw - cap}Q${bx + bw} ${by} ${bx + bw} ${by + cap}Q${bx + bw} ${by + bar} ${bx + bw - cap} ${by + bar}H${bx + rail + inner}Q${bx + rail} ${by + bar} ${bx + rail} ${by + bar + inner}V${by + bh - rail - inner}Q${bx + rail} ${by + bh - rail} ${bx + rail + inner} ${by + bh - rail}H${bx + bw * 0.8 - rail / 2}Q${bx + bw * 0.8} ${by + bh - rail} ${bx + bw * 0.8} ${by + bh - rail / 2}Q${bx + bw * 0.8} ${by + bh} ${bx + bw * 0.8 - rail / 2} ${by + bh}H${bx + radius}Q${bx} ${by + bh} ${bx} ${by + bh - radius}V${by + radius}Q${bx} ${by} ${bx + radius} ${by}Z" fill="${i === 1 ? c.structure : c.secondary}"/>`;
      const fontSize = Math.min(22, bar * 0.6, (bw - radius - cap - 16) / 3.6);
      if (fontSize >= 12)
        out += `<text class="berth-label" x="${bx + radius + 8}" y="${by + (bar + fontSize * 0.98) / 2}" font-size="${fontSize}" fill="${c.ground}">BERTH 0${i + 1}</text>`;
      const platformY = by + bar + (bh - bar - rail) * 0.36,
        platformH = (bh - bar - rail) * 0.38;
      out += `<rect x="${bx + rail + 9}" y="${platformY}" width="${bw - rail - 20}" height="${platformH}" rx="${Math.min(9, platformH / 2)}" fill="${c.interactive}"/>`;
      const cy = platformY + platformH / 2;
      out += flow(`M${bx + bw} ${cy}H${X(0.65)}V${Y(0.92)}`);
      out += `<circle cx="${bx + bw}" cy="${cy}" r="${Math.min(4, h * 0.012)}" fill="${c.data}"/>`;
      out += '</g>';
    }
    out += `<path class="direction-marker" data-direction="approach" d="M${point(0.79, 0.29)}Q${point(0.775, 0.265)} ${point(0.802, 0.282)}L${point(0.91, 0.44)}Q${point(0.93, 0.455)} ${point(0.91, 0.47)}L${point(0.802, 0.628)}Q${point(0.775, 0.645)} ${point(0.79, 0.62)}L${point(0.825, 0.47)}Q${point(0.832, 0.455)} ${point(0.825, 0.44)}Z" fill="${c.bright}"/>`;
    out += `<g class="sensor-sweep" style="--scan-distance:${w * 0.48}px">${line(0.46, 0.07, 0.46, 0.94, c.data, 'opacity=".65"')}</g>`;
  } else if (kind === 'environment') {
    const names = ['INTAKE', 'FILTER', 'SUPPLY', 'RETURN', 'RECLAIM', 'THERMAL'];
    const banks = names.map((name, i) => {
      const bx = X(0.04 + (i % 3) * 0.335),
        by = Y(i < 3 ? 0.12 : 0.63);
      const bw = w * 0.24,
        bh = h * 0.27;
      const rail = Math.min(14, bw * 0.08, bh * 0.12);
      const cap = Math.min(28, bh * 0.26),
        radius = Math.min(26, bh * 0.23);
      const inner = Math.max(0, radius - rail),
        gutter = Math.min(3, bh * 0.02);
      const cellHeight = Math.min(30, (bh - cap - rail) * 0.45);
      const cellY = by + cap + (bh - cap - rail - cellHeight) / 2;
      return { name, bx, by, bw, bh, rail, cap, radius, inner, gutter, cellHeight, cellY };
    });
    const terminal = (px, py) =>
      `<circle cx="${px}" cy="${py}" r="${Math.min(3.5, h * 0.012)}" fill="${c.data}"/>`;
    const conduit = (d, start, end) =>
      `<g class="environment-conduit">${path(d, c.interactive)}${flow(d)}${terminal(...start)}${terminal(...end)}</g>`;
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
    ]) {
      const first = banks[a],
        next = banks[b];
      const py = first.cellY + first.cellHeight / 2;
      const start = [first.bx + first.bw, py],
        end = [next.bx + next.rail / 2, py];
      out += conduit(`M${start}H${end[0]}`, start, end);
    }
    const supply = banks[2],
      returned = banks[3];
    const start = [supply.bx + supply.bw * 0.78, supply.by + supply.bh + h * 0.015];
    const end = [returned.bx + returned.bw * 0.78, returned.by - h * 0.035];
    const middle = Y(0.515),
      bend = Math.min(14, h * 0.035);
    out += conduit(
      `M${start}V${middle - bend}Q${start[0]} ${middle} ${start[0] - bend} ${middle}H${end[0] + bend}Q${end[0]} ${middle} ${end[0]} ${middle + bend}V${end[1]}`,
      start,
      end,
    );
    for (let i = 0; i < 6; i++) {
      const { name, bx, by, bw, bh, rail, cap, radius, inner, gutter, cellHeight, cellY } =
        banks[i];
      const topEnd = by + cap + inner;
      const bottomStart = by + bh - radius;
      const run = Math.max(0, bottomStart - topEnd - gutter * 3);
      const fill = i < 3 ? c.structure : c.secondary;
      out += `<g class="environment-bank" data-subsystem="${name.toLowerCase()}">`;
      // The inner elbow tangent and segmented vertical run share one rail width.
      out += `<path class="environment-elbow" d="M${bx + radius} ${by}H${bx + bw - cap / 2}Q${bx + bw} ${by} ${bx + bw} ${by + cap / 2}Q${bx + bw} ${by + cap} ${bx + bw - cap / 2} ${by + cap}H${bx + rail + inner}Q${bx + rail} ${by + cap} ${bx + rail} ${topEnd}H${bx}V${by + radius}Q${bx} ${by} ${bx + radius} ${by}Z" fill="${fill}"/>`;
      out += `<rect x="${bx}" y="${topEnd + gutter}" width="${rail}" height="${run * 0.48}" fill="${c.interactive}"/><rect x="${bx}" y="${topEnd + gutter * 2 + run * 0.48}" width="${rail}" height="${run * 0.52}" fill="${c.secondary}"/>`;
      out += `<path d="M${bx} ${bottomStart}H${bx + rail}V${by + bh - rail - inner}Q${bx + rail} ${by + bh - rail} ${bx + rail + inner} ${by + bh - rail}H${bx + bw * 0.64 - rail / 2}Q${bx + bw * 0.64} ${by + bh - rail} ${bx + bw * 0.64} ${by + bh - rail / 2}Q${bx + bw * 0.64} ${by + bh} ${bx + bw * 0.64 - rail / 2} ${by + bh}H${bx + radius}Q${bx} ${by + bh} ${bx} ${bottomStart}Z" fill="${fill}"/>`;
      const fontSize = Math.min(22, cap * 0.6, (bw - radius - cap / 2 - 12) / (name.length * 0.55));
      if (fontSize >= 12)
        out += `<text x="${bx + radius + 6}" y="${by + (cap + fontSize * 0.98) / 2}" font-size="${fontSize}" fill="${c.ground}">${name}</text>`;
      let cells = '';
      const step = (bw - rail - 18) / 7;
      for (let j = 0; j < 7; j++)
        cells += `<rect class="environment-cell" x="${bx + rail + 9 + j * step}" y="${cellY}" width="${step - Math.min(4, step * 0.2)}" height="${cellHeight}" fill="${c.data}"/>`;
      out += pulse(cells, i) + '</g>';
    }
  } else if (kind === 'temporal') {
    const band = Math.min(26, h * 0.058, w * 0.045),
      cap = band / 2,
      gap = Math.min(3, band * 0.22, w * 0.006),
      weight = Math.min(4, h * 0.018, w * 0.006),
      top = Y(0.055),
      terminalHeight = h * 0.05;
    // Nested returns join each phase band to its own terminal without crossings.
    for (let i = 0; i < 8; i++) {
      const start = X(0.035 + i * 0.023),
        center = Y(0.175 + i * 0.1),
        py = center - cap,
        end = X(0.535 + i * 0.006),
        turn = X(0.66 + i * 0.041),
        bend = Math.min(w * 0.025, h * 0.045),
        head = Math.min(w * 0.036, band * 2.4),
        gate = Math.max(cap, Math.min(w * 0.018, band * 0.9)),
        color = i === 0 || i === 4 ? c.secondary : c.interactive;
      out += `<g class="temporal-frame" data-reference="${i}">`;
      out += `<path class="temporal-lane" d="M${end} ${center}H${turn - bend}Q${turn} ${center} ${turn} ${center - bend}V${top + terminalHeight + gap}" fill="none" stroke="${c.data}" stroke-width="${weight}" opacity=".72"/>`;
      // A broad uninterrupted band carries the rhythm; two black seams articulate its ends.
      out += `<path class="temporal-band" d="M${start + cap} ${py}H${end - gate - gap}V${py + band}H${start + cap}Q${start} ${py + band} ${start} ${center}Q${start} ${py} ${start + cap} ${py}Z" fill="${color}"/>`;
      out += `<rect x="${start + head}" y="${py}" width="${gap}" height="${band}" fill="${c.ground}"/>`;
      const terminalWidth = Math.min(w * 0.009, band * 0.65),
        terminalCap = Math.min(terminalWidth / 2, terminalHeight / 2);
      out += pulse(
        `<path class="temporal-gate" d="M${end - gate} ${py}H${end - cap}Q${end} ${py} ${end} ${center}Q${end} ${py + band} ${end - cap} ${py + band}H${end - gate}Z" fill="${c.data}"/><rect class="temporal-terminal" x="${turn - terminalWidth / 2}" y="${top}" width="${terminalWidth}" height="${terminalHeight}" rx="${terminalCap}" fill="${i === 0 || i === 4 ? c.secondary : c.data}"/>`,
        i,
      );
      out += '</g>';
    }
  } else if (kind === 'schematic') {
    const rowHeight = h * 0.225,
      band = Math.min(34, rowHeight * 0.64, w * 0.09),
      cap = band / 2;
    const rail = Math.min(12, w * 0.025);
    out += `<path class="bus-spine" d="M${X(0.06)} ${Y(0.07) + cap}V${Y(0.745) + cap}" fill="none" stroke="${c.structure}" stroke-width="${rail}" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) {
      const py = Y(0.07 + i * 0.225),
        px = X(0.13),
        join = X(w < 500 ? 0.35 : 0.32),
        right = X(0.94),
        valueStart = X(w < 500 ? 0.74 : 0.8);
      out += `<g class="distribution-bus" data-bus="${i + 1}">`;
      out +=
        flow(`M${X(0.06)} ${py + cap}H${px}`) +
        `<circle cx="${X(0.06)}" cy="${py + cap}" r="${Math.min(4, h * 0.02)}" fill="${c.bright}"/>`;
      out += `<path d="M${px + cap} ${py}H${join - 3}V${py + band}H${px + cap}Q${px} ${py + band} ${px} ${py + cap}Q${px} ${py} ${px + cap} ${py}Z" fill="${c.interactive}"/>`;
      const fontSize = Math.min(22, band * 0.6);
      if (fontSize >= 12)
        out += `<text x="${px + cap + 6}" y="${py + (band + fontSize * 0.98) / 2}" font-size="${fontSize}" fill="${c.ground}">BUS ${i + 1}</text>`;
      const step = (valueStart - join - 3) / 20,
        active = Math.round(scene.channels[i].value / 5);
      for (let cell = 0; cell < 20; cell++)
        out += `<rect class="bus-capacity-cell" x="${join + cell * step}" y="${py + band * 0.15}" width="${step - Math.min(3, step * 0.3)}" height="${band * 0.7}" fill="${cell < active ? c.data : c.interactive}" opacity="${cell < active ? 1 : 0.24}"/>`;
      out += `<path d="M${valueStart} ${py}H${right - cap}Q${right} ${py} ${right} ${py + cap}Q${right} ${py + band} ${right - cap} ${py + band}H${valueStart}Z" fill="${c.secondary}"/>`;
      if (fontSize >= 12)
        out += `<text x="${right - cap - 7}" y="${py + (band + fontSize * 0.98) / 2}" font-size="${fontSize}" text-anchor="end" fill="${c.ground}">${scene.channels[i].value}%</text>`;
      out += '</g>';
    }
  }
  return `<g class="sensor-instrument" data-instrument="${kind}" data-bounds="${x} ${y} ${w} ${h}">${out}</g>`;
}
