# M47

**Original retro terminal interfaces, generated locally.**

M47 is a shared design engine with a CLI, browser workshop, agent skill, page
restyler, new-tab dashboard, and browser themes. Black space, warm curved frames,
Antonio display type, and cool data. All example readings are demonstration data.

Source repository: **private**. Code and original project documentation: **MIT**.
Antonio remains under SIL OFL. Public hosting, npm, and store publication are
separate steps; no public distribution is implied by this repository.

## Start here

Requires Node 22+ and npm.

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4747. Choose a gallery example, edit its JSON, and export
HTML, SVG, PNG, or theme CSS. Drafts stay on your device. Share links contain the
panel itself in the URL fragment; anyone receiving one can read its contents.

## Use the engine or CLI

```sh
node cli/index.js generate --spec dist/example.json --out panel.html
node cli/index.js generate --spec dist/example.json --out panel.svg
node cli/index.js generate --spec dist/example.json --out panel.png
node cli/index.js generate --title "Field notes" --content notes.md --out notes.html
node cli/index.js generate --from-html article.html --out reader.html
node cli/index.js check panel.html
```

Add `--size 600x1000 --seed 47 --scheme tng-early --density compact` as needed.
HTML is self-contained with its font and retains long content by scrolling.
SVG/PNG are fixed canvases and return an error if the content needs more space.
`--force` explicitly replaces an existing file. Run `--help` for all options.

```js
import { solve, render, renderSVG } from '@petehottelet/m47';
const spec = {title: 'STATION 47', sections: [{title: 'Notes', text: 'Ready.'}]};
const html = render(spec, {width: 1280, height: 800, seed: '47'});
```

The package name above is configured for publication, not a claim that it is on
npm yet. From this checkout, import `./core/index.js`. Library callers can pass
`fontData` as a base64 TTF data URL; the CLI embeds Antonio automatically.

## Install browser builds

Run `npm run build` first. Load the **built** directory, not the source directory.

| Surface | Chrome / Edge / Brave | Firefox 140+ |
|---|---|---|
| Page restyler + Reader | `dist/chrome` | `dist/firefox/manifest.json` |
| Separate new-tab dashboard | `dist/newtab-chrome` | `dist/newtab-firefox/manifest.json` |
| Browser color theme | `dist/theme-chrome` | `dist/theme-firefox/manifest.json` |

For Chromium: open `chrome://extensions` (or `edge://extensions`), enable
Developer mode, choose Load unpacked, and select the directory.
For Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → manifest.
Temporary Firefox installation ends on restart; persistent use needs signing.
Grant host access when your browser asks. Restricted browser/store pages cannot
be restyled. Already open pages need one initial refresh after loading an unpacked
extension; subsequent mode changes apply immediately without navigation.

**Full** restyles the page and adds the frame. **Palette** only restyles.
**Off** restores styles still owned by M47, preserving subsequent app edits.
Alt+Shift+L cycles the current site. Use default removes a site override.
Reader extracts a local text view that closes back to the original page.

The page extension needs webpage access. The independent new-tab extension has
no permissions and stores user-entered quick links; it does not read
browser bookmarks. Closed shadow roots, cross-origin frames, fixed-position app
chrome and some CSS-generated content remain compatibility limits.

## Agent skill

Extract `dist/m47-v0.2.0-skill.zip`. Its `m47` folder includes `SKILL.md`, the
engine/CLI, font, token/CSS references, examples, and a conformance rubric.
Put the folder in the agent's skills directory. See [publishing](docs/PUBLISHING.md)
for installation paths. HTML/SVG generation needs only Node 22; PNG and local HTML
extraction use the packaged npm dependencies.

## Validate and release

```sh
npm run check
npm pack --dry-run
```

CI builds on Windows, macOS, and Linux and runs Chromium/Firefox browser tests.
`npm run build` produces eight ZIP bundles plus `dist/SHA256SUMS.txt`.
The draft-release and website workflows run only when manually dispatched.

- [Publishing guide](docs/PUBLISHING.md): exact files, commands, account gates,
  Chrome/Firefox/Edge, npm, agent skills, static hosting, PWA, themes.
- [Improvement spec](docs/IMPROVEMENTS.md): initial rating and implementation gates.
- [Assessment](docs/ASSESSMENT.md): final rating, evidence, and remaining work.
- [Original PRD](docs/PRD.md): historical research and longer-term targets.
- [Privacy policy](PRIVACY.md): what stays local and what sharing means.

## Credits and license

M47 generates original compositions inspired by the LCARS interface language
created by Michael Okuda. Unofficial fan-made project; not affiliated with CBS
Studios, Paramount, or any rights holder. STAR TREK and related marks belong to
their respective owners. No copied screen panels, show audio, or official insignia
are bundled. This does not establish rights clearance for the visual style.

Code and original project docs: [MIT](LICENSE). Antonio: [SIL OFL](extension/fonts/OFL.txt).
M47 is offered free without ads or paid tiers; that operating choice adds no
non-commercial restriction to MIT. See [NOTICE](NOTICE) for attribution and contacts.
