# LCARS control grouping

The user's export-row critique and corner alignment feedback inform this addition.
References checked September 12, 2026:

- [Mike and Denise Okuda Q&A, 1999](https://trektoday.com/interviews/okuda_qa.shtml):
  clarity and task analysis matter; production graphics are not a complete usable
  software specification (questions 2 and 4).
- [Jörn Weißenborn's LCARS framework](https://joernweissenborn.github.io/lcars/):
  rectangular elements, independently rounded ends, rows, columns, spacers, and
  brackets explicitly used to group elements.
- [TheLCARS button guide](https://www.thelcars.com/buttons.php): individual buttons
  and groups with several alignment and wrapping arrangements.

These are distinct kinds of evidence: a creator's design philosophy and community
implementations. Neither establishes one official button-group geometry.

M47's implementation choice is task-based banks with 3px black gutters, square
internal boundaries, capped outer ends, visible labels, and 28px horizontal gaps
between workshop task groups (18px between rows when they wrap). Exports are
HTML/SVG/PNG/CSS; clipboard/share is a separate bank.
Groups remain intact when they stack. Keep keyboard behavior native and hit areas
at least 44px. A group is not a tablist unless it actually changes tabs.

Corner rule: a vertical rail and the elbow's inner inset use the same CSS width
token. Gutters separate elements without changing either element's width.
Within a continuous frame rail, all seams use one 3px `--frame-gap` token: controls
within a bank, boundaries between banks, filler segments, and both elbow joints.
Larger group spacing belongs between independent action banks such as the workshop
exports, not within the frame. Semantic navigation groups and color cues remain;
keyboard focus rings sit inside the colored rail controls.

The [rail spacing regression](../tests/browser/frame-spacing.spec.js) measures each
visible seam in both demos at wide, intermediate, and narrow viewport widths,
including both sides of the mobile breakpoint. It blocks external requests.

## Validation and review

Final review: **PASS**, September 12, 2026. The implementation workflow reported
18 passing local web integration tests and 23 passing core/package checks. All
four targeted Chromium/Firefox YouTube, grouping, and corner tests passed after
the final fixes. The full 20-test browser run, including two unchanged extension
tests, is assigned to CI; no result for that run is claimed here. No tests were
rerun for this documentation update.

| Review item | Disposition | Evidence |
| --- | --- | --- |
| Functional grouping | PASS | Four export controls and two copy/share controls retain their separate labeled banks; each bank stays on one row at 1440px and 390px. |
| Keyboard focus on colored controls | Resolved | The shared stylesheet uses a black outline inset by 5px. Tested bank controls meet at least 3:1 outline-to-background contrast. |
| Rail/corner width mismatch | Resolved | Both Google and YouTube use `var(--rail)` for the rail column and both elbow insets, without adding the gutter. |
| Duplicate desktop navigation | Resolved | YouTube exposes one library-view bank per viewport. |

The [targeted tests](../tests/browser/youtube.spec.js) verify bank contents,
row integrity, focus contrast, equal computed rail/inset widths, and no horizontal
overflow at the tested desktop and mobile sizes. The appended rules in
[DESIGN.md](../DESIGN.md) match the current implementation and needed no correction.
The provider portions of these tests intercept search and embed requests; they do
not certify external Google results or actual YouTube playback.

## Screenshots

| Surface | Desktop, 1440px viewport | Mobile, 390px viewport |
| --- | --- | --- |
| Workshop control banks (cropped) | [Desktop controls](../store-assets/latest/control-groups-1440.png) | [Mobile controls](../store-assets/latest/control-groups-390.png) |
| Google frame alignment | [Desktop Google](../store-assets/latest/google-1440.png) | [Mobile Google](../store-assets/latest/google-390.png) |

The corresponding YouTube views are linked in [YOUTUBE-DEMO.md](YOUTUBE-DEMO.md).
