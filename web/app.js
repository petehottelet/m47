import { render, renderSVG, themeCSS, validateSpec, solve } from '../core/index.js';
import { examples } from '../core/examples.js';
import { extractSpec } from '../core/extract.js';
import { playTone, pulse } from '../core/feedback.js';
const $ = (id) => document.getElementById(id),
  KEY = 'm47-workshop-v2';
let current,
  fontData = '',
  ready = false,
  timer,
  busy = false;
const status = (message) => {
  $('status').textContent = message;
};
const exportButtons = [...document.querySelectorAll('.exports button')];
const buttons = (disabled) => exportButtons.forEach((b) => (b.disabled = disabled));
function options() {
  return {
    width: Number($('width').value),
    height: Number($('height').value),
    scheme: $('scheme').value,
    density: $('density').value,
    seed: $('seed').value,
  };
}
function setState(state) {
  if (!state || !state.spec || !state.options)
    throw new Error('A saved panel must contain spec and options.');
  const model = solve(state.spec, state.options);
  state = {
    spec: model.spec,
    options: Object.fromEntries(
      ['width', 'height', 'scheme', 'density', 'seed'].map((k) => [k, model[k]]),
    ),
  };
  $('spec').value = JSON.stringify(state.spec, null, 2);
  for (const id of ['width', 'height', 'scheme', 'density', 'seed'])
    $(id).value =
      state.options[id] ?? { scheme: 'tng-default', density: 'comfortable', seed: '47' }[id];
  syncPreset();
  update();
}
function syncPreset() {
  const value = `${$('width').value}x${$('height').value}`;
  $('preset').value = [...$('preset').options].some((o) => o.value === value) ? value : 'custom';
}
function fit() {
  if (!current) return;
  const width = $('preview-holder').clientWidth,
    scale = Math.min(1, width / current.options.width);
  $('preview').style.width = current.options.width + 'px';
  $('preview').style.height = current.options.height + 'px';
  $('preview').style.transform = `scale(${scale})`;
  $('preview-holder').style.height = current.options.height * scale + 'px';
}
function update() {
  clearTimeout(timer);
  try {
    const spec = validateSpec(JSON.parse($('spec').value)),
      opts = options();
    solve(spec, opts);
    current = { spec, options: opts };
    $('preview').srcdoc = render(spec, { ...opts, fontData });
    $('canvas-status').textContent =
      `${opts.width} × ${opts.height} / ${solve(spec, opts).topology.toUpperCase()}`;
    $('error').textContent = '';
    $('spec').setAttribute('aria-invalid', 'false');
    buttons(!ready || busy);
    fit();
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      status('Preview updated. Browser storage is unavailable; export to keep your work.');
    }
  } catch (error) {
    $('error').textContent = error.message;
    $('spec').setAttribute('aria-invalid', 'true');
    buttons(true);
  }
}
function download(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function task(fn) {
  busy = true;
  buttons(true);
  try {
    await fn();
  } catch (e) {
    status(e.message);
  } finally {
    busy = false;
    buttons(!ready || Boolean($('error').textContent));
  }
}
async function copy(value, label) {
  if (!navigator.clipboard?.writeText)
    throw new Error('Clipboard unavailable. Use the export button or open this site over HTTPS.');
  await navigator.clipboard.writeText(value);
  status(label);
}
async function exportFile(format) {
  const opts = { ...current.options, fontData };
  if (format === 'html') download(render(current.spec, opts), 'm47.html', 'text/html');
  if (format === 'css') download(themeCSS(opts.scheme), 'm47-theme.css', 'text/css');
  if (format === 'svg') download(renderSVG(current.spec, opts), 'm47.svg', 'image/svg+xml');
  if (format === 'png') {
    const svg = renderSVG(current.spec, opts),
      url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = opts.width;
      canvas.height = opts.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('PNG export failed. Try SVG or the M47 CLI.');
      download(blob, 'm47.png', 'image/png');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  status(`${format.toUpperCase()} exported. Your original content stays in the editor.`);
}
for (const format of ['html', 'svg', 'png', 'css'])
  $('export-' + format).addEventListener('click', () => task(() => exportFile(format)));
$('copy').addEventListener('click', () =>
  task(() =>
    copy(render(current.spec, { ...current.options, fontData }), 'Self-contained HTML copied.'),
  ),
);
$('share').addEventListener('click', () =>
  task(async () => {
    const fragment = encodeURIComponent(JSON.stringify(current));
    if (fragment.length > 16000)
      throw new Error('This panel is too large for a reliable share link. Export HTML instead.');
    const url = new URL(location.href);
    url.hash = fragment;
    await copy(
      url.href,
      'Share link copied. Anyone receiving it can read the included panel content.',
    );
  }),
);
$('controls').addEventListener('submit', (e) => e.preventDefault());
$('controls').addEventListener('input', (e) => {
  if (e.target.id === 'preset') return;
  syncPreset();
  update();
});
$('preset').addEventListener('change', () => {
  if ($('preset').value === 'custom') return;
  const [w, h] = $('preset').value.split('x');
  $('width').value = w;
  $('height').value = h;
  update();
});
$('spec').addEventListener('input', () => {
  buttons(true);
  clearTimeout(timer);
  timer = setTimeout(update, 250);
});
$('shuffle').addEventListener('click', () => {
  $('seed').value = String(crypto.getRandomValues(new Uint32Array(1))[0]);
  update();
});
$('tone').addEventListener('click', () =>
  task(async () => {
    pulse($('tone'));
    await playTone();
    status('Synthesized tone preview. Sound stays off unless you request it.');
  }),
);
function exampleState(example) {
  return {
    spec: example.spec,
    options: {
      width: example.width,
      height: example.height,
      scheme: example.scheme ?? 'tng-default',
      density: 'comfortable',
      seed: '47',
    },
  };
}
for (const example of examples) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = example.name;
  b.addEventListener('click', () => {
    setState(exampleState(example));
    status(`${example.name} loaded. Sample readings are demonstration data.`);
  });
  $('gallery').append(b);
}
$('reset').addEventListener('click', () => {
  setState(exampleState(examples[0]));
  status('Draft reset to Observatory.');
});
$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () =>
  task(async () => {
    const file = $('file').files[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a file smaller than 1 MB.');
      const text = await file.text();
      let spec;
      if (/\.json$/i.test(file.name)) spec = JSON.parse(text);
      else if (/\.html?$/i.test(file.name)) {
        const template = document.createElement('template');
        template.innerHTML = text;
        spec = extractSpec({
          querySelector: (selector) => template.content.querySelector(selector),
          body: template.content,
          title: template.content.querySelector('title')?.textContent ?? file.name,
        });
      } else
        spec = {
          title: file.name.slice(0, 120),
          subtitle: 'Imported locally',
          sections: [{ type: 'text', title: 'Notes', text }],
        };
      setState({ spec: validateSpec(spec), options: options() });
      status(`Imported ${file.name}. Review the extracted content before exporting.`);
    } finally {
      $('file').value = '';
    }
  }),
);
new ResizeObserver(fit).observe($('preview-holder'));
async function init() {
  buttons(true);
  try {
    const response = await fetch('fonts/Antonio.ttf');
    if (!response.ok) throw new Error('font');
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    fontData = 'data:font/ttf;base64,' + btoa(binary);
    ready = true;
  } catch {
    status('The bundled font could not load. Reload the page before exporting.');
  }
  let state = exampleState(examples[0]);
  try {
    if (location.hash.length > 80000) throw new Error('Share link is too long.');
    if (location.hash.length > 1) {
      state = JSON.parse(decodeURIComponent(location.hash.slice(1)));
      solve(state.spec, state.options);
      status('Shared panel loaded. It is now a local draft.');
    } else {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        state = JSON.parse(saved);
        solve(state.spec, state.options);
        status('Your local draft is restored.');
      }
    }
  } catch {
    state = exampleState(examples[0]);
    status(
      'Saved or shared panel was invalid. Loaded Observatory; import a valid JSON spec to recover.',
    );
  }
  try {
    setState(state);
  } catch {
    setState(exampleState(examples[0]));
    status('Shared panel was incomplete. Loaded Observatory.');
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
