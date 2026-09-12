# swept — an LCARS Interface Engine

**Product Requirements Document**

| | |
|---|---|
| **Version** | 0.1 (draft for review) |
| **Date** | September 12, 2026 |
| **Author** | Pete Hottelet (pete@hottelet.com), drafted with Claude |
| **Status** | Draft |
| **Working codename** | `swept` (from "swept corner," the community term for the signature LCARS S-curve/elbow frame shape; see §13.3 Naming) |

> STAR TREK® and related marks are trademarks of CBS Studios Inc. This is an unofficial, non-commercial fan project. Not affiliated with, endorsed by, or sponsored by CBS Studios, Paramount Skydance, or any rights holder. LCARS interface design created by Michael Okuda.

---

## 0. Summary

`swept` is an open-source system for **dynamically generating authentic LCARS interfaces** — the Starfleet computer interface aesthetic Michael Okuda created for *Star Trek: The Next Generation* — for any surface, aspect ratio, product, or website. It is built in four phases on one shared foundation:

* **P0 — `swept-core`:** a rigorous, research-backed LCARS design specification encoded as machine-readable design tokens plus a zero-asset CSS/JS implementation. Everything else consumes this.
* **P1 — `swept-skill`:** a design skill for AI coding agents (Claude and Codex) that lets an agent produce conformant LCARS interfaces for any target, with a built-in conformance rubric.
* **P2 — `swept-cli`:** a standalone script/CLI that deterministically generates complete LCARS layouts (HTML/SVG/PNG) from a content spec and target dimensions.
* **P3 — `swept-web`:** a static website wrapping the same engine in a live visual generator with export and sharing.
* **P4 — `swept-extension`:** a browser extension that progressively makes the web itself look LCARS: new-tab dashboard → curated per-site styles → a Dark-Reader-style dynamic restyling engine → an LCARS "reader mode."

Strategic bets: (1) no maintained project today offers a **generative** LCARS engine — all prior art is hand-built templates; (2) no LCARS browser extension of any depth exists — the niche is empty; (3) an agent skill is the cheapest way to validate the design spec, because the spec and its conformance checklist are the product.

Scope is **strict TNG television era** (1987–1994). Distribution is **free and open source** with the standard fan-project legal posture (§13).

---

## 1. Background: what LCARS actually is

LCARS ("Library Computer Access/Retrieval System") is the visual language of Starfleet computer displays introduced in *Star Trek: The Next Generation*. Understanding its production reality is the key to recreating it faithfully:

