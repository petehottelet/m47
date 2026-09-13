# M47 assessment — September 12, 2026

**Before: 5/10. After this implementation: 8.5/10.**

These are engineering judgments against the product's intended experience, not
claims of perfect compatibility or a mathematical measure of quality. The original
prototype had a strong identity but only one of five product surfaces, no test
suite, contradictory privacy copy, and incomplete distribution tooling.

| Dimension | Before | After | What changed |
|---|---:|---:|---|
| Visual identity and usability | 8 | 9 | Shared palettes, original gallery, responsive workshop, readable popup, coherent exports |
| Product completeness | 3 | 8 | Engine/library, CLI, workshop/PWA, portable skill, improved restyler, Reader, new-tab and themes |
| Reliability | 4 | 8.5 | Validated inputs, deterministic output, lifecycle teardown, local preferences, preserved page state |
| Privacy and accessibility | 5 | 9 | Local storage, permission-free new tab, inert imports, sandboxed preview, keyboard/contrast checks |
| Distribution and verification | 3 | 8 | Private MIT repo, versioned bundles, checksums, pinned CI, current publishing guide and store assets |

## Evidence

- **23 Node tests passed:** twelve canvas/seed fixtures, schema validation, escaped
  hostile content, embedded font license preservation, SVG overflow and label geometry, semantic contrast, local
  extraction, hostname isolation, CLI formats, output overwrite protection, ZIP
  contents and checksums. PNG dimensions/signature are checked, not just file existence.
- **12 Playwright tests passed** across Chromium and Firefox: editing, invalid-state
  recovery, gallery, downloads, local draft restore, share-fragment handling, inert
  HTML imports, offline reload, mobile overflow, and automated WCAG AA checks.
  Real Chromium extension tests cover mode switching without navigation, preservation
  of typed text and later site style changes, reader close, mutation-loop stability,
  and persistent new-tab links with script-URL rejection.
- Follow-up web concepts add **8 browser checks**, making the current CI suite
  **20 tests**. They cover Google query submission, no remote autocomplete,
  YouTube topic filters, persistent Watch Later, lazy player creation and teardown,
  mobile service access, connected action-bank layout, inset focus contrast, and
  exact equality of rail width and elbow inset at desktop/mobile sizes.
- **Mozilla web-ext 10.6.0:** page extension, new-tab extension, and static Firefox
  theme each passed with zero errors, warnings, and notices.
- **Lighthouse 13.4.1**, local mobile simulation: **99 performance / 100 accessibility /
  100 best practices / 100 SEO**, CLS **0.001**. This is a local lab run, not a
  hosted-service guarantee or a field performance measurement. Raw report:
  `store-assets/lighthouse.json`. The font-loading layout shift found in the first
  audit was fixed with font preloading and stable layout dimensions.
  This report predates the Google/YouTube concepts and control regrouping.
- Desktop and mobile screenshots were visually inspected. Export inspection caught
  and fixed meter-label overlap; a regression test now checks its geometry. Current
  submission images and original promo tiles are in `store-assets/v0.2/`.
- Agent skill frontmatter passed Skill Creator validation. The generated bundle
  includes its own font, CLI, engine, CSS, tokens, rubric, and examples.
- Source formatting, npm package allowlist, MIT/OFL notices, and private repository
  visibility were checked. GitHub CI runs builds on Linux, Windows, and macOS plus
  Chromium/Firefox browser flows; see the repository's Actions page for run evidence.

Automated accessibility checks cover the workshop shell and a representative
standalone HTML export; the embedded preview deliberately uses a sandbox. All
generated examples also receive structural/contrast tests and visual review.
These checks do not prove complete WCAG conformance or screen-reader quality.

## What prevents a 10

1. **Broad real-site compatibility is unproven.** Ten scoped compatibility rules
   are included, but they are not a current top-100-site certification. Closed
   shadow roots, cross-origin frames, CSS-generated content, app overlays, and
   unusual layouts remain limits. Palette/Off remain essential escape hatches.
2. **Distribution has external gates.** Public policy hosting, store publisher
   accounts/reviews, Firefox signing, and npm scope ownership/publication require
   the publisher's accounts and decisions. Packages are prepared; no approval is
   implied. Safari, Edge-specific behavior and Firefox Android were not live-tested.
3. **The historical PRD is broader than 0.2.** The release covers all five product
   surfaces, but not every aspirational feature or benchmark. There is no arbitrary
   URL-fetch proxy, exhaustive shadow-DOM restyling, full formal conformance parser,
   or automatic screenshot-diff baseline suite. Markdown input is preserved as
   text. Reader uses bounded local text extraction, not a universal article parser.
   Form integration is guided by the agent skill rather than a generated form DSL.
4. **Independent assessment remains.** The ten-task skill evaluation has not been
   run in both Codex and Claude, and fan fidelity/screen-reader reviews are pending.
   MIT is a code/document license, not third-party rights clearance.

## Next improvements, specified

| Priority | Improvement | Acceptance gate |
|---|---|---|
| P1 | Real-site regression corpus | At least 30 representative sites covering reading, shopping, forms, code and apps; document browser/mode, keyboard flow and screenshots; no critical data-loss or navigation regressions |
| P1 | Signed pilot | Host public policy, sign Firefox builds, test clean installs/upgrades in Chrome, Edge and Firefox; recruit invited testers before public listings |
| P1 | Full output accessibility review | Keyboard and screen-reader pass on all eight generated examples, narrow layout, reduced motion, text zoom, and native form integration |
| P2 | Agent forward evaluation | Execute all ten prompts independently in both agents; archive artifacts and score every rubric violation |
| P2 | Stronger vector/layout solver | Font-metric-aware wrapping, structured vector tables, optional multi-page output; never silently truncate user content |
| P2 | Formal conformance tooling | Parse DOM/CSS rather than static string screening; golden render baselines across browsers with documented tolerances |

The release deliberately prioritizes a useful, tested local toolchain and reversible
browsing over claiming that every long-term ambition is finished.
