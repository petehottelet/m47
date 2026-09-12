# Publishing M47 0.2

The source repository is **private**: https://github.com/petehottelet/m47.
Keep it private. A public website, npm package, or store upload publishes the
selected artifact separately. Private GitHub release links require repository
access; a private README or PRIVACY.md cannot serve as a public policy URL.

## Recommended order

1. Use the local builds and private draft release with invited testers.
2. Publish `dist/web` to a static host. Its `/privacy.html` is the public policy.
3. Submit the page extension to Chrome, Firefox, and Edge. Submit the separate
   new-tab and theme packages only if you want those additional store listings.
4. Publish the npm package and distribute the agent skill when ready to make
   those source bundles public. The MIT license permits this; repository
   visibility is independent of the license.

No store fees have been paid, accounts created, packages publicly published, or
website deployed by the repository setup. Store accounts, any current fees,
identity checks, consent screens, and reviews remain the publisher's steps.

## Build once

From this directory, on Windows, macOS, or Linux, with Node 22+:

```sh
npm ci
npm run build
npm test
npx playwright install chromium firefox
npm run test:browser
npm pack --pack-destination dist
```

| Artifact in `dist/` | Destination |
|---|---|
| `m47-v0.2.0-chrome.zip` | Chrome Web Store and Edge Add-ons; page restyler + Reader |
| `m47-v0.2.0-firefox.zip` | AMO listing or unlisted signing; page restyler + Reader |
| `m47-v0.2.0-newtab-chrome.zip` | Separate Chrome/Edge new-tab listing |
| `m47-v0.2.0-newtab-firefox.zip` | Separate Firefox new-tab listing/signing |
| `m47-v0.2.0-theme-chrome.zip` | Chrome Web Store theme listing |
| `m47-v0.2.0-theme-firefox.zip` | Firefox theme listing |
| `m47-v0.2.0-skill.zip` | Portable Codex/Claude agent skill |
| `m47-v0.2.0-website.zip` | Static host upload; unzip first if the host requires a folder |
| `petehottelet-m47-0.2.0.tgz` | npm package from `npm pack` |
| `SHA256SUMS.txt` | SHA-256 hashes of the eight ZIP artifacts |

Unpacked `dist/chrome`, `dist/firefox`, `dist/newtab-*`, `dist/theme-*`, `dist/web`,
and `dist/skill/m47` are also provided. Source files are not unpacked extension
builds: the release step bundles modules for the browser. No remote code is loaded.
`build.sh` and `build.ps1` call the same Node build.

## Private GitHub releases

The initial source and final implementation are committed on `main`. The manual
**Build draft release** Actions workflow builds, tests, packs, and creates a draft
release. It never publishes to npm or a browser store. It fails rather than
silently overwriting an existing release with the same version.

Manual equivalent after checks pass:

```sh
gh release create v0.2.0 dist/*.zip dist/*.tgz dist/SHA256SUMS.txt --target main --draft --title "M47 0.2.0" --notes-file docs/RELEASE.md
```

On PowerShell, use `Get-ChildItem` to assemble an array of archive paths if your
shell does not expand wildcards for gh. A draft is visible only to users with
sufficient repository access. Invite testers through Settings → Collaborators;
source and private release links are not anonymous distribution links.

## Static website, PWA, and policy hosting

The app needs only static files. There is no database, API server, secret, or
account system. Build command: `npm ci && npm run build`. Publish directory:
`dist/web`. All asset paths are relative, so subdirectory hosting works.
The app manifest and service worker support installation/offline loading on
compatible browsers after an initial online visit. HTTPS is required for public
service-worker use. Hosting providers may record ordinary access logs.

### Netlify

