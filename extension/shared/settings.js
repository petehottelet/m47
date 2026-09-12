export const B = globalThis.browser ?? globalThis.chrome;
export const MODES = ['full', 'palette', 'off'];
export const DEFAULTS = { defaultMode: 'full', scheme: 'tng-default', sites: {} };
export function siteHost(url) {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) ? u.hostname : null;
  } catch {
    return null;
  }
}
export function decodeSettings(raw = {}) {
  const sites = Object.create(null);
  for (const [key, value] of Object.entries(raw))
    if (key.startsWith('site:') && MODES.includes(value)) sites[key.slice(5)] = value;
  return {
    defaultMode: MODES.includes(raw.defaultMode) ? raw.defaultMode : 'full',
    scheme: ['tng-default', 'tng-early', 'red-alert'].includes(raw.scheme)
      ? raw.scheme
      : 'tng-default',
    sites,
  };
}
export async function getSettings() {
  const response = await B.runtime.sendMessage({ type: 'settings-read' });
  if (response?.error) throw new Error(response.error);
  return response.settings;
}
export async function updateSettings(change) {
  const response = await B.runtime.sendMessage({ type: 'settings-update', change });
  if (response?.error) throw new Error(response.error);
  return response.settings;
}
