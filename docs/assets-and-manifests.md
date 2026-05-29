# Assets And Manifests

This project uses browser-served assets from `public/`. Vite serves files in
that directory from the web root during development and from the built site in
production.

## Image Assets

Images live in:

```text
public/images/
```

The image manifest is:

```text
public/images/manifest.json
```

Current manifest shape:

```json
{
  "files": [
    "Example.png",
    "Example.gif"
  ]
}
```

`DemoApp` loads these images for the first slideshow rotation and the repeated
second rotation that also contains vector screens. Each public image is
normalized into a `320 x 160` canvas:

- If the image is already `320` pixels wide and at least `160` pixels tall, the
  top `320 x 160` area is copied directly.
- Otherwise the image is center-cropped to match the `2:1` main-area ratio and
  drawn into the main-area canvas.

`SecretTrackerPage` also reads the image manifest and uses compatible image
files as random faded backdrops.

The tracker backdrop loader currently accepts:

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`

The main image loader relies on browser image support and can load animated GIFs
as normal image elements. Generated effect canvases capture the loaded image
frame as canvas content.

## Audio Assets

Audio lives in:

```text
public/audio/
```

The audio manifest is:

```text
public/audio/manifest.json
```

Current manifest shape:

```json
{
  "mods": [
    {
      "file": "tracker/IntroTune_Matthew_Simmonds.mod",
      "title": "Intro Tune"
    }
  ],
  "tracks": [
    {
      "file": "demo/GoldRunner_Rob_Hubbard.mp3",
      "title": "GoldRunner - Rob Hubbard"
    }
  ]
}
```

## MP3 Tracks

MP3 files used by the main demo live in:

```text
public/audio/demo/
```

`DemoApp` reads only MP3 entries from the `tracks` or `files` section of the
manifest. String entries are allowed, but object entries are preferred because
they can provide a display title.

Paths are relative to `public/audio/`, so this manifest entry:

```json
{
  "file": "demo/Station13_Remix_Squeepty.mp3",
  "title": "Station 13 Remix - Squeepty"
}
```

loads from:

```text
/audio/demo/Station13_Remix_Squeepty.mp3
```

## MOD Tracks

MOD files used by the secret tracker live in:

```text
public/audio/tracker/
```

`loadModCatalog()` reads the manifest sections in this order:

1. `mods`
2. `files`
3. `tracks`

It keeps only `.mod` entries and removes duplicate file paths. This lets the
same manifest carry both main-demo MP3 tracks and secret-tracker MOD tracks.

The first three tracker entries should remain first in the manifest to preserve
the intended UI order:

1. `Anarchy Menu 01`
2. `BeachHead 2`
3. `Intro Tune`

After those, additional tracker files can be ordered however the desired UI
list should appear. The current convention is filename order for newly added
MODs.

## Tracker Picker Title Shortening

The tracker file picker displays only three rows and has limited horizontal
space. Long titles use this shortening convention:

```text
first 8 characters + "~" + last 3 characters
```

Example:

```text
ANARCHY MENU 10 -> ANARCHY ~ 10
```

This keeps files with the same prefix distinguishable in the tracker UI.

## Scroller Text

The scroller message lives in:

```text
public/text/scroller-message.txt
```

`DemoApp` fetches it on startup and refreshes it every `2` seconds while the
demo runs. Whitespace is normalized to single spaces. Empty or missing content
falls back to a built-in default message.

## Generated And Procedural Screens

Generated splash images, sprite art, and realtime vector screens are not listed
in public manifests. They are created from TypeScript at runtime:

- Generated slides live in `src/assets/SplashImageGenerator.ts`.
- Sprite canvases live in `src/sprites/SpriteImageGenerator.ts`.
- Realtime 3D vector screens live in `src/vector3d/`.

Public manifests only describe external media loaded through browser URLs.

## Updating Manifests

When adding or removing public assets:

1. Put the asset file in the correct `public/` subfolder.
2. Add or remove the entry in the matching manifest.
3. Keep file paths relative to the manifest's served folder.
4. Run `npm run build` to catch JSON or TypeScript regressions.

Manifest files are runtime data, so Vite does not import them through the
TypeScript module graph. Bad paths usually show up as load warnings in the
browser rather than TypeScript errors.
