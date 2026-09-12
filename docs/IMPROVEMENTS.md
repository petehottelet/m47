# M47 0.2 implementation specification

The product name is M47. `swept` in the original PRD is the historical codename.
This document defines the executable 0.2 scope and supersedes conflicting release,
licensing, naming, and implementation assumptions in the research draft.

## Assessment before implementation: 5/10

| Dimension | Score | Evidence |
|---|---:|---|
| Visual identity | 8 | Distinct palette, bundled open font, original chrome and store art |
| Product completeness | 3 | Only the extension exists; P0–P3 are descriptions |
| Reliability | 4 | Reloads lose page state, callback/Promise mismatch in Firefox, no teardown |
| Privacy and accessibility | 5 | No application server; sync contradicts local-only claim; small controls |
| Distribution and validation | 3 | No repo, CI, automated tests, portable build, or consistent artifact names |

The overall score is a rounded engineering judgment, not a measured benchmark.

## Accepted implementation

1. **Shared foundation.** Versioned JSON tokens, deterministic seed, three schemes,
   dimension-aware layouts, semantic HTML, pure SVG, original sample content,
   bundled Antonio font. HTML preserves full content; vector output must report
   insufficient space instead of silently dropping content. Escape all input.
2. **CLI/library.** JSON specs and quick flags, local HTML/Markdown extraction,
   HTML/SVG/PNG/CSS export, input validation, nonzero errors, conformance check.
   PNG uses a local SVG rasterizer; no browser download required for CLI use.
3. **Generator.** Static client application with editable JSON, gallery presets,
   dimensions, seed, density, palette, local draft, import, exports, code copy,
   and validated fragment sharing. No URL fetching proxy or backend.
4. **Agent skill.** One portable Codex/Claude SKILL.md with generated reference
   tokens, CSS, examples, license, and offline CLI in the release bundle.
   Ten evaluation prompts; automated fixtures do not claim two-model evaluation.
5. **Extension.** Local settings with migration, Promise APIs, immediate reversible
   mode changes, inherited site defaults, reset and error states, bounded mutation
   work, curated fixes, and an explicit reader action. New-tab dashboard ships as
   a separate minimal-permission extension; browser themes are separate packages.
6. **Shipping.** Windows/macOS/Linux build, manifest parity, embedded license and
   privacy files, checksums, private draft release workflow, opt-in website deploy,
   CI on three operating systems, installation and publication instructions.

## Acceptance evidence

- Unit tests: seed determinism, aspect fixtures, schema failures, escaping, contrast,
  extraction, lifecycle/settings behavior, build contents and checksum integrity.
- Browser tests: generator edit/export/share, draft recovery, mobile overflow,
  Chromium extension load, Full → Palette → Off without navigation, app-owned
  style updates preserved, keyboard operation, reader close, new-tab links.
- A single desktop/mobile visual inspection plus one correction pass.
- Final rating records actual results and remaining external release gates in
  `docs/ASSESSMENT.md`; store approval and npm publication are not implied.

## Release gates that need external evidence

Store account access and review, public policy hosting, Firefox signing, independent
fan fidelity review, ten-task evaluation in both agents, Safari testing, and a
representative real-site compatibility sweep remain explicit gates. A finite test
suite cannot prove compatibility with every website. The broader PRD's benchmark
and adoption targets are goals, not current claims.
