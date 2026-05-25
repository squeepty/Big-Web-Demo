# Big Web Demo

Big Web Demo is a browser-based retro demo engine built with TypeScript, Vite, Canvas 2D, and a small audio layer. It renders into a fixed 320 by 200 virtual screen, then lets the browser scale that screen with crisp pixel edges.

The project is inspired by the 1980s and early 1990s demo, cracktro, intro, and slideshow scene, especially the visual language of Atari ST, Amiga, and C64 productions. It is not a hardware emulator. It is a readable, expandable learning project that recreates the feeling of a classic demo while keeping the code approachable for modern web development.

## Nostalgia

The nostalgic goal is to capture the mood of old computer demos: low-resolution graphics, bold image transitions, sine waves, palette tricks, raster bars, sprite overlays, scrolling text, and music that starts once the browser allows user interaction.

The editable scroller text is part of that nostalgia, not just a UI flourish. `public/text/scroller-message.txt` acts like an old-school greetings and credits crawl: it names the demo-scene inspiration, gives respect to classic groups and artists, explains the educational goal, and calls out borrowed image and music sources while the demo is running.

The demo uses a deliberately constrained screen model:

- Virtual resolution: `320 x 200`
- Main visual area: `320 x 160`
- Bottom scroller: `320 x 40`
- Pixelated canvas scaling
- Asset-driven slideshow images from `public/images`
- Editable scroller text from `public/text/scroller-message.txt`

Those constraints are part of the design. They make the project feel like a tiny machine with clear limits, which is where many classic demo effects get their charm.

## Credits And Borrowed Media

This project includes borrowed or historically inspired media for educational and homage purposes. Keep credits visible both here and in the scrolling text whenever assets change.

Current image credits:

- Several base demo images come from sources referenced through the Democyclopedia preservation ecosystem.
- The project is grateful to the people and sites preserving demo-scene history, screenshots, productions, and context.
- Public slideshow images are loaded from `public/images/manifest.json`.

Current music credits:

- The included demo music file is `public/audio/GoldRunner.mp3`.
- The scroller credits the inspiration to the Atari ST game `GoldRunner`.
- The composition is credited in the scroller to Rob Hubbard.
- Public music tracks are loaded from `public/audio/manifest.json`.

For redistribution outside private study, replace borrowed placeholder material with properly licensed assets or add complete source, author, license, and permission details.

## Academic Learning Goal

This project is meant to teach real-time graphics and interactive media through a concrete, inspectable engine. The code favors clear module boundaries and visible systems over hidden framework behavior.

Useful learning topics include:

- Building a browser animation loop with `requestAnimationFrame`
- Separating logical resolution from display scaling
- Managing frame timing with delta time and elapsed time
- Composing visual effects through a shared effect interface
- Loading browser-served image, text, and audio assets
- Drawing bitmap-style text scrollers
- Cropping and normalizing images into a fixed render area
- Layering effects, sprites, scroller text, and performance overlays
- Understanding browser audio autoplay restrictions
- Designing small systems that can be extended without rewriting the app

The academic aim is not only to produce a cool retro screen. It is to make each subsystem simple enough that a student can open a file, understand its responsibility, and modify it without needing to understand the whole engine at once.

## Engine Structure

The application starts in `src/main.ts`, mounts the app into `#app`, and creates a `DemoApp`.

`DemoApp` is the top-level coordinator. It initializes rendering, loads public assets, creates generated intro images and sprites, starts the animation loop, rotates slideshow effects, refreshes the scroller message, and connects the music rotator to browser input.

`Renderer` owns the Canvas 2D surface. It creates the stage, keeps the canvas at the fixed virtual resolution, disables smoothing, and exposes the rendering context used by the rest of the engine.

`Time` calculates frame timing. Effects receive both `deltaTime` and `elapsedTime`, so animation can be based on time instead of frame count.

`PerformanceMonitor` displays runtime status such as FPS, active image, effect, sprite pattern, and music track. Press `D` while the app is running to toggle the debug overlay.

`effects/` contains the pluggable visual effect system. Each effect implements:

```ts
export interface Effect {
  name: string;
  update(deltaTime: number, elapsedTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

`EffectManager` holds the active effect and delegates update/render calls. Current image effects include wave distortion, dither fade, raster bars, palette cycling, venetian blinds, plasma displacement, checker reveal, mosaic, and static image display.

`scroller/` contains the bottom text scroller and bitmap font contract. The current scroller message is loaded from `public/text/scroller-message.txt` and periodically refreshed while the app runs. This makes the scroller useful for live greetings, learning notes, credits, and attribution updates without rebuilding the app.

`sprites/` contains sprite models, generated sprite images, motion patterns, and timed sprite effects. The sprite system clips its drawing to the main visual area so it can layer over the current image effect without touching the scroller.

`assets/` contains image loading and generated splash image helpers. Public images are listed through `public/images/manifest.json`, then normalized into the 320 by 160 main area.

`audio/` contains a simple music rotator and future tracker-style audio pieces. MP3 tracks are listed in `public/audio/manifest.json`. Playback begins after pointer or keyboard interaction when browser policy allows it.

## Project Layout

```text
public/
  audio/    Browser-served audio files and manifest
  images/   Browser-served slideshow images and manifest
  text/     Editable scroller message

src/
  assets/   Asset loading and generated splash images
  audio/    Music rotation and experimental synth/tracker pieces
  effects/  Pluggable 320 x 160 visual effects
  scroller/ Bottom text scroller and bitmap font code
  sprites/  Sprite models, renderers, generators, and motion formulas
```

## Running Locally

Install dependencies:

```sh
npm install
```

Start the Vite dev server:

```sh
npm run dev
```

Build the project:

```sh
npm run build
```

## Extending The Demo

To add a new image effect, create a class in `src/effects/` that implements `Effect`, then add it to the effect sequence in `DemoApp`.

To change the scrolling text, edit:

```text
public/text/scroller-message.txt
```

To add slideshow images, place files in `public/images/` and list them in:

```text
public/images/manifest.json
```

To add music, place MP3 files in `public/audio/` and list them in:

```text
public/audio/manifest.json
```
