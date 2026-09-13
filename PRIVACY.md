# M47 privacy policy

Effective September 12, 2026 — version 0.2.

## Page extension

M47 has no application server, analytics, advertising, accounts, or telemetry.
It reads styles to restyle a page and reads visible article text when you request
Reader. Page content is processed in your browser, not recorded or sent to M47.
Bundled fonts are loaded from the extension package.

Mode preferences and site hostnames are stored in `storage.local`. Version 0.2
migrates the prototype's `storage.sync` settings to local storage and removes the
old sync keys. Your browser controls when that deletion reaches other devices.
M47 does not synchronize new settings.

The separate new-tab extension stores quick-link names and URLs locally. It does
not read your browser bookmarks. Clicking a link navigates to its website normally.
Browser themes contain no executable code or stored user data.

## Generator website and CLI

The host receives ordinary requests for the website and bundled files and may
retain standard access logs under its own policy. M47 adds no analytics. Editing,
imports, and rendering happen on your device. A local draft is stored in browser
storage. A service worker caches the app shell for offline use.

Exports download local files. Share links encode the complete panel in the URL
fragment. Anyone receiving a link can read its panel. HTTP requests do not include
fragments, but browser history, synchronization, clipboard tools and recipients
may retain the URL. Only share content you intend to disclose.

The CLI reads local files and writes requested outputs; it makes no network calls.
Installing dependencies through npm involves the registry as usual.

The optional Google-inspired search concept sends your query directly to Google
in a new tab only when you submit the search form. It does not save queries or
request remote suggestions. Example-search buttons fill the input locally.
Links to Google services follow those services' own privacy policies.

The YouTube concept requests thumbnails from YouTube's image servers. Selecting a
video loads YouTube's embedded player; search opens YouTube in a new tab. Those
requests are governed by YouTube's policies. Watch Later stores only selected
video IDs in local browser storage. M47 does not receive this list. Remove saved
items with their bookmark buttons, or clear the site's browser data.

## Controls and contact

Clear site overrides in the popup. Uninstall an extension to remove its local data.
Reset a workshop draft or clear the website's browser data to remove drafts/cache.
Contact: pete@hottelet.com.
