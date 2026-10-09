# Topographical maps

Open `topography.html` in the built website for five original contour-map styles.
Each map offers a standalone SVG download. The terrain is procedural illustration,
not real geographic or elevation data.

| Style | Terrain and treatment |
| --- | --- |
| Survey contours | Amber highlands with fine isolines and heavier index contours |
| Abyssal depths | Blue depth lines around a winding ocean trench |
| Volcanic relief | Coral caldera slopes with gold and pale summit lines |
| Glacial valleys | Lavender contours forming broad branching valleys |
| Dune field | Gold parallel ridges with alternating contour weights |

Run `npm run build:topography` to export all five SVGs, PNGs, and a comparison
sheet into `dist/topography/`.

Use `renderTopography({ style: 'survey', seed: '47', width: 960, height: 540 })`
from `core/topography.js` to generate a complete SVG. The same seed and options
produce the same map. `createTopography` returns immutable contour geometry for
custom composition. Dimensions range from 100 to 4096 SVG units.

Contours are extracted from smooth height fields with marching squares. Shared
edge intersections join into continuous paths; ambiguous saddle cells use a
bilinear determinant. Geometry is bounded and cached, with no network requests.
