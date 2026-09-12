// Small compatibility overrides, deliberately scoped. Report live-site regressions
// with the URL, mode, browser version and an original reproducible fixture.
const fixes = [
  [
    /^(.*\.)?wikipedia\.org$/,
    '.mw-body,.vector-header-container{background:#000!important}.mw-parser-output{line-height:1.7!important}',
  ],
  [
    /^news\.ycombinator\.com$/,
    '.comment,.commtext{color:#ede7db!important}.athing a{color:#ffcc66!important}',
  ],
  [
    /^github\.com$/,
    '.blob-code,.blob-code-inner,.react-code-text{font-family:ui-monospace,monospace!important;text-transform:none!important}',
  ],
  [/^old\.reddit\.com$/, '.md{color:#ede7db!important}.thumbnail img{filter:none!important}'],
  [/^developer\.mozilla\.org$/, '.code-example pre{font-family:ui-monospace,monospace!important}'],
  [
    /^docs\.python\.org$/,
    '.highlight pre,.sig{font-family:ui-monospace,monospace!important;text-transform:none!important}',
  ],
  [/^nodejs\.org$/, '.api a code{color:#ffcc66!important}'],
  [
    /^stackoverflow\.com$/,
    '.s-code-block,code{font-family:ui-monospace,monospace!important;text-transform:none!important}',
  ],
  [
    /^en\.wiktionary\.org$/,
    '.IPA{font-family:system-ui,sans-serif!important;text-transform:none!important}',
  ],
  [
    /^www\.w3\.org$/,
    '.idl,.prod{font-family:ui-monospace,monospace!important;text-transform:none!important}',
  ],
];
export function siteFixes(host) {
  return fixes
    .filter(([pattern]) => pattern.test(host))
    .map(([, css]) => css)
    .join('\n');
}
