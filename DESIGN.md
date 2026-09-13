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
unrelated groups; stack whole groups on narrow screens. Export formats and
copy/share are separate tasks. Maintain native button and keyboard behavior.

An elbow's inner inset and its vertical rail share the exact same width token.
Column gutters are not part of either width. Their inner edges must align at
desktop and mobile sizes, with no step where the vertical run meets the curve.

The Google and YouTube concepts inherit this system. Surface-specific behavior
and research are documented in docs/GOOGLE-DEMO.md, docs/YOUTUBE-DEMO.md, and
docs/CONTROL-GROUPS.md. Their external services are identified explicitly.
