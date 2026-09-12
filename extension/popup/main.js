import { B, getSettings, updateSettings, siteHost } from '../shared/settings.js';
let host = null,
  tabId = null,
  available = false,
  busy = false;
const $ = (id) => document.getElementById(id);
function paint(cfg) {
  const siteMode = host ? (cfg.sites[host] ?? cfg.defaultMode) : cfg.defaultMode;
  for (const group of ['site', 'global'])
    document.querySelectorAll('#' + group + ' [data-m]').forEach((b) => {
      const pressed = b.dataset.m === (group === 'site' ? siteMode : cfg.defaultMode);
      b.classList.toggle('on', pressed);
      b.setAttribute('aria-pressed', String(pressed));
      b.disabled = busy || (group === 'site' && !available);
    });
  $('inherit').disabled = busy || !available || !Object.hasOwn(cfg.sites, host);
  $('reader').disabled = busy || !available;
  $('site-status').textContent = available
    ? Object.hasOwn(cfg.sites, host)
      ? 'Custom site preference'
      : 'Following the default'
    : 'This page cannot be themed. Try a regular webpage; newly loaded extensions may need one page refresh.';
}
async function save(change) {
  busy = true;
  try {
    paint(await getSettings());
    const cfg = await updateSettings(change);
    $('notice').textContent = 'Saved. Open pages update immediately.';
    busy = false;
    paint(cfg);
  } catch (error) {
    busy = false;
    $('notice').textContent = 'Could not save: ' + error.message;
    load();
  }
}
async function load() {
  try {
    const [tab] = await B.tabs.query({ active: true, currentWindow: true });
    tabId = tab?.id;
    host = siteHost(tab?.url);
    $('host').textContent = host ?? 'Browser page';
    if (host && tabId != null) {
      try {
        available = (await B.tabs.sendMessage(tabId, { type: 'm47-ping' }))?.ready === true;
      } catch {
        available = false;
      }
    }
    paint(await getSettings());
  } catch (error) {
    $('notice').textContent = 'Could not load settings: ' + error.message;
  }
}
$('site').addEventListener('click', (e) => {
  const mode = e.target.closest('[data-m]')?.dataset.m;
  if (mode && host && available) save({ type: 'site', host, mode });
});
$('global').addEventListener('click', (e) => {
  const mode = e.target.closest('[data-m]')?.dataset.m;
  if (mode) save({ type: 'default', mode });
});
$('inherit').addEventListener('click', () => save({ type: 'site', host, mode: null }));
$('reset-sites').addEventListener('click', () => save({ type: 'reset' }));
$('reader').addEventListener('click', async () => {
  try {
    const reply = await B.tabs.sendMessage(tabId, { type: 'm47-reader' });
    if (reply?.error) throw new Error(reply.error);
    window.close();
  } catch (error) {
    $('notice').textContent = error.message;
  }
});
B.storage.onChanged.addListener((changes, area) => {
  if (area === 'local')
    getSettings()
      .then(paint)
      .catch(() => {});
});
load();
