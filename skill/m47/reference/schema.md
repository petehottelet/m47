# Panel content

```json
{
  "title": "STATION 47",
  "subtitle": "Demonstration readings",
  "sections": [
    {"type":"text","title":"Notes","text":"Paragraphs separated by a blank line."},
    {"type":"metrics","title":"Telemetry","items":[{"label":"Signal","value":"47 DB"}]},
    {"type":"bars","title":"Capacity","items":[{"label":"Power","value":87}]},
    {"type":"table","title":"Log","columns":["Unit","State"],"rows":[["Receiver","Online"]]}
  ]
}
```

At most 24 sections. Titles are at most 120 characters; section titles 100.
Text sections accept up to 50,000 characters. Metrics and bars accept 24 items;
bar values are numeric 0–100. Tables accept eight columns and 100 rows, with
matching row lengths. All content is escaped and treated as text.

Dimensions: integer width 320–4096, height 170–4096. Palettes: tng-default,
tng-early, red-alert. Density: comfortable or compact. Seed: up to 100 characters.
Example: `--size 600x1000 --seed ridge-47 --scheme tng-early --density compact`.
