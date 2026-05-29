# Secret Tracker

The secret tracker is a separate route that loads, parses, plays, and visualizes
MOD files. It shares the project renderer and virtual screen size, but it has
its own UI, input handling, audio engine, and render loop.

## Routes

The tracker opens when the URL matches:

- `/tracker`
- `/secret/tracker`
- `#tracker`

The main demo can also navigate to `/tracker` when the hidden mystery-note
sprite is clicked. That sprite is enabled on the fourth screen of the main demo
sequence and uses virtual-coordinate hit testing.

## Startup

`SecretTrackerPage.start()` performs these steps:

1. Adds pointer input to the tracker canvas.
2. Adds keyboard input to `window`.
3. Loads the MOD catalog from `/audio/manifest.json`.
4. Loads image backdrop candidates from `/images/manifest.json`.
5. Selects a random backdrop image.
6. Loads the default MOD entry.
7. Attempts playback.
8. Starts the tracker render loop.

The default MOD is the entry titled `Intro Tune`, or the first catalog entry if
that title is not available.

## UI Layout

The tracker draws directly into the `320 x 200` canvas:

- Header: route title, era label, and current song title.
- File picker: three visible MOD entries, selected row marker, loaded row
  marker, and shortened titles.
- Transport: previous, play/pause, stop, next, volume down, and volume up.
- Status: order position, pattern index, row, BPM, speed, and status message.
- Pattern data: four visible rows with four channels of note/sample/effect
  data.
- Visualizer panel: switchable audio visualization.
- Overlay: lissajous sprite decoration and a short secret-room message.

## Input

Pointer input:

- Transport buttons call the matching playback action.
- File rows load and play the clicked MOD.
- Visualizer mode buttons switch visualization mode.

Keyboard input:

- Space toggles play/pause.
- Up and Down move the highlighted MOD row.
- Enter loads and plays the highlighted MOD.

## MOD Catalog

`src/secret-tracker/data/modCatalog.ts` reads `/audio/manifest.json`.

Supported manifest shapes:

- An array of entries.
- An object with `mods`, `files`, or `tracks` arrays.

Supported entry shapes:

- String path.
- Object with `file` and optional `title`.

Only `.mod` files are included in the tracker catalog. Duplicate file paths are
ignored after the first occurrence.

## Title Formatting

Catalog entries use the manifest title when present. If a title is not present,
the title is derived from the filename by removing `.mod` and replacing dashes
and underscores with spaces.

The file picker has limited width, so long titles are formatted as:

```text
first 8 characters + "~" + last 3 characters
```

Shorter titles display unchanged.

## MOD Parser

`src/secret-tracker/core/ModParser.ts` parses classic ProTracker-like module
data into the typed structures in `ModTypes.ts`.

Parsed data includes:

- Song title.
- 31 sample headers.
- Song length.
- Pattern order table.
- Signature.
- Channel count.
- Pattern rows and channel events.
- Signed 8-bit sample data.

The parser currently recognizes common four-channel signatures such as `M.K.`,
`M!K!`, `4CHN`, and `FLT4`, and also derives channel count from signatures like
`6CHN` or `8CHN`. The UI pattern view displays four channels.

`NotePeriodTable.ts` maps Amiga periods to approximate note names for display.

## MOD Player

`src/secret-tracker/audio/SimpleModPlayer.ts` is a compact Web Audio MOD
player.

It:

- Converts signed 8-bit sample data to mono `AudioBuffer` objects.
- Uses an `AudioContext`, per-channel `AudioBufferSourceNode`, per-channel
  `GainNode`, a master gain node, and an analyser node.
- Uses PAL clock period math to set sample playback rates.
- Supports sample loop points.
- Tracks order position, row, speed, BPM, and play state.
- Emits playback state to `SecretTrackerPage`.
- Provides waveform and frequency arrays for visualizers.

Supported row effects include:

- `0A`: volume slide.
- `0B`: position jump.
- `0C`: set volume.
- `0D`: pattern break.
- `0F`: set speed or BPM.

The player is intentionally small. It is suitable for demo playback and
learning, not a complete replacement for a full MOD engine.

## Visualizers

`src/secret-tracker/visualizers/VisualizerDeck.ts` owns the available
visualizer modes and the active index. It renders a fallback empty analysis
frame when audio analysis is not available.

Current modes:

- `ScopeVisualizer`: oscilloscope waveform.
- `SpectrumBarsVisualizer`: frequency bars.
- `VuColumnsVisualizer`: smoothed four-column VU style display.
- `RasterPulseVisualizer`: raster stripes driven by audio energy.

All visualizers implement the `TrackerVisualizer` interface from
`TrackerVisualizer.ts`.

## Backdrops

The tracker reuses files from `public/images/manifest.json` as background
images. It chooses a random candidate and avoids immediately repeating the same
file when possible.

The image is center-cropped to the `320 x 200` tracker screen, faded, filtered,
and overlaid with scanline-style tinting before UI panels are drawn.

## Decorative Overlay

`LissajousSpriteOverlay.ts` draws small motion accents over the tracker using
precomputed sprite canvases and lissajous-style paths. It is visual decoration
only and does not affect audio or input.

## Browser Audio Restrictions

The tracker attempts to start playback after loading the default song. Browsers
may block this until the user interacts with the page. In that case the status
message becomes `CLICK PLAY`, and the user can start playback with the play
button, Space, or by selecting a file.
