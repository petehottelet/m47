# YouTube × M47 local concept

Surface: `web/youtube.html` (Operate), with `web/youtube.css`, `web/youtube.js`,
the shared frame in `web/google.css`, and `web/control-groups.css`.

The user requested an LCARS YouTube example and stronger functional grouping.
Keep recognizable video browsing, a search field, thumbnails, a local Watch Later
list, and a player. Use M47's established black ground, warm connected frame,
Antonio labels, and grouped rectangular controls with rounded outer ends.

Open `http://127.0.0.1:4747/youtube.html`. Search opens real YouTube results in a
new tab. Six curated NASA videos appear in the local collection; topic filtering
does not request an API. Titles/channel attribution were checked September 12,
2026. No view counts, subscriber counts, upload recency, or personalized-feed
claims are fabricated.

Sources:

- [Earth views — NASA Johnson](https://www.youtube.com/watch?v=ElxVZL526o8)
- [Tour of the Moon — NASA Goddard](https://www.youtube.com/watch?v=nr5Pj6GQL2o)
- [Black-hole flight explained — NASA Goddard](https://www.youtube.com/watch?v=XgF46YYPplI)
- [Perseverance landing — NASA](https://www.youtube.com/watch?v=4czjS9h4Fpg)
- [A Decade of Sun — NASA Goddard](https://www.youtube.com/watch?v=l3QQQu7QLoM)
- [Jupiter in 4K — NASA Goddard](https://www.youtube.com/watch?v=3afEX8a2jPg)

Thumbnails load from YouTube; videos are embedded only after selection. Their
rights remain with their owners. Media files are not bundled; demonstration
screenshots include third-party thumbnails without relicensing those images.
A direct YouTube link accompanies the player because availability, embedding
permission, and browser policy are external conditions. Watch Later persists
video IDs locally, with an in-memory fallback if storage is unavailable.

On mobile, library views move into a visible control bank above the collection;
the side frame contracts while preserving equal rail/corner widths. All topic
choices stay together, and video tiles flow into one column.

## Validation and review

Final review: **PASS**, September 12, 2026. The implementation workflow reported
18 passing local web integration tests and 23 passing core/package checks. After
the final fixes, all four targeted Chromium/Firefox YouTube, grouping, and corner
tests passed again. CI is expected to run all 20 browser tests, including the two
unchanged extension tests; that CI result is not claimed here. This documentation
pass did not rerun tests.

| Review item | Disposition | Evidence |
| --- | --- | --- |
| Duplicate desktop library navigation | Resolved | Exactly one Home and one Watch Later control are visible at each tested viewport. |
| Grouped-control keyboard focus | Resolved | Shared controls use a black inset focus outline; the workshop bank contrast check passes at 3:1 or greater. |
| Rail and elbow alignment | PASS | Top and bottom insets equal the rail width on desktop and mobile. |

The [targeted tests](../tests/browser/youtube.spec.js) cover topic filtering,
Watch Later persistence, empty-state recovery, loading and removing the player,
focus restoration, and new-tab search parameters. They also cover overflow and
the configured automated WCAG 2 A/AA audit at desktop and mobile widths.

Provider tests intercept search and embed requests. They verify local request
flow and player lifecycle; actual video playback remains external. The direct
YouTube link remains the fallback when embedded playback is unavailable.

## Screenshots

| View | Viewport | Screenshot |
| --- | --- | --- |
| Desktop collection | 1440 × 1000 | [Desktop](../store-assets/latest/youtube-1440.png) |
| Mobile collection | 390 × 844 | [Mobile](../store-assets/latest/youtube-390.png) |
