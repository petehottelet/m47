import { families, references, variantCount } from './catalog.js';
import { screenDivisions } from './layout-catalog.js';
import { renderElement, readyFamilies } from './elements.js';
const $ = (id) => document.getElementById(id),
  escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
const storageKey = 'm47-element-review-v1',
  validIds = new Set(families.flatMap((f) => f.variants.map((v) => v.id)));
let decisions = {},
  motion = false,
  storageFailed = false,
  active = null;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  for (const [id, item] of Object.entries(saved)) {
    if (validIds.has(id) && ['pending', 'approve', 'revise', 'reject'].includes(item?.status))
      decisions[id] = {
        status: item.status,
        note: typeof item.note === 'string' ? item.note.slice(0, 2000) : '',
      };
  }
} catch {
  storageFailed = true;
}
function counts() {
  const done = Object.values(decisions).filter((d) => d.status !== 'pending').length;
  $('progress').textContent =
    `${storageFailed ? 'Storage unavailable. Export decisions before closing. ' : ''}${done} / ${variantCount} reviewed · ${Object.values(decisions).filter((d) => d.status === 'approve').length} approved`;
  $('inventory-count').textContent =
    `${families.length} families · ${variantCount} specimens available to inspect`;
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(decisions));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
  counts();
}
function nav() {
  const query = $('search').value.toLowerCase();
  let last = '';
  $('families').innerHTML =
    families
      .filter((f) => (f.title + ' ' + f.description + ' ' + f.prefix).toLowerCase().includes(query))
      .map((f) => {
        const group = f.group !== last ? `<p class="group-title">${f.group}</p>` : '';
        last = f.group;
        return (
          group +
          `<a href="#${f.id}" ${active === f.id ? 'aria-current="page"' : ''}>${f.title}<small>${f.prefix} · ${readyFamilies.has(f.id) ? '5 variants' : 'Drawing variants'}</small></a>`
        );
      })
      .join('') || '<p>No matching families.</p>';
}
function links(ids) {
  return ids
    .map((id) => {
      const f = families.find((f) => f.id === id);
      return `<a href="#${id}">${f.prefix} ${escape(f.title)}</a>`;
    })
    .join('');
}
function divisionMap(item) {
  const colors = ['#ffad77', '#c6a2de', '#91d4f3', '#ffe29a'];
  return `<svg class="division-map" viewBox="0 0 1000 600" role="img" aria-label="${escape(item.name)}"><rect width="1000" height="600" fill="#000" stroke="#c6a2de"/>${item.divisions.map(([name, x, y, w, h], i) => `<rect x="${x * 10}" y="${y * 6}" width="${w * 10}" height="${h * 6}" fill="${colors[i % 4]}" fill-opacity=".16" stroke="${colors[i % 4]}" stroke-width="2"/><text x="${x * 10 + 5}" y="${y * 6 + 19}" fill="${colors[i % 4]}" font-family="Antonio,sans-serif" font-size="17">${i + 1}</text>`).join('')}</svg>`;
}
function catalog() {
  return `<h2>Reference catalogue</h2><p>All six supplied examples examined, including every frame of the engineering GIF. Names describe visible forms; implied functions are interpretations. Original reference images stay outside the review distribution.</p><p><a href="#layouts">Inspect whole-screen divisions and layout rules</a></p>${references.map((ref) => `<section class="reference" id="ref-${ref.id}"><h3>${ref.id} / ${escape(ref.title)}</h3><ol>${ref.elements.map((s) => `<li>${escape(s)}</li>`).join('')}</ol><p>Component families represented:</p>${links(ref.families)}</section>`).join('')}`;
}
function layoutCatalog() {
  return `<h2>Screen divisions & composition</h2><p>Six reference-specific layouts, each with five alternatives to review. Rectangles below identify content regions and structural zones; overlapping rectangles document nesting. Bounds are approximate percentages, not claimed pixel measurements.</p>${screenDivisions
    .map(
      (item) =>
        `<section class="reference"><h3>${item.ref} / ${escape(item.name)}</h3>${divisionMap(item)}<table class="division-table"><thead><tr><th>Region</th><th>X / Y (%)</th><th>W / H (%)</th></tr></thead><tbody>${item.divisions.map(([name, x, y, w, h], i) => `<tr><td>${i + 1}. ${escape(name)}</td><td>${x} / ${y}</td><td>${w} / ${h}</td></tr>`).join('')}</tbody></table><dl>${[
          ['hierarchy', 'Hierarchy & reading order'],
          ['structure', 'Frame topology'],
          ['alignment', 'Alignment & shared edges'],
          ['whitespace', 'Black space & gutters'],
          ['adaptation', 'Proposed responsive behavior'],
        ]
          .map(([key, title]) => `<dt>${title}</dt><dd>${escape(item[key])}</dd>`)
          .join('')}</dl><p>${links([item.family])}</p></section>`,
    )
    .join('')}`;
}
function specimen(f, v, i) {
  const d = decisions[v.id] || { status: 'pending', note: '' };
  return `<article class="specimen" data-id="${v.id}"><h3><span class="id">${v.id}</span>${escape(v.name)}</h3><p>${escape(v.difference)}</p><div class="drawing">${renderElement(f.id, i, { palette: $('palette').value, motion })}</div><div class="review-controls"><label>Decision for ${v.id}<select data-decision="${v.id}">${[
    ['pending', 'Not reviewed'],
    ['approve', 'Approve'],
    ['revise', 'Request changes'],
    ['reject', 'Reject'],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${d.status === value ? 'selected' : ''}>${label}</option>`,
    )
    .join(
      '',
    )}</select></label><button data-inspect="${i}">Inspect larger</button><a href="svg/${v.id}.svg" download>Classic SVG</a></div><label class="notes-label" for="note-${v.id}">Notes for ${v.id}</label><textarea id="note-${v.id}" data-note="${v.id}" maxlength="2000" placeholder="What should change?">${escape(d.note)}</textarea></article>`;
}
function render() {
  active = location.hash.slice(1) || 'layouts';
  nav();
  counts();
  if (active === 'catalog') {
    $('content').innerHTML = catalog();
    return;
  }
  if (active === 'layouts') {
    $('content').innerHTML = layoutCatalog();
    return;
  }
  const f = families.find((f) => f.id === active);
  if (!f) {
    $('content').innerHTML = '<h2>Unknown family</h2><a href="#catalog">Open the catalogue</a>';
    return;
  }
  $('content').innerHTML =
    `<h2>${escape(f.title)}</h2><p class="family-description">${escape(f.description)}</p><p class="source-link">Source observations: ${f.refs.join(', ')} · <a href="#${f.group === 'Layouts' ? 'layouts' : 'catalog'}">Read the analysis</a></p>${readyFamilies.has(f.id) ? `<div class="specimens">${f.variants.map((v, i) => specimen(f, v, i)).join('')}</div>` : '<p class="pending">The five variants are catalogued and are still being drawn. They are not ready for a visual decision yet.</p>'}<div class="next-family"><a href="#${families[Math.max(0, families.indexOf(f) - 1)].id}">Previous family</a><a href="#${families[(families.indexOf(f) + 1) % families.length].id}">Next family</a></div>`;
}
$('search').addEventListener('input', nav);
document.querySelector('.skip').addEventListener('click', (event) => {
  event.preventDefault();
  $('main').focus();
  $('main').scrollIntoView({ block: 'start' });
});
$('palette').addEventListener('change', render);
$('motion').addEventListener('click', () => {
  motion = !motion;
  $('motion').setAttribute('aria-pressed', String(motion));
  $('motion').textContent = motion ? 'Pause specimens' : 'Animate specimens';
  document
    .querySelectorAll('[data-specimen]')
    .forEach((svg) => (svg.dataset.motion = String(motion)));
});
document.addEventListener('visibilitychange', () =>
  document
    .querySelectorAll('[data-specimen]')
    .forEach((svg) => (svg.dataset.motion = String(motion && !document.hidden))),
);
$('content').addEventListener('change', (e) => {
  const id = e.target.dataset.decision;
  if (id) {
    decisions[id] = { ...decisions[id], status: e.target.value, note: decisions[id]?.note || '' };
    save();
  }
});
$('content').addEventListener('input', (e) => {
  const id = e.target.dataset.note;
  if (id) {
    decisions[id] = { status: decisions[id]?.status || 'pending', note: e.target.value };
    save();
  }
});
$('content').addEventListener('click', (e) => {
  const button = e.target.closest('[data-inspect]');
  if (!button) return;
  $('large-specimen').innerHTML = renderElement(active, Number(button.dataset.inspect), {
    palette: $('palette').value,
    motion,
  });
  $('inspect').showModal();
});
$('close-inspect').addEventListener('click', () => $('inspect').close());
$('export').addEventListener('click', () => {
  const payload = {
    version: 1,
    purpose: 'M47 element review; no automatic integration',
    decisions: families.flatMap((f) =>
      f.variants.map((v) => ({
        id: v.id,
        family: f.id,
        name: v.name,
        status: decisions[v.id]?.status || 'pending',
        note: decisions[v.id]?.note || '',
      })),
    ),
  };
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    ),
    a = document.createElement('a');
  a.href = url;
  a.download = 'm47-element-decisions.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('hashchange', () => {
  render();
  $('main').focus();
  $('main').scrollIntoView({ block: 'start' });
});
render();
