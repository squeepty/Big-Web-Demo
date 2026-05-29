Image assets in this folder are loaded by `manifest.json`.

Add new browser-friendly image files here, then add each filename to the
manifest's `files` array. The demo crops or scales them into the 320 x 160 main
effect area and interleaves them with generated splash images. The first
rotation stays image-only; the second rotation repeats the image sequence with
standalone 3D vector screens distributed through it.

The secret tracker also reads this manifest for random 320 x 200 backdrops. It
uses browser-friendly still image formats for that backdrop pass.
