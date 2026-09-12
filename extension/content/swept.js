/* swept v0.1 — LCARS-style dynamic restyler (content script)
 * Modes: "full" (restyle + frame chrome) | "palette" (restyle only) | "off"
 * Spec: swept PRD §5 — black ground, flat fills, warm structure / cool data,
 * capped bars, uppercase condensed type, calm motion.
 * Open-source fan/art project. Not affiliated with CBS Studios or Paramount.
 */
(() => {
  "use strict";
  if (window.__sweptActive) return;
  window.__sweptActive = true;

  const B = globalThis.browser ?? globalThis.chrome;
  const HOST = location.hostname;

  const P = {
    ground: "#000000",
    panel: "#0D0C0A",      // raised warm near-black
    panel2: "#15110C",     // lighter tier
    panel3: "#1C1710",
    text: "#EDE7DB",
    dim: "#B9AE9C",
    bright: "#FFFF99",     // pale-canary
    link: "#FFCC66",       // golden-tanoi (never blue!)
    structure1: "#FF9966", // orange-peel
    structure2: "#FFCC66",
    structure3: "#CC6666", // chestnut-rose
    lilac: "#CC99CC",
    tanoi: "#FFCC99",
    data: "#99CCFF",       // anakiwa
    deep: "#006699",       // bahama-blue (decor)
    plum: "#664466",       // eggplant (decor)
    border: "#3A2F24",
    accents: ["#CC99CC", "#FFCC66", "#FF9966", "#FFCC99", "#CC6666"]
  };

  /* ---------------- settings ---------------- */

  const DEFAULTS = { defaultMode: "full", sites: {} };

  function getSettings() {
    return new Promise((res) => {
      try {
        B.storage.sync.get(DEFAULTS, (v) => res(v && typeof v === "object" ? v : DEFAULTS));
      } catch { res(DEFAULTS); }
    });
  }

  /* ---------------- base override stylesheet ---------------- */

  const FONT_URL = (() => { try { return B.runtime.getURL("fonts/Antonio.ttf"); } catch { return ""; } })();
  const DISP = `"swept Antonio","Antonio","Oswald","Arial Narrow",sans-serif`;

  const BASE_CSS = `
@font-face{font-family:"swept Antonio";src:url("${FONT_URL}") format("truetype");font-weight:100 700;font-display:swap;}
:root{color-scheme:dark !important;}
html{background-color:${P.ground} !important;}
body{background-color:${P.ground} !important;color:${P.text};}
* { box-shadow:none !important; text-shadow:none !important; }
:focus-visible{outline:2px solid ${P.bright} !important;outline-offset:2px;}
::selection{background:${P.lilac};color:#000;}
a:link,a:link *{color:${P.link} !important;}
a:visited,a:visited *{color:${P.tanoi} !important;}
a:hover,a:hover *,a:focus,a:focus *{color:${P.bright} !important;}
h1,h2,h3,h4,h5,h6,legend,summary,th,dt{
  font-family:${DISP} !important;text-transform:uppercase;
  letter-spacing:.02em;color:${P.structure2};font-weight:600;
}
h1,h1 *{color:${P.bright} !important;}
h2,h2 *,h3,h3 *{color:${P.structure2} !important;}
nav a,header a,[role="navigation"] a{
  font-family:${DISP} !important;text-transform:uppercase;letter-spacing:.03em;
}
button,input[type="button"],input[type="submit"],input[type="reset"],[role="button"]{
  font-family:${DISP} !important;text-transform:uppercase;letter-spacing:.03em;
  border-radius:999px !important;border-color:${P.border} !important;
}
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
textarea,select{
  background-color:${P.panel} !important;color:${P.text} !important;
  border:1px solid ${P.plum} !important;border-radius:9px !important;
  caret-color:${P.structure2};
}
input::placeholder,textarea::placeholder{color:${P.dim} !important;opacity:.8;}
hr{border-color:${P.plum} !important;background-color:${P.plum} !important;}
table{border-color:${P.border} !important;}
th,td{border-color:${P.border} !important;}
code,pre,kbd,samp{color:${P.data};}
mark{background:${P.structure2} !important;color:#000 !important;}
* {scrollbar-color:${P.structure1} ${P.ground};scrollbar-width:thin;}
::-webkit-scrollbar{width:12px;height:12px;background:${P.ground};}
::-webkit-scrollbar-thumb{background:${P.structure1};border-radius:8px;border:2px solid ${P.ground};}
::-webkit-scrollbar-corner{background:${P.ground};}
@media (prefers-reduced-motion:reduce){.swept-blink{animation:none !important;}}
`;

  function injectBase() {
    const s = document.createElement("style");
    s.id = "__swept_base";
    s.textContent = BASE_CSS;
    (document.head || document.documentElement).appendChild(s);
    return s;
  }

  /* ---------------- color math ---------------- */

  const RGBA_RE = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\)/;

  function parseColor(str) {
    if (!str) return null;
    const m = RGBA_RE.exec(str);
    if (!m) return null;
    let a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (String(m[4]).includes("%")) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  function luma({ r, g, b }) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }

  /* ---------------- dynamic darkener ---------------- */

  const SKIP_TAGS = new Set(["SCRIPT","STYLE","LINK","META","TITLE","NOSCRIPT","TEMPLATE",
    "IMG","VIDEO","CANVAS","IFRAME","OBJECT","EMBED","AUDIO","PICTURE","SOURCE","BR","WBR"]);

  function isInteractive(el) {
    const t = el.tagName;
    if (t === "BUTTON") return true;
    if (t === "INPUT" && /^(submit|button|reset)$/.test(el.type || "")) return true;
    if (el.getAttribute && el.getAttribute("role") === "button") return true;
    if (t === "A" && /\b(btn|button|cta)\b/i.test(el.className || "")) return true;
    return false;
  }

  function restyleElement(el) {
    if (el.nodeType !== 1 || SKIP_TAGS.has(el.tagName)) return;
    if (el instanceof SVGElement) return;
    if (el.id === "__swept_frame") return;

    let cs;
    try { cs = getComputedStyle(el); } catch { return; }
    if (!cs || cs.display === "none") return;

    const bg = parseColor(cs.backgroundColor);
    const bgi = cs.backgroundImage;

    // Kill light gradients (flat spec); keep url() images.
    if (bgi && bgi !== "none" && bgi.includes("gradient") && !bgi.includes("url(")) {
      el.style.setProperty("background-image", "none", "important");
    }

    if (bg && bg.a > 0.05) {
      const L = luma(bg);
      if (isInteractive(el)) {
        if (L > 0.25) { // colored/light control → LCARS accent pill, black label
          const accent = P.accents[hash(el.tagName + (el.className || "") + (el.textContent || "").slice(0, 12)) % P.accents.length];
          el.style.setProperty("background-color", accent, "important");
          el.style.setProperty("color", "#000", "important");
          el.style.setProperty("border-color", "transparent", "important");
        }
      } else if (L > 0.82) {
        // page-scale surfaces go pure black, smaller surfaces to warm panel
        let big = false;
        try { const r = el.getBoundingClientRect(); big = r.width * r.height > innerWidth * innerHeight * 0.35; } catch {}
        el.style.setProperty("background-color", big ? P.ground : P.panel, "important");
      } else if (L > 0.55) {
        el.style.setProperty("background-color", P.panel2, "important");
      } else if (L > 0.32) {
        el.style.setProperty("background-color", P.panel3, "important");
      }
    }

    // Dark text on (now) dark ground → warm off-white; leave colored text alone.
    const fg = parseColor(cs.color);
    if (fg && luma(fg) < 0.42 && !isInteractive(el)) {
      el.style.setProperty("color", P.text, "important");
    }

    // Light borders → warm dark border.
    const bc = parseColor(cs.borderTopColor);
    if (bc && bc.a > 0.05 && luma(bc) > 0.5 && cs.borderTopStyle !== "none") {
      el.style.setProperty("border-color", P.border, "important");
    }
  }

  /* queue + idle processing (budgeted, SPA-safe) */
  const queue = [];
  let scheduled = false, processedCount = 0;
  const MAX_ELEMENTS = 20000;

  function enqueueTree(root) {
    if (processedCount > MAX_ELEMENTS) return;
    if (root.nodeType !== 1) return;
    queue.push(root);
    if (root.querySelectorAll) {
      const kids = root.querySelectorAll("*");
      for (let i = 0; i < kids.length && queue.length < MAX_ELEMENTS; i++) queue.push(kids[i]);
    }
    schedule();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    const runner = (deadline) => {
      let n = 0;
      while (queue.length && n < 400 && (!deadline || deadline.timeRemaining === undefined || deadline.timeRemaining() > 2)) {
        restyleElement(queue.shift()); n++; processedCount++;
      }
      scheduled = false;
      if (queue.length) schedule();
    };
    if ("requestIdleCallback" in window) requestIdleCallback(runner, { timeout: 500 });
    else setTimeout(() => runner(null), 40);
  }

  function watchMutations() {
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.id !== "__swept_frame") enqueueTree(node);
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ---------------- frame chrome (full mode) ---------------- */

  const RAIL_W = 66, BAR_H = 24, GUT = 3;

  function seededCodes(seed, n) {
    let x = hash(seed) || 47;
    const out = [];
    for (let i = 0; i < n; i++) {
      x = (x * 1103515245 + 12345) >>> 0;
      out.push(String(x % 100).padStart(2, "0") + "-" + String(x % 10000).padStart(4, "0"));
    }
    out[Math.abs(x) % n] = "47-" + String(x % 10000).padStart(4, "0"); // seed a 47
    return out;
  }

  function buildFrame() {
    const host = document.createElement("div");
    host.id = "__swept_frame";
    const sh = host.attachShadow({ mode: "open" });
    const codes = seededCodes(HOST, 8);
    const shortHost = HOST.replace(/^www\./, "").slice(0, 14).toUpperCase();

    sh.innerHTML = `
<style>
  :host{all:initial;}
  *{box-sizing:border-box;margin:0;padding:0;font-family:${DISP};}
  .top{position:fixed;top:0;left:0;right:0;height:${BAR_H + 12}px;z-index:2147483646;
       display:flex;gap:${GUT}px;align-items:flex-start;pointer-events:none;background:${P.ground};}
  .top .elbow{width:${RAIL_W + 34}px;height:${BAR_H + 12}px;background:${P.structure1};
       border-top-left-radius:16px;position:relative;flex:none;}
  .top .elbow::after{content:"";position:absolute;right:0;bottom:0;width:34px;
       height:${12}px;background:${P.ground};border-top-left-radius:11px;}
  .top .bar{flex:1;height:${BAR_H}px;background:${P.structure1};display:flex;
       align-items:center;justify-content:space-between;padding:0 12px;min-width:0;}
  .top .bar b{font-weight:700;font-size:12px;letter-spacing:.06em;color:#000;
       text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .top .seg{width:52px;height:${BAR_H}px;background:${P.lilac};flex:none;}
  .top .cap{width:26px;height:${BAR_H}px;background:${P.structure2};flex:none;
       border-radius:0 ${BAR_H / 2}px ${BAR_H / 2}px 0;margin-right:2px;}
  .rail{position:fixed;top:${BAR_H + 12 + GUT}px;left:0;bottom:0;width:${RAIL_W}px;
       z-index:2147483646;display:flex;flex-direction:column;gap:${GUT}px;
       background:${P.ground};padding-bottom:2px;}
  .s{display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;
       padding:4px 7px;color:#000;text-transform:uppercase;flex:none;border:0;
       width:100%;text-align:right;cursor:default;}
  button.s{cursor:pointer;}
  button.s:hover{filter:brightness(1.18);}
  .s .l{font-weight:700;font-size:10.5px;letter-spacing:.04em;}
  .s .n{font-size:9px;opacity:.72;}
  .fill{flex:1;background:${P.deep};display:flex;flex-direction:column;gap:7px;
       align-items:flex-end;padding:10px 7px;overflow:hidden;min-height:40px;}
  .fill span{color:rgba(0,0,0,.55);font-size:9px;letter-spacing:.06em;}
  .endcap{height:22px;background:${P.plum};border-radius:0 0 ${RAIL_W / 3}px 0;flex:none;}
  .blink{animation:swept-blink 1s steps(1) infinite;}
  @keyframes swept-blink{50%{opacity:.4;}}
  @media (prefers-reduced-motion:reduce){.blink{animation:none;}}
</style>
<div class="top">
  <div class="elbow"></div>
  <div class="bar"><b id="t"></b><b id="clock" style="opacity:.75"></b></div>
  <div class="seg"></div><div class="cap"></div>
</div>
<div class="rail">
  <button class="s" id="up" style="background:${P.structure2};height:52px" title="Scroll to top">
    <span class="l">Top</span><span class="n">${codes[0]}</span></button>
  <div class="s" style="background:${P.lilac};height:64px">
    <span class="l">${shortHost}</span><span class="n">${codes[1]}</span></div>
  <div class="s" style="background:${P.tanoi};height:46px">
    <span class="l" id="pct">0%</span><span class="n">SCAN</span></div>
  <div class="s" style="background:${P.structure3};height:46px">
    <span class="l blink" id="st">LINK</span><span class="n">${codes[2]}</span></div>
  <div class="fill">${codes.slice(3).map(c => `<span>${c}</span>`).join("")}</div>
  <div class="endcap"></div>
</div>`;

    document.documentElement.appendChild(host);

    // Inset the page under the chrome.
    const inset = document.createElement("style");
    inset.id = "__swept_inset";
    inset.textContent = `
      html{margin-left:${RAIL_W + 10}px !important;margin-top:${BAR_H + 12 + 4}px !important;
           scroll-padding-top:${BAR_H + 20}px;}
    `;
    document.documentElement.appendChild(inset);

    // Live bits — calm cadence.
    const $ = (id) => sh.getElementById(id);
    const title = () => { $("t").textContent = "M47 · " + (document.title || HOST); };
    title();
    new MutationObserver(title).observe(document.querySelector("title") || document.head, { childList: true, subtree: true });
    const tick = () => { const d = new Date(); $("clock").textContent =
      d.toTimeString().slice(0, 5) + " · " + d.toISOString().slice(0, 10).replace(/-/g, "."); };
    tick(); setInterval(tick, 30000);
    let raf = 0;
    addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        $("pct").textContent = (max > 0 ? Math.min(100, Math.round(scrollY / max * 100)) : 0) + "%";
      });
    }, { passive: true });
    $("up").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------------- boot ---------------- */

  getSettings().then((cfg) => {
    const mode = cfg.sites[HOST] ?? cfg.defaultMode ?? "full";
    if (mode === "off") return;

    injectBase();

    const start = () => {
      enqueueTree(document.body || document.documentElement);
      watchMutations();
      // second pass after load: late CSS/webfonts can change computed styles
      addEventListener("load", () => enqueueTree(document.body), { once: true });
      if (mode === "full") buildFrame();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else start();
  });
})();
