import { families } from './catalog.js';
import { diagnosticLayout, layoutSpacing } from './layout-geometry.js';

export const palettes = {
  classic: ['#ffad77', '#c6a2de', '#91d4f3', '#ffe29a'],
  electric: ['#ddb92d', '#729bff', '#83def1', '#eee6a0'],
  silver: ['#c1d3df', '#b5a3f3', '#8bcaf0', '#efd19a'],
  coral: ['#f28e84', '#c68cff', '#96a8ff', '#ffcb9c'],
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const n = (v) => Number(v.toFixed(2));
function random(seed) {
  let a = seed;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

export function renderElement(
  familyId,
  variant = 0,
  { palette = 'classic', motion = false, font = null } = {},
) {
  const family = families.find((f) => f.id === familyId);
  if (!family || !Number.isInteger(variant) || !family.variants[variant] || !palettes[palette])
    throw new Error('Unknown review specimen.');
  const spec = family.variants[variant],
    v = variant,
    c = palettes[palette],
    rng = random(families.indexOf(family) * 101 + v * 743 + 47);
  const r = (x, y, w, h, fill = c[0], rx = 0, extra = '') =>
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${fill}" ${extra}/>`;
  const t = (x, y, s, size = 18, fill = c[2], extra = '') =>
    `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;
  const l = (x, y, xx, yy, color = c[2], w = 1, extra = '') =>
    `<line x1="${n(x)}" y1="${n(y)}" x2="${n(xx)}" y2="${n(yy)}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
  const p = (d, fill = 'none', stroke = c[2], w = 2, extra = '') =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  const endcap = (x, y, w, h, fill, end = 'left') => {
    const radius = h / 2;
    const d =
      end === 'left'
        ? `M${x + radius} ${y}H${x + w}V${y + h}H${x + radius}A${radius} ${radius} 0 0 1 ${x + radius} ${y}Z`
        : `M${x} ${y}H${x + w - radius}A${radius} ${radius} 0 0 1 ${x + w - radius} ${y + h}H${x}Z`;
    return p(d, fill, fill, 0);
  };
  const circle = (x, y, radius, fill = 'none', stroke = c[2], w = 2) =>
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
  const g = (s, extra = '') => `<g ${extra}>${s}</g>`;
  const vector = (x, y, xx, yy, color = c[2], width = 2) =>
    g(
      l(x, y, xx, yy, color, width) +
        circle(x, y, Math.max(4, width * 2.5), color, color, 0) +
        circle(xx, yy, Math.max(4, width * 2.5), color, color, 0),
      'data-vector="connection"',
    );
  const vectorPath = (d, start, end, color, width = 3) =>
    g(
      p(d, 'none', color, width) +
        circle(...start, 5, color, color, 0) +
        circle(...end, 5, color, color, 0),
      'data-vector="path"',
    );
  const center = (x, y, s, size = 18, fill = c[2]) =>
    t(x, y, s, size, fill, 'text-anchor="middle"');
  const pt = (x, y, rr, a) => [
    n(x + Math.cos((a * Math.PI) / 180) * rr),
    n(y + Math.sin((a * Math.PI) / 180) * rr),
  ];
  function sector(x, y, inner, outer, a, b, fill, gap = 3) {
    const s = pt(x, y, outer, a),
      e = pt(x, y, outer, b),
      ii = pt(x, y, inner, b),
      jj = pt(x, y, inner, a),
      large = b - a > 180 ? 1 : 0;
    return p(
      `M${s}A${outer} ${outer} 0 ${large} 1 ${e}L${ii}A${inner} ${inner} 0 ${large} 0 ${jj}Z`,
      fill,
      '#000',
      gap,
    );
  }
  function ticks(x, y, rr, start = 0, end = 360, count = 48) {
    return Array.from({ length: count }, (_, i) => {
      const a = start + ((end - start) * i) / count,
        s = pt(x, y, rr, a),
        e = pt(x, y, rr + (i % 4 ? 5 : 12), a);
      return l(...s, ...e, c[2], i % 4 ? 1 : 2);
    }).join('');
  }
  function grid(x, y, w, h, cols = 10, rows = 6) {
    let out = '';
    for (let i = 0; i <= cols; i++)
      out += l(x + (i * w) / cols, y, x + (i * w) / cols, y + h, c[2], 0.8, 'opacity=".32"');
    for (let j = 0; j <= rows; j++)
      out += l(x, y + (j * h) / rows, x + w, y + (j * h) / rows, c[2], 0.8, 'opacity=".32"');
    return out;
  }
  function stars(x, y, w, h, count = 100) {
    return Array.from({ length: count }, (_, i) =>
      circle(
        x + 4 + rng() * (w - 8),
        y + 4 + rng() * (h - 8),
        i % 19 === 0 ? 2.8 : 1.1,
        c[i % 4],
        c[i % 4],
        0,
      ),
    ).join('');
  }
  function bracket(x, y, w, h, color = c[0], size = 23) {
    const curve = Math.min(8, size, w / 4, h / 4);
    return p(
      `M${x} ${y + size}V${y + curve}Q${x} ${y} ${x + curve} ${y}H${x + size} M${x + w - size} ${y}H${x + w - curve}Q${x + w} ${y} ${x + w} ${y + curve}V${y + size} M${x + w} ${y + h - size}V${y + h - curve}Q${x + w} ${y + h} ${x + w - curve} ${y + h}H${x + w - size} M${x + size} ${y + h}H${x + curve}Q${x} ${y + h} ${x} ${y + h - curve}V${y + h - size}`,
      'none',
      color,
      6,
      'data-bracket="true"',
    );
  }
  function numbers(x, y, w, rows = 8, cols = 5, size = 17) {
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) =>
        t(
          x + (col * w) / cols,
          y + row * (size + 8),
          String(Math.floor(rng() * 899999 + 100000)).slice(0, 3 + (col % 4)),
          size,
          c[(row + col) % 4],
        ),
      ).join(''),
    ).join('');
  }
  function bank(x, y, w, labels, paired = true) {
    return labels
      .map((label, i) => {
        const yy = y + i * 43,
          half = w * 0.47;
        return (
          r(x, yy, w, 38, c[i % 4], 19) +
          (paired ? r(x + half, yy, 3, 38, '#000') : '') +
          t(x + 15, yy + 26, label, 19, '#000') +
          (paired
            ? t(x + w - 13, yy + 26, String(4710 + i * 137), 18, '#000', 'text-anchor="end"')
            : '')
        );
      })
      .join('');
  }
  function frame(x, y, w, h, mirror = false, color = c[0], rail = 42) {
    const curve = Math.min(24, h * 0.18),
      top = Math.min(19, h * 0.22),
      outer = Math.min(54, h * 0.36);
    const inner = rail + curve;
    const shape = p(
      `M${outer} 0H${w}V${top}H${inner}Q${rail} ${top} ${rail} ${top + curve}V${h - top - curve}Q${rail} ${h - top} ${inner} ${h - top}H${w}V${h}H${outer}Q0 ${h} 0 ${h - outer}V${outer}Q0 0 ${outer} 0Z`,
      color,
      color,
      0,
      'data-frame="true"',
    );
    const seams =
      h > 160 ? l(0, 76, rail, 76, '#000', 3) + l(0, h - 76, rail, h - 76, '#000', 3) : '';
    return g(
      shape + seams,
      `transform="translate(${mirror ? x + w : x} ${y})${mirror ? ' scale(-1 1)' : ''}"`,
    );
  }
  function core(x, y, w, h, kind = 0) {
    let out = '';
    const cx = x + w / 2;
    out += p(`M${x} ${y}H${x + w}L${x + w * 0.78} ${y + 32}H${x + w * 0.22}Z`, c[3], c[3], 0);
    out += p(
      `M${x + w * 0.22} ${y + h - 32}H${x + w * 0.78}L${x + w} ${y + h}H${x}Z`,
      c[3],
      c[3],
      0,
    );
    for (let i = 0; i < 4; i++)
      out +=
        l(x + i * 5, y + i * 6 + 4, x + w - i * 5, y + i * 6 + 4, '#000', 1) +
        l(x + i * 5, y + h - i * 6 - 4, x + w - i * 5, y + h - i * 6 - 4, '#000', 1);
    for (let i = 0; i < 10; i++) {
      const hh = (h - 76) / 10,
        yy = y + 38 + i * hh;
      out += g(
        r(x + w * 0.15, yy, w * 0.7, hh - 3, c[(i + kind) % 4], hh / 2) +
          l(cx, yy, cx, yy + hh - 3, '#000', 2),
        `class="pulse" style="--delay:${i * -0.23}s"`,
      );
    }
    out +=
      r(x + w * 0.05, y + h / 2 - 23, w * 0.9, 46, c[0], 10) +
      circle(cx, y + h / 2, 30, '#000', '#000', 3) +
      circle(cx, y + h / 2, 21, c[3], c[3], 1);
    return out;
  }
  function signature(x, y, w, h, kind) {
    let out = l(x, y + h / 2, x + w, y + h / 2, c[2], 1);
    const count = kind === 3 ? 75 : 45;
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1),
        z = (u - 0.5) * 2;
      const amp =
        kind === 0
          ? 1 - Math.abs(z)
          : kind === 1
            ? Math.exp(-(((u - 0.3) / 0.12) ** 2)) + Math.exp(-(((u - 0.7) / 0.12) ** 2))
            : kind === 2
              ? Math.exp(-u * 3) * Math.abs(Math.sin(u * 12))
              : kind === 3
                ? (1 - Math.abs(z)) * (0.5 + 0.5 * Math.abs(Math.sin(u * 18)))
                : Math.exp(-z * z * 4) * Math.abs(Math.sin(u * 21));
      const hh = 8 + amp * (h * 0.44),
        xx = x + u * w;
      out += g(
        l(xx, y + h / 2 - hh, xx, y + h / 2 + hh, c[kind === 4 ? 2 : 0], kind === 3 ? 3 : 5),
        `class="amplitude" style="transform-origin:${xx}px ${y + h / 2}px;--delay:${i * -0.07}s"`,
      );
    }
    return out;
  }
  function wave(x, y, w, h, kind) {
    const pts = Array.from({ length: 100 }, (_, i) => {
      const u = i / 99;
      const z =
        kind === 0
          ? Math.sin(u * 7) * 0.37
          : kind === 1
            ? Math.sin(u * 29) * Math.exp(-u * 3) * 0.43
            : Math.sin(u * (10 + kind * 3)) * 0.18 + Math.cos(u * 4) * 0.17;
      return `${n(x + u * w)},${n(y + h * 0.5 - z * h)}`;
    }).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${c[kind % 4]}" stroke-width="3" class="trace"/>`;
  }
  let out = '';
  if (familyId === 'radial') {
    // Adjacent sectors and rings share their boundaries. The black stroke sets
    // the same linear gap in both directions, independent of ring radius.
    const gap = 6;
    const cx = v === 3 ? 340 : 400,
      cy = v === 1 ? 325 : 235;
    if (v === 0 || v === 3) {
      for (let ring = 0; ring < 3; ring++)
        for (let i = 0; i < 8; i++) {
          const a = -160 + i * 40 + (ring === 2 ? 8 : 0),
            b = a + 40,
            inner = 55 + ring * 39,
            outer = inner + 39;
          out += sector(cx, cy, inner, outer, a, b, c[(i + ring) % 4], gap);
          const q = pt(cx, cy, (inner + outer) / 2, (a + b) / 2);
          out += center(q[0], q[1] + 5, String(110 + i * 17 + ring * 31), 14, '#000');
        }
      out +=
        circle(cx + (v === 3 ? 26 : 0), cy, 45, 'none', c[2], 2) +
        l(cx - 36, cy, cx + 36, cy) +
        l(cx, cy - 36, cx, cy + 36);
      out +=
        t(610, 100, 'AZIMUTH', 19) + t(610, 146, '047.21', 35, c[3]) + t(610, 185, 'RANGE 8.4', 17);
    } else if (v === 1) {
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 7; i++) {
          const a = 188 + i * 23;
          out += sector(cx, cy, 75 + row * 37, 112 + row * 37, a, a + 23, c[(row + i) % 4], gap);
        }
      out +=
        ticks(cx, cy, 188, 185, 355, 36) +
        center(cx, cy + 16, 'COURSE 047', 28, c[3]) +
        l(180, 364, 620, 364, c[1], 4);
    } else if (v === 2) {
      for (let i = 0; i < 4; i++) {
        out += sector(cx, cy, 90, 174, i * 90, (i + 1) * 90, c[i], gap);
        out += sector(cx, cy, 55, 90, i * 90, (i + 1) * 90, c[(i + 1) % 4], gap);
        const q = pt(cx, cy, 133, i * 90 + 44);
        out += center(q[0], q[1], `Q${i + 1}`, 21, '#000');
      }
      out += bracket(cx - 38, cy - 38, 76, 76, c[2], 14);
    } else {
      for (let side = 0; side < 2; side++)
        for (let i = 0; i < 5; i++)
          out += sector(
            cx,
            cy,
            108,
            160,
            side * 180 + 20 + i * 27,
            side * 180 + 47 + i * 27,
            c[(side + i) % 4],
            gap,
          );
      out +=
        ticks(cx, cy, 170) +
        l(180, cy, 620, cy, c[2], 1) +
        l(cx, 70, cx, 400, c[2], 1) +
        center(cx, 240, '047', 38, c[3]) +
        bank(42, 169, 122, ['A1', 'B2', 'C3'], false) +
        bank(638, 169, 122, ['D4', 'E5', 'F6'], false);
    }
  } else if (familyId === 'space-map') {
    out = grid(50, 75, 700, 310, 10, 6) + stars(50, 75, 700, 310, v === 4 ? 220 : 110);
    for (let i = 0; i < 6; i++) out += t(53 + i * 116, 66, String(1000 + i * 471), 13);
    if (v === 0)
      out +=
        bracket(395, 170, 150, 115, c[3], 21) +
        t(560, 198, 'SECTOR 47', 23, c[3]) +
        t(560, 225, 'X 128.04', 17) +
        t(560, 250, 'Y 072.91', 17);
    if (v === 1) {
      out += p('M92 329L310 227L472 257L700 115', 'none', c[3], 3);
      for (const [i, q] of [
        [92, 329],
        [310, 227],
        [472, 257],
        [700, 115],
      ].entries())
        out += circle(...q, 8, c[0], c[0], 0) + t(q[0] + 13, q[1] - 14, `WP ${i + 1}`, 15);
      out += p('M72 301L305 194L478 223L683 84 M109 357L310 261L475 290L724 148', 'none', c[1], 1);
    }
    if (v === 2)
      for (const [cx, cy, rr] of [
        [256, 233, 90],
        [554, 217, 70],
      ]) {
        out += circle(cx, cy, rr) + circle(cx, cy, rr * 0.55) + circle(cx, cy, 9, c[3], c[3]);
        out += t(cx - rr, cy + rr + 23, `SYSTEM ${cx}`, 18);
      }
    if (v === 3) {
      out += l(400, 75, 400, 385, c[1], 5) + l(50, 230, 750, 230, c[1], 5);
      for (let i = 0; i < 4; i++)
        out +=
          r(60 + (i % 2) * 350, 84 + Math.floor(i / 2) * 155, 72, 26, c[i], 13) +
          t(71 + (i % 2) * 350, 103 + Math.floor(i / 2) * 155, `FIELD ${i + 1}`, 14, '#000');
    }
    if (v === 4) {
      out +=
        r(540, 92, 194, 153, '#000') +
        bracket(540, 92, 194, 153, c[0], 25) +
        stars(552, 104, 169, 125, 35) +
        bracket(250, 227, 80, 67, c[3], 14) +
        vector(330, 227, 540, 92, c[3]) +
        t(548, 271, 'DETAIL / 8X', 18, c[3]);
    }
  } else if (familyId === 'boundary') {
    out = grid(50, 70, 700, 325) + stars(50, 70, 700, 325, 105);
    if (v === 0) {
      out +=
        p('M50 70H420Q530 210 535 395H50Z', c[1], c[1], 0, 'opacity=".2"') +
        p('M420 70Q530 210 535 395', 'none', c[3], 3);
      for (let i = 0; i < 24; i++) {
        const u = i / 23,
          xx = (1 - u) ** 2 * 420 + 2 * (1 - u) * u * 530 + u * u * 535,
          yy = 70 + u * 325;
        out += l(xx, yy, xx + 9, yy - 3, c[3], 1);
      }
      out += center(240, 229, 'SURVEY REGION A', 30, c[3]) + t(562, 282, 'OUTER FIELD', 24);
    }
    if (v === 1) {
      out +=
        p('M125 395L540 70H650L230 395Z', c[2], c[2], 0, 'opacity=".18"') +
        p('M125 395L540 70 M230 395L650 70', 'none', c[3], 3);
      for (let i = 0; i < 24; i++)
        out += l(125 + i * 18, 395 - i * 14, 136 + i * 18, 401 - i * 14, c[3]);
      out += t(325, 242, 'TRANSIT', 28, c[3]);
    }
    if (v === 2) {
      out += `<ellipse cx="400" cy="232" rx="195" ry="130" fill="${c[1]}" fill-opacity=".17" stroke="${c[3]}" stroke-width="3"/>`;
      for (let i = 0; i < 48; i++) {
        const a = (i * Math.PI) / 24;
        out += l(
          400 + Math.cos(a) * 197,
          232 + Math.sin(a) * 132,
          400 + Math.cos(a) * 209,
          232 + Math.sin(a) * 143,
          c[3],
        );
      }
      out += center(400, 243, 'EXCLUSION / 047', 29, c[3]);
    }
    if (v === 3) {
      out +=
        p('M50 70H580V144H486V223H348V305H248V395H50Z', c[1], c[1], 0, 'opacity=".22"') +
        p('M580 70V144H486V223H348V305H248V395', 'none', c[3], 3);
      for (let i = 0; i < 9; i++)
        out += l(248 + i * 35, 390 - i * 28, 258 + i * 35, 390 - i * 28, c[3], 2);
      out += t(93, 201, 'SECTOR B', 33, c[3]) + t(546, 336, 'SECTOR C', 29);
    }
    if (v === 4) {
      for (let i = 0; i < 3; i++) {
        out += p(`M${270 + i * 125} 70Q${340 + i * 125} 236 ${285 + i * 125} 395`, 'none', c[i], 3);
        out += t(90 + i * 180, 238, `BAND ${i + 1}`, 25, c[i]);
      }
    }
  } else if (familyId === 'reticle') {
    out = grid(70, 75, 660, 315, 12, 6) + stars(70, 75, 660, 315, 35);
    if (v === 0)
      out +=
        bracket(285, 126, 230, 210, c[0], 40) +
        bracket(333, 174, 134, 114, c[2], 15) +
        l(380, 231, 420, 231, c[3], 2) +
        l(400, 211, 400, 251, c[3], 2) +
        t(534, 150, 'LOCK 047', 21, c[3]);
    if (v === 1) {
      for (let i = 0; i < 4; i++) out += sector(400, 231, 101, 112, i * 90 + 8, i * 90 + 71, c[i]);
      out +=
        ticks(400, 231, 129) +
        circle(400, 231, 7, c[3], c[3]) +
        center(400, 402, 'AZ 274 / EL 031', 21);
    }
    if (v === 2) {
      out +=
        bracket(160, 112, 153, 160, c[0], 26) +
        bracket(488, 230, 160, 122, c[1], 26) +
        vector(237, 194, 568, 291, c[3]) +
        t(349, 263, '4.71 LY', 25, c[3]);
    }
    if (v === 3) {
      out += r(225, 131, 350, 202, 'none', 0, `stroke="${c[3]}" stroke-width="2"`);
      for (const x of [225, 400, 575])
        for (const y of [131, 333]) out += r(x - 5, y - 5, 10, 10, c[0]);
      out +=
        vector(225, 107, 575, 107, c[2]) +
        center(400, 96, '350 / SAMPLE WIDTH', 17) +
        vector(606, 131, 606, 333) +
        t(621, 241, '202', 23);
    }
    if (v === 4) {
      const pts = [
        [210, 115],
        [618, 142],
        [367, 367],
      ];
      for (let i = 0; i < 3; i++) {
        out +=
          circle(...pts[i], 14, '#000', c[i], 3) +
          vector(...pts[i], 410, 231, c[i]) +
          t(pts[i][0] + 23, pts[i][1] - 15, `REF ${i + 1}`, 17);
      }
      out += p('M382 208L437 208L452 236L414 267L376 238Z', 'none', c[3], 3);
    }
  } else if (familyId === 'engine') {
    if (v === 0)
      out =
        core(315, 70, 170, 334) +
        numbers(72, 140, 188, 7, 2) +
        t(539, 210, 'FIELD', 22) +
        t(539, 258, '98.47', 42, c[3]) +
        t(539, 288, 'CONTAINMENT / SIM', 16);
    if (v === 1)
      out =
        core(195, 77, 140, 318) +
        core(465, 77, 140, 318, 1) +
        l(335, 236, 465, 236, c[0], 24) +
        r(370, 212, 60, 48, c[1], 9) +
        center(400, 242, 'LINK', 18, '#000');
    if (v === 2)
      out =
        g(core(315, 70, 170, 334), 'transform="translate(636 -164) rotate(90)"') +
        t(90, 102, 'LONGITUDINAL DRIVE', 26, c[3]) +
        numbers(120, 360, 540, 2, 6, 15);
    if (v === 3) {
      for (let i = 0; i < 12; i++)
        out += sector(400, 235, 90, 142, i * 30 + 3, i * 30 + 27, c[i % 4]);
      for (let i = 0; i < 8; i++) {
        const a = i * 45,
          s = pt(400, 235, 146, a),
          e = pt(400, 235, 174, a);
        out += l(...s, ...e, c[2], 14);
      }
      out +=
        circle(400, 235, 53, 'none', c[3], 4) +
        l(82, 235, 222, 235, c[0], 15) +
        l(577, 235, 715, 235, c[1], 15) +
        center(400, 242, 'CORE 47', 24, c[3]);
    }
    if (v === 4) {
      for (let i = 0; i < 3; i++) {
        out += core(146 + i * 205, 157 - i * 28, 90 + i * 34, 170 + i * 45, i);
        if (i < 2) out += l(236 + i * 205, 242, 351 + i * 205, 242, c[0], 12);
      }
      out += t(87, 100, 'THREE-STAGE CONVERSION', 26, c[3]);
    }
  } else if (familyId === 'conduit') {
    const paths = [
      'M120 320H465Q530 320 530 255V120H680',
      'M120 235H370V115H680 M370 235H680 M370 235V355H680',
      'M166 135H610Q700 135 700 235Q700 335 610 335H166Q85 335 85 235Q85 135 166 135Z',
      'M95 235H700 M400 87V383',
      'M100 355H267Q304 355 304 318V253Q304 216 342 216H469Q507 216 507 178V138Q507 101 544 101H703',
    ];
    out =
      p(paths[v], 'none', c[0], 24, 'stroke-linejoin="round"') +
      p(paths[v], 'none', c[3], 9, 'class="flow" stroke-dasharray="25 70" stroke-linejoin="round"');
    if (v === 3) out += r(355, 190, 90, 90, '#000', 12) + circle(400, 235, 31, 'none', c[2], 13);
    out += t(72, 66, 'TRANSFER / SIMULATED ENERGY ROUTE', 23, c[3]);
    for (let i = 0; i < (v === 1 ? 3 : 2); i++)
      out += t(610, 105 + i * 120, `OUT ${i + 1}`, 17, c[2]);
  } else if (familyId === 'manifold') {
    if (v === 0) {
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++)
          out += g(
            r(234 + col * 83, 108 + row * 147, 72, 109, c[(col + row) % 4], 34),
            `class="pulse" style="--delay:${col * -0.4}s"`,
          );
        out +=
          l(218, 153 + row * 147, 568, 153 + row * 147, '#000', 5) +
          l(218, 171 + row * 147, 568, 171 + row * 147, '#000', 5) +
          r(209, 138 + row * 147, 6, 51, c[3]) +
          r(573, 138 + row * 147, 6, 51, c[3]);
      }
      out += r(374, 218, 44, 32, c[2], 8);
    }
    if (v === 1) {
      for (let i = 0; i < 8; i++)
        out += g(r(370, 64, 60, 93, c[i % 4], 30), `transform="rotate(${i * 45} 400 235)"`);
      out += circle(400, 235, 63, 'none', c[3], 17) + center(400, 242, 'INJECTOR', 20, c[2]);
    }
    if (v === 2) {
      out += r(76, 151, 646, 12, c[0]) + r(76, 308, 646, 12, c[0]);
      for (let i = 0; i < 10; i++) {
        const x = 90 + i * 63;
        out +=
          g(
            r(x, 170, i % 2 ? 37 : 52, 130, c[i % 4], 18),
            `class="pulse" style="--delay:${i * -0.2}s"`,
          ) + l(x + 16, 166, x + 16, 306, '#000', 2);
      }
    }
    if (v === 3) {
      out += r(139, 80, 16, 319, c[1]);
      for (let row = 0; row < 3; row++) {
        out += l(155, 126 + row * 111, 680, 126 + row * 111, c[0], 11);
        for (let i = 0; i < 5; i++)
          out += r(247 + i * 80, 88 + row * 111, 53, 79, c[(i + row) % 4], 25);
      }
    }
    if (v === 4) {
      out += r(165, 80, 470, 16, c[0]) + r(165, 382, 470, 16, c[0]);
      for (let i = 0; i < 3; i++) {
        const h = 165 + i * 45;
        out +=
          r(232 + i * 128, 380 - h, 85, h, c[i], 40) +
          l(273 + i * 128, 96, 273 + i * 128, 380 - h, c[3], 9) +
          center(274.5 + i * 128, 350, `R-${i + 1}`, 23, '#000');
      }
    }
  } else if (familyId === 'signature') {
    out = bracket(80, 83, 640, 302, c[1], 30);
    if (v === 4)
      out +=
        signature(116, 111, 568, 104, 0) +
        signature(116, 256, 568, 104, 4) +
        t(108, 239, 'BAND A / BAND B', 16);
    else
      out +=
        signature(115, 112, 570, 245, v) +
        t(
          116,
          411,
          `SAMPLE 047 / ENVELOPE ${['IMPULSE', 'BIMODAL', 'DECAY', 'MODULATED'][v]}`,
          20,
          c[3],
        );
  } else if (familyId === 'curve') {
    out = grid(76, 78, 650, 310, 10, 6) + l(76, 388, 726, 388, c[3], 2);
    if (v === 0)
      out +=
        p('M91 368Q173 120 676 110 M96 120Q390 149 696 362', 'none', c[2], 3) +
        r(331, 203, 12, 12, c[3]) +
        l(337, 80, 337, 384, c[1], 1) +
        t(363, 191, 'CROSSOVER 47.2', 20, c[3]);
    if (v === 1)
      out +=
        wave(84, 96, 631, 284, 1) +
        l(84, 238, 715, 238, c[3], 1) +
        t(527, 119, 'SETTLE 8.4 MS', 21, c[3]);
    if (v === 2) {
      const pts = Array.from(
        { length: 161 },
        (_, i) =>
          `${n(400 + Math.sin((i * Math.PI) / 80) * 247)},${n(235 + Math.sin((i * Math.PI) / 40 + 0.4) * 124)}`,
      ).join(' ');
      out +=
        `<polyline points="${pts}" fill="none" stroke="${c[0]}" stroke-width="3" class="trace"/>` +
        center(400, 418, 'PHASE / RESPONSE', 20);
    }
    if (v === 3)
      for (let i = 0; i < 3; i++)
        out += wave(92, 90 + i * 98, 610, 90, i) + t(80, 111 + i * 98, `CH${i + 1}`, 15, c[i]);
    if (v === 4)
      out +=
        p('M84 361H197V311H310V262H423V212H536V162H705', 'none', c[0], 4) +
        p('M85 352Q307 376 405 226T704 111', 'none', c[2], 3) +
        l(84, 212, 706, 212, c[1], 1) +
        t(528, 196, 'THRESHOLD 062', 18, c[3]);
    for (let i = 0; i < 6; i++) out += t(79 + i * 125, 410, `${i * 20}`, 14);
  } else if (familyId === 'matrix') {
    const cols = v === 1 ? 12 : 20,
      rows = v === 1 ? 10 : v === 2 ? 7 : 6,
      cw = 650 / cols,
      ch = 292 / rows;
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const active =
          v === 4
            ? Math.abs(col - row * 2 - 3) < 3
            : v === 2
              ? col < (row * 3 + 7) % cols
              : rng() > 0.52;
        out += r(
          86 + col * cw,
          88 + row * ch,
          cw - 3,
          ch - 3,
          active ? c[(row + Math.floor(col / 5)) % 4] : '#090d14',
          0,
          `stroke="${c[2]}" stroke-width=".5"${active ? ' class="cell"' : ''}`,
        );
      }
    if (v === 3) out += r(397, 84, 20, 300, '#000') + t(401, 73, 'ADDR', 12);
    out += g(l(86, 76, 86, 388, c[3], 3), 'class="cursor"');
    for (let i = 0; i < 10; i++)
      out +=
        l(86 + i * 65, 69, 86 + i * 65, 80, c[0], 1) +
        t(84 + i * 65, 60, String(i * 16).padStart(3, '0'), 13);
    for (let i = 0; i < rows; i++)
      out += t(44, 106 + i * ch, `${i + 1}`.padStart(2, '0'), 15, c[3]);
  }
  if (familyId === 'numbers') {
    if (v === 0) out = numbers(69, 91, 672, 12, 6, 20);
    if (v === 1)
      for (let block = 0; block < 3; block++) {
        for (let row = 0; row < 4; row++)
          out += circle(88, 105 + block * 111 + row * 21, 5, c[block], c[block], 0);
        out += numbers(119, 111 + block * 111, 594, 4, 5, 15);
      }
    if (v === 2) {
      out = numbers(78, 88, 291, 13, 4, 17) + numbers(444, 88, 288, 13, 4, 17);
      for (let i = 0; i < 13; i++) out += r(392, 75 + i * 25, 10, 10, c[i % 4]);
    }
    if (v === 3)
      for (let i = 0; i < 11; i++)
        out +=
          r(76, 72 + i * 30, 94, 24, c[i % 4], 12) +
          center(123, 90 + i * 30, `A${String(i * 64).padStart(4, '0')}`, 14, '#000') +
          t(
            194,
            91 + i * 30,
            `${Math.floor(rng() * 8e8 + 1e8)}   ${Math.floor(rng() * 8e8 + 1e8)}   ${Math.floor(rng() * 8e8 + 1e8)}`,
            21,
            c[i % 4],
          );
    if (v === 4)
      for (let row = 0; row < 13; row++) {
        if (row === 4 || row === 9) continue;
        out += t(62, 91 + row * 24, `0${row + 1}`, 16, c[3]);
        for (let col = 0; col < 6; col++) {
          if ((row + col) % 5 === 0) continue;
          out += t(
            110 + col * 104,
            91 + row * 24,
            String(Math.floor(rng() * 899999 + 100000)),
            18,
            c[(col + row) % 4],
          );
        }
        if (row === 6) out += l(62, 100 + row * 24, 733, 100 + row * 24, c[1], 3);
      }
  } else if (familyId === 'metrics') {
    const vals = ['98.47', '1200', '008', '47.216'];
    if (v === 0)
      for (let i = 0; i < 3; i++)
        out +=
          r(94, 84 + i * 108, 90, 70, c[i], 0) +
          t(110, 132 + i * 108, ['CORE', 'FLOW', 'BIAS'][i], 24, '#000') +
          t(222, 146 + i * 108, vals[i], 67, c[3]) +
          t(470, 142 + i * 108, ['GW', 'CM³', 'mV'][i], 29, c[2]) +
          l(219, 160 + i * 108, 703, 160 + i * 108, c[i], 3);
    if (v === 1)
      for (let i = 0; i < 4; i++)
        out +=
          r(78, 85 + i * 78, 191, 51, c[i], 25) +
          t(95, 122 + i * 78, ['ALPHA', 'BETA', 'GAMMA', 'DELTA'][i], 23, '#000') +
          t(303, 128 + i * 78, vals[i], 44, c[i]) +
          r(511, 85 + i * 78, 208, 51, c[(i + 1) % 4]) +
          t(529, 120 + i * 78, `REF 47-${i + 1}`, 22, '#000');
    if (v === 2) {
      out = frame(80, 66, 632, 340, true, c[1], 48);
      for (let i = 0; i < 3; i++)
        out +=
          t(107, 148 + i * 94, ['OUTPUT / GW', 'VELOCITY / C', 'SAMPLE / N'][i], 19, c[2]) +
          t(379, 165 + i * 94, vals[i], 58, c[3]) +
          r(615, 117 + i * 94, 12, 54, c[i]);
    }
    if (v === 3)
      for (let i = 0; i < 3; i++)
        out +=
          t(116, 144 + i * 108, ['COORDINATE X', 'COORDINATE Y', 'COORDINATE Z'][i], 20) +
          t(378, 159 + i * 108, String(47 + i * 81), 65, c[i]) +
          t(509, 155 + i * 108, `.${216 + i * 131}`, 33, c[3]) +
          l(110, 174 + i * 108, 691, 174 + i * 108, c[i], 3);
    if (v === 4)
      for (let i = 0; i < 4; i++)
        out +=
          t(58 + i * 182, 158, ['LOAD', 'FIELD', 'BIAS', 'RANGE'][i], 22, c[i]) +
          t(58 + i * 182, 239, vals[i], 42, c[3]) +
          t(58 + i * 182, 279, ['GW', 'CM³', 'mV', 'LY'][i], 22) +
          r(55 + i * 182, 313, 174, 21, c[i], i === 0 ? 10 : 0);
  } else if (familyId === 'register') {
    const headers = [
      ['FILENAME', 'SIZE', 'TYPE', 'MODIFIED'],
      ['TIME / UTC', 'SECTOR', 'MAG', 'STATUS'],
      ['ASSEMBLY', 'OUTPUT', 'TOL', 'STATE'],
      ['ROUTE', 'CARGO', 'DEST', 'ARRIVAL'],
      ['CHANNEL', 'MHZ', 'SEC', 'QUALITY'],
    ][v];
    const names = [
      ['DEEP FIELD 047', 'OUTER SURVEY', 'SPECTRAL PLATE', 'RELAY NOTES', 'SECTOR MAP'],
      ['12:04:17', '12:08:24', '12:12:05', '12:19:41', '12:24:32'],
      ['PRIMARY CORE', 'THERMAL LOOP', 'AUXILIARY BUS', 'FIELD COIL', 'RESERVE CELLS'],
      ['HELIX / A7', 'KESTREL / B2', 'ORBITAL / C9', 'SURVEY / D4', 'COAST / E3'],
      ['RELAY ALPHA', 'REFERENCE B', 'DEEP ARRAY', 'SURFACE LINK', 'BAND DELTA'],
    ][v];
    const xs = [67, 398, 515, 614];
    headers.forEach((s, i) => (out += t(xs[i], 94, s, 19, c[0])));
    out += l(63, 108, 727, 108, c[1], 3);
    for (let row = 0; row < 10; row++) {
      const yy = 136 + row * 26,
        sel = row === v + 1;
      if (sel) out += r(62, yy - 19, 655, 24, c[1], 0, 'fill-opacity=".18"');
      out += t(xs[0], yy, names[row % 5] + (v === 0 ? ` / ${row + 1}` : ''), 17, sel ? c[3] : c[2]);
      out +=
        t(xs[1], yy, String(128 + row * 47) + (v === 0 ? ' MB' : ''), 17) +
        t(
          xs[2],
          yy,
          v === 0 ? ['IMAGE', 'TEXT', 'DATA'][row % 3] : ['2.4', '0.8', '6.2'][row % 3],
          17,
        ) +
        t(
          xs[3],
          yy,
          v === 0 ? '09/30' : v === 3 ? '14:47' : ['READY', 'HOLD', 'SYNC'][row % 3],
          17,
          c[row % 4],
        );
    }
    out +=
      r(739, 120, 5, 273, c[1], 2, 'opacity=".35"') +
      r(739, 147 + v * 24, 5, 57, c[3], 2) +
      bank(67, 408, 291, ['OPEN / SELECTED'], false);
  } else if (familyId === 'status') {
    const labels = [
      'SUBSPACE LINK / ONLINE',
      'ARRAY ALIGNMENT / TRACKING',
      'QUANTUM MEMORY / STABLE',
      'OPTICAL NETWORK / REROUTING',
      'RESERVE SYSTEM / STANDBY',
    ];
    if (v === 0)
      labels.forEach(
        (label, i) =>
          (out +=
            r(111, 99 + i * 62, 27, 14, c[i % 4], 8) + t(164, 115 + i * 62, label, 23, c[i % 4])),
      );
    if (v === 1)
      labels.forEach(
        (label, i) =>
          (out +=
            r(185, 90 + i * 64, 18, 18, c[i % 4]) +
            t(228, 107 + i * 64, `SYS-${47 + i} / ${label.split(' / ')[1]}`, 27, c[i % 4]) +
            l(181, 128 + i * 64, 656, 128 + i * 64, c[1], 1)),
      );
    if (v === 2) {
      out = t(91, 99, 'PRIMARY', 29, c[0]) + t(438, 99, 'RESERVE', 29, c[1]);
      for (let i = 0; i < 4; i++)
        for (let col = 0; col < 2; col++)
          out +=
            r(91 + col * 347, 135 + i * 61, 19, 19, c[(i + col) % 4], col ? 0 : 9) +
            t(
              125 + col * 347,
              155 + i * 61,
              `BANK ${i + 1} / ${col ? 'STANDBY' : 'READY'}`,
              21,
              c[(i + col) % 4],
            );
    }
    if (v === 3) {
      for (let i = 0; i < 4; i++) {
        out +=
          (i === 0 || i === 3
            ? endcap(62 + i * 172, 165, 168, 94, c[i], i === 0 ? 'left' : 'right')
            : r(62 + i * 172, 165, 168, 94, c[i])) +
          center(146 + i * 172, 203, ['LINK', 'MEMORY', 'ARRAY', 'CORE'][i], 21, '#000') +
          center(146 + i * 172, 237, ['ONLINE', 'STABLE', 'TRACKING', 'NOMINAL'][i], 18, '#000');
      }
      out +=
        l(65, 301, 744, 301, c[2], 3) +
        t(67, 333, 'SYSTEM READY / ALL FOUR CHANNELS REPORTING', 23, c[3]);
    }
    if (v === 4) {
      out +=
        r(94, 93, 612, 90, c[0], 17) +
        t(119, 130, 'ATTENTION / OPTICAL NETWORK', 26, '#000') +
        t(119, 161, 'REROUTING TO AUXILIARY CHANNEL', 19, '#000');
      for (let i = 0; i < 3; i++)
        out +=
          circle(111, 230 + i * 67, 8, c[i + 1], c[i + 1], 0) +
          t(142, 239 + i * 67, labels[i], 23, c[i + 1]);
    }
  } else if (familyId === 'controls') {
    if (v === 0) out = bank(151, 100, 498, ['SCAN', 'CALIBRATE', 'REFERENCE', 'TRANSMIT']);
    if (v === 1)
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 3; col++)
          out +=
            r(70 + col * 231, 131 + row * 119, 211, 78, c[(col + row) % 4], 39) +
            center(
              175 + col * 231,
              181 + row * 119,
              ['SCAN', 'RANGE', 'MODE', 'HOLD', 'RESET', 'SEND'][row * 3 + col],
              25,
              '#000',
            );
    if (v === 2)
      for (let i = 0; i < 4; i++) {
        const inset = [0, 105, 210, 105][i];
        out +=
          r(123 + inset, 91 + i * 74, 557 - inset, 59, c[i], 29) +
          t(
            147 + inset,
            130 + i * 74,
            ['REFERENCE', 'SAMPLE', 'CALIBRATE', 'INITIALIZE'][i],
            24,
            '#000',
          ) +
          r(466, 91 + i * 74, 3, 59, '#000') +
          t(494, 130 + i * 74, `0${i + 1}`, 24, '#000');
      }
    if (v === 3) {
      out = r(64, 179, 672, 86, c[1], 43);
      for (let i = 1; i < 5; i++) out += r(64 + i * 134, 179, 3, 86, '#000');
      for (let i = 0; i < 5; i++)
        out += center(131 + i * 134, 231, ['SCAN', 'LOCK', 'SAVE', 'RESET', 'SEND'][i], 25, '#000');
      out += t(84, 147, 'ACQUISITION COMMANDS', 20, c[0]);
    }
    if (v === 4)
      out =
        t(95, 134, 'ACQUISITION', 22, c[0]) +
        t(455, 134, 'OUTPUT', 22, c[1]) +
        bank(89, 165, 284, ['SCAN', 'HOLD'], true) +
        bank(447, 165, 267, ['SAVE', 'SEND'], true);
  } else if (familyId === 'navigation') {
    const labels =
      v === 0
        ? ['ZOOM IN', 'ZOOM OUT', 'ROTATE', 'OPEN', 'SEND']
        : v === 1
          ? ['STATUS', 'TRAJECTORY', 'SCAN', 'DISTANCE', 'OPERATIONS']
          : ['HOME', 'BACK', 'NEXT', 'SEARCH', 'RECENT'];
    const row = (x, y, w, label, i, mirror = false) =>
      r(x, y, 8, 44, c[i % 4]) +
      t(x + 26, y + 35, String([3, 72, 73, 74, 10][i]), 36, c[i % 4]) +
      r(x + 94, y, w - 94, 44, c[i % 4]) +
      t(x + 108, y + 29, label, 20, '#000');
    if (v === 0 || v === 1)
      labels.forEach(
        (label, i) =>
          (out += row(
            v === 1 ? 250 : 208,
            78 + i * (v === 1 ? 52 : 65),
            v === 1 ? 299 : 375,
            label,
            i,
          )),
      );
    if (v === 2) {
      labels
        .slice(0, 4)
        .forEach(
          (label, i) =>
            (out +=
              row(62, 98 + i * 68, 274, label, i) +
              row(466, 98 + i * 68, 274, labels[4 - i], 4 - i)),
        );
      out += l(402, 84, 402, 390, c[1], 2);
    }
    if (v === 3)
      for (let i = 0; i < 4; i++)
        out +=
          endcap(92, 100 + i * 77, 72, 56, c[i]) +
          center(128, 139 + i * 77, `0${i + 1}`, 29, '#000') +
          endcap(167, 100 + i * 77, 531, 56, c[(i + 1) % 4], 'right') +
          t(
            188,
            136 + i * 77,
            [
              'ACQUIRE REFERENCE',
              'ALIGN SENSOR ARRAY',
              'LOCK TRACKING VECTOR',
              'RECORD SAMPLE WINDOW',
            ][i],
            22,
            '#000',
          );
    if (v === 4) {
      out = t(173, 71, 'VIEW', 20, c[0]) + t(173, 295, 'TRANSFER', 20, c[1]);
      labels.forEach(
        (label, i) => (out += row(173, 90 + i * 53 + (i > 2 ? 65 : 0), 454, label, i)),
      );
    }
  } else if (familyId === 'elbow') {
    if (v === 0) out = frame(88, 80, 624, 321, false, c[0], 80);
    if (v === 1)
      out = frame(246, 67, 478, 150, true, c[1], 73) + frame(77, 220, 478, 185, false, c[0], 73);
    if (v === 2)
      out = frame(46, 91, 352, 296, true, c[2], 50) + frame(401, 91, 351, 296, false, c[1], 50);
    if (v === 3)
      out = frame(86, 80, 458, 124, false, c[0], 61) + frame(86, 207, 648, 195, false, c[1], 61);
    if (v === 4)
      out = frame(50, 70, 692, 340, false, c[0], 68) + frame(210, 169, 476, 193, true, c[1], 46);
    out += t(208, 253, 'RAIL / INNER TANGENT ALIGNED', 22, c[3]);
  } else if (familyId === 'bus') {
    if (v === 0)
      for (let row = 0; row < 2; row++) {
        let x = 69;
        for (const [i, w] of [96, 183, 68, 205, 111].entries()) {
          out += r(x, 169 + row * 45, w, 39, c[(i + row) % 4]);
          x += w + 3;
        }
      }
    if (v === 1) {
      out =
        r(68, 189, 661, 15, c[1]) +
        r(68, 230, 661, 15, c[2]) +
        r(343, 176, 114, 83, '#000') +
        r(355, 183, 90, 55, c[0]) +
        r(364, 192, 72, 37, '#000') +
        t(311, 284, 'BRIDGE 047', 24, c[3]);
    }
    if (v === 2) {
      for (let i = 0; i < 6; i++)
        out +=
          r(68 + i * 111, 167, 108, 54, c[i % 4]) +
          t(78 + i * 111, 204, `BUS-${i + 1}`, 23, '#000');
      out += l(68, 251, 731, 251, c[2], 4);
      for (let i = 0; i < 27; i++) out += l(68 + i * 25, 263, 68 + i * 25, i % 3 ? 272 : 284, c[3]);
    }
    if (v === 3)
      for (let i = 0; i < 5; i++)
        out +=
          r(91, 85 + i * 66, 534 - i * 49, 13, c[i % 4]) +
          r(637 - i * 49, 79 + i * 66, 12, 25, c[(i + 1) % 4]) +
          t(673 - i * 49, 98 + i * 66, String(47000 + i * 312), 20, c[i % 4]);
    if (v === 4)
      out =
        r(71, 211, 255, 39, c[0]) +
        p('M328 230H408V145H715 M408 230V315H715', 'none', c[1], 14) +
        r(694, 121, 32, 48, c[2]) +
        r(694, 291, 32, 48, c[3]) +
        t(73, 192, 'DISTRIBUTION', 23, c[3]);
  } else if (familyId === 'bracket') {
    if (v === 0)
      out = bracket(103, 91, 594, 305, c[0], 58) + t(250, 254, 'OPEN INSTRUMENT WINDOW', 26, c[2]);
    if (v === 1) {
      out = bracket(172, 78, 456, 328, c[1], 42);
      for (let i = 0; i < 5; i++)
        out += r(169, 120 + i * 45, 7, 41, c[i % 4]) + r(625, 120 + i * 45, 7, 41, c[(i + 1) % 4]);
      out += grid(207, 121, 388, 242);
    }
    if (v === 2) {
      out =
        r(124, 84, 552, 321, c[0], 28) +
        r(140, 101, 520, 234, '#000', 8) +
        grid(161, 119, 477, 196) +
        t(151, 380, 'M 6.89', 36, '#000') +
        t(518, 379, '18793.234', 20, '#000');
    }
    if (v === 3) {
      out =
        r(71, 160, 657, 157, c[1], 42) +
        r(107, 175, 583, 127, '#000', 9) +
        r(163, 158, 3, 161, '#000') +
        r(634, 158, 3, 161, '#000') +
        t(197, 248, 'LONG-BASELINE SENSOR VIEW', 26, c[2]);
    }
    if (v === 4)
      out =
        bracket(94, 78, 609, 328, c[0], 35) +
        p('M94 210V130Q94 78 149 78H388 M703 281V355Q703 406 651 406H433', 'none', c[1], 12) +
        grid(162, 129, 473, 224);
  } else if (familyId === 'schematic') {
    out = grid(70, 72, 660, 333, 12, 6);
    if (v === 0) {
      out = l(400, 92, 400, 382, c[0], 7);
      for (let i = 0; i < 4; i++) {
        const yy = 117 + i * 79;
        out +=
          l(164, yy, 636, yy, c[2], 3) +
          r(82, yy - 19, 135, 38, '#000', 0, `stroke="${c[1]}" stroke-width="2"`) +
          r(583, yy - 19, 135, 38, '#000', 0, `stroke="${c[1]}" stroke-width="2"`) +
          t(99, yy + 7, `IN ${i + 1}`, 19) +
          t(602, yy + 7, `OUT ${i + 1}`, 19) +
          circle(400, yy, 10, c[3], c[3], 0);
      }
    }
    if (v === 1) {
      out +=
        p('M105 115H678V159H166V203H678V247H166V291H678V335H105', 'none', c[0], 6) +
        p('M715 94H210V137H714V181H210V225H714V269H210V313H714V373H105', 'none', c[2], 3) +
        t(112, 391, 'COUNTERFLOW EXCHANGER', 18, c[3]);
    }
    if (v === 2) {
      for (const [i, q] of [
        [140, 131],
        [659, 142],
        [415, 365],
      ].entries())
        out +=
          bracket(q[0] - 27, q[1] - 20, 54, 40, c[i], 12) +
          vector(...q, 397, 232, c[i]) +
          t(q[0] - 22, q[1] - 37, `SENSOR ${i + 1}`, 15);
      out +=
        p('M345 200H448V265H345Z', 'none', c[3], 3) +
        l(365, 185, 365, 280, c[2], 1) +
        l(428, 185, 428, 280, c[2], 1);
    }
    if (v === 3) {
      for (let i = 0; i < 6; i++) {
        const x = 110 + i * 109,
          y = 113 + (i % 3) * 83;
        out +=
          r(x - 8, y - 8, 16, 16, c[i % 4]) +
          vectorPath(
            `M${x} ${y}H${x + 38}V${360 - i * 22}H${713 - i * 58}`,
            [x, y],
            [713 - i * 58, 360 - i * 22],
            c[i % 4],
          ) +
          t(x - 8, y - 20, `N${i + 1}`, 14, c[3]);
      }
    }
    if (v === 4) {
      for (let i = 0; i < 5; i++)
        out += vectorPath(
          `M94 ${128 + i * 48}L245 ${108 + i * 51}L460 ${126 + i * 47}L701 ${109 + i * 53}`,
          [94, 128 + i * 48],
          [701, 109 + i * 53],
          c[i % 4],
        );
      out +=
        r(377, 87, 16, 301, c[3]) +
        vector(393, 213, 680, 213, c[0]) +
        t(554, 197, 'PROBE / 427 M', 21, c[3]);
    }
  } else if (familyId === 'viewer') {
    const field = (x, y, w, h) =>
      r(x, y, w, h, '#040911') +
      stars(x, y, w, h, 190) +
      grid(x, y, w, h, 6, 4) +
      bracket(x, y, w, h, c[3], 19);
    if (v === 0)
      out =
        field(93, 87, 613, 299) +
        bracket(374, 187, 127, 109, c[0], 17) +
        t(96, 417, 'DEEP FIELD / ZOOM 8X / SYNTHETIC POINTS', 21);
    if (v === 1) {
      out = field(91, 92, 616, 291);
      for (let i = 0; i < 24; i++)
        out += r(100 + i * 25, 101, 14, 268, c[i % 4], 0, `opacity="${0.08 + (i % 5) * 0.05}"`);
      out += l(431, 81, 431, 395, c[0], 3) + t(104, 420, 'SPECTRAL PLATE / CURSOR 047', 22, c[3]);
    }
    if (v === 2) {
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 2; col++)
          out +=
            field(95 + col * 317, 86 + row * 166, 300, 151) +
            t(106 + col * 317, 111 + row * 166, `TILE ${row * 2 + col + 1}`, 16, c[3]);
      out += bracket(403, 77, 318, 335, c[0], 28);
    }
    if (v === 3)
      out =
        field(65, 100, 411, 282) +
        field(520, 125, 214, 217) +
        bracket(260, 191, 81, 73, c[0], 12) +
        vector(341, 191, 520, 125, c[0]) +
        vector(341, 264, 520, 342, c[0]) +
        t(525, 374, 'DETAIL / 16X', 22, c[3]);
    if (v === 4) {
      out =
        field(59, 143, 683, 179) +
        bracket(173, 172, 112, 111, c[0], 17) +
        bracket(540, 161, 134, 139, c[1], 17);
      for (let i = 0; i < 27; i++) out += l(66 + i * 25, 355, 66 + i * 25, i % 3 ? 363 : 372, c[3]);
      out += t(63, 410, 'STRIP 047 / CROSS-TRACK SELECTION', 22);
    }
  } else if (familyId === 'heading') {
    if (v === 0)
      out =
        r(73, 175, 654, 47, c[0], 23) +
        r(431, 169, 231, 60, '#000') +
        t(450, 214, 'SYSTEM 47', 42, c[2]) +
        l(678, 177, 678, 220, '#000', 5) +
        t(84, 264, 'PRIMARY OPERATIONS / REFERENCE 047', 22, c[3]);
    if (v === 1) {
      out =
        r(75, 182, 650, 47, c[2], 23) +
        r(100, 178, 123, 55, '#000') +
        t(112, 215, 'VIEWER', 35, c[3]);
      for (let i = 0; i < 3; i++)
        out +=
          r(456 + i * 84, 183, 80, 44, c[i]) +
          center(496 + i * 84, 212, ['MAX', 'MIN', 'CLOSE'][i], 18, '#000');
    }
    if (v === 2)
      out =
        t(711, 194, 'LONG RANGE SCAN', 49, c[2], 'text-anchor="end"') +
        t(711, 241, 'SCAN PARAMETERS 581257-365', 27, c[1], 'text-anchor="end"') +
        r(89, 279, 623, 13, c[0], 6);
    if (v === 3)
      out =
        t(90, 163, 'DEEP FIELD OBSERVATORY', 44, c[3]) +
        r(90, 190, 623, 49, c[1], 24) +
        t(111, 223, 'SPECTRAL ACQUISITION / CHANNEL 047', 24, '#000') +
        t(93, 282, 'ARRAY READY / LOCAL SIMULATION', 21, c[2]);
    if (v === 4) {
      for (let i = 0; i < 2; i++)
        out +=
          r(62 + i * 344, 177, 332, 53, c[i], 26) +
          r(85 + i * 344, 172, 177, 63, '#000') +
          t(95 + i * 344, 215, i ? 'LIBRARY' : 'VIEWER', 34, c[3]);
      out += l(63, 268, 737, 268, c[2], 3);
    }
  } else if (familyId === 'taskbar') {
    if (v === 0)
      out =
        l(52, 181, 745, 181, c[1], 2) +
        bank(60, 207, 133, ['LAUNCH'], false) +
        bank(213, 207, 189, ['CONTROL'], false) +
        bank(422, 207, 189, ['SECURITY'], false) +
        t(645, 239, '10:24', 34, c[3]);
    if (v === 1) {
      out = r(68, 179, 162, 71, c[0], 34) + center(149, 223, '10:24 UTC', 28, '#000');
      for (let i = 0; i < 3; i++)
        out +=
          r(244 + i * 164, 185, 158, 59, c[(i + 1) % 4]) +
          t(258 + i * 164, 224, `SESSION ${i + 1}`, 23, '#000');
    }
    if (v === 2)
      out =
        bank(60, 213, 213, ['LAUNCH'], false) +
        center(400, 245, '10:24', 50, c[3]) +
        bank(529, 213, 213, ['SECURITY'], false) +
        l(60, 190, 741, 190, c[1], 4);
    if (v === 3)
      out =
        l(67, 141, 732, 141, c[1], 4) +
        t(70, 126, 'NETWORK / ONLINE', 18, c[2]) +
        t(621, 126, '10:24 UTC', 18, c[3]) +
        bank(70, 186, 212, ['CONTROL', 'ARCHIVE'], false) +
        bank(304, 186, 201, ['SECURITY', 'COMMS'], false) +
        t(548, 224, 'ACTIVE', 29, c[3]) +
        t(548, 262, 'TASK 047', 25, c[2]);
    if (v === 4)
      out =
        r(97, 123, 259, 215, c[1], 40) +
        center(226, 227, '10:24', 67, '#000') +
        center(226, 277, '30 SEP / UTC', 23, '#000') +
        bank(391, 143, 302, ['LAUNCH', 'CONTROL', 'SECURITY', 'ARCHIVE'], false);
  } else if (familyId === 'text') {
    const lineText = (x, y, lines, size = 21) =>
      lines.map((s, i) => t(x, y + i * 34, s, size, c[1])).join('');
    if (v === 0)
      out =
        t(88, 118, 'MISSION BRIEFING', 37, c[1]) +
        lineText(89, 180, [
          'Survey the outer reference field. Maintain the sensor baseline',
          'while recording spectral changes across each sector.',
          'All displayed readings are synthetic review material.',
        ]) +
        r(90, 311, 571, 9, c[2]) +
        t(93, 352, 'REFERENCE / FIELD OPERATIONS', 18, c[3]);
    if (v === 1) {
      out = t(85, 103, 'ACQUISITION PROCEDURE', 33, c[1]);
      for (let i = 0; i < 3; i++)
        out +=
          r(87, 137 + i * 88, 54, 54, c[i], 27) +
          center(114, 173 + i * 88, `0${i + 1}`, 27, '#000') +
          t(
            164,
            167 + i * 88,
            ['ALIGN REFERENCE ARRAY', 'VERIFY SAMPLE WINDOW', 'RECORD OBSERVATION'][i],
            25,
            c[3],
          ) +
          t(
            164,
            196 + i * 88,
            [
              'Use the established baseline for this pass.',
              'Confirm all three channels report a stable signal.',
              'Store the sample with its source and timestamp.',
            ][i],
            19,
            c[1],
          );
    }
    if (v === 2)
      out =
        t(88, 119, 'SYSTEM NOTE', 36, c[3]) +
        lineText(88, 176, [
          'The auxiliary channel carries',
          'the reference signal during',
          'calibration of the primary array.',
          'Return to nominal after sampling.',
        ]) +
        l(464, 133, 464, 335, c[1], 3) +
        t(507, 176, 'REFERENCE', 25, c[0]) +
        lineText(507, 226, ['MODE / 047', 'STATUS / READY', 'SAMPLE / 006'], 20);
    if (v === 3)
      out =
        r(81, 105, 638, 66, c[1], 33) +
        t(120, 151, 'SYSTEM READY', 34, '#000') +
        lineText(110, 225, [
          'The reference array is aligned.',
          'Select a sample window to begin acquisition.',
          'This specimen demonstrates a readiness notice.',
        ]) +
        l(111, 355, 683, 355, c[0], 5);
    if (v === 4)
      out =
        frame(77, 75, 645, 331, true, c[1], 26) +
        t(106, 140, 'OBSERVATION REPORT', 34, c[3]) +
        lineText(
          106,
          201,
          [
            'A compact report reserves a clear text measure.',
            'Technical captions stay subordinate to the main message.',
            'This is original specimen copy for component review.',
          ],
          20,
        ) +
        l(108, 317, 651, 317, c[2], 2) +
        t(108, 350, 'M47 / LOCAL REFERENCE SERIES', 18, c[0]) +
        t(108, 377, 'SYNTHETIC CONTENT / REVISION 01', 16, c[2]);
  } else if (familyId === 'codes') {
    if (v === 0) {
      let yy = 68;
      for (const [i, h] of [65, 122, 47, 96].entries()) {
        out +=
          r(272, yy, 255, h, c[i]) +
          t(
            509,
            yy + h - 13,
            ['AA-1524', 'C 18 15 2', 'V2.2 F', 'B2-0730'][i],
            i === 1 ? 30 : 21,
            '#000',
            'text-anchor="end"',
          );
        yy += h + 3;
      }
    }
    if (v === 1)
      out =
        r(181, 90, 438, 309, c[1], 0) +
        center(400, 204, 'C 18 15 2', 54, '#000') +
        center(400, 280, 'V2.2 F', 44, '#000') +
        center(400, 363, 'SYSTEM IDENTIFICATION', 19, '#000');
    if (v === 2)
      for (let col = 0; col < 2; col++) {
        let yy = 76;
        for (let i = 0; i < 4; i++) {
          const hh = (i + col) % 2 ? 113 : 49;
          out +=
            r(174 + col * 229, yy, 226, hh, c[(i + col) % 4]) +
            t(
              385 + col * 229,
              yy + hh - 13,
              `${47 + i}-${68241 + col * 381 + i * 721}`,
              21,
              '#000',
              'text-anchor="end"',
            );
          yy += hh + 3;
        }
      }
    if (v === 3)
      for (let i = 0; i < 3; i++)
        out +=
          r(109, 93 + i * 102, 582, 93, c[i]) +
          t(128, 156 + i * 102, ['X 047.281', 'Y 128.962', 'Z 006.471'][i], 41, '#000') +
          t(673, 174 + i * 102, `REF / 0${i + 1}`, 15, '#000', 'text-anchor="end"');
    if (v === 4)
      for (let i = 0; i < 5; i++)
        out +=
          r(135, 76 + i * 65, 423 - i * 36, 48, c[i % 4]) +
          t(158, 108 + i * 65, `DATA ${63817 + i * 481} / ${26 + i * 7}`, 24, '#000') +
          r(578 - i * 36, 76 + i * 65, 48, 48, c[(i + 1) % 4]);
  }
  if (familyId.startsWith('layout-')) {
    // Layout specimens label the divisions themselves; geometry remains inspectable.
    const panel = (x, y, w, h, label, content) =>
      g(content, `data-panel="${esc(label)}" data-bounds="${x} ${y} ${w} ${h}"`);
    const blockShape = (x, y, w, h, label, k = 0) =>
      r(x, y, w, h, c[k], 0, 'fill-opacity=".09"') +
      bracket(x + 8, y + 8, w - 16, h - 16, c[k], Math.min(18, (w - 16) / 5, (h - 16) / 5)) +
      t(
        x + 22,
        y + Math.min(h < 80 ? 26 : 29, h - 12),
        label,
        Math.min(h < 80 ? 11 : 13, (w - 36) / 10),
        c[k],
      );
    const block = (x, y, w, h, label, k = 0) =>
      panel(x, y, w, h, label, blockShape(x, y, w, h, label, k));
    const chart = (x, y, w, h, label) => {
      const top = h < 80 ? 32 : 40,
        plotH = Math.max(6, h - top - 20);
      return panel(
        x,
        y,
        w,
        h,
        label,
        blockShape(x, y, w, h, label, 2) +
          grid(x + 20, y + top, w - 40, plotH, 7, 4) +
          stars(x + 20, y + top, w - 40, plotH, 36),
      );
    };
    const nums = (x, y, w, h, label) => {
      const firstRow = h < 80 ? 48 : 52;
      const rows = Math.max(
        0,
        Math.floor((h - (h < 80 ? 12 : 16) - firstRow) / layoutSpacing.rowHeight) + 1,
      );
      const columns = Math.max(1, Math.floor((w - 56) / 48));
      return panel(
        x,
        y,
        w,
        h,
        label,
        blockShape(x, y, w, h, label, 1) + numbers(x + 28, y + firstRow, w - 56, rows, columns, 12),
      );
    };
    const mirrored =
      (v === 1 && ['layout-scan', 'layout-information'].includes(familyId)) ||
      (v === 3 && ['layout-radial', 'layout-diagnostic'].includes(familyId)) ||
      (v === 4 && familyId === 'layout-engineering');
    if (familyId === 'layout-scan') {
      const utility = v === 3 ? 112 : 166,
        spine = 47,
        main = 50 + utility + spine + 26,
        top = v === 2 ? 165 : 115;
      out =
        nums(32, 52, utility, top, 'UTILITY') +
        bank(32, 52 + top + 16, utility, ['SCAN', 'RANGE', 'LOCK'], false) +
        nums(32, 52 + top + 156, utility, 201 - top, 'AUX');
      out +=
        frame(44 + utility, 52, 720 - utility, top, false, c[1], spine) +
        frame(44 + utility, 55 + top, 720 - utility, 354 - top, false, c[0], spine);
      out += nums(main, 81, 746 - main, top - 49, 'HEADER / TELEMETRY');
      out +=
        v === 4
          ? frame(main, top + 93, 746 - main, 275 - top, true, c[1], 18) +
            chart(main + 16, top + 120, 686 - main, 221 - top, 'PRIMARY MAP')
          : chart(main, top + 93, 746 - main, 275 - top, 'PRIMARY MAP');
    } else if (familyId === 'layout-radial') {
      const left = v === 1 ? 288 : 219;
      out = nums(32, 54, 736, 87, 'GLOBAL TELEMETRY');
      if (v === 4) {
        out +=
          block(32, 163, 210, 109, 'RADIAL', 0) +
          nums(266, 163, 502, 109, 'SECONDARY BANK') +
          chart(32, 291, 736, 121, 'PANORAMIC MAP');
      } else {
        out +=
          block(32, v === 2 ? 159 : 255, left, v === 2 ? 138 : 156, 'RADIAL', 0) +
          nums(32, v === 2 ? 318 : 159, left, v === 2 ? 93 : 76, 'SUPPORT');
        out +=
          frame(left + 52, 157, 716 - left, 255, false, c[0], 34) +
          chart(left + 109, 195, 641 - left, 181, 'PRIMARY MAP');
      }
      out += circle(
        v === 4 ? 137 : 32 + left / 2,
        v === 4 ? 225 : v === 2 ? 239 : 343,
        v === 4 ? 25 : 45,
        'none',
        c[0],
        8,
      );
    } else if (familyId === 'layout-diagnostic') {
      const plan = diagnosticLayout(v);
      const drawFrame = (box, color, rail) => frame(box.x, box.y, box.w, box.h, false, color, rail);
      const drawPanel = (draw, box, label) => draw(box.x, box.y, box.w, box.h, label);
      out =
        drawFrame(plan.outer, c[0], 36) +
        drawPanel(nums, plan.register, 'REGISTER') +
        drawFrame(plan.enclosure, c[1], 24) +
        drawPanel(nums, plan.bank, 'DENSE BANKS') +
        drawPanel(v === 4 ? chart : nums, plan.lower[0], v === 4 ? 'PLOT A' : 'READOUTS') +
        drawPanel(chart, plan.lower[1], v === 4 ? 'PLOT B' : 'PLOT');
    } else if (familyId === 'layout-engineering') {
      const lower = v === 2 ? 140 : 100,
        upper = 338 - lower;
      out =
        frame(24, 50, 752, upper, false, c[0], 50) +
        frame(24, upper + 72, 752, lower, false, c[3], 50) +
        nums(98, 94, 157, upper - 88, 'TELEMETRY');
      out +=
        block(279, 94, v === 1 ? 290 : 190, upper - 88, 'ENGINE', 0) +
        block(v === 1 ? 593 : 493, 94, v === 1 ? 138 : 238, upper - 88, 'AUXILIARY', 1);
      out += chart(98, upper + 100, 630, lower - 52, 'TIMING MATRIX');
      if (v === 3) out += l(374, 130, 374, upper + 2, c[0], 4);
      out += l(v === 1 ? 569 : 469, 170, v === 1 ? 593 : 493, 170, c[3], 9);
    } else if (familyId === 'layout-information') {
      const side = v === 2 ? 122 : 170,
        head = v === 3 ? 127 : 87,
        xx = side + 125;
      out =
        block(28, 52, side, head, 'SIGNATURE', 0) +
        bank(28, head + 68, side, ['COMMAND', 'ACTION', 'STATUS'], false) +
        nums(28, head + 208, side, 199 - head, 'NOTICES');
      out +=
        frame(side + 49, 52, 720 - side, head, false, c[1], 44) +
        frame(side + 49, head + 55, 720 - side, 352 - head, false, c[0], 44);
      out +=
        block(xx, 80, 628 - side, head - 49, 'TITLE / SELECTORS', 1) +
        block(xx, head + 106, 628 - side, 212 - head, 'INFORMATION', 2) +
        frame(xx, 334, 628 - side, 40, true, c[1], 18);
      if (v === 4) out += l(625, head + 112, 625, 309, c[1], 3);
    } else {
      const lw = v === 1 ? 441 : v === 2 ? 275 : 355;
      if (v === 4) {
        out =
          frame(26, 50, 748, 157, true, c[0], 32) +
          chart(45, 82, 662, 98, 'VIEWER') +
          frame(26, 225, 748, 157, false, c[1], 32) +
          nums(81, 256, 652, 96, 'LIBRARY');
      } else {
        const rh = v === 3 ? 236 : 307;
        out =
          frame(26, 53, lw, 307, true, c[0], 40) +
          frame(29 + lw, 53, 745 - lw, rh, false, c[1], 40) +
          chart(42, 95, lw - 102, 221, 'VIEWER') +
          nums(lw + 87, 95, 657 - lw, rh - 79, 'LIBRARY');
        if (v === 3) out += block(lw + 87, 312, 657 - lw, 48, 'METADATA', 3);
      }
      out +=
        l(25, 397, 775, 397, c[1], 2) +
        bank(28, 408, 218, ['GLOBAL TASKS'], false) +
        t(698, 436, '10:24', 28, c[3]);
    }
    // Mirror frame and region positions, then unmirror text around each text anchor.
    if (mirrored)
      out = g(
        out.replace(
          /<text x="([\d.-]+)" y="([\d.-]+)"([^>]*)>/g,
          (_m, x, y, attrs) =>
            `<text transform="translate(${2 * Number(x)} 0) scale(-1 1)" x="${x}" y="${y}"${attrs.replace(/text-anchor="[^"]*"/g, '')} text-anchor="end">`,
        ),
        'transform="translate(800 0) scale(-1 1)"',
      );
  }
  if (!out) throw new Error('Specimen is still in preparation.');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-labelledby="${spec.id}-title ${spec.id}-desc" data-specimen="${spec.id}" data-motion="${motion}"><title id="${spec.id}-title">${esc(spec.id + ' / ' + spec.name)}</title><desc id="${spec.id}-desc">${esc(spec.difference)} Original review specimen; all displayed data is synthetic.</desc><style>${font ? `@font-face{font-family:Antonio;src:url(data:font/ttf;base64,${font})}` : ''}
    [data-specimen] .pulse{animation:energy 2.8s ease-in-out infinite alternate;animation-delay:var(--delay,0s)}
    [data-specimen] .amplitude{animation:amplitude 2s ease-in-out infinite alternate;animation-delay:var(--delay,0s)}
    [data-specimen] .flow{animation:transfer 3s linear infinite}
    [data-specimen] .trace{stroke-dasharray:170 6;animation:transfer 9s linear infinite}
    [data-specimen] .cursor{animation:cursor 7s linear infinite}
    [data-specimen] .cell{animation:energy 4s steps(2) infinite alternate}
    [data-motion="false"] *{animation-play-state:paused!important}
    @keyframes energy{from{opacity:.52}to{opacity:1}}@keyframes amplitude{from{transform:scaleY(.7)}to{transform:scaleY(1)}}@keyframes transfer{to{stroke-dashoffset:-190}}@keyframes cursor{to{transform:translateX(645px)}}
    @media(prefers-reduced-motion:reduce){[data-specimen] *{animation:none!important}}
    </style><rect width="800" height="480" fill="#000"/><g font-family="Antonio,sans-serif" font-weight="400">${out}${t(25, 29, spec.id + ' / ' + spec.name.toUpperCase(), 17, c[3])}${t(25, 465, 'M47 COMPONENT STUDY / SYNTHETIC DATA / NOT INTEGRATED', 12, c[2])}</g></svg>`;
}
export const readyFamilies = new Set(families.map((f) => f.id));
