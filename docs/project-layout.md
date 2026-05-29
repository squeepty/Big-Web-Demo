# Project Layout

The Big (Web) Demo is a Vite + TypeScript application with a small Canvas 2D
engine, runtime-loaded public assets, MP3 playback for the main demo, and a
set of standalone image, sprite, scroller, and realtime 3D vector demo systems.
It also includes a separate secret MOD tracker route.

## Top Level

```text
.
  index.html              Vite HTML shell with the #app mount node
  package.json            npm scripts and development dependencies
  tsconfig.json           TypeScript compiler settings
  vite.config.ts          Vite configuration
  README.md               Project overview and quick start
  docs/                   Detailed architecture and component documentation
  public/                 Browser-served assets
  src/                    TypeScript application source
```

## Public Assets

```text
public/
  audio/
    manifest.json         MP3 and MOD catalog
    demo/                 MP3 tracks used by the main demo music rotator
    tracker/              MOD files used by the secret tracker
  images/
    manifest.json         Slideshow image catalog
    README.md             Short image asset instructions
    *.png, *.gif          Browser-served slideshow and tracker backdrop images
  text/
    scroller-message.txt  Runtime-editable scroller text
```

Everything under `public/` is served from the web root. For example,
`public/images/manifest.json` is fetched as `/images/manifest.json`, and
`public/audio/tracker/IntroTune_Matthew_Simmonds.mod` is fetched as
`/audio/tracker/IntroTune_Matthew_Simmonds.mod`.

## Source Tree

```text
src/
  main.ts                 Route selection and app bootstrap
  DemoApp.ts              Main demo coordinator
  Renderer.ts             Fixed-size canvas and stage owner
  Time.ts                 Delta and elapsed time helper
  PerformanceMonitor.ts   Debug overlay
  constants.ts            Shared virtual-screen constants
  style.css               Stage, canvas, overlay, and start prompt CSS

  assets/                 Runtime image loading and generated splash images
  audio/                  Main-demo MP3 music rotation
  effects/                Pluggable image effects for the 320 x 160 area
  scroller/               Bottom text scroller and font contract
  sprites/                Sprite models, generated sprite art, and motion
  vector3d/               Standalone realtime 3D vector demo screens
  secret-tracker/         Secret MOD tracker route, parser, player, and UI
```

## Runtime Routes

`src/main.ts` chooses between two experiences:

- `/` starts `DemoApp`.
- `/tracker`, `/secret/tracker`, or `#tracker` starts `SecretTrackerPage`.

Both routes use the same `Renderer` class and therefore share the same fixed
`320 x 200` canvas model, but they have separate update/render loops and
different asset responsibilities.

## Coordinate System

The shared virtual screen is defined in `src/constants.ts`:

```text
VIRTUAL_WIDTH       320
VIRTUAL_HEIGHT      200
MAIN_AREA_Y           0
MAIN_AREA_HEIGHT    160
SCROLLER_Y          160
SCROLLER_HEIGHT      40
TARGET_FPS           60
```

CSS in `src/style.css` scales the canvas to fit the viewport while preserving a
`1.6` aspect ratio. Rendering code should always use virtual coordinates, not
CSS pixel dimensions.
