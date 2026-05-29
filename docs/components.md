# Component Guide

This guide documents the demo components by source folder. It focuses on what
each component owns, what data it consumes, what it emits or draws, and where
to extend it.

## Component Model

The project is intentionally small and canvas-first:

- `src/main.ts` chooses a route.
- `Renderer` creates the shared `320 x 200` drawing surface.
- `DemoApp` owns the main intro/demo experience.
- `SecretTrackerPage` owns the hidden MOD tracker route.
- Runtime assets are fetched from `public/` manifests rather than imported into
  the TypeScript graph.

Most animation components follow the same shape:

- An owner creates the component.
- `update(deltaTime, elapsedTime)` advances state.
- `render(ctx)` draws into virtual canvas coordinates.

## Root Source Files

### `src/main.ts`

Bootstraps the application. It imports global CSS, finds the `#app` mount node,
checks the current route, and starts either `DemoApp` or `SecretTrackerPage`.

Route selection accepts:

- `/tracker`
- `/secret/tracker`
- `#tracker`

Everything else starts the main demo. This file should stay thin; new route
logic should delegate to route-level classes instead of growing startup code in
`main.ts`.

### `src/DemoApp.ts`

Top-level coordinator for the main demo route. It owns the renderer, timing,
performance monitor, image effects, vector 3D system, sprite system, hidden
tracker trigger, MP3 music rotator, runtime asset loading, scroller text, screen
rotation, start overlay, and input handling.

Startup responsibilities:

- Load scroller text from `/text/scroller-message.txt`.
- Load public slideshow images from `/images/manifest.json`.
- Load MP3 tracks from `/audio/manifest.json`.
- Generate built-in splash images.
- Build an image-only first rotation from generated and public images.
- Build a second rotation that repeats the image sequence with vector screens
  distributed through it.
- Pick a public image or generated slide for the start backdrop.
- Create the `Scroller` and first image effect.
- Render the start backdrop and show the click-to-enter prompt.

The start prompt is its own short-lived DOM overlay. It has a canvas full of
generated sprites with lightweight repulsion and home-orbit motion. Pointer
down, Enter, or Space removes the overlay, registers global demo input, starts
music if the browser allows it, and begins the main `requestAnimationFrame`
loop.

Frame responsibilities:

- `Time.tick()` returns clamped frame timing.
- `updateSlide()` advances to the next screen every `5` seconds.
- `EffectManager` updates and renders the active image effect when the selected
  screen is an image.
- `Vector3DSystem` updates and renders the active realtime vector screen when
  the main demo sequence selects one.
- `SpriteSystem` updates and renders the active sprite group.
- `SecretTrackerTriggerSprite` is enabled on the fourth displayed screen.
- `Scroller` crawls the bottom message.
- `PerformanceMonitor` refreshes debug labels and FPS.

Runtime inputs:

- `D` toggles the debug overlay.
- Any key or pointer input retries MP3 playback after autoplay blocks.
- Pointer input is converted from CSS pixels into virtual canvas coordinates.
- Clicking the enabled secret tracker trigger navigates to `/tracker`.

Extension points:

- Add image effects through `ImageEffectKind`,
  `DemoApp.firstCycleEffectSequence`, `DemoApp.fullEffectSequence`, and
  `createImageEffect()`.
- Add realtime 3D vector screens through `src/vector3d/Vector3DScreens.ts`.
  Vector screens are mixed into the second rotation so the first image sequence
  stays unchanged.
- Add generated slides in `SplashImageGenerator.createIntroSet()`.
- Add public slides in `public/images/manifest.json`.
- Add MP3 tracks in the `tracks` section of `public/audio/manifest.json`.

### `src/Renderer.ts`

Creates the shared stage element and fixed `320 x 200` canvas. It disables image
smoothing on the 2D context so generated art and low-resolution assets remain
pixel-sharp after CSS scaling.

Public surface:

- `stage`: wrapper element used by overlays and `PerformanceMonitor`.
- `canvas`: fixed-size drawing surface.
- `ctx`: 2D rendering context.
- `clear(color?)`: fills the full virtual canvas.

