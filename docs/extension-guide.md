# Extension Guide

This guide documents the normal ways to extend the project without changing the
overall architecture.

## Add A Slideshow Image

1. Add a browser-friendly image file to `public/images/`.
2. Add the filename to `public/images/manifest.json`.
3. Run the demo and confirm the image appears in the slideshow.

Images are normalized to the `320 x 160` main area at runtime. Wide or tall
images are center-cropped. New public images participate in the image-only
first rotation and in the repeated second rotation that also contains vector
screens.

## Add An MP3 Track

1. Add the `.mp3` file to `public/audio/demo/`.
2. Add an entry to the `tracks` array in `public/audio/manifest.json`.

Example:

```json
{
  "file": "demo/My_Track.mp3",
  "title": "My Track"
}
```

The main demo will include the track in the music rotation.

## Add A Tracker MOD

1. Add the `.mod` file to `public/audio/tracker/`.
2. Add an entry to the `mods` array in `public/audio/manifest.json`.

Example:

```json
{
  "file": "tracker/My_Module.mod",
  "title": "My Module"
}
```

Keep `Anarchy Menu 01`, `BeachHead 2`, and `Intro Tune` first if the UI should
preserve the original three-entry order.

## Change The Scroller

Edit:

```text
public/text/scroller-message.txt
```

The running dev server will serve the file immediately, and `DemoApp` refreshes
the scroller text every `2` seconds. A full rebuild is not required for text
edits during development.

## Add A New Image Effect

1. Create a file in `src/effects/`.
2. Implement the `Effect` interface.
3. Add a new `ImageEffectKind` value in `SplashImageGenerator.ts` if the effect
   should be selectable by generated slides.
4. Add the effect to `DemoApp.firstCycleEffectSequence` or
   `DemoApp.fullEffectSequence` if it should appear in the normal image effect
   rotation.
5. Add a branch in `DemoApp.createImageEffect()`.

Use the helpers in `ImageEffectFrame.ts` when the effect needs pixel data.

## Add A Generated Splash Image

1. Add a new private creator method in `SplashImageGenerator`.
2. Return a `SplashImage` with `id`, `title`, `canvas`, and optionally
   `preferredEffect`.
3. Include it in `createIntroSet()`.

Generated splash images are useful for testing effects without depending on
external assets.

## Add A Sprite Effect

1. Add or reuse a motion pattern in `MotionPatterns.ts`.
2. Add a named effect in `SpriteEffects.ts`.
3. Include it in the array returned by `createIntroSpriteEffects()`.

`SpriteSystem` will cycle through the effect automatically.

## Add A Realtime 3D Vector Screen

1. Create a screen class in `src/vector3d/`.
2. Implement the `Vector3DScreen` interface.
3. Add any reusable mesh or math helpers beside the existing vector files.
4. Register the screen in `createIntroVector3DScreens()` in
   `src/vector3d/Vector3DScreens.ts`.

Vector screens are standalone main-area screens. The first demo rotation keeps
the image sequence unchanged; vector screens are distributed through the second
rotation by `DemoApp.createScreenSequence()`.

## Add A Tracker Visualizer

1. Create a visualizer class in `src/secret-tracker/visualizers/`.
2. Implement `TrackerVisualizer`.
3. Add it to the `visualizers` array in `VisualizerDeck`.
4. Add a matching button definition in `SecretTrackerPage` if users need to
   select it directly.

Keep the visualizer inside the rectangle passed to `render()`.

## Add A MOD Player Effect

`SimpleModPlayer.applyRowEffect()` and `applyTickEffects()` are the central
places for playback effects. Add new effect handling there when extending MOD
support.

Keep in mind that many ProTracker effects have tick-level behavior, row-level
behavior, or both. Update the pattern display only if the parsed event shape
needs to change.

## Before Committing Changes

Run:

```sh
npm run build
```

Also test the app in the browser:

- `/` for the main demo.
- `/tracker` for the MOD tracker.

Check the console for asset load warnings after manifest changes.
