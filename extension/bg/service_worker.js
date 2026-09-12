const B = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { defaultMode: "full", sites: {} };
const CYCLE = { full: "palette", palette: "off", off: "full" };

B.runtime.onInstalled.addListener(() => {
  B.storage.sync.get(DEFAULTS, (cfg) => B.storage.sync.set({ ...DEFAULTS, ...cfg }));
});

B.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "cycle-mode") return;
  const [tab] = await B.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  let host; try { host = new URL(tab.url).hostname; } catch { return; }
  B.storage.sync.get(DEFAULTS, (cfg) => {
    const cur = cfg.sites[host] ?? cfg.defaultMode;
    cfg.sites[host] = CYCLE[cur] ?? "full";
    B.storage.sync.set(cfg, () => B.tabs.reload(tab.id));
  });
});
