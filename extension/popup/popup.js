const B = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { defaultMode: "full", sites: {} };
let host = null, tabId = null;

function paint(cfg) {
  const siteMode = host ? (cfg.sites[host] ?? cfg.defaultMode) : cfg.defaultMode;
  document.querySelectorAll("#site button").forEach(b =>
    b.classList.toggle("on", b.dataset.m === siteMode));
  document.querySelectorAll("#global button").forEach(b =>
    b.classList.toggle("on", b.dataset.m === cfg.defaultMode));
}

async function load() {
  const tabs = await B.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  tabId = tab?.id;
  try { host = new URL(tab.url).hostname; } catch { host = null; }
  document.getElementById("host").textContent = host || "no site";
  B.storage.sync.get(DEFAULTS, paint);
}

function save(mut) {
  B.storage.sync.get(DEFAULTS, (cfg) => {
    mut(cfg);
    B.storage.sync.set(cfg, () => {
      paint(cfg);
      if (tabId != null) B.tabs.reload(tabId);
    });
  });
}

document.getElementById("site").addEventListener("click", (e) => {
  const m = e.target?.dataset?.m;
  if (m && host) save(cfg => { cfg.sites[host] = m; });
});
document.getElementById("global").addEventListener("click", (e) => {
  const m = e.target?.dataset?.m;
  if (m) save(cfg => { cfg.defaultMode = m; });
});

load();
