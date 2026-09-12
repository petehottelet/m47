export const examples = [
  {
    name: 'Observatory',
    width: 1280,
    height: 800,
    spec: {
      title: 'REMOTE OBSERVATORY',
      subtitle: 'Sierra station / night operations · demonstration data',
      sections: [
        {
          type: 'metrics',
          title: 'Station telemetry',
          items: [
            { label: 'Tracking', value: '47.02' },
            { label: 'Seeing', value: '0.8 ARCSEC' },
            { label: 'Array', value: 'ONLINE' },
          ],
        },
        {
          type: 'bars',
          title: 'Subsystem capacity',
          items: [
            { label: 'Optics', value: 94 },
            { label: 'Storage', value: 62 },
            { label: 'Power', value: 87 },
          ],
        },
        {
          type: 'table',
          title: 'Observation queue',
          columns: ['Target', 'Window', 'Status'],
          rows: [
            ['M47 / open cluster', '22:40', 'Acquiring'],
            ['NGC 7000', '23:15', 'Scheduled'],
            ['M31 / Andromeda', '00:20', 'Scheduled'],
          ],
        },
      ],
    },
  },
  {
    name: 'Field notes',
    width: 600,
    height: 1000,
    spec: {
      title: 'FIELD NOTES',
      subtitle: 'Survey 47 / ridge transect · demonstration data',
      sections: [
        {
          type: 'text',
          title: 'First light',
          text: 'The ridge emerged from the fog at 06:20. Three sensors are recording the changing temperature along the eastern slope.\n\nThe next survey follows the contour north. Record conditions at each marker before returning to base.',
        },
        {
          type: 'metrics',
          title: 'Conditions',
          items: [
            { label: 'Temperature', value: '12.4 C' },
            { label: 'Elevation', value: '2,047 M' },
          ],
        },
      ],
    },
  },
  {
    name: 'Wide console',
    width: 1920,
    height: 700,
    spec: {
      title: 'ARRAY CONTROL',
      subtitle: 'Local instrument console · demonstration data',
      sections: [
        {
          type: 'metrics',
          title: 'Readouts',
          items: [
            { label: 'Frequency', value: '1420 MHZ' },
            { label: 'Signal', value: '47 DB' },
            { label: 'Phase', value: 'LOCKED' },
          ],
        },
        {
          type: 'bars',
          title: 'Receiver channels',
          items: [
            { label: 'Channel A', value: 84 },
            { label: 'Channel B', value: 67 },
          ],
        },
      ],
    },
  },
  {
    name: 'Tiny widget',
    width: 480,
    height: 240,
    spec: {
      title: 'STATION 47',
      subtitle: 'Instrument status · demo',
      sections: [
        { type: 'metrics', title: 'LINK', items: [{ label: 'Receiver', value: 'ONLINE' }] },
      ],
    },
  },
  {
    name: 'Reading room',
    width: 900,
    height: 1000,
    spec: {
      title: 'THE QUIET INTERFACE',
      subtitle: 'An original note on information design',
      sections: [
        {
          type: 'text',
          title: 'Space carries meaning',
          text: 'A useful display does not need to fill every corner. Space separates one thought from the next and lets important information stay visible.\n\nWarm structure frames the page. Cooler data marks the readings. Color, shape, and text work together so that color is never the only signal.',
        },
        {
          type: 'text',
          title: 'Calm by default',
          text: 'Movement should explain a change. It should not become a permanent demand for attention. A still display can be a confident display.',
        },
      ],
    },
  },
  {
    name: 'Instrument log',
    width: 1280,
    height: 900,
    spec: {
      title: 'INSTRUMENT LOG',
      subtitle: 'Maintenance archive · demonstration data',
      sections: [
        {
          type: 'table',
          title: 'Service record',
          columns: ['Unit', 'Last service', 'Result'],
          rows: [
            ['Optics / 01', '2026-09-08', 'Aligned'],
            ['Receiver / 02', '2026-09-09', 'Calibrated'],
            ['Mount / 03', '2026-09-10', 'Verified'],
            ['Power / 04', '2026-09-11', 'Verified'],
          ],
        },
      ],
    },
  },
  {
    name: 'Alert panel',
    width: 1100,
    height: 800,
    scheme: 'red-alert',
    spec: {
      title: 'ATTENTION / ARRAY OFFLINE',
      subtitle: 'Simulated alert · no live equipment connected',
      sections: [
        {
          type: 'text',
          title: 'Inspection required',
          text: 'The demonstration receiver has stopped responding. Check power and cable connections before restarting the instrument.',
        },
        {
          type: 'metrics',
          title: 'Last report',
          items: [
            { label: 'Unit', value: '47-B' },
            { label: 'State', value: 'OFFLINE' },
          ],
        },
      ],
    },
  },
  {
    name: 'Blank canvas',
    width: 1280,
    height: 800,
    spec: {
      title: 'YOUR NEXT INTERFACE',
      subtitle: 'Start with a title. Make room for the data.',
      sections: [
        {
          type: 'text',
          title: 'Begin here',
          text: 'Edit this content in the JSON editor. Add text, metrics, tables, or bars. Everything stays on this device unless you export or share it.',
        },
      ],
    },
  },
];