1. **It was born from a budget constraint.** Okuda's flat graphic panels replaced expensive physical switches, first for ~7 seconds of *Star Trek IV* (1986), then wholesale on TNG. "Doing it purely as a graphic was considerably less expensive than buying electronic components." The in-fiction rationalization — panels are *software-defined* and reconfigurable — is exactly the property `swept` automates.
2. **The panels were physical, backlit art, not screens.** A "sandwich" of Kodalith film (opaque black with clear cutouts), colored photographic gels, diffusion, and polarizing filters over fluorescent lightboxes. Apparent animation came from motorized spinning polarizer disks and small cycling lamps ("blinkies"). Nothing on a TNG panel actually moves. This is why authentic LCARS is **flat, saturated-pastel color on pure black with zero gradients, bevels, or shadows** — those are properties of backlit film.
3. **Calm was a directive.** Gene Roddenberry instructed that panels "not have a great deal of activity on them," to make the technology feel advanced. Okuda described the style as "extremely clear organization of very complicated information… a little Bauhaus, a little art deco."
4. **The typeface is known.** Okuda: "I mostly used Helvetica Ultra Compressed. I also used Letraset Compacta, and a couple of others when I had to." Paramount's own 1990s Star Trek font disc standardized on Bitstream's identical cut, **Swiss 911 Ultra Compressed** — the same 1966–68 Matthew Carter / Hans-Jürg Hunziker design under two vendor names. All display text is uppercase.
5. **There was never an official style guide.** Canon gives us hard rules (black ground, the typeface, calm motion, curved elbow frames, pill terminals, in-joke numerics like the recurring 47). Everything numeric beyond that — radius ratios, gap widths, timing — was codified by 25 years of fan reverse-engineering, and canon panels themselves drifted (Data's Ops panel went through five color schemes in seven seasons). §5 therefore makes explicit normative choices, cites its sources, and marks which rules are canon vs. codified convention.

Full source library: Appendix B.

---

## 2. Vision, goals, non-goals

### 2.1 Vision

Any surface — a dashboard, a README, a home-automation wall panel, a phone widget, a website, ultimately the whole browser — can be rendered as a **coherent, canon-faithful TNG-era LCARS interface**, generated on demand rather than hand-assembled, and it will look like it belongs on the Enterprise-D.

### 2.2 Goals

1. **G1 — Fidelity:** output is recognizably strict TNG-era LCARS to a knowledgeable fan; it passes the conformance checklist in §5.10 with zero MUST violations.
2. **G2 — Generativity:** layouts are produced algorithmically from content + target dimensions; no two generations need be identical, yet every one is conformant. Deterministic under a fixed seed.
3. **G3 — Universality:** works from a 320×170 hardware TFT to a 21:9 monitor to a portrait phone to a printed poster; both standalone documents and skins for existing content.
4. **G4 — Portability:** one token source of truth; consumable by humans (CSS), machines (JSON), and AI agents (skill).
5. **G5 — Legality-by-construction:** every shipped asset (fonts, sounds, code, imagery) is original or openly licensed; the project sits squarely in the historically tolerated fan-project posture.
6. **G6 — Accessibility:** WCAG-conscious defaults (contrast-verified color pairs, reduced-motion support, semantic markup beneath the styling) without breaking the aesthetic.

### 2.3 Non-goals

* Other eras (TOS movies, Voyager, *Picard*, Lower Decks) — the token architecture must not preclude era presets later, but no era work ships in v1.
* Voice interaction ("Computer…"), holographic/3D effects, hardware builds.
* Pixel-replication of specific screen-used panels (both a fidelity trap and the worst legal posture — see §13); `swept` generates *original* compositions in the language.
* A general-purpose UI framework competing with Bootstrap/Tailwind; `swept` is an aesthetic engine.
* Monetization of any kind (ads, paid tiers, merch). This is load-bearing for §13.

---

## 3. Users and use cases

| User | Scenario |
|---|---|
| **Pete / trekkie developers** | "Give my Grafana-style status page, side project, or README an authentic LCARS treatment in minutes." |
| **AI-agent users (P1)** | "Claude, build me an LCARS dashboard for my server stats" → agent loads the skill and produces conformant output on the first try. |
| **Makers & home-automation fans** | The most active LCARS community today (Home Assistant's ha-lcars ecosystem) needs correct tokens/geometry for arbitrary panel sizes. |
| **Fan-site builders** | Currently hand-assemble from thelcars.com templates; want generated, content-aware layouts instead. |
| **Everyday browsing (P4)** | "I want Wikipedia — and eventually everything — to look like the Enterprise-D library computer." |

---

## 4. Product phasing

Dependency graph: **P0 → P1 → P2 → P3 → P4**, with P0 evolving continuously. Per the project owner's sequencing decision: the agent skill ships first, then the standalone script/app, then the website; the extension follows once those work.

| Phase | Deliverable | Ship gate |
|---|---|---|
| P0 | `tokens.json` + `swept.css` + geometry/motion/sound spec | Renders the reference gallery (§7.4) pixel-consistently in Chrome/Firefox/Safari |
| P1 | Skill folder for Claude + Codex | Agent produces zero-MUST-violation output on the 10-task eval suite (§8.5) |
| P2 | `swept` CLI (npm) | Generates conformant HTML/SVG for all §9.4 fixtures, deterministic under seed |
| P3 | Generator website | Lighthouse ≥ 90 perf/a11y; export parity with CLI |
| P4 | Extension (4 sub-phases) | §11 per-sub-phase gates |

---

## 5. The LCARS TNG Design Specification (normative)

This section is the heart of the project: the synthesis of production-canon evidence and the three most internally consistent fan codifications (the LCARS-ESP32 design guide, joernweissenborn's grid system, and the R `lcars`/`trekcolors` packages), cross-checked against thelcars.com — the de-facto community reference. Rules are tagged **[CANON]** (traceable to Okuda/production) or **[CODIFIED]** (normative choice from fan consensus; alternates noted). Key words MUST/SHOULD/NEVER are RFC-2119-style.

### 5.1 The five canonical foundations [CANON]

1. **Black is space.** The ground is pure black (`#000000`), always. Colored shapes float on it; the black between elements is not "background" but structure (the Kodalith mask).
2. **Flat backlit color.** Solid fills only. No gradients, bevels, embossing, drop shadows, outlines, or textures — physically impossible on gel-lit film.
3. **One typeface, uppercase.** Ultra-compressed grotesque (Helvetica Ultra Compressed / Swiss 911 UC lineage), all caps, tightly set, in color-matched or black text on shapes and colored text on black.
4. **Curved structure.** Frames built from bars joined by quarter-round **elbows**; free bar ends terminate in half-round **pills**. Descended from Okuda's round-CRT-bezel logic in *Star Trek IV*.
5. **Calm.** Displays are mostly static; motion is sparse, local, and purposeful (Roddenberry's directive). An LCARS screen at rest looks confident, not busy.

### 5.2 Geometry and shape grammar

The system is defined in relative units so it scales to any surface. Let **u** be the base module (default `16px` at desktop scale; the CLI/skill derive u from target size: `u ≈ clamp(8px, min(W,H)/40, 24px)`).

#### 5.2.1 Primitives

| Primitive | Definition | Rules |
|---|---|---|
| **Bar** | Rectangular structural strip | Horizontal bar thickness **1u** (range 0.75–1.25u). Structural bars are decoration/navigation chrome — never body-content containers. [CODIFIED: joernweissenborn "bar = 1/3 unit-height," ESP32 16–18px at TFT scale, SDK ~30px at desktop scale — all ≈ our 1u] |
| **Pill (cap)** | Half-round bar termination | Cap radius = **exactly height/2**. Every exposed bar end MUST be capped — a square-cut exposed end is a spec violation. Standalone caps MAY be 2× bar thickness for emphasis [CODIFIED: SDK 60px caps vs 30px bars]. |
| **Elbow** | L-corner joining a horizontal bar and vertical sidebar | Outer radius **r_o** sweeps the outside corner; inner radius **r_i** the inside. Normative: `r_i = 0.5 × bar thickness` (range 0.4–0.9×); `r_o = 0.75 × sidebar width` (range 0.5–1.0×); always `r_o ≥ 2 × r_i` — the outer curve must read as a sweep, the inner as a tight fillet [CODIFIED: Hackaday 32/12px on a 60px sidebar; ESP32 16px inner on 18px bars]. Construction: draw the full quarter-annulus then butt the straight runs; in CSS use nested rounded rectangles or a single `border-radius` corner with black inset — never diagonal or mitred corners. |
| **Sweep** | S-curve joining two offset half-frames (header transitions) | Composed of two opposed elbows sharing a vertical run; use for hero/header areas [CODIFIED: R-lcars `lcarsSweep`; community term "swept"]. |
| **Segment** | Colored block within a sidebar/bar | Sidebars divide into 2–6 segments of unequal height, separated by **gutters**. |
| **Gutter** | Black gap between any two colored elements | Normative **0.125u–0.25u** (min 2px, typical 3–4px at desktop scale). Gutters are MANDATORY between all adjacent colored shapes — LCARS elements never touch. [CODIFIED: ESP32 2px at TFT scale, 3px elbow-to-bar] |

#### 5.2.2 Proportions and radii summary

```
bar-thickness:        1u          (0.75–1.25u)
sidebar-width:        4u          (3–6u)
cap-radius:           height / 2  (exact, always)
elbow-inner-radius:   0.5 × bar   (0.4–0.9×)
elbow-outer-radius:   0.75 × sidebar (0.5–1.0×), ≥ 2 × inner
gutter:               0.1875u     (0.125–0.25u, min 2px)
button-radius:        height / 2 for pill buttons; 0.25u for rectangular cells
segment-count:        2–6 per sidebar, unequal heights (no two adjacent equal)
```

Radii scale with element size — big shapes get big radii, small buttons small radii [CODIFIED: Hackaday 32/12/4px hierarchy]. All numeric ranges are honest about source variance; the single normative value is what `swept-core` ships as the default token.

### 5.3 Color system

#### 5.3.1 Architecture

Three layers, so the palette can drift the way canon panels did without breaking semantics:

1. **Reference palette** — named hex values (Appendix A), drawn from the two best-attested TNG sets: the community-standard `lcars_2357` palette (trekcolors) and thelcars.com's measured "Classic" theme.
2. **Semantic tokens** — roles mapped onto reference colors (below). Components consume only semantic tokens.
3. **Scheme variants** — alternate role→color mappings within the TNG family (canon precedent: Data's Ops panel had five schemes across seven seasons). v1 ships `tng-default` plus at least one variant (`tng-early` — more gold/lavender) and `red-alert`.

#### 5.3.2 Semantic tokens (`tng-default`)

| Token | Role | Default | Notes |
|---|---|---|---|
| `ground` | The void | `#000000` | Never any other value. [CANON] |
| `structure-1` | Primary frame/elbow/bar | `#FF9966` orange-peel | Warm colors carry structure. [CODIFIED] |
| `structure-2` | Secondary frame runs | `#FFCC66` golden-tanoi | |
| `structure-3` | Tertiary/segment fill | `#CC6666` chestnut-rose | |
| `interactive` | Buttons, controls | `#CC99CC` lilac | thelcars uses african-violet `#BAA4E5` — allowed alternate |
| `interactive-alt` | Secondary buttons | `#FFCC99` tanoi | |
| `data-1` | Data readouts, charts | `#99CCFF` anakiwa | Cool colors carry data. [CODIFIED] |
| `data-2` | Secondary data | `#3366CC` mariner | Large text/decoration only (contrast, §5.11) |
| `text-bright` | Emphasized text on black | `#FFFF99` pale-canary | |
| `text-standard` | Standard text on black | `#FF9900` atomic-tangerine | |
| `text-on-shape` | Labels sitting on colored shapes | `#000000` | Black text on colored fills. [CANON] |
| `alert` | Red alert states | `#FF2200` mars | Reserved exclusively for alerts. [CODIFIED] |
| `decor-deep` | Deep accent segments | `#664466` eggplant / `#006699` bahama-blue | Decoration only, never text |

Rules: warm hues (canary→tangerine→rose) dominate structural chrome; cool hues (anakiwa/mariner) mark data and science readouts; red appears **only** during alert states; adjacent segments MUST differ in color; a single screen SHOULD use 4–7 colors total. Hyperlink-style affordances MUST be an energetic warm color, never default blue [CODIFIED: joernweissenborn].

### 5.4 Typography

| Aspect | Specification |
|---|---|
| **Primary face (shipped)** | **Antonio** (SIL OFL, Google Fonts, variable weight 100–700) — the proven community standard (adopted by thelcars.com in 2021 as the closest open match, and by meWho's acclaimed Titan.DS). Bundled/self-hosted, never hotlinked. |
| **Optional accent face** | **"Okuda"** by Pixel Sagas — OFL per the author's current license page (aggregators show stale "personal use" labels; the license page MUST be archived in-repo). Narrower than Antonio; good for large display numerals. |
| **Authenticity upgrade path** | Users who own **Swiss 911 Ultra Compressed** (≈$30 desktop from MyFonts) or Helvetica Pro Ultra Compressed can point one token (`--swept-font-display`) at it. `swept` NEVER ships or hotlinks these commercial fonts, and the docs MUST warn against the widely pirated "free Swiss 911" downloads. |
| **Fallback stack** | `"Antonio", "Okuda", "Oswald", "Saira Extra Condensed", "Arial Narrow", sans-serif` |
| **Case** | All interface text uppercase — implemented as `text-transform: uppercase` over semantically cased source text (accessibility + copyability). [CANON] |
| **Tracking** | Tight: `letter-spacing: -0.01em to -0.05em`, tuned per size, to recover ultra-compressed density with the wider open fonts. No `scaleX()` squashing — no surveyed flagship project does it, and it distorts stroke contrast. |
| **Scale** | Base 1×; steps 1.5× (big), 2× (large), 4× (huge) [CODIFIED: joernweissenborn]. Large display numerals SHOULD use light weights (100–300); labels regular-to-bold — the light-big/heavy-small contrast is core to the look. |
| **Numerals** | Tabular where available; numeric blocks tightly tracked like labels. |

### 5.5 Layout grammar

An LCARS screen is composed as follows [CODIFIED, synthesizing canon practice]:

1. **The frame.** One or more partial frames: a horizontal bar (top and/or bottom) joined to one vertical sidebar by elbows. The frame is chrome — titles, section labels, navigation. Content floats in the black interior.
2. **Asymmetry is a rule, not an accident.** Sidebar on ONE side only. Never mirror-symmetric layouts. Unequal segment heights. Off-center visual weight. [CODIFIED: ESP32 MUST-list]
3. **The sidebar** carries 2–6 colored segments; any segment may be a button (uppercase label + numeric code, black text, top-aligned by default) or pure decoration.
4. **Header bar** carries the screen title, right-aligned or butted against the elbow, in `text-bright` at the large/huge scale, plus optional pill-capped secondary bars with a decorative stripe.
5. **Content regions** on the black interior: lists of pill buttons, key–value status rows (label left, value right-aligned), data cascades (columns of numerals), simple bar/line visualizations in `data-*` colors.
6. **Density discipline.** Interiors breathe; a screen at rest is ~60–75% black by area. Cramming violates the Bauhaus-clarity intent. [CODIFIED]
7. **Numeric decoration** (§5.9) fills residual sidebar/bar space so chrome never looks empty.

### 5.6 Adaptive layout: any surface, any aspect ratio

This is `swept`'s novel contribution — canon precedent is that panels are "software-definable" and every console got a bespoke okudagram; `swept` algorithmically produces that bespoke fit. The **layout solver** (shared by P1–P4):

**Inputs:** a content tree (regions with roles: `title`, `nav`, `content`, `status`, `actions`, `decor`), target `W×H`, density preference, scheme, and an optional integer **seed**.

**Topology selection by aspect ratio:**

| Aspect | Frame topology |
|---|---|
| Landscape (4:3 – 16:9) | Left OR right sidebar + top bar, single elbow; optional bottom bar (double elbow) |
| Ultrawide (>2:1) | Sidebar + top bar, content in 2–3 columns separated by capped vertical bars; never a second sidebar |
| Portrait | Top + bottom bars with elbows into a narrow (2–3u) sidebar stub; nav migrates into the top bar as pill buttons |
| Square-ish | Classic full frame on two sides (top + left) |
| Strip/banner (<0.25 ratio either way) | Single bar + caps + inline pills; no elbow below 6u of cross-axis space |
| Tiny (< 20u × 20u) | Pill cluster or single capped bar; no frame |

**Solver steps:** (1) pick topology; (2) size chrome from u; (3) allocate sidebar segments to `nav` items, padding with `decor` segments using seeded unequal heights; (4) place `title` in the header; (5) flow `content`/`status` into the interior on an implicit 0–16u column grid; (6) assign colors by role with the adjacency constraint; (7) generate numeric decoration (seeded); (8) validate against §5.10 and repair (e.g., cap an exposed end, insert a missing gutter).

**Determinism:** identical inputs + seed ⇒ byte-identical output. Randomness (segment heights, numeric codes, decor placement) flows only from the seed. **Responsive behavior:** at breakpoints the topology itself re-solves (a desktop sidebar becomes a portrait top-bar pill row) rather than merely squishing — matching how the show drew different panels for different consoles, and improving on prior art (only louh/lcars attempts true responsive LCARS today).

### 5.7 Motion

Governed by the **Roddenberry rule**: calm. [CANON directive; timings CODIFIED from ESP32 + thelcars conventions]

| Motion | Spec |
|---|---|
| Blink (status indicators) | 500ms interval; ≤ 2 blinking elements visible at once; blinking stops on hover/focus |
| Data cascade | Numeric columns update at 50–100ms/frame, ≤ 1 cascade region per screen |
| State transition | 300ms, ease-out; color swaps are instant (gels don't fade) |
| Boot/assembly | Sequential, total ~600ms–1s: elbows appear (0–20%), bars extend ease-out (20–60%), segments fill top-to-bottom (60–100%). Phases sequential, never overlapping |
| Hover/press | Instant fill swap to a brighter pair member + optional beep; a white flash (~120ms) marks activation [CODIFIED: SDK white-flash state] |
| Idle | Optional screensaver-style ambient cycling (System 47 precedent), off by default |
| **Budget** | ≤ 5% of screen area in motion at rest. `prefers-reduced-motion` disables all motion (blink → steady bright state; cascade → static numerals) |

### 5.8 Sound

The beep vocabulary is functional [CODIFIED taxonomy from joernweissenborn/thelcars]: `acknowledge` (key press), `deny` (negative acknowledge), `alert`, `red-alert`, `ready`. Implementation MUST be **procedurally synthesized** (Web Audio oscillator chirps — precedent: no42-org/lcars-47's zero-asset synthesizer). Ripped show SFX (TrekCore etc. are unlicensed CBS/Paramount recordings) are prohibited in the repo and all distributions. Sound is **off by default**; user opt-in; respects platform mute.

### 5.9 Content and decoration

* **Numeric codes:** buttons and segments carry 2–6-digit pseudo-random codes (e.g., `47-0518`); generated from the seed; the digit sequence SHOULD seed in occasional `47`s (production in-joke). [CANON practice]
* **Labels:** terse, technical, uppercase: `SUBSPACE LINK`, `DIAGNOSTIC 4-A`. The skill/CLI include a label-styler that rewrites mundane labels into LCARS register on request (`Settings → SYSTEM CONFIG 22-B`).
* **No real Trek content:** shipped examples/demos MUST NOT reproduce episode dialogue, character names, ship schematics from the show, or copied screen graphics. Original fictional content only (invented ship names pass; `USS ENTERPRISE NCC-1701-D` does not ship in defaults).

### 5.10 Conformance rules (the checklist)

**MUST:** pure-black ground · flat solid fills only · all text uppercase ultra-condensed · every exposed bar end capped (radius = h/2) · elbows curved (outer ≥ 2× inner radius) · black gutters between all adjacent colored shapes · asymmetric composition, sidebar one side only · warm structure / cool data / red only for alerts · adjacent segments differ in color · motion within the calm budget · numeric decoration present in chrome.

**NEVER:** gradients, shadows, bevels, outlines, textures · white or colored page grounds · lowercase UI text · mitred/square corners on frame junctions · symmetric mirrored layouts · blue default-styled hyperlinks · structural bars carrying interactive events [CODIFIED: SDK] · more than ~7 hues per screen · red outside alert states · ripped fonts, sounds, or screen graphics.

This checklist is shipped as data (`conformance.json`) so P1's skill can self-grade and P2's solver can auto-repair.

### 5.11 Accessibility addendum

* **Contrast:** on black, the warm palette is strong (computed WCAG ratios: pale-canary 20.0:1, golden-tanoi 14.1:1, anakiwa 12.4:1, orange-peel 10.0:1, atomic-tangerine 9.8:1, lilac 9.0:1 — all AAA). `mars #FF2200` (5.5:1) is AA — acceptable for alert text at large sizes. `mariner #3366CC` (3.9:1), `bahama-blue` (3.4:1) and `eggplant` (2.6:1) are **decoration-only tokens**, never text. Black-on-shape labels pass on all default fills. Token file records the contrast ratio of every approved text/fill pair.
* **Semantics:** styling sits on real HTML (nav/button/main/headings); uppercase via CSS so screen readers get natural case; numeric decor is `aria-hidden`; focus states use the white-flash convention plus a visible focus ring token.
* **Motion/sound:** `prefers-reduced-motion` honored (§5.7); sound opt-in (§5.8).
* **Honest caveat:** all-caps ultra-condensed type measurably reduces legibility; docs recommend the `density: comfortable` preset (larger type, wider tracking) for reading-heavy uses.

---

## 6. Component inventory (P0)

Frame (single/double-elbow, sweep variant) · Elbow · Bar (+cap, +stripe decorator) · Sidebar (+segments, +segment-button) · Pill button (full/left/right/rect variants, states: rest/hover/active/disabled/blink/alert) · Button list/column · Header title block · Key–value status row · Data cascade · Bar-gauge & simple chart styles · Progress/meter · Dialog/alert panel (incl. red-alert takeover) · Table skin · Form controls skin (input, select, toggle) · Numeric decor block · Scrollbar skin. Each component ships with: markup contract, token dependencies, do/don't thumbnails, and a conformance note.

---

## 7. P0 — `swept-core` requirements

* **CORE-1:** `tokens.json` (single source of truth): geometry ratios (§5.2.2), semantic colors + reference palette, type scale/tracking, motion timings, sound synth parameters, contrast table, conformance rules. Format compatible with the W3C Design Tokens draft.
* **CORE-2:** `swept.css` — zero-asset (all shapes pure CSS, precedent thelcars.com), custom-property-driven, ~≤ 40KB min+gz, no JS required for static layouts.
* **CORE-3:** `swept.js` (optional, ≤ 15KB) — blink/cascade/boot animations, Web Audio beeps, focus flash. Progressive enhancement only.
* **CORE-4:** Works in evergreen Chrome/Firefox/Safari; degrades gracefully (no elbows → still capped bars) in constrained webviews.
* **CORE-5:** Reference gallery: ≥ 8 hand-verified example screens (bridge-style status board, portrait PADD, ultrawide strip, tiny widget, form page, table page, alert state, article page) used as visual-regression fixtures.
* **CORE-6:** License: code MIT; docs CC BY-SA 4.0; bundled fonts under their own OFL texts; `NOTICE` file with the fan-project disclaimer (§13.2).

## 8. P1 — `swept-skill` (Claude + Codex) requirements

* **SKILL-1:** One source-of-truth skill folder: `SKILL.md` (Claude Agent Skill format with YAML frontmatter) + `reference/` (condensed §5 spec sheet, `tokens.json`, `conformance.json`, `swept.css`, 3 annotated exemplar HTML files). A build step emits the Codex-compatible variant (`AGENTS.md` section + prompt file) from the same source — no hand-maintained forks.
* **SKILL-2:** Trigger coverage: "LCARS", "Star Trek interface/style", "Okudagram", "make it look like the Enterprise computer."
* **SKILL-3:** Workflow encoded in the skill: (1) classify target surface + aspect; (2) run the §5.6 topology table; (3) build from `swept.css` components, never freehand CSS for primitives; (4) self-grade against `conformance.json` and repair before presenting; (5) offer seed/density/scheme variations.
* **SKILL-4:** Handles all target classes: standalone page, component drop-in for an existing app, README/SVG graphic, and "re-skin this existing HTML."
* **SKILL-5:** Self-contained — no network access needed at generation time (fonts + tokens bundled).
* **SKILL-6:** Eval suite: 10 canonical tasks (varying surface, aspect, content type) with automated conformance scoring; ship gate is zero MUST-violations across the suite on both Claude and Codex.
* **SKILL-7 (stretch):** The skill can call `swept-cli` (P2) when available, falling back to generating markup directly.

## 9. P2 — `swept-cli` requirements

* **CLI-1:** Node ≥ 20, published to npm; `npx swept generate` works with zero install friction. (Node over Python: shares the token/solver code with P3/P4 verbatim.)
* **CLI-2:** Inputs: `--spec spec.json` (content tree per §5.6) OR quick flags (`--title`, `--nav a,b,c`, `--content file.md`) OR `--from-html page.html` (extracts headings/nav/content into a spec — the extraction engine P4 will reuse); plus `--size WxH`, `--seed`, `--scheme`, `--density`, `--sound`, `--motion`.
* **CLI-3:** Outputs: self-contained `page.html` (inlined CSS/fonts) · `panel.svg` (static vector for posters/READMEs) · `page.png` (headless render) · `theme.css` (tokens-only skin for an existing site).
* **CLI-4:** Deterministic: same inputs + seed ⇒ byte-identical HTML/SVG. CI golden-file tests on the §7.4-derived fixture set (≥ 12 fixtures spanning the topology table).
* **CLI-5:** `swept check page.html` — conformance linter reporting MUST/NEVER violations with selectors (also used by SKILL-3 and CI).
* **CLI-6:** Library API (`import { solve, render } from 'swept'`) — the same functions P3/P4 consume.

## 10. P3 — `swept-web` requirements

* **WEB-1:** Static site (no backend, no accounts, no analytics beyond privacy-respecting counts); hosted on GitHub Pages/Netlify; the site itself is dogfooded LCARS.
* **WEB-2:** Live generator: content editor (or paste-a-URL → readability extraction → spec), aspect/size presets (desktop, PADD/portrait, ultrawide, widget, poster), seed shuffle, scheme/density toggles, motion/sound preview.
* **WEB-3:** Export parity with CLI (HTML/SVG/PNG/theme.css) + copy-as-code; shareable permalink encoding the full spec + seed in the URL fragment.
* **WEB-4:** Gallery of seeded examples; each opens in the editor.
* **WEB-5:** Prominent fan-project disclaimer in footer + About page (§13.2).

## 11. P4 — `swept-extension` requirements (phased)

Prior art is thin, ancient, and chrome-only — no maintained LCARS extension exists; LCARStrek (the deepest ever, Firefox complete theme) died with XUL in 2017. The niche is open but the general problem is hard, so P4 ships in independent sub-phases, each valuable alone:

* **EXT-A — New-tab + browser theme (low risk, ships first):** LCARS new-tab dashboard (clock, bookmarks as pill buttons, seeded decor; solver-generated, respects viewport) + a matching static browser theme. No content-page access, minimal permissions. *No LCARS new-tab extension currently exists.*
* **EXT-B — Curated site skins:** hand-tuned `swept`-token stylesheets for ~10 high-value, relatively stable sites (Wikipedia, Hacker News, GitHub, old.reddit, docs sites), injected at `document_start`, per-site opt-in. Stylus-model, proven; freshness is the moat (all existing LCARS userstyles are abandoned).
* **EXT-C — Dynamic engine ("Dark Reader for LCARS"):** programmatic restyling of arbitrary pages: palette remap to §5.3 (Dark Reader's MIT engine is the proven architecture and is embeddable as an npm library), type remap to the §5.4 stack, radius/pill remap on interactive elements, plus an injected viewport frame (sidebar + elbow chrome around the page). Accept and plan for: a perpetual per-site-fixes pipeline, shadow-DOM style mirroring, CSP edge cases, MV3 injection-timing FOUC, SPA mutation performance budgets (≤ 5ms/mutation batch). Per-site kill switch; "palette-only" fallback mode.
* **EXT-D — LCARS Reader (showpiece, optional):** readability-extract article content and re-render it fully through the solver — true LCARS re-layout, offered as an explicit per-page "View as LCARS" action, never transparent browsing.
* **EXT-legal:** store listing name avoids "LCARS"/"Star Trek" in the title (descriptive text only, e.g. "swept — retro sci-fi terminal interface"), per §13; free, no telemetry-for-profit.

## 12. Technical architecture

```
                    ┌────────────────────────────┐
                    │   tokens.json  (P0, W3C-DT) │
                    └──────┬─────────────┬───────┘
                           │             │
                 ┌─────────▼──────┐  ┌───▼──────────────┐
                 │ swept.css/.js  │  │ solver (TS lib)   │
                 │ components     │  │ topology+seed+fix │
                 └───┬────────┬───┘  └───┬──────┬───────┘
                     │        │          │      │
      ┌──────────────▼─┐  ┌───▼──────────▼─┐  ┌─▼──────────────┐
      │ P1 skill folder │  │ P2 CLI + lib   │  │ P3 website     │
      │ (Claude+Codex)  │  │ (npm)          │  │ (static)       │
      └─────────────────┘  └───────┬────────┘  └────────────────┘
                                   │
                          ┌────────▼─────────┐
                          │ P4 extension     │
                          │ (MV3, WebExt)    │
                          └──────────────────┘
```

Monorepo (`packages/tokens`, `core`, `solver`, `skill`, `cli`, `web`, `extension`); TypeScript; visual-regression CI (Playwright + golden screenshots of the reference gallery); conformance linter runs on every PR; semantic versioning with the spec itself versioned (spec changes are breaking changes).

## 13. Legal & IP posture

*(Factual landscape from research; not legal advice.)*

### 13.1 The landscape

Star Trek is owned within **Paramount Skydance** (merger completed Aug 7, 2025; TV copyrights sit with CBS Studios Inc.; a WBD acquisition is in progress and the new regime's enforcement temperament has no track record). No live US trademark registration for the word "LCARS" was found, but CBS has claimed **copyright in the LCARS GUI itself** and enforced on exactly that basis: the 2011 DMCA takedown of the free Tricorder Android app (targeting its LCARS-style graphics), the 2018 Stage 9 C&D (free, non-commercial), and the Axanar litigation (2015–17). Meanwhile thelcars.com, ha-lcars (573★), System 47, LCARSCom.Net (since 1997) and dozens of open-source LCARS repos have operated for years-to-decades untouched. The de-facto safe harbor, consistent with the 2016 Fan Film Guidelines: **free, non-commercial, clearly disclaimed, no official marks in names, Okuda credited, comply immediately if contacted.**

### 13.2 Project posture (requirements)

* **LEGAL-1:** Every repo, site, and distribution carries the disclaimer on page 1 of this PRD, credits Michael Okuda as LCARS's creator, and states non-affiliation.
* **LEGAL-2:** Strictly non-commercial: no sales, ads, sponsorships, paid tiers, or merch, ever, in any phase.
* **LEGAL-3:** Original assets only: OFL fonts (Antonio; Okuda with its archived license page), synthesized sounds, original example content, no screen-grabs or traced episode graphics in the repo or docs. No pirated Swiss 911, no GTJ fonts (no-modification clause), no TrekCore audio.
* **LEGAL-4:** Naming: repo/package names lead with `swept`; "LCARS" appears descriptively ("an LCARS-style interface engine") — the pattern common to surviving projects. Browser-store listings (highest complaint-exposure surface) use no protected marks in the title.
* **LEGAL-5:** Takedown protocol documented in the repo: comply first, discuss after — the pattern of every surviving project.
* **LEGAL-6:** Code MIT, docs CC BY-SA. Honest note in `LICENSE`: the code license cannot and does not grant rights in the underlying LCARS trade dress.

### 13.3 Naming note

`swept` is the working codename (community term for the signature S-curve). Alternates considered: `elbow-ui`, `okudagram` (rejected: personal name + closer to the marks), `lcars-*` (rejected for store listings, acceptable for descriptive use). Final name: Open Question OQ-1.

## 14. Success metrics

* **Fidelity:** blind side-by-side "does this belong on the Enterprise-D?" review by r/LCARS-class fans — ≥ 80% judge generated output authentic; zero MUST-violations in CI at all times.
* **P1:** eval-suite pass on both agents; skill installs and triggers correctly in Claude Code/Cowork and Codex CLI.
* **P2/P3:** deterministic-generation guarantee holds (golden tests); time-to-first-LCARS for a new user < 5 minutes; ≥ 500 GitHub stars year one (ha-lcars, the nearest active comp, sits at ~573).
* **P4:** EXT-A/B shipped to both stores; EXT-C restyles top-100 sites with < 5% breakage reports enabled-by-default metrics off.

## 15. Risks & mitigations

| Risk | L | I | Mitigation |
|---|---|---|---|
| Rights-holder complaint / DMCA (esp. at extension stores) | Low-Med | High | §13 posture; no marks in store titles; takedown protocol; every phase valuable even if store distribution ends (sideload/GitHub) |
| EXT-C breakage treadmill exhausts maintenance | High | Med | Per-site fixes pipeline from day one (Dark Reader model); palette-only fallback; curated-sites mode is the supported floor |
| Design spec drifts from "feel" — technically conformant, not evocative | Med | High | Reference gallery + fan review gate (§14) on every spec change; the checklist encodes the *rules*, the gallery encodes the *taste* |
| Font fidelity ceiling (Antonio ≠ Ultra Compressed) | Certain | Low-Med | Tracking/weight tuning; optional Okuda face; documented commercial upgrade path (user-supplied Swiss 911) |
| MV3 constraints (FOUC, CSP, service workers) | High | Med | EXT-A/B unaffected; EXT-C uses registered content scripts at document_start + precomputed per-site CSS; accept imperfection |
| Codex skill-format drift | Med | Low | Single-source build step (SKILL-1); Codex variant is generated, not maintained |
| Scope creep into a general UI framework | Med | Med | Non-goals §2.3; component inventory is closed for v1 |

## 16. Open questions

* **OQ-1:** Final project name (ship as `swept`?) and npm scope availability.
* **OQ-2:** Should `tng-early`/`tng-late` scheme variants ship in v1 or v1.1?
* **OQ-3:** EXT-C engine: embed Dark Reader's npm library vs. reimplement a lighter LCARS-specific mapper? (Spike in EXT-B timeframe.)
* **OQ-4:** Does the P1 skill bundle a headless renderer for self-screenshot verification, or rely on the agent's own tooling?
* **OQ-5:** Community contributions: accept era presets (Voyager/Picard) as community packages post-v1?

---

## Appendix A — Reference palettes (TNG era)

**A.1 `lcars_2357` (community-standard TNG palette, trekcolors):**
`#FFFF99` pale-canary · `#FFCC99` tanoi · `#FFCC66` golden-tanoi · `#FF9933` neon-carrot · `#664466` eggplant · `#CC99CC` lilac · `#99CCFF` anakiwa · `#3366CC` mariner · `#006699` bahama-blue

**A.2 Extended community-standard names (trekcolors, subset):** atomic-tangerine `#FF9900` · orange-peel `#FF9966` · chestnut-rose `#CC6666` · hopbush `#CC6699` · melrose `#9999FF` · blue-bell `#9999CC` · husk `#BBAA55` · rust `#BB4411` · tamarillo `#882211` · periwinkle `#CCDDFF`

**A.3 thelcars.com "Classic" theme (measured; TNG/DS9/VOY):** african-violet `#BAA4E5` · almond `#D29B7F` · almond-creme `#FCC19F` · barley `#EDB378` · bluey `#8899FF` · brown `#895129` · butterscotch `#EA9C72` · dirty-mauve `#7A506D` · dusty-mauve `#9D698A` · lilac `#8A72A7` · mars `#FF2200` · orange `#EB943A` · red `#CF4F4F` · subdued-sienna `#C47D69` · true-mauve `#C082A9`

**A.4 Canon color-drift note:** screen-used panels were re-gelled repeatedly (five schemes for one Ops panel across seven seasons) — which is why `swept` treats TNG color as a family of scheme variants over one semantic layer, not a single fixed palette.

## Appendix B — Research source library (top resources)

1. **Wrath of Dhan "Okudagrams" series (Parts 1–5)** — physical panel construction (Kodalith/gels/polarizers/blinkies) from screen-used props, with Okuda quotes. `wrathofdhanprops.blogspot.com`
2. **thelcars.com** — de-facto community reference: pure-CSS templates, six measured era palettes, font lineage (Antonio adoption). Active, v26 July 2026.
3. **LCARS-ESP32 Design Guide (dorofino, GitHub)** — the most explicit written MUST/AVOID rules: additive elbow construction, cap = h/2, warm-structure/cool-data, asymmetry, animation timings.
4. **trekcolors + lcars R packages (Leonawicz)** — the 31 community-standard named colors with hexes, era palettes, strict-scaling elbow geometry.
5. **Memory Alpha** — "Library Computer Access and Retrieval System" + "Okudagram" + "Star Trek fonts" articles: production history, Picard-era production hexes, typeface documentation.
6. **TrekToday Okuda Q&A** — primary-source design philosophy ("Bauhaus… art deco"), workflow, tooling.
7. **Okuda on X (Mar 2022)** — settles the typeface question (Helvetica Ultra Compressed on set; Swiss 911 on Paramount's font disc).
8. **joernweissenborn/lcars (GitHub, 366★, MIT)** — cleanest fan grid system (0–16 units), audio function taxonomy.
9. **Dark Reader (GitHub, 22.3k★, MIT)** — the proven whole-web dynamic restyling architecture; embeddable engine; per-site-fixes operating model.
10. **th3jesta/ha-lcars (573★) + snootched/lcards** — the most active LCARS community (Home Assistant); component-behavior ideas; adoption benchmark.
11. **louh/lcars (GPL-3)** — best existing responsive LCARS implementation (study only; GPL isolation from our MIT code).
12. **Aricwithana/LCARS-SDK** — measured Illustrator mockups; the legal-positioning template (non-profit license citing Paramount/CBS).
13. **Typography chain:** Okuda 1997 Q&A (lcarscom.org/okuda9706) · Fonts In Use (Helvetica Compressed history) · MyFonts (Swiss 911 UC $29.99; Helvetica Pro UC $42.99; webfont/app license limits) · Google Fonts Antonio metadata (OFL, vf 100–700) · Pixel Sagas Okuda font + license page (OFL) · st-minutiae font archive (unlicensed — reference only).
14. **Legal chain:** Techdirt (2011 Tricorder DMCA) · Fanlore/Kotaku (Stage 9 C&D) · Hollywood Reporter (Axanar settlement) · startrek.com/fan-films (2016 guidelines) · Paramount IR (Skydance merger; WBD acquisition in progress) · Trademarkia ("LCARS": no US registration found).
15. **Sound:** TrekCore audio + LCARSCom sound catalogs (vocabulary reference only — unlicensed recordings) · no42-org/lcars-47 (procedural Web Audio precedent).

## Appendix C — Font decision summary

| Option | License | Verdict |
|---|---|---|
| **Antonio** (Google Fonts, vf 100–700) | SIL OFL | **Ship as primary.** Proven community standard (thelcars.com, Titan.DS) |
| **Okuda** (Pixel Sagas) | OFL per author site (archive it — aggregators show stale labels) | Ship as optional display face |
| Saira Extra Condensed / Oswald | SIL OFL | Fallback stack members |
| **Swiss 911 Ultra Compressed** (Bitstream) | Commercial ($29.99 desktop; webfont metered per-domain; no redistribution) | Document as user-supplied authenticity upgrade; never ship |
| Helvetica Pro Ultra Compressed (Linotype) | Commercial ($42.99) | Same as above (the actual set-used design) |
| LCARS GTJ2/GTJ3 | Freeware, no-modification clause | Do not bundle (can't subset; not OFL) |
| Context Ultra Condensed, Federation, "free Swiss 911" archives, trekfont collection | Unknown/unauthorized | Prohibited |