Import the private GitHub repository with access to that repository. The included
`netlify.toml` selects Node 22, the build command, and `dist/web`. Alternatively,
upload the built `dist/web` folder through Netlify's deployment UI. A published
site exposes its delivered JavaScript and assets even while the repository stays
private. Use the resulting `/privacy.html` address in store listings.
[Netlify build configuration](https://docs.netlify.com/build/configure-builds/overview/).

### GitHub Pages

The included **Publish website to GitHub Pages** workflow is manual. In repository
Settings → Pages, choose GitHub Actions, then dispatch the workflow. A personal
private repository needs an eligible plan such as GitHub Pro for Pages; do not
make this repository public just to enable hosting. The published Pages site is
normally public even though its source repo is private. Use Netlify or another
static host if your plan does not support this configuration.
[GitHub Pages availability and visibility](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

### Cloudflare Pages / any static host

Use Direct Upload for `dist/web`, or configure a Git-based build with the same
build command/output. Cloudflare Direct Upload and Git integration have different
project setup paths, so choose the intended path when creating the project.
[Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).
The built directory can also go on an existing HTTPS web server or static host.
No plugin installation is required to use the artifacts.

## Chrome Web Store

1. Sign in to the [developer dashboard](https://chrome.google.com/webstore/devconsole),
   complete registration, current fee/identity steps, email verification, and 2FA.
2. Add an item and upload `m47-v0.2.0-chrome.zip`.
3. Supply the listing copy below and current screenshots from `store-assets/v0.2/`.
   The original root store artwork is retained as historical material; review it
   before reusing it. A screenshot is evidence of the represented product, not a
   guarantee that every site is compatible.
4. Complete the privacy and permissions declarations using the actual behavior
   below. Supply the public hosted `/privacy.html` URL.
5. Choose the desired listing visibility and submit for review. Unlisted is useful
   for link-based testing but is not private and does not bypass policies/review.

[Official publication steps](https://developer.chrome.com/docs/webstore/publish).
Review timelines vary; this project does not promise approval or a date.

**Page-extension permission explanations**

- `storage`: saves local per-site/default modes and migrates the prototype's old
  sync settings into local storage before deleting old sync keys.
- `activeTab`: identifies the active page for popup controls and Reader.
- `http://*/*`, `https://*/*`: content scripts restyle pages in place and respond to
  per-site mode changes. Reader extracts text locally when explicitly requested.
- Remote executable code: none. Analytics/telemetry: none. Page content is not
  transmitted. Review the separate website's normal hosting/share behavior when
  completing declarations; it is described in the privacy policy.

## Firefox: AMO listing or signed self-distribution

Submit `m47-v0.2.0-firefox.zip` at the
[Add-ons Developer Hub](https://addons.mozilla.org/developers/). Choose listing on
AMO or self-distribution. The latter returns a signed XPI you can distribute to
invited testers or on a public download host. A raw unsigned ZIP is only suitable
for temporary developer loading. Use the separate Firefox packages for new-tab
and theme listings; each has its own stable add-on ID.

The functional extension builds require Firefox 140+ and declare
`data_collection_permissions.required: ["none"]`. Modern new submissions must
state their data practices. Host permissions can require a user grant through
Firefox's extension controls; test a clean install and document the prompt shown.
[Mozilla submission guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/),
[built-in data consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).

For source review, supply a source archive plus `package-lock.json`, Node 22, and
these reproduction commands: `npm ci`, `npm run build`. The source repo is private;
reviewers need the archive, not an inaccessible private URL. Create it from the
release commit with `git archive --format=zip --output=dist/m47-v0.2.0-source.zip HEAD`.
Do not add node_modules, secrets, browser profiles, or unrelated local files.

## Microsoft Edge Add-ons

Use the [Partner Center extension flow](https://partner.microsoft.com/dashboard/microsoftedge).
Register the publisher account and upload `m47-v0.2.0-chrome.zip`; submit the new-tab
package separately if desired. Provide store copy, permission descriptions,
screenshots, support contact, and the public privacy URL. Test the final package
in Edge before submission; Chromium test coverage alone is not Edge certification.
[Microsoft's publishing guide](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension).

## Browser color themes

The Chrome theme uses a Manifest V3 theme package; Firefox's static theme uses
Manifest V2. These contain colors and metadata, no executable code. Upload the
matching `theme-*.zip` to the browser's theme publication flow. They change browser
chrome only; install the restyler or new-tab extension for those surfaces.
[Chrome themes](https://developer.chrome.com/docs/extensions/develop/ui/themes).

## npm CLI/library

The configured package name is `@petehottelet/m47`. You must control that npm scope
and verify name availability; the GitHub account does not create an npm account.
Publishing `--access public` makes the package files public while GitHub stays private.

```sh
npm login
npm whoami
npm pack --dry-run
npm publish --access public
```

Inspect the dry-run allowlist: core, CLI, font/OFL, LICENSE, NOTICE, README and
privacy text. Do not publish a version until its tests and metadata are final;
registry versions cannot be reused. Complete the registry's current 2FA or trusted
publishing requirements. No registry credential is stored in the project.
[Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

After actual publication:

```sh
npx @petehottelet/m47 generate --title "Station 47" --out station.html
npm install @petehottelet/m47
```

## Codex and Claude skill distribution

Extract `m47-v0.2.0-skill.zip` and copy the `m47` directory into the configured
skills directory: commonly `$CODEX_HOME/skills/m47` (or `~/.codex/skills/m47`) for
Codex, and `~/.claude/skills/m47` for Claude Code. Project-scoped skill directories
are also possible; follow the installed agent's current discovery rules. Restart
or reload its skill discovery if required. The same SKILL.md is used by both.

The skill has its own offline engine, CLI, examples and font. HTML/SVG need Node
22 only. Run `npm ci --omit=dev` inside the extracted skill if PNG or local HTML
extraction is needed. Package dependencies are installed by npm; generation itself
uses no network. Test the ten prompts in `reference/evaluation.md` in each agent
before claiming the original PRD's dual-agent evaluation gate.

## Paste-ready page-extension listing

**Name:** M47 — retro terminal interface

**Summary:** Restyle the web as a calm retro terminal. Per-site modes, instant undo,
a local reader, and no telemetry.

**Description:**

M47 brings black space, warm curved frames, pill controls, and condensed display
type to ordinary webpages.

FULL restyles a page and adds the terminal frame. PALETTE changes colors and
controls. OFF restores M47's changes. Settings apply immediately without reloading
the page. Choose a per-site mode or follow your default; Alt+Shift+L cycles modes.

Open Reader for a local text-focused view of an article, then close it to return
to the original page. Settings stay on this device. No analytics, ads, application
server, or page-content transmission. Fonts and executable code are bundled.

Some complex applications, embedded frames, and shadow-root content may not be
fully restyled. Use Palette or Off when needed. Browser internal pages and some
store pages cannot be modified.

Original fan-made interface project. LCARS interface language created by Michael
Okuda. Not affiliated with CBS Studios, Paramount, or any rights holder. Code MIT;
Antonio font SIL OFL. Support: pete@hottelet.com.

The new-tab and theme listings must describe only their own functionality. Do not
reuse the page-extension permission declarations for the permission-free new tab
or static themes. Do not claim the private source is publicly available.

## Rights and release review

Use original compositions and properly licensed assets, retain NOTICE/OFL/license
files, and avoid implying endorsement. MIT covers the project's code and original
docs; it does not establish clearance for third-party marks or visual designs.
The old PRD's legal discussion is historical, unverified research, not a clearance
opinion or a promise of a safe harbor. A recognizable fan style can still attract
complaints or store rejection. Rights concerns go to the contact in NOTICE.
