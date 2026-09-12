# Publishing M47 — the complete playbook

Everything below matches the assets in this package: `m47-extension-v0.1.0-chrome.zip`
(store-ready build), `m47-extension-v0.1.0-firefox.zip` (AMO build), screenshots
(1280×800), promo tiles (440×280, 1400×560), and `PRIVACY.md` (inside the builds).

---

## Step 0 (recommended first): the GitHub home

Create a public repo (e.g. `m47`). Push the extension source, add a Release with
the zip, and put `PRIVACY.md` at the root — the stores require a public privacy
policy URL and the raw GitHub file works perfectly. The repo is also where the
open-source fan-project posture lives (disclaimer + Okuda credit in the README,
MIT license, non-commercial statement). Users can sideload from here forever,
which means no store decision can ever kill the project.

## Route A: Chrome Web Store (the big one)

1. Register at the developer dashboard: https://chrome.google.com/webstore/devconsole
   — one-time **$5** fee, verify your email, set up 2FA.
2. **Add new item** → upload `m47-extension-v0.1.0-chrome.zip`.
3. **Store listing tab** — use the copy below; upload `screenshot-1.png`,
   `screenshot-2.png` (1280×800 — the required size), and
   `promo-small-440x280.png`; `promo-marquee-1400x560.png` is optional but
   makes the listing look serious. Category: **Fun** (or Accessibility).
4. **Privacy tab** — this is what reviewers actually read:
   - Single purpose: *"Restyles web pages into a retro terminal visual theme."*
   - Permission justifications (paste-ready):
     - `storage` — "Saves the user's per-site and default theme mode."
     - `activeTab` — "Reads the current tab's hostname so the popup can set a per-site preference."
     - Host permissions (`http/https on all sites`) — "The extension's sole
       function is restyling any page the user visits; the content script must
       run on all sites. No page data is read, stored, or transmitted."
   - Remote code: **No**. Data collection: **None** (check nothing).
   - Privacy policy URL: your GitHub `PRIVACY.md` link.
5. **Visibility: start Unlisted.** You get a real store URL to share while
   keeping the complaint surface near zero; flip to Public when v0.2 has a
   per-site fixes pipeline and you're ready for strangers.
6. Submit. Review typically takes 1–7 days; broad host permissions put you in
   the slower, human-review lane — the justifications above are what gets you
   through.

## Route B: Firefox Add-ons (AMO) — free

1. https://addons.mozilla.org/developers/ — free account.
2. Submit `m47-extension-v0.1.0-firefox.zip` (its manifest already carries the
   `gecko` ID and event-page background). Listed review is usually hours-to-days.
3. Firefox quirk to mention in the listing: MV3 host permissions are opt-in —
   after installing, users click the extension → "Always allow on every site."
4. AMO also offers **self-distribution**: they sign your .xpi and you host it
   yourself (pairs well with the GitHub release).

## Route C: Edge Add-ons — free

https://partner.microsoft.com/dashboard/microsoftedge — free registration, accepts
the same Chrome zip unchanged. Low traffic, zero extra work.

---

## Store listing copy (fully clean — see IP notes)

**Name:** `M47 — retro terminal interface`

**Summary (under 132 chars):**
`Browse the web as a calm retro sci-fi terminal: black ground, warm curved chrome, pill buttons, condensed uppercase type.`

**Description:**

> M47 re-renders the web as a calm retro terminal out of 1980s production
> design: pure black ground, flat warm color, curved panel chrome, pill-shaped
> controls, condensed uppercase type. No gradients, no shadows — ever.
>
> THREE MODES, PER SITE OR EVERYWHERE
> • FULL — full restyle plus frame chrome: a live side rail (scroll-to-top,
>   hostname, a scan readout that tracks your scrolling, numeric cascade) and a
>   top bar with the page title and clock.
> • PALETTE — recolor and retype only: black ground, warm palette, golden links,
>   pill buttons, themed scrollbars.
> • OFF — leave the site alone. M47 remembers your choice per site.
>
> Alt+Shift+L cycles the current site's mode.
>
> PRIVATE BY CONSTRUCTION — no network requests, no analytics, no data
> collection of any kind. Settings stay in your browser. Free and open source:
> [your GitHub link]
>
> Honest note: heavyweight web apps may show a few unconverted corners — flip
> those sites to PALETTE or OFF and M47 remembers.

---

## The IP question, answered plainly (factual landscape, not legal advice)

**Can a generative geometric style be "clean" of TNG references? Substantially, yes.**

What copyright protects is *specific expression* — particular screen panels,
recorded sounds, fonts as software, names and marks. What it does not protect
is a *style*: geometric vocabulary (curved elbows, pill caps, bars on black),
color palettes as such, or the idea of a retro terminal aesthetic. A generator
that composes **original layouts** from that vocabulary — never tracing or
reproducing a screen-used panel — is building new expression in an
unprotectable style. That's categorically different from copying, and it's
exactly how M47 is built: original compositions, an openly-licensed font
(Antonio, OFL — not the commercial Swiss 911), synthesized-only sounds, no
ripped assets anywhere.

The compliance checklist for "clean":
1. **No marks anywhere public:** no "LCARS," "Star Trek," "TNG," "Okudagram,"
   ship or character names in the product name, store listing, screenshots, or
   promo art. The listing copy above already satisfies this — it describes the
   aesthetic generically ("retro sci-fi terminal," "1980s production design").
2. **No copied assets:** fonts, sounds, imagery all original/openly licensed. Done.
3. **Generative-only output:** no presets that recreate specific screens from
   the show, no episode content in demos. Done.
4. **Don't market the association:** every public sentence that invokes the
   franchise ("browse like the Enterprise!") converts style into a claimed
   affiliation and is the easiest complaint to file. Truthful *descriptive*
   reference ("inspired by the LCARS style created by Michael Okuda") is
   nominative use and is how surviving fan projects operate on GitHub — but in
   a **store listing** it's the one string a rights-holder can search for.
   Recommended split: stores fully clean; GitHub README may keep the credited,
   disclaimed fan framing (or go fully clean there too — your call, and going
   fully clean everywhere is the strictly safer option).

**Residual risk, honestly:** the style is recognizable, CBS has claimed
copyright over the LCARS GUI before (the 2011 Tricorder app takedown), and
stores comply with complaints first and ask questions later — so "clean" cannot
mean "zero risk," it means "no easy target": nothing searchable, nothing copied,
nothing sold. Every documented enforcement hit projects that used the marks,
copied assets, or made money. Keep M47 free, keep the takedown-protocol
(comply immediately, GitHub remains the home), and if commercial ambitions ever
develop, talk to an IP attorney first — that's the line where the calculus
actually changes.
