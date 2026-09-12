export const componentCSS = `
*{box-sizing:border-box}html{color-scheme:dark;background:var(--m47-ground)}
body{margin:0;color:var(--m47-text);font:16px/1.6 system-ui,sans-serif}
.m47{background:var(--m47-ground);min-height:100vh;padding:20px;position:relative}
.m47 h1,.m47 h2,.m47 nav,.m47 .readout,.m47 .end{font-family:Antonio,'Arial Narrow',sans-serif;text-transform:uppercase;line-height:1.15}
.m47 h1{font-size:clamp(28px,4vw,64px);font-weight:600;color:var(--m47-bright);margin:0 0 24px;overflow-wrap:anywhere}
.m47 h2{font-size:28px;color:var(--m47-secondary);margin:0 0 18px;font-weight:500}
.m47 header{display:flex;gap:3px;height:56px;margin-bottom:20px}
.m47 .elbow{width:100px;height:76px;background:var(--m47-structure);border-radius:48px 0 0 0;position:relative;flex:none}
.m47 .elbow:after{content:'';position:absolute;inset:22px 0 0 64px;background:#000;border-radius:12px 0 0 0}
.m47 .bar{background:var(--m47-secondary);height:22px;flex:1;border-radius:0 11px 11px 0}
.m47 .layout{display:grid;grid-template-columns:64px minmax(0,1fr);gap:36px}
.m47 nav{display:flex;flex-direction:column;gap:3px;align-self:start;font-size:17px}
.m47 nav a,.m47 .decor{display:block;text-align:right;background:var(--m47-interactive);color:#000;padding:18px 8px;text-decoration:none;overflow-wrap:anywhere}
.m47 nav a:nth-child(even){background:var(--m47-secondary)}
.m47 .decor{background:var(--m47-structure);min-height:130px;border-radius:0 0 32px 32px;display:flex;align-items:end;justify-content:end}
.m47 main{min-width:0}.m47 section{margin-bottom:36px;break-inside:avoid}
.m47 p{max-width:72ch;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 16px}
.m47 .metrics{display:flex;flex-wrap:wrap;gap:16px 40px;margin:0}.m47 .metrics div{min-width:100px}
.m47 dt{color:var(--m47-muted);font-size:14px}.m47 dd{margin:4px 0;color:var(--m47-data);font:36px/1.2 Antonio,sans-serif;overflow-wrap:anywhere}
.m47 .table-wrap{overflow:auto}.m47 table{border-collapse:collapse;width:100%;text-align:left;font-variant-numeric:tabular-nums}
.m47 th{color:var(--m47-secondary);font-weight:600}.m47 td,.m47 th{padding:10px 16px 10px 0;border-bottom:1px solid #423627;overflow-wrap:anywhere}
.m47 .bars{display:grid;gap:12px}.m47 .meter{display:grid;grid-template-columns:minmax(80px,1fr) 3fr 44px;gap:12px;align-items:center}
.m47 meter{width:100%;height:22px;accent-color:var(--m47-data)}
.m47 meter::-webkit-meter-bar{height:10px;background:#423627;border:0;border-radius:5px}
.m47 meter::-webkit-meter-optimum-value{background:var(--m47-data);border-radius:5px}
.m47 meter::-moz-meter-bar{background:var(--m47-data);border-radius:5px}
.m47 a{color:var(--m47-secondary);text-underline-offset:4px}.m47 :focus-visible{outline:2px solid var(--m47-bright);outline-offset:4px}
.m47 .end{display:flex;gap:16px;justify-content:space-between;color:var(--m47-muted);font-size:16px;margin-top:36px;flex-wrap:wrap}
.m47.compact section{margin-bottom:22px}.m47.compact td,.m47.compact th{padding-top:6px;padding-bottom:6px}
::selection{background:var(--m47-interactive);color:#000}*{scrollbar-color:var(--m47-structure) #000}
@media(max-width:600px){.m47{padding:16px}.m47 header{height:32px}.m47 .elbow{width:52px;height:44px;border-radius:24px 0 0 0}.m47 .elbow:after{inset:14px 0 0 32px;border-radius:7px 0 0 0}.m47 .bar{height:14px;border-radius:0 7px 7px 0}.m47 .layout{grid-template-columns:1fr;gap:24px}.m47 nav{flex-direction:row;flex-wrap:wrap}.m47 nav a{padding:12px 16px;border-radius:24px;min-height:44px}.m47 .decor{display:none}.m47 h1{margin-bottom:20px}.m47 h2{font-size:24px}.m47 .meter{grid-template-columns:80px minmax(0,1fr) 40px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;scroll-behavior:auto!important}}
`;
