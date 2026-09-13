const videos = [
  {
    id: 'ElxVZL526o8',
    title: '4K Earth Views Extended Cut for Earth Day 2021',
    creator: 'NASA Johnson',
    topic: 'earth',
    label: 'Earth from orbit',
  },
  {
    id: 'nr5Pj6GQL2o',
    title: 'Tour of the Moon in 4K',
    creator: 'NASA Goddard',
    topic: 'solar',
    label: 'Lunar exploration',
  },
  {
    id: 'XgF46YYPplI',
    title: 'NASA Simulation’s Flight Around a Black Hole: Explained',
    creator: 'NASA Goddard',
    topic: 'deep',
    label: 'Beyond the horizon',
  },
  {
    id: '4czjS9h4Fpg',
    title: 'Perseverance Rover’s Descent and Touchdown on Mars',
    creator: 'NASA',
    topic: 'solar',
    label: 'Landing on Mars',
  },
  {
    id: 'l3QQQu7QLoM',
    title: 'A Decade of Sun',
    creator: 'NASA Goddard',
    topic: 'solar',
    label: 'Our nearest star',
  },
  {
    id: '3afEX8a2jPg',
    title: 'NASA | Jupiter in 4k Ultra HD',
    creator: 'NASA Goddard',
    topic: 'solar',
    label: 'The giant planet',
  },
];
const storageKey = 'm47-youtube-watch-later';
const status = document.querySelector('#video-status');
let saved = new Set();
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored))
    saved = new Set(stored.filter((id) => videos.some((v) => v.id === id)));
} catch {
  /* A blocked or corrupt store does not prevent browsing. */
}
let view = 'home';
let topic = 'all';
let activeVideo = null;
const cards = new Map();
const grid = document.querySelector('#videos');
const watch = document.querySelector('#watch');
const player = document.querySelector('#player');

function openVideo(video) {
  activeVideo = video.id;
  const frame = document.createElement('iframe');
  frame.title = video.title + ' — YouTube player';
  frame.src = 'https://www.youtube-nocookie.com/embed/' + video.id;
  frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  player.replaceChildren(frame);
  document.querySelector('#watch-title').textContent = video.title;
  document.querySelector('#watch-external').href = 'https://www.youtube.com/watch?v=' + video.id;
  watch.hidden = false;
  document.querySelector('#watch-title').focus();
  watch.scrollIntoView({ block: 'start' });
}
function render() {
  let count = 0;
  for (const video of videos) {
    const card = cards.get(video.id);
    const visible =
      (topic === 'all' || video.topic === topic) && (view === 'home' || saved.has(video.id));
    card.hidden = !visible;
    if (visible) count++;
    const button = card.querySelector('.save');
    button.setAttribute('aria-pressed', String(saved.has(video.id)));
    button.setAttribute(
      'aria-label',
      (saved.has(video.id) ? 'Remove from Watch Later: ' : 'Save to Watch Later: ') + video.title,
    );
  }
  document.querySelector('#video-count').textContent = count + (count === 1 ? ' video' : ' videos');
  document.querySelector('#library-title').textContent =
    view === 'saved' ? 'Your next discoveries.' : 'A window to the universe.';
  document.querySelector('#empty').hidden = count > 0;
  document.querySelector('#empty-help').textContent =
    view === 'saved'
      ? 'Save a video with its bookmark button. It will be waiting here.'
      : 'Try another topic or show the full collection.';
  document
    .querySelectorAll('[data-view]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  document
    .querySelectorAll('[data-topic]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.topic === topic)),
    );
}
for (const [index, video] of videos.entries()) {
  const card = document.createElement('article');
  card.className = 'video-card';
  card.innerHTML =
    '<button class="thumbnail" type="button"><img alt="" width="480" height="270"/><span class="image-fallback"></span><span class="play" aria-hidden="true"><svg viewBox="0 0 12 14"><path d="m1 1 10 6-10 6Z"/></svg></span></button><div class="video-meta"><div><h2><button class="title-button" type="button"></button></h2><p class="creator"></p><p class="topic"></p></div><button class="save" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z"/></svg></button></div>';
  const thumbnail = card.querySelector('.thumbnail');
  thumbnail.setAttribute('aria-label', 'Watch: ' + video.title);
  const img = card.querySelector('img');
  img.loading = index < 3 ? 'eager' : 'lazy';
  img.referrerPolicy = 'no-referrer';
  img.src = 'https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg';
  img.addEventListener('error', () => thumbnail.classList.add('image-failed'));
  card.querySelector('.image-fallback').textContent = video.label;
  card.querySelector('.title-button').textContent = video.title;
  card.querySelector('.creator').textContent = video.creator;
  card.querySelector('.topic').textContent = video.label;
  thumbnail.addEventListener('click', () => openVideo(video));
  card.querySelector('.title-button').addEventListener('click', () => openVideo(video));
  card.querySelector('.save').addEventListener('click', () => {
    const wasSaved = saved.has(video.id);
    if (wasSaved) saved.delete(video.id);
    else saved.add(video.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...saved]));
      status.textContent = wasSaved
        ? 'Removed from Watch Later.'
        : 'Saved to Watch Later on this device.';
    } catch {
      status.textContent = 'Saved for this visit. Browser storage is unavailable.';
    }
    render();
    if (wasSaved && view === 'saved')
      [...document.querySelectorAll('[data-view="saved"]')]
        .find((button) => button.getClientRects().length)
        ?.focus();
  });
  grid.append(card);
  cards.set(video.id, card);
}
document.querySelectorAll('[data-topic]').forEach((button) =>
  button.addEventListener('click', () => {
    topic = button.dataset.topic;
    render();
  }),
);
document.querySelectorAll('[data-view]').forEach((button) =>
  button.addEventListener('click', () => {
    view = button.dataset.view;
    topic = 'all';
    render();
  }),
);
document.querySelector('#show-all').addEventListener('click', () => {
  view = 'home';
  topic = 'all';
  render();
  cards.values().next().value.querySelector('.thumbnail').focus();
});
document.querySelector('#close-watch').addEventListener('click', () => {
  watch.hidden = true;
  player.replaceChildren();
  const card = cards.get(activeVideo);
  if (card && !card.hidden) card.querySelector('.thumbnail').focus();
  else document.querySelector('[data-topic="all"]').focus();
  activeVideo = null;
});
const query = document.querySelector('#video-query');
query.addEventListener('input', () =>
  query.setCustomValidity(query.value.length && !query.value.trim() ? 'Enter a search term.' : ''),
);
render();
