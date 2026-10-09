# M47 generative screensaver

Randomized LCARS-inspired consoles with twenty purposes: navigation, engineering,
science, weather, communications, life support, logistics, ocean survey, transport,
observatory, computing, geology, tactical analysis, transporter control, warp dynamics,
medical diagnostics, shuttle operations, environmental systems, temporal mechanics,
and stellar evolution. Instrument readings are simulated. An optional,
separately labeled observation band shows public Earth or space-weather data.

Diagram families include stellar sector maps, deep-field imaging, spectra, sector grids,
relay networks, waveforms, and distribution switchboards; asymmetric arc scans and reactor columns add
two more instrument treatments. Eight compositions change the frame topology:
survey console, nested scanner, panoramic telemetry, twin workstations, reactor
column, data archive, arc scanner, and bridge stations. Portrait screens adapt
to a vertical console with left or right rails. Elbow tangents and vertical sections
share their width; adjoining frame segments use uniform 3px gutters.
With “Cycle all purposes” selected, each cycle visits every purpose before
repeating. Seeds reproduce a sequence with the same purpose and palette settings.
The data updates every three seconds without replacing animated SVG nodes. New
scenes assemble their frames, then reveal instrument banks over about 1.4 seconds.
The arc scanner uses an offset origin, broken range bands, and seven bracketed
contacts with one selected track. Its filled sweep travels back and forth through
the open sector; a bright leading edge and fading trail remain below the targets.
Spectrum bars, reactor cells and signal traces
also continue moving between samples. Choose full, slow, or no animation. Pause freezes movement and readings;
reduced motion starts paused and disables animation even after resuming updates.
Hidden tabs stop animation, scene advancement and feed requests. There is no audio.

**Scan instruments** switches between arc/sector instruments and
rectangular instruments with linear sweeps. Stellar Cartography uses its own
sector map with four plotted star systems, a highlighted course and range
readouts. Observatory uses a bracketed star field, and geology uses subsurface sections.
The preference persists with the other screensaver settings.

Environmental subsystem banks use solid curved elbows, segmented rails, and
conduits with visible terminals. Temporal frames use broad capped bands with
nested curved returns and grouped terminal accents. The distribution switchboard has four distinct
bus lanes with twenty capacity cells and numerical utilization per lane. Shuttle
berth labels sit within solid rails, clear of the approach grid; the approach
marker is a filled shape with rounded turns.

The eight operations subjects have dedicated responsive instruments: intercept
tracks, six transporter phase columns and a nine-row buffer, paired nacelle coils,
three biometric traces, docking berths, a regeneration circuit, a reference-frame
cascade, and a stellar population plot. Transporter columns and buffer rows pulse
as coherent groups. Their geometry remains stable between simulated reading updates,
and all instruments honor pause, slow, still, hidden-tab and reduced-motion settings.

Shared title and metric bands reserve space between labels, values and units.
The panoramic telemetry register sits inside its lower frame. These clearances
apply to compact landscape displays and portrait layouts as well as desktops.

Eight palettes are available: warm/classic, gold/lavender, blue/amber, electric/ochre,
silver/ice, violet/coral, mineral/seafoam, and sunset/rose. Layout and palette can be
pinned independently or cycled. Palette assignments shift on subsequent cycles.

## Public observations

The default is **Off / simulation only**. In **Observation band**, choose:

- **UTC clock:** device time, with no network requests.
- **USGS / earthquakes:** events with reported magnitudes in the past 24 hours,
  maximum magnitude, location of that event, and the feed generation timestamp.
- **NOAA / space weather:** the latest planetary Kp index (0–9) with observation
  and fetch timestamps. This is a three-hour index, not a second-by-second sensor.

Requests go directly to two fixed, keyless HTTPS endpoints every five minutes
while active, with a ten-second timeout. No account, location, cookies or API key
is supplied. Source preferences persist locally; fetched observations stay in
memory. A failed refresh preserves the last reading as **Cached / offline**;
USGS data older than 20 minutes and Kp observations older than six hours are
marked **Stale**. If nothing has loaded, the band says **Unavailable** and retries.
Simulation never fills in for a failed public feed. The instruments above the
band remain visibly labeled as simulated.

