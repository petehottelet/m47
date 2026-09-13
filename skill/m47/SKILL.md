---
name: m47
description: Create original LCARS-inspired retro terminal interfaces with the M47 engine for dashboards, maker panels, websites, and SVG graphics. Use for LCARS, Star Trek interface styling, Okudagrams, or Enterprise-computer aesthetic requests.
---

Use M47's shared primitives and tokens for original compositions. Preserve the
user's content, behavior, framework, and explicit instructions. M47 is fan-made;
credit Michael Okuda for LCARS and include the bundled NOTICE in distributions.

For generation, read [the content schema](reference/schema.md) and choose a canvas
that fits the content. Run the bundled CLI, relative to this skill folder:

```sh
node cli/index.js generate --spec panel.json --size 1280x800 --seed 47 --out panel.html
node cli/index.js check panel.html
```

HTML generation needs only Node 22+. For PNG and HTML extraction, install the
package dependencies in this folder first. The normal HTML/SVG path is offline,
including Antonio. The same inputs and seed yield the same output.

For integrating an existing app, read [the visual rules](reference/design.md), use
`reference/theme.css` and `reference/components.css`, and preserve readable body
text, semantic controls, keyboard operation, and the incumbent app's state.
Restyling must be reversible; do not replace application content with a static mock.

Group related controls into task-based banks using `reference/control-groups.css`;
read [the grouping rationale](reference/control-groups.md). Use rectangular inner
cells, capped outer ends, narrow black gutters, and larger gaps between tasks.
Make elbow cutouts and vertical rails use exactly the same width token.

The release includes `reference/demos/`: the workshop plus Google and YouTube
adaptation examples. Serve that directory with a local static server to explore
their interactions. These are labeled concepts, not replacements for those sites.
The YouTube example requests external thumbnails and user-selected video players;
normal engine HTML/SVG generation remains offline.

Check output with the CLI's static linter and [the conformance rubric](reference/conformance.json).
The static check covers only a subset; inspect the actual rendered result at the
target size and a narrow viewport. Repair clipping and unreadable text. SVG/PNG
report insufficient height: enlarge the canvas or use scrolling HTML; do not
silently discard the user's content to make a panel fit.

Reference examples live in `reference/examples/`. Offer a different seed, density,
or palette only when useful. Sound is optional and must follow a user gesture;
do not autoplay or use recordings from shows. Never infer publication permission
from a request to generate a design.