Both routes create their own `Renderer` instance, so route code does not share
render loop state.

### `src/Time.ts`

Small frame clock for the main demo. `tick(timestamp)` returns:

- `deltaTime`: seconds since the previous frame.
- `elapsedTime`: accumulated seconds since the first tick.

The delta is clamped to `0.1` seconds. This keeps animation and physics from
jumping too far after tab switching, debugger pauses, or a temporarily blocked
main thread.

### `src/PerformanceMonitor.ts`

Builds the optional debug overlay inside the renderer stage. It samples FPS
every half second and displays:

- FPS.
- Frame time.
- 60 FPS frame budget.
- Active image title.
- Active effect name.
- Active 3D vector screen.
- Active sprite pattern.
- Current MP3 track label and playback time.

`DemoApp` owns visibility and toggles it with the `D` key. The monitor is not
part of canvas rendering; it is normal DOM layered over the stage.

### `src/constants.ts`

Shared virtual screen and timing constants:

- `VIRTUAL_WIDTH = 320`
- `VIRTUAL_HEIGHT = 200`
- `MAIN_AREA_Y = 0`
- `MAIN_AREA_HEIGHT = 160`
- `SCROLLER_Y = 160`
- `SCROLLER_HEIGHT = 40`
- `TARGET_FPS = 60`
- `FRAME_BUDGET_MS = 1000 / TARGET_FPS`

Rendering code should use these constants instead of CSS sizes. The browser
scales the canvas visually, but all drawing and hit testing happen in virtual
coordinates.

## Vector 3D

### `src/vector3d/Vector3DSystem.ts`

Owns the active realtime 3D vector screen. It follows the same component shape
as image effects and sprite effects:

- `setActiveScreen()` selects the vector screen chosen by the main demo
  sequence.
- `update(deltaTime, elapsedTime)` advances the selected screen.
- `render(ctx)` clips drawing to the main `320 x 160` visual area.

### `src/vector3d/Vector3DScreen.ts`

Defines the small interface for new vector screens:

- `name`: shown in the debug overlay.
- `reset()`: optional hook for screen-local state.
- `update(deltaTime, elapsedTime)`: advances motion.
- `render(ctx)`: draws into virtual canvas coordinates.

### `src/vector3d/VectorMeshRenderer.ts`

Reusable Canvas 2D mesh renderer. It rotates vertices, projects them with a
simple perspective camera, depth-sorts faces, draws flat-shaded polygons, and
then draws wireframe edges over the top.

### `src/vector3d/VectorScreenMath.ts`

Shared math helpers for vector screens that do not use `VectorMeshRenderer`.
It provides point rotation, perspective projection, vector arithmetic, dot and
cross products, normalization, linear interpolation, and smoothstep easing.

### `src/vector3d/VectorMeshes.ts`

Stores reusable mesh definitions. A mesh has vertices, faces, and explicit
wireframe edges so additional screens can reuse the same renderer with a new
object.

### `src/vector3d/RotatingVectorObjectScreen.ts`

Initial classic demo-scene vector screen. It draws a starfield, perspective
floor, rotating flat-shaded mesh, and wireframe overlay inside the main visual
area.

Additional vector screens include:

- `BouncingVectorBallScreen`: checker sphere patches, floor grid, and animated
  shadow.
- `PatternMappedCubeScreen`: rotating cube with clipped per-face patterns.
- `MorphingVectorShapeScreen`: shared-topology point and wire morphs between
  sphere, cube, diamond, and star forms.
- `RotatingSqueeptyTextScreen`: extruded point-glyph 3D rendering of
  `SQUEEPTY`.

### `src/vector3d/Vector3DScreens.ts`

Factory for the vector screen list used by `DemoApp`. Register new standalone
3D screens here. `DemoApp` keeps the first rotation image-only, then distributes
these vector screens through the second rotation.

### `src/style.css`

Global app shell styling. It handles:

- Full-viewport body and `#app` layout.
- Pixel-scaled stage sizing.
- Canvas image-rendering settings.
- Debug overlay placement and typography.
- Start prompt overlay, panel, and animated sprite canvas layering.

