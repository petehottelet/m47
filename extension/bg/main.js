import { B, MODES, decodeSettings, siteHost } from '../shared/settings.js';
let initialization;
async function initialize() {
  if (!initialization)
    initialization = (async () => {
      const current = await B.storage.local.get(null);
      if (current.settingsVersion === 2) return;
      const old = await B.storage.sync.get(['defaultMode', 'sites']);
      const migrated = {
        settingsVersion: 2,
        defaultMode: MODES.includes(old.defaultMode) ? old.defaultMode : 'full',
      };
      for (const [host, mode] of Object.entries(old.sites ?? {}))
        if (MODES.includes(mode)) migrated['site:' + host] = mode;
      await B.storage.local.set({ ...migrated, ...current, settingsVersion: 2 });
      await B.storage.sync.remove(['defaultMode', 'sites']);
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  return initialization;
}
let queue = Promise.resolve();
const read = async () => {
  await initialize();
  return decodeSettings(await B.storage.local.get(null));
};
async function update(change) {
  await initialize();
  if (change?.type === 'default' && MODES.includes(change.mode))
    await B.storage.local.set({ defaultMode: change.mode });
  else if (
    change?.type === 'site' &&
    typeof change.host === 'string' &&
    /^[a-z0-9.:[\]-]+$/i.test(change.host) &&
    change.host.length <= 253
  ) {
    if (change.mode === null) await B.storage.local.remove('site:' + change.host);
    else if (MODES.includes(change.mode))
      await B.storage.local.set({ ['site:' + change.host]: change.mode });
    else throw new Error('Unknown mode.');
  } else if (change?.type === 'reset') {
    const raw = await B.storage.local.get(null);
    await B.storage.local.remove(Object.keys(raw).filter((k) => k.startsWith('site:')));
  } else throw new Error('Invalid setting change.');
  return read();
}
B.runtime.onInstalled.addListener(() => {
  initialize().catch(console.error);
});
B.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== B.runtime.id || !['settings-read', 'settings-update'].includes(message?.type))
    return false;
  queue = queue
    .catch(() => {})
    .then(async () => ({
      settings: await (message.type === 'settings-read' ? read() : update(message.change)),
    }));
  queue.then(respond, (error) => respond({ error: error.message }));
  return true;
});
B.commands.onCommand.addListener((cmd) => {
  if (cmd !== 'cycle-mode') return;
  queue = queue
    .catch(() => {})
    .then(async () => {
      const [tab] = await B.tabs.query({ active: true, currentWindow: true });
      const host = siteHost(tab?.url);
      if (!host) return;
      const cfg = await read();
      const mode = cfg.sites[host] ?? cfg.defaultMode;
      await update({ type: 'site', host, mode: MODES[(MODES.indexOf(mode) + 1) % MODES.length] });
    })
    .catch(console.error);
});
