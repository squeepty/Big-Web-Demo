import type { ImageAsset } from './ImageAsset';

export class AssetLoader {
  async loadImage(id: string, src: string): Promise<ImageAsset> {
    const image = new Image();
    image.decoding = 'async';

    await new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => reject(new Error(`Could not load image: ${src}`)), {
        once: true,
      });
      image.src = src;
    });

    return { id, image };
  }
}
