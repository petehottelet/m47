# M47 visual rules

Use the tokens in tokens.json: black ground; orange/gold structure; lavender
controls; blue data. Red is reserved for an alert state. Scheme presets encode
alternate mappings. Keep color semantic, and use labels in addition to color.

Frame elbows join straight runs with a generous outer curve and tight inner
fillet. Leave black gutters between colored pieces. Exposed bar ends have a
radius of half their height. Use asymmetric structure; keep body content in open
black space rather than stuffing it into colored bars.

For a group of related actions, prefer a connected control bank: rectangular inner
cells with 3px black gutters, rounded exposed ends, and one visible group label.
Leave a larger gap between independent action groups. Export formats and copy/share actions
are separate groups. Every action remains a real, clearly labeled 44px control;
use color as reinforcement, not the only way to identify a group. On mobile stack
whole groups rather than wrapping a connected bank into an ambiguous second row.
Inset keyboard focus rings must contrast against the button fill; use black on
the current warm/lavender fills, not the pale yellow used for focus on black.

Elbow cutouts and vertical rails must share the exact same width value. Do not add
the inter-column gutter to the cutout inset: that creates a visible step where the
corner meets the rail. Check this edge at both desktop and narrow breakpoints.
Every seam within a continuous rail uses the same 3px gutter, including nested
navigation banks, filler segments, and both elbow joints. Share a `--frame-gap`
token across those containers. Keep semantic group labels and color cues without
wider gaps between rail groups. Use inset black focus rings on colored rail controls.

Antonio is the bundled display font, under SIL OFL. Display labels are uppercase;
prose and code retain their own casing and readable fonts. No gradients, shadows,
glow, copied panels, official insignia, or unlicensed recordings.

At narrow widths stack navigation and content, retain 44px targets, visible focus,
and sufficient text contrast. Reduced-motion preferences suppress animation.
Static examples require no JavaScript. The conformance checker is a screening
tool, not proof of accessibility or stylistic fidelity.
