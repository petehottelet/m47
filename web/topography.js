import { topographyStyles, renderTopography } from '../core/topography.js';

for (const style of topographyStyles) {
  const article = document.createElement('article');
  article.style.setProperty('--map-color', style.color);
  const svg = renderTopography({ style: style.id });
  article.innerHTML = `<div class="map">${svg}</div><div class="caption"><div><h2>${style.name}</h2><p>${style.description}</p></div><button type="button">Save SVG</button></div>`;
  article.querySelector('button').setAttribute('aria-label', `Save ${style.name} as SVG`);
  article.querySelector('button').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `m47-topography-${style.id}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById('maps').append(article);
}
