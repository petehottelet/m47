# M47 instrument gallery

Open `/instruments.html` in the built website. The gallery includes five mesh grids,
five oscilloscope ridge fields, five contour maps, the stellar sector map, the asymmetric arc scanner, and
the updated screensaver preview. Filter by family, expand a preview, pause motion,
or save the current geometry as SVG. All terrain and readings are simulated.

## Implementations

| Family | Variants |
| --- | --- |
| Mesh grid | Alpine grid, Tidal lattice, Caldera mesh, Fault plane, Dune traverse |
| Oscilloscope ridges | Carrier wave, Pulse stack, Seismic ridges, Harmonic strata, Interference field |
| Contour map | Survey contours, Abyssal depths, Volcanic relief, Glacial valleys, Dune field |

The mesh and ridge variants differ in their height functions as well as colors.
They share a perspective/trace renderer with reusable coordinate buffers. Mesh
rows move toward the viewer while their horizon remains anchored. Foreground
masks hide distant lines. Ridge fields use stacked waveforms with the same
occlusion order. Contour maps use connected marching-squares paths.

```js
import { createTerrainRenderer, drawTerrain, renderTerrain } from '@petehottelet/m47/terrain';
import { renderTopography } from '@petehottelet/m47/topography';

const renderer = createTerrainRenderer({ family: 'mesh', style: 'alpine', seed: '47' });
drawTerrain(canvas.getContext('2d'), renderer.sample(2.5)); // Playback time in seconds
const meshSVG = renderTerrain({ family: 'mesh', style: 'alpine', time: 2.5 });
const ridgeSVG = renderTerrain({ family: 'ridges', style: 'carrier' });
const contourSVG = renderTopography({ style: 'survey' });
```

Default dimensions are 960 × 540. Set the canvas backing dimensions to match the
renderer. Pass `width` and `height` to change them. The renderer owns its mutable
frame buffers; copy a frame's coordinates if retaining them across samples.
Playback is supplied by the host, so a held time produces held geometry.
Stellar Cartography uses a coordinate sector map with four plotted systems and a
selected course. It replaces the scan instrument for the navigation purpose.

The gallery updates only visible canvas instruments at a maximum of 24 frames
per second. Hidden tabs stop playback, and reduced motion starts paused. Contour
maps are static. Exports contain the displayed geometry without animation.

## Source review

The corresponding renderers in hottelet.com's `index.html` were reviewed:
`drawMesh`, `meshGridPhase`, `drawRidges`, `drawContour`, `toneField`, and `toneAt`,
along with the mesh and approach regression tests (17 passing).

| Source technique | M47 adaptation |
| --- | --- |
| Perspective rows, foreground padding, painter-order masks | Retained in the mesh renderer, with independent variant height functions |
| Playback-driven grid phase and reusable typed arrays | Supplied playback time and per-renderer buffers, without the source's global settings |
| Full-width oscilloscope rows and baseline masks | Five signal functions with stable stacking and near-row occlusion |
| Blurred, upsampled luminance and marching squares | Smooth analytic terrain sampled directly; continuous joined paths suitable for SVG |
| Fixed contour pairings in ambiguous saddle cells | Bilinear determinant selects connectivity from the sampled heights |
| Source-wide bloom and CRT postprocessing | M47's crisp linework, black ground, and semantic palette |

The source review was scoped to these rendering paths and their integration
requirements. The hottelet.com source was not modified.
