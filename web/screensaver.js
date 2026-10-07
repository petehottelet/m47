import { createScene, renderScene, purposes, layouts, saverPalettes } from '../core/screensaver.js';

import { createFeedClient } from '../core/public-feeds.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
const native = params.get('native') === '1' && Boolean(window.chrome?.webview);
const seed = (
  params.get('seed') || crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
).slice(0, 100);
let index = 0,
  tick = 0,
  elapsed = 0,
  paused = reducedMotion.matches,
  hideTimer;
const settings = {
  purpose: 'shuffle',
  scheme: 'auto',
  layout: 'auto',
  motion: 'full',
  feed: 'off',
  interval: 30,
  brightness: 85,
};
try {
  const saved = JSON.parse(localStorage.getItem('m47-screensaver') || '{}');
  if (saved.purpose === 'shuffle' || purposes.some((p) => p.id === saved.purpose))
    settings.purpose = saved.purpose;
  if (['auto', ...saverPalettes].includes(saved.scheme)) settings.scheme = saved.scheme;
  if (['auto', ...layouts].includes(saved.layout)) settings.layout = saved.layout;
  if (['full', 'calm', 'still'].includes(saved.motion)) settings.motion = saved.motion;
  if (['off', 'clock', 'earthquakes', 'space'].includes(saved.feed)) settings.feed = saved.feed;
  if ([15, 30, 60, 120].includes(saved.interval)) settings.interval = saved.interval;
  if (Number.isFinite(saved.brightness))
    settings.brightness = Math.max(30, Math.min(100, saved.brightness));
} catch {
  /* Storage is optional; the display also runs in a private session. */
}
for (const purpose of purposes) $('purpose').add(new Option(purpose.station, purpose.id));
$('purpose').value = settings.purpose;
$('palette').value = settings.scheme;
for (const name of ['layout', 'motion', 'feed']) $(name).value = settings[name];
$('interval').value = String(settings.interval);
$('brightness').value = String(settings.brightness);
document.documentElement.style.setProperty('--brightness', settings.brightness / 100);
if (native) document.body.classList.add('native');
if (window.chrome?.webview) document.querySelector('.dock-heading a').remove();

// Reconcile readouts without replacing animated SVG nodes on each sample.
function reconcile(current, next) {
  if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
    current.replaceWith(next.cloneNode(true));
    return;
  }
  if (current.nodeType === Node.TEXT_NODE) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  if (current.nodeType !== Node.ELEMENT_NODE) return;
  for (const attr of [...current.attributes])
    if (!next.hasAttribute(attr.name) && attr.name !== 'class') current.removeAttribute(attr.name);
  for (const attr of next.attributes)
    if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
  const children = [...next.childNodes];
  while (current.childNodes.length > children.length) current.lastChild.remove();
  children.forEach((child, i) =>
    current.childNodes[i]
      ? reconcile(current.childNodes[i], child)
      : current.append(child.cloneNode(true)),
  );
}
const client = createFeedClient({
  onUpdate: () => {
    if (!paused && !document.hidden) draw();
  },
});
function motionState() {
  document.body.classList.toggle('paused', paused);
  document.body.classList.toggle('suspended', document.hidden);
  document.body.classList.toggle('reduced-motion', reducedMotion.matches);
  document.body.classList.toggle('motion-still', settings.motion === 'still');
  document.body.classList.toggle('calm', settings.motion === 'calm');
}
function draw(entrance = false) {
  const scene = createScene({
    seed,
    index,
    tick,
    purpose: settings.purpose,
    scheme: settings.scheme,
    layout: settings.layout,
  });
  const markup = renderScene(scene, {
    portrait: innerHeight > innerWidth * 1.2,
    feed: client.view(),
  });
  const svg = $('display').querySelector('svg');
  if (entrance || !svg) {
    $('display').innerHTML = markup;
    if (!paused && !reducedMotion.matches && settings.motion !== 'still')
      $('display').querySelector('svg').classList.add('enter');
  } else {
    const template = document.createElement('template');
    template.innerHTML = markup;
    reconcile(svg, template.content.firstElementChild);
  }
  motionState();
  $('display').dataset.scene = String(index);
  $('display').dataset.tick = String(tick);
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('status').textContent =
    `${paused ? 'Paused' : 'Running'} · ${scene.station} · Simulated instruments${settings.feed !== 'off' ? ' + observation band' : ''} · Move the pointer or press Tab for controls.`;
}
function save() {
  try {
    localStorage.setItem('m47-screensaver', JSON.stringify(settings));
  } catch {
    /* Optional. */
  }
}
function showControls() {
  document.body.classList.remove('controls-hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => document.body.classList.add('controls-hidden'), 4500);
}
function next() {
  index++;
  tick = 0;
  elapsed = 0;
  draw(true);
}
function togglePause() {
  paused = !paused;
  elapsed = 0;
  motionState();
  if (paused) client.suspend();
  else void client.refresh();
  draw();
  showControls();
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    $('status').textContent =
      'Fullscreen is unavailable here. Open this page in a standalone browser window.';
  }
}
$('pause').addEventListener('click', togglePause);
$('next').addEventListener('click', next);
$('fullscreen').addEventListener('click', fullscreen);
$('purpose').addEventListener('change', () => {
  settings.purpose = $('purpose').value;
  save();
  next();
});
$('palette').addEventListener('change', () => {
  settings.scheme = $('palette').value;
  save();
  draw(true);
});
for (const name of ['layout', 'motion', 'feed'])
  $(name).addEventListener('change', () => {
    settings[name] = $(name).value;
    save();
    if (name === 'feed') client.select(settings.feed, !paused && !document.hidden);
    draw(name === 'layout');
  });
$('interval').addEventListener('change', () => {
  settings.interval = Number($('interval').value);
  elapsed = 0;
  save();
});
$('brightness').addEventListener('input', () => {
  settings.brightness = Number($('brightness').value);
  document.documentElement.style.setProperty('--brightness', settings.brightness / 100);
  save();
});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  if (document.fullscreenElement) {
    $('display').focus();
    document.body.classList.add('controls-hidden');
  } else showControls();
});
document.addEventListener('pointermove', showControls);
document.addEventListener('pointerdown', showControls);
document.addEventListener('focusin', showControls);
let portrait = innerHeight > innerWidth * 1.2;
window.addEventListener('resize', () => {
  const nextPortrait = innerHeight > innerWidth * 1.2;
  if (portrait !== nextPortrait) {
    portrait = nextPortrait;
    draw(true);
  }
});
document.addEventListener('visibilitychange', () => {
  motionState();
  if (document.hidden) client.suspend();
  else if (!paused) {
    void client.refresh();
    draw();
  }
});
document.addEventListener('keydown', (event) => {
  showControls();
  if (
    event.target.closest('input, select, button, a') ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  }
  if (event.key.toLowerCase() === 'n') next();
  if (event.key.toLowerCase() === 'f') fullscreen();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    paused = true;
    client.suspend();
    draw();
  }
  motionState();
});
// CSS animates instruments; sample readouts at a bounded cadence and stop in hidden tabs.
setInterval(() => {
  if (paused || document.hidden) return;
  void client.refresh();
  elapsed += 3;
  if (elapsed >= settings.interval) next();
  else {
    tick++;
    draw();
  }
}, 3000);
setInterval(() => {
  if (settings.feed === 'clock' && !paused && !document.hidden) draw();
}, 1000);
client.select(settings.feed, !paused && !document.hidden);
draw(true);
showControls();
