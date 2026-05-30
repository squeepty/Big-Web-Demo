# The Big (Web) Demo

The Big (Web) Demo is a browser-based retro demo engine built with TypeScript, Vite,
Canvas 2D, Web Audio, and browser-served media assets. It renders into a fixed
`320 x 200` virtual screen and lets CSS scale that screen with crisp pixel
edges.

The project is inspired by 1980s and early 1990s demo, cracktro, intro, and
slideshow culture, especially the visual language of Atari ST, Amiga, and C64
productions. It is not a hardware emulator. It is a readable learning project
that recreates the feeling of a classic demo while keeping each subsystem small
enough to inspect and modify.

## Current Features

- Fixed `320 x 200` Canvas 2D stage with pixelated browser scaling.
- Main demo route at `/`.
- Secret MOD tracker route at `/tracker`, `/secret/tracker`, or `#tracker`.
- Start overlay that requires pointer or keyboard input before audio starts.
- Generated intro splash images mixed with public slideshow images.
- Image effects: dither fade, raster bars, palette cycle, venetian blinds,
  plasma displacement, horizontal wave, checker reveal, mosaic, CRT tube warp,
  and static.
- Realtime 3D vector screens with flat-shaded meshes, bouncing ball, patterned
  cube, morphing shapes, rotating 3D text, and wireframe edges.
- Sprite effects with sine, orbit, lissajous, and schooling motion patterns.
- A hidden tracker trigger sprite that appears during the demo and opens the
  tracker when clicked.
- Bottom scroller driven by `public/text/scroller-message.txt`, refreshed while
  the app runs.
- MP3 demo music rotation from `public/audio/demo/`.
- A secret ProTracker-style MOD player and visualizer using files from
  `public/audio/tracker/`.
- Debug overlay for FPS, frame time, active image, effect, vector screen, sprite
  pattern, and music state. Press `D` after entering the demo to toggle it.

## Screen Model

The engine deliberately keeps a small retro coordinate system:

```text
Virtual screen: 320 x 200
Main visual area: 320 x 160
Scroller area: 320 x 40
```

All effects, sprites, tracker panels, and hit tests work in this logical
coordinate system. The browser only scales the finished canvas.

The main route preserves its original image slideshow as the first full
rotation. Realtime 3D vector screens are mixed into the second rotation, so the
classic slideshow opens the demo before the extra vector showcase appears.

## Running Locally

Install dependencies:

```sh
npm install
```

Start the Vite dev server:

```sh
npm run dev
```

Open the main demo:

```text
http://127.0.0.1:5173/Big-Web-Demo/
```

Open the secret tracker directly:

```text
http://127.0.0.1:5173/Big-Web-Demo/#tracker
```

Build the project:

```sh
npm run build
```

Build from a clean output directory:

```sh
npm run cleanbuild
```

The demo scroller fetches `/text/scroller-message.txt`. In local dev and
preview, that route is served directly from `public/text/scroller-message.txt`
with no-store cache headers, so the text rendered by the demo is the file you
edit. Production builds also copy that source file into
`dist/text/scroller-message.txt` after bundling, keeping the public text file as
the source of truth.

## Deploying To GitHub Pages

The project is configured for the repository Pages URL:

```text
https://squeepty.github.io/Big-Web-Demo/
```

Deployment uses the workflow in `.github/workflows/deploy.yml`. In GitHub, open
the repository settings, go to **Pages**, and set **Build and deployment** →
**Source** to **GitHub Actions**. After that, pushes to `main` will build the
Vite app and publish `dist/` to GitHub Pages.

## Assets

Public assets live under `public/` and are loaded by fetch or browser media
elements at runtime.

- Slideshow images: `public/images/`
- Image manifest: `public/images/manifest.json`
- Demo MP3 files: `public/audio/demo/`
- Tracker MOD files: `public/audio/tracker/`
- Audio manifest: `public/audio/manifest.json`
- Scroller message: `public/text/scroller-message.txt`

The current audio manifest has two independent sections:

- `tracks` for MP3 music used by the main demo.
- `mods` for MOD files used by the secret tracker.

The tracker file list keeps the original three MOD entries first in UI order:
`Anarchy Menu 01`, `BeachHead 2`, and `Intro Tune`. Longer tracker names are
shortened in the picker as `first 8 characters + "~" + last 3 characters` so
same-prefix files remain distinguishable.

## Documentation

The `docs/` folder contains the detailed project notes:

- [Project layout](docs/project-layout.md)
- [Runtime flow](docs/runtime-flow.md)
- [Component guide](docs/components.md)
- [Assets and manifests](docs/assets-and-manifests.md)
- [Secret tracker](docs/secret-tracker.md)
- [Extension guide](docs/extension-guide.md)

## Credits And Media Notes

This project includes borrowed or historically inspired media for educational
and homage purposes. Keep credits visible in the README, docs, and scrolling
text whenever assets change.

Current public slideshow images are listed in `public/images/manifest.json`.
Current demo music files are listed in `public/audio/manifest.json`. For
redistribution outside private study, replace borrowed placeholder material
with properly licensed assets or add complete source, author, license, and
permission details.

## Learning Goals

The Big (Web) Demo is meant to teach real-time graphics and interactive media through
a concrete, inspectable codebase. Useful topics include:

- Building an animation loop with `requestAnimationFrame`.
- Separating logical resolution from display scaling.
- Managing delta time and elapsed time.
- Loading browser-served image, text, and audio assets.
- Composing effects through a small interface.
- Projecting and drawing realtime 3D vector meshes on a 2D canvas.
- Building standalone demo screens that share one timed sequence.
- Cropping and normalizing images for a fixed render area.
- Drawing sprite and scroller layers over image effects.
- Working with browser audio autoplay restrictions.
- Parsing and playing a subset of ProTracker MOD data in Web Audio.
- Designing small systems that can be extended without rewriting the app.
