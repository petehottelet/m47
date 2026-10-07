// Approximate percent bounds measured visually from supplied references, excluding outer screenshot borders.
// These document composition, not pixel-perfect source reconstruction.
export const screenDivisions = [
  {
    ref: 'R1',
    family: 'layout-radial',
    name: 'Engineering survey: asymmetric three-column, two-tier console',
    divisions: [
      ['Global title rails', 0, 0, 100, 10],
      ['Command/value bank', 3, 13, 21, 34],
      ['Radial instrument', 3, 53, 22, 42],
      ['Signature / local controls', 28, 25, 12, 25],
      ['Support numbers', 28, 51, 12, 40],
      ['Shared spine', 40, 25, 13, 70],
      ['Telemetry and scan controls', 37, 12, 60, 33],
      ['Primary map', 55, 52, 42, 42],
    ],
    hierarchy:
      'The gold top band establishes the whole console. The large right map is primary; the radial lower-left instrument is the counterweight. Tiny numeric banks are supporting texture and evidence, not equal panels.',
    structure:
      'Two continuous gold header rails. A middle vertical spine joins the upper scan header to the map through opposing elbows. The map command rail sits inside that assembly. The radial has its own open outline rather than a rectangular card.',
    alignment:
      'Map top aligns to the lower horizontal bus; control stacks attach to the same spine. Lower radial and map share a visual baseline. Unequal numeric columns occupy leftover vertical strips.',
    whitespace:
      'Generous black gaps separate independent instruments; narrow uniform cuts separate segments within a rail or command bank.',
    adaptation:
      'Preserve the map/radial priority in portrait by stacking instruments; keep the map large enough for its tick labels, and move support numbers below rather than shrinking all regions together.',
  },
  {
    ref: 'R2',
    family: 'layout-scan',
    name: 'Nested scan: utility sidebar, two-part spine, header-over-map',
    divisions: [
      ['Signature', 3, 3, 17, 16],
      ['Local controls', 3, 20, 17, 15],
      ['Numeric telemetry', 3, 37, 17, 31],
      ['Lower controls', 3, 69, 17, 17],
      ['Outer segmented spine', 21, 3, 8, 94],
      ['Inner elbow / scan tools', 30, 3, 8, 94],
      ['Scan title and controls', 39, 2, 59, 28],
      ['Twin crossbars', 38, 30, 60, 5],
      ['Dominant boundary map', 39, 36, 59, 61],
    ],
    hierarchy:
      'The boundary map occupies the broad lower-right field. The title and selectors form a shallow header above it. The left utility stack is secondary and denser.',
    structure:
      'Two adjacent vertical runs do different jobs: the outer is a tall colored ID stack; the inner changes from an upper returning elbow to a lower leading elbow, with scan commands below. The crossbars tie both tiers to one alignment axis.',
    alignment:
      'Map, upper numeric group and title cluster share the same content-side edge. The paired horizontal buses touch the inner elbow tangent. Sidebars use horizontal three-cell subdivisions.',
    whitespace:
      'Large open header space lets the right-aligned title dominate. The map remains an open plotting surface; its curved territorial boundary is data, not a frame edge.',
    adaptation:
      'Stack header and map while preserving the zone boundary; convert the utility column to a compact top or bottom bank. Keep outer and inner rail roles distinguishable.',
  },
  {
    ref: 'R3',
    family: 'layout-diagnostic',
    name: 'Diagnostic console: outer return, nested two-tier data region',
    divisions: [
      ['Top identity return', 8, 2, 84, 12],
      ['Left value register', 8, 18, 23, 64],
      ['Upper central elbow', 34, 14, 9, 27],
      ['Top dense data banks', 45, 14, 47, 25],
      ['Double separator / bridge', 43, 40, 49, 4],
      ['Lower code spine', 34, 45, 9, 39],
      ['Readiness register', 46, 47, 20, 35],
      ['Small diagnostic plot', 68, 50, 20, 25],
      ['Bottom return', 8, 85, 48, 11],
      ['Detached lower readings', 56, 87, 36, 10],
    ],
    hierarchy:
      'The title and left large-value register carry identity and scanning. Dense upper banks dominate information volume; the smaller lower-right plot is an inset diagnostic, not a hero chart.',
    structure:
      'An outer broad C-like return surrounds the left region. Inside, gold upper and lavender lower elbows meet at a double rule. Lower detached readouts intentionally sit beyond the short outer return.',
    alignment:
      'Upper banks and lower register start at the content edge of the inner spine. The small plot floats within the lower field. The outer bottom bar ends before the detached readouts.',
    whitespace:
      'Discontinuous register rows and a large black region below the plot are deliberate. Do not regularize this into equal cards or fill every gap.',
    adaptation:
      'Keep diagnostic tables readable before enlarging the small plot. A portrait view can stack the two data tiers and shorten the outer return while keeping the floating readouts attached visually.',
  },
  {
    ref: 'R4',
    family: 'layout-engineering',
    name: 'Engineering plant: large upper enclosure with separate timeline stage',
    divisions: [
      ['Outer left frame', 9, 3, 14, 68],
      ['Numeric groups', 30, 16, 17, 46],
      ['Axial engine', 49, 16, 16, 46],
      ['Upper auxiliary plant', 81, 11, 17, 14],
      ['Energy conduit', 64, 24, 29, 20],
      ['Lower-right values', 69, 47, 29, 17],
      ['Upper frame bottom commands', 28, 68, 70, 3],
      ['Lower frame / commands', 9, 74, 89, 14],
      ['Timing matrix', 25, 79, 48, 18],
    ],
    hierarchy:
      'The vector engine is the primary object. The conduit visibly explains its relationship to the auxiliary plant. Numerical groups support those objects. The lower matrix is a second stage with its own frame, not the engine footer.',
    structure:
      'Thick enclosing upper C-frame with a separate top-right auxiliary elbow. A substantial black horizontal gap separates the lower frame. A single rounded pipe connects two mechanical assemblies inside the upper field.',
    alignment:
      'Engine sits on a vertical axis; left number groups align to its cell groups. The right output bank sits below the conduit. Lower matrix columns line up to their own ruler, independent of the engine geometry.',
    whitespace:
      'The black cavity around the engine is functional clearance for silhouette recognition and conduit routing. The lower stage is cropped at the reference boundary; its unseen remainder is not inferred.',
    adaptation:
      'Keep schematic relationships intact; scale the engine/conduit/manifold as a group, then stack supporting readouts and the independent timeline. Avoid rerouting a pipe through text.',
  },
  {
    ref: 'R5',
    family: 'layout-information',
    name: 'Information console: utility sidebar and nested text enclosure',
    divisions: [
      ['Signature viewport', 1, 2, 20, 31],
      ['Paired commands', 1, 36, 20, 19],
      ['Status sentences', 1, 58, 20, 14],
      ['Lower staggered commands', 1, 76, 20, 17],
      ['Outer code spine', 22, 1, 10, 98],
      ['Upper inner elbow', 33, 1, 10, 29],
      ['Top title / controls / numbers', 44, 2, 55, 26],
      ['Double separator', 43, 28, 56, 5],
      ['Lower inner spine', 33, 32, 10, 67],
      ['Main information field', 45, 37, 54, 33],
      ['Inset lower return', 45, 73, 54, 23],
    ],
    hierarchy:
      'The online station title leads the upper field. The page headline and paragraph occupy a broad black reading area. Signature, command banks and status list form a distinct utility column.',
    structure:
      'Outer long ID spine and inner opposing elbows create the same structural grammar as the scan reference, but the lower content is text. A second reversed return encloses a small lower caption area.',
    alignment:
      'Upper buses meet the inner spine. Main title, headline and paragraph align within the content cavity rather than to the outermost rail. Bottom staggered controls remain aligned to the sidebar.',
    whitespace:
      'Broad paragraph space and an inset footer create hierarchy; the utility stack is intentionally denser. Do not stretch text to occupy the entire black cavity.',
    adaptation:
      'Keep a readable text measure. Move the utility controls into task groups above or below the main reading field, preserving their group boundaries.',
  },
  {
    ref: 'R6',
    family: 'layout-workstation',
    name: 'Dual workstation: mirrored panes with a central tool spine',
    divisions: [
      ['Viewer header', 3, 13, 46, 11],
      ['Viewer image and captions', 4, 18, 36, 60],
      ['Viewer inward tools', 41, 25, 8, 47],
      ['Library inward tools', 50, 25, 8, 47],
      ['Library header', 50, 13, 46, 11],
      ['Library table', 61, 20, 34, 52],
      ['Pane bottom returns', 3, 73, 93, 7],
      ['Desktop task strip', 1, 93, 97, 6],
    ],
    hierarchy:
      'The image and file table are peer workspaces. They are not equal in content density: the viewer has a large visual field, while the library has many compact rows. The desktop strip is a separate global level.',
    structure:
      'Two C-frames mirror inward so their vertical rails meet at the center with a black separation. The header bars include window controls. The task strip spans the whole screen below a large black interval.',
    alignment:
      'Pane top and bottom bars share baselines. Central tool banks face their content. Image selection uses its own local grid; table columns follow independent tab stops. Buttons sit just above each pane return.',
    whitespace:
      'Large top/bottom black margins belong to the desktop composition. The gap above the task strip distinguishes global tasks from pane-local commands.',
    adaptation:
      'Stack whole workstations or prioritize one pane with a switcher. Do not compress two tiny side-by-side panes on a phone; preserve the local controls with each pane.',
  },
];
