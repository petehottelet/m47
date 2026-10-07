import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFeedClient, parseFeed, describeFeed, feeds } from '../core/public-feeds.js';
import { createScene, renderScene } from '../core/screensaver.js';

const now = Date.UTC(2026, 8, 30, 12);
const earthquake = {
  type: 'FeatureCollection',
  metadata: { generated: now },
  features: [
    { properties: { mag: 4.2, time: now - 60_000, place: '<script>alert(1)</script> Coast' } },
    { properties: { mag: null, time: now } },
  ],
};
const kp = [
  { time_tag: '2026-09-30T09:00:00', Kp: 2.33 },
  { time_tag: '2026-09-30T12:00:00', Kp: 3 },
];

test('public parsers select recent valid observations and support both NOAA schemas', () => {
  const data = parseFeed('earthquakes', earthquake, now);
  assert.match(data.summary, /1 EVENTS.*MAX M 4.2/);
  assert.match(parseFeed('space', kp, now).summary, /Kp 3.00/);
  assert.deepEqual(
    parseFeed(
      'space',
      [
        ['time_tag', 'Kp'],
        ['2026-09-30T12:00:00', '3'],
      ],
      now,
    ),
    parseFeed('space', kp, now),
  );
  for (const data of [
    null,
    {},
    [],
    [{ time_tag: '2026-09-30T12:00:00', Kp: null }],
    [{ time_tag: 'invalid', Kp: 3 }],
    [{ time_tag: '2026-09-30T12:00:00', Kp: 10 }],
  ])
    assert.throws(() => parseFeed('space', data, now));
  assert.throws(() =>
    parseFeed('earthquakes', { ...earthquake, metadata: { generated: now + 600_000 } }, now),
  );
  assert.match(parseFeed('earthquakes', { ...earthquake, features: [] }, now).summary, /0 EVENTS/);
});

test('observations distinguish stale, cached, unavailable and simulated data and escape feed text', () => {
  const data = parseFeed('earthquakes', earthquake, now);
  const state = { data, fetched: now };
  assert.match(describeFeed('earthquakes', state, now).label, /PUBLIC OBSERVATIONS/);
  assert.match(describeFeed('earthquakes', state, now + 21 * 60_000).label, /STALE/);
  assert.match(
    describeFeed('earthquakes', { ...state, failed: true }, now).label,
    /CACHED.*OFFLINE/,
  );
  assert.match(describeFeed('earthquakes', { failed: true }, now).label, /UNAVAILABLE/);
  assert.match(
    describeFeed('space', { data: parseFeed('space', kp, now), fetched: now }, now + 7 * 3600_000)
      .label,
    /STALE/,
  );
  assert.equal(describeFeed('off', null, now), null);
  assert.match(describeFeed('clock', null, now).detail, /NO NETWORK/);
  const svg = renderScene(createScene(), { feed: describeFeed('earthquakes', state, now) });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  assert.match(svg, /Instrument readings are simulated/);
});

test('feed client makes no default requests, throttles, and retains last observation on failure', async () => {
  let calls = 0,
    instant = now,
    fail = false;
  const client = createFeedClient({
    now: () => instant,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, feeds.earthquakes.url);
      assert.equal(options.credentials, 'omit');
      assert.equal(options.redirect, 'error');
      if (fail) throw new Error('Offline');
      return { ok: true, json: async () => earthquake };
    },
  });
  await client.refresh();
  assert.equal(calls, 0);
  client.select('clock');
  await client.refresh();
  assert.equal(calls, 0);
  client.select('earthquakes', false);
  await client.refresh();
  assert.equal(calls, 1);
  await client.refresh();
  assert.equal(calls, 1);
  instant += 300_000;
  fail = true;
  await client.refresh();
  assert.equal(calls, 2);
  assert.match(client.view().label, /CACHED.*OFFLINE/);
  assert.match(client.view().summary, /MAX M 4.2/);
  client.select('off');
  assert.equal(client.view(), null);
});

test('switching feeds aborts in-flight work and ignores a late response', async () => {
  let finish, signal;
  const client = createFeedClient({
    now: () => now,
    fetcher: (_url, options) => {
      signal = options.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  client.select('earthquakes', false);
  const pending = client.refresh();
  client.select('clock');
  assert.equal(signal.aborted, true);
  finish({ ok: true, json: async () => earthquake });
  await pending;
  assert.match(client.view().label, /LOCAL CLOCK/);
  assert.doesNotMatch(client.view().summary, /EVENTS/);
});