Provider references: [USGS GeoJSON summary feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)
and [NOAA SWPC planetary Kp feed](https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json).
Both endpoints were checked for successful responses and browser CORS support.

## Browser

Run `npm run build` and `npm run dev`, then open
<http://127.0.0.1:4747/screensaver.html>. Choose Fullscreen, or use F. Space pauses;
N advances. A persistent gear opens or minimizes the controls; the panel also has
a circular **X** button. S toggles controls and Escape closes them. Tab reaches the
gear when the panel is closed; Enter or Space activates it. Closed controls stay
closed while the pointer moves, and their fields leave the keyboard tab order.
The initial panel recedes after 30 seconds if it is not being used; explicitly
opened controls remain open until minimized. A URL such as
`screensaver.html?seed=observatory` reproduces the same generated sequence when
the purpose and palette settings match; the seed name does not select a purpose.
Preferences stay in local storage. No account or network feed is needed.

The page is included in the website and skill bundles and the workshop's offline
cache. A browser display does not register itself as the operating system's idle
screensaver or lock the device. Fullscreen requires a user gesture and browser support.

## Windows screensaver

Build on 64-bit Windows with the .NET Framework compiler available:

```sh
npm run build
npm run build:screensaver
```

The first native build downloads a pinned, checksum-verified Microsoft WebView2
SDK from NuGet. Later builds reuse that package. Running the screensaver requires
the Microsoft Edge WebView2 Runtime, normally present on current Windows systems.
The browser version has no WebView2 dependency.

Extract `dist/m47-v0.2.0-screensaver-windows-x64.zip` to a permanent folder. Keep
**all companion DLLs and the web folder beside M47.scr**. Right-click `M47.scr`
and choose **Install**, then select M47 and the idle timeout in Windows Screen
Saver Settings. Enable Windows' sign-in-on-resume option if desired. The build
does not change those settings automatically. The executable is unsigned.

- `M47.scr /c` opens settings and a live preview; preferences save automatically.
- `M47.scr /s` runs on all connected monitors. Keyboard or pointer input exits.
- `M47.scr /p <window-handle>` embeds the Windows Settings preview.
- `M47.scr --window` opens a regular preview window.

If a shell opens `.scr` files through Windows' file association and ignores the
arguments, use the companion `M47-preview.exe` with the same arguments instead.

The native host serves bundled files through a local virtual hostname. Page requests
are restricted to bundled content and the exact two public feed URLs above;
navigation to external pages remains blocked. Feeds are requested only when selected.
It uses a dedicated WebView2 profile for settings.
It does not start a local HTTP server. Microsoft WebView2 has its own runtime
maintenance behavior; the host's page-request restriction is not an OS firewall.

## Development checks

The offline Node suite checks deterministic sequences, complete purpose and layout
coverage, bounded readings, feed parsing, stale/offline labels, and cancellation.
Browser tests use fixture feeds and cover animation continuity, pause and hidden-tab
behavior, opt-in network access, cached failure, settings, reduced motion, fullscreen
and keyboard controls in Chromium and Firefox. Text extent checks exercise every
purpose in every layout in both orientations, including long observation text.

`M47.scr --self-test` checks command parsing. `M47.scr --smoke-test <output-file>`
verifies that the native WebView2 host loads its bundled page and creates a scene
SVG at its local virtual hostname, then exits. Both native checks passed on
Windows. Actual operating-system idle activation and multi-monitor behavior have
not been manually verified.

Sources: Microsoft's [local WebView2 content documentation](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/working-with-local-content)
and [Windows screensaver installation documentation](https://learn.microsoft.com/en-us/windows/win32/devnotes/scrnsave-exe).

Code is MIT; Antonio is SIL OFL. Microsoft's runtime components retain their own
license and notice included in the native archive.