CSS owns viewport fit and DOM overlays. Canvas content should not depend on CSS
pixel dimensions.

## Assets

### `src/assets/AssetLoader.ts`

Loads browser images for runtime public assets. It creates an `HTMLImageElement`
with async decoding, waits for the load/decode path, and returns an `ImageAsset`
using the caller-provided id and source URL.

`DemoApp` uses it for slideshow images. Failed images are caught by the caller
so one bad public file does not stop the demo from starting.

### `src/assets/ImageAsset.ts`

Defines the object returned by `AssetLoader`:

- `id`: logical asset id chosen by the caller.
- `src`: browser URL used to load the image.
- `image`: loaded `HTMLImageElement`.

### `src/assets/SplashImageGenerator.ts`

Generates built-in `320 x 160` slide canvases for the main visual area. These
slides make the demo self-contained and provide known-good inputs for every
effect.

Public types:

- `ImageEffectKind`: effect selector used by slides and `DemoApp`.
- `SplashImage`: `{ id, title, canvas, preferredEffect? }`.
- `SplashImageGenerator.coreIntroImageCount`: first four generated slides are
  treated as the intro set during interleaving.
- `SplashImageGenerator.createIntroSet()`: returns all generated slides.

Generated slides:

- Title splash.
- System splash.
- Retro sunset splash.
- Signal splash.
- Dither fade splash.
- Raster bars splash.
- Palette cycle splash.
- Venetian blinds splash.
- Plasma displacement splash.
- Checker reveal splash.
- Mosaic splash.
- Static image splash.
- CRT tube warp splash.

Some slides set `preferredEffect` so the slide demonstrates a specific effect
instead of using the normal rotating effect sequence.

## Effects

### `src/effects/Effect.ts`

Defines the shared effect interface:

