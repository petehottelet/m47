# M47 visual system

The incumbent extension and PRD establish the visual authority. Extend it:
pure black ground, Antonio display text, warm curved structure, lavender controls,
blue data and open space. Body and editor text use readable system fonts.
No gradients, glow, shadows, copied franchise artwork, or decorative constant motion.

Use the semantic tokens in core/tokens.json. Frame segments have black gutters;
exposed bar ends have half-round caps. Typography carries hierarchy rather than
unnecessary containers. Controls remain at least 44px tall.

The generator is an Operate surface: the generated panel is the dominant region,
with an adjacent editor and controls. On mobile controls stack above the preview.
Errors name the invalid input and retain the last valid preview. Exports are
available in context and report canvas-size failures instead of hiding content.

Scene: a person working at a desk or checking a maker panel in subdued light;
black and warm structural colors come directly from the product's pinned style.

Related controls form task-based banks: rectangular inner cells, 3px black gutters,
rounded outer ends, and a visible functional group label. Put larger gaps between
independent action groups; stack whole groups on narrow screens. Export formats and
copy/share are separate tasks. Maintain native button and keyboard behavior.

Within a continuous frame rail, keep every seam at the same 3px gutter, including
nested navigation groups, filler segments, and both elbow joints. Use the shared
`--frame-gap` token; grouping must not introduce wider breaks in the rail. Retain
semantic group labels and color cues, with inset black focus rings on rail controls.

An elbow's inner inset and its vertical rail share the exact same width token.
Column gutters are not part of either width. Their inner edges must align at
desktop and mobile sizes, with no step where the vertical run meets the curve.

The Google and YouTube concepts inherit this system. Surface-specific behavior
and research are documented in docs/GOOGLE-DEMO.md, docs/YOUTUBE-DEMO.md, and
docs/CONTROL-GROUPS.md. Their external services are identified explicitly.

Ambient displays inherit the same frame and type hierarchy. Keep composition
steady between scene changes and label simulated readings visibly. Screensavers may
animate their frame assembly and run bounded instrument motion (sweeps, waveforms,
reactor pulses). Preserve animation nodes during data updates; pause all motion and
requests in hidden tabs. Offer slower and still modes. Reduced motion starts paused
and disables animations. Public observations belong in a distinct band with source,
timestamps, and explicit cached, stale or unavailable states. Browser controls may
recede while idle. A persistent gear provides explicit open/minimize behavior,
with keyboard access; pointer movement must not reopen a minimized panel.
Screensaver behavior is documented in docs/SCREENSAVER.md.

Screensaver titles, subtitles, and metric labels occupy separate text bands.
At the 1440 × 900 source size, standard title/subtitle baselines are 104/134,
and metric label/value/unit baselines are 162/218/216. Narrow reactor titles
keep their fitted size. Rectangular scanners and dedicated operations instruments
share the same palettes and frames; linear scans stay inside the instrument body,
and grouped phase cells retain their nodes between reading updates.

Instrument labels sit wholly inside solid header bands or in clear open space.
Keep grid lines and connecting paths outside their text bounds. Berth frames and
regeneration banks use filled curved elbows, while directional markers use solid
rounded silhouettes. Distribution buses show capacity in separated data cells.
