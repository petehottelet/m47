import { random, escape } from './index.js';

export function renderStarMap(scene, x, y, width, height) {
  const c = scene.colors;
  const X = (u) => +(x + u * width).toFixed(2);
  const Y = (v) => +(y + v * height).toFixed(2);
  const point = (u, v) => `${X(u)} ${Y(v)}`;
  const stroke = (d, color = c.interactive, extra = '', weight = 1) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${weight}" ${extra}/>`;
  const font = width >= 700 ? 26 : 20;
  const text = (u, v, value, color = c.data, anchor = 'start', size = font) =>
    `<text x="${X(u)}" y="${Y(v)}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escape(value)}</text>`;
  const rng = random(`sector:${scene.code}`);
  let out = `<g class="stellar-map" data-instrument="stellar-map" data-bounds="${x} ${y} ${width} ${height}" font-family="Antonio, sans-serif">`;
  // Coordinate axes belong to the plotted sector, with one unit per grid interval.
  for (let i = 0; i <= 6; i++) {
    const u = 0.045 + i * 0.115;
    out += stroke(`M${point(u, 0.14)}V${Y(0.81)}`, c.interactive, 'opacity=".24"');
  }
  for (let i = 0; i <= 4; i++) {
    const v = 0.14 + i * 0.1675;
    out += stroke(`M${point(0.045, v)}H${X(0.735)}`, c.interactive, 'opacity=".24"');
  }
  out += stroke(`M${point(0.045, 0.81)}H${X(0.735)}M${point(0.045, 0.14)}V${Y(0.81)}`, c.data);
  for (let i = 0; i < 42; i++) {
    const u = 0.075 + rng() * 0.625,
      v = 0.17 + rng() * 0.6;
    const size = i % 7 === 0 ? 3 : 1.5;
    out += `<rect class="sector-star" x="${X(u) - size / 2}" y="${Y(v) - size / 2}" width="${size}" height="${size}" fill="${c.data}" opacity="${i % 7 === 0 ? 0.7 : 0.4}"/>`;
  }
  const route = [
    [0.13, 0.68],
    [0.34, 0.54],
    [0.49, 0.3],
    [0.69, 0.37],
  ];
  out += stroke(
    route.map(([u, v], i) => `${i ? 'L' : 'M'}${point(u, v)}`).join(''),
    c.secondary,
    'class="stellar-course network-flow"',
    2.5,
  );
  out += stroke(
    `M${point(0.34, 0.54)}L${point(0.24, 0.23)}M${point(0.49, 0.3)}L${point(0.61, 0.66)}`,
    c.interactive,
    'stroke-dasharray="4 7" opacity=".55"',
  );
  route.forEach(([u, v], i) => {
    const px = X(u),
      py = Y(v),
      selected = i === 3;
    out += `<g class="sector-system"${selected ? ' data-selected="true"' : ''}><path d="M${px} ${py - 6}l6 6-6 6-6-6Z" fill="${selected ? c.bright : c.ground}" stroke="${selected ? c.bright : c.data}" stroke-width="2"/>`;
    if (selected)
      out += stroke(
        `M${px - 13} ${py - 7}v-6h6M${px + 7} ${py - 13}h6v6M${px + 13} ${py + 7}v6h-6M${px - 7} ${py + 13}h-6v-6`,
        c.secondary,
      );
    if (height >= 220)
      out += text(
        u,
        v + (i === 3 ? -0.07 : 0.09),
        ['REF 01', 'RELAY 02', 'NODE 03', 'VEGA 04'][i],
        selected ? c.bright : c.text,
        'middle',
      );
    out += '</g>';
  });
  out += stroke(`M${point(0.8, 0.14)}V${Y(0.94)}`, c.secondary, 'opacity=".55"');
  if (height >= 220) {
    out += text(0.045, 0.08, 'SECTOR 047 / LOCAL REFERENCE', c.interactive, 'start', font * 0.84);
    out +=
      text(0.045, 0.94, 'X −3', c.data, 'start', font * 0.84) +
      text(0.735, 0.94, '+3 LY', c.data, 'end', font * 0.84);
    out +=
      text(0.835, 0.25, 'COURSE', c.interactive, 'start', font * 0.8) +
      text(0.835, 0.36, '047°', c.bright, 'start', font * 1.4);
    out +=
      text(0.835, 0.53, 'RANGE', c.interactive, 'start', font * 0.8) +
      text(0.835, 0.63, '8.4 LY', c.secondary);
    out +=
      text(0.835, 0.81, '4 NODES', c.data, 'start', font * 0.84) +
      text(0.835, 0.92, 'LOCKED', c.secondary, 'start', font * 0.84);
  }
  return out + '</g>';
}
