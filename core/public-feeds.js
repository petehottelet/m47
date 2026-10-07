// Fixed, keyless public endpoints. Provider payloads never supply URLs or markup.
export const feeds = {
  earthquakes: {
    name: 'USGS / EARTHQUAKES',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    maxAge: 20 * 60_000,
  },
  space: {
    name: 'NOAA SWPC / PLANETARY KP',
    url: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    maxAge: 6 * 60 * 60_000,
  },
};
const clean = (value, max = 40) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, max);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const time = (v) =>
  typeof v === 'number' ? v : Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(v || '') ? v : `${v}Z`);
const timestamp = (v) => new Date(v).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

export function parseFeed(id, data, now = Date.now()) {
  if (!feeds[id]) throw new Error('Unknown public feed.');
  let observed, summary, detail;
  if (id === 'earthquakes') {
    observed = data?.metadata?.generated;
    if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features))
      throw new Error('Invalid earthquake feed.');
    const events = data.features.filter(
      (f) =>
        finite(f?.properties?.mag) &&
        finite(f?.properties?.time) &&
        f.properties.time <= now + 300_000 &&
        f.properties.time >= now - 86_400_000,
    );
    events.sort((a, b) => b.properties.mag - a.properties.mag);
    const largest = events[0];
    summary =
      `${events.length} EVENTS / PAST 24H` +
      (largest ? ` / MAX M ${largest.properties.mag.toFixed(1)}` : ' / NO MAGNITUDE READINGS');
    detail = largest
      ? `${clean(largest.properties.place, 38)} / ${timestamp(largest.properties.time)}`
      : 'No recent events with a reported magnitude.';
  } else {
    if (!Array.isArray(data)) throw new Error('Invalid space weather feed.');
    // NOAA has served both column-header arrays and named objects for this product.
    const rows = Array.isArray(data[0])
      ? data.slice(1).map((row) => Object.fromEntries(data[0].map((key, i) => [key, row[i]])))
      : data;
    const valid = rows
      .map((row) => ({
        t: time(row?.time_tag),
        kp: row?.Kp === null || row?.Kp === '' ? NaN : Number(row?.Kp),
      }))
      .filter(
        (row) =>
          finite(row.t) && row.t <= now + 300_000 && finite(row.kp) && row.kp >= 0 && row.kp <= 9,
      )
      .sort((a, b) => b.t - a.t);
    if (!valid.length) throw new Error('Missing Kp observations.');
    observed = valid[0].t;
    summary = `PLANETARY Kp ${valid[0].kp.toFixed(2)} / SCALE 0–9`;
    detail = `3-HOUR INDEX / OBSERVED ${timestamp(observed)}`;
  }
  if (!finite(observed) || observed <= 0 || observed > now + 300_000)
    throw new Error('Invalid observation time.');
  return { observed, summary, detail };
}

export function describeFeed(id, state, now = Date.now()) {
  if (id === 'off') return null;
  if (id === 'clock')
    return {
      label: 'LOCAL CLOCK / UTC',
      summary: new Date(now).toISOString().replace('T', ' ').slice(0, 19),
      detail: 'DEVICE TIME / NO NETWORK REQUESTS',
    };
  const source = feeds[id];
  if (!source) return null;
  if (!state?.data)
    return {
      label: source.name + (state?.failed ? ' / UNAVAILABLE' : ' / CONNECTING'),
      summary: state?.failed
        ? 'No public readings available. Retrying every 5 minutes.'
        : 'Requesting public observations…',
      detail: 'INSTRUMENTS ABOVE ARE SIMULATED',
    };
  const stale = now - state.data.observed > source.maxAge;
  return {
    label:
      source.name +
      (stale ? ' / STALE' : state.failed ? ' / CACHED · OFFLINE' : ' / PUBLIC OBSERVATIONS'),
    summary: state.data.summary,
    detail: `${state.data.detail} / ${id === 'earthquakes' ? 'FEED' : 'FETCHED'} ${timestamp(id === 'earthquakes' ? state.data.observed : state.fetched)}`,
  };
}

export function createFeedClient({
  fetcher = globalThis.fetch,
  now = Date.now,
  onUpdate = () => {},
} = {}) {
  let selected = 'off',
    request = null,
    generation = 0;
  const cache = new Map();
  async function refresh(force = false) {
    const source = feeds[selected];
    if (!source || request) return;
    const id = selected,
      version = generation,
      old = cache.get(id);
    if (!force && old && now() - old.attempted < 300_000) return;
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const attempted = now();
    try {
      const response = await fetcher(source.url, {
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Feed unavailable.');
      const data = parseFeed(id, await response.json(), now());
      if (version === generation) cache.set(id, { data, fetched: now(), attempted, failed: false });
    } catch {
      if (version === generation) cache.set(id, { ...old, attempted, failed: true });
    } finally {
      clearTimeout(timeout);
      if (version === generation) {
        request = null;
        onUpdate();
      }
    }
  }
  return {
    select(id, active = true) {
      if (!['off', 'clock', ...Object.keys(feeds)].includes(id))
        throw new Error('Unknown public feed.');
      generation++;
      request?.abort();
      request = null;
      selected = id;
      onUpdate();
      if (active) void refresh();
    },
    suspend() {
      generation++;
      request?.abort();
      request = null;
    },
    refresh,
    view() {
      return describeFeed(selected, cache.get(selected), now());
    },
  };
}
