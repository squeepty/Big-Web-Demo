# Big Web Demo Project Layout

This project starts as a Vite + TypeScript + Canvas 2D demo shell.

```text
public/
  images/   Browser-served slideshow images
  audio/    Future tracker-style music assets
  text/     Easy-to-edit scroller and copy files

src/
  assets/   Asset loading and typed image handles
  audio/    Future WebAudio tracker/synth pieces
  effects/  Pluggable visual effects for the main 320x160 area
  scroller/ Bottom text scroller and bitmap font code
  sprites/  Future sprite model, renderer, and motion formulas
```

The engine renders into a fixed `320 x 200` logical screen. Browser scaling happens outside the demo coordinate system so every effect can be written against the same retro-sized canvas.
