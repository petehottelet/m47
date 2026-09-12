import { palette, render } from '../../core/index.js';
import { extractSpec } from '../../core/extract.js';
import { B, getSettings } from '../shared/settings.js';
import { siteFixes } from './site-fixes.js';
/* M47 v0.2 — reversible dynamic restyler (content script)
 * Modes: "full" (restyle + frame chrome) | "palette" (restyle only) | "off"
 * Spec: swept PRD §5 — black ground, flat fills, warm structure / cool data,
 * capped bars, uppercase condensed type, calm motion.
 * Open-source fan/art project. Not affiliated with CBS Studios or Paramount.
 */
(() => {
  'use strict';
  if (window.__sweptActive) return;
  window.__sweptActive = true;

  const HOST = location.hostname;
  const shared = palette();

  const P = {
    ground: '#000000',
    panel: '#0D0C0A', // raised warm near-black
    panel2: '#15110C', // lighter tier
    panel3: '#1C1710',
    text: '#EDE7DB',
    dim: '#B9AE9C',
    bright: '#FFFF99', // pale-canary
    link: '#FFCC66', // golden-tanoi (never blue!)
    structure1: shared.structure,
    structure2: shared.secondary,
    structure3: '#CC6666', // chestnut-rose
    lilac: shared.interactive,
    tanoi: '#FFCC99',
    data: shared.data,
    deep: '#006699', // bahama-blue (decor)
    plum: '#664466', // eggplant (decor)
    border: '#3A2F24',
    accents: ['#CC99CC', '#FFCC66', '#FF9966', '#FFCC99', '#CC6666'],
  };

  /* ---------------- settings ---------------- */

  let mode = 'off',
    generation = 0,
    observer = null,
    baseStyle = null;
  let frameCleanup = () => {},
    readerCleanup = () => {};
  const changes = new Map(),
    ownWrites = new WeakMap();
  const owned = (el) => el.id?.startsWith('__swept_') || el.id?.startsWith('__m47_');
  function setStyle(el, key, value, priority = 'important') {
    let record = changes.get(el);
    if (!record) {
      record = { empty: !el.hasAttribute('style'), props: new Map() };
      changes.set(el, record);
    }
    if (!record.props.has(key))
      record.props.set(key, {
        value: el.style.getPropertyValue(key),
        priority: el.style.getPropertyPriority(key),
      });
    el.style.setProperty(key, value, priority);
    record.props.get(key).applied = [
      el.style.getPropertyValue(key),
      el.style.getPropertyPriority(key),
    ];
    ownWrites.set(el, el.getAttribute('style'));
  }
  function restore(el) {
    const record = changes.get(el);
    if (!record) return;
    for (const [key, saved] of record.props) {
      if (
        el.style.getPropertyValue(key) === saved.applied[0] &&
        el.style.getPropertyPriority(key) === saved.applied[1]
      ) {
        if (saved.value) el.style.setProperty(key, saved.value, saved.priority);
        else el.style.removeProperty(key);
      }
    }
    if (record.empty && !el.getAttribute('style')) el.removeAttribute('style');
    changes.delete(el);
    ownWrites.set(el, el.getAttribute('style'));
  }

  /* ---------------- base override stylesheet ---------------- */

  const FONT_URL = (() => {
    try {
      return B.runtime.getURL('fonts/Antonio.ttf');
    } catch {
      return '';
    }
  })();
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
button *,[role="button"] *{color:inherit!important;}
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
    const s = document.createElement('style');
    s.id = '__swept_base';
    s.textContent = BASE_CSS + siteFixes(HOST);
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
    if (String(m[4]).includes('%')) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  function luma({ r, g, b }) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
  }

  /* ---------------- dynamic darkener ---------------- */

  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'LINK',
    'META',
    'TITLE',
    'NOSCRIPT',
    'TEMPLATE',
    'IMG',
    'VIDEO',
    'CANVAS',
    'IFRAME',
    'OBJECT',
    'EMBED',
    'AUDIO',
    'PICTURE',
    'SOURCE',
    'BR',
    'WBR',
  ]);

  function isInteractive(el) {
    const t = el.tagName;
    if (t === 'BUTTON') return true;
    if (t === 'INPUT' && /^(submit|button|reset)$/.test(el.type || '')) return true;
    if (el.getAttribute && el.getAttribute('role') === 'button') return true;
    if (t === 'A' && /\b(btn|button|cta)\b/i.test(el.className || '')) return true;
    return false;
  }

  function restyleElement(el) {
    if (el.nodeType !== 1 || SKIP_TAGS.has(el.tagName)) return;
    if (el instanceof SVGElement) return;
    if (
      owned(el) ||
      !el.isConnected ||
      el.isContentEditable ||
      el.closest('[contenteditable="true"]')
    )
      return;
    restore(el);

    let cs;
    try {
      cs = getComputedStyle(el);
    } catch {
      return;
    }
    if (!cs || cs.display === 'none') return;

    const bg = parseColor(cs.backgroundColor);
    const bgi = cs.backgroundImage;

    // Kill light gradients (flat spec); keep url() images.
    if (bgi && bgi !== 'none' && bgi.includes('gradient') && !bgi.includes('url(')) {
      setStyle(el, 'background-image', 'none');
    }

    if (bg && bg.a > 0.05) {
      const L = luma(bg);
      if (isInteractive(el)) {
        if (L > 0.25) {
          // colored/light control → LCARS accent pill, black label
          const accent =
            P.accents[
              hash(el.tagName + (el.className || '') + (el.textContent || '').slice(0, 12)) %
                P.accents.length
            ];
          setStyle(el, 'background-color', accent);
          setStyle(el, 'color', '#000');
          setStyle(el, 'border-color', 'transparent');
        }
      } else if (L > 0.82) {
        // page-scale surfaces go pure black, smaller surfaces to warm panel
        let big = false;
        try {
          const r = el.getBoundingClientRect();
          big = r.width * r.height > innerWidth * innerHeight * 0.35;
        } catch {}
        setStyle(el, 'background-color', big ? P.ground : P.panel);
      } else if (L > 0.55) {
        setStyle(el, 'background-color', P.panel2);
      } else if (L > 0.32) {
        setStyle(el, 'background-color', P.panel3);
      }
    }

    // Dark text on (now) dark ground → warm off-white; leave colored text alone.
    const fg = parseColor(cs.color);
    if (fg && luma(fg) < 0.42 && !isInteractive(el)) {
      setStyle(el, 'color', P.text);
    }

    // Light borders → warm dark border.
    const bc = parseColor(cs.borderTopColor);
    if (bc && bc.a > 0.05 && luma(bc) > 0.5 && cs.borderTopStyle !== 'none') {
      setStyle(el, 'border-color', P.border);
    }
  }

  /* queue + idle processing (budgeted, SPA-safe) */
  const queue = new Set();
  let scheduled = false,
    walker = null;
  function enqueueTree(root) {
    if (mode === 'off' || root?.nodeType !== 1 || owned(root)) return;
    if (queue.size < 2000) queue.add(root);
    else {
      queue.clear();
      queue.add(document.body);
    }
    schedule();
  }
  function schedule() {
    if (scheduled || mode === 'off' || document.hidden) return;
    scheduled = true;
    const epoch = generation;
    const runner = () => {
      if (epoch !== generation) return;
      scheduled = false;
      const start = performance.now();
      let count = 0;
      while ((queue.size || walker) && count < 120 && performance.now() - start < 5) {
        if (!walker) {
          const root = queue.values().next().value;
          queue.delete(root);
          if (!root?.isConnected || owned(root)) continue;
          restyleElement(root);
          count++;
          walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (el) =>
              owned(el) || SKIP_TAGS.has(el.tagName) || el instanceof SVGElement
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT,
          });
        }
        const node = walker.nextNode();
        if (node) {
          restyleElement(node);
          count++;
        } else walker = null;
      }
      if (queue.size || walker) schedule();
    };
    if ('requestIdleCallback' in window) requestIdleCallback(runner, { timeout: 250 });
    else setTimeout(runner, 16);
  }
  function watchMutations() {
    observer = new MutationObserver((muts) => {
      let removed = false;
      for (const m of muts) {
        if (owned(m.target)) continue;
        if (m.type === 'attributes') {
          if (
            m.attributeName === 'style' &&
            ownWrites.get(m.target) === m.target.getAttribute('style')
          )
            continue;
          enqueueTree(m.target);
        } else {
          for (const node of m.addedNodes) enqueueTree(node);
          removed ||= m.removedNodes.length > 0;
        }
      }
      if (removed) for (const el of changes.keys()) if (!el.isConnected) restore(el);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
  }

  /* ---------------- frame chrome (full mode) ---------------- */

  const RAIL_W = 66,
    BAR_H = 24,
    GUT = 3;

  function seededCodes(seed, n) {
    let x = hash(seed) || 47;
    const out = [];
    for (let i = 0; i < n; i++) {
      x = (x * 1103515245 + 12345) >>> 0;
      out.push(String(x % 100).padStart(2, '0') + '-' + String(x % 10000).padStart(4, '0'));
    }
    out[Math.abs(x) % n] = '47-' + String(x % 10000).padStart(4, '0'); // seed a 47
    return out;
  }

  function buildFrame() {
    const host = document.createElement('div');
    host.id = '__swept_frame';
    const sh = host.attachShadow({ mode: 'open' });
    const codes = seededCodes(HOST, 8);
    const shortHost = HOST.replace(/^www\./, '')
      .slice(0, 14)
      .toUpperCase();

    const frameStyle = document.createElement('style');
    frameStyle.textContent = `
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
  button:focus-visible{outline:2px solid ${P.bright};outline-offset:-4px;}
  @media(max-width:600px){.rail{display:none;}.top .elbow{width:40px}.top .seg{display:none;}}
`;
    sh.append(frameStyle);
    const markup = document.createElement('template');
    markup.innerHTML = `
<div class="top">
  <div class="elbow"></div>
  <div class="bar"><b id="t"></b><b id="clock" style="opacity:.75"></b></div>
  <div class="seg"></div><div class="cap"></div>
</div>
<div class="rail">
  <button class="s" id="up" title="Scroll to top">
    <span class="l">Top</span><span class="n"></span></button>
  <div class="s" id="host-label">
    <span class="l"></span><span class="n"></span></div>
  <div class="s" id="scan-label">
    <span class="l" id="pct">0%</span><span class="n">SCAN</span></div>
  <div class="s" id="link-label">
    <span class="l" id="st">LINK</span><span class="n"></span></div>
  <div class="fill" aria-hidden="true"></div>
  <div class="endcap"></div>
</div>`;
    sh.append(markup.content);
    const segments = [
      ['up', P.structure2, 52],
      ['host-label', P.lilac, 64],
      ['scan-label', P.tanoi, 46],
      ['link-label', P.structure3, 46],
    ];
    for (const [id, color, height] of segments) {
      sh.getElementById(id).style.background = color;
      sh.getElementById(id).style.height = height + 'px';
    }
    sh.querySelector('#up .n').textContent = codes[0];
    sh.querySelector('#host-label .l').textContent = shortHost;
    sh.querySelector('#host-label .n').textContent = codes[1];
    sh.querySelector('#link-label .n').textContent = codes[2];
    for (const code of codes.slice(3)) {
      const span = document.createElement('span');
      span.textContent = code;
      sh.querySelector('.fill').append(span);
    }

    document.documentElement.appendChild(host);

    // Inset the page under the chrome.
    const inset = document.createElement('style');
    inset.id = '__swept_inset';
    inset.textContent = `
      html{margin-left:${RAIL_W + 10}px !important;margin-top:${BAR_H + 12 + 4}px !important;
           scroll-padding-top:${BAR_H + 20}px;}
      @media(max-width:600px){html{margin-left:0!important;}}
    `;
    document.documentElement.appendChild(inset);

    // Live bits — calm cadence.
    const $ = (id) => sh.getElementById(id);
    const title = () => {
      $('t').textContent = 'M47 · ' + (document.title || HOST);
    };
    title();
    const titleObserver = new MutationObserver(title);
    if (document.head)
      titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    const tick = () => {
      const d = new Date();
      $('clock').textContent =
        d.toTimeString().slice(0, 5) + ' · ' + d.toISOString().slice(0, 10).replace(/-/g, '.');
    };
    tick();
    const interval = setInterval(tick, 30000);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        $('pct').textContent =
          (max > 0 ? Math.min(100, Math.round((scrollY / max) * 100)) : 0) + '%';
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    $('up').addEventListener('click', () =>
      scrollTo({
        top: 0,
        behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
      }),
    );
    frameCleanup = () => {
      titleObserver.disconnect();
      clearInterval(interval);
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      host.remove();
      inset.remove();
    };
  }

  /* ---------------- boot ---------------- */

  function applyMode(next) {
    if (!['full', 'palette', 'off'].includes(next) || mode === next) return;
    generation++;
    scheduled = false;
    queue.clear();
    walker = null;
    observer?.disconnect();
    observer = null;
    frameCleanup();
    frameCleanup = () => {};
    for (const el of changes.keys()) restore(el);
    baseStyle?.remove();
    baseStyle = null;
    mode = next;
    if (next === 'off') return;
    baseStyle = injectBase();
    if (next === 'full') buildFrame();
    enqueueTree(document.body);
    watchMutations();
  }
  async function refresh() {
    try {
      const cfg = await getSettings();
      applyMode(cfg.sites[HOST] ?? cfg.defaultMode);
    } catch {
      applyMode('off');
    }
  }
  const ready =
    document.readyState === 'loading'
      ? new Promise((res) => document.addEventListener('DOMContentLoaded', res, { once: true }))
      : Promise.resolve();
  B.storage.onChanged.addListener((_, area) => {
    if (area === 'local') ready.then(refresh);
  });
  addEventListener('load', () => enqueueTree(document.body), { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
  function openReader() {
    readerCleanup();
    const spec = extractSpec(document),
      previous = document.activeElement;
    const host = document.createElement('div');
    host.id = '__m47_reader';
    const sh = host.attachShadow({ mode: 'open' });
    sh.innerHTML = `<style>:host{all:initial}dialog{width:min(1100px,96vw);height:94vh;max-width:96vw;max-height:94vh;background:#000;border:2px solid #ff9966;padding:12px;color:#ede7db}dialog::backdrop{background:rgba(0,0,0,.8)}button{background:#ffcc66;color:#000;border:0;border-radius:24px;padding:12px 24px;min-height:44px;font:16px system-ui;cursor:pointer}button:focus-visible{outline:2px solid #ffff99;outline-offset:3px}iframe{width:100%;height:calc(100% - 60px);border:0;margin-top:12px}</style><dialog aria-label="M47 Reader"><button type="button">Close reader / Esc</button><iframe title="Article in M47 Reader" sandbox=""></iframe></dialog>`;
    const dialog = sh.querySelector('dialog');
    sh.querySelector('iframe').srcdoc = render(spec).replace(
      '</style>',
      `@font-face{font-family:Antonio;src:url('${FONT_URL}');font-weight:100 700}</style>`,
    );
    const close = () => {
      dialog.close();
      host.remove();
      previous?.focus?.();
      readerCleanup = () => {};
    };
    sh.querySelector('button').addEventListener('click', close);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    document.documentElement.append(host);
    dialog.showModal();
    sh.querySelector('button').focus();
    readerCleanup = close;
  }
  B.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.type === 'm47-ping') {
      respond({ ready: true });
      return false;
    }
    if (message?.type === 'm47-reader') {
      try {
        openReader();
        respond({ ok: true });
      } catch (e) {
        respond({ error: e.message });
      }
      return false;
    }
    return false;
  });
  ready.then(refresh);
})();