```ts
export interface Effect {
  name: string;
  update(deltaTime: number, elapsedTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

Effects receive a source image at construction time. They own any cached pixel
data or phase counters they need. `DemoApp` replaces the active effect whenever
the slide changes.

### `src/effects/EffectManager.ts`

Stores one active effect and forwards `update()` and `render()` calls. It does
not decide transitions, effect order, or timing; `DemoApp` owns those choices.

### `src/effects/ImageEffectFrame.ts`

Shared helpers for effects that need offscreen canvas or pixel data:

- `createEffectCanvas(image)`: draws an image into a `320 x 160` canvas.
- `createEffectImageData(image)`: returns readable source pixels.
- `createZoomedEffectImageData(image, scale)`: crops and scales the image before
  reading pixels.
- `clamp(value, min, max)`: bounds a number.
- `wrap(value, size)`: wraps a number into a positive range.

Effects that mutate pixels should prefer these helpers so every effect samples
the same virtual region.

### `src/effects/CheckerRevealEffect.ts`

- Draws the full image, then covers unrevealed `16 x 16` tiles.
- Uses checker parity and tile position to reveal diagonally across the frame.
- Settles over about `1.25` seconds.

### `src/effects/DitherFadeEffect.ts`

- Reads source pixels once and writes into reusable `ImageData`.
- Uses a `4 x 4` Bayer matrix plus a small deterministic sparkle offset.
- Fades from a darkened version of the image into the source over about `1.45`
  seconds.

### `src/effects/MosaicEffect.ts`

- Samples one source pixel per block and draws it scaled up.
- Block size shrinks from large squares to `1` pixel over about `1.5` seconds.
- Keeps image smoothing disabled so the blocks stay crisp.

### `src/effects/PaletteCycleEffect.ts`

- Reads source pixels once and remaps luminance into an eight-color cycling
  palette.
- Blends palette color with original RGB values so image structure remains
  readable.
- Advances phase continuously during the slide.

### `src/effects/PlasmaDisplacementEffect.ts`

- Reads a slightly zoomed source image.
- Samples source pixels through sine-based X/Y displacement fields.
- Adds a time-varying glow per pixel.

### `src/effects/RasterBarsEffect.ts`

- Draws the source image, then overlays colored horizontal bars with `screen`
  blending.
- Adds dark scanline shading after the bars.
- Moves bars with a sine phase.

### `src/effects/StaticImageEffect.ts`

- Draws the source image into the main area without animation.
- Useful as the stable endpoint and as a fallback effect.

### `src/effects/CrtTubeWarpEffect.ts`

- Reads a slightly zoomed source image.
- Applies barrel-style CRT tube distortion, scanline brightness, horizontal
  jitter, glow, and RGB channel drift.
- Draws a subtle glass overlay after writing the warped pixels.

### `src/effects/VenetianBlindsEffect.ts`

- Draws the source image, covers vertical strips, and opens each strip from the
  center.
- Uses eased progress and slight per-strip staggering.
- Adds temporary strip highlights that fade out during the reveal.

### `src/effects/WaveImageEffect.ts`

- Redraws the image row by row with sine-based horizontal offsets.
- Uses horizontal overscan when drawing rows so gaps do not appear at the edges.
- Exposes `setImage()` for reuse, though `DemoApp` currently creates a new
  effect per slide.

## Scroller

### `src/scroller/BitmapFont.ts`

Defines the drawing contract used by `Scroller`:

- `glyphWidth`
- `glyphHeight`
- `drawText(ctx, text, x, y)`
- `measureText(text)`

The interface makes the scroller independent from a specific font
implementation.

### `src/scroller/PlaceholderFont.ts`

Current font implementation. It uses browser monospace text with fixed logical
glyph dimensions. This keeps the crawl predictable while leaving room for a
future bitmap font without changing `Scroller`.

### `src/scroller/Scroller.ts`

Owns the bottom text crawl in the `SCROLLER_Y` to `VIRTUAL_HEIGHT` band.

Behavior:

- Moves the message left at `48` virtual pixels per second.
- Starts from the right edge.
- Wraps after the full measured text has moved off-screen.
- Clears/fills the scroller band before drawing text.
- Resets to the right edge when `setMessage()` receives new text.

`DemoApp` refreshes the source message every `2` seconds and calls
`setMessage()` only when the normalized text changes.

## Main Demo Audio

### `src/audio/MusicRotator.ts`

Wraps an `HTMLAudioElement` for MP3 playback in the main route.

Public behavior:

- `setTracks(tracks)`: replaces the playlist and prepares the first track.
- `play()`: starts playback after user gesture; resumes the current track.
- `getCurrentTrackDebugLabel()`: returns a compact filename/time label for the
  debug overlay.

Runtime behavior:

- Tracks are preloaded through `audio.src`.
- `ended` advances to the next track.
- Failed playback or load errors are skipped when another track exists.
- The class remembers the current index across normal track changes.

`DemoApp` filters the audio manifest so only `.mp3` entries are passed here.

## Sprites

### `src/sprites/Sprite.ts`

Defines sprite contracts and the default animated sprite implementation.

Types:

- `Sprite`: update/render interface with position and dimensions.
- `SpriteImage`: canvas-backed image plus dimensions.
- `SpriteMotionState`: position, rotation, scale, and alpha returned by motion.
- `SpriteMotionInput`: index, total count, time, and sprite dimensions.
- `SpriteMotionPattern`: function from input to motion state.

`AnimatedSprite` asks its motion pattern for the current state each frame and
draws the sprite image centered at that state.

### `src/sprites/MotionPatterns.ts`

Reusable procedural motion functions:

- `sineMotion()`: one-dimensional sine helper.
- `createSineWavePattern()`: sprites travel across the screen in a wavy row.
- `createOrbitPattern()`: sprites orbit around the center of the main area.
- `createLissajousPattern()`: sprites trace crossed sine curves.
- `createSchoolPattern()`: sprites move in lanes with depth-like scaling.
- `createDepthStarfieldPattern()`: sprites radiate from center with depth-like
  scaling and alpha.

Patterns return absolute virtual coordinates in the main visual area. They do
not draw anything.

### `src/sprites/SpriteEffects.ts`

Builds named groups of `AnimatedSprite` instances:

- `Sprite Sine Wave`
- `Orbiting Sprites`
- `Lissajous Sprites`
- `Sprite School`
- `Depth Starfield`
- `Logo Formation`

Each group implements the `SpriteEffect` interface consumed by `SpriteSystem`.
The helper cycles through provided sprite images so a group can be created from
a small image set.

### `src/sprites/SpriteImageGenerator.ts`

Creates canvas-backed sprite art at runtime.

Main demo images:

- Yellow star.
- Cyan gem.
- Lime orb.
- Pink bolt.

Secret trigger images:

- Mystery-note sprite.

Every returned `SpriteImage` includes an id, canvas, width, and height. The
generator disables image smoothing on each temporary context.

### `src/sprites/SpriteSystem.ts`

Manages sprite rendering for the main demo.

Modes:

- If named `SpriteEffect` groups are set, the system runs one active group at a
  time.
- If no groups are set, it falls back to individually added `Sprite` objects.

The active effect changes every `10` seconds. Rendering is clipped to the main
`320 x 160` visual area so sprites never draw over the scroller. The first
cycle is limited by the `initialEffectCount` passed from `DemoApp`; after that
the full sprite effect list is available.

### `src/sprites/SecretTrackerTriggerSprite.ts`

Hidden route trigger used by the main demo.

Behavior:

- Disabled by default.
- `DemoApp.setActiveSlide()` enables it only when the fourth screen is shown.
- While enabled, it floats near the lower-right of the main area.
- Rendering uses `lighter` blending and a small circular beacon.
- `containsPoint(x, y)` uses a padded hit box and rejects points in the
  scroller band.

Click handling stays in `DemoApp`; the sprite only reports whether a virtual
point is inside its current hit area.

## Secret Tracker Route

The secret tracker is documented in more depth in
[secret-tracker.md](secret-tracker.md). This section maps the source files to
their responsibilities.

### `src/secret-tracker/SecretTrackerPage.ts`

Top-level coordinator for the `/tracker` route. It owns the tracker renderer,
MOD parser, Web Audio player, visualizer deck, lissajous sprite overlay,
catalog state, playback cursor, selected backdrop, canvas UI hit boxes, and
keyboard input.

Startup responsibilities:

- Attach pointer input to the tracker canvas.
- Attach keyboard input to `window`.
- Load MOD catalog entries from `/audio/manifest.json`.
- Load backdrop candidates from `/images/manifest.json`.
- Select and load a random backdrop image.
- Load the default MOD, preferring a title or filename matching `Intro Tune`.
- Attempt playback and render every animation frame.

Canvas UI areas:

- Header and current song title.
- Three-row MOD file picker.
- Previous, play/pause, stop, next, volume down, and volume up buttons.
- Status panel with position, pattern, row, BPM, speed, and status message.
- Four-channel pattern data view.
- Multi-mode visualizer panel.
- Secret-room intro message overlay.

Input behavior:

- Pointer hit boxes drive transport, file selection, and visualizer mode
  selection.
- Space toggles playback.
- Up/Down move the highlighted file.
- Enter loads and plays the highlighted file.

The page renders all UI directly into the canvas using small helper functions
for panels, text, buttons, clipping, and virtual-coordinate hit tests.

### `src/secret-tracker/data/modCatalog.ts`

Loads the tracker catalog from `/audio/manifest.json`.

Supported manifest shapes:

- Array of strings or objects.
- Object with `mods`, `files`, or `tracks` arrays.

Supported entries:

- String file path.
- Object with `file` and optional `title`.

Only `.mod` entries are kept. Duplicate file paths are ignored after the first
occurrence. Missing titles are derived from filenames by removing `.mod` and
replacing dashes/underscores with spaces.

### `src/secret-tracker/core/ModTypes.ts`

Typed representation of parsed MOD data:

- `ModSong`: title, samples, order table, signature, channel count, patterns,
  and sample data.
- `ModSample`: sample header fields including length, finetune, volume, and
  loop points.
- `ModPattern`: pattern index and rows.
- `ModRow`: row index and channel events.
- `ModEvent`: period, note name, sample number, effect command, and parameter.

These types are shared by the parser, player, and pattern display.

### `src/secret-tracker/core/ModParser.ts`

Parses ProTracker-like MOD files from an `ArrayBuffer`.

Parser behavior:

- Validates that the buffer is large enough for a classic MOD header.
- Reads the 20-byte title.
- Reads 31 sample headers.
- Reads song length, restart position, order table, and signature.
- Maps known signatures to channel counts.
- Parses `64` rows per pattern.
- Decodes four-byte channel events into periods, samples, and effects.
- Reads signed 8-bit sample data after pattern data.

Recognized channel signatures include `M.K.`, `M!K!`, `M&K!`, `N.T.`, `4CHN`,
`6CHN`, and `8CHN`. Unknown signatures fall back to four channels.

### `src/secret-tracker/core/NotePeriodTable.ts`

Maps Amiga period values to display note names. The parser calls
`noteNameFromPeriod(period)` while decoding events so the UI can display values
such as `C-3` instead of raw periods.

### `src/secret-tracker/audio/SimpleModPlayer.ts`

Compact Web Audio MOD player used by the tracker route.

Public surface:

- `setStateListener(listener)`: lets `SecretTrackerPage` receive cursor and
  play-state updates.
- `load(song)`: stops current playback, converts samples to audio buffers, and
  resets playback state.
- `play()`: resumes/creates the `AudioContext`, processes the current row, and
  starts tick scheduling.
- `pause()`: stops timers and active sources while preserving position.
- `stop()`: pauses and resets position/channel state.
- `setVolume(volume)`: clamps master volume from `0` to `1`.
- `getState()`: returns order, row, speed, BPM, and playing flag.
- `getAudioAnalysisFrame()`: fills waveform and frequency arrays from the
  analyser for visualizers.

Playback model:

- Converts signed 8-bit samples into mono `AudioBuffer` objects.
- Uses one-shot `AudioBufferSourceNode` instances for triggered notes.
- Tracks current sample and volume per channel.
- Calculates playback rate from Amiga period values using PAL clock math.
- Supports sample loop offsets and lengths.
- Advances with `setTimeout()` ticks derived from BPM.

Supported effects:

- `0A`: volume slide on ticks after the row trigger.
- `0B`: position jump.
- `0C`: set channel volume.
- `0D`: pattern break.
- `0F`: set speed for values `1..32`, BPM for larger values.

The implementation is deliberately compact. It is useful for demo playback and
visualization, but it is not a complete MOD compatibility layer.

### `src/secret-tracker/visualizers/TrackerVisualizer.ts`

Defines the visualizer contract:

- `VisualizerRect`: drawing rectangle.
- `VisualizerFrame`: analysis data, elapsed time, and play state.
- `TrackerVisualizer`: `name` plus `render(ctx, rect, frame)`.

Visualizers should draw only inside the provided rectangle.

### `src/secret-tracker/visualizers/VisualizerDeck.ts`

Owns the available tracker visualizer modes:

- `ScopeVisualizer`
- `SpectrumBarsVisualizer`
- `VuColumnsVisualizer`
- `RasterPulseVisualizer`

It tracks the active index, exposes active names for the UI, supports direct
selection, and renders with a fallback silent analysis frame when player
analysis is unavailable.

### `src/secret-tracker/visualizers/ScopeVisualizer.ts`

Draws an oscilloscope. It samples the analyser waveform across the available
width, draws a grid, plots the centered waveform line, and marks the center
axis.

### `src/secret-tracker/visualizers/SpectrumBarsVisualizer.ts`

Draws `32` frequency bars. It samples the analyser frequency array, maps values
to bar heights, and changes color as energy rises.

### `src/secret-tracker/visualizers/VuColumnsVisualizer.ts`

Draws four smoothed VU-style columns. It combines waveform RMS and frequency
band energy, then uses faster attack and slower release coefficients for
readable motion.

### `src/secret-tracker/visualizers/RasterPulseVisualizer.ts`

Draws horizontal raster bars driven by average frequency energy. When music is
playing, elapsed time advances the phase faster and energy widens/offsets the
bars.

### `src/secret-tracker/LissajousSpriteOverlay.ts`

Adds decorative tracker overlay sprites using generated sprite canvases and
lissajous-style motion. It is visual only and does not affect input, audio, or
the player state.
