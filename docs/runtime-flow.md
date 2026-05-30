# Runtime Flow

This document describes what happens when the app starts, how each frame is
processed, and how the two routes differ.

## Bootstrap

`src/main.ts` imports global CSS, finds `#app`, and chooses a route.

- Main demo route: creates `DemoApp` and calls `start()`.
- Secret tracker route: creates `SecretTrackerPage` and calls `start()`.

The route check accepts:

- `/tracker`
- `/secret/tracker`
- `#tracker`

Everything else opens the main demo.

## Main Demo Startup

`DemoApp.start()` loads three groups of runtime data in parallel:

- Scroller text from `/text/scroller-message.txt`.
- Public images from `/images/manifest.json`.
- MP3 tracks from `/audio/manifest.json`.

After loading, it:

- Builds the image screen sequence from generated splash images and public
  images.
- Appends a second rotation where realtime 3D vector screens are distributed
  through the repeated image sequence.
- Picks a random public image as the start-overlay backdrop.
- Passes MP3 tracks to `MusicRotator`.
- Creates the bottom `Scroller`.
- Sets the first active screen and image effect.
- Hides the debug overlay.
- Shows the start prompt.

The start prompt exists because browser audio usually needs a user gesture.
Pointer down, Enter, or Space starts the demo.

## Main Demo Frame Loop

After the user enters, `DemoApp` starts a `requestAnimationFrame` loop.

Each frame:

1. `Time.tick()` computes clamped `deltaTime` and accumulated `elapsedTime`.
2. `DemoApp.update()` advances screen timing, updates either the active image
   effect or the active vector screen, then advances sprite motion, the secret
   tracker trigger sprite, music/debug labels, scroller text, and FPS sampling.
3. `DemoApp.render()` clears the canvas, renders either the active image effect
   or the active vector screen, draws sprites and the secret trigger sprite,
   then draws the scroller.

Image screens change every `5` seconds, while vector 3D screens stay active for
`15` seconds. The first rotation contains the original image sequence unchanged.
The second rotation repeats the image sequence with vector screens distributed
through it. The active sprite effect changes inside `SpriteSystem` every `10`
seconds.

## Start Prompt Animation

Before the main loop starts, the start overlay runs its own small animation on a
separate canvas. `DemoApp` creates a set of generated sprite images and moves
them with a lightweight repulsion and orbiting-home behavior.

This animation stops when the user enters the demo. It does not share the main
demo `Time` helper.

## Main Demo Input

After the demo starts:

- Any key or pointer input attempts to start MP3 playback if it has not started.
- `D` toggles the debug overlay.
- Clicking the enabled secret tracker trigger sprite navigates to `/tracker`.

The hidden trigger is enabled on the fourth active screen. Its hit test is done
in virtual canvas coordinates.

## Scroller Refresh

The scroller message is loaded from `public/text/scroller-message.txt` during
page setup, loaded again immediately when the user enters the demo, and then
refreshed every `2` seconds while the demo runs. The fetch uses `cache:
no-store` plus a timestamp query so local edits can appear without a rebuild.

Whitespace is normalized to single spaces. If the file is empty or cannot be
loaded, the app falls back to a built-in message.

## MP3 Music Flow

`DemoApp` reads the `tracks` section of `public/audio/manifest.json`. Each MP3
entry becomes a `MusicTrack` with:

- `src`: browser URL under `/audio/`.
- `title`: manifest title or a title derived from the filename.
- `file`: original manifest path for debug display.

`MusicRotator` loads the current track, calls `HTMLAudioElement.play()` after
user input, moves to the next track on `ended`, and skips failed tracks when
possible.

## Secret Tracker Startup

`SecretTrackerPage.start()` loads:

- MOD catalog entries from `/audio/manifest.json`.
- Backdrop image names from `/images/manifest.json`.

Then it chooses a random backdrop image, loads the default song, attempts to
start playback, and starts its own `requestAnimationFrame` render loop.

The default song is the entry titled `Intro Tune` when available; otherwise it
uses the first MOD entry.

## Secret Tracker Frame Loop

The tracker loop calculates delta time locally, accumulates elapsed time, and
renders a complete tracker screen every frame.

Rendered areas include:

- Faded image backdrop.
- Header with song title.
- Three-row MOD file picker.
- Transport and volume controls.
- Playback status panel.
- Pattern data view for four channels.
- Audio visualizer panel.
- Lissajous sprite overlay.
- Short secret-room intro message.

Audio timing is managed by `SimpleModPlayer` with timer ticks, not by the
tracker render loop.
