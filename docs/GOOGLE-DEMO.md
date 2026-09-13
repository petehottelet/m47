# Google × M47 local concept

Surface: [`web/google.html`](../web/google.html) (Operate). Presentation and local
interaction live in [`web/google.css`](../web/google.css) and
[`web/google.js`](../web/google.js).

The requested reference is [Google](https://www.google.com/), inspected September
12, 2026. The implemented adaptation preserves its centered wordmark, prominent
search field, Search and Lucky actions, Google service navigation, and open space.
It applies the established [M47 visual system](../DESIGN.md), with the page clearly
labeled as a local, unofficial concept that is not affiliated with Google.

## Visual adaptation

The page uses the semantic palette from [`core/tokens.json`](../core/tokens.json):
black ground, orange structure, warm yellow secondary actions, lavender controls,
blue data accents, light body text, and muted supporting copy. Its stylesheet names
the lavender interactive color `--control`; this is the same value as the core
`interactive` token. Bright yellow marks hover and focus states.

Antonio supplies the M47 mark, recolored Google wordmark, frame labels, rail links,
and search action labels. System fonts keep the query and supporting text readable.
The wordmark uses Antonio at a responsive desktop size of 92–144px. Flat color,
curved frame elbows, pill controls, and black gutters carry the visual hierarchy
without shadows, gradients, glow, or continuous motion.

The desktop frame has a 112px navigation rail, 4px gutters, orange upper structure,
and a warm yellow lower bar. Search content is centered within a maximum width of
660px. The lavender outlined search field is at least 62px tall; its rounded shape
retains the familiar search affordance within the M47 frame. Search actions are
48px tall, and the clear control and apps trigger are 44px square.

At widths of 720px and below, the frame contracts to an 18px rail with 3px gutters.
The wordmark scales to 82–110px, the field becomes at least 56px tall, and example
links wrap beneath their prompt. The desktop rail links and top-level Gmail and
Images links are hidden, while their Google destinations remain reachable in the
apps menu. The M47 mark and footer retain routes back to the workshop.

## Search and navigation behavior

- The native search form submits a GET request to `https://www.google.com/search`
  in a new tab. The query is sent as `q`; the Lucky action also sends
  `btnI=I'm Feeling Lucky`. The local concept stays open.
- The field is required and capped at 2,000 characters. Local JavaScript rejects
  whitespace-only input and trims surrounding whitespace when submitting.
- Typed queries stay in the field until submission. There is no query storage,
  remote autocomplete, account form, or local imitation of search results.
  The field requests `autocomplete="off"`.
- Webb telescope, Architecture, and Deep sea examples only fill and focus the
  input. Selecting an example does not submit a search.
- The clear button appears for nonempty input, empties the field, and returns
  focus to it. The `/` shortcut focuses search when the user is not already
  editing a field and no Ctrl, Command, or Alt modifier is held.
- The native apps disclosure contains Gmail, Images, Search, Maps, YouTube,
  Drive, and Calendar. These service links open their real destinations in new
  tabs. Clicking outside closes the menu; Escape closes it and returns focus
  to its trigger.

A skip link leads to the labeled search input. The form exposes a search landmark,
the search note describes the new-tab behavior, and visible focus outlines use the
bright palette color. The active rail destination has `aria-current="page"`.
Reduced-motion preference disables the search buttons' 1px pressed movement.

## Preview and screenshots

Run `npm run build`, then `npm run dev`, and open the
[local Google concept](http://127.0.0.1:4747/google.html). The build includes the
HTML, stylesheet, script, and local Antonio font in the website bundle. The
workshop's generated offline asset cache includes the Google surface; real Google
searches and service destinations require a network connection.

The captured Chromium views are:

| View | Viewport | Screenshot |
| --- | --- | --- |
| Desktop | 1440 × 900 | [Desktop](../store-assets/google/desktop.png) |
| Mobile | 390 × 844 | [Mobile](../store-assets/google/mobile.png) |
| Mobile apps menu | 390 × 844 | [Mobile menu](../store-assets/google/mobile-menu.png) |

## Verification record

The completed implementation and review workflow reported a final **PASS** on
September 12, 2026. All four targeted Chromium/Firefox browser runs passed, along
with the existing 23 core/package tests. This documentation pass did not rerun them.

[`tests/browser/google.spec.js`](../tests/browser/google.spec.js) covers local
example filling, no external requests before search submission, new-tab Search
and Lucky parameters, whitespace validation, keyboard focus and clearing, and the
mobile apps menu. Gmail and Images are verified as visible and keyboard reachable
in that menu. The tests also check Escape focus restoration, absence of horizontal
overflow at 390px and 320px, and no violations in the configured automated WCAG 2 A/AA
audit.

Outbound HTTPS requests are intercepted during the search tests. Those checks
verify the local form's request and popup behavior; Google's returned results and
Lucky destination behavior are outside that test coverage.
