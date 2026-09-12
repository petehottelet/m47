const KEY = 'm47-quick-links-v2';
const defaults = [
  { name: 'Wikipedia', url: 'https://wikipedia.org/' },
  { name: 'GitHub', url: 'https://github.com/' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/' },
];
const $ = (id) => document.getElementById(id);
function normalize(links) {
  if (!Array.isArray(links) || links.length > 24) throw new Error('Use at most 24 links.');
  return links.map((item) => {
    const url = new URL(item.url);
    if (!/^https?:$/.test(url.protocol))
      throw new Error('Links must start with https:// or http://.');
    const name = String(item.name).trim();
    if (!name || name.length > 60) throw new Error('Each link needs a name of 1–60 characters.');
    return { name, url: url.href };
  });
}
function paint(links) {
  $('links').replaceChildren(
    ...links.map((item) => {
      const a = document.createElement('a');
      a.textContent = item.name;
      a.href = item.url;
      return a;
    }),
  );
  $('editor').value = links.map((x) => `${x.name} | ${x.url}`).join('\n');
}
function load() {
  try {
    const saved = localStorage.getItem(KEY);
    paint(saved ? normalize(JSON.parse(saved)) : defaults);
  } catch {
    paint(defaults);
    $('status').textContent = 'Could not restore saved links. Defaults are shown.';
  }
}
$('save').addEventListener('click', () => {
  try {
    const links = normalize(
      $('editor')
        .value.split('\n')
        .filter((x) => x.trim())
        .map((line) => {
          const index = line.indexOf('|');
          if (index < 1) throw new Error('Use name | https://address on each line.');
          return { name: line.slice(0, index).trim(), url: line.slice(index + 1).trim() };
        }),
    );
    localStorage.setItem(KEY, JSON.stringify(links));
    paint(links);
    $('status').textContent = 'Saved on this device.';
  } catch (e) {
    $('status').textContent = e.message;
  }
});
$('restore').addEventListener('click', () => {
  try {
    localStorage.removeItem(KEY);
    paint(defaults);
    $('status').textContent = 'Default links restored.';
  } catch {
    $('status').textContent = 'Could not reset links. Try again.';
  }
});
function tick() {
  const now = new Date();
  $('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  $('date').textContent = now.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
tick();
setInterval(tick, 30000);
load();
